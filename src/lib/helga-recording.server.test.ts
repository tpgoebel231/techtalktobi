import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { afterEach, describe, it } from "node:test";
import { handleHelgaPreflight } from "./helga-authorize.server.ts";
import { encodeWav } from "./helga-local-recorder.ts";
import {
  HELGA_LISTEN_LINK_TTL_MAX_SECONDS,
  HELGA_LISTEN_LINK_TTL_MIN_SECONDS,
  HELGA_RECORDING_ALLOW_HEADERS,
  HELGA_RECORDING_RATE_LIMIT_MAX,
  handleHelgaListen,
  handleHelgaListenLink,
  handleHelgaRecording,
  handleHelgaWebhook,
  resetHelgaRecordingRateLimit,
} from "./helga-recording.server.ts";
import {
  HELGA_JOIN_WINDOW_MS,
  blandWebhookSignature,
  extractWebhookJoin,
  helgaListenCanonical,
  matchSinglePendingUpload,
} from "./helga-recording-join.ts";
import {
  createFsRecordingStore,
  createHelgaRecordingStore,
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

function listenLink(
  body: unknown,
  secret: string | null = LISTEN_SECRET,
  origin = "https://techtalktobi.vercel.app",
): Request {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (secret) headers.authorization = `Bearer ${secret}`;
  return new Request(`${origin}/api/helga/listen-link`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

const NOW_MS = 1_700_000_000_000;
const NOW_SEC = 1_700_000_000;

async function storeJoinedClip(store: HelgaRecordingStore): Promise<Uint8Array> {
  const audio = wav();
  await store.putRecording({
    clientUploadId: UPLOAD_A,
    locale: "de",
    contentType: "audio/wav",
    bytes: audio,
    now: NOW_MS,
  });
  await store.attachCall({
    callId: CALL_A,
    clientUploadId: UPLOAD_A,
    locale: "de",
    now: NOW_MS + 1_000,
  });
  return audio;
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

function gate(): { promise: Promise<void>; open: () => void } {
  let open: () => void = () => {};
  const promise = new Promise<void>((resolve) => {
    open = () => resolve();
  });
  return { promise, open };
}

function memoryKv(afterPut?: (key: string, bytes: Uint8Array) => Promise<void> | void) {
  const objects = new Map<string, Uint8Array>();
  const store = createHelgaRecordingStore({
    async getBytes(key) {
      const found = objects.get(key);
      return found ? new Uint8Array(found) : null;
    },
    async putBytes(key, bytes) {
      const copy = new Uint8Array(bytes);
      objects.set(key, copy);
      await afterPut?.(key, copy);
    },
    async delete(key) {
      objects.delete(key);
    },
    async listKeys(prefix) {
      return [...objects.keys()].filter((key) => key.startsWith(prefix));
    },
  });
  return { objects, store };
}

function plantPending(objects: Map<string, Uint8Array>, uploadId: string, callId: string) {
  objects.set(
    `pending/${uploadId}.json`,
    new TextEncoder().encode(
      JSON.stringify({
        callId,
        locale: "de",
        receivedAt: new Date(NOW_MS).toISOString(),
      }),
    ),
  );
}

describe("helga dual-capture join race", () => {
  const clip = {
    locale: "de" as const,
    contentType: "audio/wav",
    bytes: wav(),
    now: NOW_MS,
  };

  it("joins when the webhook parks a pending call before the upload", async () => {
    const store = createMemoryRecordingStore();
    const parked = await store.attachCall({
      callId: CALL_A,
      clientUploadId: UPLOAD_A,
      locale: "de",
      now: NOW_MS,
    });
    assert.deepEqual(parked, { joined: false, clientUploadId: UPLOAD_A });

    const saved = await store.putRecording({ clientUploadId: UPLOAD_A, ...clip });
    assert.equal(saved.alreadyExisted, false);
    assert.equal(saved.meta.callId, CALL_A);
    const found = await store.getByCallId(CALL_A);
    assert.equal(found?.meta.clientUploadId, UPLOAD_A);
    assert.equal(found?.meta.callId, CALL_A);
    assert.deepEqual(found?.bytes, clip.bytes);
  });

  it("joins when the upload lands before the webhook that carries the upload id", async () => {
    const store = createMemoryRecordingStore();
    const saved = await store.putRecording({ clientUploadId: UPLOAD_A, ...clip });
    assert.equal(saved.meta.callId, null);

    const linked = await store.attachCall({
      callId: CALL_A,
      clientUploadId: UPLOAD_A,
      locale: "de",
      now: NOW_MS + 1_000,
    });
    assert.deepEqual(linked, { joined: true, clientUploadId: UPLOAD_A });
    const found = await store.getByCallId(CALL_A);
    assert.equal(found?.meta.callId, CALL_A);
    assert.equal(found?.meta.locale, "de");
  });

  it("links the call when pending is written after putRecording chose a null callId", async () => {
    const audioReady = gate();
    const resumeUpload = gate();
    let heldAudio = false;
    let wroteNullCallId = false;
    const { objects, store } = memoryKv(async (key, bytes) => {
      if (key === `meta/${UPLOAD_A}.json`) {
        const meta = JSON.parse(new TextDecoder().decode(bytes)) as { callId: string | null };
        if (meta.callId == null) wroteNullCallId = true;
      }
      if (!heldAudio && key === `audio/${UPLOAD_A}`) {
        heldAudio = true;
        audioReady.open();
        await resumeUpload.promise;
      }
    });

    const saving = store.putRecording({ clientUploadId: UPLOAD_A, ...clip });
    await audioReady.promise;
    const parked = await store.attachCall({
      callId: CALL_A,
      clientUploadId: UPLOAD_A,
      locale: "de",
      now: NOW_MS,
    });
    assert.deepEqual(parked, { joined: false, clientUploadId: UPLOAD_A });
    assert.equal(objects.has(`pending/${UPLOAD_A}.json`), true);
    assert.equal(objects.has(`meta/${UPLOAD_A}.json`), false);

    resumeUpload.open();
    const saved = await saving;
    assert.equal(wroteNullCallId, true);
    assert.equal(saved.alreadyExisted, false);
    assert.equal(saved.meta.callId, CALL_A);
    assert.equal(objects.has(`pending/${UPLOAD_A}.json`), false);
    const found = await store.getByCallId(CALL_A);
    assert.equal(found?.meta.clientUploadId, UPLOAD_A);
    assert.equal(found?.meta.callId, CALL_A);
    assert.deepEqual(found?.bytes, clip.bytes);
  });

  it("joins on an idempotent upload retry when pending arrived after the first save", async () => {
    const { objects, store } = memoryKv();
    const first = await store.putRecording({ clientUploadId: UPLOAD_A, ...clip });
    assert.equal(first.alreadyExisted, false);
    assert.equal(first.meta.callId, null);
    plantPending(objects, UPLOAD_A, CALL_A);

    const retry = await store.putRecording({
      clientUploadId: UPLOAD_A,
      ...clip,
      bytes: new Uint8Array(clip.bytes.byteLength + 8),
    });
    assert.equal(retry.alreadyExisted, true);
    assert.equal(retry.meta.callId, CALL_A);
    assert.equal(retry.meta.byteLength, clip.bytes.byteLength);
    assert.equal(objects.has(`pending/${UPLOAD_A}.json`), false);
    const found = await store.getByCallId(CALL_A);
    assert.equal(found?.meta.clientUploadId, UPLOAD_A);
    assert.deepEqual(found?.bytes, clip.bytes);
  });

  it("joins when meta appears after attachCall has written pending", async () => {
    const pendingReady = gate();
    const resumeAttach = gate();
    let heldPending = false;
    const audio = wav();
    const { objects, store } = memoryKv(async (key) => {
      if (!heldPending && key === `pending/${UPLOAD_A}.json`) {
        heldPending = true;
        pendingReady.open();
        await resumeAttach.promise;
      }
    });

    const attaching = store.attachCall({
      callId: CALL_A,
      clientUploadId: UPLOAD_A,
      locale: "de",
      now: NOW_MS,
    });
    await pendingReady.promise;
    objects.set(`audio/${UPLOAD_A}`, audio);
    objects.set(
      `meta/${UPLOAD_A}.json`,
      new TextEncoder().encode(
        JSON.stringify({
          clientUploadId: UPLOAD_A,
          callId: null,
          locale: "de",
          contentType: "audio/wav",
          byteLength: audio.byteLength,
          createdAt: new Date(NOW_MS).toISOString(),
        }),
      ),
    );
    resumeAttach.open();

    const result = await attaching;
    assert.deepEqual(result, { joined: true, clientUploadId: UPLOAD_A });
    assert.equal(objects.has(`pending/${UPLOAD_A}.json`), false);
    const found = await store.getByCallId(CALL_A);
    assert.equal(found?.meta.callId, CALL_A);
    assert.equal(found?.meta.clientUploadId, UPLOAD_A);
    assert.deepEqual(found?.bytes, audio);
  });

  it("still joins one orphan webhook inside the window and ignores one outside it", async () => {
    const store = createMemoryRecordingStore();
    const early = await store.attachCall({
      callId: CALL_A,
      clientUploadId: null,
      locale: "de",
      now: NOW_MS,
    });
    assert.deepEqual(early, { joined: false, clientUploadId: null });
    const saved = await store.putRecording({
      clientUploadId: UPLOAD_A,
      ...clip,
      now: NOW_MS + 1_000,
    });
    assert.equal(saved.meta.callId, CALL_A);
    assert.equal((await store.getByCallId(CALL_A))?.meta.clientUploadId, UPLOAD_A);

    const stale = createMemoryRecordingStore();
    await stale.attachCall({
      callId: CALL_B,
      clientUploadId: null,
      locale: "de",
      now: NOW_MS,
    });
    const late = await stale.putRecording({
      clientUploadId: UPLOAD_B,
      ...clip,
      now: NOW_MS + HELGA_JOIN_WINDOW_MS + 1,
    });
    assert.equal(late.meta.callId, null);
    assert.equal(await stale.getByCallId(CALL_B), null);
  });
});

describe("helga listen links", () => {
  it("mints a permanent vercel URL and plays it without a bearer", async () => {
    const store = createMemoryRecordingStore();
    const audio = await storeJoinedClip(store);
    const minted = await handleHelgaListenLink(listenLink({ call_id: CALL_A.toUpperCase() }), {
      store,
      secret: LISTEN_SECRET,
      now: NOW_MS,
    });
    assert.equal(minted.status, 200);
    assert.equal(minted.headers.get("cache-control"), "no-store");
    const body = await minted.json();
    assert.equal(body.expires_in_seconds, null);
    assert.equal(body.expires_at, null);
    assert.deepEqual(Object.keys(body).sort(), ["expires_at", "expires_in_seconds", "url"]);
    assert.equal(typeof body.url, "string");
    const parsed = new URL(body.url);
    assert.equal(parsed.origin, "https://techtalktobi.vercel.app");
    assert.equal(parsed.pathname, "/api/helga/listen");
    assert.equal(parsed.searchParams.get("call_id"), CALL_A);
    assert.equal(parsed.searchParams.has("exp"), false);
    const sig = parsed.searchParams.get("sig") ?? "";
    assert.equal(
      sig,
      createHmac("sha256", LISTEN_SECRET)
        .update(helgaListenCanonical("call_id", CALL_A, "permanent"))
        .digest("hex"),
    );
    assert.equal(
      helgaListenCanonical("call_id", CALL_A, "permanent"),
      `v1\ncall_id\n${CALL_A}\npermanent`,
    );
    assert.equal(JSON.stringify(body).includes(LISTEN_SECRET), false);
    assert.equal(JSON.stringify(body).includes("blob"), false);
    assert.equal(body.url.includes("techtalktobi.com"), false);

    const played = await handleHelgaListen(new Request(body.url), {
      store,
      secret: LISTEN_SECRET,
      now: NOW_MS,
    });
    assert.equal(played.status, 200);
    assert.equal(played.headers.get("content-type"), "audio/wav");
    assert.equal(played.headers.get("x-helga-call-id"), CALL_A);
    assert.deepEqual(new Uint8Array(await played.arrayBuffer()), audio);

    const yearsLater = await handleHelgaListen(new Request(body.url), {
      store,
      secret: LISTEN_SECRET,
      now: NOW_MS + 10 * 365 * 24 * 60 * 60 * 1000,
    });
    assert.equal(yearsLater.status, 200);

    const explicitNull = await handleHelgaListenLink(
      listenLink({ call_id: CALL_A, ttl_seconds: null }),
      { store, secret: LISTEN_SECRET, now: NOW_MS },
    );
    const nullBody = await explicitNull.json();
    assert.equal(explicitNull.status, 200);
    assert.equal(nullBody.expires_at, null);
    assert.equal(new URL(nullBody.url).searchParams.has("exp"), false);

    const bearer = await handleHelgaListen(listen(`call_id=${CALL_A}`), {
      store,
      secret: LISTEN_SECRET,
      now: NOW_MS,
    });
    assert.equal(bearer.status, 200);
    assert.deepEqual(new Uint8Array(await bearer.arrayBuffer()), audio);
  });

  it("rejects a forged permanent signature", async () => {
    const store = createMemoryRecordingStore();
    await storeJoinedClip(store);
    const minted = await handleHelgaListenLink(listenLink({ call_id: CALL_A }), {
      store,
      secret: LISTEN_SECRET,
      now: NOW_MS,
    });
    const url = new URL((await minted.json()).url);

    const forged = new URL(url);
    const sig = forged.searchParams.get("sig") ?? "";
    forged.searchParams.set("sig", sig.slice(0, -1) + (sig.endsWith("0") ? "1" : "0"));
    assert.equal(
      (
        await handleHelgaListen(new Request(forged), {
          store,
          secret: LISTEN_SECRET,
          now: NOW_MS,
        })
      ).status,
      401,
    );

    const swapped = new URL(url);
    swapped.searchParams.set("call_id", CALL_B);
    assert.equal(
      (
        await handleHelgaListen(new Request(swapped), {
          store,
          secret: LISTEN_SECRET,
          now: NOW_MS,
        })
      ).status,
      401,
    );

    const withExp = new URL(url);
    withExp.searchParams.set("exp", String(NOW_SEC + 3600));
    assert.equal(
      (
        await handleHelgaListen(new Request(withExp), {
          store,
          secret: LISTEN_SECRET,
          now: NOW_MS,
        })
      ).status,
      401,
    );
  });

  it("still plays legacy exp and sig links and optional ttl links", async () => {
    const store = createMemoryRecordingStore();
    const audio = await storeJoinedClip(store);
    const exp = NOW_SEC + 3600;
    const legacy = new URL("https://techtalktobi.vercel.app/api/helga/listen");
    legacy.searchParams.set("call_id", CALL_A);
    legacy.searchParams.set("exp", String(exp));
    legacy.searchParams.set(
      "sig",
      createHmac("sha256", LISTEN_SECRET).update(`v1\ncall_id\n${CALL_A}\n${exp}`).digest("hex"),
    );
    assert.equal(helgaListenCanonical("call_id", CALL_A, exp), `v1\ncall_id\n${CALL_A}\n${exp}`);

    const played = await handleHelgaListen(new Request(legacy), {
      store,
      secret: LISTEN_SECRET,
      now: NOW_MS,
    });
    assert.equal(played.status, 200);
    assert.deepEqual(new Uint8Array(await played.arrayBuffer()), audio);

    const atExpiry = await handleHelgaListen(new Request(legacy), {
      store,
      secret: LISTEN_SECRET,
      now: exp * 1000,
    });
    assert.equal(atExpiry.status, 200);

    const expired = await handleHelgaListen(new Request(legacy), {
      store,
      secret: LISTEN_SECRET,
      now: (exp + 1) * 1000,
    });
    assert.equal(expired.status, 401);

    const forged = new URL(legacy);
    const sig = forged.searchParams.get("sig") ?? "";
    forged.searchParams.set("sig", sig.slice(0, -1) + (sig.endsWith("0") ? "1" : "0"));
    assert.equal(
      (
        await handleHelgaListen(new Request(forged), {
          store,
          secret: LISTEN_SECRET,
          now: NOW_MS,
        })
      ).status,
      401,
    );

    const bumped = new URL(legacy);
    bumped.searchParams.set("exp", String(exp + 86_400));
    assert.equal(
      (
        await handleHelgaListen(new Request(bumped), {
          store,
          secret: LISTEN_SECRET,
          now: NOW_MS,
        })
      ).status,
      401,
    );

    const missingExp = new URL(legacy);
    missingExp.searchParams.delete("exp");
    assert.equal(
      (
        await handleHelgaListen(new Request(missingExp), {
          store,
          secret: LISTEN_SECRET,
          now: NOW_MS,
        })
      ).status,
      401,
    );

    const nonsense = new URL(legacy);
    nonsense.searchParams.set("exp", "soon");
    assert.equal(
      (
        await handleHelgaListen(new Request(nonsense), {
          store,
          secret: LISTEN_SECRET,
          now: NOW_MS,
        })
      ).status,
      401,
    );

    const bearerDespiteExpiry = await handleHelgaListen(
      new Request(legacy, { headers: { authorization: `Bearer ${LISTEN_SECRET}` } }),
      { store, secret: LISTEN_SECRET, now: (exp + 5) * 1000 },
    );
    assert.equal(bearerDespiteExpiry.status, 200);

    const minted = await handleHelgaListenLink(listenLink({ call_id: CALL_A, ttl_seconds: 3600 }), {
      store,
      secret: LISTEN_SECRET,
      now: NOW_MS,
    });
    assert.equal(minted.status, 200);
    const body = await minted.json();
    assert.equal(body.expires_in_seconds, 3600);
    assert.equal(body.expires_at, new Date(exp * 1000).toISOString());
    const mintedUrl = new URL(body.url);
    assert.equal(mintedUrl.searchParams.get("exp"), String(exp));
    assert.equal(mintedUrl.searchParams.get("call_id"), CALL_A);
    const optional = await handleHelgaListen(new Request(body.url), {
      store,
      secret: LISTEN_SECRET,
      now: NOW_MS,
    });
    assert.equal(optional.status, 200);
    assert.deepEqual(new Uint8Array(await optional.arrayBuffer()), audio);
  });

  it("404s when the recording is missing and keeps mint ops-only", async () => {
    const store = createMemoryRecordingStore();
    const missing = await handleHelgaListenLink(listenLink({ call_id: CALL_B }), {
      store,
      secret: LISTEN_SECRET,
      now: NOW_MS,
    });
    assert.equal(missing.status, 404);
    assert.deepEqual(await missing.json(), { error: "not_found" });

    await store.putRecording({
      clientUploadId: UPLOAD_B,
      locale: "en",
      contentType: "audio/wav",
      bytes: wav(),
      now: NOW_MS,
    });
    const unjoined = await handleHelgaListenLink(listenLink({ call_id: CALL_B }), {
      store,
      secret: LISTEN_SECRET,
      now: NOW_MS,
    });
    assert.equal(unjoined.status, 404);

    const byUpload = await handleHelgaListenLink(
      listenLink({ client_upload_id: UPLOAD_B }, LISTEN_SECRET, "https://techtalktobi.com"),
      { store, secret: LISTEN_SECRET, now: NOW_MS },
    );
    assert.equal(byUpload.status, 200);
    const uploadBody = await byUpload.json();
    const uploadUrl = new URL(uploadBody.url);
    assert.equal(uploadUrl.origin, "https://techtalktobi.vercel.app");
    assert.equal(uploadUrl.searchParams.get("client_upload_id"), UPLOAD_B);
    assert.equal(uploadUrl.searchParams.get("call_id"), null);
    assert.equal(uploadUrl.searchParams.has("exp"), false);
    assert.equal(uploadBody.expires_at, null);
    assert.equal(uploadBody.expires_in_seconds, null);
    const played = await handleHelgaListen(new Request(uploadBody.url), {
      store,
      secret: LISTEN_SECRET,
      now: NOW_MS,
    });
    assert.equal(played.status, 200);
    assert.equal(played.headers.get("x-helga-call-id"), null);

    const preview = await handleHelgaListenLink(
      listenLink(
        { client_upload_id: UPLOAD_B },
        LISTEN_SECRET,
        "https://techtalktobi-preview.vercel.app",
      ),
      { store, secret: LISTEN_SECRET, now: NOW_MS },
    );
    assert.equal(new URL((await preview.json()).url).origin, "https://techtalktobi.vercel.app");

    const noBearer = await handleHelgaListenLink(listenLink({ call_id: CALL_A }, null), {
      store,
      secret: LISTEN_SECRET,
    });
    assert.equal(noBearer.status, 401);
    const wrong = await handleHelgaListenLink(listenLink({ call_id: CALL_A }, "nope"), {
      store,
      secret: LISTEN_SECRET,
    });
    assert.equal(wrong.status, 401);
    const noSecret = await handleHelgaListenLink(listenLink({ call_id: CALL_A }), {
      store,
      secret: null,
    });
    assert.equal(noSecret.status, 503);
    const noBlob = await handleHelgaListenLink(listenLink({ call_id: CALL_A }), {
      store: null,
      secret: LISTEN_SECRET,
    });
    assert.equal(noBlob.status, 503);

    const both = await handleHelgaListenLink(
      listenLink({ call_id: CALL_A, client_upload_id: UPLOAD_A }),
      { store, secret: LISTEN_SECRET },
    );
    assert.equal(both.status, 400);
    const neither = await handleHelgaListenLink(listenLink({}), { store, secret: LISTEN_SECRET });
    assert.equal(neither.status, 400);

    const joined = createMemoryRecordingStore();
    await storeJoinedClip(joined);
    const badTtl = await handleHelgaListenLink(
      listenLink({ call_id: CALL_A, ttl_seconds: "3600" }),
      { store: joined, secret: LISTEN_SECRET, now: NOW_MS },
    );
    assert.equal(badTtl.status, 400);
    assert.deepEqual(await badTtl.json(), { error: "invalid_ttl" });

    const clamped = await handleHelgaListenLink(listenLink({ call_id: CALL_A, ttl_seconds: 10 }), {
      store: joined,
      secret: LISTEN_SECRET,
      now: NOW_MS,
    });
    const clampedBody = await clamped.json();
    assert.equal(clampedBody.expires_in_seconds, HELGA_LISTEN_LINK_TTL_MIN_SECONDS);
    assert.equal(
      new URL(clampedBody.url).searchParams.get("exp"),
      String(NOW_SEC + HELGA_LISTEN_LINK_TTL_MIN_SECONDS),
    );
    assert.equal(
      (
        await handleHelgaListen(new Request(clampedBody.url), {
          store: joined,
          secret: LISTEN_SECRET,
          now: NOW_MS,
        })
      ).status,
      200,
    );
    const long = await handleHelgaListenLink(
      listenLink({ call_id: CALL_A, ttl_seconds: 999_999 }),
      { store: joined, secret: LISTEN_SECRET, now: NOW_MS },
    );
    const longBody = await long.json();
    assert.equal(longBody.expires_in_seconds, HELGA_LISTEN_LINK_TTL_MAX_SECONDS);
    assert.equal(
      new URL(longBody.url).searchParams.get("exp"),
      String(NOW_SEC + HELGA_LISTEN_LINK_TTL_MAX_SECONDS),
    );

    const ridden = new URL(uploadBody.url);
    ridden.searchParams.set("call_id", CALL_A);
    const hijack = await handleHelgaListen(new Request(ridden), {
      store: joined,
      secret: LISTEN_SECRET,
      now: NOW_MS,
    });
    assert.equal(hijack.status, 401);
  });
});
