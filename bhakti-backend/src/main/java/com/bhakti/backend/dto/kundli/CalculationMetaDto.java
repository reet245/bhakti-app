package com.bhakti.backend.dto.kundli;

import java.util.List;

public record CalculationMetaDto(
        String provider,
        String ayanamsa,
        String calculatedAt,
        BirthLocationDto birthLocation,
        String precision,
        List<String> warnings
) {
}
