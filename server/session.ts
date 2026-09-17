import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { SESSION_TTL_MS, type SessionPayload } from "./types";

function secret(): string {
  return process.env.SESSION_SECRET?.trim() || "goldleaf-prototype-secret";
}

function b64url(data: string | Buffer): string {
  return Buffer.from(data).toString("base64url");
}

function sign(payloadB64: string): string {
  return createHmac("sha256", secret()).update(payloadB64).digest("base64url");
}

export function issueSession(input: {
  email: string;
  givenName: string;
  surname: string;
}): string {
  const now = Date.now();
  const payload: SessionPayload = {
    e: input.email,
    f: input.givenName,
    l: input.surname,
    n: randomBytes(12).toString("hex"),
    iat: now,
    exp: now + SESSION_TTL_MS,
  };
  const payloadB64 = b64url(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function readSession(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return null;

  const expected = sign(payloadB64);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as SessionPayload;
    if (!payload?.e || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
