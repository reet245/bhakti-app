package com.bhakti.backend.dto.kundli;

import java.util.List;

public record KundliGenerateResponse(
        boolean success,
        CalculationMetaDto calculationMeta,
        BirthProfileDto profile,
        PanchangAtBirthDto birthSummary,
        ChartsDto charts,
        List<PlanetPositionDto> planets,
        List<HouseDto> houses,
        DashaDto dasha,
        List<PredictionDto> predictions
) {
}
