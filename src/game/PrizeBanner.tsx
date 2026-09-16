import { motion } from "framer-motion";

type Props = {
  visible: boolean;
};

export function PrizeBanner({ visible }: Props) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center"
      initial={false}
      animate={{ y: visible ? 0 : 140, opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="w-full max-w-xl px-6 pb-5 pt-6 text-center shadow-[0_-12px_40px_rgba(0,0,0,0.25)]"
        style={{
          background:
            "linear-gradient(180deg, #f4e19a 0%, #e0b84a 48%, #c4921e 100%)",
        }}
      >
        <p className="font-display text-2xl font-semibold tracking-[0.28em] text-[#4a2a12] sm:text-3xl">
          GRAND PRIZE
        </p>
        <p className="mx-auto mt-2 max-w-md font-body text-sm leading-snug text-[#5a3216] sm:text-base">
          You found the Golden Ticket. Three taps unwrapped a Goldleaf bar —
          and one extraordinary prize.
        </p>
      </div>
    </motion.div>
  );
}
