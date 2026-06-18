# Bhakti Data Flow and Privacy Inventory

Date: 2026-06-18
Scope: Source/config evidence only. Do not treat this as a legal privacy policy.

## Module Map

| Module/screen | Frontend entry file | Backend endpoint(s) | Data used | Third party used | Local storage used | Permission used | Personal data involved? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Home | `src/screens/HomeScreen.js` | None found | Static navigation/content | None found | None found | None found | No evidence |
| Settings | `src/screens/SettingsScreen.js` | None found | Theme state, language selection | None found | Language via `LanguageContext.js` | None found | Low; preference only |
| Language context | `src/context/LanguageContext.js` | None found | `appLanguage` | None found | AsyncStorage at lines 19, 24, 42 | None | No sensitive data found |
| Calendar/Panchang home | `src/screens/CalendarScreen.js` | `GET /api/v1/panchang/daily` | Date, foreground location coords, location label | Backend calls VedAstro | None found | Foreground location | Yes, precise location |
| Panchang detail screens | `PanchangCalendarScreen.js`, `TithiDetailScreen.js`, `PanchangMuhurtasScreen.js`, `PanchangFestivalsScreen.js` | `GET /api/v1/panchang/daily` through service | Date/Panchang fields | Backend calls VedAstro | None found | Indirect from Calendar/Panchang API | Possibly location via selected Panchang data |
| Kundli | `src/screens/KundliScreen.js` | `POST /api/v1/kundli/generate` | Name, gender, birth date, birth time, birthplace, optional lat/lon/timezone | Backend calls VedAstro | None found | Foreground location only if user taps detect | Yes |
| Kundli matching | `src/screens/KundliMatchScreen.js` | None found | Two names, two DOB fields, local compatibility score | None found | None found | None found | Yes, but local-only in source |
| Mantras | `MantrasScreen.js`, `MantraDetailScreen.js`, `JaapCounterScreen.js` | None found | Static mantra content, share text | OS/web share only | None found | None found | No evidence |
| Puja | `src/screens/PujaScreen.js` | None found | Static puja assets, audio playback | None found | None found | None found | No evidence |
| Daily Horoscope | `DailyHoroscopeScreen.js`, `HoroscopeDetailScreen.js`, `src/services/horoscopeService.js` | None found | Zodiac sign, language | Direct fetch to `https://feeds.feedburner.com/dayhoroscope` | None found | Speech API for local text-to-speech | No user profile data; third party may see network metadata |
| Upcoming Festivals | `UpcomingFestivalsScreen.js`, `FestivalDetailScreen.js` | None found | Static festival content, share text | OS/web share only | None found | None found | No evidence |
| Dream interpretation backend | No frontend caller found | `POST /api/v1/dream/interpret` | dreamText, optional date/time/location/language | Configured Dream API | None found | None found | Yes if endpoint is exposed/used |
| Health | None | `GET /api/v1/health` | status/service | None | None | None | No |

## Data Item Inventory

