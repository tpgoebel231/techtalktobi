import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

const url = (p) => new URL(`../${p}`, import.meta.url);
const source = (p) => readFileSync(url(p), "utf8");

test("every /images JPG has WebP variants for srcset", () => {
  const jpgs = readdirSync(url("public/images")).filter(
    (f) => f.endsWith(".jpg") && !f.startsWith("tobias-goebel-headshot"),
  );
  assert.ok(jpgs.length > 10);
  const lib = source("src/lib/images.ts");
  for (const jpg of jpgs) {
    const stem = jpg.replace(/\.jpg$/, "");
    const custom = lib.match(new RegExp(`"/images/${stem}\\.jpg": \\[([^\\]]+)\\]`));
    const widths = custom ? custom[1].split(",").map((w) => w.trim()) : ["480", "800", "1200"];
    for (const w of widths) {
      assert.ok(existsSync(url(`public/images/${stem}-${w}.webp`)), `${stem}-${w}.webp`);
    }
  }
  assert.match(
    source("src/components/research-card.tsx"),
    /srcSet=\{imageSrcSet\(piece\.image\)\}/,
  );
  assert.match(source("src/components/research-card.tsx"), /loading="lazy"/);
});

test("header logo uses the 128px file", () => {
  assert.match(source("src/components/mark.tsx"), /src="\/logo-128\.png"/);
  assert.ok(existsSync(url("public/logo-128.png")));
});

test("site fonts are self-hosted, no Google Fonts request", () => {
  const root = source("src/routes/__root.tsx");
  assert.ok(!root.includes("fonts.googleapis.com"));
  assert.ok(!root.includes("fonts.gstatic.com"));
  assert.match(root, /fontsCss/);
  const fonts = source("src/fonts.css");
  for (const fam of ["ibm-plex-sans", "ibm-plex-mono", "outfit"])
    assert.ok(fonts.includes(`@fontsource/${fam}/`));
});

test("research embeds load no Tailwind CDN and no Google Fonts", () => {
  const dir = "public/research/embed";
  for (const f of readdirSync(url(dir)).filter((f) => f.endsWith(".html"))) {
    const html = source(`${dir}/${f}`);
    assert.ok(!html.includes("cdn.tailwindcss.com"), `${f} Tailwind CDN`);
    assert.ok(!html.includes("fonts.googleapis.com"), `${f} Google Fonts`);
    assert.ok(html.includes("/research/embed/fonts/inter-latin-wght-normal.woff2"), `${f} Inter`);
  }
  assert.ok(existsSync(url(`${dir}/fonts/inter-latin-wght-normal.woff2`)));
});

test("faint text color meets WCAG AA on the dark backgrounds", () => {
  const css = source("src/styles.css");
  const hex = (name) => css.match(new RegExp(`--color-${name}: (#[0-9a-f]{6})`))[1];
  const lum = (h) => {
    const c = [1, 3, 5]
      .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
      .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  for (const bg of ["bg", "surface", "surface-2"]) {
    assert.ok(ratio(hex("faint"), hex(bg)) >= 4.5, `faint on ${bg}`);
  }
});
