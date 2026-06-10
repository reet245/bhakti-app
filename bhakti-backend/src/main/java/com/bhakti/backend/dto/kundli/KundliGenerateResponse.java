package com.bhakti.backend.dto.kundli;

import java.util.List;
import java.util.Map;

public record KundliGenerateResponse(
        KundliProfile profile,
        KundliSummary summary,
        List<PlanetPosition> planets,
        List<HousePosition> houses,
        List<DoshaResult> doshas,
        List<DashaPeriod> dashas,
        List<RemedySuggestion> remedies,
        Map<String, Object> calculationMeta
) {
}
