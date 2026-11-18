/**
 * Decrypt the Live in Bonn event-details payload in the browser.
 * Algorithm: AES-GCM with a PBKDF2-SHA-256 key derived from the visitor password.
 * The plaintext is not stored in the repo.
 */
export type EncryptedPayload = {
  v: 1;
  kdf: "PBKDF2";
  hash: "SHA-256";
  iter: number;
  salt: string;
  iv: string;
  ct: string;
};

export type EventPhoto = {
  src: string;
  alt: string;
  credit: string;
  href: string;
};

export type EventSection = {
  title: string;
  text: string;
  photos: EventPhoto[];
};

export type EventDetails = {
  datum: string;
  ort: string;
  maps: string;
  parken: string;
  kueche: string;
  mehr: string;
  lokal: EventSection;
  markt: EventSection;
};

function b64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveKey(password: string, payload: EncryptedPayload): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: b64ToBytes(payload.salt),
      iterations: payload.iter,
      hash: payload.hash,
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
}

export async function decryptEventDetails(
  password: string,
  payload: EncryptedPayload,
): Promise<EventDetails> {
  if (payload.v !== 1 || payload.kdf !== "PBKDF2") {
    throw new Error("unsupported payload");
  }
  const key = await deriveKey(password, payload);
  const raw = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64ToBytes(payload.iv) },
    key,
    b64ToBytes(payload.ct),
  );
  const parsed: unknown = JSON.parse(new TextDecoder().decode(raw));
  if (!isEventDetails(parsed)) throw new Error("invalid payload");
  return parsed;
}

function isPhoto(value: unknown): value is EventPhoto {
  if (!value || typeof value !== "object") return false;
  const rec = value as Record<string, unknown>;
  return (
    typeof rec.src === "string" &&
    rec.src.startsWith("data:image/webp") &&
    typeof rec.alt === "string" &&
    rec.alt.length > 0 &&
    typeof rec.credit === "string" &&
    rec.credit.length > 0 &&
    typeof rec.href === "string" &&
    rec.href.startsWith("https://commons.wikimedia.org/wiki/File:")
  );
}

function isSection(value: unknown): value is EventSection {
  if (!value || typeof value !== "object") return false;
  const rec = value as Record<string, unknown>;
  return (
    typeof rec.title === "string" &&
    rec.title.length > 0 &&
    typeof rec.text === "string" &&
    rec.text.length > 0 &&
    Array.isArray(rec.photos) &&
    rec.photos.length > 0 &&
    rec.photos.every(isPhoto)
  );
}

function isEventDetails(value: unknown): value is EventDetails {
  if (!value || typeof value !== "object") return false;
  const rec = value as Record<string, unknown>;
  const strings = ["datum", "ort", "maps", "parken", "kueche", "mehr"].every(
    (key) => typeof rec[key] === "string" && (rec[key] as string).length > 0,
  );
  return strings && isSection(rec.lokal) && isSection(rec.markt);
}
