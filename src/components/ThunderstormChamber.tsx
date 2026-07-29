import { useState, useEffect, useRef } from 'react';
import { DRINKS } from '../data/drinks';
import { CHAMBER_CAN_TILT } from './PopOutSection';
import { CAN_EDGE_MASK } from './TravelingCan';
import ElectricMist from './ui/electric-mist';
import canClassic from '../assets/images/monster_can_classic.webp';
import canMangoLoco from '../assets/images/monster_can_mango_loco.webp';
import canBadApple from '../assets/images/monster_can_bad_apple.webp';
import canZeroUltra from '../assets/images/monster_can_zero_ultra.webp';
import canPacificPunch from '../assets/images/monster_can_pacific_punch.webp';
import wmClassic from '../assets/images/monster_wordmark_classic.webp';
import wmZeroUltra from '../assets/images/monster_wordmark_zero_ultra.webp';
import wmMangoLoco from '../assets/images/monster_wordmark_mango_loco.webp';
import wmBadApple from '../assets/images/monster_wordmark_bad_apple.webp';
import wmPacificPunch from '../assets/images/monster_wordmark_pacific_punch.webp';
import btnClassic from '../assets/images/monster_btn_classic.png';
import btnZeroUltra from '../assets/images/monster_btn_zero_ultra.png';
import btnMangoLoco from '../assets/images/monster_btn_mango_loco.png';
import btnBadApple from '../assets/images/monster_btn_bad_apple.png';
import btnPacificPunch from '../assets/images/monster_btn_pacific_punch.png';

/**
 * Flavour-selector artwork, keyed by drink id. Each pill carries its own name
 * and mark, so the buttons render as art alone — the accessible name comes from
 * aria-label instead. A drink with no entry falls back to a text tile.
 */
const FLAVOR_BUTTON_ART: Record<string, string> = {
  classic: btnClassic,
  'zero-ultra': btnZeroUltra,
  'mango-loco': btnMangoLoco,
  'bad-apple': btnBadApple,
  'pacific-punch': btnPacificPunch,
};

/**
 * THUNDERSTORM wordmark per flavour. All five are exported at one size from a
 * common crop, so they register pixel for pixel and the cross-fade cannot shift
 * the letters. WEBP_WORDMARK_ASPECT must match that export.
 */
const WORDMARK_ART: Record<string, string> = {
  classic: wmClassic,
  'zero-ultra': wmZeroUltra,
  'mango-loco': wmMangoLoco,
  'bad-apple': wmBadApple,
  'pacific-punch': wmPacificPunch,
};

/** Export geometry of every wordmark, held on the frame so nothing reflows. */
const WORDMARK_ASPECT = '2048 / 705';

/**
 * The can shown in the chamber, per flavour. Every one is composited into the
 * hero can's original framing — same canvas aspect, same can height, same
 * centre — so the five register exactly and cross-fade without shifting.
 */
const CAN_ART: Record<string, string> = {
  classic: canClassic,
  'zero-ultra': canZeroUltra,
  'mango-loco': canMangoLoco,
  'bad-apple': canBadApple,
  'pacific-punch': canPacificPunch,
};

/** The shared can frame's aspect — the hero can's, 3280x4096. */
const CAN_FRAME_ASPECT = '1063 / 1328';

/** The can's slot. Page 2 no longer flies into it; kept as a stable handle. */
const CAN_SLOT_ID = 'chamber-capsule';

/**
 * Storm level the chamber runs at, 10–100. Was a user-facing dial; now fixed,
 * and drives the ambient glow behind the can.
 */
const STORM_INTENSITY = 50;

/**
 * Relative luminance every flavour's mist is normalised to — the value the
 * hand-tuned green (#072a0a) sits at, and near the shader's stock #191970.
 */
const MIST_LUMINANCE = 0.126;

/**
 * Recolours the mist for a flavour, keeping its hue but forcing the tuned
 * luminance.
 *
 * The shader computes colour / (brightness - noise), so its driving colour sets
 * how dense the whole field reads, not just its hue — and the eye weighs the
 * channels very unevenly (green ~6x blue). Passing a UI colour straight through
 * would blow the field out to a flat wash and lose the filaments entirely:
 * Zero Ultra's near-white sits at luminance 0.96, nearly 8x the target.
 */
const mistColorFor = (hex: string): string => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (lum <= 0) return '#0a0a0a';
  const k = MIST_LUMINANCE / lum;
  const ch = (v: number) =>
    Math.min(255, Math.round(v * k))
      .toString(16)
      .padStart(2, '0');
  return `#${ch(r)}${ch(g)}${ch(b)}`;
};

