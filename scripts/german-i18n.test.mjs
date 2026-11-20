import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

async function loadTs(rel, fileName) {
  const src = source(rel);
  const { outputText } = ts.transpileModule(src, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName,
  });
  if (/\bfrom\s+['"](?!data:)/.test(outputText.replace(/import\s+type\s+.*?;/g, ""))) {
    // type-only imports are erased; remaining runtime imports would break data: import
  }
  const stripped = outputText.replace(/^import type .*?;\n/gm, "");
  return import(`data:text/javascript;base64,${Buffer.from(stripped).toString("base64")}`);
}

test("DE footer label is Datenschutz and links to /de/privacy", async () => {
  const { copy } = await loadTs("src/data/copy.ts", "copy.ts");
  const { privacyPath } = await loadTs("src/lib/locale.ts", "locale.ts");
  assert.equal(copy.de.nav.privacy, "Datenschutz");
  assert.equal(copy.en.nav.privacy, "Privacy");
  assert.match(source("src/components/site-footer.tsx"), /href=\{privacyPath\(locale\)\}/);
  assert.equal(privacyPath("de"), "/de/privacy");
  assert.equal(privacyPath("en"), "/privacy");
});

test("About copy matches Colleen's EN and DE verbatim", async () => {
  const { copy } = await loadTs("src/data/copy.ts", "copy.ts");
  assert.equal(
    copy.en.about.dek,
    "Content and advisory on autonomous driving systems (robotaxis, driver assistance), AI, and robotics.",
  );
  assert.equal(
    copy.de.about.dek,
    "Content und Beratung zu autonomen Fahrsystemen (Robotaxis, Fahrerassistenz), KI und Robotik.",
  );
  assert.equal(copy.en.about.body.length, 4);
  assert.equal(copy.de.about.body.length, 4);
  assert.equal(
    copy.en.about.body[0],
    "My path started where language meets code. I studied computational linguistics, computer science, and general linguistics in Bonn and Edinburgh, graduated in 2003, and then spent two decades in enterprise software. In 2010 I moved from Germany to the US.",
  );
  assert.equal(
    copy.de.about.body[0],
    "Angefangen hat alles dort, wo Sprache auf Code trifft. Ich habe in Bonn und Edinburgh Computerlinguistik, Informatik und Allgemeine Sprachwissenschaft studiert, 2003 meinen Abschluss gemacht und danach zwei Jahrzehnte in der Enterprise-Software gearbeitet. 2010 bin ich von Deutschland in die USA gezogen.",
  );
  assert.match(copy.en.about.body[1], /CogX Award for “Best Consumer Chatbot”/);
  assert.match(copy.de.about.body[1], /„Best Consumer Chatbot“/);
  assert.equal(copy.de.about.reach, "So erreichen Sie mich");
  assert.doesNotMatch(copy.de.about.body.join("\n"), /\u2014|\u2013/);
  assert.doesNotMatch(copy.en.about.body.join("\n"), /\u2014|\u2013/);
});

test("privacyEn and privacyDe include Colleen's analytics and consent sections", async () => {
  const { privacyEn } = await loadTs("src/data/privacy-en.ts", "privacy-en.ts");
  const deSrc = source("src/data/privacy-de.ts").replace(
    /import type \{ PrivacyPage \} from "@\/data\/privacy-en";\n/,
    "",
  );
  const { outputText } = ts.transpileModule(deSrc, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    fileName: "privacy-de.ts",
  });
  const { privacyDe } = await import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );
  const enHs = privacyEn.blocks.filter((b) => "h2" in b).map((b) => b.h2);
  const deHs = privacyDe.blocks.filter((b) => "h2" in b).map((b) => b.h2);
  assert.ok(enHs.includes("Website analytics and consent"));
  assert.ok(deHs.includes("Website-Analyse und Einwilligung"));
  assert.equal(enHs.filter((h) => h === "Website analytics").length, 0);
  const enText = privacyEn.blocks.filter((b) => "p" in b).map((b) => b.p).join("\n");
  const deText = privacyDe.blocks.filter((b) => "p" in b).map((b) => b.p).join("\n");
  assert.match(enText, /Google Analytics only runs after you click Accept/);
  assert.match(enText, /https:\/\/techtalktobi\.com\/de\/datenschutz/);
  assert.match(
    deText,
    /Rechtsgrundlage ist Ihre Einwilligung nach Art\. 6 Abs\. 1 lit\. a DSGVO und § 25 Abs\. 1 TDDDG/,
  );
  assert.match(deText, /https:\/\/techtalktobi\.com\/de\/datenschutz/);
  assert.match(deText, /Sie können Ihre Einwilligung/);
  const page = source("src/pages/privacy.tsx");
  assert.match(page, /useLocale\(\) === "de" \? privacyDe : privacyEn/);
  const root = source("src/routes/privacy.tsx");
  assert.match(root, /locale="en"/);
  assert.match(root, /<PrivacyPage \/>/);
});

test("language switcher maps /privacy to /de/privacy", async () => {
  const { switchLocalePath } = await loadTs("src/lib/locale.ts", "locale.ts");
  assert.equal(switchLocalePath("/privacy", "de"), "/de/privacy");
  assert.equal(switchLocalePath("/en/privacy", "de"), "/de/privacy");
  assert.equal(switchLocalePath("/de/privacy", "en"), "/privacy");
  assert.equal(switchLocalePath("/privacy?utm=1", "de"), "/de/privacy?utm=1");
  assert.equal(switchLocalePath("/en/about", "de"), "/de/about");
  assert.equal(
    switchLocalePath("/de/research/tuev-adac-ev-tests", "en"),
    "/en/research/tuev-adac-ev-tests",
  );
});

test("DE media document title is Medien", () => {
  assert.match(source("src/routes/$locale/media/index.tsx"), /Medien · TechTalkTobi/);
});
