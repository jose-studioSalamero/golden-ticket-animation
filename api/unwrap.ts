import type { IncomingMessage, ServerResponse } from "node:http";
import { handleUnwrap } from "../server/http";

export const config = { runtime: "nodejs" as const };

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await handleUnwrap(req, res);
}
