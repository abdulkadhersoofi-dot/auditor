import type { CapacitorConfig } from "@capacitor/cli";

// Fully offline app: the bundled build in dist-android is shipped inside the APK.
// Do NOT add server.url / server.cleartext here.
const config: CapacitorConfig = {
  appId: "in.co.asanmaideen.daftar",
  appName: "Daftar",
  webDir: "dist-android",
  android: {
    allowMixedContent: false,
    backgroundColor: "#f6f3ec",
  },
  plugins: {
    // App background is light, so keep dark status/nav bar icons even in system dark mode.
    SystemBars: {
      style: "LIGHT",
      insetsHandling: "native",
      initialViewportFitValueHint: "cover",
    },
  },
};

export default config;
