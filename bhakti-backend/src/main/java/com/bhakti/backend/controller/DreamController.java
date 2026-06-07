package com.bhakti.backend.controller;

import com.bhakti.backend.dto.ApiResponse;
import com.bhakti.backend.dto.DreamInterpretRequest;
import com.bhakti.backend.dto.DreamInterpretResponse;
import com.bhakti.backend.service.DreamService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dream")
public class DreamController {

    private static final Logger log = LoggerFactory.getLogger(DreamController.class);

    private final DreamService dreamService;

    public DreamController(DreamService dreamService) {
        this.dreamService = dreamService;
    }

    @PostMapping("/interpret")
    public ApiResponse<DreamInterpretResponse> interpretDream(@Valid @RequestBody DreamInterpretRequest request) {
        log.info("Dream interpretation request received");
        return ApiResponse.success(dreamService.interpretDream(request));
    }
}
