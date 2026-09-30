import type { Locale } from "@/lib/locale";

/**
 * Public web-agent ids. Not secrets, and not configurable from the browser.
 * Bland authorize cannot override language per session, so DE and EN each use
 * their own agent. Each agent's first_sentence is the `{{greeting}}` session variable.
 * The Bland API key is server-only (`BLAND_API_KEY`) and must never use a `VITE_` name.
 */
export const HELGA_AGENT_ID_EN = "40d57636-a89a-47e5-8043-07bc1c16efd8";
export const HELGA_AGENT_ID_DE = "99a49d35-4c4a-41f1-96f0-1bc5a0fc13fa";

/** @deprecated Prefer HELGA_AGENT_ID_EN or helgaAgentIdForLocale. */
export const HELGA_AGENT_ID = HELGA_AGENT_ID_EN;

const HELGA_AGENT_IDS = new Set([HELGA_AGENT_ID_EN, HELGA_AGENT_ID_DE]);

/** Missing or unknown locale uses the English agent. */
export function helgaAgentIdForLocale(locale: Locale | undefined): string {
  return locale === "de" ? HELGA_AGENT_ID_DE : HELGA_AGENT_ID_EN;
}

export function isHelgaAgentId(agentId: string): boolean {
  return HELGA_AGENT_IDS.has(agentId);
}

/** Same-origin route that mints a one-time session token. */
export const HELGA_AUTHORIZE_PATH = "/api/helga/authorize";
export const HELGA_RECORDING_PATH = "/api/helga/recording";
export const HELGA_WEBHOOK_PATH = "/api/helga/webhook";
export const HELGA_LISTEN_PATH = "/api/helga/listen";

/**
 * Static GitHub Pages cannot run these routes. Those two origins call the
 * Vercel server. No API key belongs in these URLs.
 */
export const HELGA_VERCEL_ORIGIN = "https://techtalktobi.vercel.app";
export const HELGA_VERCEL_AUTHORIZE_URL = `${HELGA_VERCEL_ORIGIN}${HELGA_AUTHORIZE_PATH}`;
export const HELGA_VERCEL_RECORDING_URL = `${HELGA_VERCEL_ORIGIN}${HELGA_RECORDING_PATH}`;
/** Bland agent webhook (EN + DE). Configured in the Bland dashboard, not by the browser. */
export const HELGA_PRODUCTION_WEBHOOK_URL = `${HELGA_VERCEL_ORIGIN}${HELGA_WEBHOOK_PATH}`;

const PAGES_ORIGINS = new Set(["https://techtalktobi.com", "https://www.techtalktobi.com"]);

function currentOrigin(): string {
  if (typeof location === "undefined") return "";
  return location.origin;
}

/** Absolute on Pages. Relative on Vercel, localhost, and grok-sandbox. */
export function helgaAuthorizeUrl(pageOrigin = currentOrigin()): string {
  if (PAGES_ORIGINS.has(pageOrigin)) return HELGA_VERCEL_AUTHORIZE_URL;
  return HELGA_AUTHORIZE_PATH;
}

/** Same hybrid as authorize: Pages posts the WAV to the Vercel API host. */
export function helgaRecordingUrl(pageOrigin = currentOrigin()): string {
  if (PAGES_ORIGINS.has(pageOrigin)) return HELGA_VERCEL_RECORDING_URL;
  return HELGA_RECORDING_PATH;
}

/** UUID shape used for client upload ids and Bland call ids. Not a secret. */
const HELGA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isHelgaUuid(value: string): boolean {
  return HELGA_UUID.test(value.trim());
}

export function newHelgaUploadId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const rand = Math.floor(Math.random() * 16);
    const value = char === "x" ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

export type MicPermission = "ok" | "denied" | "unavailable";

export type OpenMicrophoneResult =
  | { permission: "ok"; stream: MediaStream }
  | { permission: Exclude<MicPermission, "ok">; stream: null };

/**
 * Live mic for the whole call. Callers must `stopMicrophone` on hangup.
 * `requestMicrophone` still probes permission and stops tracks immediately;
 * do not use that probe as the recording stream.
 */
export async function openMicrophone(): Promise<OpenMicrophoneResult> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return { permission: "unavailable", stream: null };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
    });
    return { permission: "ok", stream };
  } catch (error) {
    const name = error instanceof DOMException ? error.name : "";
    if (
      name === "NotFoundError" ||
      name === "NotReadableError" ||
      name === "OverconstrainedError"
    ) {
      return { permission: "unavailable", stream: null };
    }
    return { permission: "denied", stream: null };
  }
}

export function stopMicrophone(stream: MediaStream | null | undefined): void {
  if (!stream) return;
  for (const track of stream.getTracks()) track.stop();
}

export async function requestMicrophone(): Promise<MicPermission> {
  const opened = await openMicrophone();
  stopMicrophone(opened.stream);
  return opened.permission;
}

export async function fetchHelgaSession(
  locale: Locale,
  clientUploadId?: string | null,
): Promise<{ token: string; agentId: string }> {
  const uploadId = clientUploadId && isHelgaUuid(clientUploadId) ? clientUploadId : undefined;
  const response = await fetch(helgaAuthorizeUrl(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(uploadId ? { locale, client_upload_id: uploadId } : { locale }),
    cache: "no-store",
    credentials: "omit",
  });

  if (!response.ok) {
    throw new Error("helga authorize failed");
  }

  const body: unknown = await response.json();
  if (!body || typeof body !== "object") {
    throw new Error("helga authorize failed");
  }

  const token = "token" in body && typeof body.token === "string" ? body.token : "";
  const agentId = "agentId" in body && typeof body.agentId === "string" ? body.agentId : "";
  const expected = helgaAgentIdForLocale(locale);
  if (!token || agentId !== expected || !isHelgaAgentId(agentId)) {
    throw new Error("helga authorize failed");
  }

  return { token, agentId };
}

/** Posts the mixed WAV. The response has no public playback URL. */
export async function uploadHelgaRecording(
  blob: Blob,
  clientUploadId: string,
  locale: Locale,
): Promise<void> {
  const response = await fetch(helgaRecordingUrl(), {
    method: "POST",
    headers: {
      "content-type": blob.type || "audio/wav",
      "x-helga-upload-id": clientUploadId,
      "x-helga-locale": locale,
    },
    body: blob,
    cache: "no-store",
    credentials: "omit",
  });
  if (!response.ok) {
    throw new Error("helga recording upload failed");
  }
}
