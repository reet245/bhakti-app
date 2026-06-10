package com.bhakti.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class KundliControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void healthEndpointStillReturnsSuccess() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("UP"))
                .andExpect(jsonPath("$.data.service").value("Bhakti Backend"));
    }

    @Test
    void generateKundliResolvesKolkataInternally() throws Exception {
        mockMvc.perform(post("/api/v1/kundli/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequest("Kolkata")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.profile.name").value("Reet"))
                .andExpect(jsonPath("$.data.profile.birthDate").value("23 July 2000"))
                .andExpect(jsonPath("$.data.profile.birthTime").value("07:30 AM"))
                .andExpect(jsonPath("$.data.profile.latitude").value(22.5726))
                .andExpect(jsonPath("$.data.profile.longitude").value(88.3639))
                .andExpect(jsonPath("$.data.profile.timezone").value("Asia/Kolkata"))
                .andExpect(jsonPath("$.data.summary.ayanamsa").value("LAHIRI"))
                .andExpect(jsonPath("$.data.calculationMeta.resolvedPlaceName").value("Kolkata"))
                .andExpect(jsonPath("$.data.calculationMeta.latitude").value(22.5726))
                .andExpect(jsonPath("$.data.calculationMeta.longitude").value(88.3639))
                .andExpect(jsonPath("$.data.calculationMeta.timezone").value("Asia/Kolkata"))
                .andExpect(jsonPath("$.data.calculationMeta.timezoneOffset").value(5.5))
                .andExpect(jsonPath("$.data.calculationMeta.ayanamsa").value("LAHIRI"))
                .andExpect(jsonPath("$.data.calculationMeta.calculationMode").value("DUMMY_BACKEND"))
                .andExpect(jsonPath("$.data.planets.length()").value(9))
                .andExpect(jsonPath("$.data.houses.length()").value(12))
                .andExpect(jsonPath("$.data.calculationMeta.provider").value("Dummy"))
                .andExpect(jsonPath("$.data.calculationMeta.isLive").value(false));
    }

    @Test
    void generateKundliResolvesDehradunInternally() throws Exception {
        mockMvc.perform(post("/api/v1/kundli/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequest("Dehradun, Uttarakhand, India")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.profile.latitude").value(30.3165))
                .andExpect(jsonPath("$.data.profile.longitude").value(78.0322))
                .andExpect(jsonPath("$.data.profile.timezone").value("Asia/Kolkata"))
                .andExpect(jsonPath("$.data.calculationMeta.resolvedPlaceName").value("Dehradun"))
                .andExpect(jsonPath("$.data.calculationMeta.latitude").value(30.3165))
                .andExpect(jsonPath("$.data.calculationMeta.longitude").value(78.0322))
                .andExpect(jsonPath("$.data.calculationMeta.timezone").value("Asia/Kolkata"))
                .andExpect(jsonPath("$.data.calculationMeta.timezoneOffset").value(5.5))
                .andExpect(jsonPath("$.data.calculationMeta.ayanamsa").value("LAHIRI"))
                .andExpect(jsonPath("$.data.calculationMeta.calculationMode").value("DUMMY_BACKEND"));
    }

    @Test
    void generateKundliReturnsFriendlyErrorForUnknownPlace() throws Exception {
        mockMvc.perform(post("/api/v1/kundli/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequest("Fake Place")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(
                        "We could not find the birth place coordinates. Please select a valid place and try again."
                ));
    }

    @Test
    void generateKundliAllowsMissingBirthTimeWhenUnknownTimeIsTrue() throws Exception {
        mockMvc.perform(post("/api/v1/kundli/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Reet",
                                  "gender": "female",
                                  "birthDate": "2000-07-23",
                                  "unknownTime": true,
                                  "placeName": "Kolkata"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.profile.birthTime").value("Unknown"));
    }

    private String validRequest(String placeName) {
        return """
                {
                  "name": "Reet",
                  "gender": "female",
                  "birthDate": "2000-07-23",
                  "birthTime": "07:30",
                  "unknownTime": false,
                  "placeName": "%s"
                }
                """.formatted(placeName);
    }
}
