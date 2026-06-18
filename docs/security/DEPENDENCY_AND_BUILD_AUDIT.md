# Bhakti Dependency and Build Audit

Date: 2026-06-18
Scope: Non-destructive dependency/build/release checks only. No package upgrades, `npm audit fix`, dependency installs, source edits, or lockfile edits were performed.

## Project Inventory

Frontend:

- Entry files: `App.js`, `index.js`.
- Source: `src/`.
- Expo config: `app.json`.
- EAS config: `eas.json`.
- PWA assets: `public/index.html`, `public/manifest.json`, `public/sw.js`.
- Package files: `package.json`, `package-lock.json`.
- Native folders: no checked-in `android/` or `ios/` folders were found.
- Generated/exported artifacts: `.expo-check/` is tracked; `dist/` exists locally and is ignored.

Backend:

- Root: `bhakti-backend/`.
- Build file: `bhakti-backend/pom.xml`.
- Runtime config: `bhakti-backend/src/main/resources/application.yml`.
- Source: `bhakti-backend/src/main/java`.
- Tests: `bhakti-backend/src/test`.
- Dockerfile: `bhakti-backend/Dockerfile`.
- Maven wrapper: not present (`mvnw` not found).

## Commands Run

| Check | Command | Result |
| --- | --- | --- |
| Git status | `git status --short --branch` | Clean: `## main...origin/main` |
| Expo public config | `npx.cmd expo config --type public --json` | Succeeded; emitted public config only. |
| npm audit | `npm.cmd audit --omit=dev --json` | First sandboxed run failed due registry/network; escalated run succeeded and reported advisories. |
| Direct npm dependency list | `npm.cmd ls --depth=0 --json` | Succeeded. |
| npm scripts | `npm.cmd run` | Succeeded; scripts are `start`, `android`, `ios`, `web`, `build:web`. |
| Maven version | `mvn.cmd -v` | Maven 3.9.16, Java 17.0.19. |
| Maven dependency tree | `mvn.cmd dependency:tree -DskipTests` | First sandboxed run failed due Maven Central/network; escalated run succeeded. |
| Backend tests | `mvn.cmd test` | First sandboxed run failed due Maven Central/network; escalated run succeeded: 10 tests, 0 failures, 0 errors. |
| Web build | `npm.cmd run build:web` | Not run because it writes generated web output outside the requested audit docs. |
| Lint/typecheck | N/A | No lint/typecheck scripts were defined in `package.json:5-10`. |

## Frontend Dependency Inventory

Declared direct dependencies from `package.json:12-29`:

| Package | Declared version | Installed version from `npm ls` | Direct? | Notes |
| --- | --- | --- | --- | --- |
| `expo` | `~54.0.33` | `54.0.34` | Yes | Expo SDK 54. |
| `react-native` | `0.81.5` | `0.81.5` | Yes | Affected by npm audit transitive chain via `babel-jest`. |
| `react` | `19.1.0` | `19.1.0` | Yes | No audit advisory reported directly. |
| `react-dom` | `19.1.0` | `19.1.0` | Yes | No audit advisory reported directly. |
| `@react-native-async-storage/async-storage` | `2.2.0` | `2.2.0` | Yes | Used only for language preference. |
| `@react-navigation/native` | `^7.2.2` | `7.2.2` | Yes | No direct audit advisory reported. |
| `@react-navigation/native-stack` | `^7.14.12` | `7.14.12` | Yes | No direct audit advisory reported. |
| `expo-location` | `~19.0.8` | `19.0.8` | Yes | Location permission/API used. |
| `expo-notifications` | `~0.32.17` | `0.32.17` | Yes | Code is commented out, but dependency remains. |
| `expo-constants` | `~18.0.13` | `18.0.13` | Yes | Used by API config. |
| `expo-av` | `~16.0.8` | `16.0.8` | Yes | Puja audio playback. |
| `expo-speech` | `~14.0.8` | `14.0.8` | Yes | Horoscope speech. |
| `expo-status-bar` | `~3.0.9` | `3.0.9` | Yes | UI. |
| `react-native-safe-area-context` | `~5.6.0` | `5.6.2` | Yes | UI layout. |
| `react-native-screens` | `~4.16.0` | `4.16.0` | Yes | Navigation. |
| `react-native-web` | `^0.21.0` | `0.21.2` | Yes | PWA/web. |
| `@expo/metro-runtime` | `~6.1.2` | `6.1.2` | Yes | Web/Metro runtime. |

