# Bhakti Backend

Portable Java 17 Spring Boot backend for the Bhakti Expo React Native devotional app.

The backend is designed to run locally now and later deploy to Docker-based platforms, AWS, or Railway without rewriting business logic. Secrets are read from environment variables only.

## Run Locally

Install Java 17 and Maven, then run:

```bash
mvn spring-boot:run
```

The server starts on `http://localhost:8080` unless `PORT` is set.

## Environment Variables

```bash
DREAM_API_URL=
DREAM_API_KEY=
DREAM_API_TIMEOUT_MS=30000
VEDASTRO_BASE_URL=https://api.vedastro.org/api
VEDASTRO_API_KEY=
VEDASTRO_API_TIMEOUT_MS=8000
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=30
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_KUNDLI_MAX_REQUESTS=5
RATE_LIMIT_MAX_CLIENTS=10000
MAX_CONCURRENT_REQUESTS=16
TRUSTED_PROXY_IPS=
GEOCODING_API_URL=https://geocoding-api.open-meteo.com/v1/search
GEOCODING_API_KEY=
GEOCODING_API_TIMEOUT_MS=5000
HOROSCOPE_FEED_URL=https://feeds.feedburner.com/dayhoroscope
HOROSCOPE_TIMEZONE=Asia/Kolkata
HOROSCOPE_TIMEOUT_MS=5000
SPRING_PROFILES_ACTIVE=prod
```

`DREAM_API_KEY` is optional at startup but required if your external Dream Interpreter API requires authentication. Do not commit `.env`.

Spring does not automatically load `.env`; inject these variables through your shell, hosting settings, or Docker `--env-file`. Set `ALLOWED_ORIGINS` to the exact HTTPS frontend origins in production. Secrets belong only on the backend. All provider URLs are administrator-controlled configuration; never accept them from user requests.

