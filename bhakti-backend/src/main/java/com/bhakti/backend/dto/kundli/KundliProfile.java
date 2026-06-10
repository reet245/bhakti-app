package com.bhakti.backend.dto.kundli;

public record KundliProfile(
        String name,
        String gender,
        String birthDate,
        String birthTime,
        String placeName,
        double latitude,
        double longitude,
        String timezone
) {
}
