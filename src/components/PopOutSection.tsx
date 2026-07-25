import React, { useEffect, useRef } from 'react';
import imgJungle from '../assets/images/monster_jungle_bg.png';
import imgMango from '../assets/images/monster_mango_loco_pop.png';
import imgBadApple from '../assets/images/monster_bad_apple_pop.png';
import TravelingCan, { DOCK_ROTATE, FLOAT_ROTATE } from './TravelingCan';

/**
 * Page 2 — "UNLEASH THE LIQUID LIGHTING" jungle collage (from Figma).
 * The green classic can woven between UNLEASH / THE is the landing slot
 * (#popout-can-target) that the hero's travelling can docks into.
 *
 * The section is POPOUT_SECTION_VH tall with an h-screen sticky "stage" inside,
 * so page 2 pins for POPOUT_PIN_VH of scrolling. That pinned scroll scrubs the
 * whole hand-off into page 3:
 *   phase 1 — UNLEASH + LIQUID fly off left, THE + LIGHTNING fly off right
 *   phase 2 — once the type is gone, the red can rises and the blue can drops
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
 * The chamber's can slot on page 3. Page 2's green can flies into it during the
 * zoom and morphs onto the can already sitting there — the same image, so the
 * two register exactly.
 */
export const POPOUT_HANDOFF_CAN_ID = 'chamber-capsule';

/**
 * The resting lean of page 3's can, in degrees. Part of the hand-off contract:
 * the flight has to end on exactly this angle, so the chamber reads it from
 * here rather than styling a tilt of its own.
 */
export const CHAMBER_CAN_TILT = 8;

/**
 * A rotated element's client rect is its axis-aligned bounding box — taller and
 * wider than the element itself — so the tilted can's rect cannot be used as its
 * size directly. Recovers the true w/h from the pair of bbox dimensions.
 *   bw = w·c + h·s
 *   bh = w·s + h·c     (c = |cos θ|, s = |sin θ|)
 */
const unrotateBox = (bw: number, bh: number, deg: number) => {
  const rad = (deg * Math.PI) / 180;
  const c = Math.abs(Math.cos(rad));
  const s = Math.abs(Math.sin(rad));
  const det = c * c - s * s;
  // θ at 45° makes the system singular; nothing here goes near it, but a tilt
  // edited to that would otherwise divide by ~0.
  if (Math.abs(det) < 1e-6) return { w: bw, h: bh };
  return { w: (bw * c - bh * s) / det, h: (bh * c - bw * s) / det };
};

// The flight lands well before the swap, so the two cans sit exactly on top of
// each other for a beat first — cross-fading mid-flight shows them misaligned.
const HANDOFF_FLIGHT_SPAN = 0.8;
const HANDOFF_SWAP_START = 0.86;
/**
 * The docked can's net lean. Unwound over the flight so it arrives upright on
 * the capsule's can, which is the same image — that is what makes the hand-off
 * a morph rather than a dissolve.
 */
const CAN_LEAN = DOCK_ROTATE + FLOAT_ROTATE;

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

/**
 * Frames the docked can gets to become measurable before the flight gives up
 * for this pass. Generous because the can PNG is multi-megabyte and the whole
 * hand-off is gated on that one measurement — at 60fps this is a few seconds.
 */
