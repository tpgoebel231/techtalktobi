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
const SLUG = "tesla-sicherheit-model-3-y";
const de = source(`public/research/embed/${SLUG}.de.html`);
const en = source(`public/research/embed/${SLUG}.en.html`);
const VIDEO = "https://youtu.be/1gjQ84Uj8N4";
const DECK_SOURCES = [
  "https://www.tuev-verband.de/pressemitteilungen/tuev-report-2027",
  "https://www.euroncap.com/assessments/tesla/model+y/1181/",
  "https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/tesla/tesla-model-y-test/",
];

/** Visible text and JS strings, without HTML/JS comments. */
function withoutComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\s\/\/ .*$/gm, "");
}

test("both deck files exist with the right lang, noindex, canonical and fonts", () => {
  assert.match(de, /<html lang="de">/);
  assert.match(en, /<html lang="en">/);
  for (const [html, locale] of [
    [de, "de"],
    [en, "en"],
  ]) {
    assert.match(html, /<meta name="robots" content="noindex, follow">/);
    assert.ok(html.includes(`<link rel="canonical" href="${SITE_ORIGIN}/${locale}/research/${SLUG}">`));
    assert.ok(!html.includes("fonts.googleapis.com"));
    assert.ok(html.includes("/research/embed/fonts/inter-latin-wght-normal.woff2"));
    for (const url of DECK_SOURCES) assert.ok(html.includes(url), url);
    assert.ok(html.includes("© @tpgoebel"));
    assert.doesNotMatch(html, /\u2014|\u2013|&mdash;|&ndash;|&#8212;|&#8211;/);
    // Tobias's TÜV video stays linked in both languages.
    assert.ok(html.includes(`href:'${VIDEO}'`), "video link");
    assert.ok(html.includes(`'${VIDEO}'`));
    // Deck standard: no STATUS legend row; recording mode hides the title lines but keeps the tabs.
    assert.doesNotMatch(html, /class="legend"/);
    assert.match(html, /body\.rec \.topbar>div:first-child\{display:none\}/);
    assert.match(html, /body\.rec \.navrow\{display:flex !important\}/);
    assert.doesNotMatch(html, /Live in Bonn/i);
  }
});

test("German file keeps the deck text", () => {
  for (const phrase of [
    "Wie sicher ist <em>Tesla?</em>",
    "Weltspitze bei <em>Euro NCAP</em>",
    "Wächter-Modus",
    "Aufnahmemodus",
    "TÜV-Report 2027",
    "Quellen: ",
    "Mein Video zum TÜV-Report",
    "Tesla Safety Report",
  ]) {
    assert.ok(de.includes(phrase), phrase);
  }
});

test("English file is translated: no leftover German UI, English number and date formats", () => {
  const visible = withoutComments(en);
  assert.doesNotMatch(
    visible,
    /\b(Quellen|Quelle|Aufnahmemodus|Wächter|Wächter-Modus|Getestet|Auswertung|Behörde|Bericht|Tipp|PUNKT|Zeile|Fahrplan|Datenblatt|Ausstattung|Kritikpunkte|Sicherheit|Mängelquote|Ergebnisse|Kinderschutz|Abschnitte|Vollbild|zurück|weiter)\b/,
  );
  assert.ok(en.includes("How Safe Are the Tesla Model 3 and Model Y?"));
  assert.ok(en.includes("toLocaleString('en-US'"));
  assert.ok(!en.includes("de-DE"));
  assert.ok(en.includes("Sentry Mode"));
  assert.ok(en.includes("Sources: "));
  assert.ok(en.includes("Recording mode"));
  assert.ok(en.includes("Click / → next"));
  assert.ok(en.includes("t:'13.4'"));
  assert.ok(en.includes("t:'1,137 m'"));
  assert.ok(en.includes("t:'660,164'"));
  assert.ok(en.includes("t:'18.5%'"));
  assert.ok(en.includes("November 25, 2026"));
  assert.ok(en.includes("January 1, 2027"));
  // Brand terms stay as they are.
  for (const term of ["Euro NCAP", "TÜV", "Tesla Safety Report"]) assert.ok(en.includes(term), term);
});

test("research piece, SEO, sitemap and the /research/tesla-sicherheit-model-3-y bounce", async () => {
  const pieces = await loadResearchPieces();
  const piece = pieces.find((p) => p.slug === SLUG);
  assert.ok(piece);
  assert.equal(piece.kind, "tool");
  assert.equal(piece.category, "muskonomy");
  assert.deepEqual(piece.locales ?? ["en", "de"], ["en", "de"]);
  assert.equal(piece.title.de, "Wie sicher sind Tesla Model 3 und Model Y?");
  assert.equal(piece.title.en, "How Safe Are the Tesla Model 3 and Model Y?");
  assert.equal(piece.cardTitle.en, "How Safe Is Tesla?");
  assert.equal(piece.cardTitle.de, "Wie sicher ist Tesla?");
  assert.equal(piece.published, "2026-11-26");
  const routes = canonicalRoutes(pieces);
  assert.ok(routes.includes(`/de/research/${SLUG}`));
  assert.ok(routes.includes(`/en/research/${SLUG}`));

  const seoDe = seoForRoute(`/de/research/${SLUG}`, pieces);
  const seoEn = seoForRoute(`/en/research/${SLUG}`, pieces);
  assert.equal(seoDe.title, `${piece.title.de} · TechTalkTobi`);
  assert.equal(seoEn.title, `${piece.title.en} · TechTalkTobi`);
  assert.equal(seoDe.canonical, `${SITE_ORIGIN}/de/research/${SLUG}`);
  assert.equal(seoEn.canonical, `${SITE_ORIGIN}/en/research/${SLUG}`);
  assert.equal(seoDe.description, piece.dek.de);
  assert.equal(seoEn.description, piece.dek.en);
  assert.equal(seoDe.image, `${SITE_ORIGIN}/images/research-${SLUG}.jpg`);
  const alts = [
    ["en", `${SITE_ORIGIN}/en/research/${SLUG}`],
    ["de", `${SITE_ORIGIN}/de/research/${SLUG}`],
    ["x-default", `${SITE_ORIGIN}/en/research/${SLUG}`],
  ];
  assert.deepEqual(seoDe.alternates.map((alt) => [alt.hreflang, alt.href]), alts);
  assert.deepEqual(seoEn.alternates.map((alt) => [alt.hreflang, alt.href]), alts);
  for (const file of ["", "-480", "-800", "-1200"]) {
    readFileSync(new URL(`../public/images/research-${SLUG}${file}.${file ? "webp" : "jpg"}`, import.meta.url));
  }

  const sitemap = source("public/sitemap.xml");
  for (const locale of ["en", "de"]) {
    assert.ok(
      sitemap.includes(`<loc>${SITE_ORIGIN}/${locale}/research/${SLUG}</loc>\n    <lastmod>2026-11-26</lastmod>`),
      `${locale} sitemap entry`,
    );
  }
  assert.ok(!sitemap.includes(`/research/embed/${SLUG}`));
  assert.ok(!sitemap.includes(`${SITE_ORIGIN}/research/${SLUG}<`));

  assert.equal(LEGACY_PAGE_REDIRECTS[`/research/${SLUG}`], `/de/research/${SLUG}`);
  assert.ok(!(`/en/research/${SLUG}` in LEGACY_PAGE_REDIRECTS));
  const vercel = JSON.parse(source("vercel.json"));
  assert.ok(
    vercel.redirects.some(
      (r) => r.source === `/research/${SLUG}` && r.destination === `/de/research/${SLUG}` && r.permanent,
    ),
  );
});

test("detail page frames the per-locale deck file", () => {
  const detail = source("src/pages/research-detail.tsx");
  assert.match(detail, /case "tesla-sicherheit-model-3-y":\s*return <TeslaSicherheitModel3YDashboard \/>/);
  const component = source("src/components/tesla-sicherheit-model-3-y-dashboard.tsx");
  assert.ok(component.includes('"/research/embed/tesla-sicherheit-model-3-y.de.html"'));
  assert.ok(component.includes('"/research/embed/tesla-sicherheit-model-3-y.en.html"'));
  assert.ok(component.includes("<DeckOpenLink href={src} />"));
});
