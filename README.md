# TechTalkTobi

Editorial site for [TechTalkTobi](https://techtalktobi.com) — tracking the Autonomy Revolution: AI, robotics, autonomous vehicles, and the Tesla / competitive ecosystem.

Bilingual **English** and **German**. German includes a paid consulting page on autonomous-driving technology and regulation.

This repo is the **new** TanStack Start app. The live GitHub Pages site (`techtalktobi-old`) and `techtalktobi.com` were not changed. Cut over only when you are ready.

## Stack

TanStack Start, Vite, Tailwind CSS v4. Production target is Vercel.

## GitHub Actions

| Workflow | When | What |
|---|---|---|
| [CI](.github/workflows/ci.yml) | Pull requests and `main` | Typecheck + production build |
| [Deploy](.github/workflows/deploy.yml) | PRs → preview; `main` → production | Prebuilt deploy to Vercel |

Create a **new** Vercel project for this repo (do not reuse the project behind the current live site until you are ready to cut over). Then add these repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Vercel’s built-in Git deploys are disabled in `vercel.json` so Actions is the only deployer.

## Local

```bash
npm install
npm run dev
```

Auth is off (`VITE_AUTH_ENABLED=false`).

Hero / research / portrait JPEGs are listed in `public/images/README.md` — add them after clone. The app builds without them; those pages will just show broken images until the files are present.
