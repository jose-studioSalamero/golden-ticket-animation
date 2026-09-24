import crypto from "node:crypto";
import { Redis } from '@upstash/redis';
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const MC_API_KEY = process.env.MAILCHIMP_API_KEY;
const MC_SERVER  = MC_API_KEY.split("-").pop();
const MC_LIST_ID = process.env.MAILCHIMP_LIST_ID;
const MC_BASE    = `https://${MC_SERVER}.api.mailchimp.com/3.0`;

const WIN_WINDOW_START = new Date(process.env.WIN_WINDOW_START);
const WIN_WINDOW_END   = new Date(process.env.WIN_WINDOW_END);
const WIN_PROBABILITY  = parseFloat(process.env.WIN_PROBABILITY);

const ALLOWED_ORIGINS = new Set([
  "https://charlie-chocolate-hk.webflow.io",
  "https://charliemusicalhk.com",
]);

const hashEmail = (email) =>
  crypto.createHash("md5").update(email.trim().toLowerCase()).digest("hex");

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

  const { firstName, lastName, email, consent } = req.body || {};

  if (!email || !firstName || !lastName) {
    return res.status(400).json({ error: "missing_fields" });
  }
  if (consent !== true) {
    return res.status(400).json({ error: "consent_required" });
  }

  const hash = hashEmail(email);
  const memberUrl = `${MC_BASE}/lists/${MC_LIST_ID}/members/${hash}`;
  const auth = "Basic " + Buffer.from(`anystring:${MC_API_KEY}`).toString("base64");

  const lookup = await fetch(memberUrl, { headers: { Authorization: auth } });

  if (lookup.status === 200) {
    return res.status(200).json({ status: "already_played" });
  }
  if (lookup.status !== 404) {
    return res.status(502).json({ error: "mailchimp_lookup_failed" });
  }

  const upsert = await fetch(memberUrl, {
    method: "PUT",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({
      email_address: email,
      status_if_new: "subscribed",
      merge_fields: { FNAME: firstName, LNAME: lastName },
      tags: ["goldleaf-giveaway"],
    }),
  });

  if (!upsert.ok) {
    return res.status(502).json({ error: "mailchimp_upsert_failed" });
  }

  // ---- Win logic runs per-request, after signup succeeds, using this request's `email` ----
  const now = Date.now();
  const withinWinWindow = now >= WIN_WINDOW_START.getTime() && now <= WIN_WINDOW_END.getTime();

  let won = false;

  if (withinWinWindow) {
    const alreadyClaimed = await redis.get("goldleaf:winner_claimed");

    if (!alreadyClaimed) {
      const roll = Math.random() < WIN_PROBABILITY;
      if (roll) {
        const claimed = await redis.set("goldleaf:winner_claimed", email, { nx: true });
        if (claimed) {
          won = true;
        }
      }
    }
  }

  // Single-use play token, valid for 15 minutes, stored server-side.
  const token = crypto.randomUUID();
  await redis.set(
    `play:${token}`,
    JSON.stringify({ email, firstName, won }),
    { ex: 900 }
  );

  return res.status(200).json({ status: "ok", token });
}
