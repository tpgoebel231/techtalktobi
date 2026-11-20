import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const url = (p) => new URL(`../${p}`, import.meta.url);
const source = (p) => readFileSync(url(p), "utf8");

async function loadImages() {
  const { outputText } = ts.transpileModule(source("src/lib/images.ts"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    fileName: "images.ts",
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}

test("headshot srcset only lists WebP widths that exist (400, 800, 1200)", async () => {
  const src = "/images/tobias-goebel-headshot.jpg";
  assert.ok(existsSync(url("public/images/tobias-goebel-headshot.jpg")));
  for (const w of [400, 800, 1200]) {
    assert.ok(existsSync(url(`public/images/tobias-goebel-headshot-${w}.webp`)), String(w));
  }
  assert.ok(!existsSync(url("public/images/tobias-goebel-headshot-480.webp")));
  const { imageSrcSet } = await loadImages();
  const srcset = imageSrcSet(src);
  assert.equal(
    srcset,
    "/images/tobias-goebel-headshot-400.webp 400w, /images/tobias-goebel-headshot-800.webp 800w, /images/tobias-goebel-headshot-1200.webp 1200w",
  );
  assert.doesNotMatch(srcset, /480/);
  assert.match(source("src/pages/media-kit.tsx"), /imageSrcSet\("\/images\/tobias-goebel-headshot\.jpg"\)/);
});
