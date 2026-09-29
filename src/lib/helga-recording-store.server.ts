/**
 * Private Helga audio. Bytes stay behind this API.
 *
 * Production uses Vercel Blob with `access: "private"` when
 * `BLOB_READ_WRITE_TOKEN` is set. The browser never receives the blob URL.
 * Local smoke can set `HELGA_RECORDING_DIR` (not a public web root).
 * Neither env → callers get `not_configured`.
 */

import { isHelgaUuid } from "./helga.ts";
import {
  HELGA_JOIN_WINDOW_MS,
  matchSingleOrphanCall,
  matchSinglePendingUpload,
  type HelgaRecordingMeta,
  type OrphanCall,
} from "./helga-recording-join.ts";

export type { HelgaRecordingMeta };

export type PutRecordingInput = {
  clientUploadId: string;
  locale: "en" | "de" | null;
  contentType: string;
  bytes: Uint8Array;
  now: number;
};

export type AttachCallInput = {
  callId: string;
  clientUploadId: string | null;
  locale: "en" | "de" | null;
  now: number;
};

export type AttachCallResult = {
  joined: boolean;
  clientUploadId: string | null;
};

export interface HelgaRecordingStore {
  putRecording(
    input: PutRecordingInput,
  ): Promise<{ meta: HelgaRecordingMeta; alreadyExisted: boolean }>;
  getByUploadId(
    clientUploadId: string,
  ): Promise<{ meta: HelgaRecordingMeta; bytes: Uint8Array } | null>;
  getByCallId(callId: string): Promise<{ meta: HelgaRecordingMeta; bytes: Uint8Array } | null>;
  attachCall(input: AttachCallInput): Promise<AttachCallResult>;
}

type RecordingKv = {
  getBytes(key: string): Promise<Uint8Array | null>;
  putBytes(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
  listKeys(prefix: string): Promise<string[]>;
};

const audioKey = (id: string) => `audio/${id}`;
const metaKey = (id: string) => `meta/${id}.json`;
const callKey = (id: string) => `call/${id}.json`;
const pendingKey = (id: string) => `pending/${id}.json`;
const orphanKey = (id: string) => `orphan/${id}.json`;

function encodeJson(value: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(value));
}

function decodeJson(bytes: Uint8Array): unknown {
  return JSON.parse(new TextDecoder().decode(bytes));
}

function requireUuid(value: string): string {
  const id = value.trim().toLowerCase();
  if (!isHelgaUuid(id)) throw new Error("invalid recording id");
  return id;
}

function parseMeta(bytes: Uint8Array): HelgaRecordingMeta | null {
  try {
    const record = decodeJson(bytes);
    if (!record || typeof record !== "object") return null;
    const body = record as Record<string, unknown>;
    if (typeof body.clientUploadId !== "string" || !isHelgaUuid(body.clientUploadId)) return null;
    if (typeof body.contentType !== "string" || typeof body.createdAt !== "string") return null;
    if (typeof body.byteLength !== "number") return null;
    const callId =
      typeof body.callId === "string" && isHelgaUuid(body.callId)
        ? body.callId.toLowerCase()
        : null;
    const locale = body.locale === "en" || body.locale === "de" ? body.locale : null;
    return {
      clientUploadId: body.clientUploadId.toLowerCase(),
      callId,
      locale,
      contentType: body.contentType,
      byteLength: body.byteLength,
      createdAt: body.createdAt,
    };
  } catch {
    return null;
  }
}

async function readMeta(kv: RecordingKv, id: string): Promise<HelgaRecordingMeta | null> {
  const raw = await kv.getBytes(metaKey(id));
  return raw ? parseMeta(raw) : null;
}

async function readAudio(
  kv: RecordingKv,
  meta: HelgaRecordingMeta,
): Promise<{ meta: HelgaRecordingMeta; bytes: Uint8Array } | null> {
  const bytes = await kv.getBytes(audioKey(meta.clientUploadId));
  return bytes ? { meta, bytes } : null;
}

async function linkCall(
  kv: RecordingKv,
  meta: HelgaRecordingMeta,
  callId: string,
): Promise<AttachCallResult> {
  if (meta.callId && meta.callId !== callId) {
    return { joined: false, clientUploadId: meta.clientUploadId };
  }
  if (!meta.callId) {
    const next: HelgaRecordingMeta = { ...meta, callId };
    await kv.putBytes(metaKey(meta.clientUploadId), encodeJson(next), "application/json");
    await kv.putBytes(
      callKey(callId),
      encodeJson({ clientUploadId: meta.clientUploadId }),
      "application/json",
    );
  }
  await kv.delete(pendingKey(meta.clientUploadId));
  return { joined: true, clientUploadId: meta.clientUploadId };
}

