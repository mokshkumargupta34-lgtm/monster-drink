import React, { useEffect, useRef } from 'react';

/**
 * Generative animated grid background (self-contained — no external CSS/tokens).
 * Adapted to TypeScript from the DataGridHero component; themed for this project.
 *
 * Renders an absolutely-positioned grid of pulsing cells that fills its nearest
 * positioned ancestor, with an optional mouse-follow glow. Use it as a section
 * background (behind your content).
 */
type AnimationType = 'pulse' | 'wave' | 'random';

interface DataGridHeroProps {
  rows?: number;
  cols?: number;
  spacing?: number;        // gap between cells (px)
  duration?: number;       // pulse duration (s)
  color?: string;          // cell color
  animationType?: AnimationType;
  pulseEffect?: boolean;
  mouseGlow?: boolean;
  opacityMin?: number;
  opacityMax?: number;
  background?: string;     // container background
  glowColor?: string;      // mouse-glow color
  className?: string;
  children?: React.ReactNode;
}

export default function DataGridHero({
  rows = 24,
  cols = 40,
  spacing = 6,
  duration = 5,
  color = '#34d399',
  animationType = 'pulse',
  pulseEffect = true,
  mouseGlow = true,
  opacityMin = 0.05,
  opacityMax = 0.5,
  background = 'transparent',
  glowColor = 'rgba(52,211,153,0.28)',
  className = '',
  children,
}: DataGridHeroProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  // Build the grid cells whenever the config changes
  useEffect(() => {
    const container = gridRef.current;
    if (!container) return;

    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    container.style.gap = `${spacing}px`;

    const total = rows * cols;
    const centerRow = Math.floor(rows / 2);
    const centerCol = Math.floor(cols / 2);

    for (let i = 0; i < total; i++) {
      const cell = document.createElement('div');
      cell.className = 'dgh-cell';
      cell.style.backgroundColor = color;
      cell.style.opacity = String(opacityMin);
      cell.style.setProperty('--opacity-min', String(opacityMin));
      cell.style.setProperty('--opacity-max', String(opacityMax));

      if (pulseEffect) {
        const r = Math.floor(i / cols);
        const c = i % cols;
        let delay: number;
        if (animationType === 'wave') delay = (r + c) * 0.1;
        else if (animationType === 'random') delay = Math.random() * duration;
        else {
          const dr = Math.abs(r - centerRow);
          const dc = Math.abs(c - centerCol);
          delay = Math.sqrt(dr * dr + dc * dc) * 0.2;
        }
        cell.style.animation = `dghCellPulse ${duration}s infinite alternate`;
        cell.style.animationDelay = `${delay.toFixed(3)}s`;
      }

      container.appendChild(cell);
    }
  }, [rows, cols, spacing, color, animationType, pulseEffect, duration, opacityMin, opacityMax]);

  // Mouse-follow glow (reads window mouse, positions relative to the root)
  useEffect(() => {
    const root = gridRef.current?.parentElement;
    if (!mouseGlow || !root) return;
    const handler = (e: MouseEvent) => {
      const rect = root.getBoundingClientRect();
      root.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      root.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [mouseGlow]);

  const rootStyle = {
    background,
    '--mouse-glow-opacity': mouseGlow ? 1 : 0,
    '--dgh-glow': glowColor,
  } as React.CSSProperties;

  return (
    <div className={`dgh-root ${className}`} style={rootStyle}>
      <style>{`
        .dgh-root { position: absolute; inset: 0; overflow: hidden; }
        .dgh-grid { position: absolute; inset: 0; display: grid; }
        .dgh-cell { border-radius: 2px; will-change: opacity; }
        .dgh-glow {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(240px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), var(--dgh-glow, rgba(52,211,153,0.28)), transparent 65%);
          opacity: var(--mouse-glow-opacity, 0);
          transition: opacity 0.3s ease;
        }
        .dgh-content { position: relative; z-index: 1; }
        @keyframes dghCellPulse {
          from { opacity: var(--opacity-min, 0.05); }
          to   { opacity: var(--opacity-max, 0.6); }
        }
      `}</style>
      <div ref={gridRef} className="dgh-grid" aria-hidden="true" />
      <div className="dgh-glow" aria-hidden="true" />
      {children ? <div className="dgh-content">{children}</div> : null}
    </div>
  );
}
