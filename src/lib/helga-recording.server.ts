import { helgaAllowedOrigin, helgaClientIp, helgaOriginAllowed } from "./helga-authorize.server.ts";
import {
  HELGA_LISTEN_PATH,
  HELGA_VERCEL_ORIGIN,
  helgaDualCaptureEnabled,
  isHelgaUuid,
} from "./helga.ts";
import {
  HELGA_LISTEN_PERMANENT,
  blandWebhookSignatureValid,
  extractWebhookJoin,
  helgaListenSignature,
  helgaListenSignatureValid,
  readHelgaLocale,
  type HelgaListenIdKind,
} from "./helga-recording-join.ts";
import {
  helgaRecordingStoreFromEnv,
  type HelgaRecordingStore,
} from "./helga-recording-store.server.ts";

const NO_STORE = { "cache-control": "no-store" };
export const HELGA_RECORDING_RATE_LIMIT_MAX = 6;
/** Optional time-limited listen links clamp to this range. Omitted TTL is permanent. */
export const HELGA_LISTEN_LINK_TTL_MIN_SECONDS = 60;
export const HELGA_LISTEN_LINK_TTL_MAX_SECONDS = 86_400;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
/** 16 kHz 16-bit mono for the 2 minute cap, plus a little headroom. */
const MAX_AUDIO_BYTES = 6 * 1024 * 1024;
const MIN_AUDIO_BYTES = 46;
const MAX_WEBHOOK_CHARS = 2_000_000;

const hits = new Map<string, number[]>();

export const HELGA_RECORDING_ALLOW_HEADERS = "content-type, x-helga-upload-id, x-helga-locale";

export function resetHelgaRecordingRateLimit(): void {
  hits.clear();
}

export function takeHelgaRecordingRateLimit(ip: string, now = Date.now()): boolean {
  const fresh = (hits.get(ip) ?? []).filter((stamp) => now - stamp < RATE_LIMIT_WINDOW_MS);
  if (fresh.length >= HELGA_RECORDING_RATE_LIMIT_MAX) {
    hits.set(ip, fresh);
    return false;
  }
  fresh.push(now);
  hits.set(ip, fresh);
  if (hits.size > 2000) {
    for (const [key, stamps] of hits) {
      const kept = stamps.filter((stamp) => now - stamp < RATE_LIMIT_WINDOW_MS);
      if (kept.length === 0) hits.delete(key);
      else hits.set(key, kept);
    }
  }
  return true;
}

function corsJson(
  request: Request,
  body: Record<string, unknown>,
  status: number,
  extra?: Record<string, string>,
): Response {
  const headers: Record<string, string> = { ...NO_STORE, ...extra };
  const origin = helgaAllowedOrigin(request);
  if (origin) {
    headers["access-control-allow-origin"] = origin;
    headers.vary = "Origin";
  }
  return Response.json(body, { status, headers });
}

function normalizeAudioType(header: string | null): string | null {
  const base = header?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (base === "audio/wav" || base === "audio/wave" || base === "audio/x-wav") return "audio/wav";
  if (base === "audio/webm") return "audio/webm";
  if (base === "audio/ogg") return "audio/ogg";
  return null;
}

async function readLimitedBody(request: Request, max: number): Promise<Uint8Array | "too_large"> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > max) return "too_large";
  if (!request.body) {
    const bytes = new Uint8Array(await request.arrayBuffer());
    return bytes.byteLength > max ? "too_large" : bytes;
  }
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel();
      return "too_large";
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

type HandlerOptions = {
  now?: number;
  store?: HelgaRecordingStore | null;
  secret?: string | null;
  /** Test override. Production uses `HELGA_DUAL_CAPTURE=1` only. */
  dualCapture?: boolean;
};

function resolveStore(options?: HandlerOptions): HelgaRecordingStore | null {
  if (options && "store" in options) return options.store ?? null;
  return helgaRecordingStoreFromEnv();
}

function envSecret(name: string, override: string | null | undefined, provided: boolean): string {
  if (provided) return override?.trim() ?? "";
  return process.env[name]?.trim() ?? "";
}

/**
 * POST `/api/helga/recording`. Same origin allowlist as authorize.
 * Success body is `{ client_upload_id, joined }` — never a blob URL.
 */
