import { motion } from "framer-motion";
import { ChocolateSquares } from "./ChocolateSquares";
import { ConfettiLayer } from "./ConfettiLayer";
import { PrizeBanner } from "./PrizeBanner";
import { Ticket } from "./Ticket";
import { useGame } from "./useGame";
import { WrapperArt } from "./WrapperArt";

export function Game() {
  const game = useGame();
  const celebrating = game.phase === "celebrating";
  const revealing = game.phase === "revealing" || celebrating;
  const showIntro = !revealing;

  return (
    <div className="relative h-svh w-full overflow-hidden bg-[#2a1148]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(58,22,96,0.9)_0%,_#2a1148_62%)]" />

      <ConfettiLayer burstKey={game.burstKey} raining={celebrating} />

      <motion.header
        className="relative z-10 px-6 pt-8 text-center sm:pt-12"
        animate={{ opacity: showIntro ? 1 : 0, y: showIntro ? 0 : -12 }}
        transition={{ duration: 0.45 }}
      >
        <h1 className="gold-text font-display text-[clamp(0.95rem,2.4vw,1.35rem)] font-semibold tracking-[0.18em]">
          FIND THE GOLDEN TICKET
        </h1>
        <p className="gold-text mx-auto mt-1 max-w-xl font-display text-[clamp(0.95rem,2.4vw,1.35rem)] font-semibold tracking-[0.16em]">
          HIDDEN IN A SINGLE GOLDLEAF BAR
        </p>
      </motion.header>

      <motion.p
        className="gold-text pointer-events-none absolute inset-x-0 top-8 z-10 text-center font-display text-[clamp(1.4rem,3vw,2.1rem)] font-semibold tracking-[0.12em] sm:top-10"
        initial={{ opacity: 0, y: -8 }}
        animate={{
          opacity: celebrating ? 1 : 0,
          y: celebrating ? 0 : -8,
        }}
        transition={{ duration: 0.5, delay: celebrating ? 0.05 : 0 }}
      >
        CONGRATULATIONS!
      </motion.p>

      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <motion.div
          className="relative"
          animate={{
            scale: revealing ? 1.12 : 1,
            y: revealing ? 28 : 0,
          }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ perspective: 1200, perspectiveOrigin: "50% 40%" }}
        >
          <div className="stage-glow pointer-events-none absolute left-1/2 top-1/2 h-[130%] w-[160%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(255,196,90,0.55)_0%,_rgba(255,170,40,0.12)_38%,_transparent_70%)] blur-2xl" />

          <motion.button
            type="button"
            aria-label={
              game.taps === 0
                ? "Tap the chocolate bar to start unwrapping"
                : game.taps < 3
                  ? `Tap to keep unwrapping, ${3 - game.taps} taps left`
                  : "Golden ticket revealing"
            }
            onClick={game.tap}
            disabled={game.locked}
            className={`relative isolate block ${
              game.ticketPose === "pocket" ? "overflow-hidden" : "overflow-visible"
            }`}
            style={{
              width: "min(300px, 64vw)",
              height: "calc(min(300px, 64vw) * 1.4)",
              cursor: game.locked ? "default" : "pointer",
              transformStyle: "preserve-3d",
              touchAction: "manipulation",
            }}
            animate={
              game.taps === 0 && !game.pressed
                ? { scale: 1, rotateZ: 0, y: [0, -6, 0] }
                : { scale: game.pressed ? 0.965 : 1, rotateZ: game.pressed ? -0.6 : 0, y: 0 }
            }
            transition={
              game.taps === 0 && !game.pressed
                ? { y: { duration: 3.4, repeat: Infinity, ease: "easeInOut" } }
                : { type: "spring", stiffness: 420, damping: 22 }
            }
          >
            <div className="absolute inset-0 rounded-[4px] shadow-[0_24px_50px_rgba(0,0,0,0.45)]" />
            <ChocolateSquares />
            <Ticket pose={game.ticketPose} isLandscape={game.isLandscape} />
            <WrapperArt taps={game.taps} />
          </motion.button>
        </motion.div>
      </div>

      <motion.div
        className="absolute inset-x-0 bottom-8 z-10 flex flex-col items-center gap-4 px-4 sm:bottom-10"
        animate={{ opacity: showIntro ? 1 : 0, y: showIntro ? 0 : 16 }}
        transition={{ duration: 0.4 }}
      >
        <p className="font-display text-[clamp(0.8rem,2vw,1.05rem)] tracking-[0.28em] text-[#f2e6c4]">
          TAP TO UNWRAP YOUR PRIZE
        </p>
        <button
          type="button"
          onClick={game.reset}
          className="border border-[#d9c89a]/70 px-5 py-1.5 font-display text-[0.7rem] tracking-[0.28em] text-[#f2e6c4] transition hover:border-[#f3dd8a] hover:text-white"
        >
          BACK
        </button>
      </motion.div>

      {celebrating ? (
        <button
          type="button"
          onClick={game.reset}
          className="absolute right-5 top-6 z-30 border border-[#f3dd8a]/70 px-4 py-1.5 font-display text-[0.65rem] tracking-[0.24em] text-[#f3dd8a] transition hover:bg-white/5"
        >
          PLAY AGAIN
        </button>
      ) : null}

      <PrizeBanner visible={celebrating} />
    </div>
  );
}
