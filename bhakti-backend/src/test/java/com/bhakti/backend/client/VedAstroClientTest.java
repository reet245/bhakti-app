package com.bhakti.backend.client;

import com.bhakti.backend.config.VedAstroApiProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import com.bhakti.backend.exception.ExternalApiException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import static org.assertj.core.api.Assertions.assertThat;

class VedAstroClientTest {

    @Test
    void postsPanchangJsonToProviderAndRejectsMalformedResponses() throws Exception {
        AtomicReference<String> received = new AtomicReference<>();
        AtomicReference<String> response = new AtomicReference<>("{\"Status\":\"Pass\",\"Payload\":{\"PanchangaTable\":{\"Karana\":\"Vanija\"}}}");
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/api/Calculate/PanchangaTable", exchange -> {
            received.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            byte[] bytes = response.get().getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, bytes.length);
            try (var body = exchange.getResponseBody()) { body.write(bytes); }
        });
        server.start();
        try {
            var client = new VedAstroClient(new VedAstroApiProperties(
                    "http://127.0.0.1:" + server.getAddress().getPort() + "/api", "", 1000), new ObjectMapper());
            var data = client.fetchPanchangaTable(Map.of("InputTime", Map.of("StdTime", "06:00 23/10/2026 +05:30")));
            assertThat(data.path("Payload").path("PanchangaTable").path("Karana").asText()).isEqualTo("Vanija");
            assertThat(new ObjectMapper().readTree(received.get()).path("InputTime").path("StdTime").asText())
                    .isEqualTo("06:00 23/10/2026 +05:30");
            response.set("{\"Status\":\"Pass\"}");
            assertThatThrownBy(() -> client.fetchPanchangaTable(Map.of())).isInstanceOf(ExternalApiException.class)
                    .hasMessageContaining("malformed");
        } finally { server.stop(0); }
    }

    @Test
    void baseUrlConfigurationDoesNotRequireApiKey() {
        VedAstroClient client = new VedAstroClient(
                new VedAstroApiProperties("https://api.vedastro.org/api", "", 1000),
                new ObjectMapper()
        );

        assertThat(client.isConfigured()).isTrue();
    }
}
