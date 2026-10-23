package com.bhakti.backend.service;

import com.bhakti.backend.client.VedAstroClient;
import com.bhakti.backend.dto.panchang.PanchangDailyResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PanchangServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @SuppressWarnings("unchecked")
    void usesDateSpecificDstOffsetCachesResultsAndReportsPartialFields() throws Exception {
        VedAstroClient client = mock(VedAstroClient.class);
        when(client.fetchPanchangaTable(anyMap())).thenReturn(objectMapper.readTree("""
                {"Status":"Pass","Payload":{"PanchangaTable":{"Tithi":{"Name":"Ekadashi","Paksha":"Shukla"}}}}
                """));
        PanchangService service = new PanchangService(client);
        var winter = service.getDailyPanchang("2026-01-15", 40.7, -74, "New York", "America/New_York", "LAHIRI");
        service.getDailyPanchang("2026-07-15", 40.7, -74, "New York", "America/New_York", "LAHIRI");
        service.getDailyPanchang("2026-01-15", 40.7, -74, "New York", "America/New_York", "LAHIRI");
        var captor = org.mockito.ArgumentCaptor.forClass(Map.class);
        verify(client, times(2)).fetchPanchangaTable(captor.capture());
        assertThat(((Map<?, ?>) captor.getAllValues().get(0).get("InputTime")).get("StdTime"))
                .isEqualTo("06:00 15/01/2026 -05:00");
        assertThat(((Map<?, ?>) captor.getAllValues().get(1).get("InputTime")).get("StdTime"))
                .isEqualTo("06:00 15/07/2026 -04:00");
        assertThat(winter.partial()).isTrue();
        assertThat(winter.missingFields()).contains("nakshatra", "sunrise").doesNotContain("tithiName", "paksha");
    }

    @Test
    void invalidInputsNeverReachProvider() {
        VedAstroClient client = mock(VedAstroClient.class);
        PanchangService service = new PanchangService(client);
        assertThatThrownBy(() -> service.getDailyPanchang("2026-01-01", Double.NaN, 0, "Test", "UTC", "LAHIRI"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.getDailyPanchang("2026-01-01", 0, 0, "Test", "Invalid/Zone", "LAHIRI"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.getDailyPanchang("2026-01-01", 0, 0, "Test", "UTC", "INVALID"))
                .isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(client);
    }

    @Test
    @SuppressWarnings("unchecked")
    void getDailyPanchangBuildsVedAstroRequestAndNormalizesResponse() throws Exception {
        VedAstroClient vedAstroClient = mock(VedAstroClient.class);
        when(vedAstroClient.fetchPanchangaTable(anyMap())).thenReturn(objectMapper.readTree("""
                {
                  "Status": "Pass",
                  "Payload": [
                    { "Name": "Tithi", "Value": "Krishna Paksha Trayodashi" },
                    { "Name": "Lunar Month", "Value": "Jyeshtha" },
                    { "Name": "Nakshatra", "Value": "Rohini" },
                    { "Name": "Yoga", "Value": "Shoola" },
                    { "Name": "Karana", "Value": "Vanija" },
                    { "Name": "Hora Lord", "Value": "Venus" },
                    { "Name": "Disha Shool", "Value": "West" },
                    { "Name": "Sunrise", "Value": "05:13" },
                    { "Name": "Sunset", "Value": "18:21" },
                    { "Name": "Ishta Kaala", "Value": "02:18" }
                  ]
                }
                """));

        PanchangService service = new PanchangService(vedAstroClient);

        PanchangDailyResponse response = service.getDailyPanchang(
                "2026-06-13",
                22.566,
                88.37,
                "Kolkata, West Bengal, India",
                "Asia/Kolkata",
                "LAHIRI"
        );

        assertThat(response.tithiName()).isEqualTo("Trayodashi");
        assertThat(response.paksha()).isEqualTo("Krishna Paksha");
        assertThat(response.lunarMonth()).isEqualTo("Jyeshtha");
        assertThat(response.nakshatra()).isEqualTo("Rohini");
        assertThat(response.yogaName()).isEqualTo("Shoola");
        assertThat(response.karana()).isEqualTo("Vanija");
        assertThat(response.horaLord()).isEqualTo("Venus");
        assertThat(response.dishaShool()).isEqualTo("West");
        assertThat(response.sunrise()).isEqualTo("05:13");
        assertThat(response.sunset()).isEqualTo("18:21");
        assertThat(response.ayanamsa()).isEqualTo("LAHIRI");
        assertThat(response.ishtaKaala()).isEqualTo("02:18");
        assertThat(response.source()).isEqualTo("VEDASTRO");
        assertThat(response.isRealData()).isTrue();

        var captor = org.mockito.ArgumentCaptor.forClass(Map.class);
        verify(vedAstroClient).fetchPanchangaTable(captor.capture());
        Map<String, Object> requestBody = (Map<String, Object>) captor.getValue();
        Map<String, Object> inputTime = (Map<String, Object>) requestBody.get("InputTime");
        Map<String, Object> location = (Map<String, Object>) inputTime.get("Location");

        assertThat(inputTime.get("StdTime")).isEqualTo("06:00 13/06/2026 +05:30");
        assertThat(location.get("Name")).isEqualTo("Kolkata, West Bengal, India");
        assertThat(location.get("Latitude")).isEqualTo(22.566);
        assertThat(location.get("Longitude")).isEqualTo(88.37);
        assertThat(requestBody.get("Ayanamsa")).isEqualTo("LAHIRI");
    }

    @Test
    void getDailyPanchangNormalizesRealPanchangaTablePayload() throws Exception {
        VedAstroClient vedAstroClient = mock(VedAstroClient.class);
        when(vedAstroClient.fetchPanchangaTable(anyMap())).thenReturn(objectMapper.readTree("""
                {
                  "Status": "Pass",
                  "Payload": {
                    "PanchangaTable": {
                      "Ayanamsa": "24 deg 13' 42",
                      "Tithi": {
                        "Name": "Triodasi",
                        "Paksha": "Krishna",
                        "Date": "28/30",
                        "Day": "13/15",
                        "Phase": "DarkHalf"
                      },
                      "LunarMonth": "Jyeshtha",
                      "Vara": "Saturday",
                      "Nakshatra": "Krithika - 1",
                      "Yoga": {
                        "Name": "Sukarma",
                        "Description": "One with good deeds"
                      },
                      "Karana": "Vanija",
                      "HoraLord": {
                        "Name": "Jupiter"
                      },
                      "DishaShool": "East",
                      "Sunrise": {
                        "StdTime": "04:55 13/06/2026 +05:30"
                      },
                      "Sunset": {
                        "StdTime": "18:17 13/06/2026 +05:30"
                      },
                      "IshtaKaala": {
                        "DegreeMinuteSecond": "2 deg 41' 22"
                      }
                    }
                  }
                }
                """));

        PanchangService service = new PanchangService(vedAstroClient);

        PanchangDailyResponse response = service.getDailyPanchang(
                "2026-06-13",
                22.566,
                88.37,
                "Kolkata, West Bengal, India",
                "Asia/Kolkata",
                "LAHIRI"
        );

        assertThat(response.tithiName()).isEqualTo("Triodasi");
        assertThat(response.paksha()).isEqualTo("Krishna Paksha");
        assertThat(response.lunarMonth()).isEqualTo("Jyeshtha");
        assertThat(response.vara()).isEqualTo("Saturday");
        assertThat(response.nakshatra()).isEqualTo("Krithika - 1");
        assertThat(response.yogaName()).isEqualTo("Sukarma");
        assertThat(response.yogaDescription()).isEqualTo("One with good deeds");
        assertThat(response.karana()).isEqualTo("Vanija");
        assertThat(response.horaLord()).isEqualTo("Jupiter");
        assertThat(response.dishaShool()).isEqualTo("East");
        assertThat(response.sunrise()).isEqualTo("04:55");
        assertThat(response.sunset()).isEqualTo("18:17");
        assertThat(response.ayanamsa()).isEqualTo("24 deg 13' 42");
        assertThat(response.ishtaKaala()).isEqualTo("2 deg 41' 22");
        assertThat(response.source()).isEqualTo("VEDASTRO");
        assertThat(response.isRealData()).isTrue();
    }
}
