import { GOLDEN_RATE_DEFAULT, type Prize } from "./types";

export function goldenRate(): number {
  const raw = process.env.PRIZE_GOLDEN_RATE;
  if (raw === undefined || raw === "") return GOLDEN_RATE_DEFAULT;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return GOLDEN_RATE_DEFAULT;
  return Math.min(1, n);
}

/** 0.01% golden ticket by default; otherwise 5% off tickets. */
export function rollPrize(rate = goldenRate()): Prize {
  const threshold = Math.round(rate * 1_000_000);
  if (threshold <= 0) return "discount";
  if (threshold >= 1_000_000) return "golden";
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return (bytes[0] as number) % 1_000_000 < threshold ? "golden" : "discount";
}
