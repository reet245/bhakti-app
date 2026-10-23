package com.bhakti.backend.client;

import com.bhakti.backend.config.VedAstroApiProperties;
import com.bhakti.backend.exception.ExternalApiException;
import com.bhakti.backend.util.ProviderRequestBudget;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.nio.charset.StandardCharsets;

@Component
public class VedAstroClient {

    private static final Logger log = LoggerFactory.getLogger(VedAstroClient.class);

    private static final String API_KEY_HEADER = "x-api-key";
    private static final String CALCULATE_PATH = "/Calculate";
    private static final String PANCHANGA_TABLE_METHOD = "PanchangaTable";

    private final VedAstroApiProperties properties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public VedAstroClient(VedAstroApiProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder()
                .requestFactory(requestFactory(properties.timeoutMs()))
                .build();
    }

    public boolean isConfigured() {
        return StringUtils.hasText(properties.baseUrl());
    }

    public Map<String, JsonNode> fetchGeneralAstroData(VedAstroBirthData birthData) {
        Map<String, JsonNode> results = new LinkedHashMap<>();
        List<String> methods = List.of(
                "LagnaSignName",
                "MoonSignName",
                "SunSign",
                "MoonConstellation",
                "LunarDay",
                "Karana",
                "NithyaYoga"
        );

        for (String method : methods) {
            results.put(method, postCalculateJson(method, timeRequestBody("time", birthData)));
        }

        return results;
    }

    public JsonNode fetchPlanetData(VedAstroBirthData birthData) {
        return postCalculateJson("AllPlanetRasiSigns", timeRequestBody("time", birthData));
    }

    public Map<String, JsonNode> fetchHouseData(VedAstroBirthData birthData) {
        return Map.of(
                "d1", postCalculateJson("AllHouseRasiSigns", timeRequestBody("time", birthData)),
                "d9", postCalculateJson("AllHouseNavamshaSign", timeRequestBody("time", birthData))
        );
    }

    public JsonNode fetchDasha(VedAstroBirthData birthData, String startStdTime, String endStdTime) {
        return postCalculateJson("DasaAtRange", Map.of(
                "birthTime", timeJson(birthData.stdTime(), birthData),
                "startTime", timeJson(startStdTime, birthData),
                "endTime", timeJson(endStdTime, birthData),
                "levels", 2,
                "precisionHours", 100,
                "Ayanamsa", birthData.ayanamsa()
        ));
    }

    public JsonNode fetchPredictions(VedAstroBirthData birthData) {
        return postCalculateJson("HoroscopePredictions", Map.of(
                "birthTime", timeJson(birthData.stdTime(), birthData),
                "filterTags", List.of(),
                "sortByWeight", false,
                "Ayanamsa", birthData.ayanamsa()
        ));
    }

    public String fetchIndianChartSvg(VedAstroBirthData birthData, String chartType) {
        return postCalculateRaw("NorthIndianChart", Map.of(
                "time", timeJson(birthData.stdTime(), birthData),
                "chartType", chartType,
                "Ayanamsa", birthData.ayanamsa()
        ));
    }

    public JsonNode fetchPanchangaTable(Map<String, Object> requestBody) {
        return postCalculateJson(PANCHANGA_TABLE_METHOD, requestBody);
    }

    private Map<String, Object> timeRequestBody(String key, VedAstroBirthData birthData) {
        return Map.of(
                key, timeJson(birthData.stdTime(), birthData),
                "Ayanamsa", birthData.ayanamsa()
        );
    }

    private Map<String, Object> timeJson(String stdTime, VedAstroBirthData birthData) {
        return Map.of(
                "StdTime", stdTime,
                "Location", Map.of(
                        "Name", birthData.locationName(),
                        "Longitude", birthData.longitude(),
                        "Latitude", birthData.latitude()
                )
        );
    }

    private JsonNode postCalculateJson(String method, Map<String, Object> requestBody) {
        String responseBody = postCalculateRaw(method, requestBody);

        try {
            JsonNode response = objectMapper.readTree(responseBody);
            JsonNode status = response.path("Status");
            log.debug("VedAstro {} response received", method);

            if ("Fail".equalsIgnoreCase(status.asText())) {
                throw new ExternalApiException("VedAstro " + method + " returned an error.");
            }

            if (response.path("Payload").isMissingNode()) {
                throw new ExternalApiException("VedAstro " + method + " returned a malformed response.");
            }

            return response;
        } catch (JsonProcessingException ex) {
            log.warn("VedAstro {} response could not be parsed", method);
            throw new ExternalApiException("VedAstro " + method + " returned an invalid response.", ex);
        }
    }

    private String postCalculateRaw(String method, Map<String, Object> requestBody) {
        ensureBaseUrlConfigured();

        try {
            int timeout = ProviderRequestBudget.remainingTimeout(properties.timeoutMs());
            String responseBody = restClient.mutate().requestFactory(requestFactory(timeout)).build().post()
                    .uri(calculateEndpoint(method))
                    .contentType(MediaType.APPLICATION_JSON)
                    .headers(headers -> {
                        if (StringUtils.hasText(properties.key())) {
                            headers.set(API_KEY_HEADER, properties.key());
                        }
                    })
                    .body(requestBody)
                    .exchange((request, response) -> {
                        if (!response.getStatusCode().is2xxSuccessful()) {
                            throw new ExternalApiException("VedAstro " + method + " service failed.");
                        }
                        byte[] bytes = response.getBody().readNBytes(2 * 1024 * 1024 + 1);
                        if (bytes.length > 2 * 1024 * 1024) {
                            throw new ExternalApiException("VedAstro " + method + " response was too large.");
                        }
                        return new String(bytes, StandardCharsets.UTF_8);
                    });

            if (!StringUtils.hasText(responseBody)) {
                throw new ExternalApiException("VedAstro " + method + " returned an empty response.");
            }

            return responseBody;
        } catch (RestClientResponseException ex) {
            log.warn("VedAstro {} returned an error. status={}", method, ex.getStatusCode().value());
            throw new ExternalApiException("VedAstro " + method + " service failed.", ex);
        } catch (ResourceAccessException ex) {
            log.warn("VedAstro {} request failed due to timeout or connectivity issue", method);
            throw new ExternalApiException("VedAstro " + method + " service is not reachable.", ex);
        } catch (ExternalApiException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("VedAstro {} request failed unexpectedly", method);
            throw new ExternalApiException("VedAstro " + method + " service returned an invalid response.", ex);
        }
    }

    private void ensureBaseUrlConfigured() {
        if (!StringUtils.hasText(properties.baseUrl())) {
            throw new ExternalApiException("VedAstro API base URL is not configured.");
        }
    }

    private String calculateEndpoint(String method) {
        String baseUrl = properties.baseUrl().trim();
        String normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        return normalizedBaseUrl + CALCULATE_PATH + "/" + method;
    }

    private SimpleClientHttpRequestFactory requestFactory(int timeoutMs) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Math.max(50, timeoutMs / 2));
        factory.setReadTimeout(Math.max(50, timeoutMs / 2));
        return factory;
    }

    public record VedAstroBirthData(
            String stdTime,
            String locationName,
            double latitude,
            double longitude,
            String ayanamsa
    ) {
    }
}
