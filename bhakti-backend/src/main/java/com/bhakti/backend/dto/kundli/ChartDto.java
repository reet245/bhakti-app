package com.bhakti.backend.dto.kundli;

import java.util.List;

public record ChartDto(
        String type,
        String name,
        String style,
        List<HouseDto> houses
) {
}
