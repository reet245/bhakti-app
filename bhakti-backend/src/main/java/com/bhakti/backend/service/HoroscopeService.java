package com.bhakti.backend.service;

import com.bhakti.backend.config.HoroscopeProperties;
import com.bhakti.backend.exception.ExternalApiException;
import com.bhakti.backend.util.BoundedCache;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.HtmlUtils;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;
import org.xml.sax.helpers.DefaultHandler;
import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class HoroscopeService {
    private static final int MAX_FEED_BYTES = 256 * 1024;
    private static final List<String> SIGNS = List.of("Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
            "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces");
    private static final Pattern TITLE_DATE = Pattern.compile("\\b(\\d{1,2} [A-Za-z]{3} \\d{4})\\b");
    private static final DateTimeFormatter TITLE_DATE_FORMAT = DateTimeFormatter.ofPattern("d MMM uuuu", Locale.ENGLISH)
            .withResolverStyle(java.time.format.ResolverStyle.STRICT);
    private final HoroscopeProperties properties;
    private final RestClient client;
    private final Clock clock;
    private final BoundedCache<LocalDate, Map<String, DailyHoroscope>> cache = new BoundedCache<>(2, 15 * 60_000L);

    @org.springframework.beans.factory.annotation.Autowired
    public HoroscopeService(HoroscopeProperties properties) {
        this(properties, Clock.system(ZoneId.of(properties.timezone())));
    }

    HoroscopeService(HoroscopeProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        int timeout = Math.min(5000, Math.max(100, properties.timeoutMs()));
        factory.setConnectTimeout(timeout / 2);
        factory.setReadTimeout(timeout / 2);
        this.client = RestClient.builder().requestFactory(factory).build();
    }

    public Map<String, DailyHoroscope> daily(String language) {
        if (!"en".equalsIgnoreCase(language)) {
            throw new IllegalArgumentException("Daily horoscope is currently available in English only.");
        }
        LocalDate today = LocalDate.now(clock);
        return cache.get(today, () -> parse(fetch(), today));
    }

    private String fetch() {
        if (properties.feedUrl() == null || properties.feedUrl().isBlank()) {
            throw new ExternalApiException("Daily horoscope feed is not configured.");
        }
        try {
            return client.get().uri(properties.feedUrl()).exchange((request, response) -> {
                if (!response.getStatusCode().is2xxSuccessful()) {
                    throw new ExternalApiException("Daily horoscope provider is unavailable.");
                }
                byte[] bytes = response.getBody().readNBytes(MAX_FEED_BYTES + 1);
                if (bytes.length > MAX_FEED_BYTES) throw new ExternalApiException("Daily horoscope feed is too large.");
                return new String(bytes, StandardCharsets.UTF_8);
            });
        } catch (RestClientException ex) {
            throw new ExternalApiException("Daily horoscope provider is unavailable. Please try again later.");
        }
    }

    Map<String, DailyHoroscope> parse(String xml, LocalDate today) {
        if (xml == null || xml.length() > MAX_FEED_BYTES) throw new ExternalApiException("Invalid daily horoscope feed.");
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
            factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
            factory.setXIncludeAware(false);
            factory.setExpandEntityReferences(false);
            var builder = factory.newDocumentBuilder();
            builder.setErrorHandler(new DefaultHandler());
            var document = builder.parse(new InputSource(new StringReader(xml)));
            NodeList items = document.getElementsByTagName("item");
            Map<String, DailyHoroscope> result = new LinkedHashMap<>();
            Map<String, Instant> published = new HashMap<>();
            for (int index = 0; index < Math.min(100, items.getLength()); index++) {
                Element item = (Element) items.item(index);
                String title = clean(text(item, "title"));
                String sign = signFrom(title);
                if (sign == null) continue;
                Instant timestamp;
                try { timestamp = ZonedDateTime.parse(text(item, "pubDate").trim(), DateTimeFormatter.RFC_1123_DATE_TIME).toInstant(); }
                catch (DateTimeParseException ex) { continue; }
                if (timestamp.isBefore(clock.instant().minus(Duration.ofHours(36)))) continue;
                LocalDate date = timestamp.atZone(clock.getZone()).toLocalDate();
                var titleDate = TITLE_DATE.matcher(title);
                if (titleDate.find()) {
                    try { date = LocalDate.parse(titleDate.group(1), TITLE_DATE_FORMAT); }
                    catch (DateTimeParseException ex) { continue; }
                    // The feed sometimes labels local publication time as GMT. Its explicit
                    // calendar date is authoritative; tolerated timezone skew is still bounded.
                    if (timestamp.isAfter(clock.instant().plus(Duration.ofHours(14)))) continue;
                } else if (timestamp.isAfter(clock.instant().plus(Duration.ofHours(1)))) {
                    continue;
                }
                if (!today.equals(date)) continue;
                String horoscope = clean(text(item, "description"));
                if (horoscope.isBlank() || horoscope.length() > 10000) continue;
                String id = sign.toLowerCase(Locale.ROOT);
                if (published.containsKey(id) && !timestamp.isAfter(published.get(id))) continue;
                result.put(id, new DailyHoroscope(id, sign, horoscope, date.toString(), properties.feedUrl()));
                published.put(id, timestamp);
            }
            if (result.isEmpty()) throw new ExternalApiException("Today's dated horoscope is not yet available.");
            return Collections.unmodifiableMap(result);
        } catch (ExternalApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ExternalApiException("Daily horoscope provider returned an invalid feed.");
        }
    }

    private String signFrom(String title) {
        for (String sign : SIGNS) {
            if (Pattern.compile("(?i)\\b" + sign + "\\b").matcher(title).find()) return sign;
        }
        return null;
    }

    private String text(Element item, String tag) {
        NodeList values = item.getElementsByTagName(tag);
        return values.getLength() == 0 ? "" : values.item(0).getTextContent();
    }

    private String clean(String value) {
        return HtmlUtils.htmlUnescape(value).replaceAll("(?is)<(script|style)\\b[^>]*>.*?</\\1\\s*>", " ")
                .replaceAll("<[^>]*>", " ").replace('\u00a0', ' ').replaceAll("\\s+", " ").trim();
    }

    public record DailyHoroscope(String id, String title, String horoscope, String date, String source) {}
}
