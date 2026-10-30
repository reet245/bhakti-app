# Bhakti

Expo/React Native devotional app with a Java 17 Spring Boot backend. Screens include Panchang, Kundli, virtual Puja, Mantras/Jaap, horoscope, festivals, settings and privacy information.

See [fix status and blockers](docs/FIX_STATUS.md) before treating this branch as release ready. Blocked features are preserved. No production environment or signing credentials are committed.

## Local development

Use Node.js 22.13 or later on the Node 22 LTS line, npm, Java 17 and Maven 3.9 or later.

```sh
npm ci --ignore-scripts
cp .env.example .env.local
```

Set `EXPO_PUBLIC_API_BASE_URL` in `.env.local` to your local backend, for example `http://localhost:8080` for web/iOS simulator or your computer's LAN address for a physical device. Android emulator development can infer `http://10.0.2.2:8080`. Never put provider keys in `EXPO_PUBLIC_` values: they are embedded in the app.

Start the backend in another terminal:

```sh
cd bhakti-backend
mvn spring-boot:run
```

Configure its provider settings as described in [backend setup](bhakti-backend/README.md). A local `.env` is an example configuration file; Spring does not load it automatically. Set the variables in the process environment or use a tool that does so.

```sh
npm start
# or
npm run web
```

The app requests device location only when you choose to detect it. Manual birthplace/Panchang selection is also available. No account/database is required for the present flows.

### Opening on an Android phone with Expo Go

This project uses Expo SDK 58. Use Expo Go for SDK 58 on Android; the [official Android download page](https://expo.dev/go?device=true&platform=android&sdkVersion=58) provides the matching build if the installed app reports a version mismatch.

For `npm start`, connect the phone and computer to the same Wi-Fi network and scan the terminal's QR code in Expo Go.

If the phone can open `http://<computer-wifi-address>:8081/status` but Expo Go times out with "Something went wrong", Expo's online development-certificate lookup may be stalled. Start Expo in its supported offline mode and scan the new QR code:

```sh
npm run start:offline
```

Offline mode still serves the app over Wi-Fi; it skips Expo CLI's online service requests and uses a cached development certificate when available. It does not disable the app's own network requests. Keep the terminal running. Do not combine `--offline` with `--lan`, because offline mode already selects LAN.

If the phone cannot reach the computer at all, the tunnel command avoids the direct LAN connection:

```sh
npm run start:tunnel
```

Keep that terminal running and scan its new QR code. SDK 58's tunnel requires internet access on both devices and an Expo CLI sign-in (`npx expo login`), and can load more slowly. It tunnels Expo's development server only; backend features still need a separately reachable `EXPO_PUBLIC_API_BASE_URL`.

## Checks

```sh
npm run check
npm test
npm run check:expo
npm audit --omit=dev
cd bhakti-backend
mvn verify
```

CI checks source/asset imports, behavior tests, Expo version alignment, production web export, critical npm advisories, and backend verification. Remaining high dependency advisories are disclosed in `docs/FIX_STATUS.md`; a successful CI run does not mean there are no advisories.

## Production configuration

Set a real, reachable **HTTPS** `EXPO_PUBLIC_API_BASE_URL` before exporting or creating EAS preview/production builds. Missing/invalid release configuration is rejected. The test URL used by CI only checks bundling and cannot serve a deployed app.

```sh
npm run build:web
```

The export goes to `dist/`. This command also generates the service worker's release cache version. For subpath hosting set `EXPO_PUBLIC_BASE_PATH=/your-subpath` at build time and host the whole export there. API paths are relative to the configured backend, not to the web export.

Set `EXPO_PUBLIC_PRIVACY_POLICY_URL` to the owner's reviewed HTTPS privacy policy. The in-app Privacy & data screen explains current data flows; it does not invent an operator contact or retention promise. Before release, complete that information and store disclosures, configure allowed CORS origins/trusted proxies, review the hosted geocoder's terms, verify backend quotas, and inspect actual signed native permissions.

EAS development, preview and production profiles use the corresponding EAS environment. Configure public variables in that environment. Reminder scheduling is opt-in at 9 AM device-local time and needs an installed development/release build; web/Expo Go show the unsupported state. Native audio, speech, reminders and back/permission behavior require physical-device verification.

## Feature data and limits

- The backend proxies and caches horoscope RSS; the app no longer requests the feed directly from a browser. Hindi/provider-specific lucky values require a real source and show explicit unavailable states.
- Kundli location lookup returns candidates with coordinates and IANA timezones. Select the intended place; ambiguous names are not silently chosen. Public Open-Meteo geocoding is for noncommercial use: commercial deployment needs an appropriate customer endpoint/key or another licensed service. Include the displayed Open-Meteo/GeoNames attribution. The calendar instead uses bundled city presets or manual coordinates and timezone, with no geocoding request.
- The calendar has Month and Daily Panchang tabs. Month initially fits the complete illustrated almanac, including festivals and Panchak/Gand Mool periods, within the available screen width and height. Pinch to zoom in for details, drag to read any part, and pinch back out to the complete month. The overview automatically stays fitted when screen size or orientation changes, without manual sizing controls. Tap a date for readable daily details. It includes home access, Hindi/English labels, saved location, date navigation and sharing. Panchang and North Indian Hindu festivals calculate offline with MIT-licensed `panchang-ts@5.4.0`; no API subscription, key or backend is needed for these calculations.
- Calendar dates support 1900–2100, both lunar month systems, transition times, Sun/Moon events and traditional daily periods. Non-Hindu moving festivals retain explicitly labelled 2026 reference coverage. See [data sources, correction policy and limits](docs/CALENDAR_DATA.md); computational coverage does not certify every ritual date. Existing artwork is reused.
- Dosha/remedy features remain present with explicit availability messages where no real provider calculation exists.
- Mantras & Shlokas is a bundled offline collection: deity/type filters, multilingual full-text search, all 700 Gita verses with chapter browsing, daily reading, favorites, personal mantras and persistent Jaap. It is accessible from Home, the center navigation item, Puja and related festival stories. See [sources, licensing and content coverage](docs/MANTRA_SOURCES.md).
- The reader offers Devanagari, Bengali script and Roman transliteration. English/Hindi/Bengali original meaning summaries cover the curated devotional works and selected Gita verses; missing meanings are explicitly shown. Script conversion is labeled separately from translation. Only matching existing recordings are played.
- Legacy simulated Kundli/matching screens are retained as demos, not connected as real calculations.
- User preferences/favorites, personal mantra texts/notes, reading preferences, Jaap progress, reminder ID and selected Panchang location are stored locally. Personal mantras can be edited/deleted from their reader. Clear the saved location in Settings or clear app/browser storage to remove local data.

Assets remain in `assets/`. Generated `.expo-check/` exports are no longer tracked; no source media was deleted. Playback uses `expo-audio` and `expo-video`; device playback and media fidelity still require physical-device validation. Broader media transcoding remains deferred.

For optional **lossless** PNG recompression of an already exported web build, run `node scripts/optimize-web-png.cjs dist`. This checks the export root, preserves metadata and exact inflated pixel data, writes only smaller results, and stops after a bounded time. Measured savings were modest, so it is not part of the default build.
