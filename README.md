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

On `https://techtalktobi.com` and `https://www.techtalktobi.com`, the browser posts to `https://techtalktobi.vercel.app/api/helga/authorize`. On that Vercel host, localhost, and grok-sandbox, it uses the relative path. The server allows those two Pages origins only when the request host is exactly `techtalktobi.vercel.app`. Recording upload uses the same split (`/api/helga/recording`).

Set these on the Vercel project’s runtime environment. Do not prefix them with `VITE_`, do not commit them, and do not put them in GitHub Actions.

| Name                      | Purpose                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| `BLAND_API_KEY`           | Mints the web-agent session token.                                                             |
| `BLOB_READ_WRITE_TOKEN`   | Vercel Blob read/write token. Audio is stored with **private** access. Required in production. |
| `BLAND_WEBHOOK_SECRET`    | HMAC secret from Bland → Account → Keys. Verifies `X-Webhook-Signature` on the raw body.       |
| `HELGA_OPS_LISTEN_SECRET` | Ops bearer for listen and listen-link. HMAC key for short-lived listen URLs.                   |
| `HELGA_RECORDING_DIR`     | Optional local directory for smoke tests when Blob is unset. Not a public web root.            |

After merge, the Vercel Git integration deploys `main`. Start on techtalktobi.com talks to Vercel; it does not run on Pages itself.

### Call audio (ops)

Bland’s web `recording_url` stays empty, and the listen-adapter spike could not read `bland-web-recordings`. The site records both sides in the browser (visitor mic + agent PCM from the WebSocket) and stores a WAV on our side. Visitors see a short notice before Start. Playback is not anonymous.

**Webhook URL** (set on both agents in the Bland dashboard; this repo does not change agent settings):

`https://techtalktobi.vercel.app/api/helga/webhook`

| Agent   | Id                                     |
| ------- | -------------------------------------- |
| English | `40d57636-a89a-47e5-8043-07bc1c16efd8` |
| German  | `99a49d35-4c4a-41f1-96f0-1bc5a0fc13fa` |

The browser sends a `client_upload_id` on authorize (session variable) and on the upload. The post-call webhook joins that id to Bland’s `call_id`. If the payload has no upload id, the server links the call only when exactly one unmatched upload for that locale is inside 15 minutes.

Ops play (the response is the audio bytes, not a public blob URL):

```bash
curl -fsS \
  -H "Authorization: Bearer $HELGA_OPS_LISTEN_SECRET" \
  "https://techtalktobi.vercel.app/api/helga/listen?call_id=CALL_ID" \
  -o helga.wav
```

`client_upload_id` works the same way: `/api/helga/listen?client_upload_id=UPLOAD_ID`.

### Tobias listen link

Helga mints a link with the ops bearer and pastes the returned `url` into the call log. Tobias opens that URL in a browser. It streams the same audio and does not send `Authorization`. The link stops working at `expires_at` (default one hour). The URL is always on `https://techtalktobi.vercel.app` — never a GitHub Pages origin, and never a Vercel Blob URL.

```bash
curl -fsS \
  -X POST \
  -H "Authorization: Bearer $HELGA_OPS_LISTEN_SECRET" \
  -H "content-type: application/json" \
  -d '{"call_id":"CALL_ID"}' \
  "https://techtalktobi.vercel.app/api/helga/listen-link"
```

Response: `{ "url", "expires_at", "expires_in_seconds" }`. Optional `ttl_seconds` is clamped to 60..86400 (default 3600). Send `client_upload_id` instead of `call_id` when the webhook has not joined yet — exactly one of the two ids. `call_id` is available after the webhook join.

The bearer listen curl above still works.

Manual smoke: open `/de/about` or `/en/about`, Start, talk, end the call. The WAV upload lands, Bland’s webhook joins `call_id`, then the curl above plays the mix. The listen-link curl is what Helga pastes for Tobias.
