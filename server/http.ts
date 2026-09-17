import type { IncomingMessage, ServerResponse } from "node:http";
import { registerPlayer, unwrapPrize, ValidationError } from "./play";
import { ALREADY_PLAYED_MESSAGE } from "./types";
import { PlayedBeforeError } from "./store";

type NodeReq = IncomingMessage & { body?: unknown };

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

export async function handleRegister(req: NodeReq, res: ServerResponse): Promise<void> {
  if (req.method === "OPTIONS") {
    send(res, 204, null);
    return;
  }
  if (req.method !== "POST") {
    send(res, 405, { ok: false, error: "Use POST to enter the chocolate bar." });
    return;
  }

  const body = await parseBody(req);
  const asJson = wantsJson(req);

  try {
    const result = await registerPlayer(body);
    if (asJson) {
      send(res, 200, { ok: true, ...result, playUrl: `/play?token=${encodeURIComponent(result.token)}` });
      return;
    }
    redirect(res, `/play?token=${encodeURIComponent(result.token)}`);
  } catch (err) {
    if (err instanceof PlayedBeforeError) {
      if (asJson) {
        send(res, 409, { ok: false, error: ALREADY_PLAYED_MESSAGE, code: "already_played" });
        return;
      }
      redirect(res, "/already-played");
      return;
    }
    const message = err instanceof ValidationError ? err.message : "Something went wrong. Try again.";
    const status = err instanceof ValidationError ? 400 : 500;
    if (asJson) {
      send(res, status, { ok: false, error: message });
      return;
    }
    redirect(res, `/?error=${encodeURIComponent(message)}`);
  }
}

export async function handleUnwrap(req: NodeReq, res: ServerResponse): Promise<void> {
  if (req.method === "OPTIONS") {
    send(res, 204, null);
    return;
  }
  if (req.method !== "POST") {
    send(res, 405, { ok: false, error: "Use POST to unwrap." });
    return;
  }

  try {
    const body = await parseBody(req);
    const token = typeof body.token === "string" ? body.token : "";
    if (!token) {
      send(res, 400, { ok: false, error: "Missing play session." });
      return;
    }
    const result = await unwrapPrize(token);
    send(res, 200, { ok: true, prize: result.prize, alreadyUnwrapped: result.alreadyUnwrapped });
  } catch (err) {
    const message = err instanceof ValidationError ? err.message : "Something went wrong. Try again.";
    const status = err instanceof ValidationError ? 400 : 500;
    send(res, status, { ok: false, error: message });
  }
}

export async function handleApi(req: NodeReq, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", "http://goldleaf.local");
  const pathname = url.pathname.replace(/\/$/, "") || "/";

  try {
    if (pathname === "/api/register") {
      await handleRegister(req, res);
      return;
    }
    if (pathname === "/api/unwrap") {
      await handleUnwrap(req, res);
      return;
    }
    send(res, 404, { ok: false, error: "Not found" });
  } catch (err) {
    if (res.headersSent) return;
    const message = err instanceof Error ? err.message : "Something went wrong. Try again.";
    send(res, 500, { ok: false, error: message });
  }
}

function wantsJson(req: NodeReq): boolean {
  const accept = String(req.headers.accept ?? "");
  const contentType = String(req.headers["content-type"] ?? "");
  if (contentType.includes("application/json")) return true;
  if (accept.includes("application/json") && !accept.includes("text/html")) return true;
  return false;
}

async function parseBody(req: NodeReq): Promise<Record<string, unknown>> {
  if (req.body !== undefined && req.body !== null && req.body !== "") {
    if (typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
      return req.body as Record<string, unknown>;
    }
    if (typeof req.body === "string") {
      return parseRaw(req.body, String(req.headers["content-type"] ?? ""));
    }
  }

  const raw = await readRaw(req);
  return parseRaw(raw, String(req.headers["content-type"] ?? ""));
}

function parseRaw(raw: string, contentType: string): Record<string, unknown> {
  if (!raw.trim()) return {};
  if (contentType.includes("application/json")) {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  }
  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    raw.includes("=")
  ) {
    const params = new URLSearchParams(raw);
    const out: Record<string, unknown> = {};
    for (const [key, value] of params.entries()) {
      out[key] = value;
    }
    return out;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function readRaw(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer | string) => {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  for (const [key, value] of Object.entries(CORS)) {
    res.setHeader(key, value);
  }
  if (body === null || body === undefined) {
    res.end();
    return;
  }
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function redirect(res: ServerResponse, location: string): void {
  res.statusCode = 303;
  for (const [key, value] of Object.entries(CORS)) {
    res.setHeader(key, value);
  }
  res.setHeader("Location", location);
  res.end();
}
