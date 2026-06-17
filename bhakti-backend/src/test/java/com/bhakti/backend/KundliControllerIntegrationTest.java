package com.bhakti.backend;

import com.bhakti.backend.client.VedAstroClient;
import com.bhakti.backend.exception.ExternalApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class KundliControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private VedAstroClient vedAstroClient;

    @BeforeEach
    void setUp() throws Exception {
        reset(vedAstroClient);
        stubCompleteVedAstroResponse();
    }

    @Test
    void healthEndpointStillReturnsSuccess() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("UP"))
                .andExpect(jsonPath("$.data.service").value("Bhakti Backend"));
    }

    @Test
    void generateKundliUsesProvidedCoordinatesAndNormalizesVedAstroResponse() throws Exception {
        mockMvc.perform(post("/api/v1/kundli/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequest()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.profile.name").value("Reet"))
                .andExpect(jsonPath("$.profile.birthDate").value("15 Aug 2000"))
                .andExpect(jsonPath("$.profile.birthTime").value("14:30"))
                .andExpect(jsonPath("$.profile.birthPlace").value("Kolkata, India"))
                .andExpect(jsonPath("$.calculationMeta.provider").value("VedAstro"))
                .andExpect(jsonPath("$.calculationMeta.ayanamsa").value("LAHIRI"))
                .andExpect(jsonPath("$.calculationMeta.birthLocation.latitude").value(22.5726))
                .andExpect(jsonPath("$.calculationMeta.birthLocation.longitude").value(88.3639))
                .andExpect(jsonPath("$.calculationMeta.birthLocation.timezone").value("+05:30"))
                .andExpect(jsonPath("$.calculationMeta.precision").value("ACCURATE"))
                .andExpect(jsonPath("$.birthSummary.lagna").value("Sagittarius"))
                .andExpect(jsonPath("$.birthSummary.rashi").value("Aquarius"))
                .andExpect(jsonPath("$.birthSummary.nakshatra").value("Dhanishta"))
                .andExpect(jsonPath("$.birthSummary.nakshatraPada").value("3"))
                .andExpect(jsonPath("$.charts.d1.type").value("D1"))
                .andExpect(jsonPath("$.charts.d1.houses.length()").value(12))
                .andExpect(jsonPath("$.planets[0].planet").value("Sun"))
                .andExpect(jsonPath("$.planets[0].sign").value("Cancer"))
                .andExpect(jsonPath("$.planets[0].degree").value("28\u00B0 58' 14"))
                .andExpect(jsonPath("$.dasha.system").value("Vimshottari"))
                .andExpect(jsonPath("$.dasha.timeline.length()").value(2))
                .andExpect(jsonPath("$.predictions[0].category").value("Personality"));
    }

    @Test
    void generateKundliReturnsValidationErrorWhenBirthTimeMissing() throws Exception {
        mockMvc.perform(post("/api/v1/kundli/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Reet",
                                  "gender": "female",
                                  "birthDate": "2000-08-15",
                                  "birthPlace": "Kolkata, India",
                                  "latitude": 22.5726,
                                  "longitude": 88.3639,
                                  "timezone": "+05:30",
                                  "unknownTime": false
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Birth time is required when unknown time is false."));
    }

    @Test
    void generateKundliMarksUnknownBirthTimeAsApproximate() throws Exception {
        mockMvc.perform(post("/api/v1/kundli/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Reet",
                                  "gender": "female",
                                  "birthDate": "2000-08-15",
                                  "birthPlace": "Kolkata, India",
                                  "latitude": 22.5726,
                                  "longitude": 88.3639,
                                  "timezone": "+05:30",
                                  "unknownTime": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.profile.birthTime").value("Unknown"))
                .andExpect(jsonPath("$.calculationMeta.precision").value("APPROXIMATE_UNKNOWN_BIRTH_TIME"))
                .andExpect(jsonPath("$.calculationMeta.warnings.length()").value(2))
                .andExpect(jsonPath("$.dasha.timeline.length()").value(0))
                .andExpect(jsonPath("$.predictions.length()").value(0));
    }

    @Test
    void generateKundliReturnsFriendlyErrorForUnresolvedLocation() throws Exception {
        mockMvc.perform(post("/api/v1/kundli/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Reet",
                                  "gender": "female",
                                  "birthDate": "2000-08-15",
                                  "birthTime": "14:30",
                                  "birthPlace": "Fake Place",
                                  "unknownTime": false
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(
                        "We could not find the birth place coordinates. Please select a valid place and try again."
                ));
    }

    @Test
    void generateKundliReturnsBadGatewayForCoreVedAstroFailure() throws Exception {
        when(vedAstroClient.fetchGeneralAstroData(any())).thenThrow(new ExternalApiException("VedAstro failed."));

        mockMvc.perform(post("/api/v1/kundli/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequest()))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("VedAstro failed."));
    }

    @Test
    void generateKundliReturnsWarningsForPartialVedAstroResponse() throws Exception {
        when(vedAstroClient.fetchPlanetData(any())).thenReturn(json("""
                { "Status": "Pass", "Payload": { "AllPlanetRasiSigns": [] } }
                """));
        when(vedAstroClient.fetchHouseData(any())).thenReturn(Map.of(
                "d1", json("{ \"Status\": \"Pass\", \"Payload\": { \"AllHouseRasiSigns\": [] } }"),
                "d9", json("{ \"Status\": \"Pass\", \"Payload\": { \"AllHouseNavamshaSign\": [] } }")
        ));

        mockMvc.perform(post("/api/v1/kundli/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequest()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.planets.length()").value(0))
                .andExpect(jsonPath("$.houses.length()").value(0))
                .andExpect(jsonPath("$.calculationMeta.warnings.length()").value(3));
    }

    private void stubCompleteVedAstroResponse() throws Exception {
        when(vedAstroClient.fetchGeneralAstroData(any())).thenReturn(Map.of(
                "LagnaSignName", json("{ \"Status\": \"Pass\", \"Payload\": { \"LagnaSignName\": \"Sagittarius\" } }"),
                "MoonSignName", json("{ \"Status\": \"Pass\", \"Payload\": { \"MoonSignName\": \"Aquarius\" } }"),
                "SunSign", json("{ \"Status\": \"Pass\", \"Payload\": { \"SunSign\": { \"Name\": \"Cancer\" } } }"),
                "MoonConstellation", json("{ \"Status\": \"Pass\", \"Payload\": { \"MoonConstellation\": \"Dhanishta - 3\" } }"),
                "LunarDay", json("{ \"Status\": \"Pass\", \"Payload\": { \"LunarDay\": { \"Name\": \"Padyami\", \"Paksha\": \"Krishna\" } } }"),
                "Karana", json("{ \"Status\": \"Pass\", \"Payload\": { \"Karana\": \"Balava\" } }"),
                "NithyaYoga", json("{ \"Status\": \"Pass\", \"Payload\": { \"NithyaYoga\": { \"Name\": \"Sobhana\" } } }")
        ));
        when(vedAstroClient.fetchPlanetData(any())).thenReturn(json("""
                {
                  "Status": "Pass",
                  "Payload": {
                    "AllPlanetRasiSigns": [
                      { "Planet": "Sun", "AllPlanetRasiSigns": "Cancer : 28\u00C2\u00B0 58' 14" },
                      { "Planet": "Moon", "AllPlanetRasiSigns": "Aquarius : 0\u00C2\u00B0 43' 45" }
                    ]
                  }
                }
                """));
        when(vedAstroClient.fetchHouseData(any())).thenReturn(Map.of(
                "d1", json(houseResponse("AllHouseRasiSigns", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
                        "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio")),
                "d9", json(houseResponse("AllHouseNavamshaSign", "Taurus", "Gemini", "Cancer", "Leo",
                        "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces", "Aries"))
        ));
        when(vedAstroClient.fetchDasha(any(), anyString(), anyString())).thenReturn(json("""
                {
                  "Status": "Pass",
                  "Payload": {
                    "DasaAtRange": {
                      "Jupiter": {
                        "Lord": "Jupiter",
                        "Start": "00:00 17/06/2026 +05:30",
                        "End": "00:00 16/06/2031 +05:30",
                        "Description": "Jupiter Dasa",
                        "SubDasas": {
                          "Mercury": {
                            "Lord": "Mercury",
                            "Start": "00:00 17/06/2026 +05:30",
                            "End": "00:00 10/10/2028 +05:30",
                            "Description": "Mercury Bhukti"
                          }
                        }
                      }
                    }
                  }
                }
                """));
        when(vedAstroClient.fetchPredictions(any())).thenReturn(json("""
                {
                  "Status": "Pass",
                  "Payload": [
                    {
                      "Name": "Medical_Test",
                      "Description": "Hidden medical prediction.",
                      "Tags": ["MedicalAstrology"]
                    },
                    {
                      "Name": "Personality_ConfidentNative",
                      "Description": "The native shows confidence and steady focus.",
                      "Tags": ["Personality"]
                    }
                  ]
                }
                """));
    }

    private JsonNode json(String value) throws Exception {
        return objectMapper.readTree(value);
    }

    private String houseResponse(String methodName, String... signs) {
        StringBuilder rows = new StringBuilder();
        for (int i = 0; i < signs.length; i++) {
            if (i > 0) {
                rows.append(',');
            }
            rows.append("""
                    { "House": "House%d", "%s": "%s : 1\u00C2\u00B0 0' 0" }
                    """.formatted(i + 1, methodName, signs[i]));
        }

        return """
                {
                  "Status": "Pass",
                  "Payload": {
                    "%s": [%s]
                  }
                }
                """.formatted(methodName, rows);
    }

    private String validRequest() {
        return """
                {
                  "name": "Reet",
                  "gender": "female",
                  "birthDate": "2000-08-15",
                  "birthTime": "14:30",
                  "birthPlace": "Kolkata, India",
                  "latitude": 22.5726,
                  "longitude": 88.3639,
                  "timezone": "+05:30",
                  "ayanamsa": "LAHIRI",
                  "unknownTime": false
                }
                """;
    }
}
