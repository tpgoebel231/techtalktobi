#!/usr/bin/env node
/**
 * Post-build prep for the gh-pages static snapshot.
 *
 * TanStack Start (spa + prerender pages) writes real HTML for each
 * canonical route and an empty SPA shell at `_shell.html`. This script
 * keeps those route bodies, injects per-route title/description/canonical/
 * hreflang/OG/JSON-LD, and copies each file to the `.html` + `/index.html`
 * pair GitHub Pages needs for HTTP 200. 404.html stays the SPA shell.
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync, accessSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { escapeHtml } from "./grok-pwa-shared.mjs";
import { publish as publishMediaKit } from "./media-kit.mjs";
import {
  GUARDED_ROUTES,
  allowPlaceholders,
  assertNoLegalPlaceholders,
  htmlHasPlaceholder,
} from "./check-legal-placeholders.mjs";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

export const SITE_ORIGIN = "https://techtalktobi.com";
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og.jpg`;

const locales = ["en", "de"];
const pages = ["", "about", "consulting", "media-kit", "media", "privacy", "research"];

/**
 * German-only pages that ship as real HTML (HTTP 200) and may be indexed,
 * but are NOT in public/sitemap.xml or the site nav yet. When Tobias says
 * to advertise Live in Bonn, add it to the sitemap and nav, and flip
 * LIVE_IN_BONN_LISTED in src/lib/clean-routes.ts. Copy from
 * src/routes/$locale/{live-in-bonn,datenschutz}.tsx.
 */
export const DE_ONLY_PAGES = {
  "live-in-bonn": {
    title: "Live in Bonn · TeslaTobi Stammtisch",
    description:
      "Der erste TeslaTobi Stammtisch zum Anfassen: Mitte Dezember 2026 in Bonn. Eckdaten, Terminvorschläge und Interessenbekundung.",
    // Own social card (Rhonda, picked by Tobias Nov 2 2026). Main og.jpg unchanged.
    image: `${SITE_ORIGIN}/live-in-bonn/og-live-in-bonn-v2.jpg`,
    imageWidth: 1200,
    imageHeight: 630,
  },
  datenschutz: {
    title: "Datenschutzerklärung · TechTalkTobi",
    description:
      "Datenschutzerklärung für die Seite Live in Bonn und die Interessenbekundung für den TeslaTobi-Stammtisch in Bonn über Google Forms.",
  },
};

/**
 * Root `/` on GitHub Pages is a tiny HTML bounce to `/en` (same pattern as
 * trailing-slash and bare-page aliases). Search Console was splitting
 * impressions across `/` and `/en` while `/` served a full English shell with
 * only a JS redirect. Vercel gets a matching permanent redirect in vercel.json.
 */

/**
 * Locale-less page URLs that still get typed or linked. GitHub Pages has no
 * server redirects, so prepare writes tiny HTML bounce pages to /en/*.
 * Keep destination labels short and mechanical (no new Tobias-voice copy).
 */
export const LEGACY_PAGE_REDIRECTS = {
  "/about": "/en/about",
  "/consulting": "/en/consulting",
  "/cv": "/en/about",
  "/en/live-in-bonn": "/de/live-in-bonn",
  "/live-in-bonn": "/de/live-in-bonn",
  "/media": "/en/media",
  "/media-kit": "/en/media-kit",
  "/muskonomy": "/en/research/muskonomy",
  "/research": "/en/research",
};

/**
 * Old file paths that still appear in Search Console or bookmarks.
 * Values are paths under the publish root (usually copied from public/).
 */
export const LEGACY_FILE_ALIASES = {
  "ai-robotics/Humanoid_Robotics_Stack_May2026.pdf":
    "research/Humanoid_Robotics_Stack_May2026.pdf",
};

/**
 * GitHub Pages has no server, so the dynamic `/__grok/manifest.webmanifest`
 * that every page links to 404s there. Ship it as a static file with the
 * site's own name.
 */
