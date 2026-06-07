package com.bhakti.backend.service;

import com.bhakti.backend.client.DreamApiClient;
import com.bhakti.backend.dto.DreamInterpretRequest;
import com.bhakti.backend.dto.DreamInterpretResponse;
import com.bhakti.backend.exception.ExternalApiException;
import com.bhakti.backend.util.AiResponseCleaner;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class DreamService {

    private final DreamApiClient dreamApiClient;

    public DreamService(DreamApiClient dreamApiClient) {
        this.dreamApiClient = dreamApiClient;
    }

    public DreamInterpretResponse interpretDream(DreamInterpretRequest request) {
        if (request == null || !StringUtils.hasText(request.dreamText())) {
            throw new IllegalArgumentException("Dream text is required.");
        }

        String prompt = buildPrompt(request);
        String rawInterpretation = dreamApiClient.interpretDream(prompt);
        String cleanInterpretation = AiResponseCleaner.removeThinkingTags(rawInterpretation);

        if (!StringUtils.hasText(cleanInterpretation)) {
            throw new ExternalApiException("Dream interpretation service returned an empty response.");
        }

        return new DreamInterpretResponse(cleanInterpretation);
    }

    private String buildPrompt(DreamInterpretRequest request) {
        return """
                You are creating a dream interpretation for Bhakti, a Hindu devotional app.

                Instructions:
                - Give only the final interpretation.
                - Do not include <think> tags.
                - Do not show internal reasoning.
                - Use a calm devotional tone suitable for a Hindu devotional app named Bhakti.
                - Do not make fake astrology or planetary claims unless real calculated astrology data is provided.
                - Treat date, time, and location as context only.
                - Use phrases like "may indicate", "could represent", and "spiritually it may suggest".
                - Do not guarantee future predictions.
                - Include a gentle disclaimer.

                Dream:
                %s

                Context:
                Date: %s
                Time: %s
                Location: %s
                Language: %s
                """.formatted(
                request.dreamText().trim(),
                optionalValue(request.date()),
                optionalValue(request.time()),
                optionalValue(request.location()),
                optionalValue(request.language())
        );
    }

    private String optionalValue(String value) {
        return StringUtils.hasText(value) ? value.trim() : "Not provided";
    }
}
