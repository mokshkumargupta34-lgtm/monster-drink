import React, { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import WavyLines from './WavyLines';
import { ButtonColorful } from './ui/button-colorful';

interface HeroProps {
  onNavigateToVarieties: () => void;
}

export default function Hero({ onNavigateToVarieties }: HeroProps) {
  const unleashRef = useRef<HTMLSpanElement>(null);
  const theRef = useRef<HTMLSpanElement>(null);
  const beastRef = useRef<HTMLSpanElement>(null);

  // As the can travels to page 2, split the title apart + widen it:
  // UNLEASH → left, THE → right, BEAST → up. rAF + direct DOM writes (smooth).
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight || 800;
      const vw = window.innerWidth || 1200;
      const y = window.scrollY;
      const p = Math.min(1, Math.max(0, y / (vh * 0.65)));
      const s = p * p * (3 - 2 * p); // smoothstep
      const op = String(Math.max(0, 1 - p * 1.15));
      const widen = 1 + s * 0.7;

      if (unleashRef.current) {
        unleashRef.current.style.transform = `translateX(${-s * vw * 0.55}px) scaleX(${widen})`;
        unleashRef.current.style.opacity = op;
      }
      if (theRef.current) {
        theRef.current.style.transform = `translateX(${s * vw * 0.55}px) scaleX(${widen})`;
        theRef.current.style.opacity = op;
      }
      if (beastRef.current) {
        beastRef.current.style.transform = `translateY(${-s * vh * 0.72}px) scaleX(${widen})`;
        beastRef.current.style.opacity = op;
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

  // Cybernetic synth alert sounds using the browser Web Audio API
  const playSwoosh = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(60, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, audioCtx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      // Audio context blocked/not supported, fail silently
    }
  };

  return (
    <div
      className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-center items-center px-4 md:px-8 py-10 md:py-14 z-0 bg-[radial-gradient(ellipse_120%_120%_at_50%_38%,#0a2a20_0%,#03100c_55%,#000000_100%)]"
      id="hero-section"
    >
      {/* Decorative vertical lines on sides */}
      <div className="absolute left-4 top-0 bottom-0 w-[1px] bg-zinc-900 hidden md:block" />
      <div className="absolute right-4 top-0 bottom-0 w-[1px] bg-zinc-900 hidden md:block" />

      {/* Animated hero background — flowing emerald wavy light-lines (site theme) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[80vw] h-[55vh] rounded-full blur-[120px] bg-[radial-gradient(circle,rgba(16,185,129,0.22),transparent_65%)]"
          style={{ animation: 'heroAuroraOne 18s ease-in-out infinite' }}
        />
        <div
          className="absolute bottom-0 -right-[5%] w-[45vw] h-[45vw] rounded-full blur-[120px] bg-[radial-gradient(circle,rgba(132,204,22,0.14),transparent_65%)]"
          style={{ animation: 'heroAuroraTwo 24s ease-in-out infinite' }}
        />
        <WavyLines />
      </div>

      {/* Diagonal scrolling "BEAST FORMULA" tape — loops left → right */}
      <div className="absolute top-[80px] md:top-[104px] left-1/2 -translate-x-1/2 w-[160%] rotate-[-4deg] z-20 overflow-hidden pointer-events-none bg-[#2fdc4e] border-y-2 border-black/25 shadow-[0_0_45px_rgba(47,220,78,0.5)]">
        <div className="flex w-max py-2 md:py-3" style={{ animation: 'tapeScroll 24s linear infinite' }}>
          {[0, 1].map((track) => (
            <div key={track} className="flex shrink-0 items-center" aria-hidden={track === 1 ? true : undefined}>
              {Array.from({ length: 10 }).map((_, i) => (
                <span
                  key={i}
                  className="mx-5 font-sans font-black text-black text-base md:text-2xl uppercase tracking-tight whitespace-nowrap"
                >
                  ORIGINAL BEAST FORMULA
                  <span className="mx-4 text-black/50">//</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Centered hero stack (the travelling can floats over this — see TravelingCan) */}
      <div className="max-w-7xl mx-auto w-full flex flex-col items-center text-center relative z-30">

        {/* STAGE: giant "UNLEASH THE BEAST" */}
        <div className="relative w-full flex items-center justify-center min-h-[64vh]">
          <div className="absolute inset-0 z-0 flex flex-col items-center justify-center select-none pointer-events-none">
            <h1 className="font-sans font-black uppercase leading-[0.85] text-white whitespace-nowrap flex flex-col items-center">
              <span className="flex items-baseline justify-center gap-[0.28em] text-[clamp(2rem,10.5vw,8.5rem)] tracking-[0.12em]">
                <span ref={unleashRef} className="inline-block will-change-transform drop-shadow-[0_0_40px_rgba(0,0,0,0.85)]">
                  UNLEASH
                </span>
                <span ref={theRef} className="inline-block will-change-transform drop-shadow-[0_0_40px_rgba(0,0,0,0.85)]">
                  THE
                </span>
              </span>
              <span
                ref={beastRef}
                data-text="BEAST"
                className="glitch-beast relative inline-block will-change-transform text-[clamp(4rem,23vw,19rem)] tracking-[0.06em] text-transparent bg-clip-text bg-gradient-to-b from-emerald-300 via-green-500 to-emerald-700 drop-shadow-[0_0_60px_rgba(16,185,129,0.35)]"
              >
                BEAST
              </span>
            </h1>
          </div>

          {/* Radial glow halo behind the can */}
          <div className="absolute w-[55%] h-[70%] rounded-full bg-emerald-500/25 blur-[130px] pointer-events-none z-0" />
        </div>

        {/* CTA Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <ButtonColorful
            id="cta-shop-now"
            onClick={() => {
              playSwoosh();
              onNavigateToVarieties();
            }}
            className="h-auto px-8 py-4 font-mono font-black text-sm tracking-wider uppercase shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
          >
            Shop Flavors
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
          </ButtonColorful>

          <ButtonColorful
            id="cta-scroll-explore"
            onClick={() => {
              const element = document.getElementById('varieties-section');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              } else {
                onNavigateToVarieties();
              }
            }}
            className="h-auto px-6 py-4 font-mono text-xs uppercase tracking-widest"
          >
            Explore Varieties
          </ButtonColorful>
        </div>
      </div>

      {/* Animated Bottom Scroll indicator */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 cursor-pointer z-30 opacity-60 hover:opacity-100 transition-opacity duration-300"
        onClick={() => {
          const element = document.getElementById('varieties-section');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          } else {
            onNavigateToVarieties();
          }
        }}
      >
        <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Scroll to Unleash</span>
        <div className="w-5 h-8 rounded-full border-2 border-zinc-800 flex justify-center p-1">
          <div className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce" />
        </div>
      </div>

      {/* Marquee + aurora keyframes */}
      <style>{`
        @keyframes tapeScroll {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        @keyframes heroAuroraOne {
          0%, 100% { transform: translate(-8%, -6%) scale(1); }
          50% { transform: translate(8%, 8%) scale(1.25); }
        }
        @keyframes heroAuroraTwo {
          0%, 100% { transform: translate(6%, 0%) scale(1.1); }
          50% { transform: translate(-10%, 8%) scale(0.9); }
        }
      `}</style>
    </div>
  );
}
