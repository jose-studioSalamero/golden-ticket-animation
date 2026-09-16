# Goldleaf — Golden Ticket

A proof-of-concept unwrap animation: tap a chocolate bar **three times** to tear the wrapper, then watch a white ticket rise, flip edge-on, and gild itself gold.

This slice is animation-only. Prize logic and a backend can be wired later without changing the motion.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43173](http://127.0.0.1:43173).

## What to look for

1. Idle bar on a deep-purple stage with a warm glow.
2. Each tap tears the wrapper further (foil crinkle + camo paper).
3. After the third tap: confetti, ticket slides up, 3D edge flip to landscape, white-to-gold fill, congratulations + grand prize banner.
4. **Play again** resets the sequence.

## Stack

Vite, React, TypeScript, Tailwind CSS v4, Framer Motion.
