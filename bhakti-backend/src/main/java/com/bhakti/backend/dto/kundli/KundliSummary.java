package com.bhakti.backend.dto.kundli;

public record KundliSummary(
        String lagna,
        String rashi,
        String nakshatra,
        String tithi,
        String sunSign,
        String moonSign,
        String ayanamsa
) {
}
