import React, { useEffect, useRef } from 'react';

/**
 * Animated flowing wavy lines background (site emerald theme) — canvas based.
 *
 * Rendered on a <canvas> (not SVG) for smoothness: no per-frame SVG filter,
 * additive "lighter" blending gives the glow, each line is drawn as a wide
 * faint halo + a thin bright core. The loop is paused when off-screen and
 * honours prefers-reduced-motion.
 */
const LINE_COUNT = 14;
const STEPS = 32; // segments per line — plenty smooth for gentle sine waves
const GREENS: [number, number, number][] = [
  [16, 185, 129],
  [52, 211, 153],
  [34, 197, 94],
  [74, 222, 128],
  [110, 231, 183],
  [132, 204, 22],
  [163, 230, 53],
];

export default function WavyLines() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const parent = canvas.parentElement;
    if (!ctx || !parent) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    let width = parent.clientWidth;
    let height = parent.clientHeight;
    const resize = () => {
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    const lines = Array.from({ length: LINE_COUNT }, (_, i) => ({
      baseYFrac: 0.5 + (i - LINE_COUNT / 2) * 0.012,
      amp: 40 + Math.random() * 80,
      freq: 1.1 + Math.random() * 1.3,
      phase: Math.random() * Math.PI * 2,
      speed: 0.15 + Math.random() * 0.35, // radians / second
      slope: -70 + Math.random() * 50, // gentle rise toward the right
      drift: 16 + Math.random() * 40,
      driftSpeed: 0.1 + Math.random() * 0.2,
      color: GREENS[i % GREENS.length],
      alpha: 0.22 + (i % 5) * 0.07,
      w: 0.8 + (i % 3) * 0.5,
    }));

    const dots = [0, 1, 2, 3, 4].map((k) => ({
      lineIdx: [2, 5, 8, 10, 12][k],
      offset: Math.random(),
      speed: 0.03 + Math.random() * 0.04,
    }));

    let raf = 0;
    let running = false;
    let last = performance.now();
    let t = 0;

    const yOnLine = (ln: (typeof lines)[number], xn: number, baseY: number) =>
      baseY + (xn - 0.5) * ln.slope + Math.sin(xn * Math.PI * 2 * ln.freq + ln.phase + t * ln.speed) * ln.amp;

    const drawFrame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05); // clamp big gaps (tab switches)
      last = now;
      t += dt;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';

      const baseYs: number[] = [];
      for (let i = 0; i < lines.length; i++) {
        const ln = lines[i];
        const baseY = height * ln.baseYFrac + Math.sin(t * ln.driftSpeed + ln.phase) * ln.drift;
        baseYs[i] = baseY;

        ctx.beginPath();
        for (let j = 0; j <= STEPS; j++) {
          const xn = j / STEPS;
          const x = xn * width;
          const y = yOnLine(ln, xn, baseY);
          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const [r, g, b] = ln.color;
        // soft halo
        ctx.strokeStyle = `rgba(${r},${g},${b},${ln.alpha * 0.4})`;
        ctx.lineWidth = ln.w * 5;
        ctx.stroke();
        // bright core
        ctx.strokeStyle = `rgba(${r},${g},${b},${ln.alpha})`;
        ctx.lineWidth = ln.w;
        ctx.stroke();
      }

      for (const d of dots) {
        const ln = lines[d.lineIdx];
        const xn = ((t * d.speed + d.offset) % 1 + 1) % 1;
        const x = xn * width;
        const y = yOnLine(ln, xn, baseYs[d.lineIdx]);
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 7);
        grad.addColorStop(0, 'rgba(217,249,157,0.85)');
        grad.addColorStop(1, 'rgba(217,249,157,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
    };

    const loop = (now: number) => {
      drawFrame(now);
      if (running) raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running || reduce) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // Only animate while the hero is actually visible (on screen AND not
    // scrolled past — the hero is sticky, so it always "intersects").
    let ioVisible = true;
    const sync = () => {
      const belowHero = window.scrollY > window.innerHeight * 1.1;
      if (ioVisible && !belowHero) start();
      else stop();
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        ioVisible = entry.isIntersecting;
        sync();
      },
      { threshold: 0 },
    );
    io.observe(canvas);
    window.addEventListener('scroll', sync, { passive: true });

    if (reduce) drawFrame(performance.now()); // single static frame

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('scroll', sync);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
