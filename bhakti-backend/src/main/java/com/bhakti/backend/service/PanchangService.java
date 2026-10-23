package com.bhakti.backend.service;

import com.bhakti.backend.client.VedAstroClient;
import com.bhakti.backend.dto.panchang.PanchangDailyResponse;
import com.bhakti.backend.exception.ExternalApiException;
import com.bhakti.backend.util.BoundedCache;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

@Service
public class PanchangService {

    private static final String DEFAULT_LOCATION_NAME = "Kolkata, West Bengal, India";
    private static final String DEFAULT_TIMEZONE = "Asia/Kolkata";
    private static final String DEFAULT_AYANAMSA = "LAHIRI";
    private static final String SOURCE = "VEDASTRO";
    private static final DateTimeFormatter VEDASTRO_DATE = DateTimeFormatter.ofPattern("dd/MM/uuuu");

    private final VedAstroClient vedAstroClient;
    private final BoundedCache<CacheKey, PanchangDailyResponse> cache = new BoundedCache<>(512, 15 * 60_000L);

    public PanchangService(VedAstroClient vedAstroClient) {
        this.vedAstroClient = vedAstroClient;
    }

    public PanchangDailyResponse getDailyPanchang(
            String date,
            double latitude,
            double longitude,
            String locationName,
            String timezone,
            String ayanamsa
    ) {
        LocalDate localDate = parseDate(date);
        validateCoordinates(latitude, longitude);

        String cleanLocationName = optionalText(locationName, DEFAULT_LOCATION_NAME);
        String cleanTimezone = optionalText(timezone, DEFAULT_TIMEZONE);
        String cleanAyanamsa = optionalText(ayanamsa, DEFAULT_AYANAMSA).toUpperCase(Locale.ENGLISH);
        if (cleanLocationName.length() > 200 || cleanLocationName.chars().anyMatch(Character::isISOControl)) {
            throw new IllegalArgumentException("Location name must be 200 characters or fewer without control characters.");
        }
        if (!DEFAULT_AYANAMSA.equals(cleanAyanamsa)) {
            throw new IllegalArgumentException("Only the LAHIRI ayanamsa is currently supported.");
        }
        ZoneId zone;
        try {
            zone = ZoneId.of(cleanTimezone);
        } catch (DateTimeException ex) {
            throw new IllegalArgumentException("Timezone must be a valid IANA timezone ID or UTC offset.");
        }
        ZoneOffset offset = localDate.atTime(6, 0).atZone(zone).getOffset();
        String offsetId = offset.equals(ZoneOffset.UTC) ? "+00:00" : offset.getId();
        String stdTime = "06:00 " + localDate.format(VEDASTRO_DATE) + " " + offsetId;
        CacheKey key = new CacheKey(localDate, latitude, longitude, cleanLocationName, cleanTimezone, cleanAyanamsa);
        return cache.get(key, () -> fetchDaily(localDate, latitude, longitude, cleanLocationName,
                cleanTimezone, cleanAyanamsa, stdTime));
    }

    private PanchangDailyResponse fetchDaily(LocalDate localDate, double latitude, double longitude,
            String cleanLocationName, String cleanTimezone, String cleanAyanamsa, String stdTime) {

        JsonNode vedAstroResponse = vedAstroClient.fetchPanchangaTable(Map.of(
                "InputTime", Map.of(
                        "StdTime", stdTime,
                        "Location", Map.of(
                                "Name", cleanLocationName,
                                "Latitude", latitude,
                                "Longitude", longitude
                        )
                ),
                "Ayanamsa", cleanAyanamsa
        ));

        return normalizeVedAstroResponse(
                vedAstroResponse,
                localDate,
                latitude,
                longitude,
                cleanLocationName,
                cleanTimezone,
                cleanAyanamsa
        );
    }

