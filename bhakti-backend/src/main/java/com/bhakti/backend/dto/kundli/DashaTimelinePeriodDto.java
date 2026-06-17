package com.bhakti.backend.dto.kundli;

public record DashaTimelinePeriodDto(
        String mahaDasha,
        String antarDasha,
        String startDate,
        String endDate,
        String description
) {
}
