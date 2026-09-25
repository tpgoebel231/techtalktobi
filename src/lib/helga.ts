import type { Locale } from "@/lib/locale";

/**
 * Fixed public web-agent id. Not a secret, and not configurable from the browser.
 * The Bland API key is server-only (`BLAND_API_KEY`) and must never use a `VITE_` name.
 */
export const HELGA_AGENT_ID = "40d57636-a89a-47e5-8043-07bc1c16efd8";

/** Same-origin route that mints a one-time session token. */
export const HELGA_AUTHORIZE_PATH = "/api/helga/authorize";

export type MicPermission = "ok" | "denied" | "unavailable";

export async function requestMicrophone(): Promise<MicPermission> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return "unavailable";
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    for (const track of stream.getTracks()) track.stop();
    return "ok";
  } catch (error) {
    const name = error instanceof DOMException ? error.name : "";
    if (
      name === "NotFoundError" ||
      name === "NotReadableError" ||
      name === "OverconstrainedError"
    ) {
      return "unavailable";
    }
    return "denied";
  }
}

export async function fetchHelgaSession(
  locale: Locale,
): Promise<{ token: string; agentId: string }> {
  const response = await fetch(HELGA_AUTHORIZE_PATH, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ locale }),
    cache: "no-store",
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
  if (!token || agentId !== HELGA_AGENT_ID) {
    throw new Error("helga authorize failed");
  }

  return { token, agentId };
}
