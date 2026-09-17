import { Link } from "react-router-dom";

export function AlreadyPlayed() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-y-auto bg-[#2a1148] px-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(82,32,128,0.5)_0%,_#2a1148_62%)]" />
      <main className="relative w-full max-w-lg border border-[#d9c89a]/25 bg-[#1b0a30]/55 px-6 py-10 text-center sm:px-10">
        <p className="gold-text font-script text-4xl">Goldleaf</p>
        <h1 className="mt-5 font-display text-2xl font-semibold tracking-[0.16em] text-[#ffd4c8] sm:text-3xl">
          you have played before
        </h1>
        <p className="mt-4 font-body text-base leading-relaxed text-[#f4e7c5]/80 sm:text-lg">
          This email is already on the list. Each guest unwraps one Goldleaf bar.
        </p>
        <Link
          to="/"
          className="mt-8 inline-block border border-[#d9c89a]/70 px-5 py-2 font-display text-[0.7rem] tracking-[0.28em] text-[#f2e6c4] transition hover:border-[#f3dd8a] hover:text-white"
        >
          BACK TO THE DOOR
        </Link>
      </main>
    </div>
  );
}