export const STATIC_WEB_MANIFEST = {
  name: "TechTalkTobi",
  short_name: "TechTalkTobi",
  id: "/",
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#000000",
  theme_color: "#000000",
  icons: [{ src: "/__grok/icon-180.png", sizes: "180x180", type: "image/png" }],
};

export function publishWebManifest(root) {
  const dir = join(root, "__grok");
  mkdirSync(dir, { recursive: true });
  const body = `${JSON.stringify(STATIC_WEB_MANIFEST, null, 2)}\n`;
  writeFileSync(join(dir, "manifest.webmanifest"), body);
  writeFileSync(join(dir, "manifest.json"), body);
  return ["/__grok/manifest.webmanifest", "/__grok/manifest.json"];
}

export function legacyRedirectHtml(toPath) {
  const dest = `${SITE_ORIGIN}${toPath}`;
  const safeDest = escapeHtml(dest);
  const safePath = escapeHtml(toPath);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Redirecting...</title>
<link rel="canonical" href="${safeDest}"/>
<meta http-equiv="refresh" content="0;url=${safeDest}"/>
<script>location.replace(${JSON.stringify(toPath)});</script>
</head>
<body>
<p><a href="${safePath}">Continue</a></p>
</body>
</html>
`;
}

export function publishLegacyAliases(root) {
  const pages = [];
  for (const [fromPath, toPath] of Object.entries(LEGACY_PAGE_REDIRECTS)) {
    const html = legacyRedirectHtml(toPath);
    const bare = fromPath.slice(1);
    const fileHtml = join(root, `${bare}.html`);
    const dirIndex = join(root, bare, "index.html");
    mkdirSync(dirname(fileHtml), { recursive: true });
    mkdirSync(dirname(dirIndex), { recursive: true });
    writeFileSync(fileHtml, html);
    writeFileSync(dirIndex, html);
    pages.push(fromPath);
  }

  const files = [];
  for (const [alias, source] of Object.entries(LEGACY_FILE_ALIASES)) {
    const src = join(root, source);
    if (!existsSync(src)) throw new Error(`legacy alias missing source ${source}`);
    const dest = join(root, alias);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(src, dest);
    files.push(`/${alias}`);
  }
  return { pages, files };
}


/** Copy from src/routes/$locale/route.tsx */
export const LOCALE_HEAD = {
  en: {
    title: "TeslaTobi (Tobias P. Goebel) | Media & Advisory",
    description:
      "Journalist and advisor on autonomous systems. TeslaTobi, TechTalkTobi, published analysis. Advisory on the technology and the rules. Online: tpgoebel.",
  },
  de: {
    title: "TeslaTobi (Tobias P. Goebel) | Medien & Beratung",
    description:
      "Journalist und Berater für autonome Systeme. TeslaTobi, TechTalkTobi, öffentliche Analysen. Beratung zu Technik und Regulierung. Online: tpgoebel.",
  },
};

/** Titles from src/routes/$locale/** (home uses locale title). */
export const PAGE_TITLES = {
  about: { en: "About · TechTalkTobi", de: "About · TechTalkTobi" },
  consulting: { en: "Advisory · TechTalkTobi", de: "Beratung · TechTalkTobi" },
  "media-kit": { en: "Media Kit · TechTalkTobi", de: "Media Kit · TechTalkTobi" },
  media: { en: "Media · TechTalkTobi", de: "Media · TechTalkTobi" },
  privacy: { en: "Privacy Policy · TechTalkTobi", de: "Privacy Policy · TechTalkTobi" },
  research: { en: "Research · TechTalkTobi", de: "Research · TechTalkTobi" },
};

/** Existing page deks from src/data/copy.ts (never invent new Tobias-voice copy). */
export const PAGE_DESCRIPTIONS = {
  about: {
    en: "Content and advisory on autonomous driving systems (robotaxis, driver assistance), AI, and robotics.",
    de: "Content und Beratung zu autonomen Fahrsystemen (Robotaxis, Fahrerassistenz), KI und Robotik.",
  },
  consulting: {
    en: "Paid, independent briefings. I drive these systems in US daily use and read the European rulebook. That gap is the work.",
    de: "Bezahlte, unabhängige Einordnung auf Deutsch: Stand der Technik, nationales Recht, EU- und UNECE-Regelwerk: was schon gilt, was noch kommt.",
  },
  "media-kit": {
    en: "Bio, channels, and contacts for producers, journalists, agencies, and partners.",
    de: "Bio, Kanäle und Kontakt für Redaktionen, Produktionen, Agenturen und Partner.",
  },
  media: {
    en: "Two commentary channels and TV-format event reports. For producers, event agencies, and press officers.",
    de: "Zwei Kommentar-Kanäle und Eventberichte im TV-Stil. Für Produktionen, Eventagenturen und Pressestellen.",
  },
  privacy: {
    en: "How Tobias Goebel uses Google and YouTube API access on TechTalkTobi to manage his own YouTube channels.",
    de: "How Tobias Goebel uses Google and YouTube API access on TechTalkTobi to manage his own YouTube channels.",
  },
  research: {
    en: "Graphics, a public FSD scorecard, and an interactive explainer.",
    de: "Grafiken, eine öffentliche FSD-Bewertungsmatrix und ein interaktiver Rechner.",
  },
};

export { escapeHtml };

export function absoluteUrl(pathOrUrl) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_ORIGIN}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

function mustReplace(html, pattern, replacement, label) {
  if (!pattern.test(html)) {
    throw new Error(`prepare-github-pages: failed to replace ${label} in shell HTML`);
  }
  return html.replace(pattern, replacement);
}

export async function loadResearchPieces() {
  const src = readFileSync(join(repoRoot, "src/data/research.ts"), "utf8");
  const { outputText } = ts.transpileModule(src, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: "research.ts",
  });
  if (/\bfrom\s+['"]/.test(outputText)) {
    throw new Error(
      "prepare-github-pages: research.ts compiled with runtime imports; cannot load via transpile-only",
    );
  }
  const mod = await import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );
  if (!Array.isArray(mod.research)) {
    throw new Error("prepare-github-pages: compiled research.ts did not export research[]");
  }
  return mod.research;
}

export function seoForRoute(route, pieces) {
  const bySlug = new Map(pieces.map((piece) => [piece.slug, piece]));

  if (route === "/") {
    const en = seoForRoute("/en", pieces);
    return { ...en, canonical: `${SITE_ORIGIN}/en`, ogUrl: `${SITE_ORIGIN}/en` };
  }

  const match = route.match(/^\/(en|de)(?:\/(.*))?$/);
  if (!match) {
    throw new Error(`prepare-github-pages: unsupported route ${route}`);
  }
  const locale = match[1];
  const rest = match[2] || "";
  const enPath = locale === "en" ? route : route.replace(/^\/de/, "/en");
  const dePath = locale === "de" ? route : route.replace(/^\/en/, "/de");
  const alternates = [
    { hreflang: "en", href: `${SITE_ORIGIN}${enPath}` },
    { hreflang: "de", href: `${SITE_ORIGIN}${dePath}` },
    { hreflang: "x-default", href: `${SITE_ORIGIN}${enPath}` },
  ];

  if (DE_ONLY_PAGES[rest]) {
    if (locale !== "de") {
      throw new Error(`prepare-github-pages: ${rest} is German-only`);
    }
    return {
      image: DEFAULT_OG_IMAGE,
      ...DE_ONLY_PAGES[rest],
      canonical: `${SITE_ORIGIN}${route}`,
      ogUrl: `${SITE_ORIGIN}${route}`,
      type: "website",
      locale: "de_DE",
      htmlLang: "de",
      alternates: [{ hreflang: "de", href: `${SITE_ORIGIN}${route}` }],
    };
  }

  const researchMatch = rest.match(/^research\/([^/]+)$/);
  if (researchMatch) {
    const piece = bySlug.get(researchMatch[1]);
    if (!piece) {
      throw new Error(`prepare-github-pages: unknown research slug ${researchMatch[1]}`);
    }
    const title = `${piece.title[locale]} · TechTalkTobi`;
    const description = piece.dek[locale];
    return {
      title,
      description,
      canonical: `${SITE_ORIGIN}${route}`,
      ogUrl: `${SITE_ORIGIN}${route}`,
      image: absoluteUrl(piece.image),
      type: "article",
      locale: locale === "de" ? "de_DE" : "en_US",
      htmlLang: locale,
      alternates,
    };
  }

  const pageTitle = rest ? PAGE_TITLES[rest]?.[locale] : LOCALE_HEAD[locale].title;
  if (!pageTitle) {
    throw new Error(`prepare-github-pages: no title for ${route}`);
  }
  const pageDescription = rest
    ? PAGE_DESCRIPTIONS[rest]?.[locale]
    : LOCALE_HEAD[locale].description;
  if (!pageDescription) {
    throw new Error(`prepare-github-pages: no description for ${route}`);
  }
  return {
    title: pageTitle,
    description: pageDescription,
    canonical: `${SITE_ORIGIN}${route}`,
    ogUrl: `${SITE_ORIGIN}${route}`,
    image: DEFAULT_OG_IMAGE,
    type: "website",
    locale: locale === "de" ? "de_DE" : "en_US",
    htmlLang: locale,
    alternates,
  };
}

const PERSON_ID = `${SITE_ORIGIN}/#person`;
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;

export function structuredData(seo) {
  const person = {
    "@type": "Person",
    "@id": PERSON_ID,
    name: "Tobias P. Goebel",
    alternateName: ["Tobias Goebel", "TeslaTobi", "Tesla Tobi", "TechTalkTobi", "tpgoebel"],
    url: `${SITE_ORIGIN}/en/about`,
    sameAs: [
      "https://www.youtube.com/@TeslaTobi",
      "https://www.youtube.com/@TechTalk-Tobi",
      "https://x.com/tpgoebel",
    ],
  };
  const website = {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: "TechTalkTobi",
    url: `${SITE_ORIGIN}/`,
    inLanguage: ["en", "de"],
    publisher: { "@id": PERSON_ID },
  };
  const page = {
    "@type": seo.type === "article" ? "Article" : "WebPage",
    "@id": `${seo.canonical}#page`,
    url: seo.canonical,
    name: seo.title,
    description: seo.description,
    inLanguage: seo.htmlLang || "en",
    isPartOf: { "@id": WEBSITE_ID },
    image: seo.image,
  };
  if (seo.type === "article") {
    page.headline = seo.title.replace(/ · TechTalkTobi$/, "");
    page.author = { "@id": PERSON_ID };
    page.publisher = { "@id": PERSON_ID };
  }
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": [website, person, page] });
  return `<script type="application/ld+json">${json.replace(/</g, "\\u003c")}</script>`;
}

export function extraHeadTags(seo) {
  return [
    `<link rel="canonical" href="${escapeHtml(seo.canonical)}"/>`,
    ...seo.alternates.map(
      (alt) =>
        `<link rel="alternate" hreflang="${escapeHtml(alt.hreflang)}" href="${escapeHtml(alt.href)}"/>`,
    ),
    `<meta property="og:title" content="${escapeHtml(seo.title)}"/>`,
    `<meta property="og:description" content="${escapeHtml(seo.description)}"/>`,
    `<meta property="og:url" content="${escapeHtml(seo.ogUrl)}"/>`,
    `<meta property="og:type" content="${escapeHtml(seo.type)}"/>`,
    `<meta property="og:locale" content="${escapeHtml(seo.locale)}"/>`,
    `<meta property="og:image" content="${escapeHtml(seo.image)}"/>`,
    // Width/height and twitter:image only where a route sets its own card,
    // so every other route's head stays byte-identical.
    ...(seo.imageWidth && seo.imageHeight
      ? [
          `<meta property="og:image:width" content="${escapeHtml(String(seo.imageWidth))}"/>`,
          `<meta property="og:image:height" content="${escapeHtml(String(seo.imageHeight))}"/>`,
        ]
      : []),
    `<meta name="twitter:card" content="summary_large_image"/>`,
    ...(seo.imageWidth ? [`<meta name="twitter:image" content="${escapeHtml(seo.image)}"/>`] : []),
    structuredData(seo),
  ].join("");
}

export function applyRouteHead(html, seo) {
  let out = mustReplace(
    html,
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(seo.title)}</title>`,
    "title",
  );
  out = mustReplace(
    out,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${escapeHtml(seo.description)}"/>`,
    "description",
  );
  if (seo.htmlLang) {
    out = mustReplace(
      out,
      /<html lang="[^"]*"/,
      `<html lang="${escapeHtml(seo.htmlLang)}"`,
      "html lang",
    );
  }
  out = mustReplace(out, /<\/head>/, `${extraHeadTags(seo)}</head>`, "</head>");
  return out;
}

