import React, { useEffect, useRef } from 'react';
import imgJungle from '../assets/images/monster_jungle_bg.png';
import imgMango from '../assets/images/monster_mango_loco_pop.png';
import imgBadApple from '../assets/images/monster_bad_apple_pop.png';
import TravelingCan from './TravelingCan';

/**
 * Page 2 — "UNLEASH THE LIQUID LIGHTING" jungle collage (from Figma).
 * The green classic can woven between UNLEASH / THE is the landing slot
 * (#popout-can-target) that the hero's travelling can docks into, before rising
 * out of frame with the others in phase 2.
 *
 * The section is POPOUT_SECTION_VH tall with an h-screen sticky "stage" inside,
 * so page 2 pins for POPOUT_PIN_VH of scrolling. That pinned scroll scrubs the
 * whole exit into page 3:
 *   phase 1 — UNLEASH + LIQUID fly off left, THE + LIGHTNING fly off right
 *   phase 2 — once the type is gone, the cans clear: green and red rise, blue drops
 *   phase 3 — the camera pushes through the jungle gap: everything left scales
 *             past the viewport edges while page 3 fades up in place behind it
 * Everything that moves in phases 1–2 sits BEHIND the jungle frame, so it is
 * swallowed by the foliage on the way out.
 *
 * Page 2 draws no background of its own — the black comes from the reveal
 * wrapper behind it (see App.tsx), which is what phase 3 uncovers.
 */

/** How far page 2 stays pinned, and its total height, in viewport heights. */
export const POPOUT_PIN_VH = 200;
export const POPOUT_SECTION_VH = 100 + POPOUT_PIN_VH;

/**
 * The closing stretch of the pin: the camera push, and page 3 fading up from
 * nothing. App.tsx pins page 3 for exactly this distance so it holds still on
 * screen and only its opacity changes — it never slides into view.
 */
export const POPOUT_ZOOM_VH = 100;

/** The pinned page-3 layer that phase 3 fades up. Owned by App.tsx. */
export const POPOUT_REVEAL_ID = 'popout-reveal';

/**
 * The resting lean of page 3's can, in degrees. Part of the hand-off contract:
 * the flight has to end on exactly this angle, so the chamber reads it from
 * here rather than styling a tilt of its own.
 */
export const CHAMBER_CAN_TILT = 8;

const ZOOM_START = (POPOUT_PIN_VH - POPOUT_ZOOM_VH) / POPOUT_PIN_VH;
const ZOOM_MAX_SCALE = 3.4; // well past the ~2.2 that clears the foliage frame
// Dissolve, in zoom-phase progress — starts once the foliage is off the edges.
const ZOOM_FADE_START = 0.45;
const ZOOM_FADE_SPAN = 0.5;
// Page 3 fades up over the same window, reaching full before the pin releases.
const REVEAL_FADE_START = 0.1;
const REVEAL_FADE_SPAN = 0.75;
/**
 * Opacity at which page 3 starts accepting clicks.
 *
 * Not 1. The fade only reaches full at the very end of the zoom, so gating on
 * "fully opaque" left a long stretch where page 3 was drawn at 90–99% — visually
 * finished — and silently swallowed every click on its controls. Page 2 sets
 * pointer-events: none on itself, so there is nothing underneath to protect;
 * this only needs to be high enough that you can see what you are aiming at.
 */
const REVEAL_INTERACTIVE_AT = 0.6;

// Phase windows in pinned-scroll progress (0 → 1 across the sticky travel),
// expressed against ZOOM_START so phases 1–2 always finish before the zoom.
const TYPE_START = ZOOM_START * 0.06;
const TYPE_SPAN = ZOOM_START * 0.44;
const CANS_START = ZOOM_START * 0.54;
const CANS_SPAN = ZOOM_START * 0.42;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (v: number) => v * v * (3 - 2 * v);


