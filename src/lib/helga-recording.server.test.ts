import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { afterEach, describe, it } from "node:test";
import { handleHelgaPreflight } from "./helga-authorize.server.ts";
import { encodeWav } from "./helga-local-recorder.ts";
import {
  HELGA_RECORDING_ALLOW_HEADERS,
  HELGA_RECORDING_RATE_LIMIT_MAX,
  handleHelgaListen,
  handleHelgaRecording,
  handleHelgaWebhook,
  resetHelgaRecordingRateLimit,
} from "./helga-recording.server.ts";
import {
  blandWebhookSignature,
  extractWebhookJoin,
  matchSinglePendingUpload,
} from "./helga-recording-join.ts";
import {
  createFsRecordingStore,
  createMemoryRecordingStore,
  type HelgaRecordingStore,
} from "./helga-recording-store.server.ts";

const WEBHOOK_SECRET = "test-webhook-secret";
const LISTEN_SECRET = "test-ops-listen-secret";
const UPLOAD_A = "11111111-1111-4111-8111-111111111111";
const UPLOAD_B = "33333333-3333-4333-8333-333333333333";
const CALL_A = "22222222-2222-4222-8222-222222222222";
const CALL_B = "44444444-4444-4444-8444-444444444444";
const FAKE_RECORDING_URL =
  "https://bland-web-recordings.s3.us-west-2.amazonaws.com/not-playable.wav";

function wav(): Uint8Array {
  return encodeWav(new Float32Array([0.2, -0.2, 0.2, -0.2]), 16000);
}

function bodyOf(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

function upload(
  origin: string,
  ip: string,
  id: string,
  bytes: Uint8Array = wav(),
  locale = "de",
): Request {
  const host = new URL(origin).host;
  return new Request(`${origin}/api/helga/recording`, {
    method: "POST",
    headers: {
      origin,
      "x-forwarded-host": host,
      "x-real-ip": ip,
      "sec-fetch-site": "same-origin",
      "content-type": "audio/wav",
      "x-helga-upload-id": id,
      "x-helga-locale": locale,
    },
    body: bodyOf(bytes),
  });
}

function signedBody(payload: unknown, secret = WEBHOOK_SECRET): { raw: string; signature: string } {
  const raw = JSON.stringify(payload);
  const signature = createHmac("sha256", secret).update(raw).digest("hex");
  return { raw, signature };
}

function webhook(payload: unknown, secret = WEBHOOK_SECRET, signature?: string): Request {
  const signed = signedBody(payload, secret);
  return new Request("https://techtalktobi.vercel.app/api/helga/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-webhook-signature": signature ?? signed.signature,
    },
    body: signed.raw,
  });
}