export async function handleHelgaRecording(
  request: Request,
  options?: HandlerOptions,
): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { ...NO_STORE, allow: "POST" } });
  }

  const dualCapture =
    options && "dualCapture" in options
      ? Boolean(options.dualCapture)
      : helgaDualCaptureEnabled();
  if (!dualCapture) {
    // Dead path: Bland web audio is still unreadable; stop writing bad Blob WAVs.
    return corsJson(request, { error: "dual_capture_disabled" }, 410);
  }

  const now = options?.now ?? Date.now();
  if (!takeHelgaRecordingRateLimit(helgaClientIp(request), now)) {
    return corsJson(request, { error: "rate_limited" }, 429, { "retry-after": "600" });
  }
  if (!helgaOriginAllowed(request)) {
    return corsJson(request, { error: "forbidden" }, 403);
  }

  const store = resolveStore(options);
  if (!store) {
    console.error("[helga] recording unavailable: blob token is not set");
    return corsJson(request, { error: "not_configured" }, 503);
  }

  const uploadId = request.headers.get("x-helga-upload-id")?.trim() ?? "";
  if (!isHelgaUuid(uploadId)) {
    return corsJson(request, { error: "invalid_upload" }, 400);
  }
  const contentType = normalizeAudioType(request.headers.get("content-type"));
  if (!contentType) {
    return corsJson(request, { error: "unsupported_type" }, 415);
  }

  const body = await readLimitedBody(request, MAX_AUDIO_BYTES);
  if (body === "too_large") {
    return corsJson(request, { error: "too_large" }, 413);
  }
  if (body.byteLength < MIN_AUDIO_BYTES) {
    return corsJson(request, { error: "empty_recording" }, 400);
  }

  try {
    const saved = await store.putRecording({
      clientUploadId: uploadId.toLowerCase(),
      locale: readHelgaLocale(request.headers.get("x-helga-locale")?.trim()),
      contentType,
      bytes: body,
      now,
    });
    return corsJson(
      request,
      {
        client_upload_id: saved.meta.clientUploadId,
        joined: Boolean(saved.meta.callId),
      },
      200,
    );
  } catch {
    console.error("[helga] recording store failed");
    return corsJson(request, { error: "store_failed" }, 500);
  }
}

/**
 * POST `/api/helga/webhook`. Bland post-call webhook.
 * Verifies `X-Webhook-Signature` (HMAC-SHA256 of the raw body) with
 * `BLAND_WEBHOOK_SECRET`. Ignores Bland `recording_url`.
 */
export async function handleHelgaWebhook(
  request: Request,
  options?: HandlerOptions,
): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { ...NO_STORE, allow: "POST" } });
  }

  const secret = envSecret(
    "BLAND_WEBHOOK_SECRET",
    options?.secret,
    Boolean(options && "secret" in options),
  );
  if (!secret) {
    console.error("[helga] webhook unavailable: signing secret is not set");
    return Response.json({ error: "not_configured" }, { status: 503, headers: NO_STORE });
  }

  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_WEBHOOK_CHARS) {
    return Response.json({ error: "too_large" }, { status: 413, headers: NO_STORE });
  }
  const raw = await request.text();
  if (raw.length > MAX_WEBHOOK_CHARS) {
    return Response.json({ error: "too_large" }, { status: 413, headers: NO_STORE });
  }
  const valid = await blandWebhookSignatureValid(
    secret,
    raw,
    request.headers.get("x-webhook-signature"),
  );
  if (!valid) {
    return Response.json({ error: "invalid_signature" }, { status: 401, headers: NO_STORE });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400, headers: NO_STORE });
  }
  const join = extractWebhookJoin(payload);
  if (!join) {
    return Response.json({ error: "missing_call_id" }, { status: 400, headers: NO_STORE });
  }

  const store = resolveStore(options);
  if (!store) {
    console.error("[helga] webhook unavailable: blob token is not set");
    return Response.json({ error: "not_configured" }, { status: 503, headers: NO_STORE });
  }

  try {
    const result = await store.attachCall({
      callId: join.callId,
      clientUploadId: join.clientUploadId,
      locale: join.locale,
      now: options?.now ?? Date.now(),
    });
    return Response.json({ ok: true, joined: result.joined }, { status: 200, headers: NO_STORE });
  } catch {
    console.error("[helga] webhook join failed");
    return Response.json({ error: "store_failed" }, { status: 500, headers: NO_STORE });
  }
}

function bearerSecret(request: Request): string {
  const header = request.headers.get("authorization")?.trim() ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  return match?.[1] ?? "";
}

async function secretMatches(expected: string, provided: string): Promise<boolean> {
  const digest = async (value: string) => {
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return new Uint8Array(bytes);
  };
  const [a, b] = await Promise.all([digest(expected), digest(provided)]);
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a[i] ^ b[i];
  return mismatch === 0;
}

function audioExtension(contentType: string): string {
  if (contentType === "audio/webm") return "webm";
  if (contentType === "audio/ogg") return "ogg";
  return "wav";
}

