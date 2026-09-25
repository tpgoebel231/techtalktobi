# TechTalkTobi

Editorial site for [TechTalkTobi](https://techtalktobi.com) — tracking the Autonomy Revolution: AI, robotics, autonomous vehicles, and the Tesla / competitive ecosystem.

Bilingual **English** and **German**. German includes a paid consulting page on autonomous-driving technology and regulation.

## Stack

TanStack Start, Vite, Tailwind CSS v4. The live site is GitHub Pages. Helga’s authorize route needs the optional Vercel server deploy (see below).

## GitHub Actions

| Workflow                               | When                               | What                         |
| -------------------------------------- | ---------------------------------- | ---------------------------- |
| [CI](.github/workflows/ci.yml)         | Pull requests and `main`           | Typecheck + production build |
| [Deploy](.github/workflows/deploy.yml) | PRs → preview; `main` → production | Prebuilt deploy to Vercel    |

Create a **new** Vercel project for this repo (do not reuse the project behind the current live site until you are ready to cut over). Then add these repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Vercel’s built-in Git deploys are disabled in `vercel.json` so Actions is the only deployer.

## Local

```bash
npm ci
npm run dev
```

Auth is off (`VITE_AUTH_ENABLED=false`).

## Helga

The About page button starts a call by `POST /api/helga/authorize`. That route has to run on a server.

Live [techtalktobi.com](https://techtalktobi.com) is GitHub Pages (`.github/workflows/pages.yml`, `NITRO_PRESET=github_pages`). Pages is static. `POST /api/helga/authorize` there is not this app’s route — the host answers 405. The rest of the site still deploys. Start on that host does not open a conversation.

To run authorize, deploy the Nitro server build with `.github/workflows/deploy.yml` (Vercel preset) and set **`BLAND_API_KEY`** on the Vercel project’s runtime environment (Production, and Preview if you use it). Do not prefix it with `VITE_`, do not commit it, and do not put it in GitHub Actions. The agent id is fixed in source. Until `https://techtalktobi.com/api/helga/authorize` is served by that Vercel app, do not treat Start on the live site as connected.