    private PanchangDailyResponse normalizeVedAstroResponse(
            JsonNode response,
            LocalDate date,
            double latitude,
            double longitude,
            String locationName,
            String timezone,
            String ayanamsa
    ) {
        Map<String, String> values = new LinkedHashMap<>();
        flatten(response, values);

        JsonNode panchangaTable = findPanchangaTable(response);

        String tithiName = cleanTithiName(firstText(
                nodeText(panchangaTable, "Tithi", "Name"),
                pick(values, "tithiName", "tithi", "thithi", "lunarDay")
        ));
        String paksha = firstText(
                parsePaksha(firstText(
                        nodeText(panchangaTable, "Tithi", "Paksha"),
                        pick(values, "tithiName", "tithi", "thithi", "paksha")
                )),
                pick(values, "paksha")
        );
        String lunarMonth = firstText(
                nodeText(panchangaTable, "LunarMonth"),
                pick(values, "lunarMonth", "moonMonth", "masa", "maasa", "month")
        );
        String vara = firstText(
                nodeText(panchangaTable, "Vara"),
                pick(values, "vara", "vaar", "weekday", "weekDay"),
                weekday(date)
        );
        String nakshatra = firstText(
                nodeText(panchangaTable, "Nakshatra"),
                pick(values, "nakshatra", "naksatra", "star", "moonStar")
        );
        String yogaName = firstText(
                nodeText(panchangaTable, "Yoga", "Name"),
                pick(values, "yogaName", "yoga")
        );
        String yogaDescription = firstText(
                nodeText(panchangaTable, "Yoga", "Description"),
                pick(values, "yogaDescription", "yogaDesc", "descriptionOfYoga")
        );
        String karana = firstText(
                nodeText(panchangaTable, "Karana"),
                pick(values, "karana", "karanam", "karna")
        );
        String horaLord = firstText(
                nodeText(panchangaTable, "HoraLord", "Name"),
                pick(values, "horaLord", "hora", "currentHora", "hourLord")
        );
        String dishaShool = firstText(
                nodeText(panchangaTable, "DishaShool"),
                pick(values, "dishaShool", "dishaShoola", "dishaShula", "dishaShul")
        );
        String sunrise = firstText(
                cleanStdTime(nodeText(panchangaTable, "Sunrise", "StdTime")),
                pick(values, "sunrise", "sunRise", "suryoday")
        );
        String sunset = firstText(
                cleanStdTime(nodeText(panchangaTable, "Sunset", "StdTime")),
                pick(values, "sunset", "sunSet", "suryast")
        );
        String ishtaKaala = firstText(
                nodeText(panchangaTable, "IshtaKaala", "DegreeMinuteSecond"),
                pick(values, "ishtaKaala", "ishtaKala", "ishtaKaal", "ishtaKalam")
        );
        String responseAyanamsa = firstText(
                nodeText(panchangaTable, "Ayanamsa"),
                pick(values, "ayanamsa", "ayanamsha"),
                ayanamsa
        );

        if (!hasAnyText(tithiName, paksha, lunarMonth, nakshatra, yogaName, karana, sunrise, sunset)) {
            throw new ExternalApiException("VedAstro Panchang service returned an unrecognized response.");
        }

        List<String> missingFields = new ArrayList<>();
        Map<String, String> required = new LinkedHashMap<>();
        required.put("tithiName", tithiName);
        required.put("paksha", paksha);
        required.put("lunarMonth", lunarMonth);
        required.put("nakshatra", nakshatra);
        required.put("yogaName", yogaName);
        required.put("karana", karana);
        required.put("sunrise", sunrise);
        required.put("sunset", sunset);
        required.forEach((field, value) -> { if (!StringUtils.hasText(value)) missingFields.add(field); });
        return new PanchangDailyResponse(
                date.toString(),
                locationName,
                latitude,
                longitude,
                timezone,
                tithiName,
                paksha,
                lunarMonth,
                vara,
                nakshatra,
                yogaName,
                yogaDescription,
                karana,
                horaLord,
                dishaShool,
                sunrise,
                sunset,
                responseAyanamsa,
                ishtaKaala,
                SOURCE,
                true,
                !missingFields.isEmpty(),
                List.copyOf(missingFields)
        );
    }

