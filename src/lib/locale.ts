export const LOCALES = ["en", "de"] as const;
export type Locale = (typeof LOCALES)[number];

export function isLocale(value: string | undefined): value is Locale {
  return value === "en" || value === "de";
}

export function switchLocalePath(pathname: string, next: Locale): string {
  const replaced = pathname.replace(/^\/(en|de)(?=\/|$)/, `/${next}`);
  if (replaced.startsWith(`/${next}`)) return replaced;
  return `/${next}`;
}
