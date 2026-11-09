import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
function load(path, dependencies = {}) {
  const compiled = ts.transpileModule(source(path), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    (name) => dependencies[name] ?? require(name), module, module.exports,
  );
  return module.exports;
}
const geometry = load("src/data/bonn-bundeslaender.ts");
const component = load("src/components/bonn-origin-map.tsx", { "@/data/bonn-bundeslaender": geometry });
const { BUNDESLAND_PATHS: paths } = geometry;
const { ANMELDUNGEN_BY_BUNDESLAND: counts, ORIGIN_COLORS: colors } = component;
const html = renderToStaticMarkup(component.BonnOriginMap());

test("map contains all 16 states and exactly ten state-level submissions", () => {
  assert.equal(Object.keys(paths).length, 16);
  assert.deepEqual(Object.keys(paths).sort(), Object.keys(counts).sort());
  assert.equal(Object.values(counts).reduce((a, b) => a + b, 0), 10);
  assert.deepEqual(Object.entries(counts).filter(([, n]) => n > 0).sort(), [
    ["Hamburg", 1], ["Hessen", 1], ["Niedersachsen", 1], ["Nordrhein-Westfalen", 3], ["Saarland", 2], ["Sachsen", 2],
  ]);
});

test("public-domain geometry preserves both Bremen parts and enclave rings", () => {
  assert.equal(paths.Bremen.match(/M/g).length, 2);
  assert.ok(paths.Niedersachsen.match(/M/g).length >= 4);
  assert.equal(paths.Brandenburg.match(/M/g).length, 2);
  for (const name of ["Hamburg", "Bremen", "Berlin", "Saarland"]) assert.ok(paths[name].length > 100);
  const order = Object.keys(paths);
  assert.ok(order.indexOf("Bremen") > order.indexOf("Niedersachsen"));
  assert.ok(order.indexOf("Berlin") > order.indexOf("Brandenburg"));
  assert.ok(order.indexOf("Hamburg") > order.indexOf("Niedersachsen"));
  assert.match(source("src/data/bonn-bundeslaender.ts"), /lat_ts=51.16/);
});

function rings(path) {
  return path.split("M").filter(Boolean).map((ring) => ring.replace("Z", "").split("L").map((point) => point.split(",").map(Number)));
}
function contains(path, [x, y]) {
  let inside = false;
  for (const ring of rings(path)) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

test("neither Bremen part nor Berlin is painted by its surrounding state", () => {
  for (const [enclave, surrounding] of [["Bremen", "Niedersachsen"], ["Berlin", "Brandenburg"]]) {
    for (const ring of rings(paths[enclave])) {
      const center = ring.reduce(([x, y], [a, b]) => [x + a / ring.length, y + b / ring.length], [0, 0]);
      assert.ok(contains(paths[enclave], center), `${enclave} interior point`);
      assert.ok(!contains(paths[surrounding], center), `${surrounding} leaves enclave unfilled`);
    }
  }
});

test("render uses dark zero-count fills, crisp borders and distinct gold buckets", () => {
  assert.equal((html.match(/<path /g) ?? []).length, 16);
  assert.equal((html.match(/fill-rule="evenodd"/g) ?? []).length, 16);
  assert.equal((html.match(/fill="#2A2B2F"/g) ?? []).length, 10);
  assert.equal((html.match(/fill="#DDBB38"/g) ?? []).length, 3);
  assert.equal((html.match(/fill="#9E7B10"/g) ?? []).length, 3);
  assert.equal((html.match(/stroke="#1E1F22"/g) ?? []).length, 6);
  assert.equal((html.match(/stroke="#92949B"/g) ?? []).length, 10);
  assert.deepEqual(colors, { empty: "#2A2B2F", one: "#DDBB38", multiple: "#9E7B10" });
  assert.match(html, /Bisherige Anmeldungen/);
  assert.match(html, /Wo Ihr Herkommt/);
  assert.match(html, /Letztes Update: 07\.11\.2026/);
  assert.equal(component.ANMELDUNGEN_STAND, "07.11.2026");
  assert.match(html, /fill="#9E7B10"[^>]*><title>Saarland: 2<\/title>/);
  assert.doesNotMatch(html, /https?:|<script|<image|<iframe|<use|\u2014/);
  assert.ok(Buffer.byteLength(source("src/data/bonn-bundeslaender.ts")) < 40000);
});

test("page adds only one local map below the unchanged registration section", () => {
  const page = source("src/pages/live-in-bonn.tsx");
  assert.ok(page.indexOf("<BonnOriginMap />") > page.indexOf('id="anmeldung"'));
  assert.ok(page.indexOf("<BonnOriginMap />") < page.indexOf("</BonnShell>"));
  assert.match(page, /Alle drei ssusamme/);
  assert.match(page, /Erzeugt von Grok Bot, wem sonst\./);
});
