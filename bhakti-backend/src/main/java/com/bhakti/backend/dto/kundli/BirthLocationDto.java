package com.bhakti.backend.dto.kundli;

public record BirthLocationDto(
        String name,
        double latitude,
        double longitude,
        String timezone
) {
}
