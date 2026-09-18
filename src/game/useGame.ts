import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "../lib/errorMessage";
import { MAX_TAPS, type GamePhase, type TicketPose } from "./constants";
import type { Prize } from "./prizes";

function wait(ms: number, bag: number[]) {
  return new Promise<void>((resolve) => {
    const id = window.setTimeout(resolve, ms);
    bag.push(id);
  });
}

type Options = {
  onReveal: () => Promise<Prize>;
};

export function useGame({ onReveal }: Options) {
  const [taps, setTaps] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [ticketPose, setTicketPose] = useState<TicketPose>("pocket");
  const [isLandscape, setIsLandscape] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const [prize, setPrize] = useState<Prize | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const running = useRef(false);
  const onRevealRef = useRef(onReveal);

  useEffect(() => {
    onRevealRef.current = onReveal;
  }, [onReveal]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  const reset = useCallback(() => {
    running.current = false;
    clearTimers();
    setTaps(0);
    setPhase("idle");
    setTicketPose("pocket");
    setIsLandscape(false);
    setPressed(false);
    setBurstKey(0);
    setError(null);
  }, [clearTimers]);

  const playReveal = useCallback(async (nextPrize: Prize) => {
    running.current = true;
    setPhase("revealing");
    setBurstKey((k) => k + 1);
    await wait(280, timers.current);
    if (!running.current) return;
    setTicketPose("rising");
    await wait(900, timers.current);
    if (!running.current) return;
    setTicketPose("edge");
    await wait(520, timers.current);
    if (!running.current) return;
    setIsLandscape(true);
    await wait(80, timers.current);
    if (!running.current) return;
    setTicketPose("landed");
    await wait(550, timers.current);
    if (!running.current) return;
    if (nextPrize === "golden") setTicketPose("gilded");
    await wait(900, timers.current);
    if (!running.current) return;
    setPhase("celebrating");
  }, []);

  const tap = useCallback(() => {
    if (phase === "revealing" || phase === "celebrating" || phase === "drawing") return;
    if (taps >= MAX_TAPS) return;

    const next = taps + 1;
    setTaps(next);
    setPhase("unwrapping");
    setPressed(true);
    window.setTimeout(() => setPressed(false), 160);
    if (next >= 2) setBurstKey((k) => k + 1);
    if (next >= MAX_TAPS) {
      if (prize) {
        void playReveal(prize);
        return;
      }
      setPhase("drawing");
      void (async () => {
        try {
          const drawn = await onRevealRef.current();
          setPrize(drawn);
          await playReveal(drawn);
        } catch (err) {
          setError(errorMessage(err, "The ticket stuck in the wrapper. Try again."));
          setPhase("error");
        }
      })();
    }
  }, [phase, playReveal, prize, taps]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return {
    taps,
    phase,
    ticketPose,
    isLandscape,
    pressed,
    burstKey,
    prize,
    error,
    tap,
    reset,
    locked: phase === "revealing" || phase === "celebrating" || phase === "drawing",
  };
}
