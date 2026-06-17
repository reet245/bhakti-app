package com.bhakti.backend.dto.kundli;

public record PlanetPositionDto(
        String planet,
        String sign,
        String degree,
        Integer house,
        String nakshatra,
        String pada,
        Boolean retrograde,
        Boolean combust
) {
}
