package com.bhakti.backend.service;

import com.bhakti.backend.dto.kundli.DashaPeriod;
import com.bhakti.backend.dto.kundli.DoshaResult;
import com.bhakti.backend.dto.kundli.HousePosition;
import com.bhakti.backend.dto.kundli.KundliGenerateRequest;
import com.bhakti.backend.dto.kundli.KundliGenerateResponse;
import com.bhakti.backend.dto.kundli.KundliProfile;
import com.bhakti.backend.dto.kundli.KundliSummary;
import com.bhakti.backend.dto.kundli.PlanetPosition;
import com.bhakti.backend.dto.kundli.RemedySuggestion;
import com.bhakti.backend.service.LocationResolutionService.LocationResolution;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class KundliService {

    private static final String DEFAULT_AYANAMSA = "LAHIRI";
    private static final DateTimeFormatter READABLE_DATE =
            DateTimeFormatter.ofPattern("dd MMMM uuuu", Locale.ENGLISH);
    private static final DateTimeFormatter INPUT_TIME = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter READABLE_TIME =
            DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH);

    private final LocationResolutionService locationResolutionService;

    public KundliService(LocationResolutionService locationResolutionService) {
        this.locationResolutionService = locationResolutionService;
    }

    public KundliGenerateResponse generateKundli(KundliGenerateRequest request) {
        boolean unknownTime = Boolean.TRUE.equals(request.unknownTime());
        String birthDate = formatBirthDate(request.birthDate());
        String birthTime = unknownTime ? "Unknown" : formatBirthTime(request.birthTime());
        LocationResolution location = locationResolutionService.resolve(request.placeName());

        /*
         * TODO: Before enabling the paid provider, add strict rate limiting and request
         * deduplication for POST /api/v1/kundli/generate.
         *
         * TODO: Replace the dummy response below with vedAstroClient.generateKundli(request)
         * followed by strict provider-to-Bhakti response mapping.
         */

        KundliProfile profile = new KundliProfile(
                request.name().trim(),
                optionalText(request.gender()),
                birthDate,
                birthTime,
                request.placeName().trim(),
                location.latitude(),
                location.longitude(),
                location.timezone()
        );

        KundliSummary summary = new KundliSummary(
                "Leo",
                "Pisces",
                "Revati",
                "Krishna Paksha Ashtami",
                "Cancer",
                "Pisces",
                DEFAULT_AYANAMSA
        );

        return new KundliGenerateResponse(
                profile,
                summary,
                dummyPlanets(),
                dummyHouses(),
                dummyDoshas(),
                dummyDashas(),
                dummyRemedies(),
                Map.of(
                        "resolvedPlaceName", location.resolvedPlaceName(),
                        "latitude", location.latitude(),
                        "longitude", location.longitude(),
                        "timezone", location.timezone(),
                        "timezoneOffset", location.timezoneOffset(),
                        "ayanamsa", DEFAULT_AYANAMSA,
                        "calculationMode", "DUMMY_BACKEND",
                        "provider", "Dummy",
                        "isLive", false,
                        "calculatedAt", Instant.now().toString()
                )
        );
    }

    private String formatBirthDate(String value) {
        try {
            return LocalDate.parse(value.trim(), DateTimeFormatter.ISO_LOCAL_DATE).format(READABLE_DATE);
        } catch (DateTimeException ex) {
            throw new IllegalArgumentException("Birth date must use yyyy-MM-dd format.");
        }
    }

    private String formatBirthTime(String value) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalArgumentException("Birth time is required when unknown time is false.");
        }

        try {
            return LocalTime.parse(value.trim(), INPUT_TIME).format(READABLE_TIME);
        } catch (DateTimeException ex) {
            throw new IllegalArgumentException("Birth time must use HH:mm format.");
        }
    }

    private String optionalText(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private List<PlanetPosition> dummyPlanets() {
        return List.of(
                new PlanetPosition("Sun", "Cancer", 12, "06\u00B0 25'", false),
                new PlanetPosition("Moon", "Pisces", 8, "18\u00B0 40'", false),
                new PlanetPosition("Mars", "Aries", 9, "14\u00B0 10'", false),
                new PlanetPosition("Mercury", "Leo", 1, "02\u00B0 30'", false),
                new PlanetPosition("Jupiter", "Sagittarius", 5, "21\u00B0 15'", false),
                new PlanetPosition("Venus", "Gemini", 11, "05\u00B0 30'", false),
                new PlanetPosition("Saturn", "Taurus", 10, "27\u00B0 05'", true),
                new PlanetPosition("Rahu", "Aries", 9, "13\u00B0 20'", true),
                new PlanetPosition("Ketu", "Libra", 3, "13\u00B0 20'", true)
        );
    }

    private List<HousePosition> dummyHouses() {
        return List.of(
                new HousePosition(1, "1st House (Lagna)", "Leo", List.of("Mercury"), "Self, body, personality"),
                new HousePosition(2, "2nd House", "Virgo", List.of(), "Wealth, family, speech"),
                new HousePosition(3, "3rd House", "Libra", List.of("Ketu"), "Courage, siblings, efforts"),
                new HousePosition(4, "4th House", "Scorpio", List.of(), "Mother, home, happiness"),
                new HousePosition(5, "5th House", "Sagittarius", List.of("Jupiter"), "Education, children, creativity"),
                new HousePosition(6, "6th House", "Capricorn", List.of(), "Health, enemies, service"),
                new HousePosition(7, "7th House", "Aquarius", List.of(), "Marriage, partnership"),
                new HousePosition(8, "8th House", "Pisces", List.of("Moon"), "Longevity, secrets, transformation"),
                new HousePosition(9, "9th House", "Aries", List.of("Mars", "Rahu"), "Luck, dharma, father"),
                new HousePosition(10, "10th House", "Taurus", List.of("Saturn"), "Career, karma, status"),
                new HousePosition(11, "11th House", "Gemini", List.of("Venus"), "Gains, friends, wishes"),
                new HousePosition(12, "12th House", "Cancer", List.of("Sun"), "Expenses, moksha, foreign land")
        );
    }

    private List<DoshaResult> dummyDoshas() {
        return List.of(
                new DoshaResult(
                        "Mangal Dosha",
                        "Not Detected",
                        "Your chart does not show strong Mangal Dosha."
                ),
                new DoshaResult(
                        "Kaal Sarp Dosha",
                        "Not Detected",
                        "No Kaal Sarp Dosha found in your chart."
                ),
                new DoshaResult(
                        "Pitra Dosha",
                        "Mild",
                        "Some mild indicators are present. Follow remedies with faith and positivity."
                )
        );
    }

    private List<DashaPeriod> dummyDashas() {
        return List.of(
                new DashaPeriod("Current Mahadasha", "Jupiter Mahadasha", "16 May 2023", "16 May 2039"),
                new DashaPeriod("Current Antardasha", "Jupiter / Mercury", "10 Nov 2024", "21 Jul 2026"),
                new DashaPeriod("Upcoming Antardasha", "Jupiter / Ketu", "21 Jul 2026", "02 Aug 2027")
        );
    }

    private List<RemedySuggestion> dummyRemedies() {
        return List.of(
                new RemedySuggestion("Light a diya on Monday", "For good health and positivity"),
                new RemedySuggestion("Offer white flowers", "To Lord Shiva every Monday"),
                new RemedySuggestion("Chant Om Namah Shivaya", "108 times daily"),
                new RemedySuggestion("Donate white items", "On Monday to the needy")
        );
    }
}
