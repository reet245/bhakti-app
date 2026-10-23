package com.bhakti.backend.config;

import com.bhakti.backend.dto.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.UrlPathHelper;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.Semaphore;

/** Single-instance abuse protection. Use a shared gateway quota when running multiple replicas. */
@Component
public class InMemoryRateLimitFilter extends OncePerRequestFilter {
    private static final Set<String> ROUTES = Set.of("/api/v1/dream/interpret", "/api/v1/kundli/generate",
            "/api/v1/panchang/daily", "/api/v1/horoscope/daily", "/api/v1/locations/search");
    private final RateLimitProperties properties;
    private final ObjectMapper objectMapper;
    private final Map<String, RequestWindow> windows = new HashMap<>();
    private final Semaphore concurrentRequests;
    private final Semaphore kundliRequests = new Semaphore(4);
    private final UrlPathHelper pathHelper = new UrlPathHelper();

    public InMemoryRateLimitFilter(RateLimitProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.concurrentRequests = new Semaphore(properties.maxConcurrentRequests());
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return "OPTIONS".equals(request.getMethod()) || !ROUTES.contains(path(request));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String route = path(request);
        long now = System.currentTimeMillis();
        if (properties.enabled() && !allow(resolveClientKey(request) + "|" + route, route, now)) {
            reject(response, 429, "Too many requests. Please try again later.", Math.max(1, properties.windowMs() / 1000));
            return;
        }
        boolean kundli = route.equals("/api/v1/kundli/generate");
        if (!concurrentRequests.tryAcquire()) {
            reject(response, 503, "The service is busy. Please try again shortly.", 5);
            return;
        }
        boolean kundliAcquired = !kundli || kundliRequests.tryAcquire();
        try {
            if (!kundliAcquired) {
                reject(response, 503, "The Kundli service is busy. Please try again shortly.", 5);
                return;
            }
            chain.doFilter(request, response);
        } finally {
            if (kundli && kundliAcquired) kundliRequests.release();
            concurrentRequests.release();
        }
    }

    private synchronized boolean allow(String key, String route, long now) {
        windows.entrySet().removeIf(entry -> now >= entry.getValue().expiresAt());
        RequestWindow existing = windows.get(key);
        // Never evict active counters: rotating spoofed addresses must not reset other clients' quotas.
        if (existing == null && windows.size() >= properties.maxClients()) return false;
        int count = existing == null ? 1 : Math.min(Integer.MAX_VALUE - 1, existing.count()) + 1;
        windows.put(key, new RequestWindow(existing == null ? now + properties.windowMs() : existing.expiresAt(), count));
        int limit = route.equals("/api/v1/kundli/generate") ? properties.kundliMaxRequests() : properties.maxRequests();
        return count <= limit;
    }

    String resolveClientKey(HttpServletRequest request) {
        String address = request.getRemoteAddr();
        if (!properties.trustedProxies().contains(address)) return address;
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded == null || forwarded.length() > 1024) return address;
        String[] chain = forwarded.split(",");
        // Walk from the trusted edge; ignore values beyond the first untrusted hop.
        for (int index = chain.length - 1; index >= 0 && properties.trustedProxies().contains(address); index--) {
            String hop = chain[index].trim();
            if (!hop.matches("[0-9a-fA-F:.]{2,45}")) return request.getRemoteAddr();
            address = hop;
        }
        return address;
    }

    private String path(HttpServletRequest request) {
        return pathHelper.getPathWithinApplication(request);
    }

    private void reject(HttpServletResponse response, int status, String message, long retrySeconds) throws IOException {
        response.setStatus(status);
        response.setHeader("Retry-After", String.valueOf(retrySeconds));
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), ApiResponse.error(message));
    }

    private record RequestWindow(long expiresAt, int count) {}
}
