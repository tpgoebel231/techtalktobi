import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { loadResearchModule } from "./prepare-github-pages.mjs";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const EN_INTRO =
  "I dive deeper into the self-driving vehicle industry, analyze the emerging humanoid robotics space, and cover the general Elon Musk ecosystem: AI, AV technologies and regulation, robotaxis, EVs, and more.";
const DE_INTRO =
  "Ich steige tiefer ein in autonome Fahrzeuge, analysiere den aufkommenden Markt für humanoide Roboter, und decke allgemein das Elon Musk Ökosystem ab: KI, automatisiertes Fahren, Robotaxis, E-Autos, und mehr.";

test("home Research teaser uses the research intro in both languages", () => {
  const copy = source("src/data/copy.ts");
  assert.ok(!copy.includes("Published graphics, a public FSD scorecard"));
  assert.ok(!copy.includes("Veröffentlichte Grafiken, eine öffentliche FSD-Bewertungsmatrix"));
  const teasers = [...copy.matchAll(/featuredDek:\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(teasers, [EN_INTRO, DE_INTRO]);
});

test("home shows the three newest pieces", async () => {
  const mod = await loadResearchModule();
  const newest = mod.newestResearch(3).map((p) => p.slug);
  assert.deepEqual(newest, [
    "vw-automatisiertes-fahren",
    "tuev-adac-ev-tests",
    "mercedes-mb-drive-assist-pro",
  ]);
  assert.deepEqual(mod.newestResearch(3, "en").map((p) => p.slug), [
    "tuev-adac-ev-tests",
    "mercedes-mb-drive-assist-pro",
    "tesla-gruenheide",
  ]);
  assert.deepEqual(mod.newestResearch(3, "de").map((p) => p.slug), newest);
  const dates = mod.researchNewestFirst().map((p) => p.date);
  assert.deepEqual(dates, [...dates].sort().reverse());
  assert.match(source("src/pages/home.tsx"), /newestResearch\(3, locale\)/);
});

test("More research prefers the same topic, then the newest pieces", async () => {
  const mod = await loadResearchModule();
  for (const piece of mod.research) {
    const related = mod.relatedResearch(piece.slug, 3);
    assert.equal(related.length, 3, piece.slug);
    assert.ok(!related.some((p) => p.slug === piece.slug), `${piece.slug} lists itself`);
    assert.equal(new Set(related.map((p) => p.slug)).size, 3, `${piece.slug} duplicates`);
    const sameTopic = mod.researchInCategory(piece.category).filter((p) => p.slug !== piece.slug);
    const expectedLead = sameTopic.slice(0, 3).map((p) => p.slug);
    assert.deepEqual(
      related.slice(0, expectedLead.length).map((p) => p.slug),
      expectedLead,
      piece.slug,
    );
  }
  assert.deepEqual(
    mod.relatedResearch("tesla-gruenheide", 3).map((p) => p.slug),
    ["ai-robotics", "vw-automatisiertes-fahren", "tuev-adac-ev-tests"],
  );
  assert.deepEqual(
    mod.relatedResearch("tesla-gruenheide", 3, "en").map((p) => p.slug),
    ["ai-robotics", "tuev-adac-ev-tests", "mercedes-mb-drive-assist-pro"],
  );
});

test("piece back link goes to its topic page", () => {
  const detail = source("src/pages/research-detail.tsx");
  assert.match(detail, /to="\/\$locale\/research\/topics\/\$topic"/);
  assert.match(detail, /relatedResearch\(slug, 3, locale\)/);
});

test("internal cards and links open in the same tab", () => {
  for (const file of [
    "src/components/research-card.tsx",
    "src/pages/home.tsx",
    "src/components/tuev-adac-ev-tests-dashboard.tsx",
    "src/components/mb-drive-assist-pro-dashboard.tsx",
    "src/components/vw-automatisiertes-fahren-dashboard.tsx",
    "src/components/gruenheide-dashboard.tsx",
  ]) {
    const text = source(file);
    assert.ok(!text.includes("NEW_TAB"), `${file} still opens a new tab`);
    assert.ok(!text.includes('target="_blank"'), `${file} still opens a new tab`);
  }
  // External channel links keep their new-tab behavior.
  assert.match(source("src/pages/media.tsx"), /NEW_TAB/);
});

test("slide-deck embeds get a phone height and an Open deck button", () => {
  const deck = source("src/components/deck-open.tsx");
  assert.match(deck, /Open deck/);
  assert.match(deck, /Deck öffnen/);
  assert.match(deck, /sm:hidden/);
  assert.match(deck, /h-\[78svh\]/);
  assert.match(deck, /sm:aspect-video/);
  for (const file of [
    "src/components/tuev-adac-ev-tests-dashboard.tsx",
    "src/components/mb-drive-assist-pro-dashboard.tsx",
    "src/components/vw-automatisiertes-fahren-dashboard.tsx",
  ]) {
    const text = source(file);
    assert.match(text, /className=\{DECK_FRAME_CLASS\}/, file);
    assert.match(text, /<DeckOpenButton href=\{src\} \/>/, file);
  }
  assert.match(
    source("src/components/gruenheide-dashboard.tsx"),
    /<DeckOpenButton href=\{src\} \/>/,
  );
});

test("404 is localized, uses the site shell, and waits for hydration", () => {
  const nf = source("src/pages/not-found.tsx");
  assert.match(nf, /Diese Seite gibt es nicht\./);
  assert.match(nf, /This road is closed\./);
  assert.match(nf, /<SiteShell>/);
  assert.match(nf, /if \(!hydrated\) return null;/);
  assert.match(source("src/routes/__root.tsx"), /notFoundComponent: NotFoundPage/);
  assert.match(source("src/routes/$locale/route.tsx"), /throw notFound\(\)/);
});
