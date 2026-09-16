import { motion } from "framer-motion";
import type { TicketPose } from "./constants";

type Props = {
  pose: TicketPose;
  isLandscape: boolean;
};

const EASE = [0.22, 1, 0.36, 1] as const;

export function Ticket({ pose, isLandscape }: Props) {
  const gilded = pose === "gilded";
  const inFront = pose === "edge" || pose === "landed" || pose === "gilded";

  const poseMotion = {
    pocket: { y: 18, x: 0, rotateY: 0, rotateZ: 0, scale: 1 },
    rising: { y: -58, x: 0, rotateY: 0, rotateZ: 0, scale: 1 },
    edge: { y: -28, x: 18, rotateY: 82, rotateZ: -36, scale: 1 },
    landed: { y: -118, x: 10, rotateY: 0, rotateZ: -8, scale: 1.08 },
    gilded: { y: -118, x: 10, rotateY: 0, rotateZ: -8, scale: 1.08 },
  }[pose];

  return (
    <motion.div
      className="absolute left-1/2 top-0 origin-center"
      style={{
        zIndex: inFront ? 8 : 4,
        transformStyle: "preserve-3d",
        width: isLandscape ? "min(560px, 92vw)" : "84%",
        height: isLandscape ? "min(236px, 42vw)" : "108%",
        marginLeft: isLandscape ? "calc(min(560px, 92vw) / -2)" : "-42%",
        filter: gilded
          ? "drop-shadow(0 18px 28px rgba(201, 146, 30, 0.35))"
          : "drop-shadow(0 16px 24px rgba(0,0,0,0.35))",
      }}
      initial={false}
      animate={poseMotion}
      transition={{
        duration: pose === "edge" ? 0.42 : pose === "rising" ? 0.95 : 0.55,
        ease: pose === "edge" ? [0.4, 0, 0.6, 1] : EASE,
      }}
    >
      <svg
        viewBox={isLandscape ? "0 0 640 270" : "0 0 260 420"}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="ticketPaper" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fffef8" />
            <stop offset="1" stopColor="#f3eee4" />
          </linearGradient>
          <linearGradient id="ticketGold" x1="0" y1="0" x2="0.2" y2="1">
            <stop offset="0" stopColor="#f8e7a8" />
            <stop offset="0.45" stopColor="#e8c45a" />
            <stop offset="1" stopColor="#c4921e" />
          </linearGradient>
        </defs>
        {isLandscape ? (
          <>
            <path
              fill="url(#ticketPaper)"
              fillRule="evenodd"
              d="M20 0 H620 Q640 0 640 20 V250 Q640 270 620 270 H20 Q0 270 0 250 V20 Q0 0 20 0 Z M0 135 a 17 17 0 1 0 0.01 0 M640 135 a 17 17 0 1 0 -0.01 0"
            />
            <motion.path
              fill="url(#ticketGold)"
              fillRule="evenodd"
              d="M20 0 H620 Q640 0 640 20 V250 Q640 270 620 270 H20 Q0 270 0 250 V20 Q0 0 20 0 Z M0 135 a 17 17 0 1 0 0.01 0 M640 135 a 17 17 0 1 0 -0.01 0"
              initial={{ opacity: 0 }}
              animate={{ opacity: gilded ? 1 : 0 }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
          </>
        ) : (
          <path
            fill="url(#ticketPaper)"
            d="M0 34 C6 10 24 2 48 12 C70 2 82 26 104 26 C126 26 138 0 160 0 C182 0 194 26 216 26 C238 26 248 2 260 12 L260 420 L0 420 Z"
          />
        )}
      </svg>

      {isLandscape ? (
        <div className="relative z-10 flex h-full w-full flex-col justify-center px-[10%] py-3">
          <TicketCopy gilded={gilded} />
        </div>
      ) : null}

      {gilded ? (
        <div className="ticket-sheen pointer-events-none absolute inset-0 z-20 mix-blend-soft-light" />
      ) : null}
    </motion.div>
  );
}

function TicketCopy({ gilded }: { gilded: boolean }) {
  const ink = gilded ? "rgba(42, 22, 10, 0.92)" : "rgba(186, 176, 160, 0.3)";
  const inkSoft = gilded ? "rgba(42, 22, 10, 0.7)" : "rgba(186, 176, 160, 0.22)";

  return (
    <div style={{ color: ink, transition: "color 0.95s ease" }}>
      <div className="mb-1 flex items-center justify-between">
        <LeafMark />
        <span className="font-script text-[clamp(1.5rem,3.6vw,2.35rem)] leading-none">
          Goldleaf
        </span>
        <span className="w-9" />
      </div>
      <div className="mb-1 h-px w-full" style={{ background: inkSoft, transition: "background 0.95s ease" }} />
      <p className="font-display text-[clamp(2rem,6vw,3.9rem)] font-bold leading-[0.9] tracking-wide">
        GOLDEN TICKET
      </p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p
          className="font-display text-[0.68rem] font-semibold tracking-[0.2em] sm:text-xs"
          style={{ color: inkSoft, transition: "color 0.95s ease" }}
        >
          THREE TAPS
          <br />
          ADMIT ONE
        </p>
        <p
          className="text-right font-display text-[0.65rem] font-semibold tracking-[0.14em] sm:text-xs"
          style={{ color: inkSoft, transition: "color 0.95s ease" }}
        >
          THE COCOA VAULT
          <br />
          GRAND DRAWING
        </p>
      </div>
    </div>
  );
}

function LeafMark() {
  return (
    <svg viewBox="0 0 40 40" className="h-8 w-8 sm:h-9 sm:w-9" aria-hidden>
      <circle cx="20" cy="20" r="17.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M20 8 C26 14 28 20 24 28 C22 22 20 18 20 12 C20 18 18 22 16 28 C12 20 14 14 20 8 Z"
        fill="currentColor"
      />
    </svg>
  );
}