function shellDest(root, route) {
  if (route === "/") return join(root, "index.html");
  return join(root, route.slice(1) + ".html");
}

/** Canonical HTML routes: `/` plus every `/en|de/...` page the snapshot ships. */
export function canonicalRoutes(pieces) {
  const routes = ["/"];
  for (const locale of locales) {
    for (const page of pages) {
      routes.push(page ? `/${locale}/${page}` : `/${locale}`);
    }
    for (const piece of pieces) {
      routes.push(`/${locale}/research/${piece.slug}`);
    }
  }
  for (const page of Object.keys(DE_ONLY_PAGES)) routes.push(`/de/${page}`);
  return routes;
}

/**
 * TanStack Start options for the GitHub Pages build: keep the SPA shell
 * (`_shell.html` / 404) and prerender every indexable locale route.
 * `/` is not prerendered; prepare writes an HTML bounce to `/en` instead.
 */
export async function githubPagesStartOptions() {
  const pieces = await loadResearchPieces();
  return {
    spa: { enabled: true },
    prerender: {
      enabled: true,
      crawlLinks: false,
      failOnError: true,
      autoStaticPathsDiscovery: false,
    },
    sitemap: { enabled: false },
    pages: canonicalRoutes(pieces)
      .filter((route) => route !== "/")
      .map((path) => ({ path })),
  };
}

