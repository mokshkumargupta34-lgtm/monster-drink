import React from 'react';
import imgJungle from '../assets/images/monster_jungle_bg.png';
import imgMango from '../assets/images/monster_mango_loco_pop.png';
import imgBadApple from '../assets/images/monster_bad_apple_pop.png';
import TravelingCan from './TravelingCan';

/**
 * Page 2 — "UNLEASH THE LIQUID LIGHTING" jungle collage (from Figma).
 * The green classic can woven between UNLEASH / THE is the landing slot
 * (#popout-can-target) that the hero's travelling can docks into.
 */
export default function PopOutSection() {
  return (
    <section
      id="popout-section"
      className="relative isolate w-full h-screen overflow-hidden bg-black border-t border-b border-zinc-900"
    >
      {/* Jungle background */}
      <img
        src={imgJungle}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
      />
      {/* Center vignette so the type reads cleanly over the foliage */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_48%_58%_at_55%_44%,rgba(0,0,0,0.78),transparent_72%)]" />

      {/* Travelling green can — sits ABOVE the jungle but BELOW the text (z-10 < z-20) */}
      <TravelingCan />

      {/* Collage (text + floating cans) renders in front of the green can */}
      <div className="absolute inset-0 z-20">
        <span className="absolute left-[40%] top-[31%] -translate-x-1/2 -translate-y-1/2 font-serif font-normal text-white uppercase leading-none text-[clamp(2.25rem,6.4vw,9rem)] whitespace-nowrap drop-shadow-[0_4px_22px_rgba(0,0,0,0.85)]">
          UNLEASH
        </span>
        <span className="absolute left-[67%] top-[31%] -translate-x-1/2 -translate-y-1/2 font-serif font-normal text-white uppercase leading-none text-[clamp(2.25rem,6.4vw,9rem)] whitespace-nowrap drop-shadow-[0_4px_22px_rgba(0,0,0,0.85)]">
          THE
        </span>
        <span className="water-text absolute left-[43%] top-[46%] -translate-x-1/2 -translate-y-1/2 font-serif font-normal uppercase leading-none text-[clamp(2.75rem,8vw,11rem)] whitespace-nowrap">
          LIQUID
        </span>
        <span className="thunder-text absolute left-[63%] top-[60%] -translate-x-1/2 -translate-y-1/2 font-serif font-normal uppercase leading-none text-[clamp(2.75rem,8vw,11rem)] whitespace-nowrap">
          LIGHTNING
        </span>

        {/* Green classic can slot — the travelling can docks here */}
        <div
          id="popout-can-target"
          aria-hidden="true"
          className="absolute left-[56%] top-[34%] -translate-x-1/2 -translate-y-1/2 w-[15vw] max-w-[210px] aspect-[3/4]"
        />

        {/* Mango Loco can */}
        <img
          src={imgMango}
          alt="Monster Mango Loco"
          referrerPolicy="no-referrer"
          className="absolute left-[40%] top-[62%] w-[18vw] max-w-[270px] h-auto pointer-events-none select-none drop-shadow-[0_24px_45px_rgba(0,0,0,0.6)]"
          style={{ animation: 'popFloatA 2.4s ease-in-out infinite' }}
        />

        {/* Bad Apple / Juiced can */}
        <img
          src={imgBadApple}
          alt="Monster Juiced Bad Apple"
          referrerPolicy="no-referrer"
          className="absolute left-[75%] top-[33%] w-[22vw] max-w-[330px] h-auto pointer-events-none select-none drop-shadow-[0_24px_45px_rgba(0,0,0,0.6)]"
          style={{ animation: 'popFloatB 2.6s ease-in-out infinite' }}
        />
      </div>

      {/* Water-ripple displacement filter used by the LIQUID text */}
      <svg width="0" height="0" aria-hidden="true" className="absolute pointer-events-none">
        <defs>
          <filter id="liquidRipple" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.014 0.026" numOctaves={2} seed={7} result="noise">
              <animate
                attributeName="baseFrequency"
                dur="16s"
                values="0.014 0.026; 0.02 0.032; 0.014 0.026"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={8} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <style>{`
        /* Figma "flow" motion: ~10px rise + subtle ±2px sway, 2s loop */
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
    </section>
  );
}
