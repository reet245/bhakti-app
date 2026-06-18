# Bhakti Play Store Security Audit

Date: 2026-06-18
Scope: Expo React Native frontend, PWA assets, Java Spring Boot backend, dependency/build configuration.
Working tree before audit: clean (`git status --short --branch` returned `## main...origin/main`).

This is a source/config audit, not a penetration test. No production traffic fuzzing, brute forcing, remediation, dependency upgrades, commits, branch creation, or source-code changes were performed.

## Executive Summary

Overall readiness: Not Ready.

The app should not be submitted for public Play production until the High findings are remediated. Closed testing may be reasonable only after the production API URL is proven HTTPS-only and the privacy/Data Safety work is completed for tester disclosure.

Findings by severity:

| Severity | Count |
| --- | ---: |
| CRITICAL | 0 |
| HIGH | 4 |
| MEDIUM | 8 |
| LOW | 2 |

Top urgent issues:

1. Production frontend API resolution can fall back to cleartext `http://` development/local URLs.
2. Public Kundli and Panchang endpoints call VedAstro but are not rate-limited, cached, authenticated, or quota-protected.
3. Backend INFO logs include precise coordinates/location names and Kundli birth place data.
4. No privacy policy link/text or Data Safety disclosure surface was found in app source/config.
5. Production dependency advisories exist in npm audit, and embedded Tomcat 10.1.31 is behind multiple official Tomcat 10.x security fixes.

## Release Blockers

| ID | Severity | Status | Blocker | Evidence | Required before release |
| --- | --- | --- | --- | --- | --- |
| BH-H01 | HIGH | Likely | Production API can use cleartext or dev endpoints if `EXPO_PUBLIC_API_BASE_URL` is absent/mis-set. | `src/config/api.js:70-107` returns `http://` URLs for Expo host, web host, Android emulator, and localhost; `npx.cmd expo config --type public --json` showed no production API URL. | Require an HTTPS production API URL at build time and fail closed in production when missing. |
| BH-H02 | HIGH | Likely | Public VedAstro-backed endpoints are abuse-prone without server-side rate limits/quotas. | `bhakti-backend/src/main/java/com/bhakti/backend/config/InMemoryRateLimitFilter.java:24-38` filters only `/api/v1/dream/interpret`; Kundli and Panchang endpoints are public at `KundliController.java:26-34` and `PanchangController.java:25-51`; VedAstro calls are made at `KundliService.java:98-116` and `PanchangService.java:51-61`. | Add rate limits/quotas/caching/abuse monitoring before public production. If VedAstro is paid or quota-limited, treat as potentially CRITICAL until quotas are enforced. |
| BH-H03 | HIGH | Confirmed | Sensitive location/birth-place data is logged at INFO. | `PanchangController.java:34-42` logs date, lat, lon, locationName, timezone, ayanamsa; `KundliController.java:30-33` logs birthPlace and unknownTime; `application.yml:36-38` sets app logging to INFO. | Redact or remove location and birth-place values from production logs. |
| BH-H04 | HIGH | Confirmed | Privacy policy / Data Safety release surface is missing in source/config. | `rg` found no privacy/account/policy text except service-worker cache deletion; `SettingsScreen.js:56-133` has appearance/language only; `app.json:1-46` has no privacy policy URL. Google requires accurate Data Safety declarations and a privacy policy for Play apps. | Add in-app privacy policy access and complete Play Data Safety based on verified data flows. |

## Security Findings Table

