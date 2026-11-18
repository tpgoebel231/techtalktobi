import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  DE_ONLY_PAGES,
  LEGACY_PAGE_REDIRECTS,
  SITE_ORIGIN,
  canonicalRoutes,
  extraHeadTags,
  loadResearchPieces,
  seoForRoute,
} from "./prepare-github-pages.mjs";

const REPO = fileURLToPath(new URL("..", import.meta.url));
const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const BANNED = ["Stie" + "fel", "Bonn" + "gasse"];

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === ".git" || name === "node_modules" || name === "dist" || name === ".vercel") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

async function decrypt(password, payload) {
  const b64 = (value) => Buffer.from(value, "base64");
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: b64(payload.salt), iterations: payload.iter, hash: payload.hash },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  const raw = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64(payload.iv) },
    key,
    b64(payload.ct),
  );
  return JSON.parse(new TextDecoder().decode(raw));
}

test("repo source and the ciphertext file do not contain the venue name or street", () => {
  const files = walk(REPO);
  const hits = [];
  for (const file of files) {
    const text = readFileSync(file);
    // skip binary-ish files
    if (text.includes(0)) continue;
    const body = text.toString("utf8");
    for (const word of BANNED) {
      if (body.toLowerCase().includes(word.toLowerCase())) hits.push(`${file.replace(REPO, "")}: ${word}`);
    }
  }
  assert.deepEqual(hits, []);
  const details = join(REPO, "dist/client/de/live-in-bonn/details.html");
  if (existsSync(details)) {
    const html = readFileSync(details, "utf8");
    assert.match(html, /name="robots" content="noindex, nofollow"/);
    assert.match(html, /pw-form/);
    assert.match(html, /Anzeigen/);
    assert.doesNotMatch(html, /Eckdaten/);
  }
});

test("password 42 decrypts a complete details object; a wrong password fails", async () => {
  const payload = JSON.parse(source("src/data/live-in-bonn-details.enc.json"));
  assert.equal(payload.v, 1);
  assert.equal(payload.kdf, "PBKDF2");
  const details = await decrypt("42", payload);
  for (const key of ["datum", "ort", "maps", "parken", "kueche", "mehr"]) {
    assert.equal(typeof details[key], "string");
    assert.ok(details[key].length > 0, key);
  }
  assert.match(details.datum, /19\.12\.2026/);
  assert.match(details.maps, /^https:\/\/www\.google\.com\/maps\//);
  assert.equal(details.mehr, "Weitere Details folgen.");
  for (const section of [details.lokal, details.markt]) {
    assert.equal(typeof section.title, "string");
    assert.ok(section.title.length > 0);
    assert.equal(typeof section.text, "string");
    assert.ok(section.text.length > 0);
    assert.ok(Array.isArray(section.photos));
    assert.ok(section.photos.length >= 1, "gallery");
    for (const photo of section.photos) {
      assert.match(photo.src, /^data:image\/webp;base64,/);
      assert.match(photo.href, /^https:\/\//);
      assert.match(photo.credit, /^Foto: /);
      assert.ok(photo.alt.length > 0);
    }
  }
  assert.equal(details.lokal.title, "Das Lokal");
  assert.equal(details.markt.title, "Bonner Weihnachtsmarkt");
  assert.equal(details.lokal.photos.length, 6);
  assert.ok(details.lokal.photos[0].hero);
  assert.equal(details.markt.photos.length, 6);
  const hero = details.lokal.photos.filter((photo) => photo.hero);
  assert.equal(hero.length, 1);
  assert.match(hero[0].src, /^data:image\/webp;base64,/);
  assert.match(hero[0].credit, /Franganillo/);
  await assert.rejects(() => decrypt("wrong", payload));
});

test("details route is German-only, noindex, not in the sitemap, and bounces from short URLs", async () => {
  const pieces = await loadResearchPieces();
  const route = "/de/live-in-bonn/details";
  assert.ok(canonicalRoutes(pieces).includes(route));
  assert.ok(!canonicalRoutes(pieces).includes("/en/live-in-bonn/details"));
  const seo = seoForRoute(route, pieces);
  assert.equal(seo.title, DE_ONLY_PAGES["live-in-bonn/details"].title);
  assert.equal(seo.description, DE_ONLY_PAGES["live-in-bonn/details"].description);
  assert.equal(seo.canonical, `${SITE_ORIGIN}${route}`);
  assert.equal(seo.robots, "noindex, nofollow");
  assert.match(extraHeadTags(seo), /name="robots" content="noindex, nofollow"/);
  const sitemap = source("public/sitemap.xml");
  assert.doesNotMatch(sitemap, /live-in-bonn\/details/);
  assert.equal(LEGACY_PAGE_REDIRECTS["/live-in-bonn/details"], route);
  assert.equal(LEGACY_PAGE_REDIRECTS["/en/live-in-bonn/details"], route);
  const vercel = JSON.parse(source("vercel.json"));
  assert.ok(
    vercel.redirects.some((r) => r.source === "/live-in-bonn/details" && r.destination === route && r.permanent),
  );
  const page = source("src/routes/$locale/live-in-bonn/details.tsx");
  assert.match(page, /noindex, nofollow/);
  assert.match(page, /Event-Details · Live in Bonn/);
  const clean = source("src/lib/clean-routes.ts");
  assert.match(clean, /\/de\/live-in-bonn\/details/);
});

test("main Live in Bonn page does not name the venue and points to the details page", () => {
  const page = source("src/pages/live-in-bonn.tsx");
  const route = source("src/routes/$locale/live-in-bonn/index.tsx");
  for (const word of BANNED) {
    assert.ok(!page.includes(word), word);
    assert.ok(!route.includes(word), word);
  }
  assert.match(page, /Zu den Event-Details/);
  assert.match(page, /href="\/de\/live-in-bonn\/details"/);
  assert.match(route, /Termin und Ort stehen fest/);
});

test("built snapshot stays free of the venue name when dist/client exists", () => {
  let dist;
  try {
    dist = execFileSync("bash", ["-lc", "test -d dist/client && echo yes || echo no"], {
      cwd: REPO,
      encoding: "utf8",
    }).trim();
  } catch {
    dist = "no";
  }
  if (dist !== "yes") return;
  const hits = [];
  const root = join(REPO, "dist/client");
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) stack.push(full);
      else {
        const buf = readFileSync(full);
        if (buf.includes(0) && !name.endsWith(".js") && !name.endsWith(".html") && !name.endsWith(".json")) continue;
        const body = buf.toString("utf8");
        for (const word of BANNED) {
          if (body.toLowerCase().includes(word.toLowerCase())) hits.push(`${full.replace(REPO, "")}: ${word}`);
        }
      }
    }
  }
  assert.deepEqual(hits, []);
});
