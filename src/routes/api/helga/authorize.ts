import { createFileRoute } from "@tanstack/react-router";
import { HELGA_AGENT_ID } from "@/lib/helga";

const BLAND_AUTHORIZE_URL = `https://api.bland.ai/v1/agents/${HELGA_AGENT_ID}/authorize`;

/**
 * Server-only. Read at request time so the value is not inlined into the client.
 * Set `BLAND_API_KEY` in the server environment. Never prefix it with `VITE_`.
 */
function blandApiKey(): string | undefined {
  const value = process.env["BLAND_API_KEY"]?.trim();
  return value ? value : undefined;
}

function sessionToken(body: unknown): string {
  if (!body || typeof body !== "object" || !("token" in body)) return "";
  return typeof body.token === "string" ? body.token.trim() : "";
}

export const Route = createFileRoute("/api/helga/authorize")({
  server: {
    handlers: {
      POST: async () => {
        const apiKey = blandApiKey();
        if (!apiKey) {
          console.error("[helga] BLAND_API_KEY is not set");
          return Response.json(
            { error: "not_configured" },
            { status: 503, headers: { "cache-control": "no-store" } },
          );
        }

        let upstream: Response;
        try {
          upstream = await fetch(BLAND_AUTHORIZE_URL, {
            method: "POST",
            headers: {
              authorization: apiKey,
              "content-type": "application/json",
            },
            body: "{}",
          });
        } catch (error) {
          console.error(
            "[helga] authorize request failed",
            error instanceof Error ? error.message : "unknown",
          );
          return Response.json(
            { error: "authorize_failed" },
            { status: 502, headers: { "cache-control": "no-store" } },
          );
        }

        if (!upstream.ok) {
          console.error("[helga] authorize failed", upstream.status);
          return Response.json(
            { error: "authorize_failed" },
            { status: 502, headers: { "cache-control": "no-store" } },
          );
        }

        let payload: unknown;
        try {
          payload = await upstream.json();
        } catch {
          console.error("[helga] authorize response was not JSON");
          return Response.json(
            { error: "authorize_failed" },
            { status: 502, headers: { "cache-control": "no-store" } },
          );
        }

        const token = sessionToken(payload);
        if (!token) {
          console.error("[helga] authorize response had no token");
          return Response.json(
            { error: "authorize_failed" },
            { status: 502, headers: { "cache-control": "no-store" } },
          );
        }

        return Response.json(
          { token, agentId: HELGA_AGENT_ID },
          { headers: { "cache-control": "no-store" } },
        );
      },
    },
  },
});
