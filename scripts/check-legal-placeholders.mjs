#!/usr/bin/env node
/**
 * Ship guard for the German privacy page (/de/datenschutz).
 *
 * The Corporate Lawyer drafts use [SQUARE BRACKET] placeholders for open
 * items. This script fails if any "[" appears in src/data/legal-de.ts strings, so the pages cannot ship by
 * accident. It runs in CI (npm run check:legal) and inside
 * scripts/prepare-github-pages.mjs, which also checks the rendered HTML.
 *
 * Local preview only: ALLOW_LEGAL_PLACEHOLDERS=1 turns the failure into a
 * warning. Never set it for a gh-pages publish.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

export const GUARDED_ROUTES = ["/de/datenschutz"];

export async function loadLegalPages(file = join(repoRoot, "src/data/legal-de.ts")) {
  const { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    fileName: "legal-de.ts",
  });
  const mod = await import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );
  if (!mod.legalPagesDe) throw new Error("check-legal-placeholders: legalPagesDe export missing");
  return mod.legalPagesDe;
}

/** Every string that still contains "[" as { page, path, text }. */
export function findPlaceholders(pages) {
  const hits = [];
  const walk = (value, page, path) => {
    if (typeof value === "string") {
      if (value.includes("[")) hits.push({ page, path, text: value });
    } else if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, page, `${path}[${i}]`));
    } else if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) walk(v, page, path ? `${path}.${k}` : k);
    }
  };
  for (const [page, data] of Object.entries(pages)) walk(data, page, "");
  return hits;
}

/** Visible text of an HTML document (scripts and tags stripped). */
export function visibleText(html) {
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  return body.replace(/<[^>]+>/g, " ");
}

export function htmlHasPlaceholder(html) {
  return visibleText(html).includes("[");
}

export function allowPlaceholders() {
  return process.env.ALLOW_LEGAL_PLACEHOLDERS === "1";
}

export async function assertNoLegalPlaceholders() {
  const hits = findPlaceholders(await loadLegalPages());
  if (hits.length === 0) return 0;
  const msg = [
    `check-legal-placeholders: ${hits.length} unfilled [placeholder] string(s) in src/data/legal-de.ts:`,
    ...hits.map((h) => `  ${h.page}.${h.path}: ${h.text.slice(0, 100)}`),
    "Resolve these before /de/datenschutz can ship.",
  ].join("\n");
  if (allowPlaceholders()) {
    console.warn(`${msg}\n(ALLOW_LEGAL_PLACEHOLDERS=1: warning only, local preview)`);
    return hits.length;
  }
  throw new Error(msg);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await assertNoLegalPlaceholders();
    console.log("check-legal-placeholders: no placeholders left");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
