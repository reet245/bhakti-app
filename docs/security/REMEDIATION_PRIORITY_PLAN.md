# Bhakti Remediation Priority Plan

Date: 2026-06-18
Scope: Recommendations only. No remediation was implemented.

## Phase 0 - Immediate Release Blockers

Must fix before Play Store closed testing that uses real users/production-like data, and definitely before production.

| Recommendation | Severity | Difficulty | Why it matters | Safe implementation approach | Files likely involved | Risk reduction | Regression risk | User testing needed? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Require HTTPS production API base URL and fail closed when missing | HIGH | Small/Medium | Current fallback can use `http://` emulator/localhost/web-host URLs in production. | In production builds, require `EXPO_PUBLIC_API_BASE_URL` to be present and `https://`; keep dev fallback only under `__DEV__`. | `src/config/api.js`, EAS build env, deployment docs | Prevents cleartext/wrong-host API calls. | Misconfigured dev builds may fail until env setup is clear. | Yes, Android and PWA smoke test. |
| Add rate limits/quotas/caching for Kundli and Panchang | HIGH | Medium/Large | Public endpoints can fan out to VedAstro with no current limit. | Extend rate limiter to `/api/v1/kundli/generate` and `/api/v1/panchang/daily`; add per-IP and maybe per-device/session quotas; cache Panchang by date/location bucket if acceptable. | `InMemoryRateLimitFilter.java`, `RateLimitProperties.java`, service/controller tests | Reduces API cost abuse and DoS risk. | Legitimate heavy testers may hit limits; need UX for 429. | Yes, verify normal use is not blocked. |
| Remove sensitive values from backend INFO logs | HIGH | Small | Coordinates, locationName, and birthPlace are logged today. | Log endpoint hit, coarse result, request ID, and validation outcome only; do not log raw PII/location. | `PanchangController.java`, `KundliController.java`, logging tests | Protects users if logs are exported/retained. | Lower debugging detail; replace with safe request IDs. | No, backend-only; staging log review needed. |
| Add privacy policy access and prepare Play Data Safety disclosure | HIGH | Medium | Play requires accurate disclosure; source has no policy link/in-app privacy surface. | Host privacy policy; add accessible in-app link; document data collection, sharing/service providers, retention, deletion/contact. | `SettingsScreen.js` or app navigation, Play Console, hosted policy | Reduces Play rejection and user transparency risk. | UI copy/legal review may take time. | Yes, verify policy reachable in app. |

## Phase 1 - Must Fix Before Public Production Release

Serious abuse/privacy/security issues after Phase 0.

| Recommendation | Severity | Difficulty | Why it matters | Safe implementation approach | Files likely involved | Risk reduction | Regression risk | User testing needed? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sanitize external API errors returned to clients | MEDIUM | Small | Current handler returns `ExternalApiException` messages containing provider/method internals. | Return generic user-safe messages; keep detailed internal logs without secrets/PII. | `GlobalExceptionHandler.java`, `VedAstroClient.java`, `DreamApiClient.java`, tests | Reduces information leakage and brittle UX. | Tests expecting exact provider message must change. | Yes, error UX smoke test. |
| Add stronger server-side validation and request limits | MEDIUM | Medium | Some public string inputs are unbounded or not enum/pattern checked before upstream calls. | Use DTOs for Panchang query; add `@Size`, `@Pattern`, gender enum/allowlist, ayanamsa allowlist, request size config. | `PanchangController.java`, DTOs, `KundliGenerateRequest.java`, `application.yml`, tests | Rejects bad input before paid/quota APIs. | Some previously accepted free-form inputs may fail. | Yes, validate normal places and unknown-time flow. |
| Lock production CORS to official origins | MEDIUM | Small | Wildcard CORS allows any web origin to call browser-accessible endpoints. | Set `ALLOWED_ORIGINS` to official PWA/domain list in production; leave local dev separately configured. | `application.yml`, deployment env, `CorsConfig.java` tests | Reduces browser abuse surface. | Incorrect origin list can break PWA. | Yes, PWA API smoke test. |
| Update root secret ignore rules | MEDIUM | Small | Root `.env` is not ignored, only `.env*.local`. | Add `.env`, `.env.*`, and allow `.env.example` as needed. | `.gitignore` | Prevents accidental secret commits. | Could hide intended env examples if pattern too broad. | No. |
| Plan dependency upgrades without blind audit fix | MEDIUM | Medium/Large | npm audit has critical/high transitive advisories; backend Tomcat is behind official fixes. | Upgrade along Expo-supported path; update Spring Boot BOM; run tests/builds after each step. | `package.json`, `package-lock.json`, `bhakti-backend/pom.xml` | Reduces known dependency vulnerability exposure. | Expo/RN/Spring upgrades can break runtime. | Yes, full app and backend regression pass. |
| Inspect release AAB/native manifest | HIGH/External | Medium | Expo source does not prove targetSdk, permissions, cleartext, backup, or exported components. | Build release artifact; inspect with Android tooling/Play Console; verify target API 35+, cleartext disabled, least permissions. | EAS build artifact, generated Android manifest | Prevents Play/security misconfiguration. | Build profile/env issues may surface. | Yes, install release build. |

