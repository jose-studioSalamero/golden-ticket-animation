import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { handleApi } from "./http";

export function goldleafApiPlugin(): Plugin {
  const middleware = async (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => {
    const url = req.url ?? "";
    const pathname = url.split("?")[0] ?? "";
    if (!pathname.startsWith("/api/")) {
      next();
      return;
    }
    try {
      await handleApi(req, res);
    } catch (err) {
      if (res.headersSent) return;
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          ok: false,
          error: err instanceof Error ? err.message : "Something went wrong. Try again.",
        }),
      );
    }
  };

  return {
    name: "goldleaf-api",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
