import crypto from "node:crypto";
import { Redis } from '@upstash/redis';
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const MC_API_KEY = process.env.MAILCHIMP_API_KEY;      // e.g. "xxxx...xxxx-us21"
const MC_SERVER  = MC_API_KEY.split("-").pop();         // "us21"
const MC_LIST_ID = process.env.MAILCHIMP_LIST_ID;       // "da7390e84b"
const MC_BASE    = `https://${MC_SERVER}.api.mailchimp.com/3.0`;

const ALLOWED_ORIGINS = new Set([
  "https://charlie-chocolate-hk.webflow.io",
  "https://charliemusicalhk.com", // add once live
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
      status_if_new: "subscribed", // consent is mandatory, so always subscribe
      merge_fields: { FNAME: firstName, LNAME: lastName },
      tags: ["goldleaf-giveaway"],
    }),
  });

  if (!upsert.ok) {
    return res.status(502).json({ error: "mailchimp_upsert_failed" });
  }

  // Single-use play token, valid for 15 minutes, stored server-side.
  const token = crypto.randomUUID();
  await redis.set(
    `play:${token}`,
    JSON.stringify({ email, firstName }),
    { ex: 900 } // seconds
  );

  return res.status(200).json({ status: "ok", token });
}
