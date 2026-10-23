package com.bhakti.backend.service;

import com.bhakti.backend.config.HoroscopeProperties;
import com.bhakti.backend.exception.ExternalApiException;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.concurrent.atomic.AtomicInteger;
import static org.assertj.core.api.Assertions.*;

class HoroscopeServiceTest {
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-10-23T12:00:00Z"), ZoneId.of("Asia/Kolkata"));
    private HoroscopeService service(String url) {
        return new HoroscopeService(new HoroscopeProperties(url, "Asia/Kolkata", 1000), CLOCK);
    }

    private String item(String sign, String date, String pubTime, String content) {
        return "<item><title>" + sign + " Horoscope " + date + "</title><pubDate>" + pubTime
                + "</pubDate><description><![CDATA[" + content + "]]></description></item>";
    }

    @Test
    void datedFeedChoosesNewestSignEntryAndStripsMarkup() {
        String xml = "<rss><channel>"
                + item("Aries", "23 Oct 2026", "Fri, 23 Oct 2026 11:00:00 GMT", "<p>Current &amp; useful.</p><script>bad()</script>")
                + item("Aries", "23 Oct 2026", "Fri, 23 Oct 2026 10:00:00 GMT", "Older duplicate")
                + item("Taurus", "22 Oct 2026", "Thu, 22 Oct 2026 12:00:00 GMT", "Yesterday") + "</channel></rss>";
        var result = service("https://example.test/rss").parse(xml, LocalDate.of(2026, 10, 23));
        assertThat(result).containsOnlyKeys("aries");
        assertThat(result.get("aries").horoscope()).isEqualTo("Current & useful.");
        assertThat(result.get("aries").date()).isEqualTo("2026-10-23");
    }

    @Test
    void explicitTodaysTitleToleratesFeedTimezoneMislabelButRejectsTomorrow() {
        String xml = "<rss><channel>"
                + item("Aries", "23 Oct 2026", "Fri, 23 Oct 2026 17:00:00 GMT", "Today's dated reading")
                + item("Taurus", "24 Oct 2026", "Fri, 23 Oct 2026 17:00:00 GMT", "Tomorrow") + "</channel></rss>";
        assertThat(service("https://example.test/rss").parse(xml, LocalDate.of(2026, 10, 23))).containsOnlyKeys("aries");
    }

    @Test
    void staleOrUndatedFeedNeverBecomesTodaysHoroscope() {
        var service = service("https://example.test/rss");
        assertThatThrownBy(() -> service.parse("<rss><channel>" + item("Aries", "22 Oct 2026",
                "Thu, 22 Oct 2026 12:00:00 GMT", "Stale") + "</channel></rss>", LocalDate.of(2026, 10, 23)))
                .isInstanceOf(ExternalApiException.class);
        assertThatThrownBy(() -> service.daily("hi")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void xmlExternalEntitiesAreRejected() {
        String malicious = "<!DOCTYPE rss [<!ENTITY xxe SYSTEM 'file:///unavailable'>]><rss><channel>&xxe;</channel></rss>";
        assertThatThrownBy(() -> service("https://example.test/rss").parse(malicious, LocalDate.of(2026, 10, 23)))
                .isInstanceOf(ExternalApiException.class).hasMessageContaining("invalid feed");
    }

    @Test
    void backendFetchesProviderOnceForRepeatedRequests() throws Exception {
        AtomicInteger calls = new AtomicInteger();
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/rss", exchange -> {
            calls.incrementAndGet();
            byte[] bytes = ("<rss><channel>" + item("Aries", "23 Oct 2026",
                    "Fri, 23 Oct 2026 11:00:00 GMT", "Stub reading") + "</channel></rss>").getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, bytes.length);
            try (var body = exchange.getResponseBody()) { body.write(bytes); }
        });
        server.start();
        try {
            var service = service("http://127.0.0.1:" + server.getAddress().getPort() + "/rss");
            assertThat(service.daily("en").get("aries").horoscope()).isEqualTo("Stub reading");
            assertThat(service.daily("en")).containsKey("aries");
            assertThat(calls).hasValue(1);
        } finally { server.stop(0); }
    }
}
