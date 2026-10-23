package com.bhakti.backend.service;

import com.bhakti.backend.client.VedAstroClient;
import com.bhakti.backend.client.VedAstroClient.VedAstroBirthData;
import com.bhakti.backend.dto.kundli.BirthLocationDto;
import com.bhakti.backend.dto.kundli.BirthProfileDto;
import com.bhakti.backend.dto.kundli.CalculationMetaDto;
import com.bhakti.backend.dto.kundli.ChartDto;
import com.bhakti.backend.dto.kundli.ChartSvgDto;
import com.bhakti.backend.dto.kundli.ChartsDto;
import com.bhakti.backend.dto.kundli.DashaCurrentDto;
import com.bhakti.backend.dto.kundli.DashaDto;
import com.bhakti.backend.dto.kundli.DashaTimelinePeriodDto;
import com.bhakti.backend.dto.kundli.HouseDto;
import com.bhakti.backend.dto.kundli.KundliGenerateRequest;
import com.bhakti.backend.dto.kundli.KundliGenerateResponse;
import com.bhakti.backend.dto.kundli.PanchangAtBirthDto;
import com.bhakti.backend.dto.kundli.PlanetPositionDto;
import com.bhakti.backend.dto.kundli.PredictionDto;
import com.bhakti.backend.exception.ExternalApiException;
import com.bhakti.backend.util.ProviderRequestBudget;
import com.bhakti.backend.service.LocationResolutionService.LocationResolution;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class KundliService {

    private static final Logger log = LoggerFactory.getLogger(KundliService.class);

    private static final String DEFAULT_AYANAMSA = "LAHIRI";
    private static final String PROVIDER = "VedAstro";
    private static final String PRECISE = "ACCURATE";
    private static final String UNKNOWN_TIME_PRECISION = "APPROXIMATE_UNKNOWN_BIRTH_TIME";
    private static final String CHART_STYLE = "NORTH_INDIAN";
    private static final Pattern TIMEZONE_OFFSET = Pattern.compile("^[+-](\\d{2}):(\\d{2})$");
    private static final Pattern HOUSE_NUMBER = Pattern.compile("(\\d+)");
    private static final DateTimeFormatter INPUT_TIME = DateTimeFormatter.ofPattern("HH:mm")
            .withResolverStyle(java.time.format.ResolverStyle.STRICT);
    private static final DateTimeFormatter PROFILE_DATE = DateTimeFormatter.ofPattern("dd MMM uuuu", Locale.ENGLISH);
    private static final DateTimeFormatter VEDASTRO_DATE = DateTimeFormatter.ofPattern("dd/MM/uuuu");

    private static final Map<String, String> SIGN_LORDS = Map.ofEntries(
            Map.entry("Aries", "Mars"),
            Map.entry("Taurus", "Venus"),
            Map.entry("Gemini", "Mercury"),
            Map.entry("Cancer", "Moon"),
            Map.entry("Leo", "Sun"),
            Map.entry("Virgo", "Mercury"),
            Map.entry("Libra", "Venus"),
            Map.entry("Scorpio", "Mars"),
            Map.entry("Sagittarius", "Jupiter"),
            Map.entry("Capricorn", "Saturn"),
            Map.entry("Aquarius", "Saturn"),
            Map.entry("Pisces", "Jupiter")
    );

    private final VedAstroClient vedAstroClient;
    private final LocationResolutionService locationResolutionService;

    public KundliService(VedAstroClient vedAstroClient, LocationResolutionService locationResolutionService) {
        this.vedAstroClient = vedAstroClient;
        this.locationResolutionService = locationResolutionService;
    }

    public KundliGenerateResponse generateKundli(KundliGenerateRequest request) {
        return ProviderRequestBudget.within(25000, () -> calculateKundli(request));
    }

    private KundliGenerateResponse calculateKundli(KundliGenerateRequest request) {
        List<String> warnings = new ArrayList<>();
        BirthInput birthInput = validateAndNormalize(request, warnings);
        VedAstroBirthData vedAstroBirthData = new VedAstroBirthData(
                birthInput.stdTime(),
                birthInput.birthPlace(),
                birthInput.latitude(),
                birthInput.longitude(),
                birthInput.ayanamsa()
        );

        Map<String, JsonNode> generalData = vedAstroClient.fetchGeneralAstroData(vedAstroBirthData);
        JsonNode planetData = vedAstroClient.fetchPlanetData(vedAstroBirthData);
        Map<String, JsonNode> houseData = vedAstroClient.fetchHouseData(vedAstroBirthData);

        PanchangAtBirthDto birthSummary = mapBirthSummary(generalData, warnings);
        List<HouseDto> d1Houses = mapHouses(houseData.get("d1"), "AllHouseRasiSigns", List.of(), warnings);
        List<PlanetPositionDto> planets = mapPlanets(planetData, d1Houses, warnings);
        d1Houses = attachPlanetsToHouses(d1Houses, planets);
        List<HouseDto> d9Houses = mapHouses(houseData.get("d9"), "AllHouseNavamshaSign", List.of(), warnings);

        DashaDto dasha;
        List<PredictionDto> predictions;
        if (birthInput.unknownTime()) {
            warnings.add("Birth time was not provided. Dasha and prediction sections are hidden because they are time-sensitive.");
            dasha = emptyDasha();
            predictions = List.of();
        } else {
            dasha = fetchAndMapDasha(vedAstroBirthData, birthInput, warnings);
            predictions = fetchAndMapPredictions(vedAstroBirthData, warnings);
        }

        ChartsDto charts = new ChartsDto(
                new ChartDto("D1", "Rashi Chart", CHART_STYLE, d1Houses),
                new ChartDto("D9", "Navamsha Chart", CHART_STYLE, d9Houses),
                new ChartSvgDto(null, null)
        );

        CalculationMetaDto calculationMeta = new CalculationMetaDto(
                PROVIDER,
                birthInput.ayanamsa(),
                Instant.now().toString(),
                new BirthLocationDto(
                        birthInput.birthPlace(),
                        birthInput.latitude(),
                        birthInput.longitude(),
                        birthInput.timezoneOffset()
                ),
                birthInput.unknownTime() ? UNKNOWN_TIME_PRECISION : PRECISE,
                List.copyOf(warnings)
        );

        BirthProfileDto profile = new BirthProfileDto(
                birthInput.name(),
                birthInput.gender(),
                birthInput.birthDate().format(PROFILE_DATE),
                birthInput.unknownTime() ? "Unknown" : birthInput.birthTime().format(INPUT_TIME),
                birthInput.birthPlace()
        );

        return new KundliGenerateResponse(
                true,
                calculationMeta,
                profile,
                birthSummary,
                charts,
                planets,
                d1Houses,
                dasha,
                predictions
        );
    }

    private BirthInput validateAndNormalize(KundliGenerateRequest request, List<String> warnings) {
        String name = requiredText(request.name(), "Name is required.");
        String gender = requiredText(request.gender(), "Gender is required.");
        String birthPlace = requiredText(request.birthPlace(), "Birth place is required.");
        LocalDate birthDate = parseBirthDate(request.birthDate());
        boolean unknownTime = Boolean.TRUE.equals(request.unknownTime());
        LocalTime birthTime = unknownTime ? LocalTime.NOON : parseBirthTime(request.birthTime());
        String ayanamsa = normalizeAyanamsa(request.ayanamsa());
        LocationInput location = resolveLocation(request, birthPlace, birthDate, birthTime);
        if (birthDate.isAfter(LocalDate.now(ZoneOffset.of(location.timezoneOffset())))) {
            throw new IllegalArgumentException("Birth date cannot be in the future.");
        }

        if (unknownTime) {
            warnings.add("Birth time is unknown. Calculations use 12:00 local time and may be approximate.");
        }

        String stdTime = birthTime.format(INPUT_TIME) + " " + birthDate.format(VEDASTRO_DATE) + " "
                + location.timezoneOffset();

        return new BirthInput(
                name,
                gender,
                birthDate,
                birthTime,
                birthPlace,
                location.latitude(),
                location.longitude(),
                location.timezoneOffset(),
                ayanamsa,
                unknownTime,
                stdTime
        );
    }

    private LocationInput resolveLocation(
            KundliGenerateRequest request,
            String birthPlace,
            LocalDate birthDate,
            LocalTime birthTime
    ) {
        boolean hasLatitude = request.latitude() != null;
        boolean hasLongitude = request.longitude() != null;
        boolean hasTimezone = StringUtils.hasText(request.timezone());

        if (hasLatitude || hasLongitude || hasTimezone) {
            if (!hasLatitude || !hasLongitude || !hasTimezone) {
                throw new IllegalArgumentException("Latitude, longitude, and timezone must be provided together.");
            }

            validateCoordinates(request.latitude(), request.longitude());
            return new LocationInput(
                    request.latitude(),
                    request.longitude(),
                    normalizeTimezoneOffset(request.timezone(), birthDate, birthTime)
            );
        }

        LocationResolution resolution = locationResolutionService.resolve(birthPlace);
        validateCoordinates(resolution.latitude(), resolution.longitude());
        return new LocationInput(
                resolution.latitude(),
                resolution.longitude(),
                normalizeTimezoneOffset(resolution.timezone(), birthDate, birthTime, resolution.timezoneOffset())
        );
    }

    private LocalDate parseBirthDate(String value) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalArgumentException("Birth date is required.");
        }

        try {
            LocalDate date = LocalDate.parse(value.trim(), DateTimeFormatter.ISO_LOCAL_DATE);
            if (date.isAfter(LocalDate.now(ZoneOffset.UTC).plusDays(1))) {
                throw new IllegalArgumentException("Birth date cannot be in the future.");
            }
            if (date.getYear() < 1900) throw new IllegalArgumentException("Birth date must be in 1900 or later.");
            return date;
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("Birth date must use yyyy-MM-dd format.");
        }
    }

    private LocalTime parseBirthTime(String value) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalArgumentException("Birth time is required when unknown time is false.");
        }

        try {
            return LocalTime.parse(value.trim(), INPUT_TIME);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("Birth time must use HH:mm format.");
        }
    }

    private String requiredText(String value, String message) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalArgumentException(message);
        }

        String clean = value.trim();
        if (clean.length() > 200 || clean.chars().anyMatch(Character::isISOControl)) {
            throw new IllegalArgumentException("Text fields must be 200 characters or fewer without control characters.");
        }
        return clean;
    }

    private String normalizeAyanamsa(String value) {
        String ayanamsa = StringUtils.hasText(value) ? value.trim() : DEFAULT_AYANAMSA;
        String normalized = ayanamsa.replace('-', '_').replace(' ', '_').toUpperCase(Locale.ENGLISH);

        if (!DEFAULT_AYANAMSA.equals(normalized)) {
            throw new IllegalArgumentException("Only the LAHIRI ayanamsa is currently supported.");
        }

        return normalized;
    }

    private void validateCoordinates(double latitude, double longitude) {
        if (!Double.isFinite(latitude) || latitude < -90 || latitude > 90) {
            throw new IllegalArgumentException("Latitude must be between -90 and 90.");
        }

        if (!Double.isFinite(longitude) || longitude < -180 || longitude > 180) {
            throw new IllegalArgumentException("Longitude must be between -180 and 180.");
        }
    }

    private String normalizeTimezoneOffset(String value, LocalDate birthDate, LocalTime birthTime) {
        return normalizeTimezoneOffset(value, birthDate, birthTime, null);
    }

    private String normalizeTimezoneOffset(String value, LocalDate birthDate, LocalTime birthTime, Double fallbackOffset) {
        if (StringUtils.hasText(value)) {
            String trimmed = value.trim();
            Matcher matcher = TIMEZONE_OFFSET.matcher(trimmed);
            if (matcher.matches()) {
                int hours = Integer.parseInt(matcher.group(1));
                int minutes = Integer.parseInt(matcher.group(2));
                if (hours <= 14 && minutes <= 59 && (hours != 14 || minutes == 0)) {
                    return trimmed;
                }
                throw new IllegalArgumentException("Timezone offset must be between -14:00 and +14:00.");
            }

            try {
                ZoneId zone = ZoneId.of(trimmed);
                var offsets = zone.getRules().getValidOffsets(birthDate.atTime(birthTime));
                if (offsets.size() != 1) {
                    throw new IllegalArgumentException("Birth time is ambiguous or does not exist due to daylight saving. Supply the correct UTC offset.");
                }
                ZoneOffset offset = offsets.get(0);
                String id = offset.getId();
                return "Z".equals(id) ? "+00:00" : id;
            } catch (DateTimeException ignored) {
                // Fall through to numeric fallback or validation error.
            }
        }

        if (fallbackOffset != null) {
            return offsetHoursToString(fallbackOffset);
        }

        throw new IllegalArgumentException("Timezone must be an offset like +05:30 or a valid timezone ID.");
    }

    private String offsetHoursToString(double offsetHours) {
        int totalMinutes = (int) Math.round(offsetHours * 60);
        char sign = totalMinutes < 0 ? '-' : '+';
        int absoluteMinutes = Math.abs(totalMinutes);
        int hours = absoluteMinutes / 60;
        int minutes = absoluteMinutes % 60;

        return String.format(Locale.ENGLISH, "%c%02d:%02d", sign, hours, minutes);
    }

    private PanchangAtBirthDto mapBirthSummary(Map<String, JsonNode> generalData, List<String> warnings) {
        String lagna = textPayload(generalData.get("LagnaSignName"), "LagnaSignName");
        String rashi = textPayload(generalData.get("MoonSignName"), "MoonSignName");
        String moonConstellation = textPayload(generalData.get("MoonConstellation"), "MoonConstellation");
        NakshatraParts nakshatraParts = splitNakshatra(moonConstellation);
        JsonNode lunarDay = payload(generalData.get("LunarDay"), "LunarDay");
        JsonNode yoga = payload(generalData.get("NithyaYoga"), "NithyaYoga");

        String tithi = clean(nodeText(lunarDay, "Name"));
        String paksha = normalizePaksha(nodeText(lunarDay, "Paksha"));

        if (!StringUtils.hasText(lagna) && !StringUtils.hasText(rashi) && !StringUtils.hasText(tithi)) {
            warnings.add("VedAstro returned an incomplete birth summary.");
        }

        return new PanchangAtBirthDto(
                lagna,
                rashi,
                nakshatraParts.name(),
                nakshatraParts.pada(),
                tithi,
                textPayload(generalData.get("Karana"), "Karana"),
                firstText(nodeText(yoga, "Name"), textPayload(generalData.get("NithyaYoga"), "NithyaYoga")),
                paksha,
                firstText(nodeText(payload(generalData.get("SunSign"), "SunSign"), "Name"),
                        textPayload(generalData.get("SunSign"), "SunSign"))
        );
    }

    private List<PlanetPositionDto> mapPlanets(JsonNode planetResponse, List<HouseDto> houses, List<String> warnings) {
        JsonNode payload = payload(planetResponse, "AllPlanetRasiSigns");
        if (!payload.isArray()) {
            warnings.add("VedAstro did not return planet position rows.");
            return List.of();
        }

        Map<String, Integer> houseBySign = houses.stream()
                .filter(house -> StringUtils.hasText(house.sign()))
                .collect(Collectors.toMap(HouseDto::sign, HouseDto::house, (first, ignored) -> first));
        List<PlanetPositionDto> planets = new ArrayList<>();

        for (JsonNode row : payload) {
            String planet = clean(nodeText(row, "Planet"));
            SignDegree signDegree = splitSignDegree(nodeText(row, "AllPlanetRasiSigns"));
            if (!StringUtils.hasText(planet)) {
                continue;
            }

            planets.add(new PlanetPositionDto(
                    planet,
                    signDegree.sign(),
                    signDegree.degree(),
                    houseBySign.get(signDegree.sign()),
                    null,
                    null,
                    null,
                    null
            ));
        }

        if (planets.isEmpty()) {
            warnings.add("VedAstro planet data was empty.");
        }

        return planets;
    }

    private List<HouseDto> mapHouses(
            JsonNode houseResponse,
            String methodName,
            List<PlanetPositionDto> planets,
            List<String> warnings
    ) {
        JsonNode payload = payload(houseResponse, methodName);
        if (!payload.isArray()) {
            warnings.add("VedAstro did not return " + methodName + " rows.");
            return List.of();
        }

        List<HouseDto> houses = new ArrayList<>();
        for (JsonNode row : payload) {
            int houseNumber = parseHouseNumber(nodeText(row, "House"));
            if (houseNumber < 1 || houseNumber > 12) {
                continue;
            }

            SignDegree signDegree = splitSignDegree(nodeText(row, methodName));
            String sign = signDegree.sign();
            houses.add(new HouseDto(houseNumber, sign, SIGN_LORDS.get(sign), planetsInHouse(planets, houseNumber)));
        }

        houses.sort(Comparator.comparingInt(HouseDto::house));
        if (houses.isEmpty()) {
            warnings.add("VedAstro " + methodName + " data was empty.");
        }

        return houses;
    }

    private List<HouseDto> attachPlanetsToHouses(List<HouseDto> houses, List<PlanetPositionDto> planets) {
        return houses.stream()
                .map(house -> new HouseDto(
                        house.house(),
                        house.sign(),
                        house.lord(),
                        planetsInHouse(planets, house.house())
                ))
                .toList();
    }

    private List<String> planetsInHouse(List<PlanetPositionDto> planets, int houseNumber) {
        return planets.stream()
                .filter(planet -> planet.house() != null && planet.house() == houseNumber)
                .map(PlanetPositionDto::planet)
                .toList();
    }

    private DashaDto fetchAndMapDasha(VedAstroBirthData vedAstroBirthData, BirthInput birthInput, List<String> warnings) {
        LocalDate startDate = LocalDate.now();
        String startStdTime = "00:00 " + startDate.format(VEDASTRO_DATE) + " " + birthInput.timezoneOffset();
        String endStdTime = "23:59 " + startDate.plusYears(10).format(VEDASTRO_DATE) + " " + birthInput.timezoneOffset();

        try {
            JsonNode dashaResponse = vedAstroClient.fetchDasha(vedAstroBirthData, startStdTime, endStdTime);
            return mapDasha(dashaResponse, warnings);
        } catch (ExternalApiException ex) {
            log.warn("Kundli dasha section could not be calculated.");
            warnings.add("Dasha section could not be calculated by VedAstro.");
            return emptyDasha();
        }
    }

    private DashaDto mapDasha(JsonNode dashaResponse, List<String> warnings) {
        JsonNode payload = payload(dashaResponse, "DasaAtRange");
        if (!payload.isObject()) {
            warnings.add("VedAstro returned an unrecognized dasha response.");
            return emptyDasha();
        }

        List<DashaTimelinePeriodDto> timeline = new ArrayList<>();
        Iterator<Map.Entry<String, JsonNode>> fields = payload.fields();
        while (fields.hasNext() && timeline.size() < 24) {
            Map.Entry<String, JsonNode> field = fields.next();
            JsonNode period = field.getValue();
            String mahaDasha = firstText(nodeText(period, "Lord"), field.getKey());
            timeline.add(new DashaTimelinePeriodDto(
                    mahaDasha,
                    null,
                    clean(nodeText(period, "Start")),
                    clean(nodeText(period, "End")),
                    clean(nodeText(period, "Description"))
            ));

            JsonNode subDasas = childIgnoreCase(period, "SubDasas");
            if (subDasas != null && subDasas.isObject()) {
                Iterator<Map.Entry<String, JsonNode>> subFields = subDasas.fields();
                while (subFields.hasNext() && timeline.size() < 24) {
                    Map.Entry<String, JsonNode> subField = subFields.next();
                    JsonNode subPeriod = subField.getValue();
                    timeline.add(new DashaTimelinePeriodDto(
                            mahaDasha,
                            firstText(nodeText(subPeriod, "Lord"), subField.getKey()),
                            clean(nodeText(subPeriod, "Start")),
                            clean(nodeText(subPeriod, "End")),
                            clean(nodeText(subPeriod, "Description"))
                    ));
                }
            }
        }

        if (timeline.isEmpty()) {
            warnings.add("VedAstro dasha timeline was empty.");
            return emptyDasha();
        }

        DashaTimelinePeriodDto first = timeline.get(0);
        DashaCurrentDto current = new DashaCurrentDto(
                first.mahaDasha(),
                first.antarDasha(),
                first.startDate(),
                first.endDate()
        );

        return new DashaDto("Vimshottari", current, List.copyOf(timeline));
    }

    private DashaDto emptyDasha() {
        return new DashaDto("Vimshottari", new DashaCurrentDto(null, null, null, null), List.of());
    }

    private List<PredictionDto> fetchAndMapPredictions(VedAstroBirthData vedAstroBirthData, List<String> warnings) {
        try {
            JsonNode predictionResponse = vedAstroClient.fetchPredictions(vedAstroBirthData);
            return mapPredictions(predictionResponse, warnings);
        } catch (ExternalApiException ex) {
            log.warn("Kundli predictions section could not be calculated.");
            warnings.add("Predictions section could not be calculated by VedAstro.");
            return List.of();
        }
    }

    private List<PredictionDto> mapPredictions(JsonNode predictionResponse, List<String> warnings) {
        JsonNode payload = payload(predictionResponse, "HoroscopePredictions");
        if (!payload.isArray()) {
            warnings.add("VedAstro returned an unrecognized predictions response.");
            return List.of();
        }

        List<PredictionDto> predictions = new ArrayList<>();
        int skippedMedical = 0;
        for (JsonNode row : payload) {
            if (hasTag(row, "MedicalAstrology")) {
                skippedMedical++;
                continue;
            }

            String text = clean(nodeText(row, "Description"));
            if (!StringUtils.hasText(text)) {
                continue;
            }

            predictions.add(new PredictionDto(
                    firstTag(row),
                    titleFromName(nodeText(row, "Name")),
                    text
            ));

            if (predictions.size() == 6) {
                break;
            }
        }

        if (predictions.isEmpty() && skippedMedical > 0) {
            warnings.add("Provider predictions were medical-only and were hidden from the Kundli response.");
        }

        return List.copyOf(predictions);
    }

    private boolean hasTag(JsonNode row, String tag) {
        JsonNode tags = childIgnoreCase(row, "Tags");
        if (tags == null || !tags.isArray()) {
            return false;
        }

        for (JsonNode item : tags) {
            if (tag.equalsIgnoreCase(item.asText())) {
                return true;
            }
        }

        return false;
    }

    private String firstTag(JsonNode row) {
        JsonNode tags = childIgnoreCase(row, "Tags");
        if (tags != null && tags.isArray() && tags.size() > 0) {
            return clean(tags.get(0).asText(null));
        }

        return "General";
    }

    private String titleFromName(String value) {
        String cleanValue = clean(value);
        if (!StringUtils.hasText(cleanValue)) {
            return null;
        }

        String afterUnderscore = cleanValue.contains("_")
                ? cleanValue.substring(cleanValue.indexOf('_') + 1)
                : cleanValue;

        return afterUnderscore.replaceAll("([a-z])([A-Z])", "$1 $2")
                .replace('_', ' ')
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String textPayload(JsonNode response, String methodName) {
        JsonNode payload = payload(response, methodName);
        if (payload.isValueNode()) {
            return clean(payload.asText(null));
        }

        return clean(nodeText(payload, methodName));
    }

    private JsonNode payload(JsonNode response, String methodName) {
        if (response == null || response.isMissingNode() || response.isNull()) {
            return emptyNode();
        }

        JsonNode payload = childIgnoreCase(response, "Payload");
        if (payload == null || payload.isMissingNode() || payload.isNull()) {
            return response;
        }

        JsonNode methodPayload = childIgnoreCase(payload, methodName);
        return methodPayload == null || methodPayload.isMissingNode() ? payload : methodPayload;
    }

    private JsonNode emptyNode() {
        return com.fasterxml.jackson.databind.node.MissingNode.getInstance();
    }

    private JsonNode childIgnoreCase(JsonNode node, String fieldName) {
        if (node == null || !node.isObject()) {
            return null;
        }

        Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> field = fields.next();
            if (field.getKey().equalsIgnoreCase(fieldName)) {
                return field.getValue();
            }
        }

        return null;
    }

    private String nodeText(JsonNode node, String fieldName) {
        JsonNode child = childIgnoreCase(node, fieldName);
        if (child == null || child.isMissingNode() || child.isNull() || !child.isValueNode()) {
            return null;
        }

        return clean(child.asText(null));
    }

    private SignDegree splitSignDegree(String value) {
        String cleanValue = clean(value);
        if (!StringUtils.hasText(cleanValue)) {
            return new SignDegree(null, null);
        }

        String[] pieces = cleanValue.split(":", 2);
        if (pieces.length == 1) {
            return new SignDegree(clean(pieces[0]), null);
        }

        return new SignDegree(clean(pieces[0]), clean(pieces[1]));
    }

    private NakshatraParts splitNakshatra(String value) {
        String cleanValue = clean(value);
        if (!StringUtils.hasText(cleanValue)) {
            return new NakshatraParts(null, null);
        }

        String[] pieces = cleanValue.split("\\s+-\\s+", 2);
        return new NakshatraParts(clean(pieces[0]), pieces.length > 1 ? clean(pieces[1]) : null);
    }

    private int parseHouseNumber(String value) {
        if (!StringUtils.hasText(value)) {
            return -1;
        }

        Matcher matcher = HOUSE_NUMBER.matcher(value);
        if (!matcher.find()) {
            return -1;
        }

        try { return Integer.parseInt(matcher.group(1)); }
        catch (NumberFormatException ex) { return -1; }
    }

    private String normalizePaksha(String value) {
        String cleanValue = clean(value);
        if (!StringUtils.hasText(cleanValue)) {
            return null;
        }

        if (cleanValue.toLowerCase(Locale.ENGLISH).contains("paksha")) {
            return cleanValue;
        }

        return cleanValue + " Paksha";
    }

    private String firstText(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value;
            }
        }

        return null;
    }

    private String clean(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        return value
                .replace("\u00C2\u00B0", "\u00B0")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private record BirthInput(
            String name,
            String gender,
            LocalDate birthDate,
            LocalTime birthTime,
            String birthPlace,
            double latitude,
            double longitude,
            String timezoneOffset,
            String ayanamsa,
            boolean unknownTime,
            String stdTime
    ) {
    }

    private record LocationInput(double latitude, double longitude, String timezoneOffset) {
    }

    private record SignDegree(String sign, String degree) {
    }

    private record NakshatraParts(String name, String pada) {
    }
}
