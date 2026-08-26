# TechTalkTobi

Editorial site for TechTalkTobi — tracking the Autonomy Revolution: AI, robotics, autonomous vehicles, and the Tesla / competitive ecosystem.

Bilingual **English** and **German**. German includes a paid consulting page on autonomous-driving technology and regulation.

This repo is the **new** app. It does **not** replace the live GitHub Pages site (`techtalktobi-old` / techtalktobi.com) until you cut over.

## Stack

TanStack Start, Vite, Tailwind CSS v4. Production target is a **new** Vercel project.

## GitHub Actions

CI is green on `main` (typecheck + production build).

| Workflow | When | What |
|---|---|---|
| [CI](.github/workflows/ci.yml) | Pull requests and `main` | Decode photos, typecheck, production build |
| [Deploy](.github/workflows/deploy.yml) | PRs → preview; `main` → production | Prebuilt deploy to Vercel |

Create a **new** Vercel project for this repo. Do not reuse the project behind the current live site, and do not attach techtalktobi.com, until you are ready to cut over. Then add these repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Vercel’s built-in Git deploys are disabled in `vercel.json` so Actions is the only deployer.

## Photos

JPEG/PNG files are stored as base64 under `scripts/image-payloads/` and restored by `node scripts/decode-images.mjs` (CI does this automatically). A local full-resolution copy is left alone if it already exists.

## Local

```bash
npm install
node scripts/decode-images.mjs
npm run dev
```

Auth is off (`VITE_AUTH_ENABLED=false`).
