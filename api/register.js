import {
  failResponse,
  handleRegisterRequest,
  nodeToWebRequest,
  writeNodeResponse,
} from "./goldleaf.js";

async function run(request) {
  return handleRegisterRequest(request);
}

async function handler(req, res) {
  try {
    if (res && typeof res.end === "function") {
      await writeNodeResponse(await run(await nodeToWebRequest(req)), res);
      return;
    }
    return await run(req);
  } catch (err) {
    return failResponse(err, res);
  }
}

handler.fetch = (request) => handler(request);

export default handler;
export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;
