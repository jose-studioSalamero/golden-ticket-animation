import { handleUnwrapRequest, optionsResponse } from "../server/http";
import { vercelHandler } from "../server/vercel-handler";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleUnwrapRequest(request);
}

export function OPTIONS() {
  return optionsResponse();
}

export default vercelHandler(handleUnwrapRequest);