export default function ThunderstormChamber() {
  const [selectedDrinkId, setSelectedDrinkId] = useState('classic');
  const sectionRef = useRef<HTMLElement>(null);
  // The mist is a full-viewport fragment shader redrawing every frame. This
  // section is mounted from page load — it sits behind pages 1 and 2, pinned
  // and faded to nothing — so without a gate it would render the entire time.
  const [mistVisible, setMistVisible] = useState(false);

  const activeDrink = DRINKS.find((d) => d.id === selectedDrinkId) || DRINKS[0];

  // Only run the mist while this section is actually on screen. The reveal
  // wrapper sits a full viewport below the fold until page 2 starts handing
  // over, so this correctly reads as hidden for all of page 1.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setMistVisible(true); // no observer to gate on — just render
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setMistVisible(entry.isIntersecting),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    // Exactly one viewport tall from lg up, so the whole page reads without
    // scrolling. pt-24 clears the sticky header, which overlays this section's
    // top edge whenever it is pinned. Below lg the flavour grid needs more rows
    // than will fit, so it falls back to natural height and scrolls.
    <section
      ref={sectionRef}
      id="thunderstorm-chamber"
      className="relative flex w-full min-h-screen lg:h-screen flex-col overflow-hidden bg-black px-6 lg:px-10 pt-24 pb-6"
    >
      {/* Rolling electric mist — the section's background proper. Takes the
          selected flavour's hue, normalised to MIST_LUMINANCE so every colour
          keeps the near-black field and bright veins rather than washing out.
          The shader eases between colours, so switching flavour is a bleed
          rather than a snap. */}
      <ElectricMist
        className="bg-black"
        color={mistColorFor(activeDrink.themeColor)}
        speed={0.55}
        brightness={1.0}
        paused={!mistVisible}
      />

      {/* Light scrim only. The mist's own field is nearly black now, so this is
          just a floor under the type — mainly at the bottom, behind the flavour
          grid's small print. Any heavier and it flattens the filaments. */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/20 via-black/10 to-black/45" />

      {/* THUNDERSTORM wordmark. Sits after the mist and scrim so it paints over
          them, and before the z-10 content so the can stands in front of it.
          Decorative — the section is already titled for assistive tech.
          All five colourways are stacked and cross-faded rather than swapping
          one src: swapping would pop, and would stall on first paint while the
          new file decoded. The frame carries the aspect ratio so the absolutely
          positioned layers never reflow. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[40%] flex -translate-y-1/2 justify-center select-none"
      >
        <div
          className="relative w-[94%] max-w-[1500px]"
          style={{ aspectRatio: WORDMARK_ASPECT }}
        >
          {DRINKS.slice(0, 5).map((drink) => {
            const art = WORDMARK_ART[drink.id];
            if (!art) return null;
            return (
              <img
                key={drink.id}
                src={art}
                alt=""
                className={`absolute inset-0 h-full w-full transition-opacity duration-700 ease-out ${
                  drink.id === selectedDrinkId ? 'opacity-100' : 'opacity-0'
                }`}
                // Each layer carries its own glow rather than one tinted filter
                // on the frame: opacity composites after filter, so the shadows
                // cross-fade with their artwork and no filter has to animate.
                style={{ filter: `drop-shadow(0 0 60px ${drink.themeColor}59)` }}
                referrerPolicy="no-referrer"
              />
            );
          })}
        </div>
      </div>

      {/* Background glow syncing with flavor and storm activity */}
      <div
        className="absolute inset-0 transition-opacity duration-1000 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 70% 45%, ${activeDrink.themeColor}12 0%, transparent 70%)`,
          opacity: 0.3 + STORM_INTENSITY / 150,
        }}
      />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1500px] flex-col">

        <div className="flex min-h-0 flex-1 flex-col items-center">

          {/* The chamber — centred, the hero of page 3. It absorbs whatever
              height the title and flavour rows leave, and takes its width from
              that height, so the section always fits one viewport. No frame,
              readouts or rings: the can alone stands in the storm. */}
          <div className="flex min-h-0 w-full flex-1 items-center justify-center py-4">
            <div className="relative flex h-full max-h-full w-auto min-w-[300px] max-w-full aspect-[3/4] flex-col items-center">
              {/* Vivid neon glowing core behind flavor can */}
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 w-[46%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px] transition-all duration-700"
                style={{
                  backgroundColor: activeDrink.themeColor,
                  opacity: 0.2 + STORM_INTENSITY / 250,
                }}
              />

              {/* Stage contents */}
              <div className="relative z-10 flex h-full w-full flex-col items-center">

                {/* The can's slot. Page 2's green can used to fly in here and
                    morph onto it; it now rises out of frame with the other cans,
                    so this simply holds the flavour stack. */}
                <div
                  id={CAN_SLOT_ID}
                  // No card behind the can — the box stays only to size and
                  // place it, and to give the flight from page 2 a target.
                  className="relative w-full h-full"
                >
                  {/* Floats the can on past the hand-off, at the same cadence and
                      offsets it flew in with — but no lean, since the flight
                      unwinds CAN_LEAN to land it upright on this image. Both
                      animations start at mount and share a 2.4s loop, so they
                      stay in phase and the swap never breaks stride.
                      The wrapper spans the whole capsule (inset-0) rather than
                      wrapping the can: an auto-width box around an h-%/w-auto
                      image takes the PNG's full intrinsic width, which would
                      throw the centring off by hundreds of pixels. */}
                  <div
                    className="absolute inset-0"
                    style={{ animation: 'chamberFloat 2.4s ease-in-out infinite' }}
                  >
                    {/* h-[124%] plus the hero can's aspect gives the frame every
                        colourway was composited into, so the stack registers and
                        the edge mask lands where it was tuned to. Over 100% on
                        purpose: the can is the point of this page, so it outgrows
                        its stage and bleeds past the edges. */}
                    <div
                      data-handoff-can
                      // No hover scale here. This element's box IS what the
                      // flight measures each frame to size itself, so growing it
                      // on hover both desynced the cross-fade (a 5% taller can
                      // ghosting behind the arriving one) and fed a wrong target
                      // size into the flight. The chamber is not interactive, so
                      // there was nothing for the affordance to promise anyway.
                      className="absolute left-1/2 top-1/2 h-[124%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      style={{
                        aspectRatio: CAN_FRAME_ASPECT,
                        // Standalone `rotate`, so it composes with the centring
                        // translate and the hover scale instead of replacing them.
                        rotate: `${CHAMBER_CAN_TILT}deg`,
                        ...CAN_EDGE_MASK,
                      }}
                    >
                      {DRINKS.slice(0, 5).map((drink) => {
                        const art = CAN_ART[drink.id] ?? CAN_ART.classic;
                        const isActive = drink.id === selectedDrinkId;
                        return (
                          <img
                            key={drink.id}
                            src={art}
                            alt={isActive ? `${drink.name} can` : ''}
                            aria-hidden={!isActive}
                            className={`absolute inset-0 h-full w-full transition-opacity duration-700 ease-out ${
                              isActive ? 'opacity-100' : 'opacity-0'
                            }`}
                            referrerPolicy="no-referrer"
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Flavour selector, beneath the chamber. One row of five: the pills
              carry their own name and mark, so the button is the artwork —
              selection reads as lift, full opacity and a themed bloom, since
              the art has no active variant of its own. items-center keeps them
              on a common centre line; the pills are drawn at slightly different
              aspect ratios. */}
          <div className="grid w-full max-w-6xl shrink-0 grid-cols-2 items-center gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {DRINKS.slice(0, 5).map((drink) => {
                const isActive = selectedDrinkId === drink.id;
                const art = FLAVOR_BUTTON_ART[drink.id];
                return (
                  <button
                    key={drink.id}
                    onClick={() => setSelectedDrinkId(drink.id)}
                    aria-pressed={isActive}
                    aria-label={drink.name}
                    className={`group relative cursor-pointer rounded-full transition-all duration-300 ${
                      isActive
                        ? 'scale-[1.06] opacity-100'
                        // Not dimmer than this: the pills letter their names in
                        // saturated colour on black, which loses legibility fast.
                        : 'opacity-75 hover:scale-[1.03] hover:opacity-100'
                    }`}
                    style={
                      isActive
                        ? { filter: `drop-shadow(0 0 16px ${drink.themeColor}80)` }
                        : undefined
                    }
                  >
                    {art ? (
                      <img src={art} alt="" className="h-auto w-full" />
                    ) : (
                      // Fallback for any drink without artwork.
                      <span className="block rounded-full border border-zinc-700/80 bg-black/70 px-3 py-3 font-mono text-[11px] uppercase tracking-[0.08em] text-white">
                        {drink.name.replace('Monster ', '').replace('Juiced ', '')}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>

        </div>

      </div>

      <style>{`
        /* The docked can's travelFloat, minus the -6deg lean — same offsets and
           same 2.4s loop, so the float never breaks stride across the hand-off. */
        @keyframes chamberFloat {
          0%   { transform: translate(0px, 0px); }
          30%  { transform: translate(-2px, -6px); }
          62%  { transform: translate(1px, -10px); }
          82%  { transform: translate(2px, -5px); }
          100% { transform: translate(0px, 0px); }
        }
      `}</style>
    </section>
  );
}
