import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { HELGA_AGENT_ID } from "./helga.ts";
import { handleHelgaAuthorize, resetHelgaRateLimit } from "./helga-authorize.server.ts";

const WINDOW_MS = 10 * 60 * 1000;
const SERVER_KEY = "test-server-key";

function post(url: string, headers: Record<string, string>, body = "{}"): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

function sameOrigin(origin: string, ip = "203.0.113.10"): Request {
  const host = new URL(origin).host;
  return post(`${origin}/api/helga/authorize`, {
    origin,
    "x-forwarded-host": host,
    "x-real-ip": ip,
    "sec-fetch-site": "same-origin",
  });
}

afterEach(() => {
  resetHelgaRateLimit();
  delete process.env.BLAND_API_KEY;
});

describe("helga authorize gate", () => {
  it("allows 10 posts per IP in 10 minutes and returns 429 on the next", async () => {
    const start = 1_700_000_000_000;
    let mints = 0;
    const mint = async () => {
      mints += 1;
      return "session-token";
    };
    for (let i = 0; i < 10; i += 1) {
      const response = await handleHelgaAuthorize(sameOrigin("https://techtalktobi.com"), {
        now: start,
        mint,
      });
      assert.equal(response.status, 200);
    }
    const blocked = await handleHelgaAuthorize(sameOrigin("https://techtalktobi.com"), {
      now: start + 1_000,
      mint,
    });
    assert.equal(blocked.status, 429);
    assert.equal(blocked.headers.get("retry-after"), "600");
    assert.equal(mints, 10);
    const again = await handleHelgaAuthorize(sameOrigin("https://techtalktobi.com"), {
      now: start + WINDOW_MS,
      mint,
    });
    assert.equal(again.status, 200);
  });

  it("rejects cross-origin, insecure production, and non-POST", async () => {
    let mints = 0;
    const mint = async () => {
      mints += 1;
      return "session-token";
    };
    const cross = await handleHelgaAuthorize(
      post("https://techtalktobi.com/api/helga/authorize", {
        origin: "https://evil.example",
        "x-forwarded-host": "techtalktobi.com",
        "x-real-ip": "203.0.113.20",
        "sec-fetch-site": "cross-site",
      }),
      { mint },
    );
    assert.equal(cross.status, 403);

    const insecure = await handleHelgaAuthorize(
      post("http://techtalktobi.com/api/helga/authorize", {
        origin: "http://techtalktobi.com",
        "x-forwarded-host": "techtalktobi.com",
        "x-real-ip": "203.0.113.21",
      }),
      { mint },
    );
    assert.equal(insecure.status, 403);

    const get = await handleHelgaAuthorize(
      new Request("https://techtalktobi.com/api/helga/authorize", { method: "GET" }),
    );
    assert.equal(get.status, 405);
    assert.equal(get.headers.get("allow"), "POST");
    assert.equal(get.headers.get("access-control-allow-origin"), null);
    assert.equal(mints, 0);
  });

  it("allows the site hosts, local dev, and matching preview hosts", async () => {
    const mint = async () => "session-token";
    const cases = [
      "https://techtalktobi.com",
      "https://www.techtalktobi.com",
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      "https://preview.grok-sandbox.com",
      "https://techtalktobi-preview.vercel.app",
    ];
    for (const [index, origin] of cases.entries()) {
      const response = await handleHelgaAuthorize(sameOrigin(origin, `203.0.113.${30 + index}`), {
        mint,
      });
      assert.equal(response.status, 200, origin);
    }

    const otherVercel = await handleHelgaAuthorize(
      post("https://techtalktobi.vercel.app/api/helga/authorize", {
        origin: "https://attacker.vercel.app",
        "x-forwarded-host": "techtalktobi.vercel.app",
        "x-real-ip": "203.0.113.90",
        "sec-fetch-site": "cross-site",
      }),
      { mint },
    );
    assert.equal(otherVercel.status, 403);
  });

  it("fails closed without a server key and does not leak upstream fields", async () => {
    const logs: string[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    };
    const originalFetch = globalThis.fetch;
    try {
      const missing = await handleHelgaAuthorize(
        sameOrigin("https://techtalktobi.com", "203.0.113.40"),
      );
      assert.equal(missing.status, 503);
      const missingBody = await missing.json();
      assert.deepEqual(missingBody, { error: "not_configured" });

      process.env.BLAND_API_KEY = SERVER_KEY;
      globalThis.fetch = async (_input, init) => {
        const headers = new Headers(init?.headers);
        assert.equal(headers.get("authorization"), SERVER_KEY);
        return new Response(
          JSON.stringify({
            token: "session-token",
            expires_at: "soon",
            secret: SERVER_KEY,
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      };

      const ok = await handleHelgaAuthorize(
        sameOrigin("https://www.techtalktobi.com", "203.0.113.41"),
      );
      assert.equal(ok.status, 200);
      assert.equal(ok.headers.get("access-control-allow-origin"), null);
      const body = await ok.json();
      assert.deepEqual(body, { token: "session-token", agentId: HELGA_AGENT_ID });
      assert.deepEqual(Object.keys(body).sort(), ["agentId", "token"]);

      globalThis.fetch = async () =>
        new Response(JSON.stringify({ error: SERVER_KEY, token: "should-not-leak" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        });
      const failed = await handleHelgaAuthorize(
        sameOrigin("https://techtalktobi.com", "203.0.113.42"),
      );
      assert.equal(failed.status, 502);
      const failedBody = await failed.json();
      assert.deepEqual(failedBody, { error: "authorize_failed" });
      assert.equal(JSON.stringify(failedBody).includes(SERVER_KEY), false);
      assert.equal(JSON.stringify(failedBody).includes("should-not-leak"), false);

      const blob = logs.join("\n");
      assert.equal(blob.includes(SERVER_KEY), false);
      assert.equal(blob.includes("session-token"), false);
      assert.equal(blob.includes("should-not-leak"), false);
    } finally {
      console.error = originalError;
      globalThis.fetch = originalFetch;
    }
  });
});