function prerenderCandidates(root, route) {
  if (route === "/") {
    return [join(root, "en", "index.html"), join(root, "en.html")];
  }
  return [join(root, route.slice(1), "index.html"), join(root, route.slice(1) + ".html")];
}

export function readPrerenderedHtml(root, route) {
  for (const file of prerenderCandidates(root, route)) {
    if (existsSync(file)) return readFileSync(file, "utf8");
  }
  throw new Error(
    `prepare-github-pages: missing prerendered HTML for ${route} (expected ${prerenderCandidates(root, route)[0]})`,
  );
}

export function assertRenderableBody(html, route) {
  const start = html.search(/<body[\s>]/i);
  const end = html.search(/<\/body>/i);
  const body = start >= 0 && end > start ? html.slice(start, end) : "";
  if (!/<h1[\s>]/i.test(body) || !/<a\s/i.test(body)) {
    throw new Error(
      `prepare-github-pages: prerendered HTML for ${route} has no heading or links in <body>`,
    );
  }
}


/**
 * Google OAuth / Cloud Console needs a real policy page at /privacy (HTTP 200
 * with the policy body), not a bounce to /en/privacy. Reuse the prerendered
 * /en/privacy HTML and rewrite the head so the canonical is /privacy.
 * Trailing-slash /privacy/ bounces to /privacy like other canonical pages.
 * Do NOT list /privacy in LEGACY_PAGE_REDIRECTS.
 */
