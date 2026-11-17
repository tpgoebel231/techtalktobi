#!/usr/bin/env node
/**
 * One-off helper: encrypt a plaintext payload for the Live in Bonn details page.
 *
 * Usage:
 *   printf '%s' "$PLAINTEXT" | node scripts/encrypt-live-in-bonn-details.mjs \
 *     --password <password> --out src/data/live-in-bonn-details.enc.json
 *
 * Reads UTF-8 plaintext from stdin. Does not log the plaintext or the password.
 * The output is salt, iv, and ciphertext only (AES-GCM, PBKDF2-SHA-256).
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ITER = 100000;
const HASH = "SHA-256";

function arg(name) {
  const i = process.argv.indexOf(name);
  if (i === -1 || !process.argv[i + 1]) {
    throw new Error(`missing ${name}`);
  }
  return process.argv[i + 1];
}

function b64(bytes) {
  return Buffer.from(bytes).toString("base64");
}

const password = arg("--password");
const out = resolve(arg("--out"));

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const plaintext = Buffer.concat(chunks);
if (plaintext.length === 0) throw new Error("stdin was empty");

const enc = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const keyMaterial = await crypto.subtle.importKey(
  "raw",
  enc.encode(password),
  "PBKDF2",
  false,
  ["deriveKey"],
);
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: ITER, hash: HASH },
  keyMaterial,
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt"],
);
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext));

const payload = {
  v: 1,
  kdf: "PBKDF2",
  hash: HASH,
  iter: ITER,
  salt: b64(salt),
  iv: b64(iv),
  ct: b64(ct),
};

writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`);
process.stderr.write(`wrote ${out} (${payload.ct.length} chars of ciphertext)\n`);
