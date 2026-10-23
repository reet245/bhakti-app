package com.bhakti.backend.service;

import com.bhakti.backend.client.VedAstroClient;
import com.bhakti.backend.dto.kundli.KundliGenerateRequest;
import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class KundliValidationTest {
    private KundliGenerateRequest request(String date, String time, double lat, String timezone) {
        return new KundliGenerateRequest("Test", "Unspecified", date, time, "Example", lat, 13.4,
                timezone, "LAHIRI", false);
    }

    @Test
    void rejectsFutureDateNonFiniteCoordinateAndInvalidTimeBeforeProviderWork() {
        var client = mock(VedAstroClient.class);
        var resolver = mock(LocationResolutionService.class);
        var service = new KundliService(client, resolver);
        assertThatThrownBy(() -> service.generateKundli(request(LocalDate.now().plusDays(3).toString(), "12:00", 52, "Europe/Berlin")))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("future");
        assertThatThrownBy(() -> service.generateKundli(request("2000-01-01", "12:00", Double.NaN, "Europe/Berlin")))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.generateKundli(request("2000-01-01", "24:00", 52, "Europe/Berlin")))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("HH:mm");
        verifyNoInteractions(client, resolver);
    }

    @Test
    void requiresExplicitOffsetForDstGapOrOverlapInsteadOfSilentlyChangingBirthTime() {
        var client = mock(VedAstroClient.class);
        var service = new KundliService(client, mock(LocationResolutionService.class));
        assertThatThrownBy(() -> service.generateKundli(request("2024-03-10", "02:30", 40.7, "America/New_York")))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("daylight saving");
        assertThatThrownBy(() -> service.generateKundli(request("2024-11-03", "01:30", 40.7, "America/New_York")))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("daylight saving");
        verifyNoInteractions(client);
    }
}