    private LocalDate parseDate(String value) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalArgumentException("Date is required.");
        }

        try {
            LocalDate parsed = LocalDate.parse(value.trim(), DateTimeFormatter.ISO_LOCAL_DATE);
            if (parsed.getYear() < 1900 || parsed.getYear() > 2100) {
                throw new IllegalArgumentException("Panchang date must be between 1900 and 2100.");
            }
            return parsed;
        } catch (DateTimeException ex) {
            throw new IllegalArgumentException("Date must use yyyy-MM-dd format.");
        }
    }

    private void validateCoordinates(double latitude, double longitude) {
        if (!Double.isFinite(latitude) || latitude < -90 || latitude > 90) {
            throw new IllegalArgumentException("Latitude must be between -90 and 90.");
        }

        if (!Double.isFinite(longitude) || longitude < -180 || longitude > 180) {
            throw new IllegalArgumentException("Longitude must be between -180 and 180.");
        }
    }

    private String optionalText(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }

    private String firstText(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value;
            }
        }

        return null;
    }

    private String weekday(LocalDate date) {
        return date.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
    }

    private void flatten(JsonNode node, Map<String, String> values) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return;
        }

        if (node.isObject()) {
            captureNamedValue(node, values);

            Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> field = fields.next();
                JsonNode child = field.getValue();

                if (child != null && child.isValueNode()) {
                    putIfPresent(values, field.getKey(), child.asText(null));
                } else {
                    flatten(child, values);
                }
            }
            return;
        }

        if (node.isArray()) {
            for (JsonNode child : node) {
                flatten(child, values);
            }
        }
    }

    private void captureNamedValue(JsonNode node, Map<String, String> values) {
        String name = firstNodeText(node, "Name", "Title", "Key", "Label", "Property");
        String value = firstNodeText(node, "Value", "Result", "Text", "Time", "Data");

        if (StringUtils.hasText(name) && StringUtils.hasText(value)) {
            putIfPresent(values, name, value);
        }
    }

    private String firstNodeText(JsonNode node, String... fieldNames) {
        for (String fieldName : fieldNames) {
            Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> field = fields.next();
                if (field.getKey().equalsIgnoreCase(fieldName) && field.getValue().isValueNode()) {
                    String value = field.getValue().asText(null);
                    if (StringUtils.hasText(value)) {
                        return cleanValue(value);
                    }
                }
            }
        }

        return null;
    }

    private void putIfPresent(Map<String, String> values, String key, String value) {
        String cleanValue = cleanValue(value);
        if (!StringUtils.hasText(key) || !StringUtils.hasText(cleanValue)) {
            return;
        }

        values.putIfAbsent(normalizeKey(key), cleanValue);
    }

    private String pick(Map<String, String> values, String... keys) {
        for (String key : keys) {
            String value = values.get(normalizeKey(key));
            if (StringUtils.hasText(value)) {
                return value;
            }
        }

        for (String key : keys) {
            String normalizedKey = normalizeKey(key);
            for (Map.Entry<String, String> entry : values.entrySet()) {
                if (entry.getKey().contains(normalizedKey) && StringUtils.hasText(entry.getValue())) {
                    return entry.getValue();
                }
            }
        }

        return null;
    }

    private String cleanValue(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        return value.replaceAll("\\s+", " ").trim();
    }

    private String normalizeKey(String value) {
        return value == null
                ? ""
                : value.toLowerCase(Locale.ENGLISH).replaceAll("[^a-z0-9]", "");
    }

    private String parsePaksha(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        String lowerValue = value.toLowerCase(Locale.ENGLISH);
        if (lowerValue.contains("shukla")) {
            return "Shukla Paksha";
        }

        if (lowerValue.contains("krishna")) {
            return "Krishna Paksha";
        }

        return null;
    }

    private JsonNode findPanchangaTable(JsonNode response) {
        JsonNode payload = childIgnoreCase(response, "Payload");
        JsonNode table = childIgnoreCase(payload, "PanchangaTable");
        if (table != null && !table.isMissingNode() && !table.isNull()) {
            return table;
        }

        table = childIgnoreCase(response, "PanchangaTable");
        return table == null ? response : table;
    }

    private String nodeText(JsonNode node, String... path) {
        JsonNode current = node;
        for (String fieldName : path) {
            current = childIgnoreCase(current, fieldName);
            if (current == null || current.isMissingNode() || current.isNull()) {
                return null;
            }
        }

        if (!current.isValueNode()) {
            return null;
        }

        return cleanValue(current.asText(null));
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

    private String cleanStdTime(String value) {
        String cleanValue = cleanValue(value);
        if (!StringUtils.hasText(cleanValue)) {
            return null;
        }

        String[] pieces = cleanValue.split(" ");
        return pieces.length > 0 ? pieces[0] : cleanValue;
    }

    private String cleanTithiName(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        return value.replaceAll("(?i)\\b(shukla|krishna)\\s+paksha\\b", "")
                .replaceAll("(?i)\\b(shukla|krishna)\\b", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private boolean hasAnyText(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return true;
            }
        }

        return false;
    }

    private record CacheKey(LocalDate date, double latitude, double longitude, String name, String timezone, String ayanamsa) {}
}