const MEASURE_MAX_TRIES = 240;

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
  const capsuleRef = useRef<HTMLElement | null>(null);
  const capsuleImgRef = useRef<HTMLImageElement | null>(null);

  // The docked can's resting box, relative to the stage. Measured lazily: the
  // can is still travelling (and `fixed`) when everything else is measured.
  const canRest = useRef<{ x: number; y: number; h: number } | null>(null);

  // Exit distance (px) each element needs to fully clear the frame, measured from
  // its resting box so the motion fills its phase window at every viewport size.
  const exits = useRef({ unleash: 0, liquid: 0, lightning: 0, the: 0, red: 0, blue: 0 });

  useEffect(() => {
    let raf = 0;
    let canMeasureTries = 0;

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

    // The can is `fixed` and mid-flight when measure() runs, so its docked box
    // can only be read once the zoom starts — by then it has long since docked.
    const measureCan = () => {
      const stage = stageRef.current;
      const wrap = canFlightRef.current;
      const img = wrap?.querySelector('img');
      if (!stage || !wrap || !img) return;

      // Only measure once the can has actually docked. It switches to `absolute`
      // via React state, so on the first frame after a jump-scroll — or a reload
      // partway down — it is still `fixed` at left-0/top-0 while already wearing
      // its docked transform, which puts it at roughly (0,0). Caching that would
      // send the flight off from the corner of the screen. Retry next frame.
      const canEl = wrap.firstElementChild as HTMLElement | null;
      if (!canEl || getComputedStyle(canEl).position !== 'absolute') return;

      // The can PNG is several megabytes. Until it decodes the img is h-auto off
      // an unknown intrinsic size, so it measures 0 tall — caching that would
      // divide by zero below and kill the flight. Retry instead.
      if (!img.complete || img.naturalHeight === 0) return;

      const savedTransform = wrap.style.transform;
      const savedOrigin = wrap.style.transformOrigin;
      const box = stage.getBoundingClientRect();

      // Pass 1: centre. A rotation about the centre leaves the centre put, so
      // this is valid even though the box itself is the leaning can's bbox.
      wrap.style.transform = 'none';
      const spun = img.getBoundingClientRect();
      const x = spun.left + spun.width / 2 - box.left;
      const y = spun.top + spun.height / 2 - box.top;

      // Pass 2: true height, with the lean cancelled — the leaning bbox is
      // several percent taller than the can actually is.
      wrap.style.transformOrigin = `${x}px ${y}px`;
      wrap.style.transform = `rotate(${-CAN_LEAN}deg)`;
      const upright = img.getBoundingClientRect();

      wrap.style.transform = savedTransform;
      wrap.style.transformOrigin = savedOrigin;
      if (upright.height > 0) canRest.current = { x, y, h: upright.height };
    };

    const update = () => {
      raf = 0;
      let retryMeasure = false;
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

      const reveal = (revealRef.current ||= document.getElementById(POPOUT_REVEAL_ID));
      const capsule = (capsuleRef.current ||= document.getElementById(
        POPOUT_HANDOFF_CAN_ID,
      ));
      const capsuleImg = (capsuleImgRef.current ||=
        capsule?.querySelector('img') ?? null);

      // Re-arm every time page 2 leaves the zoom, so a measurement that timed
      // out (slow image decode, say) gets another go on the next pass instead
      // of leaving the hand-off dead for the rest of the session.
      if (!zooming) canMeasureTries = 0;

      if (zooming && !canRest.current && canMeasureTries < MEASURE_MAX_TRIES) {
        measureCan();
        // The dock switch lands a render later, and nothing else will wake us
        // if the scroll has already stopped — so keep asking for a frame until
        // it takes. Capped so a can that never docks cannot spin forever.
        if (!canRest.current) {
          canMeasureTries++;
          retryMeasure = true;
        }
      }

      const stageBox = zooming ? stageRef.current?.getBoundingClientRect() : undefined;
      // the rendered can inside the capsule, which is what the flight targets
      const capBox = zooming ? capsuleImg?.getBoundingClientRect() : undefined;

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

      // Phase 2 — only once the type is gone, the outer cans clear vertically.
      const c = smoothstep(clamp01((p - CANS_START) / CANS_SPAN));
      if (redCanRef.current)
        redCanRef.current.style.transform = `translateY(${-c * d.red}px)`;
      if (blueCanRef.current)
        blueCanRef.current.style.transform = `translateY(${c * d.blue}px)`;

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

      // How far through the flight, and how far through the swap that follows it.
      const m = smoothstep(clamp01(z / HANDOFF_FLIGHT_SPAN));
      const swap = smoothstep(
        clamp01((z - HANDOFF_SWAP_START) / (1 - HANDOFF_SWAP_START)),
      );

      // Hand the green can across into the chamber's capsule the same way. The
      // two images differ (bare can vs the capsule's product shot), so this is a
      // dissolve on arrival rather than a true morph — the capsule holds its
      // shot back until the can has landed in it.
      const canWrap = canFlightRef.current;
      const canRestBox = canRest.current;
      // The div carrying travelFloat, inside the can's outer positioning div.
      const floatEl = canWrap?.firstElementChild?.firstElementChild as
        | HTMLElement
        | null;
      if (canWrap) {
        if (zooming && capBox && canRestBox && canRestBox.h > 0) {
          const restX = canRestBox.x + (stageBox?.left ?? 0);
          const restY = canRestBox.y + (stageBox?.top ?? 0);
          // Target the capsule's can element directly. It is sized h-/w-auto, so
          // its box is exactly the rendered can — no contain-fit maths needed,
          // and nothing here has to stay in sync with the chamber's classes.
          // The can rests tilted, so its rect is an inflated bbox: undo that
          // first or the flight scales up to the bbox and lands oversized.
          const capH = unrotateBox(capBox.width, capBox.height, CHAMBER_CAN_TILT).h;
          const fit = capH / canRestBox.h;
          const dx = (capBox.left + capBox.width / 2 - restX) * m;
          const dy = (capBox.top + capBox.height / 2 - restY) * m;
          canWrap.style.transformOrigin = `${canRestBox.x}px ${canRestBox.y}px`;
          // The can carries CAN_LEAN of its own, so the flight rotates by the
          // difference — landing on the chamber can's tilt rather than upright.
          canWrap.style.transform = `translate(${dx}px, ${dy}px) rotate(${(CHAMBER_CAN_TILT - CAN_LEAN) * m}deg) scale(${1 + (fit - 1) * m})`;
          canWrap.style.willChange = 'transform, opacity';
          canWrap.style.opacity = (1 - swap).toFixed(4);
          if (capsuleImg) capsuleImg.style.opacity = swap.toFixed(4);

          // Unwind this can's OWN float over the flight, exactly as the lean is
          // unwound. The target it flies to is the chamber's can, which floats
          // too — so without this it lands at target + its own float offset and
          // visibly jumps at the cross-fade. Cancelled via the standalone
          // `translate` property, which composes with (rather than clobbers)
          // the `transform` the animation owns, in that same local space.
          // `none` is not a matrix DOMMatrix will parse, and throwing here would
          // take the whole scroll handler — and every phase above — down with it.
          const floatT = floatEl && getComputedStyle(floatEl).transform;
          if (floatEl && floatT && floatT !== 'none') {
            const f = new DOMMatrixReadOnly(floatT);
            floatEl.style.translate = `${-f.e * m}px ${-f.f * m}px`;
          }
        } else if (!zooming && canWrap.style.transform) {
          canWrap.style.transform = '';
          canWrap.style.transformOrigin = '';
          canWrap.style.opacity = '';
          canWrap.style.willChange = '';
          if (capsuleImg) capsuleImg.style.opacity = '';
          if (floatEl) floatEl.style.translate = '';
        }
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

      if (retryMeasure && !raf) raf = requestAnimationFrame(update);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      canRest.current = null; // re-read the docked box at the new size
      canMeasureTries = 0;
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
            during the zoom it flies into page 3's chamber capsule. The wrapper
            matches the stage box, so the can's docked left/top still resolve
            against the same rectangle they did inside the camera. */}
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
