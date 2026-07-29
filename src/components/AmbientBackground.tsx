import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import imgLightningBg from '../assets/images/monster_dense_lightning_bg_1784486497734.webp';
import imgThunderClouds from '../assets/images/monster_thunder_clouds_overlay_1784480536852.webp';

export default function AmbientBackground() {
  const [lightningActive, setLightningActive] = useState(false);
  const [lightningIntensity, setLightningIntensity] = useState(0.06);
  const [bgYOffset, setBgYOffset] = useState(0);
  const [bgScale, setBgScale] = useState(1.05);

  // Dynamic green lightning bolts state
  const [activeBolt, setActiveBolt] = useState<number | null>(null);
  const [boltX, setBoltX] = useState(50);
  const [boltScale, setBoltScale] = useState(1);

  // Periodic simulated lightning that runs completely automatically
  useEffect(() => {
    const triggerFlash = (intensity = 0.06) => {
      setLightningIntensity(intensity);
      setLightningActive(true);
      const firstFlashDuration = 100 + Math.random() * 150;
      
      // Strike a visual bolt in the background too!
      setActiveBolt(Math.floor(Math.random() * 4));
      setBoltX(15 + Math.random() * 70);
      setBoltScale(0.7 + Math.random() * 0.5);

      setTimeout(() => {
        setLightningActive(false);
        setActiveBolt(null);
        if (Math.random() > 0.4) {
          setTimeout(() => {
            setLightningActive(true);
            setActiveBolt(Math.floor(Math.random() * 4));
            setBoltX(15 + Math.random() * 70);
            setBoltScale(0.6 + Math.random() * 0.5);

            setTimeout(() => {
              setLightningActive(false);
              setActiveBolt(null);
            }, 80 + Math.random() * 100);
          }, 150);
        }
      }, firstFlashDuration);
    };

    // Run background thunderstorm continuously every 1.6 to 2.8 seconds (completely automatic live storm!)
    const interval = setInterval(() => {
      triggerFlash(0.24 + Math.random() * 0.26);
    }, 2000);

    // Listen to custom interactive triggers from varieties or drag actions
    const handleCustomFlash = (e: Event) => {
      const customEvent = e as CustomEvent;
      const intensity = customEvent.detail?.intensity || 0.18;
      const scaleShift = customEvent.detail?.scale || 1.15;
      
      setBgScale(scaleShift);
      triggerFlash(intensity);
      
      // Also strike a custom bolt on drag actions
      setActiveBolt(Math.floor(Math.random() * 4));
      setBoltX(30 + Math.random() * 40);
      setBoltScale(0.9 + Math.random() * 0.3);
      setTimeout(() => setActiveBolt(null), 180);

      // Gradually reset scale
      setTimeout(() => {
        setBgScale(1.05);
      }, 500);
    };

    const handleBgShift = (e: Event) => {
      const customEvent = e as CustomEvent;
      const offset = customEvent.detail?.yOffset || 0;
      setBgYOffset(offset);
    };

    window.addEventListener('monster-lightning-trigger', handleCustomFlash);
    window.addEventListener('monster-background-shift', handleBgShift);

    // Dynamic scroll-triggered thunder strike logic
    let lastScrollY = window.scrollY;
    let scrollTimeout: NodeJS.Timeout | null = null;
    let strikeCooldown = false;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = Math.abs(currentScrollY - lastScrollY);
      
      // Parallax move the background slowly
      setBgYOffset(currentScrollY * 0.15);

      if (diff > 4) {
        // Boost background scale during movement
        setBgScale(1.05 + Math.min(0.08, diff / 150));
        
        // Boost lightning overlay glow dynamically with scroll speed!
        setLightningIntensity(Math.min(0.45, 0.06 + (diff / 100)));
        setLightningActive(true);

        // Strike random green lightning bolts on vigorous scrolling (Silently!)
        if (diff > 18 && !strikeCooldown) {
          strikeCooldown = true;
          setActiveBolt(Math.floor(Math.random() * 4));
          setBoltX(15 + Math.random() * 70); // Spread across screen width
          setBoltScale(0.7 + Math.random() * 0.5);

          setTimeout(() => {
            setActiveBolt(null);
          }, 140);

          setTimeout(() => {
            strikeCooldown = false;
          }, 450); // small cooldown
        }
      }

      // Fast decay when scrolling stops
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setLightningActive(false);
        setBgScale(1.05);
      }, 120);

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener('monster-lightning-trigger', handleCustomFlash);
      window.removeEventListener('monster-background-shift', handleBgShift);
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-black select-none pointer-events-none">
      {/* CONTINUOUS ROLLING DARK GREEN LIVE SMOKE CLOUDS */}
      <div className="absolute inset-0 opacity-55 mix-blend-screen pointer-events-none filter blur-[80px] md:blur-[130px]">
        {/* Smoke Cloud 1 - Deep Emerald */}
        <div 
          className="absolute w-[90vw] h-[90vw] rounded-full bg-[radial-gradient(circle,rgba(4,120,87,0.38)_0%,rgba(6,95,70,0.18)_45%,transparent_75%)]"
          style={{
            top: '-20%',
            left: '-15%',
            animation: 'smokeDriftOne 32s infinite ease-in-out',
          }}
        />
        {/* Smoke Cloud 2 - Toxic Lime */}
        <div 
          className="absolute w-[80vw] h-[80vw] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.28)_0%,rgba(4,120,87,0.12)_50%,transparent_80%)]"
          style={{
            bottom: '-15%',
            right: '-10%',
            animation: 'smokeDriftTwo 45s infinite ease-in-out',
          }}
        />
        {/* Smoke Cloud 3 - Dark Forest Green */}
        <div 
          className="absolute w-[100vw] h-[100vw] rounded-full bg-[radial-gradient(circle,rgba(6,78,59,0.42)_0%,rgba(2,44,34,0.18)_45%,transparent_70%)]"
          style={{
            top: '20%',
            right: '-25%',
            animation: 'smokeDriftThree 38s infinite ease-in-out',
          }}
        />
        {/* Smoke Cloud 4 - Subtle Jade Mist */}
        <div 
          className="absolute w-[85vw] h-[85vw] rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.22)_0%,rgba(16,185,129,0.1)_50%,transparent_75%)]"
          style={{
            bottom: '10%',
            left: '-20%',
            animation: 'smokeDriftFour 28s infinite ease-in-out',
          }}
        />
        {/* Smoke Cloud 5 - Center Core Swirl */}
        <div 
          className="absolute w-[70vw] h-[70vw] rounded-full bg-[radial-gradient(circle,rgba(4,120,87,0.32)_0%,rgba(6,78,59,0.08)_55%,transparent_75%)]"
          style={{
            top: '35%',
            left: '20%',
            animation: 'smokeDriftOne 55s infinite linear',
          }}
        />
      </div>

      {/* Primary generated lightning background with dynamic transforms and scroll offsets */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-300 ease-out"
        style={{ 
          backgroundImage: `url(${imgLightningBg})`,
          mixBlendMode: 'screen',
          animation: 'thunderPan 14s infinite ease-in-out, stormPulse 6s infinite ease-in-out',
          transform: `translateY(${bgYOffset % 100}px) scale(${bgScale})`,
        }}
      />

      {/* THREE LAYER INTERACTIVE THUNDERSTORM OVERLAYS WITH LIVE DRIFT */}
      {/* Layer 1: Parallax Deep Rolling Storm Clouds (Slow continuous speed) */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-300 ease-out"
        style={{ 
          backgroundImage: `url(${imgThunderClouds})`,
          mixBlendMode: 'screen',
          opacity: 0.18 + (lightningActive ? 0.15 : 0),
          transform: `translateY(${bgYOffset * 0.08}px) scale(${bgScale * 0.95})`,
          animation: 'cloudDriftSlow 75s infinite linear',
        }}
      />

      {/* Layer 2: Parallax Intense Green Clouds Shockwave (Medium speed, high-contrast) */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-300 ease-out"
        style={{ 
          backgroundImage: `url(${imgThunderClouds})`,
          mixBlendMode: 'color-dodge',
          opacity: 0.15 + (lightningActive ? 0.25 : 0),
          transform: `translateY(${bgYOffset * 0.18}px) scale(${bgScale * 1.1}) rotate(0.5deg)`,
          animation: 'cloudDriftMedium 48s infinite linear',
        }}
      />

      {/* Layer 3: Parallax Atmospheric Foreground Storm Blast (Fast speed, rotating overlay) */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-200 ease-out"
        style={{ 
          backgroundImage: `url(${imgThunderClouds})`,
          mixBlendMode: 'overlay',
          opacity: 0.1 + (lightningActive ? 0.35 : 0),
          transform: `translateY(${bgYOffset * 0.3}px) scale(${bgScale * 1.25}) rotate(-0.5deg)`,
          animation: 'cloudDriftFast 32s infinite linear',
        }}
      />

      {/* DYNAMIC STORM RAIN: 80 wind-tilted lightning-reactive rain streaks */}
      <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden opacity-[0.22] mix-blend-screen">
        {[...Array(80)].map((_, i) => {
          const delay = (i * -0.15).toFixed(2);
          const duration = (0.4 + Math.random() * 0.35).toFixed(2);
          const left = (Math.random() * 140 - 20).toFixed(1);
          const width = (0.75 + Math.random() * 1.25).toFixed(2);
          const height = (60 + Math.random() * 90).toFixed(0);
          return (
            <div
              key={i}
              className="absolute bg-gradient-to-b from-transparent via-emerald-400/40 to-emerald-300/80"
              style={{
                width: `${width}px`,
                height: `${height}px`,
                left: `${left}%`,
                top: `-150px`,
                transform: 'rotate(18deg)',
                animation: `rainFall ${duration}s linear ${delay}s infinite`,
              }}
            />
          );
        })}
      </div>

      {/* Cybernetic Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #10b981 1px, transparent 1px),
            linear-gradient(to bottom, #10b981 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Extreme Neon Green Radial Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-emerald-600/10 blur-[150px]" />

      {/* Interactive flash overlay with customizable intensity */}
      <div 
        className={`absolute inset-0 bg-emerald-500 transition-opacity duration-75 pointer-events-none ${
          lightningActive ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          opacity: lightningActive ? lightningIntensity : 0,
          mixBlendMode: 'color-dodge' 
        }}
      />

      {/* RENDER DYNAMIC GLOWING JAGGED GREEN LIGHTNING BOLT STRIKES */}
      {activeBolt !== null && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          {activeBolt === 0 && (
            <svg 
              className="absolute top-0 h-screen w-40 pointer-events-none transition-all duration-75" 
              style={{ 
                left: `${boltX}%`, 
                transform: `translateX(-50%) scale(${boltScale})`, 
                filter: 'drop-shadow(0 0 35px rgba(16,185,129,0.95)) drop-shadow(0 0 10px rgba(52,211,153,1))' 
              }} 
              viewBox="0 0 100 800" 
              preserveAspectRatio="none"
            >
              <path d="M 50,0 L 40,150 L 60,140 L 30,320 L 55,310 L 25,520 L 45,500 L 10,800" fill="none" stroke="#34d399" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 60,140 L 80,220 L 70,230 L 90,340" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}

          {activeBolt === 1 && (
            <svg 
              className="absolute top-0 h-screen w-40 pointer-events-none transition-all duration-75" 
              style={{ 
                left: `${boltX}%`, 
                transform: `translateX(-50%) scale(${boltScale})`, 
                filter: 'drop-shadow(0 0 35px rgba(16,185,129,0.95)) drop-shadow(0 0 10px rgba(110,231,183,1))' 
              }} 
              viewBox="0 0 100 800" 
              preserveAspectRatio="none"
            >
              <path d="M 20,0 L 45,180 L 30,170 L 65,390 L 50,380 L 80,580 L 60,570 L 90,800" fill="none" stroke="#10b981" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 30,170 L 10,250 L 15,260 L 5,340" fill="none" stroke="#047857" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}

          {activeBolt === 2 && (
            <svg 
              className="absolute top-0 h-screen w-60 pointer-events-none transition-all duration-75" 
              style={{ 
                left: `${boltX}%`, 
                transform: `translateX(-50%) scale(${boltScale})`, 
                filter: 'drop-shadow(0 0 35px rgba(16,185,129,0.95)) drop-shadow(0 0 10px rgba(52,211,153,1))' 
              }} 
              viewBox="0 0 200 800" 
              preserveAspectRatio="none"
            >
              <path d="M 100,0 L 85,140 L 105,130 L 70,300 L 95,290 L 60,500 L 80,490 L 40,800" fill="none" stroke="#6ee7b7" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 105,130 L 130,240 L 115,250 L 145,400 L 130,410 L 160,600" fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}

          {activeBolt === 3 && (
            <svg 
              className="absolute top-0 h-screen w-40 pointer-events-none transition-all duration-75" 
              style={{ 
                left: `${boltX}%`, 
                transform: `translateX(-50%) scale(${boltScale})`, 
                filter: 'drop-shadow(0 0 35px rgba(16,185,129,0.95)) drop-shadow(0 0 10px rgba(110,231,183,1))' 
              }} 
              viewBox="0 0 100 800" 
              preserveAspectRatio="none"
            >
              <path d="M 80,0 L 60,160 L 75,150 L 45,340 L 60,330 L 30,550 L 45,540 L 15,800" fill="none" stroke="#34d399" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 45,340 L 25,410 L 30,420 L 15,500" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 60,160 L 40,240 L 45,250 L 30,320" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      )}

      {/* Energy Sparks Floating particles */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-emerald-400 opacity-20 blur-[1px]"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `floatUp ${5 + Math.random() * 10}s infinite linear`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(100vh) scale(0.8) translateX(0px);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(-10vh) scale(1.2) translateX(${Math.random() * 60 - 30}px);
            opacity: 0;
          }
        }
        @keyframes rainFall {
          0% {
            transform: translateY(-150px) translateX(0px) rotate(18deg);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(115vh) translateX(360px) rotate(18deg);
            opacity: 0;
          }
        }
        @keyframes cloudDriftSlow {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          50% {
            transform: translate(-40px, 15px) scale(1.06);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        @keyframes cloudDriftMedium {
          0% {
            transform: translate(0px, 0px) scale(1.1) rotate(0.5deg);
          }
          50% {
            transform: translate(50px, -20px) scale(1.18) rotate(1.2deg);
          }
          100% {
            transform: translate(0px, 0px) scale(1.1) rotate(0.5deg);
          }
        }
        @keyframes cloudDriftFast {
          0% {
            transform: translate(0px, 0px) scale(1.25) rotate(-0.5deg);
          }
          50% {
            transform: translate(-70px, 25px) scale(1.36) rotate(-1.5deg);
          }
          100% {
            transform: translate(0px, 0px) scale(1.25) rotate(-0.5deg);
          }
        }
        @keyframes thunderPan {
          0% { transform: scale(1.05) translate(0px, 0px) rotate(0deg); }
          50% { transform: scale(1.14) translate(12px, -8px) rotate(0.5deg); }
          100% { transform: scale(1.05) translate(0px, 0px) rotate(0deg); }
        }
        @keyframes stormPulse {
          0%, 100% { opacity: 0.55; filter: brightness(0.85) saturate(0.95); }
          5% { opacity: 0.95; filter: brightness(1.35) saturate(1.45) drop-shadow(0 0 18px rgba(16,185,129,0.55)); }
          7% { opacity: 0.42; filter: brightness(0.7) saturate(0.8); }
          9% { opacity: 0.98; filter: brightness(1.5) saturate(1.65) drop-shadow(0 0 28px rgba(16,185,129,0.75)); }
          12% { opacity: 0.55; filter: brightness(0.9) saturate(1); }
          45% { opacity: 0.62; filter: brightness(1.05) saturate(1.15); }
          50% { opacity: 0.92; filter: brightness(1.3) saturate(1.4) drop-shadow(0 0 20px rgba(16,185,129,0.45)); }
          53% { opacity: 0.45; filter: brightness(0.75) saturate(0.85); }
          56% { opacity: 0.85; filter: brightness(1.2) saturate(1.3); }
          60% { opacity: 0.55; filter: brightness(0.85) saturate(0.95); }
          85% { opacity: 0.6; filter: brightness(1.0) saturate(1.05); }
          88% { opacity: 0.96; filter: brightness(1.45) saturate(1.55) drop-shadow(0 0 24px rgba(16,185,129,0.65)); }
          91% { opacity: 0.5; filter: brightness(0.8) saturate(0.9); }
        }
        @keyframes smokeDriftOne {
          0% { transform: translate(-8%, -10%) rotate(0deg) scale(1); }
          50% { transform: translate(8%, 12%) rotate(180deg) scale(1.15); }
          100% { transform: translate(-8%, -10%) rotate(360deg) scale(1); }
        }
        @keyframes smokeDriftTwo {
          0% { transform: translate(12%, -6%) rotate(90deg) scale(1.08); }
          50% { transform: translate(-12%, 8%) rotate(270deg) scale(0.88); }
          100% { transform: translate(12%, -6%) rotate(450deg) scale(1.08); }
        }
        @keyframes smokeDriftThree {
          0% { transform: translate(-6%, 12%) rotate(180deg) scale(0.92); }
          50% { transform: translate(10%, -12%) rotate(0deg) scale(1.12); }
          100% { transform: translate(-6%, 12%) rotate(180deg) scale(0.92); }
        }
        @keyframes smokeDriftFour {
          0% { transform: translate(4%, 4%) rotate(270deg) scale(1.02); }
          50% { transform: translate(-8%, -10%) rotate(90deg) scale(1.2); }
          100% { transform: translate(4%, 4%) rotate(270deg) scale(1.02); }
        }
      `}</style>
    </div>
  );
}
