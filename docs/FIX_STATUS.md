# Fix status and blocked work

Updated 23 October 2026. Based on the review of `main` at `b7692a2`. Prepared on `fix/repository-review`, then merged into the owner's Desktop checkout on `main`, preserving its existing security edits.

Instruction followed: fix what can be implemented and checked; preserve features when a blocker prevents completing them; record those blockers here. No missing astrology, recordings, festival dates, operator information or provider credentials were invented. No source media or blocked feature was deleted.

## Implemented

| Review area | Changes |
| --- | --- |
| Kundli input | Blank editable birth date/time, validation per step, future/invalid date rejection, explicit unknown time, request builder tests. |
| API configuration | Supported static Expo environment lookup; production HTTPS validation in web and EAS preview/production builds; no production HTTP inference; timeout/cancellation and safe network failures. |
| Place selection | Actual candidate search with IANA timezone and coordinates; explicit selection and manual fallback; search-provider disclosure/attribution. Historic offsets are calculated for birth/calculation date. |
| Panchang | Shared saved selected location across screens/horoscope; local-coordinate deletion in Settings; focus/resume/midnight refresh; request cancellation and stale-result protection; partial-result support and real tithi flags. |
| Kundli output | Existing D1/D9 data, predictions, Sun Sign, dasha dates and unique row keys exposed; unsupported sections show availability text. Legacy simulated routes retained and explicitly labeled demos. |
| Horoscope | Backend RSS adapter, current dated entries, freshness/duplicate checks, hardened XML parsing, bounded cache and response size; browser calls Bhakti backend; cards no longer present constants as current readings. |
| API abuse controls | Quotas for every provider route, trusted-proxy boundary, bounded counters, concurrency limits, provider deadline, finite input validation, bounded caches, request IDs and redacted logs. |
| Backend dependencies/container | Java 17-compatible Spring Boot 3.5.16; Docker runs verification and uses a non-root runtime user. |
| Frontend dependencies | Expo/Constants compatible patch updates; semver-safe audit repairs; tested PostCSS 8.5.31 override. Critical findings cleared; remaining findings below are not hidden. |
| Audio | Matching aarti recordings connected to mantra controls; Lakshmi Puja recording connected; asynchronous sound creation is cancelled/unloaded on blur/background/unmount/reset. Unsupported recordings explicitly say unavailable. |
| Text content | Maha Mrityunjaya, Vakratunda Mahakaya and Saraswati Vandana completed from linked source editions. Other partial texts retained with labels. |
| Favorites and Jaap | Shared persistent favorites; saved per-mantra/target Jaap counts and elapsed time; live timer, pause/resume, 108-bead mala counting. |
| Theme/language | Theme preference persisted; shared devotional dark palette applied across current screens; primary Hindi controls and language notices; bottom navigation localized. |
| Privacy/reminders | In-app Privacy & data screen and optional published-policy link; location clearing; opt-in 9 AM local reminder scheduling in installed builds with explicit unsupported web/Expo Go state. No permission prompt on startup. |
| Festivals | One shared dated dataset across festival/Panchang views; timezone-aware today; date/resume refresh; explicit 2026 coverage and no invented future dates. |
| PWA | Scope-relative shell assets, release-specific cache version, scoped cache cleanup, entry cap and declared-size filter, API exclusion and storage-failure resilience. Responses without Content-Length do not get a byte-size check. Optional subpath build configuration. |
| Repository/quality | Root setup/release documentation, environment example/ignore rules, source/asset checks, focused regression tests and GitHub Actions. Generated `.expo-check/` files untracked but retained locally; originals in `assets/` preserved. |
| Desktop integration | Existing generic provider-error responses, redacted optional-section logs, environment-file ignore exceptions and private/LAN API-host rejection preserved. Local backup ZIPs are ignored and retained on disk; they are not source changes. |

## Blockers and deliberately skipped parts

