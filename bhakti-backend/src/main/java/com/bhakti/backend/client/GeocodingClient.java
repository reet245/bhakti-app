package com.bhakti.backend.client;

import com.bhakti.backend.config.GeocodingProperties;
import com.bhakti.backend.exception.ExternalApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

/** Open-Meteo/GeoNames search adapter. Coordinates and IANA zone come from the same selected result. */
@Component
public class GeocodingClient {
    private final GeocodingProperties properties;
    private final RestClient client;

    public GeocodingClient(GeocodingProperties properties) {
        this.properties = properties;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        int timeout = Math.max(100, Math.min(5000, properties.timeoutMs()));
        factory.setConnectTimeout(timeout / 2);
        factory.setReadTimeout(timeout / 2);
        this.client = RestClient.builder().requestFactory(factory).build();
    }

    public JsonNode search(String query) {
        if (properties.url() == null || properties.url().isBlank()) {
            throw new ExternalApiException("Birthplace search is not configured. Enter coordinates and timezone manually.");
        }
        var uri = UriComponentsBuilder.fromUriString(properties.url()).queryParam("name", query)
                .queryParam("count", 8).queryParam("language", "en").queryParam("format", "json");
        if (properties.key() != null && !properties.key().isBlank()) uri.queryParam("apikey", properties.key());
        try {
            return client.get().uri(uri.build().encode().toUri()).exchange((request, response) -> {
                if (!response.getStatusCode().is2xxSuccessful()) {
                    throw new ExternalApiException("Birthplace search provider is unavailable.");
                }
                byte[] bytes = response.getBody().readNBytes(128 * 1024 + 1);
                if (bytes.length > 128 * 1024) throw new ExternalApiException("Birthplace search response was too large.");
                return new ObjectMapper().readTree(bytes);
            });
        } catch (RestClientException ex) {
            // Do not log the URL: it includes the birthplace query and may include credentials.
            throw new ExternalApiException("Birthplace search is unavailable. Enter coordinates and timezone manually.");
        }
    }
}
