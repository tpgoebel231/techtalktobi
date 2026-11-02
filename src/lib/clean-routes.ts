/**
 * "Clean" routes: pages that must load nothing from Google before a
 * visitor clicks (no GA4, no Google Fonts). The root head and the locale
 * layout read this list. Removing GA4 or Google Fonts site-wide is a
 * separate decision for Tobias; this only scopes the routes below.
 */
export const CLEAN_ROUTE_PATHS = [
  "/de/live-in-bonn",
  "/de/impressum",
  "/de/datenschutz",
] as const;

/**
 * LAUNCH FLAG: the Live in Bonn page is reachable and indexable, but it is
 * not linked from the site nav, the footer, or public/sitemap.xml yet.
 * When Tobias says to advertise it, flip this to true, add the nav/footer
 * link where it is read, and add the URL to public/sitemap.xml.
 */
export const LIVE_IN_BONN_LISTED = false;

export function isCleanPath(pathname: string | undefined): boolean {
  if (!pathname) return false;
  const path = pathname.replace(/\/+$/, "").replace(/\.html$/, "") || "/";
  return (CLEAN_ROUTE_PATHS as readonly string[]).includes(path);
}