| Area | Why completion is blocked | Preserved behavior / next requirement |
| --- | --- | --- |
| Production backend address/deployment | No deployed HTTPS endpoint, hosting configuration or deployment authorization was supplied. | Build guard is implemented. Set the real `EXPO_PUBLIC_API_BASE_URL`, production CORS origins and trusted proxy IPs; then exercise the deployed app. Test hosts used during verification are not production configuration. |
| GitHub publication | The initial connector has read-only access. The Desktop checkout's configured Git credentials were also rejected by GitHub with "Invalid username or token" during the requested push authentication check. | Fixes are integrated in the Desktop checkout's `main` branch. Sign in through Git Credential Manager with a repository writer account, then push to `origin/main`. No credentials were copied or committed; local commits alone do not confirm publication. |
| Privacy policy/store release | Operator contact, actual server/provider retention, hosting processors, store declarations and reviewed policy URL are owner-specific. | Privacy & data explains observed flows without pretending to be a complete approved policy. Configure `EXPO_PUBLIC_PRIVACY_POLICY_URL` and complete owner/store review. |
| Live VedAstro results | No verified production provider configuration or signed-device run is available. Unit/provider-stub checks cannot certify live astronomy contract accuracy. | Existing integration and sections remain. Verify known reference birth charts, actual upstream response shapes and operational quotas with the configured provider. |
| Dosha, remedies, house interpretations | No authoritative calculation/interpretation contract exists in this repo. | Tabs/screens retained with explicit unavailable states. Supply the provider contract and reviewed interpretation content. |
| Remaining Panchang fields | No verified source for tithi/nakshatra transition times, muhurta, Rahu Kaal, moonrise/set, Samvat or ritu was supplied. | Existing cards/views remain and mark these fields unavailable; no static times are substituted. |
| Hindi horoscope and lucky values | The configured RSS is English and does not supply separate love/career/health/lucky-color/lucky-number/time fields. | Overview cards retained with honest unavailable values; Hindi is explicit about source availability. Requires a licensed source or reviewed translation workflow. |
| Dream interpretation integration | The configured Dream provider's exact request/response/authentication contract and credentials have not been supplied. | Existing endpoint and placeholder adapter are preserved, with route protection/validation. Complete and verify the adapter after choosing the provider. |
| Matching | Existing percentage formula is a demo; no real compatibility provider/algorithm contract. | Legacy matching/result code kept, validation improved and demo banners added. It is not advertised as real matching. |
| Missing recordings | Eleven of fourteen library entries have no matching bundled recording. | Entries/text/play affordances remain with unavailable feedback. Supply the correct recordings and distribution rights. |
| Remaining long texts | Nine existing partial works need a verified complete edition, including ambiguous Kavach, bhajan, Ram Raksha and Friday Vrat Katha variants. | Existing passages retained and labeled partial texts; no unrelated text substituted. Sources for completed works are linked in the data module. |
| Future/regional festivals | The bundled dates cover only 2026 and lack a vetted multi-year regional source. | All dates preserved. Coverage is displayed and expired coverage yields an explanatory message; no Gregorian year-rollover of lunar dates. |
| Geocoder licensing | Open-Meteo public geocoding is for noncommercial use. Commercial deployment needs a customer endpoint/key, self-hosting or another compatible licensed source. | Lookup/manual inputs remain. URL/key are configurable; attribution is displayed. Check provider terms before commercial launch. |
| Horoscope redistribution rights | A publicly readable RSS feed does not establish permission to redistribute its full text in this app. Provider permission or applicable license has not been supplied. | Feed attribution and configurable source remain. Confirm redistribution rights or configure a licensed feed before publication. |
| Remaining npm advisories | The fresh Desktop audit still flags `node-forge` and Metro's `image-size`, with propagated findings through the Expo/React Native dependency graph. Metro's `image-size` 1.x needs a tested 2.x API migration. Earlier audit responses also flagged `braces`. | Current SDK retained. Do not force an incompatible Expo/React Native change. High advisories remain visible; CI blocks critical advisories and reports all findings. Reassess after upstream patches or a tested SDK/Metro migration. |
| expo-av migration | Replacing the deprecated audio/video library requires an SDK-aligned migration and device validation. | Working playback preserved. Do not remove playback merely to clear a deprecation warning. |
| Full Maven advisory scan | The Spring baseline was updated and regression tested, but a complete transitive Maven vulnerability database scan was not run. | Do not claim zero backend advisories. Run the organization's scanner/dependency review in the normal CI environment and assess deployment-specific reachability. |
| Native verification | No signed Android/iOS artifact or physical-device session was available. | GPS, speech, background audio, Android hardware back and notification delivery remain implemented but need installed-device checks. Native manifest explicitly blocks unused recording/storage permissions; inspect the final artifact before release. |
| Complete Hindi/editorial coverage | Long devotional/provider text and remaining detailed labels need reviewed translations. | Existing English content remains accessible with language notices. Existing Hindi dictionaries and newly localized controls remain. |
| Media delivery/quality | Resizing/transcoding audio/video changes quality and may need hosting/licensing choices; device fidelity has not been measured. | Original source media retained. Lossless web encoding optimization, if validated, is separate from any lossy/native asset migration. Total export size is not a measured first-page download or AAB size. |
| Multi-replica quotas/operations | Redis/gateway service and hosting access were not supplied. | Single-instance counters/concurrency and caches implemented. Configure shared edge/gateway quotas and provider budgets before scaling replicas. |

