package com.bhakti.backend.dto.panchang;

public record PanchangDailyResponse(
        String date,
        String locationName,
        double latitude,
        double longitude,
        String timezone,
        String tithiName,
        String paksha,
        String lunarMonth,
        String vara,
        String nakshatra,
        String yogaName,
        String yogaDescription,
        String karana,
        String horaLord,
        String dishaShool,
        String sunrise,
        String sunset,
        String ayanamsa,
        String ishtaKaala,
        String source,
        boolean isRealData
) {
}
