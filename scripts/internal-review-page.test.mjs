import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../public/internal/index.html"), "utf8");

function loadHelpers() {
  const start = html.indexOf("const flag = ");
  const end = html.indexOf("function render()");
  assert.ok(start > 0 && end > start, "helper functions should sit above render()");
  const src = html.slice(start, end);
  const ctx = { actionName: { post: "Post", skip: "Skip", instructions: "Instructions" } };
  runInNewContext(src + "\nthis.flag = flag; this.initialState = initialState; this.savedLabel = savedLabel;", ctx);
  return ctx;
}

test("page source includes Like and Heart toggles and payload fields", () => {
  assert.match(html, /id: "like-" \+ cid/);
  assert.match(html, /id: "heart-" \+ cid/);
  assert.match(html, /"Like"/);
  assert.match(html, /"Heart"/);
  assert.match(html, /like: !!cur\.like, heart: !!cur\.heart/);
  assert.match(html, /flag\(c\.suggest_like\)/);
  assert.match(html, /flag\(c\.suggest_heart\)/);
  assert.match(html, /toggles\.addEventListener\("change", onEdit\)/);
  assert.doesNotMatch(html, /likeBox\.checked\s*=/);
  assert.doesNotMatch(html, /heartBox\.checked\s*=/);
  assert.equal(html.includes("\u2014"), false);
});

test("suggest_like and suggest_heart pre-check only when true", () => {
  const { initialState } = loadHelpers();
  const c = { proposed_reply: "Thanks", suggest_like: true, suggest_heart: true };
  const on = initialState(c, null, null);
  assert.deepEqual({ action: on.action, like: on.like, heart: on.heart, reply_text: on.reply_text }, { action: "", like: true, heart: true, reply_text: "Thanks" });

  const off = initialState({ proposed_reply: "", suggest_like: false, suggest_heart: "true" }, null, null);
  assert.equal(off.like, false);
  assert.equal(off.heart, false);
});

test("older comments and saved decisions without the fields stay unchecked", () => {
  const { initialState } = loadHelpers();
  const c = { proposed_reply: "Draft" };
  const fresh = initialState(c, null, null);
  assert.equal(fresh.like, false);
  assert.equal(fresh.heart, false);

  const saved = initialState(c, { action: "skip", reply_text: "Draft", instructions: "" }, null);
  assert.equal(saved.action, "skip");
  assert.equal(saved.like, false);
  assert.equal(saved.heart, false);
});

test("a saved decision wins over suggest_* flags", () => {
  const { initialState } = loadHelpers();
  const c = { proposed_reply: "Draft", suggest_like: true, suggest_heart: true };
  const state = initialState(c, { action: "post", reply_text: "Edited", instructions: "", like: false, heart: true }, null);
  assert.equal(state.action, "post");
  assert.equal(state.reply_text, "Edited");
  assert.equal(state.like, false);
  assert.equal(state.heart, true);
});

test("older drafts without like/heart keep the suggested or saved flags", () => {
  const { initialState } = loadHelpers();
  const c = { proposed_reply: "Draft", suggest_like: true, suggest_heart: false };
  const fromSuggest = initialState(c, null, { action: "skip", reply_text: "Draft", instructions: "" });
  assert.equal(fromSuggest.action, "skip");
  assert.equal(fromSuggest.like, true);
  assert.equal(fromSuggest.heart, false);

  const fromSaved = initialState(c, { action: "skip", reply_text: "Draft", instructions: "", like: false, heart: true }, { action: "skip", reply_text: "Draft", instructions: "" });
  assert.equal(fromSaved.like, false);
  assert.equal(fromSaved.heart, true);
});

test("savedLabel names the action and any reactions", () => {
  const { savedLabel } = loadHelpers();
  assert.equal(savedLabel({ action: "skip", like: true, heart: true }), "Skip \u00b7 Like \u00b7 Heart");
  assert.equal(savedLabel({ action: "", like: false, heart: true }), "Heart");
  assert.equal(savedLabel({ action: "post" }), "Post");
});

test("submit keeps the current scroll position and does not jump to the banner", () => {
  assert.match(html, /const scrollY = window\.scrollY;/);
  assert.match(html, /window\.scrollTo\(0, scrollY\)/);
  assert.match(html, /list\.style\.minHeight = prevHeight \+ "px"/);
  assert.match(html, /\$\("pager"\)\.scrollIntoView\(\{ block: "nearest", inline: "nearest" \}\)/);
  assert.doesNotMatch(html, /\$\("banner"\)\.scrollIntoView/);
  const submitStart = html.indexOf('$("reviewForm").addEventListener("submit"');
  const submitEnd = html.indexOf("if (token) load()");
  assert.ok(submitStart > 0 && submitEnd > submitStart, "submit handler should sit above boot");
  const submit = html.slice(submitStart, submitEnd);
  assert.match(submit, /window\.scrollTo\(0, scrollY\)/);
  assert.doesNotMatch(submit, /scrollTo\(0,\s*0\)/);
});

test("next and previous still scroll to the top of the new page", () => {
  assert.match(html, /\$\("prevBtn"\)\.addEventListener\("click", \(\) => \{ if \(page > 0\) \{ page--; render\(\); scrollTo\(0, 0\); \} \}\);/);
  assert.match(html, /\$\("nextBtn"\)\.addEventListener\("click", \(\) => \{ if \(\(page \+ 1\) \* PER_PAGE < flat\.length\) \{ page\+\+; render\(\); scrollTo\(0, 0\); \} \}\);/);
});
