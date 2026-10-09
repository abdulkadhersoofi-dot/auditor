# Daftar — Android build guide

Daftar for Android is the same React UI, bundled **inside** the APK with
Capacitor. No server, no URL, no Vercel. All data lives on the phone.

```
android-web/        Android-only entry (index.html, main.tsx, android.css)
vite.config.android.ts   -> npm run build:android -> dist-android/
capacitor.config.ts      -> npx cap sync android -> android/ (Gradle project)
.github/workflows/android-apk.yml   builds the APK in the cloud
```

The normal web app (`npm run dev`, `npm run build`) is untouched.

## 1. Get the debug APK (no Android Studio needed)

1. Push to GitHub (branches `android-apk`, `main`, or run it by hand).
2. GitHub repo → **Actions** → **Build Android APK** → open the latest run.
3. Scroll to **Artifacts** → download **daftar-debug-apk** (a .zip).
4. Unzip it → `app-debug.apk`.

To run it manually: Actions → Build Android APK → **Run workflow**.

## 2. Install on a phone (sideload)

1. Copy `app-debug.apk` to the phone (USB, Drive, WhatsApp-to-self, etc.).
2. Open it from the Files app. When asked, allow **Install unknown apps** for
   that app (Settings → Apps → Special access → Install unknown apps).
3. Tap **Install**. Debug builds are signed with a throw-away debug key, so
   Play Protect may warn — choose "Install anyway".

Updating: install a newer debug APK over the old one. Data is kept as long as
both APKs are signed with the same key. A debug APK built on a different
machine/runner may use a different debug key, in which case Android refuses
the update and you must uninstall first — **which erases the data**. Export a
backup first (see section 5), or use the release-signed build below, which is
always signed with your own key.

## 3. Build tooling versions (why Java 21)

Capacitor 8 generates an Android project with Gradle 8.14 / AGP 8.13 and Java 21
sources, so the workflow uses **Temurin JDK 21**, Node 22.

Local build (only if you have the Android SDK + JDK 21):

```
npm ci
npm run build:android
npx cap sync android
cd android && ./gradlew assembleDebug
```

## 4. Signed release build (Play Store / permanent installs)

Never commit a keystore or passwords.

### 4a. Create the keystore (once, on your PC)

Needs a JDK (`keytool`). In cmd.exe:

```
keytool -genkeypair -v -keystore daftar-release.jks -alias daftar -keyalg RSA -keysize 2048 -validity 10000
```

Keep `daftar-release.jks` and the passwords somewhere safe and backed up
(password manager + a second copy). **If you lose it you can never update the
published app.** The `.gitignore` already excludes `*.jks` and `*.keystore`.

### 4b. Store it as GitHub secrets

Convert the keystore to base64 (cmd.exe):

```
certutil -encode daftar-release.jks keystore.b64
```

Open `keystore.b64`, copy everything **between** the BEGIN/END lines (or the
whole file — the workflow strips them). Then repo → Settings → Secrets and
variables → Actions → **New repository secret**:

| Secret name | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | contents of keystore.b64 |
| `ANDROID_KEYSTORE_PASSWORD` | keystore password |
| `ANDROID_KEY_ALIAS` | `daftar` |
| `ANDROID_KEY_PASSWORD` | key password |

Delete `keystore.b64` afterwards.

### 4c. Add a release job

Add this job to `.github/workflows/android-apk.yml` (next to `debug-apk`).
It builds the unsigned release APK and signs it with `apksigner`, so no change
to the Gradle files is needed:

```yaml
  release-apk:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    if: github.event_name == 'workflow_dispatch'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build:android
      - run: npx cap sync android
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21
          cache: gradle
      - name: Build unsigned release APK
        working-directory: android
        run: |
          chmod +x gradlew
          ./gradlew assembleRelease --no-daemon
      - name: Sign and align
        env:
          KS_B64: ${{ secrets.ANDROID_KEYSTORE_BASE64 }}
          KS_PASS: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          KEY_PASS: ${{ secrets.ANDROID_KEY_PASSWORD }}
        run: |
          echo "$KS_B64" | grep -v -- '-----' | base64 -d > "$RUNNER_TEMP/release.jks"
          BT=$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)
          IN=android/app/build/outputs/apk/release/app-release-unsigned.apk
          "$BT/zipalign" -f -p 4 "$IN" "$RUNNER_TEMP/aligned.apk"
          "$BT/apksigner" sign --ks "$RUNNER_TEMP/release.jks" \
            --ks-pass env:KS_PASS --ks-key-alias "$KEY_ALIAS" --key-pass env:KEY_PASS \
            --out daftar-release.apk "$RUNNER_TEMP/aligned.apk"
          "$BT/apksigner" verify daftar-release.apk
          rm -f "$RUNNER_TEMP/release.jks"
      - uses: actions/upload-artifact@v4
        with:
          name: daftar-release-apk
          path: daftar-release.apk
          if-no-files-found: error
```

For a Play Store **AAB** instead: run `./gradlew bundleRelease` and sign
`android/app/build/outputs/bundle/release/app-release.aab` with `jarsigner`
using the same secrets.

Before publishing, bump `versionCode` / `versionName` in
`android/app/build.gradle` for every release. The app id
(`in.co.asanmaideen.daftar`) cannot change after publishing.

## 5. Your data lives only on the phone

Daftar stores everything in the app's WebView localStorage (key `daftar-v1`).
**Uninstalling the app or clearing its storage permanently erases all data.**
There is no cloud copy. A backup/export feature is not included yet.
