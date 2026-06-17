package com.bhakti.backend.client;

import com.bhakti.backend.config.VedAstroApiProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class VedAstroClientTest {

    @Test
    void baseUrlConfigurationDoesNotRequireApiKey() {
        VedAstroClient client = new VedAstroClient(
                new VedAstroApiProperties("https://api.vedastro.org/api", "", 1000),
                new ObjectMapper()
        );

        assertThat(client.isConfigured()).isTrue();
    }
}
