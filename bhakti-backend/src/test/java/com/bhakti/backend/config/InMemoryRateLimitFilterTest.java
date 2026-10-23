package com.bhakti.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;

class InMemoryRateLimitFilterTest {
    private InMemoryRateLimitFilter filter(int limit, int clients, int concurrent, List<String> trusted) {
        return new InMemoryRateLimitFilter(new RateLimitProperties(true, limit, 60000, limit, clients,
                concurrent, trusted), new ObjectMapper());
    }

    private MockHttpServletRequest request(String route, String address, String forwarded) {
        var request = new MockHttpServletRequest("GET", route);
        request.setRemoteAddr(address);
        if (forwarded != null) request.addHeader("X-Forwarded-For", forwarded);
        return request;
    }

    @Test
    void everyProviderRouteRejectsOverQuotaAndUntrustedForwardedHeadersCannotResetIt() throws Exception {
        var limiter = filter(1, 100, 16, List.of());
        for (String route : List.of("/api/v1/dream/interpret", "/api/v1/kundli/generate", "/api/v1/panchang/daily",
                "/api/v1/horoscope/daily", "/api/v1/locations/search")) {
            var first = new MockHttpServletResponse();
            limiter.doFilter(request(route, "203.0.113.1", "198.51.100.1"), first, (req, res) -> {});
            var second = new MockHttpServletResponse();
            limiter.doFilter(request(route, "203.0.113.1", "198.51.100.2"), second, (req, res) -> {});
            assertThat(first.getStatus()).isEqualTo(200);
            assertThat(second.getStatus()).isEqualTo(429);
            assertThat(second.getHeader("Retry-After")).isEqualTo("60");
        }
    }

    @Test
    void trustedProxyChainStopsAtFirstUntrustedHop() {
        var limiter = filter(1, 10, 1, List.of("10.0.0.1", "10.0.0.2"));
        assertThat(limiter.resolveClientKey(request("/api/v1/panchang/daily", "10.0.0.1",
                "192.0.2.99, 198.51.100.2, 10.0.0.2"))).isEqualTo("198.51.100.2");
        assertThat(limiter.resolveClientKey(request("/api/v1/panchang/daily", "10.0.0.1", "invalid")))
                .isEqualTo("10.0.0.1");
    }

    @Test
    void stateBoundRejectsNewClientsWithoutEvictingActiveQuotas() throws Exception {
        var limiter = filter(1, 1, 1, List.of());
        limiter.doFilter(request("/api/v1/panchang/daily", "203.0.113.1", null), new MockHttpServletResponse(), (req, res) -> {});
        var newClient = new MockHttpServletResponse();
        limiter.doFilter(request("/api/v1/panchang/daily", "203.0.113.2", null), newClient, (req, res) -> {});
        var original = new MockHttpServletResponse();
        limiter.doFilter(request("/api/v1/panchang/daily", "203.0.113.1", null), original, (req, res) -> {});
        assertThat(newClient.getStatus()).isEqualTo(429);
        assertThat(original.getStatus()).isEqualTo(429);
    }

    @Test
    void matrixParametersCannotBypassRouteQuota() throws Exception {
        var limiter = filter(1, 100, 1, List.of());
        limiter.doFilter(request("/api/v1/kundli/generate;ignored=one", "203.0.113.1", null),
                new MockHttpServletResponse(), (req, res) -> {});
        var second = new MockHttpServletResponse();
        limiter.doFilter(request("/api/v1/kundli/generate;ignored=two", "203.0.113.1", null), second, (req, res) -> {});
        assertThat(second.getStatus()).isEqualTo(429);
    }

    @Test
    void concurrencyCapacityIsReleasedAfterRequestsFinish() throws Exception {
        var limiter = filter(100, 100, 1, List.of());
        var busy = new MockHttpServletResponse();
        limiter.doFilter(request("/api/v1/panchang/daily", "203.0.113.1", null), new MockHttpServletResponse(),
                (req, res) -> limiter.doFilter(request("/api/v1/panchang/daily", "203.0.113.2", null), busy, (r, s) -> {}));
        var later = new MockHttpServletResponse();
        limiter.doFilter(request("/api/v1/panchang/daily", "203.0.113.3", null), later, (req, res) -> {});
        assertThat(busy.getStatus()).isEqualTo(503);
        assertThat(later.getStatus()).isEqualTo(200);
    }
}
