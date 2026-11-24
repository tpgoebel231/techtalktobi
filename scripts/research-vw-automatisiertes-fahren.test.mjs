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
const de = source("public/research/embed/vw-automatisiertes-fahren.de.html");
const en = source("public/research/embed/vw-automatisiertes-fahren.en.html");
const SLUG = "vw-automatisiertes-fahren";
const DECK_SOURCES = [
  "https://www.volkswagen.de/idhub/content/dam/onehub_master/pc/models/fas/Produktverfuegbarkeitsmatrix_04-2026.pdf",
  "https://www.volkswagen-group.com/de/pressemitteilungen/volkswagen-konzern-kooperiert-mit-valeo-und-mobileye-zur-verbesserung-der-fahrerassistenzsysteme-in-zukuenftigen-mqb-fahrzeugen-19130",
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
    assert.ok(!html.includes("fonts.googleapis.com"));
    assert.ok(html.includes("/research/embed/fonts/inter-latin-wght-normal.woff2"));
    for (const url of DECK_SOURCES) assert.ok(html.includes(url), url);
    assert.ok(html.includes("© @tpgoebel"));
    assert.doesNotMatch(html, /\u2014|\u2013/);
  }
});

test("German file keeps the corrected deck text", () => {
  for (const phrase of [
    "VW und automatisiertes Fahren",
    "Recherche mit Stand 24. November 2026: was VW, Audi und Porsche heute bieten, welche Technik und Partner dahinterstehen und was bis 2028 kommen soll.",
    "Travel Assist und Connected Travel Assist",
    "Aufnahmemodus",
    "über 3,5 Millionen Meilen Straße",
    "Von bis zu 5,8 Milliarden Dollar sind laut Rivian rund 5,3 Milliarden geflossen",
    "460 Millionen Dollar, fällig zum Serienstart bei VW oder spätestens am 3. Januar 2028",
    "1 Mrd. $ Wandelanleihe",
    "1,3 Mrd. $ Lizenz",
  ]) {
    assert.ok(de.includes(phrase), phrase);
  }
  assert.ok(!de.includes("rund 3,5 Millionen Meilen)."));
  assert.ok(!de.includes("Ein Kredit über 1 Milliarde Dollar wurde am 7.10.2026 ausgezahlt."));
});

test("English file is translated: no leftover German UI, corrections applied, no em dash", () => {
  const visible = withoutComments(en);
  assert.doesNotMatch(
    visible,
    /\b(Zurück|Weiter|Aufnahmemodus|Leertaste|Quellen:|Ausgeliefert|Marktstart|Ausgezahlt|Testbetrieb|Angekündigt|Fahrplan|PUNKT|Nothalt|Zulieferer|Vorserie|Absichtserklärung|Erprobungsgenehmigungen|Klick-für-Klick)\b/,
  );
  assert.doesNotMatch(en, /\u2014|\u2013/);
  assert.ok(en.includes("VW and Automated Driving"));
  assert.ok(en.includes("more than 3.5 million miles of roads"));
  assert.ok(!en.includes("road network"));
  assert.ok(en.includes("Of up to $5.8 billion, about $5.3 billion has been paid, according to Rivian"));
  assert.ok(en.includes("$1 billion convertible note"));
  assert.ok(en.includes("$1.3 billion for a technology license"));
  assert.ok(en.includes("$460 million, payable at Volkswagen\\'s start of series production, or by January 3, 2028 at the latest"));
  assert.ok(en.includes("['2024','$1B convertible note']"));
  assert.ok(en.includes("['Nov. 2024','$1.3B license']"));
  assert.ok(en.includes("['June 30, 2025','$1B equity']"));
  assert.ok(en.includes("['April 30, 2026','$1B equity']"));
  assert.ok(en.includes("['Oct. 7, 2026','$1B loan']"));
  assert.ok(en.includes("['Jan. 3, 2028','$460M, at the latest']"));
  assert.ok(en.includes("Sources:"));
  assert.ok(en.includes("Recording mode"));
  assert.ok(en.includes("&larr; back") || en.includes("back") || en.includes("Click / → next"));
  // Status labels keep delivered / announced / reported-only distinct.
  assert.ok(en.includes("aus:'Delivered'"));
  assert.ok(en.includes("ang:'Announced'"));
  assert.ok(en.includes("ber:'Reported only'"));
});

