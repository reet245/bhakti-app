package com.bhakti.backend.controller;

import com.bhakti.backend.dto.ApiResponse;
import com.bhakti.backend.service.LocationResolutionService;
import com.bhakti.backend.service.LocationResolutionService.LocationResolution;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/locations")
public class LocationController {
    private final LocationResolutionService locations;
    public LocationController(LocationResolutionService locations) { this.locations = locations; }

    @GetMapping("/search")
    public ApiResponse<List<LocationResolution>> search(@RequestParam String query) {
        return ApiResponse.success(locations.search(query));
    }
}
