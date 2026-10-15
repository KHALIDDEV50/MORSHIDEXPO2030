# MORSHID — Android app (React Native + WebView)

A native Android shell around the MORSHID website. The app shows the same content as the web
app: it loads the deployed site in a full-screen WebView. Nothing in the site is duplicated.

- **Framework:** React Native 0.86 via **Expo SDK 57** (the setup React Native recommends), TypeScript.
- **Content:** `app.json` → `expo.extra.webUrl` (now `https://morshid-three.vercel.app`). Change it there to point at another deployment.
- **Package id:** `com.morshid.app` (`app.json` → `android.package`). Choose the final id **before** the first Play Store upload; it cannot change afterwards.
- **Permissions:** internet only (the defaults Expo adds for overlays, storage and vibration are blocked).

## What the shell does (`App.tsx`)

- Pages on the site's own address open inside the app; every other link (photo credits, official sources, `mailto:`/`tel:`) opens in the browser or the matching app. `target="_blank"` links do the same.
- The Android back button goes back inside the site first, then leaves the app.
- The splash screen (MORSHID logo on ivory, or charcoal in dark mode) stays until the first page has loaded.
- Offline or a server error on the first page shows a bilingual "Can't connect / تعذّر الاتصال" screen with a retry button.
- The status bar and the safe-area background follow the phone's light/dark setting. The site itself keeps handling Arabic RTL / English LTR, language and theme.
- The WebView user agent ends with `MorshidApp/1.0`, so the website can recognise the app if it ever needs to.

## Prerequisites

- Node.js 20+ and npm.
- **For local builds only:** JDK 17 and the Android SDK (easiest: install Android Studio; set `ANDROID_HOME`). Not needed for EAS cloud builds.

```sh
cd mobile
npm install
```

## Run on a phone or emulator (development)

```sh
npm run android     # = expo run:android — builds a debug app and installs it on a connected device/emulator
```

## Build an installable APK

### Option A — EAS cloud build (no Android SDK needed)

```sh
npm run eas:login        # = npx eas-cli login — free Expo account (note: the package is "eas-cli"; `npx eas` does not work)
npm run build:apk        # preview profile → a downloadable .apk for testing on phones
npm run build:aab        # production profile → .aab for Google Play (EAS can create and keep the signing key)
```

On the first build, EAS asks to link the project to your Expo account and adds the project id to `app.json`. Profiles are in `eas.json`.

### Option B — local Gradle build (Android Studio / SDK installed)

```sh
npm run prebuild:android                 # generates ./android from app.json (Continuous Native Generation)
cd android
./gradlew assembleRelease                # Windows: gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

You can also open `mobile/android` in Android Studio and use **Build → Generate Signed App Bundle / APK**.

The generated `release` build is signed with the **debug** key: fine for installing on test phones, **not** for Google Play. For the store, use EAS (Option A) or create an upload keystore and configure `signingConfigs.release` in `android/app/build.gradle` (keep the keystore and its passwords out of Git — `*.jks` and `*.key` are already ignored).

`android/` is generated and git-ignored: change `app.json`, then run `npm run prebuild:android` again instead of editing native files by hand.

## Checks

```sh
npm run typecheck   # TypeScript
npm run doctor      # expo-doctor: dependency and config checks
```

## Before publishing to Google Play

- Confirm the package id, app name and version (`version`, `android.versionCode` — raise `versionCode` on every upload).
- Confirm the usage rights of the Expo concept renderings shown on the website (see `docs/image-credits.md`).
- Google Play requires a privacy policy URL; the website's privacy page is still a draft.
- A pure "website in a box" app can be rejected by store review; the app's value is the full MORSHID experience in one tap, but plan native touches (e.g. notifications) if review asks for more.
