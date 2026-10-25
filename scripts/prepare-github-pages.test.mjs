import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  DEFAULT_OG_IMAGE,
  LOCALE_HEAD,
  PAGE_TITLES,
  SITE_ORIGIN,
  applyRouteHead,
  loadResearchPieces,
  prepare,
  seoForRoute,
} from "./prepare-github-pages.mjs";
import { loadConfig } from "./media-kit.mjs";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");

const SAMPLE_SHELL = `<!DOCTYPE html><html lang="en" class="antialiased"><head><meta charSet="utf-8"/><title>Tobias P. Goebel</title><meta name="description" content="Tobias P. Goebel: media and advisory on autonomous systems. TeslaTobi, TechTalkTobi, published analysis. Online: tpgoebel."/><meta name="theme-color" content="#0B0D11"/></head><body></body></html>`;

function head(html) {
  const start = html.indexOf("<head>");
  const end = html.indexOf("</head>");
  return html.slice(start, end + "</head>".length);
}

test("loadResearchPieces reads title, dek, and image from research.ts", async () => {
  const pieces = await loadResearchPieces();
  const musk = pieces.find((piece) => piece.slug === "muskonomy");
  assert.ok(musk);
  assert.equal(musk.title.en, "SpaceXSI and Tesla: Who Needs Whom More?");
  assert.equal(musk.title.de, "SpaceXSI und Tesla: Wer braucht wen mehr?");
  assert.equal(
    musk.dek.en,
    "An analysis of key technologies, products, and services that each company provides for the other.",
  );
  assert.equal(
    musk.dek.de,
    "Eine Analyse der wichtigsten Technologien, Produkte und Dienstleistungen, die sich die beiden Unternehmen gegenseitig liefern.",
  );
  assert.equal(musk.image, "/images/research-muskonomy.jpg");
});

test("page titles and locale descriptions still exist in the route files", () => {
  const localeRoute = readFileSync(join(REPO, "src/routes/$locale/route.tsx"), "utf8");
  assert.ok(localeRoute.includes(LOCALE_HEAD.en.title));
  assert.ok(localeRoute.includes(LOCALE_HEAD.de.title));
  assert.ok(localeRoute.includes(LOCALE_HEAD.en.description));
  assert.ok(localeRoute.includes(LOCALE_HEAD.de.description));

  const about = readFileSync(join(REPO, "src/routes/$locale/about.tsx"), "utf8");
  assert.ok(about.includes(PAGE_TITLES.about.en));

  const consulting = readFileSync(join(REPO, "src/routes/$locale/consulting.tsx"), "utf8");
  assert.ok(consulting.includes(PAGE_TITLES.consulting.en));
  assert.ok(consulting.includes(PAGE_TITLES.consulting.de));

  const mediaKit = readFileSync(join(REPO, "src/routes/$locale/media-kit.tsx"), "utf8");
  assert.ok(mediaKit.includes(PAGE_TITLES["media-kit"].en));

  const media = readFileSync(join(REPO, "src/routes/$locale/media/index.tsx"), "utf8");
  assert.ok(media.includes(PAGE_TITLES.media.en));

  const research = readFileSync(join(REPO, "src/routes/$locale/research/index.tsx"), "utf8");
  assert.ok(research.includes(PAGE_TITLES.research.en));
});

test("research SEO uses the piece title, dek, and image; x-default is the /en URL", async () => {
  const pieces = await loadResearchPieces();
  const en = seoForRoute("/en/research/muskonomy", pieces);
  assert.equal(en.title, "SpaceXSI and Tesla: Who Needs Whom More? · TechTalkTobi");
  assert.equal(
    en.description,
    "An analysis of key technologies, products, and services that each company provides for the other.",
  );
  assert.equal(en.canonical, `${SITE_ORIGIN}/en/research/muskonomy`);
  assert.equal(en.image, `${SITE_ORIGIN}/images/research-muskonomy.jpg`);
  assert.equal(en.type, "article");
  assert.equal(en.locale, "en_US");
  assert.deepEqual(
    en.alternates.map((alt) => [alt.hreflang, alt.href]),
    [
      ["en", `${SITE_ORIGIN}/en/research/muskonomy`],
      ["de", `${SITE_ORIGIN}/de/research/muskonomy`],
      ["x-default", `${SITE_ORIGIN}/en/research/muskonomy`],
    ],
  );

  const de = seoForRoute("/de/research/muskonomy", pieces);
  assert.equal(de.title, "SpaceXSI und Tesla: Wer braucht wen mehr? · TechTalkTobi");
  assert.equal(
    de.description,
    "Eine Analyse der wichtigsten Technologien, Produkte und Dienstleistungen, die sich die beiden Unternehmen gegenseitig liefern.",
  );
  assert.equal(de.htmlLang, "de");
  assert.equal(de.locale, "de_DE");
  assert.equal(
    de.alternates.find((alt) => alt.hreflang === "x-default").href,
    `${SITE_ORIGIN}/en/research/muskonomy`,
  );
});

