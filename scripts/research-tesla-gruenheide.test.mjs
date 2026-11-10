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
const de = source("public/research/embed/tesla-gruenheide.de.html");
const en = source("public/research/embed/tesla-gruenheide.en.html");
const SLUG = "tesla-gruenheide";

/** Every numeric data array/field in the dashboard script, in order. */
function dataValues(html) {
  const script = html.slice(html.indexOf("const historicalMilestones"), html.indexOf("function initProjectionCharts"));
  const fields = [...script.matchAll(/\b(stamm|leih|total):\s*(\d+)/g)].map((m) => `${m[1]}=${m[2]}`);
  const arrays = [...script.matchAll(/\b(workforce|optimus|composition2036):\s*\[([^\]]+)\]/g)].map(
    (m) => `${m[1]}=${m[2].replace(/\s+/g, "")}`,
  );
  return [...fields, ...arrays];
}

/** Visible text and JS strings, without HTML/JS comments. */
function withoutComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\s\/\/ .*$/gm, "");
}

test("both dashboard files exist with the right lang, noindex and canonical", () => {
  assert.match(de, /<html lang="de">/);
  assert.match(en, /<html lang="en">/);
  for (const [html, locale] of [[de, "de"], [en, "en"]]) {
    assert.match(html, /<meta name="robots" content="noindex, follow">/);
    assert.ok(html.includes(`<link rel="canonical" href="${SITE_ORIGIN}/${locale}/research/${SLUG}">`));
    assert.ok(html.includes("cdn.jsdelivr.net/npm/chart.js@4.4.1"));
  }
});

test("German file keeps Tobias's text", () => {
  for (const phrase of [
    "Giga Berlin: Belegschaft & Optimus 10-Jahres-Projektion",
    "Drei Zukunfts-Szenarien für Grünheide (2026–2036)",
    "Trainiert Tesla Optimus wirklich schon in der Gigafactory Berlin?",
    "toLocaleString('de-DE')",
  ]) {
    assert.ok(de.includes(phrase), phrase);
  }
});

test("English file has the same data values as the German original", () => {
  const values = dataValues(de);
  assert.ok(values.length >= 27 + 9, `found ${values.length} values`);
  assert.deepEqual(dataValues(en), values);
});

test("English file is translated: no German strings, US number format, no em dash", () => {
  const visible = withoutComments(en);
  assert.doesNotMatch(visible, /\b(Belegschaft|Meilenstein|Szenario|Mitarbeiter|Köpfe|Personal|Leiharbeit|Zurück|Weiter|Quelle)\b/);
  assert.doesNotMatch(visible, /de-DE/);
  assert.doesNotMatch(visible, /\b\d{1,3}\.\d{3}\b(?! GWh)/, "decimal-point thousands left over");
  assert.doesNotMatch(en, /\u2014/);
  assert.ok(en.includes("Giga Berlin: Workforce & Optimus 10-Year Projection"));
});

test("research piece, SEO, sitemap and the /research/tesla-gruenheide bounce", async () => {
  const pieces = await loadResearchPieces();
  const piece = pieces.find((p) => p.slug === SLUG);
  assert.ok(piece);
  assert.equal(piece.kind, "tool");
  assert.ok(canonicalRoutes(pieces).includes(`/de/research/${SLUG}`));
  assert.ok(canonicalRoutes(pieces).includes(`/en/research/${SLUG}`));
  const seoDe = seoForRoute(`/de/research/${SLUG}`, pieces);
  assert.equal(seoDe.title, `${piece.title.de} · TechTalkTobi`);
  assert.equal(seoDe.canonical, `${SITE_ORIGIN}/de/research/${SLUG}`);
  assert.equal(seoDe.image, `${SITE_ORIGIN}/images/research-tesla-gruenheide.jpg`);
  readFileSync(new URL("../public/images/research-tesla-gruenheide.jpg", import.meta.url));

  const sitemap = source("public/sitemap.xml");
  for (const locale of ["en", "de"]) {
    assert.ok(
      sitemap.includes(`<loc>${SITE_ORIGIN}/${locale}/research/${SLUG}</loc>\n    <lastmod>2026-11-10</lastmod>`),
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

test("detail page frames the per-locale dashboard file", () => {
  const detail = source("src/pages/research-detail.tsx");
  assert.match(detail, /case "tesla-gruenheide":\s*return <GruenheideDashboard \/>/);
  const component = source("src/components/gruenheide-dashboard.tsx");
  assert.ok(component.includes('"/research/embed/tesla-gruenheide.de.html"'));
  assert.ok(component.includes('"/research/embed/tesla-gruenheide.en.html"'));
});