async function listUnmatched(kv: RecordingKv, sinceMs: number): Promise<HelgaRecordingMeta[]> {
  const keys = await kv.listKeys("meta/");
  const pending: HelgaRecordingMeta[] = [];
  for (const key of keys) {
    const raw = await kv.getBytes(key);
    if (!raw) continue;
    const meta = parseMeta(raw);
    if (!meta || meta.callId) continue;
    const created = Date.parse(meta.createdAt);
    if (!Number.isFinite(created) || created < sinceMs) continue;
    pending.push(meta);
  }
  return pending;
}

async function listOrphans(kv: RecordingKv): Promise<OrphanCall[]> {
  const keys = await kv.listKeys("orphan/");
  const orphans: OrphanCall[] = [];
  for (const key of keys) {
    const raw = await kv.getBytes(key);
    if (!raw) continue;
    try {
      const body = decodeJson(raw) as Record<string, unknown>;
      if (typeof body.callId !== "string" || !isHelgaUuid(body.callId)) continue;
      const receivedAtMs = Date.parse(typeof body.receivedAt === "string" ? body.receivedAt : "");
      if (!Number.isFinite(receivedAtMs)) continue;
      orphans.push({
        callId: body.callId.toLowerCase(),
        locale: body.locale === "en" || body.locale === "de" ? body.locale : null,
        receivedAtMs,
      });
    } catch {
      /* skip corrupt orphan */
    }
  }
  return orphans;
}

export function createHelgaRecordingStore(kv: RecordingKv): HelgaRecordingStore {
  return {
    async putRecording(input) {
      const id = requireUuid(input.clientUploadId);
      const existing = await readMeta(kv, id);
      if (existing) return { meta: existing, alreadyExisted: true };

      let callId: string | null = null;
      const pendingRaw = await kv.getBytes(pendingKey(id));
      if (pendingRaw) {
        try {
          const body = decodeJson(pendingRaw) as Record<string, unknown>;
          if (typeof body.callId === "string" && isHelgaUuid(body.callId)) {
            callId = body.callId.toLowerCase();
          }
        } catch {
          callId = null;
        }
        await kv.delete(pendingKey(id));
      }
      if (!callId) {
        const matched = matchSingleOrphanCall(await listOrphans(kv), {
          locale: input.locale,
          atMs: input.now,
        });
        if (matched) {
          callId = matched;
          await kv.delete(orphanKey(matched));
        }
      }

      const meta: HelgaRecordingMeta = {
        clientUploadId: id,
        callId,
        locale: input.locale,
        contentType: input.contentType,
        byteLength: input.bytes.byteLength,
        createdAt: new Date(input.now).toISOString(),
      };
      await kv.putBytes(audioKey(id), input.bytes, input.contentType);
      await kv.putBytes(metaKey(id), encodeJson(meta), "application/json");
      if (callId) {
        await kv.putBytes(callKey(callId), encodeJson({ clientUploadId: id }), "application/json");
      }
      return { meta, alreadyExisted: false };
    },

    async getByUploadId(clientUploadId) {
      const id = requireUuid(clientUploadId);
      const meta = await readMeta(kv, id);
      return meta ? readAudio(kv, meta) : null;
    },

    async getByCallId(callId) {
      const id = requireUuid(callId);
      const raw = await kv.getBytes(callKey(id));
      if (!raw) return null;
      try {
        const body = decodeJson(raw) as Record<string, unknown>;
        if (typeof body.clientUploadId !== "string") return null;
        const meta = await readMeta(kv, requireUuid(body.clientUploadId));
        return meta ? readAudio(kv, meta) : null;
      } catch {
        return null;
      }
    },

    async attachCall(input) {
      const callId = requireUuid(input.callId);
      if (input.clientUploadId) {
        const id = requireUuid(input.clientUploadId);
        const meta = await readMeta(kv, id);
        if (!meta) {
          await kv.putBytes(
            pendingKey(id),
            encodeJson({
              callId,
              locale: input.locale,
              receivedAt: new Date(input.now).toISOString(),
            }),
            "application/json",
          );
          return { joined: false, clientUploadId: id };
        }
        return linkCall(kv, meta, callId);
      }

      const since = input.now - HELGA_JOIN_WINDOW_MS;
      const matchedId = matchSinglePendingUpload(await listUnmatched(kv, since), {
        locale: input.locale,
        atMs: input.now,
      });
      if (!matchedId) {
        await kv.putBytes(
          orphanKey(callId),
          encodeJson({
            callId,
            locale: input.locale,
            receivedAt: new Date(input.now).toISOString(),
          }),
          "application/json",
        );
        return { joined: false, clientUploadId: null };
      }
      const meta = await readMeta(kv, matchedId);
      if (!meta) return { joined: false, clientUploadId: null };
      return linkCall(kv, meta, callId);
    },
  };
}

