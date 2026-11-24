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
const SLUG = "vw-automatisiertes-fahren";
const DECK_SOURCES = [
  "https://www.volkswagen.de/idhub/content/dam/onehub_master/pc/models/fas/Produktverfuegbarkeitsmatrix_04-2026.pdf",
  "https://www.volkswagen-group.com/de/pressemitteilungen/volkswagen-konzern-kooperiert-mit-valeo-und-mobileye-zur-verbesserung-der-fahrerassistenzsysteme-in-zukuenftigen-mqb-fahrzeugen-19130",
];

test("German deck file exists with lang, noindex and canonical", () => {
  assert.match(de, /<html lang="de">/);
  assert.match(de, /<meta name="robots" content="noindex, follow">/);
  assert.ok(de.includes(`<link rel="canonical" href="${SITE_ORIGIN}/de/research/${SLUG}">`));
  assert.ok(!de.includes("fonts.googleapis.com"));
  assert.ok(de.includes("/research/embed/fonts/inter-latin-wght-normal.woff2"));
  for (const url of DECK_SOURCES) assert.ok(de.includes(url), url);
});

test("German file keeps the original deck text and has no em dash", () => {
  for (const phrase of [
    "VW und automatisiertes Fahren",
    "Recherche mit Stand 24. November 2026: was VW, Audi und Porsche heute bieten, welche Technik und Partner dahinterstehen und was bis 2028 kommen soll.",
    "Travel Assist und Connected Travel Assist",
    "Aufnahmemodus",
  ]) {
    assert.ok(de.includes(phrase), phrase);
  }
  assert.doesNotMatch(de, /\u2014/);
});

test("research piece, SEO, sitemap and bare-slug bounce; no English page", async () => {
  const pieces = await loadResearchPieces();
  const piece = pieces.find((p) => p.slug === SLUG);
  assert.ok(piece);
  assert.equal(piece.kind, "tool");
  assert.equal(piece.category, "autonomous-driving");
  assert.deepEqual(piece.locales, ["de"]);
  assert.equal(piece.title.de, "VW und automatisiertes Fahren");
  assert.equal(
    piece.dek.de,
    "Volkswagen Konzern und automatisiertes Fahren (ADAS und ADS): was heute auf deutschen Straßen fährt, welche Technik und Partner dahinterstehen und was bis 2028 kommen soll.",
  );
  assert.equal(
    piece.cardDek.de,
    "Was VW, Audi und Porsche heute bieten, welche Technik und Partner dahinterstehen und was bis 2028 kommen soll",
  );
  const routes = canonicalRoutes(pieces);
  assert.ok(routes.includes(`/de/research/${SLUG}`));
  assert.ok(!routes.includes(`/en/research/${SLUG}`));

  const seoDe = seoForRoute(`/de/research/${SLUG}`, pieces);
  assert.equal(seoDe.title, `${piece.title.de} · TechTalkTobi`);
  assert.equal(seoDe.canonical, `${SITE_ORIGIN}/de/research/${SLUG}`);
  assert.equal(seoDe.description, piece.dek.de);
  assert.equal(seoDe.image, `${SITE_ORIGIN}/images/research-vw-automatisiertes-fahren.jpg`);
  assert.deepEqual(
    seoDe.alternates.map((alt) => [alt.hreflang, alt.href]),
    [["de", `${SITE_ORIGIN}/de/research/${SLUG}`]],
  );
  assert.throws(() => seoForRoute(`/en/research/${SLUG}`, pieces), /not published in en/);
  readFileSync(new URL("../public/images/research-vw-automatisiertes-fahren.jpg", import.meta.url));

  const sitemap = source("public/sitemap.xml");
  assert.ok(
    sitemap.includes(`<loc>${SITE_ORIGIN}/de/research/${SLUG}</loc>\n    <lastmod>2026-11-24</lastmod>`),
    "sitemap de",
  );
  const block = sitemap.split("<url>").find((chunk) => chunk.includes(`<loc>${SITE_ORIGIN}/de/research/${SLUG}</loc>`));
  assert.ok(block, "sitemap block");
  assert.ok(block.includes(`hreflang="de" href="${SITE_ORIGIN}/de/research/${SLUG}"`));
  assert.ok(!block.includes('hreflang="en"'));
  assert.ok(!sitemap.includes(`<loc>${SITE_ORIGIN}/en/research/${SLUG}</loc>`));

  assert.equal(LEGACY_PAGE_REDIRECTS[`/research/${SLUG}`], `/de/research/${SLUG}`);
  assert.equal(LEGACY_PAGE_REDIRECTS[`/en/research/${SLUG}`], `/de/research/${SLUG}`);
  const vercel = JSON.parse(source("vercel.json"));
  assert.ok(
    vercel.redirects.some(
      (r) => r.source === `/research/${SLUG}` && r.destination === `/de/research/${SLUG}` && r.permanent,
    ),
  );
  assert.ok(
    vercel.redirects.some(
      (r) => r.source === `/en/research/${SLUG}` && r.destination === `/de/research/${SLUG}` && r.permanent,
    ),
  );
});

test("detail page frames the German deck file", () => {
  const detail = source("src/pages/research-detail.tsx");
  assert.match(detail, /case "vw-automatisiertes-fahren":\s*return <VwAutomatisiertesFahrenDashboard \/>/);
  const component = source("src/components/vw-automatisiertes-fahren-dashboard.tsx");
  assert.ok(component.includes('"/research/embed/vw-automatisiertes-fahren.de.html"'));
  assert.ok(!component.includes(".en.html"));
  assert.ok(component.includes("<DeckOpenLink href={src} />"));
  const route = source("src/routes/$locale/research/$slug.tsx");
  assert.ok(route.includes("isResearchPublished"));
  assert.ok(route.includes("redirect"));
});
