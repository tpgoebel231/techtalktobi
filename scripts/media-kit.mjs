#!/usr/bin/env node
/**
 * Media kit URL management.
 *
 * scripts/media-kit.json lists the current kit PDF (in public/), a stable alias
 * (/media-kit.pdf) and every retired kit file name that may still be indexed.
 *
 *   node scripts/media-kit.mjs new <NewFile.pdf>
 *     Run after copying the new kit into public/. Moves the previous current kit
 *     onto the "old" list, removes its PDF from public/, points src/data/media.ts
 *     at the new file and refreshes the Vercel redirects in vercel.json.
 *
 *   node scripts/media-kit.mjs publish <dist/client>
 *     Called by prepare-github-pages.mjs. GitHub Pages has no server redirects,
 *     so every old kit path and the alias get a byte copy of the current kit.
 */
import { copyFileSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = fileURLToPath(new URL("..", import.meta.url));
const cfgPath = join(repo, "scripts/media-kit.json");
export const loadConfig = () => JSON.parse(readFileSync(cfgPath, "utf8"));

export function publish(root) {
  const cfg = loadConfig();
  const src = join(root, cfg.current);
  if (!existsSync(src)) throw new Error(`media-kit: ${src} missing`);
  for (const name of [cfg.alias, ...cfg.old]) copyFileSync(src, join(root, name));
  return [cfg.alias, ...cfg.old];
}

function syncVercel(cfg) {
  const p = join(repo, "vercel.json");
  const v = JSON.parse(readFileSync(p, "utf8"));
  v.redirects = [cfg.alias, ...cfg.old].map((n) => ({
    source: `/${n}`,
    destination: `/${cfg.current}`,
    permanent: true,
  }));
  writeFileSync(p, `${JSON.stringify(v, null, 2)}\n`);
}

function addNew(file) {
  const cfg = loadConfig();
  if (!existsSync(join(repo, "public", file))) throw new Error(`copy ${file} into public/ first`);
  if (file === cfg.current) throw new Error("already current");
  const prev = cfg.current;
  cfg.old = [...new Set([...cfg.old, prev])].filter((n) => n !== file);
  cfg.current = file;
  writeFileSync(cfgPath, `${JSON.stringify(cfg, null, 2)}\n`);
  rmSync(join(repo, "public", prev), { force: true });
  const media = join(repo, "src/data/media.ts");
  writeFileSync(media, readFileSync(media, "utf8").split(`/${prev}`).join(`/${file}`));
  syncVercel(cfg);
  console.log(`media-kit: current=${file}; old=${cfg.old.join(", ")}`);
  console.log("Also update the mediaKitCta month labels in src/data/copy.ts.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === "new" && arg) addNew(arg);
  else if (cmd === "sync-vercel") syncVercel(loadConfig());
  else if (cmd === "publish" && arg) console.log(`media-kit: wrote ${publish(arg).join(", ")}`);
  else {
    console.error("usage: media-kit.mjs new <File.pdf> | publish <root> | sync-vercel");
    process.exit(1);
  }
}
