package com.bhakti.backend.controller;

import com.bhakti.backend.dto.ApiResponse;
import com.bhakti.backend.dto.kundli.KundliGenerateRequest;
import com.bhakti.backend.dto.kundli.KundliGenerateResponse;
import com.bhakti.backend.service.KundliService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/kundli")
public class KundliController {

    private final KundliService kundliService;

    public KundliController(KundliService kundliService) {
        this.kundliService = kundliService;
    }

    @PostMapping("/generate")
    public ApiResponse<KundliGenerateResponse> generateKundli(
            @Valid @RequestBody KundliGenerateRequest request
    ) {
        return ApiResponse.success(kundliService.generateKundli(request));
    }
}
