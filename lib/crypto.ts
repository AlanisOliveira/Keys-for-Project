import type { EncryptedPayload } from "@/lib/types";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export async function deriveKey(projectKey: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(projectKey), { name: "PBKDF2" }, false, [
    "deriveKey",
  ]);

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: toArrayBuffer(salt),
      iterations: 310_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encrypt(plaintext: string, projectKey: string): Promise<EncryptedPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(projectKey, salt);

  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, encoder.encode(plaintext));

  return {
    iv: toBase64(iv),
    salt: toBase64(salt),
    ciphertext: toBase64(new Uint8Array(encrypted)),
  };
}

export async function decrypt(payload: EncryptedPayload, projectKey: string): Promise<string> {
  const key = await deriveKey(projectKey, fromBase64(payload.salt));
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(fromBase64(payload.iv)) },
    key,
    toArrayBuffer(fromBase64(payload.ciphertext)),
  );

  return decoder.decode(decrypted);
}

export async function encryptJson<T>(value: T, projectKey: string) {
  return encrypt(JSON.stringify(value), projectKey);
}

export async function decryptJson<T>(payload: EncryptedPayload, projectKey: string): Promise<T> {
  const plaintext = await decrypt(payload, projectKey);
  return JSON.parse(plaintext) as T;
}

export function createPreview(value: string, visibleCount = 3) {
  if (!value) return "•••";
  return `${value.slice(0, visibleCount)}•••`;
}

export function maskCardNumber(lastFour: string) {
  return `•••• •••• •••• ${lastFour}`;
}