| ID | Severity | Status | Title | Affected module | Evidence path/line | Realistic impact | Exploit or failure scenario | Remediation | Regression test | Owner priority |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BH-H01 | HIGH | Likely | Cleartext/dev API fallback in production | Frontend API config, Android/PWA | `src/config/api.js:15-18`, `70-107`; `app.json:40-44` only EAS extra; Expo public config did not include API base URL. | User birth details/location can be sent to wrong host or over HTTP; Android release may fail due cleartext; PWA may hit mixed-content HTTP. | Release is built without `EXPO_PUBLIC_API_BASE_URL`; native Android falls to `http://10.0.2.2:8080`, web falls to `http://<host>:8080`. | Require HTTPS `EXPO_PUBLIC_API_BASE_URL` for production and throw a safe startup/config error if missing. | Build production bundle without the env var and assert it fails closed; build with HTTPS and assert API calls use HTTPS. | P0 |
| BH-H02 | HIGH | Likely | Unprotected VedAstro API proxying | Backend public APIs | `InMemoryRateLimitFilter.java:24-38`; `KundliService.java:98-116`; `PanchangService.java:51-61`; `VedAstroClient.java:153-164`. | Attackers can automate expensive or quota-consuming requests through Bhakti backend. | Script loops `/api/v1/kundli/generate` or `/api/v1/panchang/daily`; backend fans out to VedAstro on each request. | Apply rate limiting to all third-party-backed endpoints, cache low-risk Panchang responses, add request quotas and upstream usage monitoring. | Add MockMvc tests proving 429 after configured threshold for Kundli/Panchang and no upstream call after limit. | P0 |
| BH-H03 | HIGH | Confirmed | Sensitive location and birth-place values in logs | Backend controllers/logging | `PanchangController.java:34-42`; `KundliController.java:30-33`; `application.yml:36-38`. | Production logs can contain precise location coordinates and birth-place data; logs may be retained or accessible to hosting staff/tools. | User opens Calendar; backend logs lat/lon and locationName. User generates Kundli; backend logs birthPlace. | Log route hit and coarse metadata only; remove lat/lon/locationName/birthPlace or hash/round values if truly needed. | Unit or log-capture test verifies sensitive fields are not emitted. | P0 |
| BH-H04 | HIGH | Confirmed | Missing Play privacy policy/Data Safety surface | Play readiness, frontend settings | `SettingsScreen.js:56-133`; no `privacy`/`policy` matches in app source; `app.json:1-46`. Official Google Play docs state Play developers must complete Data Safety and provide a privacy policy. Sources: https://support.google.com/googleplay/android-developer/answer/10787469 and https://support.google.com/googleplay/android-developer/answer/10144311. | Play submission can be blocked/rejected; users lack required disclosure for location and birth data handling. | Reviewer cannot find in-app privacy policy; Data Safety form omits location/name/birth data sent to backend/third parties. | Add a privacy policy URL in Play Console and accessible in-app; disclose verified data flows, retention, deletion/contact, and third-party processing. | Manual QA from Settings/Home finds privacy policy; checklist matches `DATA_FLOW_AND_PRIVACY_INVENTORY.md`. | P0 |
| BH-M01 | MEDIUM | Confirmed | External API/internal error details returned to clients | Backend exception handling | `GlobalExceptionHandler.java:38-42` returns `ex.getMessage()`; `VedAstroClient.java:136-146`, `171-181` includes provider/method details. | Reveals provider names/method names and failure modes; can help endpoint probing and creates brittle client UX. | Upstream fails; client receives messages like provider/method failure instead of a generic safe message. | Return generic client-safe messages; log detailed provider messages internally with no secrets/PII. | Mock `ExternalApiException` and assert response body is generic while logs remain internal. | P1 |
| BH-M02 | MEDIUM | Confirmed | Validation and request-size gaps on public endpoints | Backend controllers/services | `PanchangController.java:27-32` accepts string query params without size/pattern annotations; `PanchangService.java:46-60` forwards locationName/ayanamsa after trim/uppercase only; `KundliGenerateRequest.java:13-15` gender is only max length, not enum; no request-size config in `application.yml:1-38`. | Low-cost invalid inputs can still consume backend/upstream resources or produce incorrect astrology data. | Attacker submits long `locationName`/unexpected `ayanamsa` repeatedly; service forwards to VedAstro until upstream fails. | Add DTOs for query params, explicit size/pattern/enum validation, request size limits, and reject invalid requests before upstream calls. | Validation tests for max length, enum, invalid ayanamsa, malformed date/time, missing fields. | P1 |
| BH-M03 | MEDIUM | Confirmed | Wildcard CORS on browser-accessible APIs | Backend CORS/PWA | `application.yml:22-23` default `${ALLOWED_ORIGINS:*}`; `CorsConfig.java:21-25` allows origin patterns, headers, GET/POST/OPTIONS for `/api/v1/**`. | Any website can call public Bhakti APIs from a browser. CORS is not auth, but wide CORS increases browser abuse surface. | A third-party site causes visitors' browsers to submit Kundli/Panchang requests to Bhakti backend. | Restrict production origins to official app/PWA domains; keep server-side rate limits because native apps bypass CORS. | CORS tests for allowed and disallowed origins. | P1 |
| BH-M04 | MEDIUM | Confirmed | Root `.env` is not ignored | Secret hygiene | Root `.gitignore:33-35` ignores only `.env*.local`; backend `.gitignore:1` ignores `.env`; `src/config/api.js:17` reads `EXPO_PUBLIC_API_BASE_URL`. | A plain root `.env` with Expo variables or accidental secrets could be committed. | Developer adds `.env` for Expo build; Git tracks it because root ignore lacks `.env`. | Add root `.env`, `.env.*`, with explicit allowance for `.env.example` if needed. | `git check-ignore .env` should pass after remediation. | P1 |
| BH-M05 | MEDIUM | Confirmed | Production npm dependency advisories | Frontend dependencies | `npm.cmd audit --omit=dev --json` reported total 23 vulnerabilities: 1 critical transitive `shell-quote`, 1 high transitive `ws`, 20 moderate, 1 low. Direct affected packages include `expo`, `expo-constants`, `expo-notifications`, and `react-native` through transitive chains. | Build tooling/dev server or transitive runtime packages may carry known DoS/info disclosure/RCE-class advisories. Current exploitability in release bundle was not proven. | Vulnerable transitive package becomes reachable through dev tooling, web server, or release process. | Plan Expo/RN-compatible upgrades; avoid `npm audit fix` blindly; verify Expo SDK compatibility. | Re-run `npm audit --omit=dev --json` after upgrades and run app smoke tests. | P1 |
| BH-M06 | MEDIUM | Confirmed | Embedded Tomcat 10.1.31 is behind official security fixes | Backend dependency | Maven tree shows `org.apache.tomcat.embed:tomcat-embed-core:10.1.31`; official Apache Tomcat 10 page lists security fixes after 10.1.31 affecting 10.1.x ranges. Source: https://tomcat.apache.org/security-10.html. | The backend may inherit server-container vulnerabilities depending on enabled Tomcat features/proxy topology. | Reverse proxy plus affected Tomcat parser behavior enables request-smuggling/DoS-class risk. | Upgrade Spring Boot BOM to a version that pulls a patched Tomcat 10.1.x; validate compatibility. | Maven dependency tree confirms patched Tomcat; run backend tests. | P1 |
| BH-M07 | MEDIUM | Needs external verification | PWA deployment security headers not proven | PWA/deployment | `public/index.html:1-44` has no CSP meta; no deployment config found for CSP/HSTS/referrer/permissions policy; `public/sw.js:30-67` intentionally caches only same-origin static assets. | Web deployment may lack headers that reduce XSS/clickjacking/mixed-content risk. | PWA is hosted without CSP/HSTS; injected script or downgrade path has fewer browser defenses. | Configure headers at hosting/CDN/reverse proxy; keep API off service-worker cache. | Inspect deployed headers with `curl -I` and browser devtools; verify no API response cached. | P2 |
| BH-M08 | MEDIUM | Confirmed | Kundli share action includes personal birth details | Frontend privacy UX | `KundliScreen.js:575-580` shares name, birth date, birth time, and birth place through OS/web share. | User may accidentally disclose personal data to another app/contact. This is user-initiated sharing, not automatically third-party sharing. | User taps Share Kundli and sends full preview to an unintended recipient. | Add a concise confirmation/preview and privacy policy disclosure; avoid adding hidden data to share text. | Manual test confirms share preview contains only expected fields and requires explicit user action. | P2 |
| BH-L01 | LOW | Confirmed | Production-visible non-sensitive console logs | Frontend logging | `horoscopeService.js:29-46`; `KundliResultScreen.js:156-158`; `PujaScreen.js:330-458`; dev-gated Panchang logs at `panchangService.js:19`, `123-126`, `359-377`. | Minor information leakage/noise; dev-gated Panchang logs could expose URLs in nonstandard builds where `__DEV__` is undefined. | Browser console logs RSS failures or tab names; unusual build exposes Panchang request URL with location query. | Remove nonessential logs or gate all debug logs behind a robust production flag. | Production bundle smoke test checks no sensitive console output. | P3 |
| BH-L02 | LOW | Needs external verification | Generated `.expo-check` bundle is tracked | Release hygiene | `git ls-files` includes `.expo-check/_expo/static/js/android/index-619e61f47bd338fb9e22ae92e2d1f7a6.hbc`; `.expo-check/metadata.json:1` references generated Android bundle/assets. | Stale generated artifacts can confuse reviews and may preserve old public build config; it is not proof of release contents. | Reviewer/auditor inspects stale `.expo-check` artifact instead of real AAB. | Do not rely on checked generated artifacts; inspect actual EAS release artifact and consider ignoring/removing generated export directories in a remediation PR. | Confirm release AAB/manifest with `aapt`/Play artifact inspection. | P3 |

