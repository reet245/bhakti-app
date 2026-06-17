package com.bhakti.backend.dto.kundli;

import java.util.List;

public record DashaDto(
        String system,
        DashaCurrentDto current,
        List<DashaTimelinePeriodDto> timeline
) {
}
