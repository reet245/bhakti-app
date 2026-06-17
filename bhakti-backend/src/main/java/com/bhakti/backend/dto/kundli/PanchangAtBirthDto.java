package com.bhakti.backend.dto.kundli;

public record PanchangAtBirthDto(
        String lagna,
        String rashi,
        String nakshatra,
        String nakshatraPada,
        String tithi,
        String karana,
        String yoga,
        String paksha
) {
}