## Privacy and Data Safety Summary

Verified data flows:

| Data | Evidence | Flow | Play Data Safety implication |
| --- | --- | --- | --- |
| Name, gender, birth date, birth time, birth place | `KundliScreen.js:537-545`, `KundliGenerateRequest.java:8-36` | User enters data, frontend sends to backend for Kundli. Backend returns name/date/time/place in response at `KundliService.java:139-157`. | Personal info: name; other personal info: birth date/gender; app functionality purpose. |
| Birth/current coordinates for Kundli | `KundliScreen.js:591-626`, `KundliScreen.js:547-551`, `KundliService.java:90-96` | Optional location detection fills lat/lon/timezone, then backend sends location/time to VedAstro. | Precise location if user uses detection; disclose collection/sharing/service-provider use. |
| Current location for Panchang | `CalendarScreen.js:135-153`, `CalendarScreen.js:165-173`, `PanchangService.java:51-61` | App requests foreground location on Calendar load, sends coords to backend, backend sends location to VedAstro. | Precise location collection for app functionality; privacy policy required. |
| Language preference | `LanguageContext.js:6-7`, `19-24`, `41-44` | Stored locally in AsyncStorage only. | Not personal/sensitive by itself; disclose local preference if desired. |
| Horoscope RSS request | `horoscopeService.js:31` | App fetches third-party RSS feed directly; no app user data in request body, but network provider sees IP/user agent. | Needs owner confirmation for third-party disclosure; no code-proven personal data fields sent. |
| Dream interpretation backend endpoint | `DreamController.java:27-30`, `DreamService.java:36-65`, `DreamApiClient.java:49-57` | Public backend endpoint sends dream text/date/time/location/language to configured Dream API if called. No frontend caller found. | If enabled in product, disclose user-generated content and optional location/time context. |

