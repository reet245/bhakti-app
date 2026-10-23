package com.bhakti.backend.service;

import com.bhakti.backend.client.GeocodingClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class LocationResolutionServiceTest {
    @Test
    void returnsCoordinatesAndIanaTimezoneFromSameCandidateAndCachesSearch() throws Exception {
        var client = mock(GeocodingClient.class);
        when(client.search("Berlin, Germany")).thenReturn(new ObjectMapper().readTree("""
                {"results":[{"name":"Berlin","admin1":"Berlin","country":"Germany","latitude":52.52,
                "longitude":13.41,"timezone":"Europe/Berlin"}]}
                """));
        var service = new LocationResolutionService(client);
        var location = service.search("Berlin, Germany").get(0);
        assertThat(location.resolvedPlaceName()).isEqualTo("Berlin, Germany");
        assertThat(location.timezone()).isEqualTo("Europe/Berlin");
        assertThat(location.latitude()).isEqualTo(52.52);
        service.search("berlin, germany");
        verify(client, times(1)).search(anyString());
    }

    @Test
    void ambiguousNamesRequireSelectionAndInvalidRowsAreDiscarded() throws Exception {
        var client = mock(GeocodingClient.class);
        when(client.search("Example")).thenReturn(new ObjectMapper().readTree("""
                {"results":[{"name":"One","latitude":1,"longitude":2,"timezone":"UTC"},
                {"name":"Two","latitude":2,"longitude":3,"timezone":"UTC"},
                {"name":"Invalid","latitude":999,"longitude":2,"timezone":"UTC"}]}
                """));
        var service = new LocationResolutionService(client);
        assertThat(service.search("Example")).hasSize(2);
        assertThatThrownBy(() -> service.resolve("Example")).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Several places");
    }
}
