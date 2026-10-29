import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Locally bundled, OFL-licensed fonts (no external font service at runtime).
import "@fontsource/ibm-plex-sans-arabic/arabic-600.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-700.css";
import "@fontsource/ibm-plex-sans-arabic/latin-400.css";
import "@fontsource/ibm-plex-sans-arabic/latin-500.css";
import "@fontsource/ibm-plex-sans-arabic/latin-600.css";
import "@fontsource/ibm-plex-sans-arabic/latin-700.css";
import "@fontsource/noto-sans-arabic/arabic-400.css";
import "@fontsource/noto-sans-arabic/arabic-500.css";

import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/slides.css";
import "./styles/chrome.css";

import App from "./App";
import { coverageReport } from "./content/deck";

const cov = coverageReport();
if (cov.missing.length) console.error("[coverage] statute blocks missing from slides:", cov.missing);
(window as unknown as { __DECK_COVERAGE__: unknown }).__DECK_COVERAGE__ = cov;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
