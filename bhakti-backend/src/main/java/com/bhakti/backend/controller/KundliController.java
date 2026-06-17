package com.bhakti.backend.controller;

import com.bhakti.backend.dto.kundli.KundliGenerateRequest;
import com.bhakti.backend.dto.kundli.KundliGenerateResponse;
import com.bhakti.backend.service.KundliService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/kundli")
public class KundliController {

    private static final Logger log = LoggerFactory.getLogger(KundliController.class);

    private final KundliService kundliService;

    public KundliController(KundliService kundliService) {
        this.kundliService = kundliService;
    }

    @PostMapping("/generate")
    public KundliGenerateResponse generateKundli(
            @Valid @RequestBody KundliGenerateRequest request
    ) {
        log.info("Kundli generation request received. birthPlace={} unknownTime={}",
                request.birthPlace(),
                request.unknownTime()
        );
        return kundliService.generateKundli(request);
    }
}
