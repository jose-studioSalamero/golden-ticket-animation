import { motion } from "framer-motion";
import { FOIL_BANDS, TEAR_CLIPS } from "./constants";

type Props = {
  taps: number;
};

export function WrapperArt({ taps }: Props) {
  const clip = TEAR_CLIPS[taps] ?? TEAR_CLIPS[0];
  const foil = FOIL_BANDS[taps] ?? FOIL_BANDS[0];

  return (
    <svg
      viewBox="0 0 300 420"
      className="pointer-events-none absolute inset-0 z-[6] h-full w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="paperPink" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f07ee0" />
          <stop offset="0.45" stopColor="#d85fd0" />
          <stop offset="1" stopColor="#c44ec4" />
        </linearGradient>
        <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f8e7a8" />
          <stop offset="0.5" stopColor="#e0b84a" />
          <stop offset="1" stopColor="#a67c1f" />
        </linearGradient>
        <linearGradient id="foilGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6f3ee" />
          <stop offset="0.35" stopColor="#c9c6c0" />
          <stop offset="0.7" stopColor="#f2f0ea" />
          <stop offset="1" stopColor="#9a9790" />
        </linearGradient>
        <filter id="crinkle" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="4"
            seed="7"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="7"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter id="paperGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="2" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.18" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" mode="multiply" />
        </filter>
        <clipPath id="wrapClip">
          <motion.path
            d={clip}
            initial={false}
            animate={{ d: clip }}
            transition={{ duration: 0.28, ease: [0.2, 0.85, 0.2, 1] }}
          />
        </clipPath>
      </defs>

      <g clipPath="url(#wrapClip)" filter="url(#paperGrain)">
        <rect width="300" height="420" fill="url(#paperPink)" />
        <path
          fill="#4a2774"
          d="M-30 20 C40 -10 90 70 48 150 C10 210 -40 170 -20 90 C-10 50 -40 40 -30 20 Z"
        />
        <path
          fill="#3d1f68"
          d="M80 40 C140 10 190 50 210 120 C230 190 170 230 120 200 C70 170 50 90 80 40 Z"
        />
        <path
          fill="#5c3388"
          d="M210 -10 C280 -20 330 40 300 110 C270 170 220 150 200 90 C185 40 175 10 210 -10 Z"
        />
        <path
          fill="#45206f"
          d="M-10 210 C50 180 90 250 40 320 C-10 380 -40 300 -20 250 C-10 230 -20 220 -10 210 Z"
        />
        <path
          fill="#5a2d82"
          d="M160 250 C230 220 310 280 280 360 C250 430 170 410 140 350 C120 310 120 270 160 250 Z"
        />
        <path
          fill="#3a1860"
          d="M90 140 C130 120 150 180 120 210 C90 240 70 200 90 140 Z"
        />
        <path
          fill="#6a3a96"
          d="M240 180 C290 160 310 230 270 270 C230 300 210 220 240 180 Z"
        />
        <rect width="18" height="420" fill="rgba(255,255,255,0.08)" />

        <g transform="translate(150 200)">
          <g transform="translate(0 -78)">
            <path
              fill="url(#goldFill)"
              d="M0 -28 C8 -18 10 -6 6 6 C2 16 -2 16 -6 6 C-10 -6 -8 -18 0 -28 Z"
            />
            <path
              fill="#7a4e12"
              d="M0 -4 C2 6 1 16 0 26 C-1 16 -2 6 0 -4 Z"
              opacity="0.55"
            />
            <path
              fill="url(#goldFill)"
              d="M-18 2 C-6 -10 4 -8 8 6 C0 4 -8 10 -18 2 Z"
            />
            <path
              fill="url(#goldFill)"
              d="M18 2 C6 -10 -4 -8 -8 6 C0 4 8 10 18 2 Z"
            />
          </g>
          <text
            textAnchor="middle"
            y="8"
            fill="url(#goldFill)"
            fontFamily="Cinzel, serif"
            fontSize="36"
            fontWeight="700"
            letterSpacing="1.5"
          >
            GOLDLEAF
          </text>
          <text
            textAnchor="middle"
            y="36"
            fill="#f3dd8a"
            fontFamily="Cormorant Garamond, serif"
            fontSize="13"
            letterSpacing="6"
          >
            CONFECTIONERY
          </text>
          <path
            fill="#3d1c10"
            d="M-62 42 C-58 58 -60 78 -54 96 C-50 108 -62 110 -60 96 C-62 78 -66 58 -62 42 Z"
          />
          <path
            fill="#4a2416"
            d="M-28 44 C-24 70 -26 92 -20 118 C-16 132 -30 132 -28 116 C-30 92 -32 70 -28 44 Z"
          />
          <path
            fill="#3d1c10"
            d="M6 42 C10 62 8 88 14 112 C18 124 4 124 6 110 C4 86 2 62 6 42 Z"
          />
          <path
            fill="#4a2416"
            d="M40 44 C44 66 42 86 48 104 C52 116 38 116 40 102 C38 84 36 66 40 44 Z"
          />
          <path
            fill="#3d1c10"
            d="M72 42 C76 56 74 74 80 90 C84 100 70 100 72 88 C70 72 68 56 72 42 Z"
          />
          <text
            textAnchor="middle"
            y="118"
            fill="url(#goldFill)"
            fontFamily="Great Vibes, cursive"
            fontSize="42"
          >
            Golden Bar
          </text>
        </g>
      </g>

      <motion.path
        d={foil}
        fill="url(#foilGrad)"
        filter="url(#crinkle)"
        initial={false}
        animate={{ d: foil }}
        transition={{ duration: 0.28, ease: [0.2, 0.85, 0.2, 1] }}
        opacity={0.96}
      />
      <motion.path
        d={foil}
        fill="none"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="1.2"
        initial={false}
        animate={{ d: foil }}
        transition={{ duration: 0.28, ease: [0.2, 0.85, 0.2, 1] }}
      />
    </svg>
  );
}