function listenSecret(options?: HandlerOptions): string {
  return envSecret(
    "HELGA_OPS_LISTEN_SECRET",
    options?.secret,
    Boolean(options && "secret" in options),
  );
}

/**
 * Production API origin for a minted listen URL.
 * Uses the request origin only when it is already `HELGA_VERCEL_ORIGIN`.
 * Pages, preview, and localhost requests still get the Vercel API host.
 */
function helgaListenLinkOrigin(requestUrl: string): string {
  try {
    const origin = new URL(requestUrl).origin;
    if (origin === HELGA_VERCEL_ORIGIN) return origin;
  } catch {
    /* fall through to the production API host */
  }
  return HELGA_VERCEL_ORIGIN;
}

function signedListenTarget(url: URL): { kind: HelgaListenIdKind; id: string } | null {
  const callId = url.searchParams.get("call_id")?.trim().toLowerCase() ?? "";
  const uploadId = url.searchParams.get("client_upload_id")?.trim().toLowerCase() ?? "";
  // Playback prefers call_id, so a signature must cover that id when it is present.
  if (callId) return isHelgaUuid(callId) ? { kind: "call_id", id: callId } : null;
  if (uploadId) return isHelgaUuid(uploadId) ? { kind: "client_upload_id", id: uploadId } : null;
  return null;
}

function readListenExp(url: URL): number | null {
  const raw = url.searchParams.get("exp");
  if (raw === null) return null;
  const trimmed = raw.trim();
  if (!/^[0-9]+$/.test(trimmed)) return null;
  const exp = Number(trimmed);
  if (!Number.isSafeInteger(exp)) return null;
  return exp;
}

/**
 * True when a permanent `sig` (no `exp`) or a legacy `exp` + `sig` authorizes this query.
 * A present but unusable `exp` does not fall through to the permanent check.
 */
async function helgaSignedListenOk(secret: string, url: URL, nowMs: number): Promise<boolean> {
  const target = signedListenTarget(url);
  if (!target) return false;
  const sig = url.searchParams.get("sig");
  if (url.searchParams.get("exp") === null) {
    return helgaListenSignatureValid(secret, target.kind, target.id, HELGA_LISTEN_PERMANENT, sig);
  }
  const exp = readListenExp(url);
  if (exp === null) return false;
  const nowSec = Math.floor(nowMs / 1000);
  if (nowSec > exp) return false;
  return helgaListenSignatureValid(secret, target.kind, target.id, exp, sig);
}

/**
 * GET `/api/helga/listen?call_id=` or `?client_upload_id=`.
 * Ops bearer: `Authorization: Bearer $HELGA_OPS_LISTEN_SECRET`.
 * Or an HMAC `sig` from POST `/api/helga/listen-link` (permanent, or legacy `exp` + `sig`).
 * Streams our stored bytes. Not a public blob URL.
 */
export async function handleHelgaListen(
  request: Request,
  options?: HandlerOptions,
): Promise<Response> {
  if (request.method !== "GET") {
    return new Response(null, { status: 405, headers: { ...NO_STORE, allow: "GET" } });
  }

  const secret = listenSecret(options);
  if (!secret) {
    console.error("[helga] listen unavailable: ops secret is not set");
    return Response.json({ error: "not_configured" }, { status: 503, headers: NO_STORE });
  }

  const url = new URL(request.url);
  const bearerOk = await secretMatches(secret, bearerSecret(request));
  if (!bearerOk && !(await helgaSignedListenOk(secret, url, options?.now ?? Date.now()))) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }

  const store = resolveStore(options);
  if (!store) {
    console.error("[helga] listen unavailable: blob token is not set");
    return Response.json({ error: "not_configured" }, { status: 503, headers: NO_STORE });
  }

  const callId = url.searchParams.get("call_id")?.trim() ?? "";
  const uploadId = url.searchParams.get("client_upload_id")?.trim() ?? "";
  if (!callId && !uploadId) {
    return Response.json({ error: "missing_id" }, { status: 400, headers: NO_STORE });
  }
  if ((callId && !isHelgaUuid(callId)) || (uploadId && !isHelgaUuid(uploadId))) {
    return Response.json({ error: "invalid_id" }, { status: 400, headers: NO_STORE });
  }

  try {
    const found = callId ? await store.getByCallId(callId) : await store.getByUploadId(uploadId);
    if (!found) {
      return Response.json({ error: "not_found" }, { status: 404, headers: NO_STORE });
    }
    const bytes = new Uint8Array(found.bytes);
    const headers: Record<string, string> = {
      "content-type": found.meta.contentType,
      "content-length": String(bytes.byteLength),
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
      "content-disposition": `inline; filename="helga-${found.meta.clientUploadId}.${audioExtension(found.meta.contentType)}"`,
    };
    if (found.meta.callId) headers["x-helga-call-id"] = found.meta.callId;
    return new Response(bytes, { status: 200, headers });
  } catch {
    console.error("[helga] listen failed");
    return Response.json({ error: "store_failed" }, { status: 500, headers: NO_STORE });
  }
}

