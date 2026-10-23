package com.bhakti.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "geocoding.api")
public record GeocodingProperties(String url, String key, int timeoutMs) {}