export default function PopOutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const unleashRef = useRef<HTMLDivElement>(null);
  const liquidRef = useRef<HTMLDivElement>(null);
  const lightningRef = useRef<HTMLDivElement>(null);
  const redCanRef = useRef<HTMLDivElement>(null);
  const blueCanRef = useRef<HTMLDivElement>(null);
  const theRef = useRef<HTMLDivElement>(null);
  const canFlightRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLElement | null>(null);

  // How far the green can rises to leave the frame. Measured lazily — see
  // measureGreenExit — because it is still travelling when measure() runs.
  const greenExit = useRef(0);

  // Exit distance (px) each element needs to fully clear the frame, measured from
  // its resting box so the motion fills its phase window at every viewport size.
  const exits = useRef({ unleash: 0, liquid: 0, lightning: 0, the: 0, red: 0, blue: 0 });

  useEffect(() => {
    let raf = 0;

    // Read each resting box with the scroll transforms momentarily cleared, and
    // express it against the stage rather than the viewport so the numbers hold
    // wherever the page happens to be scrolled when this runs. The clear +
    // restore happen in one task, so nothing is ever painted mid-measure.
    const measure = () => {
      const stage = stageRef.current;
      const camera = cameraRef.current;
      if (!stage || !camera) return;
      const vh = window.innerHeight || 800;
      const vw = window.innerWidth || 1200;
      const all = [unleashRef, liquidRef, lightningRef, theRef, redCanRef, blueCanRef];
      const savedCamera = camera.style.transform;
      const saved = all.map((r) => r.current?.style.transform ?? '');
      camera.style.transform = 'none';
      all.forEach((r) => {
        if (r.current) r.current.style.transform = 'none';
      });
      const box = stage.getBoundingClientRect();
      // Measure the painted child, not the wrapper: the child carries the
      // -50%/-50% centring transform, so the wrapper's own box sits half an
      // element off from what you actually see.
      const [unleash, liquid, lightning, the, red, blue] = all.map((r) =>
        r.current?.firstElementChild?.getBoundingClientRect(),
      );
      camera.style.transform = savedCamera;
      all.forEach((r, i) => {
        if (r.current) r.current.style.transform = saved[i];
      });

      const padX = vw * 0.06;
      const padY = vh * 0.08;
      exits.current = {
        unleash: unleash ? unleash.right - box.left + padX : vw,
        liquid: liquid ? liquid.right - box.left + padX : vw,
        lightning: lightning ? box.right - lightning.left + padX : vw,
        the: the ? box.right - the.left + padX : vw,
        red: red ? red.bottom - box.top + padY : vh,
        blue: blue ? box.bottom - blue.top + padY : vh,
      };
    };

    // How far the green can must rise to clear the frame. Not measurable in
    // measure(): the can is still `fixed` and travelling in from page 1 then,
    // and only settles into its docked box later.
    const measureGreenExit = () => {
      const stage = stageRef.current;
      const wrap = canFlightRef.current;
      const img = wrap?.querySelector('img');
      if (!stage || !wrap || !img) return;

      // Only measure once the can has actually docked. It switches to `absolute`
      // via React state, so on the first frame after a jump-scroll — or a reload
      // partway down — it is still `fixed` at left-0/top-0 while already wearing
      // its docked transform, which puts it at roughly (0,0). Caching that would
      // give an exit distance far too short. Retry next frame.
      const canEl = wrap.firstElementChild as HTMLElement | null;
      if (!canEl || getComputedStyle(canEl).position !== 'absolute') return;

      // The can PNG is several megabytes; until it decodes the img is h-auto off
      // an unknown intrinsic size and measures 0 tall. Retry instead.
      if (!img.complete || img.naturalHeight === 0) return;

      const savedTransform = wrap.style.transform;
      wrap.style.transform = 'none';
      const spun = img.getBoundingClientRect();
      const box = stage.getBoundingClientRect();
      wrap.style.transform = savedTransform;

      const vh = window.innerHeight || 800;
      if (spun.height > 0) greenExit.current = spun.bottom - box.top + vh * 0.08;
    };

    const update = () => {
      raf = 0;
      const section = sectionRef.current;
      if (!section) return;

      // ---------------------------------------------------------------------
      // READS. Every layout read below happens before any style write: mixing
      // them forces a synchronous re-layout of the whole document per read, and
      // this document carries the entire site. Element lookups are cached too —
      // they were running on every frame.
      // ---------------------------------------------------------------------
      const vh = window.innerHeight || 800;
      const travel = section.offsetHeight - vh; // distance the stage stays pinned
      const p = travel > 0 ? clamp01(-section.getBoundingClientRect().top / travel) : 0;
      const z = clamp01((p - ZOOM_START) / (1 - ZOOM_START));
      const zooming = z > 0;

      // Cached, but re-queried if the node has been detached. Page 3 is
      // remounted when its responsive wrapper flips mode, and again on every HMR
      // update in dev; a detached node keeps answering queries with zeros rather
      // than throwing, so a stale handle fails silently.
      const live = (
        ref: React.MutableRefObject<HTMLElement | null>,
        find: () => HTMLElement | null,
      ) => {
        if (!ref.current || !ref.current.isConnected) ref.current = find();
        return ref.current;
      };

      const reveal = live(revealRef, () => document.getElementById(POPOUT_REVEAL_ID));


      // ---------------------------------------------------------------------
      // WRITES
      // ---------------------------------------------------------------------
      const d = exits.current;

      // Phase 1 — the type clears the frame sideways.
      const t = smoothstep(clamp01((p - TYPE_START) / TYPE_SPAN));
      if (unleashRef.current)
        unleashRef.current.style.transform = `translateX(${-t * d.unleash}px)`;
      if (liquidRef.current)
        liquidRef.current.style.transform = `translateX(${-t * d.liquid}px)`;
      if (lightningRef.current)
        lightningRef.current.style.transform = `translateX(${t * d.lightning}px)`;
      if (theRef.current)
        theRef.current.style.transform = `translateX(${t * d.the}px)`;

      // Phase 2 — only once the type is gone, the cans clear vertically. The
      // green can rises with the red one rather than flying into page 3: page 3
      // now owns a can per flavour, so there is no longer a single image for it
      // to morph onto, and the collage reads better emptying completely.
      const c = smoothstep(clamp01((p - CANS_START) / CANS_SPAN));
      if (redCanRef.current)
        redCanRef.current.style.transform = `translateY(${-c * d.red}px)`;
      if (blueCanRef.current)
        blueCanRef.current.style.transform = `translateY(${c * d.blue}px)`;

      // The green can is measured lazily: it is still `fixed` mid-flight from
      // page 1 when measure() runs, and only settles into its docked box later.
      const canWrap = canFlightRef.current;
      if (canWrap) {
        if (!greenExit.current) measureGreenExit();
        if (greenExit.current) {
          canWrap.style.transform = `translateY(${-c * greenExit.current}px)`;
          canWrap.style.willChange = c > 0 && c < 1 ? 'transform' : '';
        }
      }

      // Phase 3 — the camera pushes through the gap in the foliage. Slightly
      // eased-in so the jungle holds, then rushes past the edges. THE and the
      // green can sit almost on the zoom origin, so no amount of scale would
      // carry them off screen — the dissolve is what clears them.

      // Page 3 fades up in place behind the zoom. Only its opacity is driven
      // here — App.tsx pins it with CSS `sticky` so it holds against the
      // viewport on the compositor. Driving that hold from here instead would
      // land a frame behind every scroll event and read as jitter.
      // Click-through only while it is too faint to aim at — see
      // REVEAL_INTERACTIVE_AT.
      if (reveal) {
        const op = smoothstep(clamp01((z - REVEAL_FADE_START) / REVEAL_FADE_SPAN));
        reveal.style.opacity = op.toFixed(4);
        reveal.style.pointerEvents = op < REVEAL_INTERACTIVE_AT ? 'none' : '';
        // Promote for the duration of the fade only. Without this, changing the
        // opacity of a subtree this large re-rasterises the whole rest of the
        // site every frame; with it the fade is a compositor-only operation.
        // Dropped afterwards so the site is not left on its own layer forever.
        reveal.style.willChange = zooming && z < 1 ? 'opacity' : '';
      }

      const camera = cameraRef.current;
      if (camera) {
        if (zooming) {
          // Only ever transformed mid-zoom: a transform here would otherwise
          // make this the containing block for the still-travelling (fixed) can.
          camera.style.willChange = 'transform, opacity';
          camera.style.transform = `scale(${1 + (ZOOM_MAX_SCALE - 1) * Math.pow(z, 1.35)})`;
          camera.style.opacity = (
            1 - smoothstep(clamp01((z - ZOOM_FADE_START) / ZOOM_FADE_SPAN))
          ).toFixed(4);
        } else if (camera.style.transform) {
          camera.style.transform = '';
          camera.style.opacity = '';
          camera.style.willChange = '';
        }
      }

    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      greenExit.current = 0; // re-measure the docked box at the new size
      onScroll();
    };

    measure();
    update();
    // The serif display face changes the word widths, so re-measure once it lands.
    document.fonts?.ready.then(onResize).catch(() => {});
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="popout-section"
      // Nothing in page 2 is interactive, and its box overlaps page 3 once the
      // pin releases — so let clicks through rather than swallowing them.
      className="relative z-10 w-full pointer-events-none"
      style={{ height: `${POPOUT_SECTION_VH}vh` }}
    >
      {/* Pinned stage — holds page 2 still while the exit sequence scrubs, and
          clips the zoom so the jungle really does leave the screen */}
      <div ref={stageRef} className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Camera — everything page 2 draws, scaled as one during phase 3 */}
        <div
          ref={cameraRef}
          className="absolute inset-0 isolate border-t border-zinc-900"
          style={{ transformOrigin: '50% 42%' }}
        >
          {/* LIGHTNING — BEHIND the jungle bg: shows through its transparent centre, foliage covers it */}
          <div
            ref={lightningRef}
            className="absolute left-[63%] top-[60%] -z-10 whitespace-nowrap will-change-transform"
          >
            <span className="thunder-text block -translate-x-1/2 -translate-y-1/2 font-serif font-normal uppercase leading-none text-[clamp(2.75rem,8vw,11rem)] whitespace-nowrap">
              LIGHTNING
            </span>
          </div>

          {/* UNLEASH — BEHIND the jungle bg, exits left */}
          <div
            ref={unleashRef}
            className="absolute left-[40%] top-[31%] -z-10 whitespace-nowrap will-change-transform"
          >
            <span className="block -translate-x-1/2 -translate-y-1/2 font-serif font-normal text-white uppercase leading-none text-[clamp(2.25rem,6.4vw,9rem)] whitespace-nowrap drop-shadow-[0_4px_22px_rgba(0,0,0,0.85)]">
              UNLEASH
            </span>
          </div>

          {/* LIQUID — BEHIND the jungle bg, exits left with UNLEASH */}
          <div
            ref={liquidRef}
            className="absolute left-[43%] top-[46%] -z-10 whitespace-nowrap will-change-transform"
          >
            <span className="water-text block -translate-x-1/2 -translate-y-1/2 font-serif font-normal uppercase leading-none text-[clamp(2.75rem,8vw,11rem)] whitespace-nowrap">
              LIQUID
            </span>
          </div>

          {/* THE — BEHIND the jungle bg, exits right with LIGHTNING. Sits before
              both cans in source order so it passes under them on the way out. */}
          <div
            ref={theRef}
            className="absolute left-[67%] top-[31%] -z-10 whitespace-nowrap will-change-transform"
          >
            <span className="block -translate-x-1/2 -translate-y-1/2 font-serif font-normal text-white uppercase leading-none text-[clamp(2.25rem,6.4vw,9rem)] whitespace-nowrap drop-shadow-[0_4px_22px_rgba(0,0,0,0.85)]">
              THE
            </span>
          </div>

          {/* Blue Mango Loco can — BEHIND the jungle bg, drops out of frame */}
          <div
            ref={blueCanRef}
            className="absolute left-[40%] top-[62%] -z-10 w-[18vw] max-w-[270px] will-change-transform"
          >
            <img
              src={imgMango}
              alt="Monster Mango Loco"
              referrerPolicy="no-referrer"
              className="w-full h-auto select-none drop-shadow-[0_24px_45px_rgba(0,0,0,0.6)]"
              style={{ animation: 'popFloatA 2.4s ease-in-out infinite' }}
            />
          </div>

          {/* Red Bad Apple can — BEHIND the jungle bg, rises out of frame */}
          <div
            ref={redCanRef}
            className="absolute left-[75%] top-[33%] -z-10 w-[22vw] max-w-[330px] will-change-transform"
          >
            <img
              src={imgBadApple}
              alt="Monster Juiced Bad Apple"
              referrerPolicy="no-referrer"
              className="w-full h-auto select-none drop-shadow-[0_24px_45px_rgba(0,0,0,0.6)]"
              style={{ animation: 'popFloatB 2.6s ease-in-out infinite' }}
            />
          </div>

          {/* Jungle background (transparent centre + opaque foliage frame) */}
          <img
            src={imgJungle}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className="absolute inset-0 z-0 w-full h-full object-cover select-none"
          />

            {/* Green classic can slot — the travelling can docks here */}
          <div
            id="popout-can-target"
            aria-hidden="true"
            className="absolute left-[56%] top-[34%] -translate-x-1/2 -translate-y-1/2 z-10 w-[15vw] max-w-[210px] aspect-[3/4]"
          />

          {/* Water-ripple displacement filter used by the LIQUID text */}
          <svg width="0" height="0" aria-hidden="true" className="absolute pointer-events-none">
            <defs>
              {/* Static on purpose: animating baseFrequency re-runs the whole
                  turbulence + displacement pass every frame, on the main thread,
                  even while page 2 is off screen. The ripple reads the same. */}
              <filter id="liquidRipple" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence type="fractalNoise" baseFrequency="0.014 0.026" numOctaves={2} seed={7} result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale={8} xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>
          </svg>
        </div>

        {/* Travelling green can — also outside the camera, for the same reason:
            phase 2 lifts it out of frame from here. The wrapper matches the
            stage box, so the can's docked left/top still resolve against the
            same rectangle they did inside the camera. */}
        <div ref={canFlightRef} className="absolute inset-0 z-20">
          <TravelingCan />
        </div>

        <style>{`
          /* Figma "flow" motion: ~10px rise + subtle ±2px sway, 2s loop.
             The translate(-50%,-50%) keeps each can centred on its anchor point;
             the scroll-driven exit transform lives on the wrapper, not here. */
          @keyframes popFloatA {
            0%   { transform: translate(-50%, -50%) rotate(-16deg) translate(0px, 0px); }
            30%  { transform: translate(-50%, -50%) rotate(-16deg) translate(-2px, -6px); }
            62%  { transform: translate(-50%, -50%) rotate(-16deg) translate(1px, -10px); }
            82%  { transform: translate(-50%, -50%) rotate(-16deg) translate(2px, -5px); }
            100% { transform: translate(-50%, -50%) rotate(-16deg) translate(0px, 0px); }
          }
          @keyframes popFloatB {
            0%   { transform: translate(-50%, -50%) rotate(-5deg) translate(0px, 0px); }
            30%  { transform: translate(-50%, -50%) rotate(-5deg) translate(2px, -6px); }
            62%  { transform: translate(-50%, -50%) rotate(-5deg) translate(-1px, -10px); }
            82%  { transform: translate(-50%, -50%) rotate(-5deg) translate(-2px, -5px); }
            100% { transform: translate(-50%, -50%) rotate(-5deg) translate(0px, 0px); }
          }
        `}</style>
      </div>
    </section>
  );
}
