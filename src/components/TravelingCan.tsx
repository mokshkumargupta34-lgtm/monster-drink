import React, { useEffect, useRef } from 'react';
import { Zap, ShieldCheck } from 'lucide-react';
import imgClassicCan from '../assets/images/monster_hero_can.png';

/**
 * App-level overlay of the hero can. Lives above the sliding sections (below the
 * header) so it stays visible while page 2 rises over the pinned hero, then homes
 * smoothly onto the PopOut section's landing anchor (#popout-can-target).
 * Driven by rAF + direct DOM writes for a buttery, jank-free scrub.
 */
export default function TravelingCan() {
  const ref = useRef<HTMLDivElement>(null);
  const badgesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const vh = window.innerHeight || 800;
      const vw = window.innerWidth || 1200;
      const y = window.scrollY;

      // Docking progress 0 → 1 over ~0.85 viewport, smoothstepped
      const dock = Math.min(1, Math.max(0, y / (vh * 0.85)));
      const s = dock * dock * (3 - 2 * dock);

      const homeX = vw / 2;
      const homeY = vh / 2 + 28;
      let tgtX = homeX;
      let tgtY = homeY;
      const target = document.getElementById('popout-can-target');
      if (target) {
        const r = target.getBoundingClientRect();
        tgtX = r.left + r.width / 2;
        tgtY = r.top + r.height / 2;
      }

      const cx = homeX + (tgtX - homeX) * s;
      const cy = homeY + (tgtY - homeY) * s;
      const scale = 1 - s * 0.58; // shrinks more as it docks into page 2

      // Fade out once fully docked and the target is scrolling off the top
      let op = 1;
      if (s > 0.98 && tgtY < vh * 0.18) {
        op = Math.max(0, (tgtY + vh * 0.12) / (vh * 0.3));
      }

      if (ref.current) {
        // Base lean is -6deg (in the hero); rotate the opposite way as it docks
        ref.current.style.transform =
          `translate(${cx}px, ${cy}px) translate(-50%, -50%) scale(${scale}) rotate(${s * 13}deg)`;
        ref.current.style.opacity = String(op);
      }
      if (badgesRef.current) {
        badgesRef.current.style.opacity = String(Math.max(0, 1 - dock * 2.2));
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="fixed left-0 top-0 z-10 w-[92vw] max-w-[720px] pointer-events-none will-change-transform"
      style={{ transform: 'translate(50vw, calc(50vh + 28px)) translate(-50%, -50%)' }}
    >
      {/* Levitating can (frameless; black edges feathered away) */}
      <div className="relative w-full" style={{ animation: 'travelFloat 2.4s ease-in-out infinite' }}>
        <img
          src={imgClassicCan}
          alt="Monster Energy Classic Can"
          className="w-full h-auto object-contain pointer-events-none"
          referrerPolicy="no-referrer"
          style={{
            WebkitMaskImage:
              'linear-gradient(to right, transparent, #000 13%, #000 87%, transparent), linear-gradient(to bottom, transparent, #000 6%, #000 92%, transparent)',
            WebkitMaskComposite: 'source-in',
            maskImage:
              'linear-gradient(to right, transparent, #000 13%, #000 87%, transparent), linear-gradient(to bottom, transparent, #000 6%, #000 92%, transparent)',
            maskComposite: 'intersect',
          }}
        />
      </div>

      {/* Floating info badges (fade out as the can travels) */}
      <div ref={badgesRef} className="will-change-[opacity]">
        <div className="absolute top-[20%] -right-2 md:right-2 lg:-right-8 z-20 bg-zinc-900/90 border border-emerald-500/40 rounded-lg p-3 backdrop-blur-md shadow-xl max-w-[150px] hidden sm:block">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Zap className="w-4 h-4" />
            <span className="font-mono text-[9px] font-bold uppercase tracking-wider">MAX BOOST</span>
          </div>
          <p className="text-[10px] text-zinc-400 font-mono mt-1 text-left">Ginseng + B-Vitamins</p>
        </div>

        <div className="absolute bottom-[22%] -left-2 md:left-2 lg:-left-8 z-20 bg-zinc-900/90 border border-emerald-500/40 rounded-lg p-3 backdrop-blur-md shadow-xl max-w-[150px] hidden sm:block">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="font-mono text-[9px] font-bold uppercase tracking-wider">TAURINE PACKED</span>
          </div>
          <p className="text-[10px] text-zinc-400 font-mono mt-1 text-left">1000mg per can</p>
        </div>
      </div>

      <style>{`
        /* Figma "flow" motion: ~10px rise + subtle ±2px sway, 2s loop */
        @keyframes travelFloat {
          0%   { transform: translate(0px, 0px) rotate(-6deg); }
          30%  { transform: translate(-2px, -6px) rotate(-6deg); }
          62%  { transform: translate(1px, -10px) rotate(-6deg); }
          82%  { transform: translate(2px, -5px) rotate(-6deg); }
          100% { transform: translate(0px, 0px) rotate(-6deg); }
        }
      `}</style>
    </div>
  );
}
