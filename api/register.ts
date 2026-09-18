import { handleRegisterRequest } from "../server/http";

async function fetch(request: Request): Promise<Response> {
  try {
    return await handleRegisterRequest(request);
  } catch (err) {
    console.error("register failed", err);
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "Something went wrong. Try again." },
      { status: 500 },
    );
  }
}

export default { fetch };
export { fetch as POST, fetch as OPTIONS };
