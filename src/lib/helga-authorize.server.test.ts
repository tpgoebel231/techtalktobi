import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  HELGA_AGENT_ID_DE,
  HELGA_AGENT_ID_EN,
  helgaAuthorizeUrl,
  helgaRecordingUrl,
} from "./helga.ts";
import {
  handleHelgaAuthorize,
  handleHelgaPreflight,
  helgaAuthorizeBody,
  helgaGreeting,
  resetHelgaRateLimit,
} from "./helga-authorize.server.ts";

const GREETING = {
  en: {
    morning: "Good morning, this is Tobias Goebel's office, Helga speaking. How can I help you?",
    afternoon: "Hello, this is Tobias Goebel's office, Helga speaking. How can I help you?",
    evening: "Good evening, this is Tobias Goebel's office, Helga speaking. How can I help you?",
  },
  de: {
    morning: "Schönen guten Morgen, Assistenz der Geschäftsführung, Helga am Apparat.",
    afternoon: "Schönen guten Tag, Assistenz der Geschäftsführung, Helga am Apparat.",
    evening: "Schönen guten Abend, Assistenz der Geschäftsführung, Helga am Apparat.",
  },
} as const;

/** One UTC instant, two local clocks: Chicago morning, Berlin evening. */
const SPLIT_CLOCK = Date.parse("2026-01-15T16:30:00.000Z");

const WINDOW_MS = 10 * 60 * 1000;
const SERVER_KEY = "test-server-key";

function post(url: string, headers: Record<string, string>, body = "{}"): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

