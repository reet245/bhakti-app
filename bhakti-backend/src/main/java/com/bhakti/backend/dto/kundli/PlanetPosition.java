package com.bhakti.backend.dto.kundli;

public record PlanetPosition(
        String name,
        String sign,
        int house,
        String degree,
        boolean retrograde
) {
}
