import { Redis } from '@upstash/redis';
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const ALLOWED_ORIGINS = new Set([
  "https://charlie-chocolate-hk.webflow.io",
  "https://charliemusicalhk.com",   // fixed: removed trailing slash so it actually matches the browser's Origin header
]);

function setCors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.has(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  const { token } = req.body || {};
  if (!token) return res.status(400).json({ status: "invalid" });

  const key = `play:${token}`;
  const raw = await redis.get(key);

  if (!raw) {
    return res.status(200).json({ status: "invalid" }); // expired, unknown, or already used
  }

  await redis.del(key); // consume it — single use, prevents link sharing/reuse

  const data = typeof raw === "string" ? JSON.parse(raw) : raw;

  // fixed: `won` was computed and stored in /api/enter but never sent back here —
  // without it the frontend has no way to know which animation to render
  return res.status(200).json({ status: "ok", firstName: data.firstName, won: data.won });
}
