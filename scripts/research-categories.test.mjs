import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  LEGACY_PAGE_REDIRECTS,
  PAGE_DESCRIPTIONS,
  SITE_ORIGIN,
  canonicalRoutes,
  githubPagesStartOptions,
  loadResearchPieces,
  researchTopicSlugs,
  seoForRoute,
} from "./prepare-github-pages.mjs";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const EN_INTRO =
  "I dive deeper into the self-driving vehicle industry, analyze the emerging humanoid robotics space, and cover the general Elon Musk ecosystem: AI, AV technologies and regulation, robotaxis, EVs, and more.";
const DE_INTRO =
  "Ich steige tiefer ein in autonome Fahrzeuge, analysiere den aufkommenden Markt für humanoide Roboter, und decke allgemein das Elon Musk Ökosystem ab: KI, automatisiertes Fahren, Robotaxis, E-Autos, und mehr.";
const OLD_EN = "Graphics, a public FSD scorecard, and an interactive explainer.";
const OLD_DE = "Grafiken, eine öffentliche FSD-Bewertungsmatrix und ein interaktiver Rechner.";

const TOPICS = ["autonomous-driving", "robotics", "muskonomy"];
const EXPECTED = {
  "self-driving": "autonomous-driving",
  "speed-vs-safety": "autonomous-driving",
  "fsd-matrix": "autonomous-driving",
  waymo: "autonomous-driving",
  "mercedes-mb-drive-assist-pro": "autonomous-driving",
  "vw-automatisiertes-fahren": "autonomous-driving",
  "ai-robotics": "robotics",
  "tesla-gruenheide": "robotics",
  muskonomy: "muskonomy",
  "tesla-ecosystem": "muskonomy",
  "tuev-adac-ev-tests": "muskonomy",
  "tesla-sicherheit-model-3-y": "muskonomy",
};

test("Research intro uses Tobias's wording in both languages, old line is gone", () => {
  for (const file of [
    "src/data/copy.ts",
    "src/routes/$locale/research/index.tsx",
    "scripts/prepare-github-pages.mjs",
  ]) {
    const text = source(file);
    assert.ok(text.includes(EN_INTRO), `${file} EN intro`);
    assert.ok(text.includes(DE_INTRO), `${file} DE intro`);
    assert.ok(!text.includes(OLD_EN), `${file} still has old EN line`);
    assert.ok(!text.includes(OLD_DE), `${file} still has old DE line`);
  }
  assert.equal(PAGE_DESCRIPTIONS.research.en, EN_INTRO);
  assert.equal(PAGE_DESCRIPTIONS.research.de, DE_INTRO);
});

test("every research piece has a known category, matching the agreed mapping", async () => {
  const pieces = await loadResearchPieces();
  assert.deepEqual(researchTopicSlugs(pieces), TOPICS);
  for (const piece of pieces) {
    assert.ok(TOPICS.includes(piece.category), `${piece.slug} has category ${piece.category}`);
    assert.equal(piece.category, EXPECTED[piece.slug], piece.slug);
  }
  assert.equal(pieces.length, Object.keys(EXPECTED).length);
  for (const topic of TOPICS) {
    assert.ok(pieces.some((piece) => piece.category === topic), `${topic} is empty`);
  }
});

