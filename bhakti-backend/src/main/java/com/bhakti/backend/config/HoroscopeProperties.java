package com.bhakti.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "horoscope")
public record HoroscopeProperties(String feedUrl, String timezone, int timeoutMs) {}
