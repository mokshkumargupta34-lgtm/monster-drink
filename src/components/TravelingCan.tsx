import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Zap, ShieldCheck } from 'lucide-react';
import imgClassicCan from '../assets/images/monster_hero_can.png';

/**
 * The hero can that travels from page 1 into page 2's collage.
 *
 * While travelling it is `position: fixed` and JS-homed onto the landing anchor
 * (#popout-can-target). The moment it fully docks it switches to `position:
 * absolute` INSIDE page 2 with a static transform, so from then on it scrolls
 * *natively* with the section (no per-frame JS = no scroll jitter/lag).
 *
 * DOCK_LEFT / DOCK_TOP / DOCK_SCALE / DOCK_ROTATE must match the resting state
 * that the homing animation ends on (and #popout-can-target's position).
 */
const DOCK_LEFT = '56%';
const DOCK_TOP = '34%';
/** How much the can shrinks over the flight from page 1 into page 2's collage. */
const DOCK_SHRINK = 0.68;
/** Resting size in the collage. Must equal the travel end scale — hence shared. */
const DOCK_SCALE = 1 - DOCK_SHRINK;
export const DOCK_ROTATE = 13; // outer rotate at full dock (opposite lean)
/** Constant lean baked into every travelFloat keyframe below. */
export const FLOAT_ROTATE = -6;
const DOCK_THRESHOLD = 0.999;

/**
 * Feathers the PNG's black edges away. Page 3's chamber can wears the identical
 * mask, so when this can flies in and cross-fades onto it the two are the same
 * pixels — a morph, not a dissolve. Change here and it changes there.
 */
export const CAN_EDGE_MASK = {
  WebkitMaskImage:
    'linear-gradient(to right, transparent, #000 13%, #000 87%, transparent), linear-gradient(to bottom, transparent, #000 6%, #000 92%, transparent)',
  WebkitMaskComposite: 'source-in',
  maskImage:
    'linear-gradient(to right, transparent, #000 13%, #000 87%, transparent), linear-gradient(to bottom, transparent, #000 6%, #000 92%, transparent)',
  maskComposite: 'intersect',
} as const;

export default function TravelingCan() {
  const ref = useRef<HTMLDivElement>(null);
  const badgesRef = useRef<HTMLDivElement>(null);
  const [docked, setDocked] = useState(false);
  const dockedRef = useRef(false);

  // Compute + apply the can transform for the current scroll position.
  const applyTransform = () => {
    const el = ref.current;
    if (!el) return;
    const vh = window.innerHeight || 800;
    const vw = window.innerWidth || 1200;
    const y = window.scrollY;
    const dock = Math.min(1, Math.max(0, y / (vh * 0.85)));

    if (dock >= DOCK_THRESHOLD) {
      // Docked: static transform; the element itself is `absolute` and scrolls
      // natively with page 2 — nothing to track per frame.
      el.style.transform = `translate(-50%, -50%) scale(${DOCK_SCALE}) rotate(${DOCK_ROTATE}deg)`;
      return;
    }

    // Travelling: fixed + homed onto the landing anchor.
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
    const scale = 1 - s * DOCK_SHRINK;
    el.style.transform =
      `translate(${cx}px, ${cy}px) translate(-50%, -50%) scale(${scale}) rotate(${s * 13}deg)`;
    if (badgesRef.current) {
      badgesRef.current.style.opacity = String(Math.max(0, 1 - dock * 2.2));
    }
  };

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight || 800;
      const dock = Math.min(1, Math.max(0, window.scrollY / (vh * 0.85)));
      const nowDocked = dock >= DOCK_THRESHOLD;
      if (nowDocked !== dockedRef.current) {
        dockedRef.current = nowDocked;
        setDocked(nowDocked); // flips position: fixed <-> absolute
      }
      applyTransform();
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

  // Re-apply the correct transform synchronously right after the fixed<->absolute
  // switch re-renders, so the mode change never flashes a wrong position.
  useLayoutEffect(() => {
    applyTransform();
  }, [docked]);

  return (
    <div
      ref={ref}
      className={
        docked
          ? 'absolute z-20 w-[92vw] max-w-[720px] pointer-events-none'
          : 'fixed left-0 top-0 z-20 w-[92vw] max-w-[720px] pointer-events-none will-change-transform'
      }
      style={docked ? { left: DOCK_LEFT, top: DOCK_TOP } : undefined}
    >
      {/* Levitating can (frameless; black edges feathered away) */}
      <div className="relative w-full" style={{ animation: 'travelFloat 2.4s ease-in-out infinite' }}>
        <img
          src={imgClassicCan}
          alt="Monster Energy Classic Can"
          className="w-full h-auto object-contain pointer-events-none"
          referrerPolicy="no-referrer"
          style={CAN_EDGE_MASK}
        />
      </div>

      {/* Floating info badges (only while travelling; fade out as the can docks) */}
      {!docked && (
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
      )}

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
