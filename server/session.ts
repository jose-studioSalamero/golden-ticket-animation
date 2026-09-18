import { SESSION_TTL_MS, type SessionPayload } from "./types";

function secret(): string {
  return process.env.SESSION_SECRET?.trim() || "goldleaf-prototype-secret";
}

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function textBytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

async function hmacKey() {
  return crypto.subtle.importKey("raw", textBytes(secret()), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

async function sign(payloadB64: string): Promise<string> {
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(), textBytes(payloadB64));
  return bytesToB64url(new Uint8Array(sig));
}

export async function issueSession(input: {
  email: string;
  givenName: string;
  surname: string;
}): Promise<string> {
  const now = Date.now();
  const nonce = new Uint8Array(12);
  crypto.getRandomValues(nonce);
  const payload: SessionPayload = {
    e: input.email,
    f: input.givenName,
    l: input.surname,
    n: bytesToB64url(nonce),
    iat: now,
    exp: now + SESSION_TTL_MS,
  };
  const payloadB64 = bytesToB64url(textBytes(JSON.stringify(payload)));
  return `${payloadB64}.${await sign(payloadB64)}`;
}

export async function readSession(token: string): Promise<SessionPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return null;

  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      b64urlToBytes(sig),
      textBytes(payloadB64),
    );
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(payloadB64))) as SessionPayload;
    if (!payload?.e || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