test("research piece, SEO, sitemap and the /research/vw-automatisiertes-fahren bounce", async () => {
  const pieces = await loadResearchPieces();
  const piece = pieces.find((p) => p.slug === SLUG);
  assert.ok(piece);
  assert.equal(piece.kind, "tool");
  assert.equal(piece.category, "autonomous-driving");
  assert.deepEqual(piece.locales ?? ["en", "de"], ["en", "de"]);
  assert.equal(piece.title.de, "VW und automatisiertes Fahren");
  assert.equal(piece.title.en, "VW and Automated Driving");
  assert.equal(
    piece.dek.de,
    "Volkswagen Konzern und automatisiertes Fahren (ADAS und ADS): was heute auf deutschen Straßen fährt, welche Technik und Partner dahinterstehen und was bis 2028 kommen soll.",
  );
  assert.equal(
    piece.dek.en,
    "The Volkswagen Group and automated driving (ADAS and ADS): what is on German roads today, the technology and partners behind it, and what is planned to arrive by 2028.",
  );
  assert.equal(
    piece.cardDek.de,
    "Was VW, Audi und Porsche heute bieten, welche Technik und Partner dahinterstehen und was bis 2028 kommen soll",
  );
  assert.equal(
    piece.cardDek.en,
    "What VW, Audi, and Porsche offer today, the technology and partners behind it, and what is planned to arrive by 2028",
  );
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
  assert.equal(seoDe.image, `${SITE_ORIGIN}/images/research-vw-automatisiertes-fahren.jpg`);
  const alts = [
    ["en", `${SITE_ORIGIN}/en/research/${SLUG}`],
    ["de", `${SITE_ORIGIN}/de/research/${SLUG}`],
    ["x-default", `${SITE_ORIGIN}/en/research/${SLUG}`],
  ];
  assert.deepEqual(seoDe.alternates.map((alt) => [alt.hreflang, alt.href]), alts);
  assert.deepEqual(seoEn.alternates.map((alt) => [alt.hreflang, alt.href]), alts);
  readFileSync(new URL("../public/images/research-vw-automatisiertes-fahren.jpg", import.meta.url));

  const sitemap = source("public/sitemap.xml");
  for (const locale of ["en", "de"]) {
    assert.ok(
      sitemap.includes(`<loc>${SITE_ORIGIN}/${locale}/research/${SLUG}</loc>\n    <lastmod>2026-11-24</lastmod>`),
      `sitemap ${locale}`,
    );
  }
  const deBlock = sitemap.split("<url>").find((chunk) => chunk.includes(`<loc>${SITE_ORIGIN}/de/research/${SLUG}</loc>`));
  const enBlock = sitemap.split("<url>").find((chunk) => chunk.includes(`<loc>${SITE_ORIGIN}/en/research/${SLUG}</loc>`));
  for (const block of [deBlock, enBlock]) {
    assert.ok(block.includes(`hreflang="de" href="${SITE_ORIGIN}/de/research/${SLUG}"`));
    assert.ok(block.includes(`hreflang="en" href="${SITE_ORIGIN}/en/research/${SLUG}"`));
    assert.ok(block.includes(`hreflang="x-default" href="${SITE_ORIGIN}/en/research/${SLUG}"`));
  }

  assert.equal(LEGACY_PAGE_REDIRECTS[`/research/${SLUG}`], `/de/research/${SLUG}`);
  assert.ok(!(`/en/research/${SLUG}` in LEGACY_PAGE_REDIRECTS));
  const vercel = JSON.parse(source("vercel.json"));
  assert.ok(
    vercel.redirects.some(
      (r) => r.source === `/research/${SLUG}` && r.destination === `/de/research/${SLUG}` && r.permanent,
    ),
  );
  assert.ok(!vercel.redirects.some((r) => r.source === `/en/research/${SLUG}`));
});

test("detail page frames the per-locale deck file", () => {
  const detail = source("src/pages/research-detail.tsx");
  assert.match(detail, /case "vw-automatisiertes-fahren":\s*return <VwAutomatisiertesFahrenDashboard \/>/);
  const component = source("src/components/vw-automatisiertes-fahren-dashboard.tsx");
  assert.ok(component.includes('"/research/embed/vw-automatisiertes-fahren.de.html"'));
  assert.ok(component.includes('"/research/embed/vw-automatisiertes-fahren.en.html"'));
  assert.ok(component.includes("<DeckOpenLink href={src} />"));
  const route = source("src/routes/$locale/research/$slug.tsx");
  assert.ok(route.includes("isResearchPublished"));
  assert.ok(route.includes("redirect"));
});
