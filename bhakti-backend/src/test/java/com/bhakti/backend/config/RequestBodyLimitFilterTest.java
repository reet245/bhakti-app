package com.bhakti.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicBoolean;
import static org.assertj.core.api.Assertions.*;

class RequestBodyLimitFilterTest {
    @Test
    void unknownContentLengthCannotBypassByteLimit() throws Exception {
        var request = new MockHttpServletRequest("POST", "/api/v1/kundli/generate;ignored=value") {
            @Override public long getContentLengthLong() { return -1; }
        };
        request.setContent(new byte[RequestBodyLimitFilter.MAX_BODY_BYTES + 1]);
        var response = new MockHttpServletResponse();
        AtomicBoolean invoked = new AtomicBoolean();
        new RequestBodyLimitFilter(new ObjectMapper()).doFilter(request, response, (req, res) -> invoked.set(true));
        assertThat(response.getStatus()).isEqualTo(413);
        assertThat(invoked).isFalse();
    }

    @Test
    void smallBodyIsPreservedForJsonController() throws Exception {
        var request = new MockHttpServletRequest("POST", "/api/v1/kundli/generate");
        request.setContent("{\"name\":\"Test\"}".getBytes(StandardCharsets.UTF_8));
        new RequestBodyLimitFilter(new ObjectMapper()).doFilter(request, new MockHttpServletResponse(),
                (req, res) -> assertThat(req.getReader().readLine()).isEqualTo("{\"name\":\"Test\"}"));
    }
}
