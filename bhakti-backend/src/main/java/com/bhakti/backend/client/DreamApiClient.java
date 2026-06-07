package com.bhakti.backend.client;

import com.bhakti.backend.config.DreamApiProperties;
import com.bhakti.backend.exception.ExternalApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.HashMap;
import java.util.Map;

@Component
public class DreamApiClient {

    private static final Logger log = LoggerFactory.getLogger(DreamApiClient.class);

    private static final String AUTHORIZATION_HEADER = HttpHeaders.AUTHORIZATION;
    private static final String BEARER_PREFIX = "Bearer ";

    private final DreamApiProperties properties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public DreamApiClient(DreamApiProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder()
                .requestFactory(requestFactory(properties.timeoutMs()))
                .build();
    }

    public String interpretDream(String prompt) {
        if (!StringUtils.hasText(properties.url())) {
            throw new ExternalApiException("Dream API URL is not configured.");
        }

        try {
            Map<String, Object> requestBody = buildRequestBody(prompt);

            String responseBody = restClient.post()
                    .uri(properties.url())
                    .contentType(MediaType.APPLICATION_JSON)
                    .headers(headers -> addAuthenticationHeader(headers, properties.key()))
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            return extractInterpretationText(responseBody);
        } catch (RestClientResponseException ex) {
            log.warn("Dream API returned an error. status={}", ex.getStatusCode().value());
            throw new ExternalApiException("Dream interpretation service failed.", ex);
        } catch (ResourceAccessException ex) {
            log.warn("Dream API request failed due to timeout or connectivity issue");
            throw new ExternalApiException("Dream interpretation service is not reachable.", ex);
        }
    }

    private SimpleClientHttpRequestFactory requestFactory(int timeoutMs) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeoutMs);
        factory.setReadTimeout(timeoutMs);
        return factory;
    }

    private Map<String, Object> buildRequestBody(String prompt) {
        Map<String, Object> requestBody = new HashMap<>();

        // TODO: Replace this placeholder payload with the exact external Dream API contract.
        // Common providers accept a prompt/message field; keep this code portable and free of
        // provider-specific business logic.
        requestBody.put("prompt", prompt);

        return requestBody;
    }

    private void addAuthenticationHeader(HttpHeaders headers, String apiKey) {
        if (!StringUtils.hasText(apiKey)) {
            return;
        }

        // TODO: Change AUTHORIZATION_HEADER or BEARER_PREFIX here if the provider requires
        // a different header, such as x-api-key.
        headers.set(AUTHORIZATION_HEADER, BEARER_PREFIX + apiKey);
    }

    private String extractInterpretationText(String responseBody) {
        if (!StringUtils.hasText(responseBody)) {
            throw new ExternalApiException("Dream interpretation service returned an empty response.");
        }

        try {
            JsonNode root = objectMapper.readTree(responseBody);

            String directText = firstText(root, "interpretation", "text", "response", "content", "message");
            if (StringUtils.hasText(directText)) {
                return directText;
            }

            JsonNode choices = root.path("choices");
            if (choices.isArray() && !choices.isEmpty()) {
                JsonNode firstChoice = choices.get(0);
                String choiceText = firstText(firstChoice, "text", "content");
                if (StringUtils.hasText(choiceText)) {
                    return choiceText;
                }

                String messageContent = firstChoice.path("message").path("content").asText(null);
                if (StringUtils.hasText(messageContent)) {
                    return messageContent;
                }
            }

            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                String candidateText = candidates.get(0).path("content").path("parts").path(0).path("text").asText(null);
                if (StringUtils.hasText(candidateText)) {
                    return candidateText;
                }
            }
        } catch (Exception ignored) {
            return responseBody;
        }

        return responseBody;
    }

    private String firstText(JsonNode root, String... fields) {
        for (String field : fields) {
            String value = root.path(field).asText(null);
            if (StringUtils.hasText(value)) {
                return value;
            }
        }

        return null;
    }
}
