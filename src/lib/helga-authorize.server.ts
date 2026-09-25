import { HELGA_AGENT_ID } from "./helga.ts";
import type { Locale } from "./locale.ts";

/**
 * In-memory sliding window. Each server instance has its own map, so a
 * multi-instance host (Vercel Fluid / several lambdas) can exceed this budget.
 * Move the counters to Redis or Upstash before relying on the limit there.
 */
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

const PRODUCTION_ORIGINS = new Set(["https://techtalktobi.com", "https://www.techtalktobi.com"]);

const NO_STORE = { "cache-control": "no-store" };

export function resetHelgaRateLimit(): void {
  hits.clear();
}

export function helgaClientIp(request: Request): string {
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || "unknown";
}

/** `true` when this IP may mint another session. */
export function takeHelgaRateLimit(ip: string, now = Date.now()): boolean {
  const fresh = (hits.get(ip) ?? []).filter((stamp) => now - stamp < RATE_LIMIT_WINDOW_MS);
  if (fresh.length >= RATE_LIMIT_MAX) {
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

function requestHost(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim().toLowerCase();
  if (forwarded) return forwarded;
  const host = request.headers.get("host")?.trim().toLowerCase();
  if (host) return host;
  return new URL(request.url).host.toLowerCase();
}

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function isPreviewHost(hostname: string): boolean {
  return hostname === "grok-sandbox.com" || hostname.endsWith(".grok-sandbox.com");
}

function isVercelHost(hostname: string): boolean {
  return hostname.endsWith(".vercel.app");
}

/**
 * Same-origin minting only. Production hosts must be HTTPS.
 * `*.vercel.app` is allowed only when it is the host that received the request,
 * so another Vercel project cannot call this deployment.
 */
export function helgaOriginAllowed(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase();
  if (fetchSite && fetchSite !== "same-origin") return false;

  const originHeader = request.headers.get("origin")?.trim();
  const referer = request.headers.get("referer")?.trim();
  let origin: URL;
  try {
    if (originHeader) origin = new URL(originHeader);
    else if (referer) origin = new URL(referer);
    else return false;
  } catch {
    return false;
  }

  const hostname = origin.hostname.toLowerCase();
  const local = isLocalHost(hostname);
  const production = PRODUCTION_ORIGINS.has(origin.origin);
  const preview = isPreviewHost(hostname);
  const vercel = isVercelHost(hostname);

  if (production) {
    if (origin.protocol !== "https:") return false;
  } else if (local) {
    if (origin.protocol !== "http:" && origin.protocol !== "https:") return false;
  } else if (preview || vercel) {
    if (origin.protocol !== "https:") return false;
  } else {
    return false;
  }

  return origin.host.toLowerCase() === requestHost(request);
}

async function readLocale(request: Request): Promise<Locale | undefined> {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || !("locale" in body)) return undefined;
    if (body.locale === "de") return "de";
    if (body.locale === "en") return "en";
    return undefined;
  } catch {
    return undefined;
  }
}

function blandApiKey(): string | undefined {
  const value = process.env["BLAND_API_KEY"]?.trim();
  return value ? value : undefined;
}

function json(
  body: Record<string, string>,
  status: number,
  extra?: Record<string, string>,
): Response {
  return Response.json(body, { status, headers: { ...NO_STORE, ...extra } });
}

export type HelgaMint = (locale: Locale | undefined) => Promise<string>;

/**
 * POST only. Mints one WebRTC session token.
 * Success body is exactly `{ token, agentId }` — never the upstream payload.
 */
export async function handleHelgaAuthorize(
  request: Request,
  options?: { now?: number; mint?: HelgaMint },
): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { ...NO_STORE, allow: "POST" } });
  }

  const ip = helgaClientIp(request);
  if (!takeHelgaRateLimit(ip, options?.now ?? Date.now())) {
    return json({ error: "rate_limited" }, 429, { "retry-after": "600" });
  }

  if (!helgaOriginAllowed(request)) {
    return json({ error: "forbidden" }, 403);
  }

  const mint = options?.mint;
  let token = "";
  try {
    if (mint) {
      token = await mint(await readLocale(request));
    } else {
      const apiKey = blandApiKey();
      if (!apiKey) {
        console.error("[helga] authorize unavailable: server key is not set");
        return json({ error: "not_configured" }, 503);
      }
      token = await mintWithBland(apiKey, await readLocale(request));
    }
  } catch {
    console.error("[helga] authorize upstream failed");
    return json({ error: "authorize_failed" }, 502);
  }

  if (!token) {
    console.error("[helga] authorize upstream returned no session token");
    return json({ error: "authorize_failed" }, 502);
  }

  return json({ token, agentId: HELGA_AGENT_ID }, 200);
}

async function mintWithBland(apiKey: string, locale: Locale | undefined): Promise<string> {
  const upstream = await fetch(`https://api.bland.ai/v1/agents/${HELGA_AGENT_ID}/authorize`, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(locale ? { locale } : {}),
  });

  if (!upstream.ok) {
    console.error("[helga] authorize upstream status", upstream.status);
    throw new Error("upstream");
  }

  let payload: unknown;
  try {
    payload = await upstream.json();
  } catch {
    throw new Error("upstream");
  }

  if (!payload || typeof payload !== "object" || !("token" in payload)) return "";
  const token = payload.token;
  return typeof token === "string" ? token.trim() : "";
}