## Phase 2 - Strong Hardening Improvements

Recommended after release blockers are cleared.

| Recommendation | Severity | Difficulty | Why it matters | Safe implementation approach | Files likely involved | Risk reduction | Regression risk | User testing needed? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Add PWA deployment security headers | MEDIUM | Small/Medium | No CSP/HSTS/header config was found. | Configure CSP, HSTS, Referrer-Policy, Permissions-Policy, X-Content-Type-Options at hosting layer. | Hosting/CDN config | Reduces browser exploit blast radius. | Overstrict CSP may block Expo bundle/assets. | Yes, PWA smoke test. |
| Add share-preview warning for Kundli | MEDIUM | Small | Share text contains personal birth details. | Show a confirmation preview before invoking OS share. | `KundliScreen.js` | Reduces accidental user-initiated disclosure. | Minor UX friction. | Yes. |
| Add explicit local-data controls | LOW/MEDIUM | Small | Language is locally stored; future Kundli caching would need deletion controls. | Add clear language preference or app data note; do not cache birth profiles unless necessary. | Settings/context files | Improves privacy transparency. | Low. | Yes, Settings QA. |
| Remove/gate nonessential frontend console logs | LOW | Small | Console logs are noisy and can become sensitive later. | Gate behind a production-safe debug flag or remove. | `horoscopeService.js`, `PujaScreen.js`, `KundliResultScreen.js`, `panchangService.js` | Reduces accidental leakage/noise. | Low debugging convenience loss. | No. |
| Keep generated artifacts out of source control | LOW | Small | `.expo-check` generated bundle is tracked and can be stale. | After confirming not needed, ignore/remove generated export artifacts in a dedicated cleanup PR. | `.gitignore`, `.expo-check/` | Reduces confusion and stale config exposure. | If tooling expects it, CI/docs may need adjustment. | No. |
| Add structured safe logging and request IDs | LOW/MEDIUM | Medium | Production debugging needs correlation without PII. | Add request ID filter, safe log fields, and redaction conventions. | Backend config/controllers/filter | Improves incident response without PII. | Log format changes. | No. |

## Phase 3 - Future Scaling Improvements

For growth, higher traffic, or abuse-sensitive launches.

| Recommendation | Difficulty | Why it matters | Safe implementation approach | Risk reduction | Regression risk | User testing needed? |
| --- | --- | --- | --- | --- | --- | --- |
| Move from in-memory to distributed rate limiting | Medium/Large | Current limiter resets on restart and does not coordinate across replicas. | Use API gateway, Redis, or managed edge rate limiting with per-route policies. | Better protection at scale. | Deployment complexity. | Load testing. |
| Add response/request caching strategy for Panchang | Medium | Panchang data is predictable by date/location and can reduce VedAstro calls. | Cache by date, ayanamsa, rounded location/timezone; define TTL and cache invalidation. | Lower cost and latency. | Incorrect cache key can serve wrong location/date. | Yes. |
| Add third-party quota monitoring and budget alerts | Medium | API abuse may be noticed only after quota/cost spike. | Provider-side quotas, backend metrics, alerting on per-route upstream calls. | Early abuse detection. | Alert noise. | No. |
| Define formal retention/deletion policy | Medium | Logs and third-party processing need documented retention. | Align privacy policy, host log retention, provider DPAs/terms, deletion contact path. | Privacy compliance maturity. | Operational process changes. | Owner/legal review. |
| Consider authentication or app attestation for expensive endpoints | Large | Anonymous use may be product-intended, but expensive APIs need stronger controls at scale. | Consider Play Integrity/App Check/device-bound quotas, not necessarily user accounts. | Reduces bot/proxy abuse. | Can block legitimate users on unsupported devices. | Yes, broad device testing. |
| Add incident response and secret rotation playbook | Medium | Secrets are env-based, but operational rotation procedure is not documented. | Document key owners, rotation steps, monitoring, breach response. | Faster response to leaked keys or provider abuse. | Low. | No. |

## Do Not Do Automatically

- Do not run `npm audit fix` without an Expo/RN compatibility plan.
- Do not add authentication just because endpoints are anonymous; first decide product intent and abuse model.
- Do not cache personal Kundli results unless retention/deletion UX and privacy policy are ready.
- Do not claim Play compliance until the release AAB, privacy policy, and Data Safety form are reviewed.
- Do not claim "fixed" because tests pass; tests only verify behavior, not security posture.

