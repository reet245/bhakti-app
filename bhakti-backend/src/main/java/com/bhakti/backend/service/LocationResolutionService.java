package com.bhakti.backend.service;

import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class LocationResolutionService {

    private static final String LOCATION_NOT_FOUND_MESSAGE =
            "We could not find the birth place coordinates. Please select a valid place and try again.";

    // TODO: Replace temporary resolver with real geocoding and timezone resolution before VedAstro integration.
    public LocationResolution resolve(String placeName) {
        String normalizedPlaceName = placeName.trim().toLowerCase(Locale.ENGLISH);

        if (matchesCity(normalizedPlaceName, "kolkata")) {
            return new LocationResolution("Kolkata", 22.5726, 88.3639, "Asia/Kolkata", 5.5);
        }
        if (matchesCity(normalizedPlaceName, "dehradun")) {
            return new LocationResolution("Dehradun", 30.3165, 78.0322, "Asia/Kolkata", 5.5);
        }

        throw new IllegalArgumentException(LOCATION_NOT_FOUND_MESSAGE);
    }

    private boolean matchesCity(String placeName, String city) {
        return placeName.equals(city) || placeName.startsWith(city + ",");
    }

    public record LocationResolution(
            String resolvedPlaceName,
            double latitude,
            double longitude,
            String timezone,
            double timezoneOffset
    ) {
    }
}
