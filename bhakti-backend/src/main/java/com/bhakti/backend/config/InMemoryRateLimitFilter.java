package com.bhakti.backend.config;

import com.bhakti.backend.dto.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class InMemoryRateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(InMemoryRateLimitFilter.class);
    private static final String DREAM_INTERPRET_PATH = "/api/v1/dream/interpret";

    private final RateLimitProperties properties;
    private final ObjectMapper objectMapper;
    private final Map<String, RequestWindow> windows = new ConcurrentHashMap<>();

    public InMemoryRateLimitFilter(RateLimitProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !properties.enabled() || !DREAM_INTERPRET_PATH.equals(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        long now = System.currentTimeMillis();
        cleanupExpiredWindows(now);

        String clientKey = resolveClientKey(request);
        RequestWindow window = windows.compute(clientKey, (key, existing) -> {
            if (existing == null || now >= existing.expiresAt) {
                return new RequestWindow(now + properties.windowMs(), 1);
            }

            existing.count++;
            return existing;
        });

        if (window.count > properties.maxRequests()) {
            log.warn("Rate limit exceeded for dream interpretation route");
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getWriter(), ApiResponse.error("Too many requests. Please try again later."));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String resolveClientKey(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }

    private void cleanupExpiredWindows(long now) {
        if (windows.size() < 1000) {
            return;
        }

        windows.entrySet().removeIf(entry -> now >= entry.getValue().expiresAt);
    }

    private static final class RequestWindow {
        private final long expiresAt;
        private int count;

        private RequestWindow(long expiresAt, int count) {
            this.expiresAt = expiresAt;
            this.count = count;
        }
    }
}
