# Goldleaf — Golden Ticket

Prototype of a one-play-per-email chocolate-bar unwrap. Guests enter through a Webflow-style form, the backend checks a Mailchimp list (or a local mock), and a tap-three-times animation reveals either a **Golden Ticket** (0.01%) or **5% off tickets**.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open [http://127.0.0.1:43173](http://127.0.0.1:43173).

Without `MAILCHIMP_API_KEY`, first-time emails are stored in `.data/players.json`. A second submit with the same address shows **you have played before**.

## How a play works

1. Guest submits Given Name (`FNAME`), Surname (`LNAME`), Email (`EMAIL`), and marketing consent.
2. `POST /api/register` looks the email up on the Mailchimp list (or mock store).
   - **New email** → add to the list, issue a signed session, send them to `/play`.
   - **Already on the list** → `you have played before` (`/already-played`).
3. Three taps unwrap the bar. `POST /api/unwrap` rolls the prize once:
   - `0.01%` Golden Ticket (`PRIZE_GOLDEN_RATE=0.0001`)
   - otherwise 5% off tickets
4. Repeating the animation does not re-roll. Submitting the form again with that email is blocked.

## Webflow form

Point the landing form `action` at this app instead of `list-manage.com`:

```
action="https://YOUR_DOMAIN/api/register"
method="post"
```

Keep the existing field names so the hosted page and this prototype share one handler:

| Field | Name |
| --- | --- |
| Given Name | `FNAME` |
| Surname | `LNAME` |
| Email | `EMAIL` |
| Marketing consent checkbox | `name` |

A full-page form post receives a `303` redirect to `/play?token=…` or `/already-played`. The in-app form sends JSON and navigates in the browser.

This API also adds the subscriber to Mailchimp when `MAILCHIMP_API_KEY` is set, so do not double-post to the Mailchimp hosted form.

## Environment

See `.env.example`. Set `PRIZE_GOLDEN_RATE=1` to force a Golden Ticket while testing the animation.

On Vercel, add the same variables in the project settings. The mock file store is local-only; production should use Mailchimp.

## Stack

Vite, React, TypeScript, Tailwind CSS v4, Framer Motion, Vercel serverless `/api`.
