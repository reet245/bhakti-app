package com.bhakti.backend.dto.kundli;

import java.util.List;

public record HousePosition(
        int houseNumber,
        String name,
        String sign,
        List<String> planets,
        String meaning
) {
}
