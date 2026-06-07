package com.bhakti.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "dream.api")
public record DreamApiProperties(
        String url,
        String key,
        int timeoutMs
) {
}
