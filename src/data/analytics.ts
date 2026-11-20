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

/** localStorage key holding the visitor's analytics choice: "granted" | "denied". */
export const CONSENT_STORAGE_KEY = "ttt-analytics-consent";

const safeId = GA_MEASUREMENT_ID.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

/**
 * Inline bootstrap (Google Consent Mode v2). Every storage type defaults to
 * denied and gtag.js is NOT requested at all until the visitor has accepted:
 * either a stored "granted" choice, or a click on Accept (the banner calls
 * window.__tttLoadGa). No Google request happens before consent.
 */
export const gaConsentBootstrap = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} window.gtag = gtag;
gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', functionality_storage: 'denied', personalization_storage: 'denied', security_storage: 'denied' });
window.__tttLoadGa = function () { if (window.__tttGaLoaded) return; window.__tttGaLoaded = true; gtag('consent', 'update', { analytics_storage: 'granted' }); var s = document.createElement('script'); s.async = true; s.src = '${gaLoaderSrc}'; document.head.appendChild(s); gtag('js', new Date()); gtag('config', '${safeId}'); };
try { if (localStorage.getItem('${CONSENT_STORAGE_KEY}') === 'granted') window.__tttLoadGa(); } catch (e) {}`;
