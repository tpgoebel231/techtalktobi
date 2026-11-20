import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("Consent Mode v2 defaults every storage type to denied before anything loads", () => {
  const a = source("src/data/analytics.ts");
  for (const key of [
    "ad_storage",
    "ad_user_data",
    "ad_personalization",
    "analytics_storage",
    "functionality_storage",
    "personalization_storage",
    "security_storage",
  ]) {
    assert.match(a, new RegExp(`${key}: 'denied'`), key);
  }
  // gtag.js is only requested from __tttLoadGa (stored "granted" or Accept click).
  const boot = a.slice(a.indexOf("export const gaConsentBootstrap"));
  assert.ok(boot.indexOf("'consent', 'default'") < boot.indexOf("__tttLoadGa = function"));
  assert.match(
    boot,
    /localStorage\.getItem\('\$\{CONSENT_STORAGE_KEY\}'\) === 'granted'\) window\.__tttLoadGa\(\)/,
  );
});

test("root head no longer loads gtag.js unconditionally", () => {
  const root = source("src/routes/__root.tsx");
  assert.ok(!root.includes("gaLoaderSrc"));
  assert.ok(!root.includes("gaConfigSnippet"));
  assert.match(root, /children: gaConsentBootstrap/);
});

test("banner: equal Accept/Decline, localStorage, privacy link, DE + EN, no em dash", () => {
  const b = source("src/components/consent-banner.tsx");
  assert.match(b, /<Button variant="outline" onClick=\{decline\}>/);
  assert.match(b, /<Button variant="outline" onClick=\{accept\}>/);
  assert.match(b, /localStorage\.setItem\(CONSENT_STORAGE_KEY, choice\)/);
  assert.match(b, /href="\/privacy"/);
  for (const s of [
    "Accept",
    "Decline",
    "Akzeptieren",
    "Ablehnen",
    "Cookie settings",
    "Cookie-Einstellungen",
  ]) {
    assert.ok(b.includes(`"${s}"`), s);
  }
  assert.doesNotMatch(b, /\u2014|\u2013/);
  assert.match(source("src/components/site-footer.tsx"), /<ConsentSettingsLink/);
  assert.match(source("src/components/site-shell.tsx"), /<ConsentBanner \/>/);
});
