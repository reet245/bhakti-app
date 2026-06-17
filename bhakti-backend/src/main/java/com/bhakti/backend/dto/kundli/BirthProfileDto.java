package com.bhakti.backend.dto.kundli;

public record BirthProfileDto(
        String name,
        String gender,
        String birthDate,
        String birthTime,
        String birthPlace
) {
}