## npm Audit Findings

`npm.cmd audit --omit=dev --json` reported:

| npm severity | Count |
| --- | ---: |
| critical | 1 |
| high | 1 |
| moderate | 20 |
| low | 1 |
| total | 23 |

Important advisories:

| Package | Installed/affected range | npm severity | Direct/transitive | Evidence | Recommendation | Breaking-change risk | Play release impact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `shell-quote` | `1.1.0 - 1.8.3` | critical | Transitive | `npm audit` advisory `GHSA-w7jw-789q-3m8p`; fix available. | Update through dependency chain; do not blind-run `npm audit fix`. | Unknown; likely through tooling. | Needs remediation plan before public production; exploitability in release app not proven. |
| `ws` | `6.0.0 - 6.2.3`, `7.0.0 - 7.5.10`, `8.0.0 - 8.20.1` | high | Transitive | `npm audit` advisory `GHSA-96hv-2xvq-fx4p`; nodes include Expo/RN middleware packages. | Upgrade Expo/RN-compatible packages that pull fixed `ws`. | Medium; may require Expo/RN upgrades. | Should be resolved or risk-accepted before production. |
| `expo` | `>=41.0.0-alpha.0` via transitive Expo packages | moderate | Direct | `npm audit` reports direct `expo` affected through `@expo/cli`, `@expo/config`, `expo-asset`, `expo-constants`. | Upgrade within Expo-supported path, likely SDK migration. | High if major SDK jump. | Not an immediate code exploit finding, but release hardening needed. |
| `expo-constants` | audit range includes `10.1.2 - 55.0.14` | moderate | Direct | `npm audit` direct package advisory through `@expo/config`. | Upgrade via Expo SDK-compatible version. | Medium/high with SDK alignment. | Needs planned upgrade. |
| `expo-notifications` | audit range includes current family | moderate | Direct | `npm audit` direct package advisory via `expo-constants`. | Remove if unused or upgrade. | Medium. | If unused, removal reduces permission/dependency surface. |
| `react-native` | `0.76.0-nightly... - 0.85.0-rc.7` | moderate | Direct | `npm audit` reports via `babel-jest`. | Upgrade according to Expo SDK compatibility, not standalone RN latest unless Expo supports it. | High. | Needs risk review. |
| `postcss`, `js-yaml`, `brace-expansion`, `tar`, `uuid`, `@babel/core` | Various | low/moderate | Transitive | `npm audit` details in command output. | Upgrade through parent packages. | Varies. | Lower priority than API/log/privacy blockers. |

Limitations:

- npm audit identifies package advisories, not whether the vulnerable code path is reachable in the mobile/PWA release.
- No dependency upgrade was performed.
- No `npm audit fix` was run.

## Backend Dependency Inventory

Declared backend dependencies from `bhakti-backend/pom.xml:25-47`:

| Dependency | Version source | Scope | Direct? |
| --- | --- | --- | --- |
| `spring-boot-starter-web` | Spring Boot parent `3.3.5` | compile | Yes |
| `spring-boot-starter-validation` | Spring Boot parent `3.3.5` | compile | Yes |
| `spring-boot-starter-actuator` | Spring Boot parent `3.3.5` | compile | Yes |
| `spring-boot-configuration-processor` | Spring Boot parent `3.3.5` | compile optional | Yes |
| `spring-boot-starter-test` | Spring Boot parent `3.3.5` | test | Yes |

Key runtime transitive dependencies from Maven tree:

| Package | Version |
| --- | --- |
| Spring Boot | `3.3.5` |
| Spring Framework | `6.1.14` |
| Embedded Tomcat core/websocket/EL | `10.1.31` |
| Jackson databind/core/annotations | `2.17.2` |
| Logback | `1.5.11` |
| Log4j API bridge | `2.23.1` |
| SnakeYAML | `2.2` |
| Hibernate Validator | `8.0.1.Final` |
| Micrometer | `1.13.6` |

