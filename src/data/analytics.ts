/**
 * Google Analytics 4 measurement ID (gtag.js).
 * Override at build time with `VITE_GA_MEASUREMENT_ID`; otherwise the
 * TechTalkTobi property ID is used.
 */
const DEFAULT_GA_MEASUREMENT_ID = "G-NY700GH235";

const fromEnv = import.meta.env.VITE_GA_MEASUREMENT_ID;

export const GA_MEASUREMENT_ID =
  typeof fromEnv === "string" && fromEnv.trim() !== ""
    ? fromEnv.trim()
    : DEFAULT_GA_MEASUREMENT_ID;

/** Async loader: https://www.googletagmanager.com/gtag/js?id=… */
export const gaLoaderSrc = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;

/** Inline gtag bootstrap. The measurement ID is the only interpolated value. */
export const gaConfigSnippet = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${GA_MEASUREMENT_ID.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}');`;