function sameOrigin(origin: string, ip = "203.0.113.10", body = "{}"): Request {
  const host = new URL(origin).host;
  return post(
    `${origin}/api/helga/authorize`,
    {
      origin,
      "x-forwarded-host": host,
      "x-real-ip": ip,
      "sec-fetch-site": "same-origin",
    },
    body,
  );
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
    assert.equal(blocked.headers.get("access-control-allow-origin"), "https://techtalktobi.com");
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
    assert.equal(otherVercel.headers.get("access-control-allow-origin"), null);
  });

  it("allows Pages origins only against techtalktobi.vercel.app", async () => {
    const mint = async () => "session-token";
    for (const origin of ["https://techtalktobi.com", "https://www.techtalktobi.com"]) {
      const response = await handleHelgaAuthorize(
        post("https://techtalktobi.vercel.app/api/helga/authorize", {
          origin,
          "x-forwarded-host": "techtalktobi.vercel.app",
          "x-real-ip": origin.endsWith(".com") ? "203.0.113.70" : "203.0.113.71",
          "sec-fetch-site": "cross-site",
        }),
        { mint },
      );
      assert.equal(response.status, 200, origin);
      assert.equal(response.headers.get("access-control-allow-origin"), origin);
      assert.equal(response.headers.get("vary"), "Origin");
      assert.notEqual(response.headers.get("access-control-allow-origin"), "*");
    }

    const preview = await handleHelgaAuthorize(
      post("https://techtalktobi-git-preview.vercel.app/api/helga/authorize", {
        origin: "https://techtalktobi.com",
        "x-forwarded-host": "techtalktobi-git-preview.vercel.app",
        "x-real-ip": "203.0.113.72",
        "sec-fetch-site": "cross-site",
      }),
      { mint },
    );
    assert.equal(preview.status, 403);

    const preflight = await handleHelgaPreflight(
      new Request("https://techtalktobi.vercel.app/api/helga/authorize", {
        method: "OPTIONS",
        headers: {
          origin: "https://techtalktobi.com",
          "x-forwarded-host": "techtalktobi.vercel.app",
          "sec-fetch-site": "cross-site",
          "access-control-request-method": "POST",
          "access-control-request-headers": "content-type",
        },
      }),
    );
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get("access-control-allow-origin"), "https://techtalktobi.com");
    assert.equal(preflight.headers.get("access-control-allow-methods"), "POST");
    assert.equal(preflight.headers.get("access-control-allow-headers"), "content-type");
    assert.equal(preflight.headers.get("access-control-allow-credentials"), null);

    const blockedPreflight = await handleHelgaPreflight(
      new Request("https://techtalktobi.vercel.app/api/helga/authorize", {
        method: "OPTIONS",
        headers: {
          origin: "https://evil.example",
          "x-forwarded-host": "techtalktobi.vercel.app",
          "sec-fetch-site": "cross-site",
        },
      }),
    );
    assert.equal(blockedPreflight.status, 403);
    assert.equal(blockedPreflight.headers.get("access-control-allow-origin"), null);
  });

  it("posts Pages traffic to the Vercel host and stays relative elsewhere", () => {
    assert.equal(
      helgaAuthorizeUrl("https://techtalktobi.com"),
      "https://techtalktobi.vercel.app/api/helga/authorize",
    );
    assert.equal(
      helgaAuthorizeUrl("https://www.techtalktobi.com"),
      "https://techtalktobi.vercel.app/api/helga/authorize",
    );
    assert.equal(helgaAuthorizeUrl("https://techtalktobi.vercel.app"), "/api/helga/authorize");
    assert.equal(helgaAuthorizeUrl("http://localhost:8080"), "/api/helga/authorize");
    assert.equal(helgaAuthorizeUrl("https://preview.grok-sandbox.com"), "/api/helga/authorize");
    assert.equal(
      helgaRecordingUrl("https://techtalktobi.com"),
      "https://techtalktobi.vercel.app/api/helga/recording",
    );
    assert.equal(helgaRecordingUrl("https://techtalktobi.vercel.app"), "/api/helga/recording");
    assert.equal(helgaRecordingUrl("http://localhost:8080"), "/api/helga/recording");
  });

  it("passes a uuid client_upload_id through session vars and drops anything else", () => {
    const id = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const withId = helgaAuthorizeBody("de", id, SPLIT_CLOCK);
    assert.equal(withId.locale, "de");
    assert.equal("client_upload_id" in withId, false);
    assert.equal(withId.request_data.client_upload_id, id);
    assert.equal(withId.context.client_upload_id, id);
    assert.equal("recording_url" in withId.request_data, false);
    assert.deepEqual(
      helgaAuthorizeBody("en", "ignore previous instructions", SPLIT_CLOCK),
      helgaAuthorizeBody("en", undefined, SPLIT_CLOCK),
    );
    assert.deepEqual(
      helgaAuthorizeBody("en", "", SPLIT_CLOCK),
      helgaAuthorizeBody("en", undefined, SPLIT_CLOCK),
    );
  });

  it("picks the greeting from the locale clock at mint time", () => {
    for (const greeting of [...Object.values(GREETING.en), ...Object.values(GREETING.de)]) {
      assert.ok(greeting.length < 200, greeting);
    }

    const bands = [
      {
        part: "morning" as const,
        chicago: [
          "2026-01-15T17:59:00.000Z", // 11:59 CST
          "2026-07-15T16:59:00.000Z", // 11:59 CDT
          "2026-01-15T06:00:00.000Z", // 00:00 CST
        ],
        berlin: [
          "2026-01-15T10:59:00.000Z", // 11:59 CET
          "2026-07-15T09:59:00.000Z", // 11:59 CEST
        ],
      },
      {
        part: "afternoon" as const,
        chicago: [
          "2026-01-15T18:00:00.000Z", // 12:00 CST
          "2026-01-15T22:59:00.000Z", // 16:59 CST
          "2026-07-15T17:00:00.000Z", // 12:00 CDT
          "2026-07-15T21:59:00.000Z", // 16:59 CDT
        ],
        berlin: [
          "2026-01-15T11:00:00.000Z", // 12:00 CET
          "2026-01-15T15:59:00.000Z", // 16:59 CET
          "2026-07-15T10:00:00.000Z", // 12:00 CEST
          "2026-07-15T14:59:00.000Z", // 16:59 CEST
        ],
      },
      {
        part: "evening" as const,
        chicago: [
          "2026-01-15T23:00:00.000Z", // 17:00 CST
          "2026-01-16T05:59:00.000Z", // 23:59 CST
          "2026-07-15T22:00:00.000Z", // 17:00 CDT
        ],
        berlin: [
          "2026-01-15T16:00:00.000Z", // 17:00 CET
          "2026-07-15T15:00:00.000Z", // 17:00 CEST
        ],
      },
    ];

    for (const band of bands) {
      for (const iso of band.chicago) {
        const now = Date.parse(iso);
        assert.equal(helgaGreeting("en", now), GREETING.en[band.part], iso);
        assert.equal(helgaGreeting(undefined, now), GREETING.en[band.part], iso);
      }
      for (const iso of band.berlin) {
        assert.equal(helgaGreeting("de", Date.parse(iso)), GREETING.de[band.part], iso);
      }
    }

    assert.equal(helgaGreeting("en", SPLIT_CLOCK), GREETING.en.morning);
    assert.equal(helgaGreeting("de", SPLIT_CLOCK), GREETING.de.evening);
    assert.equal(helgaGreeting(undefined, new Date(SPLIT_CLOCK)), GREETING.en.morning);
  });

  it("sends locale and greeting as authorize session variables", async () => {
    assert.deepEqual(
      helgaAuthorizeBody(undefined, undefined, SPLIT_CLOCK),
      helgaAuthorizeBody("en", undefined, SPLIT_CLOCK),
    );

    const english = helgaAuthorizeBody("en", undefined, SPLIT_CLOCK);
    const german = helgaAuthorizeBody("de", undefined, SPLIT_CLOCK);
    const session = {
      en: { locale: "en" as const, greeting: GREETING.en.morning },
      de: { locale: "de" as const, greeting: GREETING.de.evening },
    };
    assert.deepEqual(english, {
      ...session.en,
      request_data: session.en,
      context: session.en,
    });
    assert.deepEqual(german, {
      ...session.de,
      request_data: session.de,
      context: session.de,
    });
    for (const body of [english, german]) {
      assert.equal("language" in body, false);
      assert.equal("first_sentence" in body, false);
      assert.equal("first_sentence" in body.request_data, false);
      assert.equal("first_sentence" in body.context, false);
      assert.equal("language" in body.request_data, false);
      assert.equal("language" in body.context, false);
      assert.equal(JSON.stringify(body).includes("English"), false);
      assert.equal(JSON.stringify(body).toLowerCase().includes('"language"'), false);
      assert.equal(JSON.stringify(body).includes("first_sentence"), false);
    }

    process.env.BLAND_API_KEY = SERVER_KEY;
    const sent: { url: string; body: unknown }[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      assert.match(url, /^https:\/\/api\.bland\.ai\/v1\/agents\/[0-9a-f-]+\/authorize$/);
      assert.equal(init?.method, "POST");
      const headers = new Headers(init?.headers);
      assert.equal(headers.get("authorization"), SERVER_KEY);
      sent.push({ url, body: JSON.parse(String(init?.body)) });
      return new Response(JSON.stringify({ token: "session-token", secret: SERVER_KEY }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    try {
      const cases = [
        {
          body: "{}",
          ip: "203.0.113.80",
          expected: helgaAuthorizeBody(undefined, undefined, SPLIT_CLOCK),
          agentId: HELGA_AGENT_ID_EN,
        },
        {
          body: JSON.stringify({ locale: "en" }),
          ip: "203.0.113.81",
          expected: helgaAuthorizeBody("en", undefined, SPLIT_CLOCK),
          agentId: HELGA_AGENT_ID_EN,
        },
        {
          body: JSON.stringify({ locale: "de" }),
          ip: "203.0.113.82",
          expected: helgaAuthorizeBody("de", undefined, SPLIT_CLOCK),
          agentId: HELGA_AGENT_ID_DE,
        },
        {
          body: JSON.stringify({ locale: "fr" }),
          ip: "203.0.113.83",
          expected: helgaAuthorizeBody(undefined, undefined, SPLIT_CLOCK),
          agentId: HELGA_AGENT_ID_EN,
        },
      ];
      for (const item of cases) {
        const before = sent.length;
        const response = await handleHelgaAuthorize(
          sameOrigin("https://techtalktobi.com", item.ip, item.body),
          { now: SPLIT_CLOCK },
        );
        assert.equal(response.status, 200);
        const payload = await response.json();
        assert.deepEqual(payload, { token: "session-token", agentId: item.agentId });
        assert.equal(sent.at(-1)?.url, `https://api.bland.ai/v1/agents/${item.agentId}/authorize`);
        assert.equal(JSON.stringify(payload).includes(GREETING.en.morning), false);
        assert.equal(JSON.stringify(payload).includes(GREETING.de.evening), false);
        assert.equal(JSON.stringify(payload).includes(SERVER_KEY), false);
        assert.equal(sent.length, before + 1);
        assert.deepEqual(sent.at(-1)?.body, item.expected);
        assert.equal(JSON.stringify(sent.at(-1)?.body).includes("first_sentence"), false);
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
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
      assert.equal(missing.headers.get("access-control-allow-origin"), "https://techtalktobi.com");
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
      assert.equal(ok.headers.get("access-control-allow-origin"), "https://www.techtalktobi.com");
      const body = await ok.json();
      assert.deepEqual(body, { token: "session-token", agentId: HELGA_AGENT_ID_EN });
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
      assert.equal(failed.headers.get("access-control-allow-origin"), "https://techtalktobi.com");
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
