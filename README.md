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

Vercel Git deploys are enabled in `vercel.json` for the connected Hobby project `techtalktobi` (team T3MC). `.github/workflows/deploy.yml` stays an optional backup and still skips when its secrets are unset.

## Local

```bash
npm ci
npm run dev
```

Auth is off (`VITE_AUTH_ENABLED=false`).

## Helga

The About page button starts a call through `POST /api/helga/authorize`. GitHub Pages stays the static site. The API host is the existing Vercel project: [https://techtalktobi.vercel.app](https://techtalktobi.vercel.app).

On `https://techtalktobi.com` and `https://www.techtalktobi.com`, the browser posts to `https://techtalktobi.vercel.app/api/helga/authorize`. On that Vercel host, localhost, and grok-sandbox, it uses the relative path. The server allows those two Pages origins only when the request host is exactly `techtalktobi.vercel.app`.

Set **`BLAND_API_KEY`** on the Vercel project’s runtime environment. Do not prefix it with `VITE_`, do not commit it, and do not put it in GitHub Actions. After merge, the Vercel Git integration deploys `main`. Start on techtalktobi.com talks to Vercel; it does not run on Pages itself.
