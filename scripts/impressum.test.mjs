import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
import {
  IMPRESSUM_PATHS,
  IMPRESSUM_SEO,
  LEGACY_PAGE_REDIRECTS,
  SITE_ORIGIN,
  canonicalRoutes,
  loadResearchPieces,
  seoForRoute,
} from "./prepare-github-pages.mjs";

const source = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

async function loadTs(rel, fileName) {
  const src = source(rel);
  const { outputText } = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    fileName,
  });
  const stripped = outputText.replace(/^import type .*?;\n/gm, "");
  return import(`data:text/javascript;base64,${Buffer.from(stripped).toString("base64")}`);
}

test("Impressum pages, footer, sitemap and locale switcher", async () => {
  const { copy } = await loadTs("src/data/copy.ts", "copy.ts");
  const { impressumPath, switchLocalePath } = await loadTs("src/lib/locale.ts", "locale.ts");
  const dataSrc = source("src/data/impressum.ts");
  const { outputText } = ts.transpileModule(
    dataSrc.replace(/import type \{ Locale \} from "@\/lib\/locale";\n/, ""),
    {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      fileName: "impressum.ts",
    },
  );
  const { impressum } = await import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );

  assert.equal(copy.de.nav.imprint, "Impressum");
  assert.equal(copy.en.nav.imprint, "Legal notice");
  assert.equal(impressumPath("de"), "/de/impressum");
  assert.equal(impressumPath("en"), "/en/imprint");
  assert.match(source("src/components/site-footer.tsx"), /impressumPath\(locale\)/);
  assert.match(source("src/components/site-footer.tsx"), /copy\.nav\.imprint/);

  assert.equal(switchLocalePath("/de/impressum", "en"), "/en/imprint");
  assert.equal(switchLocalePath("/en/imprint", "de"), "/de/impressum");
  assert.equal(switchLocalePath("/en/impressum", "en"), "/en/imprint");

  for (const locale of ["en", "de"]) {
    const page = impressum[locale];
    const text = JSON.stringify(page);
    assert.match(text, /Tobias Goebel/);
    assert.match(text, /30 Fuller St, Apt 303/);
    assert.match(text, /Brookline, MA 02446/);
    assert.match(text, /tobias@techtalktobi.com/);
    assert.doesNotMatch(text, /USt|VAT ID|Telefon|phone|\+1 /i);
    assert.doesNotMatch(text, /Stammtisch|Bonn/);
    assert.doesNotMatch(text, /\[[A-ZÄÖÜ]/);
    assert.doesNotMatch(text, /\u2014|\u2013/);
  }
  assert.match(impressum.de.blocks.map((b) => b.h2).filter(Boolean).join("\n"), /§ 18 Abs\. 2/);
  assert.match(impressum.en.blocks.map((b) => b.h2).filter(Boolean).join("\n"), /§ 18\(2\)/);
  const deContact = impressum.de.blocks.find((b) => b.contact).contact;
  const enContact = impressum.en.blocks.find((b) => b.contact).contact;
  assert.equal(deContact.formHref, "/de/about#contact");
  assert.equal(enContact.formHref, "/en/about#contact");
});

test("Impressum SEO, prerender routes and sitemap", async () => {
  const pieces = await loadResearchPieces();
  const routes = canonicalRoutes(pieces);
  assert.ok(routes.includes("/en/imprint"));
  assert.ok(routes.includes("/de/impressum"));
  assert.ok(!routes.includes("/en/impressum"));
  assert.ok(!routes.includes("/de/imprint"));

  const en = seoForRoute("/en/imprint", pieces);
  const de = seoForRoute("/de/impressum", pieces);
  assert.equal(en.canonical, `${SITE_ORIGIN}/en/imprint`);
  assert.equal(de.canonical, `${SITE_ORIGIN}/de/impressum`);
  assert.equal(en.title, IMPRESSUM_SEO.en.title);
  assert.equal(de.title, IMPRESSUM_SEO.de.title);
  assert.equal(en.htmlLang, "en");
  assert.equal(de.htmlLang, "de");
  for (const seo of [en, de]) {
    const hrefs = Object.fromEntries(seo.alternates.map((a) => [a.hreflang, a.href]));
    assert.equal(hrefs.en, `${SITE_ORIGIN}${IMPRESSUM_PATHS.en}`);
    assert.equal(hrefs.de, `${SITE_ORIGIN}${IMPRESSUM_PATHS.de}`);
    assert.equal(hrefs["x-default"], `${SITE_ORIGIN}${IMPRESSUM_PATHS.en}`);
  }
  assert.equal(LEGACY_PAGE_REDIRECTS["/en/impressum"], "/en/imprint");
  assert.equal(LEGACY_PAGE_REDIRECTS["/de/imprint"], "/de/impressum");
  assert.equal(LEGACY_PAGE_REDIRECTS["/impressum"], "/de/impressum");
  assert.equal(LEGACY_PAGE_REDIRECTS["/imprint"], "/en/imprint");

  const sitemap = source("public/sitemap.xml");
  assert.match(
    sitemap,
    /<loc>https:\/\/techtalktobi\.com\/en\/imprint<\/loc>\s*<lastmod>2026-11-20<\/lastmod>/,
  );
  assert.match(
    sitemap,
    /<loc>https:\/\/techtalktobi\.com\/de\/impressum<\/loc>\s*<lastmod>2026-11-20<\/lastmod>/,
  );
});
