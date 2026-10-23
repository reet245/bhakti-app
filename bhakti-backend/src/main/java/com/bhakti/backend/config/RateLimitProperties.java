package com.bhakti.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import java.util.List;

@ConfigurationProperties(prefix = "rate-limit")
public record RateLimitProperties(
        boolean enabled,
        int maxRequests,
        long windowMs,
        int kundliMaxRequests,
        int maxClients,
        int maxConcurrentRequests,
        List<String> trustedProxies
) {
    public RateLimitProperties {
        maxRequests = maxRequests > 0 ? maxRequests : 30;
        windowMs = windowMs > 0 ? windowMs : 60000;
        kundliMaxRequests = kundliMaxRequests > 0 ? kundliMaxRequests : 5;
        maxClients = maxClients > 0 ? maxClients : 10000;
        maxConcurrentRequests = maxConcurrentRequests > 0 ? maxConcurrentRequests : 16;
        trustedProxies = trustedProxies == null ? List.of() : List.copyOf(trustedProxies);
    }
}