Unknown/manual verification items:

| Item | Status |
| --- | --- |
| Production API URL uses HTTPS | Needs external verification. |
| VedAstro/Dream API contract and whether they are service providers vs third parties | Needs owner/legal review. |
| Data retention in hosting logs | Needs deployment verification. |
| Play Data Safety form contents | Needs Play Console verification. |
| Public privacy policy URL | Not found in source/config. |
| Release AAB targetSdkVersion, permissions, exported components, cleartext setting | Needs release artifact inspection. |

Privacy-policy gaps:

- No in-app privacy policy link/text was found.
- No retention/deletion explanation was found.
- No privacy contact was found.
- Third-party data processing for VedAstro, location/geocoding, RSS, and Dream API is not documented in source.

Data Safety checklist based on code evidence:

| Data type | Collect? | Share? | Purpose | Notes |
| --- | --- | --- | --- | --- |
| Name | Yes, when generating Kundli | Not proven to VedAstro; backend receives | App functionality | Sent from app to Bhakti backend. |
| Gender | Yes, when generating Kundli | Not proven to VedAstro | App functionality | Google classifies gender under "Other info" style personal data. |
| Date/time of birth | Yes, when generating Kundli | Birth time/date encoded into VedAstro `StdTime` | App functionality | Treat as personal/sensitive user-provided profile data. |
| Birth place | Yes | VedAstro receives location name/coordinates | App functionality | Logged today; fix before production. |
| Precise device location | Yes, Calendar auto-request and Kundli detect button | Backend/VedAstro for Panchang/Kundli | App functionality | Runtime permission is used. |
| Dream text | Backend endpoint only | Configured Dream API | App functionality | No frontend caller found. |
| Push token | No evidence | No evidence | Not applicable | `expo-notifications` is installed but App.js notification code is commented out. |
| Email/account ID/payment/contacts/camera/microphone | No evidence | No evidence | Not applicable | No account/login/payment/contact/media code found. |

