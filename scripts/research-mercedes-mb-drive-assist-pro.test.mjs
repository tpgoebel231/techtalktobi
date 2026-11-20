import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  LEGACY_PAGE_REDIRECTS,
  canonicalRoutes,
  loadResearchPieces,
  seoForRoute,
  SITE_ORIGIN,
} from "./prepare-github-pages.mjs";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const de = source("public/research/embed/mercedes-mb-drive-assist-pro.de.html");
const en = source("public/research/embed/mercedes-mb-drive-assist-pro.en.html");
const SLUG = "mercedes-mb-drive-assist-pro";
const DECK_SOURCES = [
  "https://media.mercedes-benz.com/article/f7a47dc7-5b48-4f87-a4e8-08b2d7a56845",
  "https://media.mercedes-benz.com/article/a05b5ec5-ce60-48cc-95ba-8fab86012b48",
];

/** Visible text and JS strings, without HTML/JS comments. */
function withoutComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\s\/\/ .*$/gm, "");
}

test("both deck files exist with the right lang, noindex and canonical", () => {
  assert.match(de, /<html lang="de">/);
  assert.match(en, /<html lang="en">/);
  for (const [html, locale] of [
    [de, "de"],
    [en, "en"],
  ]) {
    assert.match(html, /<meta name="robots" content="noindex, follow">/);
    assert.ok(html.includes(`<link rel="canonical" href="${SITE_ORIGIN}/${locale}/research/${SLUG}">`));
    for (const url of DECK_SOURCES) assert.ok(html.includes(url), url);
  }
});

test("German file keeps the original deck text", () => {
  for (const phrase of [
    "MB.DRIVE ASSIST PRO – Mercedes-Benz Pressemitteilung 16.11.2026",
    "Die acht Kernpunkte der Mercedes-Benz Pressemitteilung vom 16. November 2026 zu MB.DRIVE ASSIST PRO.",
    "Freihand-Assistent",
    "Dashboard im Vollbild öffnen is not in the deck",
  ].filter((p) => !p.includes("is not in the deck"))) {
    assert.ok(de.includes(phrase), phrase);
  }
  assert.ok(de.includes("Quelle: Mercedes-Benz Pressemitteilung, 16.11.2026"));
  assert.ok(de.includes("Was ist <em>neu</em> / anders?"));
});

test("English file is translated: no leftover German UI, US dates, no em dash", () => {
  const visible = withoutComments(en);
  assert.doesNotMatch(
    visible,
    /\b(Pressemitteilung|Kernpunkte|Freihand|Spurwechsel|Aufnahmemodus|Vollbild|gestrichen|Gestrichen|Autobahn|Abschnitt|Verbrenner|Nachrüstbar|Zeitplan|Fahrzeugpalette|Regulatorik|Probemonat|Schlagzeile|Kriterium|München|landesweit)\b/,
  );
  assert.doesNotMatch(visible, /Quelle:|Quellen:/);
  assert.doesNotMatch(visible, /\b\d{2}\.\d{2}\.\d{4}\b/);
  assert.doesNotMatch(en, /\u2014/);
  assert.ok(en.includes("MB.DRIVE ASSIST PRO: Mercedes-Benz Press Release, November 16, 2026"));
  assert.ok(en.includes("Hands-free</em> assist"));
  assert.ok(en.includes("What is <em>new</em> / different?"));
  assert.ok(en.includes("Source: Mercedes-Benz press release, Nov. 16, 2026"));
  assert.ok(en.includes("Dropped entirely"));
  assert.match(en, /\/\^dropped\( entirely\)\?\\b\/i/);
});

