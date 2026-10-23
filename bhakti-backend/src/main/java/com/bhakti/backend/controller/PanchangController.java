package com.bhakti.backend.controller;

import com.bhakti.backend.dto.ApiResponse;
import com.bhakti.backend.dto.panchang.PanchangDailyResponse;
import com.bhakti.backend.service.PanchangService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/panchang")
public class PanchangController {

    private static final Logger log = LoggerFactory.getLogger(PanchangController.class);

    private final PanchangService panchangService;

    public PanchangController(PanchangService panchangService) {
        this.panchangService = panchangService;
    }

    @GetMapping("/daily")
    public ApiResponse<PanchangDailyResponse> getDailyPanchang(
            @RequestParam String date,
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam(defaultValue = "Kolkata, West Bengal, India") String locationName,
            @RequestParam(defaultValue = "Asia/Kolkata") String timezone,
            @RequestParam(defaultValue = "LAHIRI") String ayanamsa
    ) {
        log.debug("Panchang daily request received");

        return ApiResponse.success(panchangService.getDailyPanchang(
                date,
                lat,
                lon,
                locationName,
                timezone,
                ayanamsa
        ));
    }
}
