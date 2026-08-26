#!/usr/bin/env node
/**
 * Restores JPEG/PNG binaries from base64 payloads.
 * GitHub's file API from this connector cannot carry raw binaries, so
 * photos live as .b64 text under scripts/image-payloads/.
 * Existing files are left alone so a local full-res copy is not overwritten.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const payloads = join(root, "scripts/image-payloads");
const publicDir = join(root, "public");

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (name.endsWith(".b64")) acc.push(p);
  }
  return acc;
}

if (!existsSync(payloads)) {
  console.log("decode-images: no payloads directory, skipping");
  process.exit(0);
}

let written = 0;
let skipped = 0;
for (const file of walk(payloads)) {
  const rel = relative(payloads, file).replace(/\.b64$/, "");
  const dest = join(publicDir, rel);
  if (existsSync(dest)) {
    skipped += 1;
    continue;
  }
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, Buffer.from(readFileSync(file, "utf8").replace(/\s+/g, ""), "base64"));
  written += 1;
  console.log("wrote", rel);
}
console.log(`decode-images: wrote ${written}, skipped ${skipped}`);