test("research piece, SEO, sitemap and the /research/mercedes-mb-drive-assist-pro bounce", async () => {
  const pieces = await loadResearchPieces();
  const piece = pieces.find((p) => p.slug === SLUG);
  assert.ok(piece);
  assert.equal(piece.kind, "tool");
  assert.equal(piece.title.en, "Mercedes MB.DRIVE ASSIST PRO: What's New in November?");
  assert.equal(piece.title.de, "Mercedes MB.DRIVE ASSIST PRO: Was ist neu im November?");
  assert.equal(piece.cardTitle.en, "Mercedes MB.DRIVE ASSIST PRO");
  assert.equal(piece.cardTitle.de, "Mercedes MB.DRIVE ASSIST PRO");
  assert.equal(piece.cardDek.en, "An ongoing analysis of Mercedes's announced L2++ system");
  assert.equal(piece.cardDek.de, "Eine fortlaufende Analyse des angekündigten L2++-Systems von Mercedes");
  assert.ok(canonicalRoutes(pieces).includes(`/de/research/${SLUG}`));
  assert.ok(canonicalRoutes(pieces).includes(`/en/research/${SLUG}`));
  const seoDe = seoForRoute(`/de/research/${SLUG}`, pieces);
  assert.equal(seoDe.title, `${piece.title.de} · TechTalkTobi`);
  assert.equal(seoDe.canonical, `${SITE_ORIGIN}/de/research/${SLUG}`);
  assert.equal(seoDe.image, `${SITE_ORIGIN}/images/research-mercedes-mb-drive-assist-pro.jpg`);
  assert.deepEqual(
    seoDe.alternates.map((alt) => [alt.hreflang, alt.href]),
    [
      ["en", `${SITE_ORIGIN}/en/research/${SLUG}`],
      ["de", `${SITE_ORIGIN}/de/research/${SLUG}`],
      ["x-default", `${SITE_ORIGIN}/en/research/${SLUG}`],
    ],
  );
  const seoEn = seoForRoute(`/en/research/${SLUG}`, pieces);
  assert.equal(seoEn.title, `${piece.title.en} · TechTalkTobi`);
  assert.equal(seoDe.description, piece.dek.de);
  assert.equal(seoEn.description, piece.dek.en);
  assert.notEqual(seoDe.title, `${piece.cardTitle.de} · TechTalkTobi`);
  assert.notEqual(seoDe.description, piece.cardDek.de);
  readFileSync(new URL("../public/images/research-mercedes-mb-drive-assist-pro.jpg", import.meta.url));

  const sitemap = source("public/sitemap.xml");
  for (const locale of ["en", "de"]) {
    assert.ok(
      sitemap.includes(`<loc>${SITE_ORIGIN}/${locale}/research/${SLUG}</loc>\n    <lastmod>2026-11-17</lastmod>`),
      `sitemap ${locale}`,
    );
  }

  assert.equal(LEGACY_PAGE_REDIRECTS[`/research/${SLUG}`], `/de/research/${SLUG}`);
  const vercel = JSON.parse(source("vercel.json"));
  assert.ok(
    vercel.redirects.some(
      (r) => r.source === `/research/${SLUG}` && r.destination === `/de/research/${SLUG}` && r.permanent,
    ),
  );
});

test("detail page frames the per-locale deck file", () => {
  const detail = source("src/pages/research-detail.tsx");
  assert.match(detail, /case "mercedes-mb-drive-assist-pro":\s*return <MbDriveAssistProDashboard \/>/);
  const component = source("src/components/mb-drive-assist-pro-dashboard.tsx");
  assert.ok(component.includes('"/research/embed/mercedes-mb-drive-assist-pro.de.html"'));
  assert.ok(component.includes('"/research/embed/mercedes-mb-drive-assist-pro.en.html"'));
  // Full-screen labels moved to the shared deck-open component.
  assert.ok(component.includes("<DeckOpenLink href={src} />"));
  const deckOpen = source("src/components/deck-open.tsx");
  assert.ok(deckOpen.includes("Dashboard im Vollbild öffnen"));
  assert.ok(deckOpen.includes("Open the dashboard full screen"));
  const card = source("src/components/research-card.tsx");
  assert.ok(card.includes("piece.cardTitle?.[locale] ?? piece.title[locale]"));
  assert.ok(card.includes("piece.cardDek?.[locale] ?? piece.dek[locale]"));
  assert.ok(detail.includes("piece.title[locale]"));
  assert.ok(detail.includes("piece.dek[locale]"));
  assert.ok(!detail.includes("cardTitle"));
});

test("German UI uses Recherche, not Forschung, for site section labels", () => {
  const copy = source("src/data/copy.ts");
  assert.match(copy, /research: "Recherche"/);
  assert.match(copy, /ctaResearch: "Recherche"/);
  assert.match(copy, /featured: "Recherche"/);
  assert.match(copy, /eyebrow: "Recherche"/);
  assert.match(copy, /title: "Recherche"/);
  assert.doesNotMatch(copy, /"(Forschung)"/);
  const titles = source("scripts/prepare-github-pages.mjs");
  assert.match(titles, /research: \{ en: "Research · TechTalkTobi", de: "Recherche · TechTalkTobi" \}/);
  const index = source("src/routes/$locale/research/index.tsx");
  assert.match(index, /de: "Recherche · TechTalkTobi"/);
  const kit = source("src/pages/media-kit.tsx");
  assert.ok(kit.includes("öffentliche Rechercheseite"));
  assert.doesNotMatch(kit, /Forschungsseite/);
  // Career R&D and Boston Dynamics status stay Forschung.
  assert.ok(kit.includes("Enterprise-Software (Forschung, Produkt"));
  const research = source("src/data/research.ts");
  assert.ok(research.includes("Forschung und industrieller Übergang"));
});