Backend dependency findings:

| Package/library | Installed version | Severity | Direct/transitive | Evidence | Recommendation | Breaking-change risk | Required before Play release? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `tomcat-embed-core` | `10.1.31` | MEDIUM | Transitive via Spring Boot web | Maven tree; official Apache Tomcat 10 security page lists many fixes after 10.1.31: https://tomcat.apache.org/security-10.html. | Upgrade Spring Boot BOM to a maintained patched release that pulls fixed Tomcat. | Medium; regression test backend endpoints. | Backend should be patched before public production. |
| Spring Boot BOM | `3.3.5` | INFO/Needs external verification | Direct parent | `pom.xml:7-11` | Run a Maven vulnerability scanner such as OWASP Dependency-Check or OSV in CI; not run here to avoid creating reports/new tooling. | Varies. | Needs external verification. |

## Expo / Android Release Readiness

Source evidence:

| Area | Evidence | Assessment |
| --- | --- | --- |
| App name/slug/version | `app.json:3-5` | Present. |
| Android package/versionCode | `app.json:18-25` | Package `com.hreetp.bhaktiapp`; `versionCode` 1. |
| EAS production auto increment | `eas.json:14-16` | Present. |
| Public Expo config | `npx.cmd expo config --type public --json` | Succeeded; no secret values found. |
| Owner/projectId | `app.json:39-43` | Public metadata, not secret. |
| Permissions | No explicit `android.permissions` in `app.json`; `expo-location` used in code | Release manifest must be inspected to see generated permissions. |
| targetSdkVersion | Not shown in source/public Expo config | Needs release/prebuild artifact verification. Google Play requires API 35+ for new apps/updates from 2025-08-31. |
| Native security flags | No checked-in AndroidManifest | Needs AAB/prebuild inspection for `debuggable`, `allowBackup`, `usesCleartextTraffic`, exported components, intent filters. |
| Signing config/keystore | No `.jks` tracked; root `.gitignore:15` ignores `*.jks` | Good; Play App Signing needs external verification. |

Release risks:

- `src/config/api.js:82-107` uses cleartext `http://` fallbacks. If a production build lacks `EXPO_PUBLIC_API_BASE_URL`, the app may call emulator/localhost/web-host HTTP.
- `app.json` does not expose target SDK or native manifest details; Expo-managed native output must be reviewed before Play submission.
- `expo-notifications` is installed but disabled in code; verify the final manifest does not declare unneeded notification permissions or prompts.

## PWA / Web Build Readiness

| Area | Evidence | Assessment |
| --- | --- | --- |
| PWA manifest | `public/manifest.json:1-26` | Basic name/icons/start/scope/display present. |
| Service worker | `public/sw.js:1-85` | Caches app shell/static assets; avoids cross-origin and non-static API caching. |
| Service worker registration | `public/index.html:29-36` | Present; logs registration failure. |
| API URL | `src/config/api.js:91-96` | PWA can infer `http://<host>:8080`; must be overridden with HTTPS. |
| Security headers | No deployment config found | Needs external deployment verification. |
| Personal data in browser storage | Search found only AsyncStorage language preference | Good; Kundli/Panchang data not locally persisted by source code. |

## Generated Artifacts

`git ls-files` includes `.expo-check/_expo/static/js/android/index-619e61f47bd338fb9e22ae92e2d1f7a6.hbc` and `.expo-check/metadata.json`. `.expo-check/metadata.json:1` references a generated Android Hermes bundle and generated assets.

Assessment:

- Treat `.expo-check` as a stale generated artifact, not a release artifact.
- String-level scan did not prove an app secret in that bundle, but the scan is not equivalent to release AAB inspection.
- In remediation, consider ignoring/removing generated export artifacts from Git after confirming they are not required.

## Safe Build/Test Limitations

- Frontend `build:web` was intentionally not run because it writes generated output and the audit instructions restricted created files to `docs/security/`.
- No lint/typecheck command exists in `package.json`.
- No Android AAB was built or inspected.
- No OWASP Dependency-Check/OSV scan was run for Maven dependencies because that would require adding/running extra tooling and creating reports outside the requested docs.
- No production environment variables or hosted endpoints were tested.

