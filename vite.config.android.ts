import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Standalone static build for the Capacitor Android app.
// Deliberately excludes TanStack Start, Nitro, auth, db and PWA plugins.
export default defineConfig({
  root: "android-web",
  publicDir: "../public-android",
  base: "./",
  resolve: { tsconfigPaths: true },
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "../dist-android",
    emptyOutDir: true,
  },
});
