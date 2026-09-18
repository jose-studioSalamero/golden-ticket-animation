# Goldleaf — Golden Ticket

Self-contained prototype: a landing form, one play per email, and a three-tap unwrap that rolls a **Golden Ticket** (0.01%) or **5% off tickets**.

No Mailchimp or Webflow. The Vercel app owns the list and the prize draw.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43173](http://127.0.0.1:43173).

Local plays are stored in `.data/players.json`. A second submit with the same email shows **you have played before**.

## How a play works

1. Guest submits given name, surname, email, and marketing consent.
2. `POST /api/register` looks the email up in the player store.
   - **New email** → save the player, issue a signed session, go to `/play`.
   - **Already played** → `you have played before`.
3. Three taps unwrap the bar. `POST /api/unwrap` rolls the prize once:
   - `0.01%` Golden Ticket (`PRIZE_GOLDEN_RATE=0.0001`)
   - otherwise 5% off tickets
4. Watching the animation again does not re-roll.

On Vercel the player store is the [Runtime Cache](https://vercel.com/docs/functions/runtime-cache) (`getCache` from `@vercel/functions`) — Hobby-tier, no extra database. It is per-region and may evict under LRU pressure; that is enough for this proof of concept.

## Environment

See `.env.example`. Optional:

- `SESSION_SECRET` — signs play tokens (a prototype default is used if unset)
- `PRIZE_GOLDEN_RATE=1` — force a Golden Ticket while testing

## Stack

Vite, React, TypeScript, Tailwind CSS v4, Framer Motion, Vercel Functions.
