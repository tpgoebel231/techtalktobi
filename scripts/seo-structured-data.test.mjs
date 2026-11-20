import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import {
  HEADSHOT_URL,
  PAGE_TITLES,
  PRIVACY_CANONICAL,
  SITE_ORIGIN,
  extraHeadTags,
  loadResearchPieces,
  privacyRootSeo,
  seoForRoute,
  structuredData,
} from "./prepare-github-pages.mjs";

const url = (p) => new URL(`../${p}`, import.meta.url);
const graph = (seo) =>
  JSON.parse(
    structuredData(seo)
      .replace(/^<script[^>]*>/, "")
      .replace(/<\/script>$/, ""),
  )["@graph"];

test("Article JSON-LD carries datePublished and dateModified", async () => {
  const pieces = await loadResearchPieces();
  for (const locale of ["en", "de"]) {
    for (const piece of pieces) {
      const seo = seoForRoute(`/${locale}/research/${piece.slug}`, pieces);
      const page = graph(seo).find((n) => n["@type"] === "Article");
      assert.match(page.datePublished, /^\d{4}-\d{2}(-\d{2})?$/, piece.slug);
      assert.match(page.dateModified, /^\d{4}-\d{2}(-\d{2})?$/, piece.slug);
      assert.ok(page.dateModified >= page.datePublished, piece.slug);
    }
  }
  const tuev = graph(seoForRoute("/en/research/tuev-adac-ev-tests", pieces)).find(
    (n) => n["@type"] === "Article",
  );
  assert.equal(tuev.datePublished, "2026-11-19");
});

test("Person JSON-LD has image, jobTitle, description and sameAs", async () => {
  const pieces = await loadResearchPieces();
  for (const locale of ["en", "de"]) {
    const person = graph(seoForRoute(`/${locale}`, pieces)).find((n) => n["@type"] === "Person");
    assert.equal(person.image, HEADSHOT_URL);
    assert.ok(person.jobTitle.length > 10);
    assert.ok(person.description.length > 40);
    assert.ok(person.sameAs.includes("https://x.com/tpgoebel"));
  }
  assert.ok(existsSync(url("public/images/tobias-goebel-headshot-800.jpg")));
  assert.ok(existsSync(url("public/images/tobias-goebel-headshot.jpg")));
  for (const w of [400, 800, 1200])
    assert.ok(existsSync(url(`public/images/tobias-goebel-headshot-${w}.webp`)));
  // Person description reuses existing home copy verbatim.
  const copy = readFileSync(url("src/data/copy.ts"), "utf8");
  for (const locale of ["en", "de"]) {
    const person = graph(seoForRoute(`/${locale}`, pieces)).find((n) => n["@type"] === "Person");
    assert.ok(copy.includes(person.description), locale);
  }
});

test("/en/privacy canonicals to /privacy; /de/privacy is its own German canonical", async () => {
  const pieces = await loadResearchPieces();
  const en = seoForRoute("/en/privacy", pieces);
  assert.equal(en.canonical, PRIVACY_CANONICAL);
  assert.match(
    extraHeadTags(en),
    /<link rel="canonical" href="https:\/\/techtalktobi\.com\/privacy"\/>/,
  );
  const de = seoForRoute("/de/privacy", pieces);
  assert.equal(de.canonical, `${SITE_ORIGIN}/de/privacy`);
  assert.match(
    extraHeadTags(de),
    /<link rel="canonical" href="https:\/\/techtalktobi\.com\/de\/privacy"\/>/,
  );
  for (const seo of [en, de, privacyRootSeo()]) {
    const hrefs = Object.fromEntries(seo.alternates.map((a) => [a.hreflang, a.href]));
    assert.equal(hrefs.en, PRIVACY_CANONICAL);
    assert.equal(hrefs.de, `${SITE_ORIGIN}/de/privacy`);
    assert.equal(hrefs["x-default"], PRIVACY_CANONICAL);
  }
  assert.equal(privacyRootSeo().canonical, `${SITE_ORIGIN}/privacy`);
  const prep = readFileSync(url("scripts/prepare-github-pages.mjs"), "utf8");
  assert.ok(!/"\/(en|de)\/privacy":\s*"/.test(prep), "no privacy redirects");
});

test("About title includes Tobias's name", () => {
  assert.match(PAGE_TITLES.about.en, /^Tobias P\. Goebel/);
  assert.match(PAGE_TITLES.about.de, /^Tobias P\. Goebel/);
  const route = readFileSync(url("src/routes/$locale/about.tsx"), "utf8");
  assert.ok(route.includes(PAGE_TITLES.about.en) && route.includes(PAGE_TITLES.about.de));
});

test("home, about, media and research index have their own 1200x630 share cards", async () => {
  const pieces = await loadResearchPieces();
  const seen = new Set();
  for (const locale of ["en", "de"]) {
    for (const [route, name] of [
      ["", "home"],
      ["/about", "about"],
      ["/media", "media"],
      ["/research", "research"],
    ]) {
      const seo = seoForRoute(`/${locale}${route}`, pieces);
      assert.equal(seo.image, `${SITE_ORIGIN}/og/og-${name}-${locale}.jpg`);
      assert.equal(seo.imageWidth, 1200);
      assert.equal(seo.imageHeight, 630);
      assert.ok(existsSync(url(`public/og/og-${name}-${locale}.jpg`)));
      seen.add(seo.image);
    }
  }
  assert.equal(seen.size, 8);
});
