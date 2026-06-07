package com.bhakti.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DreamInterpretRequest(
        @NotBlank(message = "Dream text is required.")
        @Size(max = 2000, message = "Dream text must be 2000 characters or fewer.")
        String dreamText,

        @Size(max = 100, message = "Date must be 100 characters or fewer.")
        String date,

        @Size(max = 100, message = "Time must be 100 characters or fewer.")
        String time,

        @Size(max = 200, message = "Location must be 200 characters or fewer.")
        String location,

        @Size(max = 50, message = "Language must be 50 characters or fewer.")
        String language
) {
}