| Data item | Example category, not real value | Source | Feature/module | Optional or required | Stored locally? | Sent to backend? | Sent to third party? | Logged? | Retained? | Deletion/clear mechanism? | Encryption in transit evidence | User disclosure evidence | Play Data Safety likely needed? | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| App language | Language preference | User selects language in Settings | Settings/i18n | Optional | Yes, AsyncStorage key `appLanguage` at `LanguageContext.js:6`, `19`, `24`, `42` | No | No | Error object may be logged on failure at `LanguageContext.js:27`, `44` | Until overwritten/app data cleared | User can change language; no explicit clear-all | N/A | Settings UI | Usually no sensitive Data Safety item | High |
| Name | Personal info/name | Kundli form | Kundli | Required for generate | React state only, no storage found | Yes, `KundliScreen.js:537-545` | No evidence name is sent to VedAstro; backend returns it at `KundliService.java:139-157` | Not directly logged in source | Backend memory/request lifecycle; hosting logs need verification | No app deletion flow; no account system | Depends on API URL; code can use HTTP fallback | No privacy policy found | Yes | High |
| Gender | Other personal info | Kundli form | Kundli | Required by client/backend | React state only | Yes | No evidence gender sent to VedAstro | Not directly logged | Backend memory/request lifecycle | No explicit deletion needed if not retained; logs need verification | Depends on API URL; code can use HTTP fallback | No privacy policy found | Yes | High |
| Birth date | Other personal info/date of birth | Kundli form | Kundli | Required | React state only | Yes | Encoded in VedAstro `StdTime` at `KundliService.java:174-175` | Not directly logged | Backend memory/request lifecycle | No explicit deletion needed if not retained; logs need verification | Depends on API URL; code can use HTTP fallback | No privacy policy found | Yes | High |
| Birth time | Other personal info | Kundli form | Kundli | Required unless unknown time | React state only | Yes | Encoded in VedAstro `StdTime`; unknown time uses noon at `KundliService.java:165-171` | Not directly logged | Backend memory/request lifecycle | No explicit deletion found | Depends on API URL | No privacy policy found | Yes | High |
| Birth place | Location/free text | Kundli form | Kundli | Required | React state only | Yes | Used to resolve location or passed as VedAstro location name at `KundliService.java:90-96` | Yes, `KundliController.java:30-33` | Logs likely retained externally | No explicit deletion found | Depends on API URL | No privacy policy found | Yes | High |
| Birth/current latitude/longitude for Kundli | Precise location | User taps "Detect My Location" | Kundli | Optional | React state only | Yes if present, `KundliScreen.js:547-551` | Yes, VedAstro receives location at `VedAstroClient.java:116-124` | Backend Kundli logs birthPlace only; provider logs unknown | Logs/provider retention unknown | No explicit deletion found | Depends on API URL | In-feature text exists at `KundliScreen.js:1131-1170`; no privacy policy | Yes | High |
| Current device location for Calendar | Precise location | `Location.requestForegroundPermissionsAsync` and `getCurrentPositionAsync` | Calendar/Panchang | Optional in OS permission, requested on Calendar load | React state only | Yes, `CalendarScreen.js:165-173` | Yes, VedAstro via `PanchangService.java:51-61` | Yes, `PanchangController.java:34-42` logs lat/lon/locationName | Logs likely retained externally | No explicit deletion found | Depends on API URL | Translation strings and UI label exist, no privacy policy | Yes | High |
| Panchang date | App functionality | Selected/today date | Panchang | Required | React state | Yes | Yes, in VedAstro time | Yes, `PanchangController.java:34-42` | Logs likely retained externally | No explicit deletion found | Depends on API URL | No privacy policy found | Maybe, if linked with location | High |
| Timezone/ayanamsa | App functionality/location context | Frontend constants/defaults/user optional | Panchang/Kundli | Mostly default | React state/request only | Yes | Yes | Yes for Panchang controller | Logs likely retained externally | No explicit deletion found | Depends on API URL | No privacy policy found | Possibly | Medium |
| Kundli result/profile | Personal generated content | Backend response | Kundli result | Generated after request | React state only | Already backend response | No further third party in frontend | Share action includes preview at `KundliScreen.js:575-580` | In memory until app/screen reset | Back from screen clears only navigation state, not guaranteed memory wipe | Depends on API URL for initial response | No privacy policy; share is user initiated | Yes | High |
| Kundli match names/DOBs | Personal info | Local form | Kundli match | Required for local match | React state only | No | No | No logs found | In memory only | Leaving screen/app clears state | N/A | No privacy policy found | Likely no collection if local-only; disclose local processing if desired | Medium |
| Horoscope zodiac sign | Preference/content selection | User route/sign | Daily horoscope | Optional | React state/route only | No Bhakti backend | RSS fetch to FeedBurner has no sign in request body from code | Non-sensitive logs at `horoscopeService.js:29-46` | In memory | N/A | HTTPS RSS URL | No privacy policy found | Usually no, but third-party network metadata needs owner review | Medium |
| Dream text/date/time/location/language | User-generated content and optional location/time context | Backend request body | Dream endpoint | dreamText required if called | No local storage found | Yes to backend if endpoint called | Yes to configured Dream API at `DreamService.java:36-65` and `DreamApiClient.java:49-57` | Route hit only at `DreamController.java:27-30`; external provider logs unknown | Provider/backend retention unknown | No deletion mechanism found | Backend outbound depends on `DREAM_API_URL`; HTTPS not enforced in code | No frontend disclosure found | Yes if feature is exposed | Medium |
| IP address | Network metadata | HTTP request | Backend/rate limiting/hosting | Automatic | Server/runtime only | Backend sees it | Hosting/proxy may process it | Rate limiter resolves remote address/XFF at `InMemoryRateLimitFilter.java:67-73`; not logged except rate-limit event without IP | Hosting access logs unknown | Hosting retention policy needed | HTTPS depends deployment | No privacy policy found | Usually Data Safety/manual legal review | Medium |
| Push notification token | Device identifier/token | None active | Notifications | Not applicable | No evidence | No evidence | No evidence | No evidence | No evidence | N/A | N/A | App.js notification code commented at `App.js:6`, `123-184` | No current code evidence | High |
| Email/account ID/password/payment/contacts/camera/microphone/files | Personal/sensitive categories | Search found none | N/A | Not applicable | No evidence | No evidence | No evidence | No evidence | No evidence | N/A | N/A | No privacy policy found | Not applicable based on source | High |

