import { registerPlayer, unwrapPrize, ValidationError } from "./play";
import { PlayedBeforeError } from "./store";
import { ALREADY_PLAYED_MESSAGE } from "./types";

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

export function optionsResponse(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function handleRegisterRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return optionsResponse();
  if (request.method !== "POST") {
    return json(405, { ok: false, error: "Use POST to enter the chocolate bar." });
  }

  try {
    const body = await parseRequestBody(request);
    const result = await registerPlayer(body);
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
    const message = err instanceof ValidationError ? err.message : "Something went wrong. Try again.";
    return json(err instanceof ValidationError ? 400 : 500, { ok: false, error: message });
  }
}

export async function handleUnwrapRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return optionsResponse();
  if (request.method !== "POST") {
    return json(405, { ok: false, error: "Use POST to unwrap." });
  }

  try {
    const body = await parseRequestBody(request);
    const token = typeof body.token === "string" ? body.token : "";
    if (!token) return json(400, { ok: false, error: "Missing play session." });
    const result = await unwrapPrize(token);
    return json(200, { ok: true, prize: result.prize, alreadyUnwrapped: result.alreadyUnwrapped });
  } catch (err) {
    console.error("unwrap failed", err);
    const message = err instanceof ValidationError ? err.message : "Something went wrong. Try again.";
    return json(err instanceof ValidationError ? 400 : 500, { ok: false, error: message });
  }
}

export async function routeApiRequest(request: Request): Promise<Response> {
  const pathname = new URL(request.url).pathname.replace(/\/$/, "") || "/";
  if (pathname === "/api/register") return handleRegisterRequest(request);
  if (pathname === "/api/unwrap") return handleUnwrapRequest(request);
  return json(404, { ok: false, error: "Not found" });
}

async function parseRequestBody(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? "";
  const raw = await request.text();
  if (!raw.trim()) return {};

  if (contentType.includes("application/json")) {
    try {
      return asRecord(JSON.parse(raw));
    } catch {
      return {};
    }
  }
  if (contentType.includes("application/x-www-form-urlencoded") || raw.includes("=")) {
    const params = new URLSearchParams(raw);
    const out: Record<string, unknown> = {};
    for (const [key, value] of params.entries()) out[key] = value;
    return out;
  }
  try {
    return asRecord(JSON.parse(raw));
  } catch {
    return {};
  }
}

function asRecord(parsed: unknown): Record<string, unknown> {
  return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