export function privacyRootSeo() {
  const title = PAGE_TITLES.privacy.en;
  const description = PAGE_DESCRIPTIONS.privacy.en;
  return {
    title,
    description,
    canonical: `${SITE_ORIGIN}/privacy`,
    ogUrl: `${SITE_ORIGIN}/privacy`,
    image: DEFAULT_OG_IMAGE,
    type: "website",
    locale: "en_US",
    htmlLang: "en",
    alternates: [
      { hreflang: "en", href: `${SITE_ORIGIN}/privacy` },
      { hreflang: "x-default", href: `${SITE_ORIGIN}/privacy` },
    ],
  };
}

export function publishRootPrivacyPage(root, prerenderedHtml) {
  if (!prerenderedHtml) {
    throw new Error("prepare-github-pages: missing prerendered HTML for /en/privacy");
  }
  assertRenderableBody(prerenderedHtml, "/privacy");
  const html = applyRouteHead(prerenderedHtml, privacyRootSeo());
  const fileHtml = join(root, "privacy.html");
  const dirIndex = join(root, "privacy", "index.html");
  mkdirSync(dirname(fileHtml), { recursive: true });
  mkdirSync(dirname(dirIndex), { recursive: true });
  writeFileSync(fileHtml, html);
  writeFileSync(dirIndex, legacyRedirectHtml("/privacy"));
  return ["/privacy"];
}

