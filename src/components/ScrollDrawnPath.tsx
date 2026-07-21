import React, { useEffect, useRef, useState } from 'react';

/**
 * Scroll-drawn serpentine SVG line. Generated responsively from the parent's
 * width/height, drawn via the stroke-dashoffset technique tied to how far you've
 * scrolled through the parent (progress 0 → 1), with a glowing comet at the
 * leading tip. Sits behind the content (z-index:-1) and never blocks pointers.
 * Honours prefers-reduced-motion (shows fully drawn, static).
 */
export default function ScrollDrawnPath() {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const cometRef = useRef<SVGCircleElement>(null);
  const lenRef = useRef(0);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [d, setD] = useState('');

  // Build a responsive serpentine path from the container size
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const build = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      const midX = w / 2;
      const amp = w * 0.4; // weave nearly edge to edge
      const waves = Math.max(4, Math.round(h / 700)); // half-cycles scale with height
      const step = 14;
      let path = '';
      for (let y = 0; y <= h; y += step) {
        const x = midX + Math.sin((y / h) * Math.PI * waves) * amp;
        path += (y === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
      }
      setDims({ w, h });
      setD(path);
    };

    build();
    const ro = new ResizeObserver(build);
    ro.observe(el);
    window.addEventListener('resize', build);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', build);
    };
  }, []);

  // Prime the dash once the path exists
  useEffect(() => {
    const p = pathRef.current;
    if (!p || !d) return;
    const len = p.getTotalLength();
    lenRef.current = len;
    p.style.strokeDasharray = String(len);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    p.style.strokeDashoffset = reduce ? '0' : String(len);
  }, [d]);

  // Draw on scroll (rAF-throttled)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;

    const update = () => {
      raf = 0;
      const el = rootRef.current;
      const p = pathRef.current;
      const len = lenRef.current;
      if (!el || !p || !len) return;

      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = Math.max(1, rect.height - vh);
      const progress = reduce ? 1 : Math.min(1, Math.max(0, -rect.top / total));

      p.style.strokeDashoffset = String(len * (1 - progress));

      const c = cometRef.current;
      if (c) {
        const pt = p.getPointAtLength(len * progress);
        c.setAttribute('cx', String(pt.x));
        c.setAttribute('cy', String(pt.y));
        c.style.opacity = progress > 0.002 && progress < 0.998 ? '1' : '0';
      }
    };

    update();
    if (!reduce) {
      const onScroll = () => {
        if (!raf) raf = requestAnimationFrame(update);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
        if (raf) cancelAnimationFrame(raf);
      };
    }
  }, [d]);

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 z-[5] mix-blend-screen overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${dims.w || 1} ${dims.h || 1}`}
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="sdpGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="45%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#84cc16" />
          </linearGradient>
        </defs>

        <path
          ref={pathRef}
          d={d}
          fill="none"
          stroke="url(#sdpGrad)"
          strokeWidth={8}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        <circle
          ref={cometRef}
          r={7}
          fill="#eafcbf"
          style={{ filter: 'drop-shadow(0 0 12px rgba(163,230,53,0.95))', opacity: 0 }}
        />
      </svg>
    </div>
  );
}
