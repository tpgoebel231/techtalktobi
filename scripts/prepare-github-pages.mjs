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
import { existsSync, mkdirSync, writeFileSync, accessSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { escapeHtml } from "./grok-pwa-shared.mjs";
import { publish as publishMediaKit } from "./media-kit.mjs";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

export const SITE_ORIGIN = "https://techtalktobi.com";
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og.jpg`;

const locales = ["en", "de"];
const pages = ["", "about", "consulting", "media-kit", "media", "research"];

/**
 * Instant client redirect so `/` never hydrates the `/en` payload against
 * the `/` route (which still redirects on Vercel). Crawlers that skip JS
 * still see the English home body in index.html.
 */
export const ROOT_CLIENT_REDIRECT =
  '<script>if(location.pathname==="/")location.replace("/en");</script>';

/** Copy from src/routes/$locale/route.tsx */
export const LOCALE_HEAD = {
  en: {
    title: "Tobias P. Goebel | Media & Advisory",
    description:
      "Journalist and advisor on autonomous systems. TeslaTobi, TechTalkTobi, published analysis. Advisory on the technology and the rules. Online: tpgoebel.",
  },
  de: {
    title: "Tobias P. Goebel | Medien & Beratung",
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
  research: { en: "Research · TechTalkTobi", de: "Research · TechTalkTobi" },
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
  return {
    title: pageTitle,
    description: LOCALE_HEAD[locale].description,
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
    alternateName: ["Tobias Goebel", "TeslaTobi", "TechTalkTobi", "tpgoebel"],
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
    `<meta name="twitter:card" content="summary_large_image"/>`,
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
  return routes;
}

/**
 * TanStack Start options for the GitHub Pages build: keep the SPA shell
 * (`_shell.html` / 404) and prerender every indexable locale route.
 * `/` stays the SPA mask so Vercel's redirect-at-`/` is unchanged.
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

export function applyRootClientRedirect(html) {
  if (html.includes(ROOT_CLIENT_REDIRECT)) return html;
  return mustReplace(html, /<head>/, `<head>${ROOT_CLIENT_REDIRECT}`, "<head>");
}

export async function prepare(root = "dist/client") {
  const shell = join(root, "_shell.html");
  accessSync(shell);
  const shellHtml = readFileSync(shell, "utf8");
  const pieces = await loadResearchPieces();
  const routes = canonicalRoutes(pieces);

  const htmlByRoute = new Map();
  for (const route of routes) {
    const html = readPrerenderedHtml(root, route);
    assertRenderableBody(html, route);
    htmlByRoute.set(route, html);
  }

  writeFileSync(join(root, "404.html"), shellHtml);

  for (const route of routes) {
    let html = applyRouteHead(htmlByRoute.get(route), seoForRoute(route, pieces));
    if (route === "/") html = applyRootClientRedirect(html);
    const file = shellDest(root, route);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html);
    if (route === "/") continue;
    const dirIndex = join(root, route.slice(1), "index.html");
    mkdirSync(dirname(dirIndex), { recursive: true });
    writeFileSync(dirIndex, html);
  }

  console.log(`prepare-github-pages: media kit aliases ${publishMediaKit(root).join(", ")}`);

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