test("non-research pages reuse locale descriptions and route titles", async () => {
  const pieces = await loadResearchPieces();
  const about = seoForRoute("/en/about", pieces);
  assert.equal(about.title, "About · TechTalkTobi");
  assert.equal(about.description, LOCALE_HEAD.en.description);
  assert.equal(about.image, DEFAULT_OG_IMAGE);
  assert.equal(about.type, "website");

  const advisory = seoForRoute("/de/consulting", pieces);
  assert.equal(advisory.title, "Beratung · TechTalkTobi");
  assert.equal(advisory.description, LOCALE_HEAD.de.description);

  const home = seoForRoute("/en", pieces);
  assert.equal(home.title, LOCALE_HEAD.en.title);
});

test("root redirect shell canonicalizes to /en", async () => {
  const pieces = await loadResearchPieces();
  const root = seoForRoute("/", pieces);
  assert.equal(root.canonical, `${SITE_ORIGIN}/en`);
  assert.equal(root.ogUrl, `${SITE_ORIGIN}/en`);
  assert.equal(root.title, LOCALE_HEAD.en.title);
  assert.equal(root.description, LOCALE_HEAD.en.description);
});

test("applyRouteHead replaces title/description instead of duplicating them", () => {
  const seo = {
    title: 'Title with <brackets> & "quotes"',
    description: 'Dek with "quotes" & ampersands',
    canonical: `${SITE_ORIGIN}/en/about`,
    ogUrl: `${SITE_ORIGIN}/en/about`,
    image: DEFAULT_OG_IMAGE,
    type: "website",
    locale: "en_US",
    htmlLang: "en",
    alternates: [
      { hreflang: "en", href: `${SITE_ORIGIN}/en/about` },
      { hreflang: "de", href: `${SITE_ORIGIN}/de/about` },
      { hreflang: "x-default", href: `${SITE_ORIGIN}/en/about` },
    ],
  };
  const html = applyRouteHead(SAMPLE_SHELL, seo);
  const h = head(html);
  assert.equal([...h.matchAll(/<title>/g)].length, 1);
  assert.equal([...h.matchAll(/name="description"/g)].length, 1);
  assert.match(h, /<title>Title with &lt;brackets&gt; &amp; &quot;quotes&quot;<\/title>/);
  assert.match(h, /content="Dek with &quot;quotes&quot; &amp; ampersands"/);
  assert.match(h, /rel="canonical" href="https:\/\/techtalktobi.com\/en\/about"/);
  assert.match(h, /hreflang="x-default"/);
  assert.match(h, /property="og:title"/);
  assert.match(h, /name="twitter:card" content="summary_large_image"/);
  assert.doesNotMatch(h, /Tobias P. Goebel: media and advisory/);
});

test("prepare writes unique heads, keeps 404 generic, and preserves Pages extras", async () => {
  const root = mkdtempSync(join(tmpdir(), "pages-seo-"));
  writeFileSync(join(root, "_shell.html"), SAMPLE_SHELL);
  writeFileSync(join(root, loadConfig().current), "pdf");

  const { routes } = await prepare(root);
  assert.ok(routes.includes("/en/research/muskonomy"));
  assert.ok(routes.includes("/de/about"));

  const musk = readFileSync(join(root, "en/research/muskonomy.html"), "utf8");
  const muskDir = readFileSync(join(root, "en/research/muskonomy/index.html"), "utf8");
  assert.equal(musk, muskDir);
  assert.match(musk, /<title>SpaceXSI and Tesla: Who Needs Whom More\? · TechTalkTobi<\/title>/);
  assert.match(
    musk,
    /name="description" content="An analysis of key technologies, products, and services that each company provides for the other."/,
  );
  assert.match(musk, /rel="canonical" href="https:\/\/techtalktobi.com\/en\/research\/muskonomy"/);
  assert.match(musk, /hreflang="de" href="https:\/\/techtalktobi.com\/de\/research\/muskonomy"/);
  assert.match(
    musk,
    /property="og:image" content="https:\/\/techtalktobi.com\/images\/research-muskonomy.jpg"/,
  );
  assert.match(musk, /property="og:type" content="article"/);

  const deMusk = readFileSync(join(root, "de/research/muskonomy.html"), "utf8");
  assert.match(deMusk, /<html lang="de"/);
  assert.match(deMusk, /Wer braucht wen mehr\?/);
  assert.match(deMusk, /property="og:locale" content="de_DE"/);

  const about = readFileSync(join(root, "en/about.html"), "utf8");
  assert.match(about, /<title>About · TechTalkTobi<\/title>/);
  assert.match(about, new RegExp(LOCALE_HEAD.en.description.replaceAll(".", "\\.")));
  assert.match(about, /property="og:image" content="https:\/\/techtalktobi.com\/og.jpg"/);

  const index = readFileSync(join(root, "index.html"), "utf8");
  assert.match(index, /rel="canonical" href="https:\/\/techtalktobi.com\/en"/);
  assert.ok(index.includes("Tobias P. Goebel | Media &amp; Advisory"));

  const notFound = readFileSync(join(root, "404.html"), "utf8");
  assert.equal(notFound, SAMPLE_SHELL);

  assert.equal(readFileSync(join(root, "CNAME"), "utf8"), "techtalktobi.com\n");
  assert.equal(readFileSync(join(root, ".nojekyll"), "utf8"), "");
  const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
  assert.equal(vercel.git.deploymentEnabled, false);
  assert.ok(readFileSync(join(root, "media-kit.pdf")));
});
