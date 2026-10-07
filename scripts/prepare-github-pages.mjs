#!/usr/bin/env node
/**
 * Post-build prep for the gh-pages static snapshot.
 * Copies the SPA shell to index.html + 404.html and to canonical route
 * paths so GitHub Pages serves HTTP 200 (not custom-404) for indexable URLs.
 */
import { copyFileSync, mkdirSync, writeFileSync, accessSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.argv[2] || "dist/client";
const shell = join(root, "_shell.html");

function mustExist(path) {
  accessSync(path);
}

mustExist(shell);

const locales = ["en", "de"];
const pages = ["", "about", "consulting", "media-kit", "media", "research"];
const research = [
  "self-driving",
  "speed-vs-safety",
  "tesla-ecosystem",
  "ai-robotics",
  "fsd-matrix",
  "waymo",
];

const routes = ["/"];
for (const locale of locales) {
  for (const page of pages) {
    routes.push(page ? `/${locale}/${page}` : `/${locale}`);
  }
  for (const slug of research) {
    routes.push(`/${locale}/research/${slug}`);
  }
}

function shellDest(route) {
  if (route === "/") return join(root, "index.html");
  // File path without trailing slash: /en/about → en/about.html
  // Also write directory index for /en/about/ convenience.
  return join(root, route.slice(1) + ".html");
}

copyFileSync(shell, join(root, "index.html"));
copyFileSync(shell, join(root, "404.html"));

for (const route of routes) {
  if (route === "/") continue;
  const file = shellDest(route);
  mkdirSync(dirname(file), { recursive: true });
  copyFileSync(shell, file);
  // directory index variant (GitHub Pages may request either)
  const dirIndex = join(root, route.slice(1), "index.html");
  mkdirSync(dirname(dirIndex), { recursive: true });
  copyFileSync(shell, dirIndex);
}

writeFileSync(join(root, "CNAME"), "techtalktobi.com\n");
writeFileSync(join(root, ".nojekyll"), "");
// Kill-switch on artifact branch tip so Vercel skips Previews when gh-pages is pushed.
writeFileSync(
  join(root, "vercel.json"),
  `${JSON.stringify(
    {
      $schema: "https://openapi.vercel.sh/vercel.json",
      git: { deploymentEnabled: false },
    },
    null,
    2,
  )}\n`,
);

console.log(`prepare-github-pages: wrote ${routes.length} route shells under ${root}`);
