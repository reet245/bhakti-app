package com.bhakti.backend.service;

import com.bhakti.backend.client.GeocodingClient;
import com.bhakti.backend.util.BoundedCache;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;
import java.time.DateTimeException;
import java.time.ZoneId;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class LocationResolutionService {
    private final GeocodingClient client;
    private final BoundedCache<String, List<LocationResolution>> cache = new BoundedCache<>(512, 24 * 60 * 60_000L);

    public LocationResolutionService(GeocodingClient client) { this.client = client; }

    public List<LocationResolution> search(String query) {
        if (query == null || query.trim().length() < 2 || query.length() > 150
                || query.chars().anyMatch(Character::isISOControl)) {
            throw new IllegalArgumentException("Enter a birthplace between 2 and 150 characters.");
        }
        String clean = query.trim().replaceAll("\\s+", " ");
        return cache.get(clean.toLowerCase(Locale.ROOT), () -> mapResults(client.search(clean)));
    }

    public LocationResolution resolve(String placeName) {
        // Retain the established offline fallbacks; all other places must resolve unambiguously.
        String normalized = placeName.trim().toLowerCase(Locale.ROOT);
        if (List.of("kolkata", "kolkata, india", "kolkata, west bengal, india").contains(normalized)) {
            return new LocationResolution("Kolkata, West Bengal, India", 22.5726, 88.3639, "Asia/Kolkata", 5.5);
        }
        if (List.of("dehradun", "dehradun, india", "dehradun, uttarakhand, india").contains(normalized)) {
            return new LocationResolution("Dehradun, Uttarakhand, India", 30.3165, 78.0322, "Asia/Kolkata", 5.5);
        }
        List<LocationResolution> results = search(placeName);
        if (results.size() == 1) return results.get(0);
        throw new IllegalArgumentException(results.isEmpty()
                ? "Birthplace was not found. Enter coordinates and an IANA timezone manually."
                : "Several places match this name. Select a search result or enter coordinates and timezone manually.");
    }

    private List<LocationResolution> mapResults(JsonNode response) {
        List<LocationResolution> results = new ArrayList<>();
        if (response == null || !response.path("results").isArray()) return List.of();
        for (JsonNode row : response.path("results")) {
            if (results.size() >= 8) break;
            if (!row.path("latitude").isNumber() || !row.path("longitude").isNumber()) continue;
            double lat = row.path("latitude").asDouble();
            double lon = row.path("longitude").asDouble();
            if (!Double.isFinite(lat) || !Double.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;
            String timezone = row.path("timezone").asText("");
            try {
                ZoneId zone = ZoneId.of(timezone);
                String name = Stream.of(row.path("name").asText(""), row.path("admin1").asText(""), row.path("country").asText(""))
                        .filter(value -> !value.isBlank()).distinct().collect(Collectors.joining(", "));
                if (name.isBlank() || name.length() > 200 || name.chars().anyMatch(Character::isISOControl)) continue;
                results.add(new LocationResolution(name, lat, lon, timezone,
                        zone.getRules().getOffset(Instant.now()).getTotalSeconds() / 3600.0));
            } catch (DateTimeException ignored) { /* Discard unusable provider rows. */ }
        }
        return List.copyOf(results);
    }

    /** timezoneOffset is display-only; calculations derive the historic offset from timezone. */
    public record LocationResolution(String resolvedPlaceName, double latitude, double longitude,
                                     String timezone, double timezoneOffset) {}
}
