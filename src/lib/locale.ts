export const LOCALES = ["en", "de"] as const;
export type Locale = (typeof LOCALES)[number];

export function isLocale(value: string | undefined): value is Locale {
  return value === "en" || value === "de";
}

/** Swap the locale prefix of a path (and optional search/hash). */
export function switchLocalePath(path: string, next: Locale): string {
  const replaced = path.replace(/^\/(en|de)(?=\/|\?|#|$)/, `/${next}`);
  if (replaced.startsWith(`/${next}`)) return replaced;
  return `/${next}`;
}
