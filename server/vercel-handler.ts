import type { IncomingMessage, ServerResponse } from "node:http";

type NodeLike = IncomingMessage & { body?: unknown };

export function vercelHandler(handle: (request: Request) => Promise<Response>) {
  return async (req: Request | NodeLike, res?: ServerResponse) => {
    if (res && typeof res.end === "function" && !(req instanceof Request)) {
      const response = await handle(await nodeToRequest(req));
      res.statusCode = response.status;
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    return handle(req as Request);
  };
}

async function nodeToRequest(req: NodeLike): Promise<Request> {
  const host = req.headers.host ?? "127.0.0.1";
  const url = `http://${host}${req.url ?? "/"}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(", "));
  }

  const method = req.method ?? "GET";
  let body: RequestInit["body"];
  if (method !== "GET" && method !== "HEAD") {
    if (typeof req.body === "string") {
      body = req.body;
    } else if (req.body != null && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
      body = JSON.stringify(req.body);
      if (!headers.has("content-type")) headers.set("content-type", "application/json");
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
      body = Buffer.concat(chunks);
    }
  }

  return new Request(url, { method, headers, body });
}
