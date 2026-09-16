import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vr: number;
  color: string;
  rain: boolean;
};

const COLORS = ["#5ec8ff", "#ff9a3c", "#ffe14a", "#7d5cff", "#3dff8a", "#ff5ea8", "#f0f0f0"];

function spawnBurst(cx: number, cy: number, count: number): Particle[] {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2.2 + Math.random() * 6.4;
    return {
      x: cx + (Math.random() - 0.5) * 40,
      y: cy + (Math.random() - 0.5) * 30,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3.2,
      w: 3 + Math.floor(Math.random() * 5),
      h: 3 + Math.floor(Math.random() * 5),
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.28,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
      rain: false,
    };
  });
}

function spawnRain(width: number, count: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: -12 - Math.random() * 80,
    vx: (Math.random() - 0.5) * 0.6,
    vy: 1.1 + Math.random() * 1.8,
    w: 3 + Math.floor(Math.random() * 4),
    h: 3 + Math.floor(Math.random() * 4),
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.12,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
    rain: true,
  }));
}

type Props = {
  burstKey: number;
  raining: boolean;
};

export function ConfettiLayer({ burstKey, raining }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const rainingRef = useRef(raining);

  useEffect(() => {
    rainingRef.current = raining;
  }, [raining]);

  useEffect(() => {
    if (burstKey === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    particles.current.push(...spawnBurst(rect.width / 2, rect.height * 0.42, 70));
  }, [burstKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let running = true;
    let lastRain = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = (now: number) => {
      if (!running) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      if (rainingRef.current && now - lastRain > 180) {
        particles.current.push(...spawnRain(w, 8));
        lastRain = now;
      }

      particles.current = particles.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.rain ? 0.012 : 0.12;
        p.vx *= 0.995;
        p.rot += p.vr;
        if (p.y > h + 20 || p.x < -20 || p.x > w + 20) return false;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
        return true;
      });

      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);

    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-30 h-full w-full"
      aria-hidden
    />
  );
}
