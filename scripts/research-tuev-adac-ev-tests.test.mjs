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
const de = source("public/research/embed/tuev-adac-ev-tests.de.html");
const en = source("public/research/embed/tuev-adac-ev-tests.en.html");
const SLUG = "tuev-adac-ev-tests";
const DECK_SOURCES = [
  "https://www.tuev-verband.de/pressemitteilungen/tuev-report-2027",
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
    "Warum Tesla beim TÜV hinten liegt",
    "WAS IST DER",
    "TÜV-REPORT",
    "ADAC Pannenstatistik",
    "Quellen: TÜV-Report 2027",
  ]) {
    assert.ok(de.includes(phrase), phrase);
  }
  assert.ok(de.includes("&larr; Zurück") || de.includes("Zurück"));
  assert.ok(de.includes("Weiter"));
  assert.ok(de.includes("Aufnahmemodus"));
});

test("English file is translated: no leftover German UI, TÜV explainer, no em dash", () => {
  const visible = withoutComments(en);
  assert.doesNotMatch(visible, /\b(Zurück|Weiter|Aufnahmemodus|Leertaste|Quellen:|Pannenstatistik|Pressemitteilung|Mängelkatalog)\b/);
  // Keep technical German terms that EN deliberately retains (TÜV, HU, StVZO) out of this ban.
  assert.doesNotMatch(en, /\u2014/);
  assert.ok(en.includes("Why Tesla Ranks Low in TÜV Tests"));
  assert.ok(en.includes("TÜV is Germany's mandatory periodic vehicle safety inspection"));
  assert.ok(en.includes("Hauptuntersuchung")); // deliberate DE technical term, glossed as HU
  assert.ok(en.includes("Sources: TÜV-Report 2027"));
  assert.ok(en.includes("&larr; Back") || en.includes("Back"));
  assert.ok(en.includes("Next"));
  assert.ok(en.includes("Recording mode") || en.includes("recording-mode"));
});

test("research piece, SEO, sitemap and the /research/tuev-adac-ev-tests bounce", async () => {
  const pieces = await loadResearchPieces();
  const piece = pieces.find((p) => p.slug === SLUG);
  assert.ok(piece);
  assert.equal(piece.kind, "tool");
  assert.equal(piece.title.en, "Why Tesla Ranks Low in TÜV Tests");
  assert.equal(piece.title.de, "Warum Tesla beim TÜV hinten liegt");
  assert.equal(piece.cardTitle.en, "TÜV & ADAC EV Tests");
  assert.equal(piece.cardTitle.de, "TÜV & ADAC E-Auto-Tests");
  assert.equal(
    piece.cardDek.en,
    "An analysis of Germany's major inspection and breakdown stats, with a focus on Tesla",
  );
  assert.equal(
    piece.cardDek.de,
    "Eine Analyse der großen deutschen Prüf- und Pannenstatistiken mit Fokus auf Tesla",
  );
  assert.equal(piece.dek.en, piece.cardDek.en);
  assert.equal(piece.dek.de, piece.cardDek.de);
  assert.ok(canonicalRoutes(pieces).includes(`/de/research/${SLUG}`));
  assert.ok(canonicalRoutes(pieces).includes(`/en/research/${SLUG}`));
  const seoDe = seoForRoute(`/de/research/${SLUG}`, pieces);
  assert.equal(seoDe.title, `${piece.title.de} · TechTalkTobi`);
  assert.equal(seoDe.canonical, `${SITE_ORIGIN}/de/research/${SLUG}`);
  assert.equal(seoDe.image, `${SITE_ORIGIN}/images/research-tuev-adac-ev-tests.jpg`);
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
  readFileSync(new URL("../public/images/research-tuev-adac-ev-tests.jpg", import.meta.url));

  const sitemap = source("public/sitemap.xml");
  for (const locale of ["en", "de"]) {
    assert.ok(
      sitemap.includes(`<loc>${SITE_ORIGIN}/${locale}/research/${SLUG}</loc>\n    <lastmod>2026-11-19</lastmod>`),
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
  assert.match(detail, /case "tuev-adac-ev-tests":\s*return <TuevAdacEvTestsDashboard \/>/);
  const component = source("src/components/tuev-adac-ev-tests-dashboard.tsx");
  assert.ok(component.includes('"/research/embed/tuev-adac-ev-tests.de.html"'));
  assert.ok(component.includes('"/research/embed/tuev-adac-ev-tests.en.html"'));
  assert.ok(component.includes("Dashboard im Vollbild öffnen"));
  assert.ok(component.includes("Open the dashboard full screen"));
  const card = source("src/components/research-card.tsx");
  assert.ok(card.includes("piece.cardTitle?.[locale] ?? piece.title[locale]"));
  assert.ok(card.includes("piece.cardDek?.[locale] ?? piece.dek[locale]"));
  assert.ok(detail.includes("piece.title[locale]"));
  assert.ok(detail.includes("piece.dek[locale]"));
  assert.ok(!detail.includes("cardTitle"));
});