function listen(query: string, secret = LISTEN_SECRET): Request {
  return new Request(`https://techtalktobi.vercel.app/api/helga/listen?${query}`, {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
}

function recordingOptions(store: HelgaRecordingStore | null, now = 1_700_000_000_000) {
  return { store, now };
}

afterEach(() => {
  resetHelgaRecordingRateLimit();
  delete process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.HELGA_RECORDING_DIR;
  delete process.env.BLAND_WEBHOOK_SECRET;
  delete process.env.HELGA_OPS_LISTEN_SECRET;
});

describe("helga recording join", () => {
  it("matches node hmac and ignores bland recording_url", async () => {
    const raw = JSON.stringify({ call_id: CALL_A, recording_url: FAKE_RECORDING_URL });
    const expected = createHmac("sha256", WEBHOOK_SECRET).update(raw).digest("hex");
    assert.equal(await blandWebhookSignature(WEBHOOK_SECRET, raw), expected);

    const joined = extractWebhookJoin({
      call_id: CALL_A,
      recording_url: { client_upload_id: UPLOAD_A, url: FAKE_RECORDING_URL },
      variables: { locale: "de", client_upload_id: UPLOAD_B },
    });
    assert.deepEqual(joined, { callId: CALL_A, clientUploadId: UPLOAD_B, locale: "de" });
    assert.equal(JSON.stringify(joined).includes("recording_url"), false);
    assert.equal(JSON.stringify(joined).includes(FAKE_RECORDING_URL), false);

    const ambiguous = matchSinglePendingUpload(
      [
        {
          clientUploadId: UPLOAD_A,
          callId: null,
          locale: "de",
          contentType: "audio/wav",
          byteLength: 1,
          createdAt: new Date(0).toISOString(),
        },
        {
          clientUploadId: UPLOAD_B,
          callId: null,
          locale: "de",
          contentType: "audio/wav",
          byteLength: 1,
          createdAt: new Date(0).toISOString(),
        },
      ],
      { locale: "de", atMs: 0 },
    );
    assert.equal(ambiguous, null);
  });

  it("allows the authorize origins, rate-limits, and rejects other hosts", async () => {
    const store = createMemoryRecordingStore();
    const now = 1_700_000_000_000;
    for (let i = 0; i < HELGA_RECORDING_RATE_LIMIT_MAX; i += 1) {
      const id = `55555555-5555-4555-8555-${String(i).padStart(12, "0")}`;
      const response = await handleHelgaRecording(
        upload("https://techtalktobi.com", "203.0.113.10", id),
        { store, now },
      );
      assert.equal(response.status, 200, String(i));
      const body = await response.json();
      assert.equal(body.joined, false);
      assert.equal(JSON.stringify(body).includes("http"), false);
    }
    const blocked = await handleHelgaRecording(
      upload("https://techtalktobi.com", "203.0.113.10", UPLOAD_A),
      { store, now: now + 1 },
    );
    assert.equal(blocked.status, 429);
    assert.equal(blocked.headers.get("retry-after"), "600");

    const cross = await handleHelgaRecording(
      new Request("https://techtalktobi.com/api/helga/recording", {
        method: "POST",
        headers: {
          origin: "https://evil.example",
          "x-forwarded-host": "techtalktobi.com",
          "x-real-ip": "203.0.113.11",
          "sec-fetch-site": "cross-site",
          "content-type": "audio/wav",
          "x-helga-upload-id": UPLOAD_A,
        },
        body: bodyOf(wav()),
      }),
      recordingOptions(store),
    );
    assert.equal(cross.status, 403);
    assert.equal(cross.headers.get("access-control-allow-origin"), null);
    assert.equal(await store.getByUploadId(UPLOAD_A), null);

    const pages = await handleHelgaRecording(
      new Request("https://techtalktobi.vercel.app/api/helga/recording", {
        method: "POST",
        headers: {
          origin: "https://www.techtalktobi.com",
          "x-forwarded-host": "techtalktobi.vercel.app",
          "x-real-ip": "203.0.113.12",
          "sec-fetch-site": "cross-site",
          "content-type": "audio/wav",
          "x-helga-upload-id": UPLOAD_B,
          "x-helga-locale": "en",
        },
        body: bodyOf(wav()),
      }),
      recordingOptions(store),
    );
    assert.equal(pages.status, 200);
    assert.equal(pages.headers.get("access-control-allow-origin"), "https://www.techtalktobi.com");
    assert.notEqual(pages.headers.get("access-control-allow-origin"), "*");

    const missing = await handleHelgaRecording(
      upload("https://techtalktobi.com", "203.0.113.13", UPLOAD_A),
      { store: null },
    );
    assert.equal(missing.status, 503);

    const preflight = await handleHelgaPreflight(
      new Request("https://techtalktobi.vercel.app/api/helga/recording", {
        method: "OPTIONS",
        headers: {
          origin: "https://techtalktobi.com",
          "x-forwarded-host": "techtalktobi.vercel.app",
          "sec-fetch-site": "cross-site",
        },
      }),
      { allowHeaders: HELGA_RECORDING_ALLOW_HEADERS },
    );
    assert.equal(preflight.status, 204);
    assert.equal(
      preflight.headers.get("access-control-allow-headers"),
      HELGA_RECORDING_ALLOW_HEADERS,
    );
  });

  it("joins upload and webhook in either order and plays only with the ops secret", async () => {
    const store = createMemoryRecordingStore();
    const now = 1_700_000_000_000;
    const audio = wav();
    const posted = await handleHelgaRecording(
      upload("https://techtalktobi.com", "203.0.113.20", UPLOAD_A, audio, "de"),
      { store, now },
    );
    assert.equal(posted.status, 200);
    assert.deepEqual(await posted.json(), { client_upload_id: UPLOAD_A, joined: false });

    const payload = {
      call_id: CALL_A,
      c_id: CALL_A,
      record: true,
      recording_url: FAKE_RECORDING_URL,
      variables: { client_upload_id: UPLOAD_A, locale: "de", greeting: "hello" },
    };
    const joined = await handleHelgaWebhook(webhook(payload), {
      store,
      secret: WEBHOOK_SECRET,
      now: now + 5_000,
    });
    assert.equal(joined.status, 200);
    const joinedBody = await joined.json();
    assert.deepEqual(joinedBody, { ok: true, joined: true });
    assert.equal(JSON.stringify(joinedBody).includes("recording_url"), false);
    assert.equal(JSON.stringify(joinedBody).includes(FAKE_RECORDING_URL), false);

    const again = await handleHelgaWebhook(webhook(payload), {
      store,
      secret: WEBHOOK_SECRET,
      now: now + 6_000,
    });
    assert.deepEqual(await again.json(), { ok: true, joined: true });

    const hidden = await handleHelgaListen(listen(`call_id=${CALL_A}`, ""), {
      store,
      secret: LISTEN_SECRET,
    });
    assert.equal(hidden.status, 401);
    const wrong = await handleHelgaListen(listen(`call_id=${CALL_A}`, "nope"), {
      store,
      secret: LISTEN_SECRET,
    });
    assert.equal(wrong.status, 401);
    const unconfigured = await handleHelgaListen(listen(`call_id=${CALL_A}`), {
      store,
      secret: null,
    });
    assert.equal(unconfigured.status, 503);

    const played = await handleHelgaListen(listen(`call_id=${CALL_A}`), {
      store,
      secret: LISTEN_SECRET,
    });
    assert.equal(played.status, 200);
    assert.equal(played.headers.get("content-type"), "audio/wav");
    assert.equal(played.headers.get("cache-control"), "private, no-store");
    assert.equal(played.headers.get("access-control-allow-origin"), null);
    assert.equal(played.headers.get("x-helga-call-id"), CALL_A);
    const bytes = new Uint8Array(await played.arrayBuffer());
    assert.deepEqual(bytes, audio);
    assert.equal(Buffer.from(bytes).includes(FAKE_RECORDING_URL), false);

    const saved = await store.getByUploadId(UPLOAD_A);
    assert.equal(JSON.stringify(saved?.meta).includes("recording_url"), false);
    assert.equal(JSON.stringify(saved?.meta).includes("http"), false);
  });

  it("keeps a webhook that arrives before the upload and falls back to one pending clip", async () => {
    const store = createMemoryRecordingStore();
    const now = 1_700_000_000_000;
    const early = await handleHelgaWebhook(
      webhook({
        call_id: CALL_A,
        variables: { client_upload_id: UPLOAD_A, locale: "en" },
        recording_url: null,
      }),
      { store, secret: WEBHOOK_SECRET, now },
    );
    assert.deepEqual(await early.json(), { ok: true, joined: false });

    const late = await handleHelgaRecording(
      upload("http://localhost:8080", "203.0.113.30", UPLOAD_A, wav(), "en"),
      { store, now: now + 1_000 },
    );
    assert.deepEqual(await late.json(), { client_upload_id: UPLOAD_A, joined: true });

    const badSig = await handleHelgaWebhook(
      webhook(
        { call_id: CALL_B, variables: { client_upload_id: UPLOAD_B } },
        WEBHOOK_SECRET,
        "deadbeef",
      ),
      { store, secret: WEBHOOK_SECRET, now },
    );
    assert.equal(badSig.status, 401);

    const noSecret = await handleHelgaWebhook(webhook({ call_id: CALL_B }), {
      store,
      secret: null,
    });
    assert.equal(noSecret.status, 503);

    const left = "77777777-7777-4777-8777-777777777777";
    const right = "88888888-8888-4888-8888-888888888888";
    await handleHelgaRecording(
      upload("https://techtalktobi.com", "203.0.113.31", left, wav(), "de"),
      {
        store,
        now,
      },
    );
    await handleHelgaRecording(
      upload("https://techtalktobi.com", "203.0.113.32", right, wav(), "de"),
      {
        store,
        now,
      },
    );
    const fuzzy = await handleHelgaWebhook(
      webhook({ call_id: CALL_B, variables: { locale: "de" }, recording_url: FAKE_RECORDING_URL }),
      { store, secret: WEBHOOK_SECRET, now: now + 2_000 },
    );
    assert.deepEqual(await fuzzy.json(), { ok: true, joined: false });
    const missing = await handleHelgaListen(listen(`call_id=${CALL_B}`), {
      store,
      secret: LISTEN_SECRET,
    });
    assert.equal(missing.status, 404);

    const only = createMemoryRecordingStore();
    await handleHelgaRecording(
      upload("https://www.techtalktobi.com", "203.0.113.33", UPLOAD_B, wav(), "de"),
      {
        store: only,
        now,
      },
    );
    const one = await handleHelgaWebhook(
      webhook({ call_id: CALL_B, variables: { locale: "de" } }),
      { store: only, secret: WEBHOOK_SECRET, now: now + 2_000 },
    );
    assert.deepEqual(await one.json(), { ok: true, joined: true });
    const byUpload = await handleHelgaListen(listen(`client_upload_id=${UPLOAD_B}`), {
      store: only,
      secret: LISTEN_SECRET,
    });
    assert.equal(byUpload.status, 200);
    assert.equal(byUpload.headers.get("x-helga-call-id"), CALL_B);
  });

  it("rejects bad uploads and round-trips the filesystem store", async () => {
    const store = createMemoryRecordingStore();
    const type = await handleHelgaRecording(
      new Request("https://techtalktobi.com/api/helga/recording", {
        method: "POST",
        headers: {
          origin: "https://techtalktobi.com",
          "x-forwarded-host": "techtalktobi.com",
          "x-real-ip": "203.0.113.40",
          "sec-fetch-site": "same-origin",
          "content-type": "text/plain",
          "x-helga-upload-id": UPLOAD_A,
        },
        body: "hello",
      }),
      recordingOptions(store),
    );
    assert.equal(type.status, 415);

    const empty = await handleHelgaRecording(
      upload("https://techtalktobi.com", "203.0.113.41", UPLOAD_A, new Uint8Array([1, 2, 3])),
      recordingOptions(store),
    );
    assert.equal(empty.status, 400);

    const dir = await mkdtemp(`${tmpdir()}/helga-rec-`);
    try {
      const files = createFsRecordingStore(dir);
      const saved = await files.putRecording({
        clientUploadId: UPLOAD_A,
        locale: "en",
        contentType: "audio/wav",
        bytes: wav(),
        now: 1_700_000_000_000,
      });
      assert.equal(saved.meta.callId, null);
      const linked = await files.attachCall({
        callId: CALL_A,
        clientUploadId: UPLOAD_A,
        locale: "en",
        now: 1_700_000_001_000,
      });
      assert.equal(linked.joined, true);
      const found = await files.getByCallId(CALL_A);
      assert.equal(found?.meta.clientUploadId, UPLOAD_A);
      assert.ok(found && found.bytes.byteLength > 44);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
