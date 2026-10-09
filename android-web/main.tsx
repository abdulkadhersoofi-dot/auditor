import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Bundled fonts so the app works fully offline (web build keeps using Google Fonts).
import "@fontsource/source-sans-3/400.css";
import "@fontsource/source-sans-3/500.css";
import "@fontsource/source-sans-3/600.css";
import "@fontsource-variable/fraunces/opsz.css";
import "./android.css";
import { DaftarApp } from "@/components/daftar/app";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DaftarApp />
  </StrictMode>,
);