## Verification evidence

Local build/test logs are working files, not committed secrets. Fresh audit JSON is saved in [DEPENDENCY_AUDIT_2026-10-23.json](DEPENDENCY_AUDIT_2026-10-23.json).

Desktop transfer verification: `npm ci --ignore-scripts` completed, source/asset checks and all 38 frontend tests passed. All merged backend production and test sources were recompiled with ECJ targeting Java 17; Maven Surefire then passed all 30 tests, including the seven Kundli controller integration tests and provider-error sanitization assertion. This does not remove the ordinary Maven compilation limitation below.

- `npm run check`: passed for 66 source/test/script files and relative asset imports.
- `npm test` in the Desktop checkout: **38 tests passed**, 0 failures/skips (Kundli/Panchang dates/request models, partial data, audio lifecycle, Jaap sessions/timer, horoscope contracts, API configuration/cancellation, private/LAN host rejection, service-worker storage failures and cache ownership, dark contrast, PNG roundtrip).
- `npm run check:expo`: passed against the online SDK54 compatibility list.
- Production web export with a test HTTPS URL: passed; emitted bundle contains the supplied URL and no optional-chain environment lookup.
- Production web export without a backend URL: correctly failed before bundling.
- `git diff --check`: passed.
- Backend: **55 main Java sources and all test sources compiled with Eclipse ECJ targeting Java 17**, then actual Maven Surefire ran **30 tests, 0 failures/errors/skips**. After the final strict title-date parsing tweak, the five horoscope tests also passed. The repo's Maven compiler configuration was not changed to work around this machine.
- Ordinary Maven compilation was blocked by local Java `AccessDeniedException` at JAR/zipfs canonical-path resolution. Normal `mvn clean verify` on CI remains a release gate; the successful ECJ/Surefire run is not a claim that this local clean lifecycle passed.
- Running backend smoke: health responded successfully; live anonymous RSS adapter returned **12 signs dated 2026-10-23**; a public Berlin place query returned candidates with **Europe/Berlin**. No personal birth details or device coordinates were sent in this smoke check. Live Kundli/Panchang provider accuracy is still unverified.
- Browser production-export smoke: missing name blocked advancement; editable birth date **1990-02-03** and time **15:45**, a manual Kolkata location and **Asia/Kolkata** appeared correctly on Review Details. Settings showed the disabled web reminder state and opened Privacy & data; no browser error logs were captured. No sample details were submitted to a live astrology provider.
- Initial npm audit after compatible updates: **22 high, 0 critical/moderate/low** flagged packages, down from 42 total/2 critical/32 high. A fresh audit after the Desktop install returned **37 high, 0 critical/moderate/low**; this later snapshot is saved in [DEPENDENCY_AUDIT_DESKTOP_2026-10-23.json](DEPENDENCY_AUDIT_DESKTOP_2026-10-23.json). Counts include propagated dependency findings and vary with npm advisory responses; the later report identifies `node-forge` and `image-size` as direct advisory causes. Do not mistake 0 critical for 0 risk.
- Optional lossless web-PNG optimizer: one bounded 90-second run scanned 47 exported PNGs, optimized 21, and saved **995,281 bytes (~0.95 MiB)**; exact inflated image data and metadata were preserved. Savings are modest, so it remains a manual tool rather than slowing every build. Original media is untouched.
- Automatic approval review rejected starting the local Expo development server: approval was required, while this environment disables that approval category. Static exports are used for browser checks. No security protection was disabled.

## Owner follow-up

Use this file as the remaining-work list. Blocked parts are kept; none should be marked fixed merely because a placeholder renders or a unit test passes. The actual deployed endpoint, privacy/store configuration, licensed data/media sources and native release evidence are required to close the corresponding rows.
