import { isHelgaUuid } from "./helga.ts";

/** How long an upload and a webhook may miss each other and still join. */
export const HELGA_JOIN_WINDOW_MS = 15 * 60 * 1000;

export type HelgaRecordingMeta = {
  clientUploadId: string;
  callId: string | null;
  locale: "en" | "de" | null;
  contentType: string;
  byteLength: number;
  createdAt: string;
};

export type WebhookJoin = {
  callId: string;
  clientUploadId: string | null;
  locale: "en" | "de" | null;
};

export type OrphanCall = {
  callId: string;
  locale: "en" | "de" | null;
  receivedAtMs: number;
};

const RATE_KEYS = [
  "playbackSampleRate",
  "sample_rate",
  "sampleRate",
  "pcm_sample_rate",
  "ttsSampleRate",
] as const;

const UPLOAD_ID_CONTAINERS = ["variables", "request_data", "metadata", "context"] as const;

/** Keys that are not a join source. Bland `recording_url` is never copied. */
const SKIP_WALK_KEYS = new Set([
  "recording_url",
  "recording_expiration",
  "transcript",
  "concatenated_transcript",
  "summary",
  "transcripts",
  "pathway_logs",
]);

function readUuid(value: unknown): string | null {
  if (typeof value !== "string" || !isHelgaUuid(value)) return null;
  return value.trim().toLowerCase();
}

export function readHelgaLocale(value: unknown): "en" | "de" | null {
  return value === "en" || value === "de" ? value : null;
}

function localeFrom(record: Record<string, unknown> | null): "en" | "de" | null {
  if (!record) return null;
  return readHelgaLocale(record.locale);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function uploadIdOn(record: Record<string, unknown> | null): string | null {
  if (!record) return null;
  return readUuid(record.client_upload_id);
}

/**
 * Pull `call_id` and our `client_upload_id` from a Bland post-call body.
 * Does not read `recording_url`. Returns null when there is no call id.
 */
export function extractWebhookJoin(payload: unknown): WebhookJoin | null {
  const root = asRecord(payload);
  if (!root) return null;
  const callId = readUuid(root.call_id) ?? readUuid(root.c_id);
  if (!callId) return null;

  let clientUploadId = uploadIdOn(root);
  let locale = localeFrom(root);
  for (const key of UPLOAD_ID_CONTAINERS) {
    const nested = asRecord(root[key]);
    clientUploadId = clientUploadId ?? uploadIdOn(nested);
    locale = locale ?? localeFrom(nested);
  }
  if (!clientUploadId) clientUploadId = walkForUploadId(root, 0, { budget: 400 });

  return { callId, clientUploadId, locale };
}

function walkForUploadId(value: unknown, depth: number, state: { budget: number }): string | null {
  if (state.budget <= 0 || depth > 6) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      state.budget -= 1;
      const found = walkForUploadId(item, depth + 1, state);
      if (found) return found;
    }
    return null;
  }
  const record = asRecord(value);
  if (!record) return null;
  const own = uploadIdOn(record);
  if (own) return own;
  for (const [key, child] of Object.entries(record)) {
    if (SKIP_WALK_KEYS.has(key)) continue;
    state.budget -= 1;
    const found = walkForUploadId(child, depth + 1, state);
    if (found) return found;
  }
  return null;
}

function toHex(bytes: Uint8Array): string {
  let hex = "";
  for (const byte of bytes) hex += byte.toString(16).padStart(2, "0");
  return hex;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return toHex(new Uint8Array(signature));
}

/** HMAC-SHA256 hex of the raw webhook body. Matches Bland's signing scheme. */
export async function blandWebhookSignature(secret: string, rawBody: string): Promise<string> {
  return hmacSha256Hex(secret, rawBody);
}

export type HelgaListenIdKind = "call_id" | "client_upload_id";

/** Canonical tail for a listen link that does not expire. */
export const HELGA_LISTEN_PERMANENT = "permanent";

/** Unix expiry seconds, or {@link HELGA_LISTEN_PERMANENT} when the link does not expire. */
export type HelgaListenExpiry = number | typeof HELGA_LISTEN_PERMANENT;

