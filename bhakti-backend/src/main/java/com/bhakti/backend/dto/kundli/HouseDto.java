package com.bhakti.backend.dto.kundli;

import java.util.List;

public record HouseDto(
        int house,
        String sign,
        String lord,
        List<String> planets
) {
}