Permission checklist:

| Permission/API | Evidence | Used? | Disclosure implication |
| --- | --- | --- | --- |
| Foreground location | `expo-location` dependency at `package.json:20`; imported in `CalendarScreen.js:14` and `KundliScreen.js:17`; requested at `CalendarScreen.js:138` and `KundliScreen.js:591`. | Yes | Needs privacy policy/Data Safety and clear in-feature explanation. Calendar currently asks on load. |
| Notifications | `expo-notifications` dependency at `package.json:21`; App.js import and scheduling are commented at `App.js:6`, `123-184`. | Not active in source | Release artifact should verify no unnecessary notification permission/prompt. |
| Camera/microphone/contacts/storage/background location | No source/config evidence | Not applicable | Verify release manifest. |

Account deletion applicability:

No account creation, login, email, password, account ID, or authenticated user flow was found. Google Play account deletion requirement is currently Not applicable for app-account deletion, but Data deletion questions still need to be completed in Play Console. Source: https://support.google.com/googleplay/android-developer/answer/13327111.

## Backend Exposure Summary

Endpoint inventory:

| Method | Route | Controller | Auth status | Input | Validation | External API | Rate limit | Data returned | PII risk | Logs | CORS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/health` | `HealthController.java:14-19` | Public; no Spring Security found | None | N/A | None | None | status/service | Low | None in controller | `/api/v1/**` wildcard |
| GET | `/api/v1/panchang/daily` | `PanchangController.java:25-51` | Public | date, lat, lon, locationName, timezone, ayanamsa | Date/coords in service; no size/pattern on strings | VedAstro `PanchangaTable` | None | Panchang fields plus location/source | Location | Logs lat/lon/locationName | Wildcard |
| POST | `/api/v1/kundli/generate` | `KundliController.java:26-34` | Public | `KundliGenerateRequest` | `@Valid`, size, date/time/coords/timezone/ayanamsa service validation; no gender enum | Multiple VedAstro methods | None | Kundli profile/chart/predictions | Name, gender, birth details, location | Logs birthPlace | Wildcard |
| POST | `/api/v1/dream/interpret` | `DreamController.java:27-30` | Public | `DreamInterpretRequest` | `@Valid`, size limits | Configured Dream API | Yes, in-memory by IP/header | Dream interpretation | User-generated dream text/location optional | Route hit only | Wildcard |

CORS note: CORS only affects browser/PWA requests. Native mobile apps are not constrained by browser CORS. Server-side validation, rate limiting, quotas, and abuse monitoring are still required.

## Android / Expo / PWA Summary

Expo/Android:

- `app.json:3-5` name/slug/version are set.
- `app.json:18-25` Android package `com.hreetp.bhaktiapp`, versionCode `1`, adaptive icon, edge-to-edge are set.
- `eas.json:14-16` production uses `autoIncrement: true`.
- `npx.cmd expo config --type public --json` succeeded and showed SDK `54.0.0`, Android package, versionCode, web config, owner, and EAS projectId. No secret values were present.
- No checked-in native `android/` or `ios/` folders were found; release manifest verification requires Expo prebuild or actual AAB review.
- Target API level cannot be proven from source config. Google Play requires new apps/app updates to target Android 15/API 35 or higher from 2025-08-31. Source: https://support.google.com/googleplay/android-developer/answer/11926878.

PWA/web:

- `public/sw.js:30-67` only intercepts same-origin GETs and only runtime-caches scripts/styles/images/fonts/manifest/Expo/assets. It does not intentionally cache API JSON.
- `public/index.html:29-34` registers the service worker and logs registration failure.
- No deployment header config was found for HSTS, CSP, Referrer-Policy, Permissions-Policy, or X-Frame-Options.
- `src/config/api.js:91-96` can infer `http://<webHost>:8080`, which will fail or downgrade security on HTTPS PWA deployments unless `EXPO_PUBLIC_API_BASE_URL` is set to HTTPS.

## Dependency Findings

Frontend:

- Direct dependencies are listed in `package.json:12-29`.
- Installed direct versions from `npm.cmd ls --depth=0 --json` include `expo 54.0.34`, `react-native 0.81.5`, `react 19.1.0`, `expo-location 19.0.8`, `expo-notifications 0.32.17`, `expo-constants 18.0.13`, and AsyncStorage `2.2.0`.
- `npm.cmd audit --omit=dev --json` required network approval and reported 23 production advisories: 1 critical, 1 high, 20 moderate, 1 low.
- Critical: transitive `shell-quote` advisory `GHSA-w7jw-789q-3m8p`; current exploitability in the release app was not proven.
- High: transitive `ws` advisory `GHSA-96hv-2xvq-fx4p`; current exploitability in the release app was not proven.
- Direct packages affected through transitive chains include `expo`, `expo-constants`, `expo-notifications`, and `react-native`. Do not run `npm audit fix` blindly because suggested fixes include major version changes.

Backend:

- `pom.xml:7-11` uses Spring Boot parent `3.3.5`; `pom.xml:21-23` uses Java 17.
- Direct backend dependencies at `pom.xml:25-47`: `spring-boot-starter-web`, `spring-boot-starter-validation`, `spring-boot-starter-actuator`, configuration processor, and test starter.
- Maven dependency tree succeeded after network approval. Key runtime transitive versions include Spring Framework `6.1.14`, Tomcat embed `10.1.31`, Jackson `2.17.2`, Logback `1.5.11`, SnakeYAML `2.2`, Micrometer `1.13.6`.
- Official Apache Tomcat 10.x security page lists multiple 10.1.x fixes after 10.1.31; upgrade through Spring Boot BOM is recommended.

## Good Security Practices Already Present

- VedAstro and Dream API keys are read from backend environment-backed configuration, not frontend source: `application.yml:10-20`, `VedAstroClient.java:153-160`, `DreamApiClient.java:49-53`.
- Frontend Panchang service comment explicitly states the VedAstro key stays off the client: `panchangService.js:5-11`.
- Backend HTTP clients have connect/read timeouts: `VedAstroClient.java:197-201`, `DreamApiClient.java:67-71`.
- DTO validation exists for Kundli and Dream request bodies: `KundliGenerateRequest.java:8-36`, `DreamInterpretRequest.java:6-22`.
- Service-level validation exists for Kundli date/time/coordinates/timezone/ayanamsa: `KundliService.java:224-307`.
- Service worker avoids API JSON caching by default: `public/sw.js:30-67`.
- Existing backend tests passed: 10 tests, 0 failures, 0 errors.

## External Verification Checklist

- Production `EXPO_PUBLIC_API_BASE_URL` is HTTPS and not a secret.
- Render/hosting HTTPS is enabled and HTTP redirects to HTTPS.
- Production backend env vars are present only in secret manager/runtime env.
- VedAstro/Dream API keys have provider quotas and alerting.
- Play App Signing is enabled.
- Release AAB targetSdkVersion is API 35+.
- Release AAB manifest reviewed for permissions, exported components, cleartext traffic, backup behavior, and network security config.
- Privacy policy is hosted at a public, non-editable, non-geofenced URL and linked in-app.
- Play Data Safety form matches `DATA_FLOW_AND_PRIVACY_INVENTORY.md`.
- Backend logs verified in staging to ensure no lat/lon, birthPlace, name, birth date/time, API key, or raw request/response data is emitted.
- CORS `ALLOWED_ORIGINS` set to official web origins only.
- Backend rate limiting tested for Kundli/Panchang/Dream.
- Third-party API quotas and budget alerts configured.
- No non-placeholder secret in Git history. Refined scan found only placeholder README examples, not real values.
- PWA deployment headers verified with `curl -I`.
- Release web service worker verified not to cache API responses or personal data.