type ListenLinkBody =
  | { ok: true; kind: HelgaListenIdKind; id: string; ttl: number | null }
  | { ok: false; error: "invalid_json" | "invalid_body" | "invalid_id" | "invalid_ttl" };

/** `null` mints a permanent link. `"invalid"` is a 400. Numbers clamp to 60..86400. */
function parseListenTtl(value: unknown): number | null | "invalid" {
  if (value === undefined || value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) return "invalid";
  const seconds = Math.floor(value);
  if (seconds < HELGA_LISTEN_LINK_TTL_MIN_SECONDS) return HELGA_LISTEN_LINK_TTL_MIN_SECONDS;
  if (seconds > HELGA_LISTEN_LINK_TTL_MAX_SECONDS) return HELGA_LISTEN_LINK_TTL_MAX_SECONDS;
  return seconds;
}

async function readListenLinkBody(request: Request): Promise<ListenLinkBody> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return { ok: false, error: "invalid_json" };
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, error: "invalid_body" };
  }
  const body = payload as Record<string, unknown>;
  const hasCall = "call_id" in body;
  const hasUpload = "client_upload_id" in body;
  if (hasCall === hasUpload) return { ok: false, error: "invalid_body" };
  const kind: HelgaListenIdKind = hasCall ? "call_id" : "client_upload_id";
  const raw = body[kind];
  if (typeof raw !== "string" || !isHelgaUuid(raw)) return { ok: false, error: "invalid_id" };
  const ttl = parseListenTtl(body.ttl_seconds);
  if (ttl === "invalid") return { ok: false, error: "invalid_ttl" };
  return { ok: true, kind, id: raw.trim().toLowerCase(), ttl };
}

/**
 * POST `/api/helga/listen-link`.
 * Ops only: `Authorization: Bearer $HELGA_OPS_LISTEN_SECRET`.
 * Body is exactly one of `call_id` or `client_upload_id`.
 * Omit `ttl_seconds` (or send null) for a permanent link. A number mints `exp` + `sig`.
 * Returns an absolute Vercel listen URL. Never a blob URL or a Pages origin.
 */
export async function handleHelgaListenLink(
  request: Request,
  options?: HandlerOptions,
): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { ...NO_STORE, allow: "POST" } });
  }

  const secret = listenSecret(options);
  if (!secret) {
    console.error("[helga] listen-link unavailable: ops secret is not set");
    return Response.json({ error: "not_configured" }, { status: 503, headers: NO_STORE });
  }
  if (!(await secretMatches(secret, bearerSecret(request)))) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }

  const store = resolveStore(options);
  if (!store) {
    console.error("[helga] listen-link unavailable: blob token is not set");
    return Response.json({ error: "not_configured" }, { status: 503, headers: NO_STORE });
  }

  const parsed = await readListenLinkBody(request);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400, headers: NO_STORE });
  }

  try {
    const found =
      parsed.kind === "call_id"
        ? await store.getByCallId(parsed.id)
        : await store.getByUploadId(parsed.id);
    if (!found) {
      return Response.json({ error: "not_found" }, { status: 404, headers: NO_STORE });
    }
    const params = new URLSearchParams();
    params.set(parsed.kind, parsed.id);
    let expiresAt: string | null = null;
    let expiresIn: number | null = null;
    if (parsed.ttl === null) {
      params.set(
        "sig",
        await helgaListenSignature(secret, parsed.kind, parsed.id, HELGA_LISTEN_PERMANENT),
      );
    } else {
      const nowSec = Math.floor((options?.now ?? Date.now()) / 1000);
      const exp = nowSec + parsed.ttl;
      params.set("exp", String(exp));
      params.set("sig", await helgaListenSignature(secret, parsed.kind, parsed.id, exp));
      expiresAt = new Date(exp * 1000).toISOString();
      expiresIn = parsed.ttl;
    }
    const url = `${helgaListenLinkOrigin(request.url)}${HELGA_LISTEN_PATH}?${params.toString()}`;
    return Response.json(
      {
        url,
        expires_at: expiresAt,
        expires_in_seconds: expiresIn,
      },
      { status: 200, headers: NO_STORE },
    );
  } catch {
    console.error("[helga] listen-link failed");
    return Response.json({ error: "store_failed" }, { status: 500, headers: NO_STORE });
  }
}
