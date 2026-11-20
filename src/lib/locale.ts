export const LOCALES = ["en", "de"] as const;
export type Locale = (typeof LOCALES)[number];

export function isLocale(value: string | undefined): value is Locale {
  return value === "en" || value === "de";
}

/** Canonical English privacy URL; /en/privacy is a same-text alias. */
export function privacyPath(locale: Locale): string {
  return locale === "de" ? "/de/privacy" : "/privacy";
}

/**
 * Paths whose EN/DE pair is not a simple prefix swap
 * (/privacy is the English canonical).
 */
const LOCALE_PATH_ALIASES: Record<string, Record<Locale, string>> = {
  "/privacy": { en: "/privacy", de: "/de/privacy" },
  "/en/privacy": { en: "/privacy", de: "/de/privacy" },
  "/de/privacy": { en: "/privacy", de: "/de/privacy" },
};

/** Swap the locale prefix of a path (and optional search/hash). */
export function switchLocalePath(path: string, next: Locale): string {
  const q = path.search(/[?#]/);
  const pathname = (q === -1 ? path : path.slice(0, q)).replace(/\/+$/, "") || "/";
  const suffix = q === -1 ? "" : path.slice(q);
  const alias = LOCALE_PATH_ALIASES[pathname];
  if (alias) return alias[next] + suffix;
  if (/^\/(en|de)(?=\/|$)/.test(pathname)) {
    return pathname.replace(/^\/(en|de)/, `/${next}`) + suffix;
  }
  return `/${next}` + suffix;
}