## Privacy Risk Notes

- Location is requested automatically when `CalendarScreen` mounts (`CalendarScreen.js:135-158`). Runtime permission is used, but a stronger pre-permission explanation and privacy policy are needed before Play review.
- Kundli location detection is user-triggered (`KundliScreen.js:1116-1139`) with a feature explanation, which is better than automatic collection, but data still flows backend-side to VedAstro.
- Kundli sharing is user-triggered but includes name/date/time/place. Add a preview/confirmation and mention user-initiated sharing in privacy disclosures.
- No account system was found, so account deletion is not currently applicable. Data deletion questions in Play Console still need truthful answers.
- No database layer was found; SQL injection is Not applicable based on current source.
- No analytics/crash SDK was found in `package.json`; crash/analytics Data Safety entries are Not applicable unless deployment adds external tools.

## Data Retention and Deletion Evidence

| Area | Evidence | Current conclusion |
| --- | --- | --- |
| Local language preference | `LanguageContext.js:19-24`, `41-44` | Retained until changed or app data cleared; no clear-all option. |
| Kundli form/result data | `KundliScreen.js:426-429`, `559-561` | In React state only; no AsyncStorage/localStorage use found. |
| Backend persistence | No repository/database dependency or repository layer found | No app database retention found. |
| Logs | Controllers log sensitive data; hosting access logs unknown | Retention/deletion needs deployment verification. |
| Third-party providers | VedAstro/Dream APIs receive data from backend | Provider retention/deletion must be documented by owner/legal review. |

## Disclosure Draft Checklist

Use this as a factual starting point for Play Console and privacy-policy drafting. Do not submit without owner/legal review.

| Disclosure item | Code-proven answer |
| --- | --- |
| Collects precise location? | Yes, Calendar foreground location and optional Kundli detect flow. |
| Collects personal info/name? | Yes, Kundli name. |
| Collects other personal info such as birth date/gender? | Yes, Kundli birth date/time/gender. |
| Shares data with third parties? | Backend sends location/time/ayanamsa to VedAstro; Dream endpoint sends prompt/context to configured Dream API if used. Determine service-provider vs third-party classification with contracts. |
| Encryption in transit? | Not safe to claim globally until `EXPO_PUBLIC_API_BASE_URL`/deployment HTTPS is verified; code has HTTP fallback. |
| User can request deletion? | No account system found; backend database not found; logs/provider retention need policy. |
| User data sold? | No code evidence of ads/sale; owner must confirm. |
| Ads present? | No ad SDK found in dependencies; owner must confirm Play declaration. |