/**
 * Stable string signed for a Tobias listen link.
 * Permanent: `v1\n{call_id|client_upload_id}\n{lowercase uuid}\npermanent`.
 * Time-limited: `v1\n{call_id|client_upload_id}\n{lowercase uuid}\n{exp unix seconds}`.
 */
export function helgaListenCanonical(
  kind: HelgaListenIdKind,
  id: string,
  exp: HelgaListenExpiry,
): string {
  return `v1\n${kind}\n${id.trim().toLowerCase()}\n${exp}`;
}

/** HMAC-SHA256 hex of {@link helgaListenCanonical}, keyed with `HELGA_OPS_LISTEN_SECRET`. */
export async function helgaListenSignature(
  secret: string,
  kind: HelgaListenIdKind,
  id: string,
  exp: HelgaListenExpiry,
): Promise<string> {
  return hmacSha256Hex(secret, helgaListenCanonical(kind, id, exp));
}

function signaturesEqual(expectedHex: string, providedHex: string): boolean {
  if (expectedHex.length !== providedHex.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expectedHex.length; i += 1) {
    mismatch |= expectedHex.charCodeAt(i) ^ providedHex.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function blandWebhookSignatureValid(
  secret: string,
  rawBody: string,
  header: string | null,
): Promise<boolean> {
  if (!header) return false;
  const provided = header
    .trim()
    .toLowerCase()
    .replace(/^sha256=/, "");
  if (!/^[0-9a-f]+$/.test(provided)) return false;
  const expected = await blandWebhookSignature(secret, rawBody);
  return signaturesEqual(expected, provided);
}

/** Constant-time check of a listen-link `sig` query value. */
export async function helgaListenSignatureValid(
  secret: string,
  kind: HelgaListenIdKind,
  id: string,
  exp: HelgaListenExpiry,
  providedSig: string | null,
): Promise<boolean> {
  if (!providedSig) return false;
  const provided = providedSig.trim().toLowerCase();
  if (!/^[0-9a-f]+$/.test(provided)) return false;
  const expected = await helgaListenSignature(secret, kind, id, exp);
  return signaturesEqual(expected, provided);
}

function localeCompatible(hint: "en" | "de" | null, item: "en" | "de" | null): boolean {
  if (!hint || !item) return true;
  return hint === item;
}

/** Join only when exactly one unmatched upload sits in the window. */
export function matchSinglePendingUpload(
  pending: readonly HelgaRecordingMeta[],
  hint: { locale: "en" | "de" | null; atMs: number },
  windowMs = HELGA_JOIN_WINDOW_MS,
): string | null {
  const matches = pending.filter((item) => {
    if (item.callId) return false;
    const created = Date.parse(item.createdAt);
    if (!Number.isFinite(created)) return false;
    if (Math.abs(hint.atMs - created) > windowMs) return false;
    return localeCompatible(hint.locale, item.locale);
  });
  return matches.length === 1 ? matches[0].clientUploadId : null;
}

/** Join an upload to a webhook that arrived first without an upload id. */
export function matchSingleOrphanCall(
  orphans: readonly OrphanCall[],
  hint: { locale: "en" | "de" | null; atMs: number },
  windowMs = HELGA_JOIN_WINDOW_MS,
): string | null {
  const matches = orphans.filter((item) => {
    if (Math.abs(hint.atMs - item.receivedAtMs) > windowMs) return false;
    return localeCompatible(hint.locale, item.locale);
  });
  return matches.length === 1 ? matches[0].callId : null;
}

export function readPcmSampleRate(message: unknown): number | null {
  const direct = rateOn(message);
  if (direct) return direct;
  const record = asRecord(message);
  if (!record) return null;
  return rateOn(record.payload) ?? rateOn(record.data);
}

function rateOn(message: unknown): number | null {
  const record = asRecord(message);
  if (!record) return null;
  for (const key of RATE_KEYS) {
    const value = record[key];
    if (typeof value === "number" && value >= 8000 && value <= 48000) return value;
  }
  return null;
}