The dependency baseline is Spring Boot 3.5.16, compatible with Java 17. See the [official requirements](https://docs.spring.io/spring-boot/3.5/system-requirements.html) and [3.5 release notes](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.5-Release-Notes). Keep this baseline updated; an upgrade does not replace vulnerability scanning.

## Active data APIs

- `GET /api/v1/panchang/daily?date=2026-10-23&lat=22.5726&lon=88.3639&timezone=Asia%2FKolkata&locationName=Kolkata&ayanamsa=LAHIRI` returns `{success,data}`. The offset sent to VedAstro is derived from the IANA timezone on the requested day. `data.partial` and `data.missingFields` identify incomplete provider results; missing fields stay absent. Validated results are cached for 15 minutes with at most 512 entries. Dates are supported from 1900 through 2100; LAHIRI is the supported ayanamsa.
- `GET /api/v1/locations/search?query=Berlin%2C%20Germany` returns `{success,data:[{resolvedPlaceName,latitude,longitude,timezone,timezoneOffset}]}`. Let the user select a candidate; pass its coordinates and **IANA `timezone`** to Kundli. The numeric offset is display-only and must not be used for historical calculations. Results use a bounded 24-hour cache. Ambiguous free text requires selection; exact Kolkata/Dehradun fallbacks remain available offline.
- `POST /api/v1/kundli/generate` accepts `name`, `gender`, `birthDate` (`yyyy-MM-dd`), `birthTime` (`HH:mm`), `birthPlace`, `latitude`, `longitude`, `timezone`, `ayanamsa` and `unknownTime`. Coordinates and timezone must be supplied together. Future dates, nonfinite coordinates and invalid times are rejected before calculation. IANA zones use the birth date's historical offset. A daylight-saving gap or overlap requires an explicit offset. Unknown birth time uses noon, marks the chart approximate and leaves time-sensitive dasha/predictions unavailable. The response contains `success`, `calculationMeta`, `profile`, `birthSummary`, `charts`, `planets`, `houses`, `dasha`, `predictions`.
- `GET /api/v1/horoscope/daily?language=en` returns `{success,data:{aries:{id,title,horoscope,date,source},...}}`. Only entries dated today in `HOROSCOPE_TIMEZONE` are returned, with a 15-minute cache. The adapter checks HTTP status, limits feed size, disables external XML entities, strips HTML and chooses the newest duplicate. Missing signs are absent. Unsupported languages return HTTP 400; stale/invalid/provider failures return HTTP 502. The existing AstroSage daily RSS source is fetched server-side to avoid browser CORS errors. Provider freshness and continued feed access remain external dependencies.

Birthplace search uses [Open-Meteo's GeoNames data](https://open-meteo.com/en/docs/geocoding-api). Include attribution in the UI. The public endpoint is for noncommercial usage; commercial deployments require an appropriate customer endpoint/key, licensed provider, or self-hosted geocoder. Confirm permission to redistribute the horoscope source before public/commercial release.

Panchang transition times, advanced muhurtas, Kundli doshas/remedies and a verified Dream API contract are not invented when unavailable. See the repository `docs/FIX_STATUS.md` for blocked work.

## Health Check

```bash
curl http://localhost:8080/api/v1/health
```

Expected response:

```json
{
  "success": true,
  "data": {
    "status": "UP",
    "service": "Bhakti Backend"
  }
}
```

## Dream Interpretation

```bash
curl -X POST http://localhost:8080/api/v1/dream/interpret \
  -H "Content-Type: application/json" \
  -d '{
    "dreamText": "I saw Lord Shiva in a temple",
    "date": "26 May 2026",
    "time": "07:29 AM",
    "location": "Delhi",
    "language": "English"
  }'
```

Empty dream text validation:

```bash
curl -X POST http://localhost:8080/api/v1/dream/interpret \
  -H "Content-Type: application/json" \
  -d '{"dreamText": ""}'
```

Expected error format:

```json
{
  "success": false,
  "message": "Dream text is required."
}
```

## Build Jar

```bash
mvn clean package
```

Run the jar:

```bash
java -jar target/bhakti-backend-0.0.1-SNAPSHOT.jar
```

## Docker

Build:

```bash
docker build -t bhakti-backend .
```

Run:

```bash
docker run --rm -p 8080:8080 \
  -e DREAM_API_URL="https://your-dream-api.example.com/interpret" \
  -e DREAM_API_KEY="your-secret-key" \
  -e ALLOWED_ORIGINS="https://your-frontend.example.com" \
  bhakti-backend
```

## External Dream API Integration

`DreamApiClient` currently sends a placeholder JSON payload:

```json
{
  "prompt": "..."
}
```

Update `buildRequestBody` and `extractInterpretationText` when you know the provider's exact request and response format. The default authentication header is:

```http
Authorization: Bearer <DREAM_API_KEY>
```

Change the header constants in `DreamApiClient` if the provider requires another format, such as `x-api-key`.

## Response Cleaning

AI responses are cleaned before reaching the frontend:

```java
text.replaceAll("(?is)<think>.*?</think>", "").trim();
```

This removes internal reasoning enclosed in `<think>...</think>`.

## Rate Limiting

A bounded in-memory limiter covers Dream, Kundli, Panchang, horoscope and birthplace search. The default per-client/per-route window is 30 requests per minute, with 5 Kundli requests per minute. At most 10,000 active route/client counters are retained; new counters are refused when full. Responses include `Retry-After`.

Defaults:

- `RATE_LIMIT_ENABLED=true`
- `RATE_LIMIT_MAX_REQUESTS=30`
- `RATE_LIMIT_WINDOW_MS=60000`

There are at most 16 concurrent provider-backed requests and 4 concurrent Kundli requests per process. These capacity bounds remain active if rate quotas are disabled. API request bodies are limited to 32 KB before JSON parsing, including chunked/unknown-length requests. VedAstro calls have at most an 8-second connect/read budget per call; a Kundli calculation shares a 25-second budget so subsequent calls stop when the budget expires. Optional dasha/predictions can then return unavailable warnings. Provider response bodies are bounded. Slow streaming and deployment connection timeouts should also be bounded at your gateway.

`X-Forwarded-For` is ignored unless the immediate peer is listed in `TRUSTED_PROXY_IPS`. The chain is walked from right to left through explicitly trusted IPs. Spring's automatic forwarded-header rewriting is disabled to preserve this boundary. Configure exact proxy IPs as seen by the container; the edge must strip/overwrite incoming forwarded headers. Do not list arbitrary client ranges as trusted proxies.

Quotas reset on restart and are per process. Multiple replicas need a shared gateway or Redis-backed quota to enforce deployment-wide limits. CORS is not authentication or abuse protection.

Routine application logs omit birth details and precise coordinates. Each request gets a generated `X-Request-Id` response header. Error logs identify the error class/request ID without recording provider URLs or response bodies. Configure ingress/access-log redaction and retention separately because GET queries contain location data.

## Verification

Run `mvn -B clean verify`. Tests cover validation, historical DST offsets, partial Panchang responses, caching, rate limits/trusted proxies, XML hardening and dated horoscope selection; local HTTP stubs verify provider fetch behavior without sending real birth details. Docker builds run these tests and the runtime image runs as a non-root user. Live VedAstro contracts and actual deployment settings still require integration verification.

## PostgreSQL and Flyway Later

No database dependency is included right now. When persistence is needed, add:

- PostgreSQL JDBC driver
- Spring Data JPA or JDBC, depending on the data model
- Flyway for migrations under `src/main/resources/db/migration`
- Environment variables for database URL, username, and password

Keep storage external. Do not store user files on the server disk.

## AWS Deployment Notes

The application is portable and contains no AWS-specific business logic. For AWS later:

- Build and publish the Docker image to a container registry.
- Set environment variables in the deployment service.
- Keep secrets in a managed secret store or injected environment.
- Use managed logging and metrics outside application business logic.
- Place PostgreSQL, object storage, and rate limiting behind interfaces when those features are added.
