package com.bhakti.backend.controller;

import com.bhakti.backend.dto.ApiResponse;
import com.bhakti.backend.service.HoroscopeService;
import com.bhakti.backend.service.HoroscopeService.DailyHoroscope;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/horoscope")
public class HoroscopeController {
    private final HoroscopeService horoscopes;
    public HoroscopeController(HoroscopeService horoscopes) { this.horoscopes = horoscopes; }

    @GetMapping("/daily")
    public ApiResponse<Map<String, DailyHoroscope>> daily(@RequestParam(defaultValue = "en") String language) {
        return ApiResponse.success(horoscopes.daily(language));
    }
}