export function createMemoryRecordingStore(): HelgaRecordingStore {
  const objects = new Map<string, Uint8Array>();
  return createHelgaRecordingStore({
    async getBytes(key) {
      const found = objects.get(key);
      return found ? new Uint8Array(found) : null;
    },
    async putBytes(key, bytes) {
      objects.set(key, new Uint8Array(bytes));
    },
    async delete(key) {
      objects.delete(key);
    },
    async listKeys(prefix) {
      return [...objects.keys()].filter((key) => key.startsWith(prefix));
    },
  });
}

function isEnoent(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "ENOENT");
}

function isBlobMissing(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String(error.name) : "";
  if (name === "BlobNotFoundError") return true;
  const message = "message" in error ? String(error.message).toLowerCase() : "";
  return message.includes("not found") || message.includes("does not exist");
}

function assertKey(key: string): string {
  if (key.includes("..") || key.startsWith("/") || !/^[a-z0-9/_.-]+$/i.test(key)) {
    throw new Error("invalid recording key");
  }
  return key;
}

export function createFsRecordingStore(root: string): HelgaRecordingStore {
  return createHelgaRecordingStore({
    async getBytes(key) {
      const { readFile } = await import("node:fs/promises");
      const path = await import("node:path");
      try {
        return await readFile(resolveStorePath(root, path, key));
      } catch (error) {
        if (isEnoent(error)) return null;
        throw error;
      }
    },
    async putBytes(key, bytes) {
      const { mkdir, writeFile } = await import("node:fs/promises");
      const path = await import("node:path");
      const file = resolveStorePath(root, path, key);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, bytes);
    },
    async delete(key) {
      const { rm } = await import("node:fs/promises");
      const path = await import("node:path");
      await rm(resolveStorePath(root, path, key), { force: true });
    },
    async listKeys(prefix) {
      const { readdir } = await import("node:fs/promises");
      const path = await import("node:path");
      const folder = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
      try {
        const names = await readdir(resolveStorePath(root, path, folder));
        return names.map((name) => `${folder}/${name}`);
      } catch (error) {
        if (isEnoent(error)) return [];
        throw error;
      }
    },
  });
}

function resolveStorePath(
  root: string,
  path: { resolve: (...parts: string[]) => string; sep: string },
  key: string,
): string {
  const safe = assertKey(key);
  const base = path.resolve(root, "helga");
  const resolved = path.resolve(base, ...safe.split("/"));
  if (resolved !== base && !resolved.startsWith(base + path.sep)) {
    throw new Error("invalid recording key");
  }
  return resolved;
}

function blobPath(key: string): string {
  return `helga/${assertKey(key)}`;
}

async function readStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    total += value.byteLength;
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

export function createBlobRecordingStore(token: string): HelgaRecordingStore {
  return createHelgaRecordingStore({
    async getBytes(key) {
      const { get } = await import("@vercel/blob");
      try {
        const result = await get(blobPath(key), { access: "private", token, useCache: false });
        if (!result || result.statusCode !== 200 || !result.stream) return null;
        return await readStream(result.stream);
      } catch (error) {
        if (isBlobMissing(error)) return null;
        throw error;
      }
    },
    async putBytes(key, bytes, contentType) {
      const { put } = await import("@vercel/blob");
      await put(blobPath(key), Buffer.from(bytes), {
        access: "private",
        token,
        contentType,
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    },
    async delete(key) {
      const { del } = await import("@vercel/blob");
      try {
        await del(blobPath(key), { token });
      } catch (error) {
        if (!isBlobMissing(error)) throw error;
      }
    },
    async listKeys(prefix) {
      const { list } = await import("@vercel/blob");
      const keys: string[] = [];
      let cursor: string | undefined;
      for (let page = 0; page < 5; page += 1) {
        const result = await list({
          token,
          prefix: blobPath(prefix),
          cursor,
          limit: 1000,
        });
        for (const blob of result.blobs) {
          const pathname = blob.pathname.startsWith("helga/")
            ? blob.pathname.slice("helga/".length)
            : blob.pathname;
          if (pathname.startsWith(prefix)) keys.push(pathname);
        }
        if (!result.hasMore || !result.cursor) break;
        cursor = result.cursor;
      }
      return keys;
    },
  });
}

export function helgaRecordingStoreFromEnv(
  env: Record<string, string | undefined> = process.env,
): HelgaRecordingStore | null {
  const token = env.BLOB_READ_WRITE_TOKEN?.trim();
  if (token) return createBlobRecordingStore(token);
  const dir = env.HELGA_RECORDING_DIR?.trim();
  if (dir) return createFsRecordingStore(dir);
  return null;
}
