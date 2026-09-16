const LABELS = [
  "CACAO NOIR",
  "GOLDLEAF",
  "SINGLE ORIGIN",
  "THE VAULT",
  "ADMIT ONE",
  "GRAND DRAW",
];

export function ChocolateSquares() {
  return (
    <div className="absolute inset-0 grid grid-cols-2 grid-rows-3 gap-[3px] bg-[#2a140c] p-[3px]">
      {LABELS.map((label) => (
        <div key={label} className="chocolate-piece relative overflow-hidden">
          <span className="absolute inset-0 z-10 flex items-center justify-center text-[7px] font-semibold tracking-[0.18em] text-[#3d2216]/80 [writing-mode:vertical-rl] rotate-180">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
