package com.bhakti.backend.dto.kundli;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record KundliGenerateRequest(
        @NotBlank(message = "Name is required.")
        @Size(max = 80, message = "Name must be 80 characters or fewer.")
        String name,

        @NotBlank(message = "Gender is required.")
        @Size(max = 30, message = "Gender must be 30 characters or fewer.")
        String gender,

        @NotBlank(message = "Birth date is required.")
        String birthDate,

        String birthTime,

        @JsonAlias("placeName")
        @NotBlank(message = "Birth place is required.")
        @Size(max = 200, message = "Birth place must be 200 characters or fewer.")
        String birthPlace,

        Double latitude,

        Double longitude,

        String timezone,

        String ayanamsa,

        @NotNull(message = "Unknown time selection is required.")
        Boolean unknownTime
) {
}
