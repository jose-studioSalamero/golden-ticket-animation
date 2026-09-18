const ALREADY_PLAYED_MESSAGE = "you have played before";
const GOLDEN_RATE_DEFAULT = 0.0001;
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

export class PlayedBeforeError extends Error {
  constructor() {
    super(ALREADY_PLAYED_MESSAGE);
    this.name = "PlayedBeforeError";
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

function secret() {
  return (typeof process !== "undefined" && process.env?.SESSION_SECRET?.trim()) || "goldleaf-prototype-secret";
}

function bytesToB64url(bytes) {
  let bin = "";
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function textBytes(value) {
  return new TextEncoder().encode(value);
}

async function hmacKey() {
  return crypto.subtle.importKey("raw", textBytes(secret()), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

async function sign(payloadB64) {
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(), textBytes(payloadB64));
  return bytesToB64url(new Uint8Array(sig));
}

function goldenRate() {
  const raw = typeof process !== "undefined" ? process.env?.PRIZE_GOLDEN_RATE : undefined;
  if (raw === undefined || raw === "") return GOLDEN_RATE_DEFAULT;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return GOLDEN_RATE_DEFAULT;
  return Math.min(1, n);
}

function rollPrize(rate = goldenRate()) {
  const threshold = Math.round(rate * 1_000_000);
  if (threshold <= 0) return "discount";
  if (threshold >= 1_000_000) return "golden";
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return bytes[0] % 1_000_000 < threshold ? "golden" : "discount";
}

function players() {
  const g = globalThis;
  g.__goldleafPlayers ??= new Map();
  return g.__goldleafPlayers;
}

export async function issueSession(input) {
  const now = Date.now();
  const nonce = new Uint8Array(12);
  crypto.getRandomValues(nonce);
  const payload = {
    e: input.email,
    f: input.givenName,
    l: input.surname,
    n: bytesToB64url(nonce),
    p: input.prize,
    iat: now,
    exp: now + SESSION_TTL_MS,
  };
  const payloadB64 = bytesToB64url(textBytes(JSON.stringify(payload)));
  return `${payloadB64}.${await sign(payloadB64)}`;
}

export async function readSession(token) {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(), b64urlToBytes(sig), textBytes(payloadB64));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(payloadB64)));
    if (!payload?.e || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;
    if (payload.p !== "golden" && payload.p !== "discount") return null;
    return payload;
  } catch {
    return null;
  }
}

function stringField(body, keys) {
  for (const key of keys) {
    const value = body[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) return value[0].trim();
  }
  return "";
}

function hasConsent(body) {
  const value = body.name ?? body.consent ?? body.CONSENT ?? body.marketing;
  if (value === true || value === "true" || value === "on" || value === "1" || value === "yes") return true;
  if (typeof value === "string" && value.trim() !== "" && value !== "false" && value !== "off") return true;
  return false;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseRegisterInput(body) {
  const givenName = stringField(body, ["FNAME", "fname", "givenName", "given_name"]);
  const surname = stringField(body, ["LNAME", "lname", "surname", "lastName", "last_name"]);
  const email = stringField(body, ["EMAIL", "email"]).toLowerCase();
  const consent = hasConsent(body);
  if (!givenName) throw new ValidationError("Enter your given name.");
  if (!surname) throw new ValidationError("Enter your surname.");
  if (!email) throw new ValidationError("Enter your email.");
  if (!EMAIL_RE.test(email)) throw new ValidationError("Enter a valid email address.");
  if (!consent) {
    throw new ValidationError("Please agree to receive marketing and promotional materials to continue.");
  }
  return { givenName, surname, email, consent };
}

export async function registerPlayer(body) {
  const input = parseRegisterInput(body);
  const email = input.email.trim().toLowerCase();
  const list = players();
  if (list.has(email)) throw new PlayedBeforeError();
  const prize = rollPrize();
  list.set(email, { email, prize, registeredAt: new Date().toISOString() });
  const token = await issueSession({
    email,
    givenName: input.givenName,
    surname: input.surname,
    prize,
  });
  return {
    token,
    givenName: input.givenName,
    surname: input.surname,
    email,
    prize,
  };
}

export async function unwrapPrize(token) {
  const session = await readSession(token);
  if (!session) throw new ValidationError("This play session expired. Submit the form again.");
  return { prize: session.p, alreadyUnwrapped: false, email: session.e };
}

export function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export function optionsResponse() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

async function parseRequestBody(request) {
  const contentType = request.headers.get("content-type") ?? "";
  const raw = await request.text();
  if (!raw.trim()) return {};
  if (contentType.includes("application/json") || raw.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  if (contentType.includes("application/x-www-form-urlencoded") || raw.includes("=")) {
    const params = new URLSearchParams(raw);
    const out = {};
    for (const [key, value] of params.entries()) out[key] = value;
    return out;
  }
  return {};
}

export async function handleRegisterRequest(request) {
  if (request.method === "OPTIONS") return optionsResponse();
  if (request.method === "GET") return json(200, { ok: true, ping: "register" });
  if (request.method !== "POST") return json(405, { ok: false, error: "Use POST to enter the chocolate bar." });
  try {
    const result = await registerPlayer(await parseRequestBody(request));
    return json(200, {
      ok: true,
      ...result,
      playUrl: `/play?token=${encodeURIComponent(result.token)}`,
    });
  } catch (err) {
    console.error("register failed", err);
    if (err instanceof PlayedBeforeError) {
      return json(409, { ok: false, error: ALREADY_PLAYED_MESSAGE, code: "already_played" });
    }
    const message = err instanceof ValidationError ? err.message : err instanceof Error ? err.message : "Something went wrong. Try again.";
    return json(err instanceof ValidationError ? 400 : 500, { ok: false, error: message });
  }
}

export async function handleUnwrapRequest(request) {
  if (request.method === "OPTIONS") return optionsResponse();
  if (request.method === "GET") return json(200, { ok: true, ping: "unwrap" });
  if (request.method !== "POST") return json(405, { ok: false, error: "Use POST to unwrap." });
  try {
    const body = await parseRequestBody(request);
    const token = typeof body.token === "string" ? body.token : "";
    if (!token) return json(400, { ok: false, error: "Missing play session." });
    const result = await unwrapPrize(token);
    return json(200, { ok: true, prize: result.prize, alreadyUnwrapped: result.alreadyUnwrapped });
  } catch (err) {
    console.error("unwrap failed", err);
    const message = err instanceof ValidationError ? err.message : err instanceof Error ? err.message : "Something went wrong. Try again.";
    return json(err instanceof ValidationError ? 400 : 500, { ok: false, error: message });
  }
}

export async function routeApiRequest(request) {
  const pathname = new URL(request.url).pathname.replace(/\/$/, "") || "/";
  if (pathname === "/api/register") return handleRegisterRequest(request);
  if (pathname === "/api/unwrap") return handleUnwrapRequest(request);
  return json(404, { ok: false, error: "Not found" });
}

export async function nodeToWebRequest(req) {
  const headers = new Headers();
  const rawHeaders = req.headers ?? {};
  for (const [key, value] of Object.entries(rawHeaders)) {
    if (typeof value === "string") headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(", "));
  }
  const method = req.method ?? "GET";
  const host = rawHeaders.host ?? "127.0.0.1";
  const url = `http://${host}${req.url ?? "/"}`;
  let body;
  if (method !== "GET" && method !== "HEAD") {
    if (typeof req.body === "string") body = req.body;
    else if (req.body != null && typeof req.body === "object") {
      body = JSON.stringify(req.body);
      if (!headers.has("content-type")) headers.set("content-type", "application/json");
    }
  }
  return new Request(url, { method, headers, body });
}

export async function writeNodeResponse(response, res) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  res.end(await response.text());
}

export function failResponse(err, res) {
  const error = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  if (res && typeof res.end === "function") {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error }));
    return;
  }
  return json(500, { ok: false, error });
}
