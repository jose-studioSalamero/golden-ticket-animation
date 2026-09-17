import type { IncomingMessage, ServerResponse } from "node:http";
import { handleRegister } from "../server/http";

export const config = { runtime: "nodejs" as const };

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await handleRegister(req, res);
}
