# Bhakti

Expo/React Native devotional app with a Java 17 Spring Boot backend. Screens include Panchang, Kundli, virtual Puja, Mantras/Jaap, horoscope, festivals, settings and privacy information.

See [fix status and blockers](docs/FIX_STATUS.md) before treating this branch as release ready. Blocked features are preserved. No production environment or signing credentials are committed.

## Local development

Use Node.js 22, npm, Java 17 and Maven 3.9 or later.

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
- Location lookup returns candidates with coordinates and IANA timezones. Select the intended place; ambiguous names are not silently chosen. Public Open-Meteo geocoding is for noncommercial use: commercial deployment needs an appropriate customer endpoint/key or another licensed service. Include the displayed Open-Meteo/GeoNames attribution.
- Dosha/remedy/muhurta features remain present with explicit availability messages where no real provider calculation exists.
- The existing festival dataset covers 2026. No future religious dates are guessed or rolled forward by Gregorian day/month.
- Longer devotional texts remain available as labeled partial texts until a verified complete edition is supplied. Only matching existing recordings are played.
- Legacy simulated Kundli/matching screens are retained as demos, not connected as real calculations.
- User preferences/favorites, Jaap progress, reminder ID and selected Panchang location are stored locally. Clear the saved location in Settings or clear app/browser storage to remove local data.

Assets remain in `assets/`. Generated `.expo-check/` exports are no longer tracked; no source media was deleted. Broader media transcoding and migration from deprecated `expo-av` are documented as pending device/fidelity validation.

For optional **lossless** PNG recompression of an already exported web build, run `node scripts/optimize-web-png.cjs dist`. This checks the export root, preserves metadata and exact inflated pixel data, writes only smaller results, and stops after a bounded time. Measured savings were modest, so it is not part of the default build.
