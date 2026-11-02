import { test } from "node:test";
import assert from "node:assert/strict";
import { findPlaceholders, htmlHasPlaceholder, loadLegalPages } from "./check-legal-placeholders.mjs";

test("findPlaceholders flags any string with [", () => {
  const hits = findPlaceholders({
    impressum: { title: "Impressum", blocks: [{ p: "ok" }, { lines: ["[NAME]", "USA"] }] },
  });
  assert.equal(hits.length, 1);
  assert.equal(hits[0].path, "blocks[1].lines[0]");
});

test("findPlaceholders passes clean pages", () => {
  assert.deepEqual(findPlaceholders({ a: { title: "x", blocks: [{ p: "fertig" }] } }), []);
});

test("htmlHasPlaceholder ignores script payloads but sees body text", () => {
  assert.equal(htmlHasPlaceholder('<p>ok</p><script>var a=[1]</script>'), false);
  assert.equal(htmlHasPlaceholder("<p>[ANSCHRIFT]</p>"), true);
});

test("legal-de.ts loads and exposes both pages", async () => {
  const pages = await loadLegalPages();
  assert.ok(pages.impressum && pages.datenschutz);
});
