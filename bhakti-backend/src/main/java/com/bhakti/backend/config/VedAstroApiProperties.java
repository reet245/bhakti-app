package com.bhakti.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "vedastro.api")
public record VedAstroApiProperties(
        String baseUrl,
        String key,
        int timeoutMs
) {
}