export async function prepare(root = "dist/client") {
  // Ship guard: unfilled legal placeholders block the gh-pages snapshot.
  await assertNoLegalPlaceholders();
  const shell = join(root, "_shell.html");
  accessSync(shell);
  const shellHtml = readFileSync(shell, "utf8");
  const pieces = await loadResearchPieces();
  const routes = canonicalRoutes(pieces);

  const htmlByRoute = new Map();
  for (const route of routes) {
    // `/` is an HTML bounce, not a prerendered shell.
    if (route === "/") continue;
    const html = readPrerenderedHtml(root, route);
    assertRenderableBody(html, route);
    if (GUARDED_ROUTES.includes(route) && htmlHasPlaceholder(html) && !allowPlaceholders()) {
      throw new Error(`prepare-github-pages: ${route} still shows a [placeholder]`);
    }
    htmlByRoute.set(route, html);
  }

  writeFileSync(join(root, "404.html"), shellHtml);

  for (const route of routes) {
    // Root `/` is a bounce to `/en` so GSC does not keep a soft-duplicate of the
    // English home (same HTML-refresh pattern as trailing-slash aliases).
    if (route === "/") {
      writeFileSync(join(root, "index.html"), legacyRedirectHtml("/en"));
      continue;
    }
    let html = applyRouteHead(htmlByRoute.get(route), seoForRoute(route, pieces));
    const file = shellDest(root, route);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html);
    // GitHub Pages serves both /path (path.html) and /path/ (path/index.html).
    // Keep the full page on path.html; bounce the trailing-slash URL to the
    // no-slash canonical so Search Console does not split signals (e.g. /de/).
    const dirIndex = join(root, route.slice(1), "index.html");
    mkdirSync(dirname(dirIndex), { recursive: true });
    writeFileSync(dirIndex, legacyRedirectHtml(route));
  }

  console.log(`prepare-github-pages: media kit aliases ${publishMediaKit(root).join(", ")}`);
  const legacy = publishLegacyAliases(root);
  console.log(
    `prepare-github-pages: legacy page redirects ${legacy.pages.join(", ")}; file aliases ${legacy.files.join(", ")}`,
  );

  // Must run after legacy aliases so a future /privacy bounce cannot overwrite it.
  const rootPrivacy = publishRootPrivacyPage(root, htmlByRoute.get("/en/privacy"));
  console.log(`prepare-github-pages: root privacy page ${rootPrivacy.join(", ")}`);

  console.log(`prepare-github-pages: web manifest ${publishWebManifest(root).join(", ")}`);
  writeFileSync(join(root, "CNAME"), "techtalktobi.com\n");
  writeFileSync(join(root, ".nojekyll"), "");
  writeFileSync(
    join(root, "vercel.json"),
    `${JSON.stringify(
      {
        $schema: "https://openapi.vercel.sh/vercel.json",
        git: { deploymentEnabled: false },
      },
      null,
      2,
    )}\n`,
  );

  console.log(`prepare-github-pages: wrote ${routes.length} route shells under ${root}`);
  return { routes, pieces };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await prepare(process.argv[2] || "dist/client");
}