test("category routes are canonical, prerendered, and have their own SEO", async () => {
  const pieces = await loadResearchPieces();
  const routes = canonicalRoutes(pieces);
  const prerendered = (await githubPagesStartOptions()).pages.map((page) => page.path);
  const labels = {
    en: { "autonomous-driving": "Autonomous Driving", robotics: "Robotics", muskonomy: "Muskonomy" },
    de: { "autonomous-driving": "Autonomes Fahren", robotics: "Robotik", muskonomy: "Muskonomy" },
  };
  for (const locale of ["en", "de"]) {
    for (const topic of TOPICS) {
      const route = `/${locale}/research/topics/${topic}`;
      assert.ok(routes.includes(route), route);
      assert.ok(prerendered.includes(route), `prerender ${route}`);
      const seo = seoForRoute(route, pieces);
      const suffix = locale === "de" ? "Recherche" : "Research";
      assert.equal(seo.title, `${labels[locale][topic]} · ${suffix} · TechTalkTobi`);
      assert.ok(seo.description.startsWith(`${labels[locale][topic]}: `));
      assert.doesNotMatch(seo.description, /\u2014/);
      assert.equal(seo.canonical, `${SITE_ORIGIN}${route}`);
      assert.deepEqual(
        seo.alternates.map((alt) => alt.href),
        [
          `${SITE_ORIGIN}/en/research/topics/${topic}`,
          `${SITE_ORIGIN}/de/research/topics/${topic}`,
          `${SITE_ORIGIN}/en/research/topics/${topic}`,
        ],
      );
    }
  }
  assert.throws(() => seoForRoute("/en/research/topics/nope", pieces), /unknown research topic/);
  // Piece URLs stay where they were.
  for (const slug of Object.keys(EXPECTED)) {
    assert.ok(routes.includes(`/de/research/${slug}`));
    assert.ok(routes.includes(`/en/research/${slug}`));
  }
});

test("router registers topics as its own route, not the piece-detail $slug", () => {
  const tree = source("src/routeTree.gen.ts");
  assert.match(tree, /'\/\$locale\/research\/topics\/\$topic'/);
  const route = source("src/routes/$locale/research/topics/$topic.tsx");
  assert.match(route, /createFileRoute\("\/\$locale\/research\/topics\/\$topic"\)/);
  assert.match(route, /isResearchCategorySlug/);
  const index = source("src/pages/research-index.tsx");
  assert.match(index, /ResearchCategoryTile/);
});

test("sitemap lists all six category pages with lastmod and hreflang", () => {
  const sitemap = source("public/sitemap.xml");
  for (const locale of ["en", "de"]) {
    for (const topic of TOPICS) {
      const loc = `${SITE_ORIGIN}/${locale}/research/topics/${topic}`;
      const block = sitemap.split("<url>").find((chunk) => chunk.includes(`<loc>${loc}</loc>`));
      assert.ok(block, loc);
      const lastmod = topic === "autonomous-driving" ? "2026-11-24" : topic === "muskonomy" ? "2026-11-26" : "2026-11-20";
      assert.ok(block.includes(`<lastmod>${lastmod}</lastmod>`), `${loc} lastmod ${lastmod}`);
      assert.ok(block.includes(`hreflang="de" href="${SITE_ORIGIN}/de/research/topics/${topic}"`));
      assert.ok(block.includes(`hreflang="x-default" href="${SITE_ORIGIN}/en/research/topics/${topic}"`));
    }
  }
});

test("bare category URLs bounce to the English pages; existing bounces stay", () => {
  for (const topic of TOPICS) {
    assert.equal(LEGACY_PAGE_REDIRECTS[`/research/topics/${topic}`], `/en/research/topics/${topic}`);
  }
  assert.equal(LEGACY_PAGE_REDIRECTS["/research"], "/en/research");
  assert.equal(LEGACY_PAGE_REDIRECTS["/muskonomy"], "/en/research/muskonomy");
  assert.equal(LEGACY_PAGE_REDIRECTS["/research/tuev-adac-ev-tests"], "/de/research/tuev-adac-ev-tests");
  assert.equal(LEGACY_PAGE_REDIRECTS["/research/vw-automatisiertes-fahren"], "/de/research/vw-automatisiertes-fahren");
  assert.ok(!("/en/research/vw-automatisiertes-fahren" in LEGACY_PAGE_REDIRECTS));
  assert.equal(LEGACY_PAGE_REDIRECTS["/research/tesla-sicherheit-model-3-y"], "/de/research/tesla-sicherheit-model-3-y");
  assert.ok(!("/en/research/tesla-sicherheit-model-3-y" in LEGACY_PAGE_REDIRECTS));
});

test("German nav label stays Recherche", () => {
  const copy = source("src/data/copy.ts");
  assert.match(copy, /research: "Recherche"/);
});
