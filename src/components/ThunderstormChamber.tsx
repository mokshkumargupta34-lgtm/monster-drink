import React, { useState, useEffect, useRef } from 'react';
import { Zap, CloudLightning, Volume2, VolumeX, Sliders, Sparkles, Cpu, BatteryCharging } from 'lucide-react';
import { DRINKS, ExtendedDrinkVariety } from '../data/drinks';
import { ButtonColorful } from './ui/button-colorful';

interface BoltData {
  id: number;
  path: string;
  glowColor: string;
  opacity: number;
}

export default function ThunderstormChamber() {
  const [selectedDrinkId, setSelectedDrinkId] = useState('classic');
  const [stormIntensity, setStormIntensity] = useState(50); // 10% to 100%
  const [isMuted, setIsMuted] = useState(true);
  const [activeBolts, setActiveBolts] = useState<BoltData[]>([]);
  const [ionizationRate, setIonizationRate] = useState(12.4);
  const [systemVoltage, setSystemVoltage] = useState(450);
  const [magneticField, setMagneticField] = useState(1.4);
  const [isCharging, setIsCharging] = useState(false);
  const nextBoltId = useRef(0);
  const chamberRef = useRef<HTMLDivElement>(null);

  const activeDrink = DRINKS.find((d) => d.id === selectedDrinkId) || DRINKS[0];

  // Helper to generate a classic fractal zigzag lightning path
  const generateLightningPath = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    displace: number,
    minDisplace: number
  ): string => {
    const points: [number, number][] = [[x1, y1]];
    
    const subdivide = (
      ax: number,
      ay: number,
      bx: number,
      by: number,
      disp: number
    ) => {
      if (disp < minDisplace) {
        points.push([bx, by]);
        return;
      }
      
      const midx = (ax + bx) / 2;
      const midy = (ay + by) / 2;
      
      // Offset perpendicular to the main vector
      const dx = bx - ax;
      const dy = by - ay;
      const len = Math.hypot(dx, dy);
      const nx = -dy / len;
      const ny = dx / len;
      
      const offset = (Math.random() - 0.5) * disp;
      const cx = midx + nx * offset;
      const cy = midy + ny * offset;
      
      subdivide(ax, ay, cx, cy, disp / 2);
      subdivide(cx, cy, bx, by, disp / 2);
    };

    subdivide(x1, y1, x2, y2, displace);
    points.sort((a, b) => a[1] - b[1]);

    return `M ${points.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L ')}`;
  };

  // Sound generator using Web Audio API
  const playThunderSound = (frequency = 120, duration = 0.6, type: 'rumble' | 'crackle' | 'strike' = 'rumble') => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (type === 'strike') {
        // Multi-frequency explosion sound for high voltage strike
        const osc = audioCtx.createOscillator();
        const noise = audioCtx.createDelay();
        const gain = audioCtx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.8);
        
        // High pass crackle
        const highOsc = audioCtx.createOscillator();
        highOsc.type = 'triangle';
        highOsc.frequency.setValueAtTime(1500, audioCtx.currentTime);
        highOsc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.3);
        
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, audioCtx.currentTime);

        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);

        osc.connect(filter);
        highOsc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        highOsc.start();
        osc.stop(audioCtx.currentTime + 0.8);
        highOsc.stop(audioCtx.currentTime + 0.8);

      } else if (type === 'crackle') {
        // Rapid snap snaps
        const osc = audioCtx.createOscillator();
        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(3000 + Math.random() * 2000, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.12);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2000, audioCtx.currentTime);
        filter.Q.setValueAtTime(8, audioCtx.currentTime);

        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);

      } else {
        // Classic low rumble
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(25, audioCtx.currentTime + duration);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(100, audioCtx.currentTime);

        gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      }
    } catch (e) {}
  };

  // Perform single targeted lightning strike inside chamber
  const triggerLightningStrike = (isMega = false) => {
    if (!chamberRef.current) return;
    const rect = chamberRef.current.getBoundingClientRect();
    const width = rect.width || 340;
    const height = rect.height || 420;

    const numStrikes = isMega ? 5 : 1 + Math.floor(Math.random() * 2);
    const newBolts: BoltData[] = [];

    for (let i = 0; i < numStrikes; i++) {
      // Start randomly on top horizontal line
      const startX = 30 + Math.random() * (width - 60);
      const startY = 10;

      // Target the energy can in center
      const endX = width / 2 + (Math.random() - 0.5) * 80;
      const endY = height * 0.45 + (Math.random() - 0.5) * 120;

      const path = generateLightningPath(startX, startY, endX, endY, 65, 8);
      const boltId = nextBoltId.current++;

      newBolts.push({
        id: boltId,
        path,
        glowColor: activeDrink.themeColor,
        opacity: 0.95
      });
    }

    // Add to active bolts state
    setActiveBolts((prev) => [...prev, ...newBolts]);

    // Dispatch global lightning pulse to let AmbientBackground flash
    window.dispatchEvent(
      new CustomEvent('monster-lightning-trigger', {
        detail: {
          intensity: isMega ? 0.42 : 0.15 + (stormIntensity / 500),
          scale: isMega ? 1.3 : 1.12
        }
      })
    );

    // Audio cues
    if (isMega) {
      playThunderSound(90, 1.2, 'strike');
      setTimeout(() => playThunderSound(65, 1.8, 'rumble'), 150);
    } else {
      if (Math.random() > 0.4) {
        playThunderSound(2400, 0.15, 'crackle');
      } else {
        playThunderSound(110 + Math.random() * 40, 0.6, 'rumble');
      }
    }

    // Gradually fade out bolts
    setTimeout(() => {
      setActiveBolts((prev) =>
        prev.map((b) =>
          newBolts.some((nb) => nb.id === b.id) ? { ...b, opacity: 0 } : b
        )
      );
      // Delete after animation completes
      setTimeout(() => {
        setActiveBolts((prev) => prev.filter((b) => !newBolts.some((nb) => nb.id === b.id)));
      }, 300);
    }, 100);
  };

  // Continuous background thunderstorm trigger timer based on intensity
  useEffect(() => {
    // Determine frequency interval based on intensity
    // 100% intensity = every 1.5 - 3.5s
    // 10% intensity = every 8 - 14s
    const minDelay = 15000 - (stormIntensity * 130);
    const maxDelay = 22000 - (stormIntensity * 180);

    const runInterval = () => {
      const delay = minDelay + Math.random() * (maxDelay - minDelay);
      return setTimeout(() => {
        triggerLightningStrike(false);
        // Reschedule
        timerId = runInterval();
      }, Math.max(1200, delay));
    };

    let timerId = runInterval();

    return () => clearTimeout(timerId);
  }, [stormIntensity, selectedDrinkId, isMuted]);

  // Handle live numeric updates simulating realistic electrical fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      const multiplier = stormIntensity / 50;
      setIonizationRate((prev) => {
        const delta = (Math.random() - 0.5) * 1.5;
        const target = 10 * multiplier;
        return Math.max(1.5, Math.min(65.0, prev + delta + (target - prev) * 0.1));
      });

      setSystemVoltage((prev) => {
        const fluctuation = Math.floor((Math.random() - 0.5) * 35);
        const base = 250 + Math.floor(multiplier * 300);
        return Math.max(100, Math.min(950, base + fluctuation));
      });

      setMagneticField((prev) => {
        const delta = (Math.random() - 0.5) * 0.15;
        const target = 0.5 + multiplier * 1.5;
        return Math.max(0.1, Math.min(5.2, prev + delta + (target - prev) * 0.15));
      });
    }, 300);

    return () => clearInterval(interval);
  }, [stormIntensity]);

  const triggerMegaStrike = () => {
    setIsCharging(true);
    triggerLightningStrike(true);

    // Sequence of rapid visual chain strikes
    const sequence = [120, 260, 420];
    sequence.forEach((delay, index) => {
      setTimeout(() => {
        triggerLightningStrike(index === 2);
      }, delay);
    });

    setTimeout(() => {
      setIsCharging(false);
    }, 1000);
  };

  return (
    <section 
      id="thunderstorm-chamber"
      className="relative w-full py-24 px-6 overflow-hidden border-t border-b border-zinc-900 bg-zinc-950/70"
    >
      {/* Background glow syncing with flavor and storm activity */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000 pointer-events-none"
        style={{
          background: `radial-gradient(circle_at_center, ${activeDrink.themeColor}05 0%, transparent 65%)`,
          opacity: 0.3 + (stormIntensity / 150)
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Title Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 text-left">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1">
              <CloudLightning className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
              <span className="font-mono text-[10px] font-black uppercase tracking-widest text-emerald-400">
                ATMOSPHERIC CHARGING BAY
              </span>
            </div>
            <h2 className="font-sans font-black text-4xl md:text-5xl xl:text-6xl text-white uppercase tracking-tighter leading-none">
              THE <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">THUNDERSTORM</span> CHAMBER
            </h2>
            <p className="font-mono text-xs text-zinc-500 tracking-widest uppercase">
              // ELECTRIFY YOUR EXPERIENCE. SYNC LIVE ENERGY METRICS.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ButtonColorful
              onClick={() => {
                setIsMuted(!isMuted);
                if (isMuted) {
                  // Instant preview beep when unmuted
                  setTimeout(() => playThunderSound(600, 0.15, 'crackle'), 50);
                }
              }}
              className="h-auto px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider"
            >
              {!isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              SOUND: {!isMuted ? 'ACTIVE' : 'MUTED'}
            </ButtonColorful>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Interactive Controls */}
          <div className="lg:col-span-4 flex flex-col space-y-8 text-left">
            
            {/* Step 1: Select Flavor */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                <span className="font-mono text-xs text-zinc-500">01 /</span>
                <h3 className="font-sans font-black text-xs uppercase tracking-wider text-white">
                  LOAD FLAVOR CORE
                </h3>
              </div>
              <p className="text-zinc-400 text-xs">
                Select your Monster energy fuel core to charge up inside the high-voltage storm induction chamber.
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                {DRINKS.slice(0, 6).map((drink) => (
                  <button
                    key={drink.id}
                    onClick={() => {
                      setSelectedDrinkId(drink.id);
                      setTimeout(() => triggerLightningStrike(false), 80);
                    }}
                    className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition-all duration-300 group cursor-pointer ${
                      selectedDrinkId === drink.id 
                        ? 'border-emerald-500/40 bg-zinc-900/60' 
                        : 'border-zinc-900 bg-zinc-950/40 hover:border-zinc-800 hover:bg-zinc-900/20'
                    }`}
                  >
                    <div 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: drink.themeColor }}
                    />
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] font-bold text-white truncate uppercase">
                        {drink.name.replace('Monster ', '').replace('Juiced ', '')}
                      </div>
                      <div className="font-mono text-[8px] text-zinc-500 uppercase truncate">
                        {drink.badge}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Storm Intensity Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-zinc-500">02 /</span>
                  <h3 className="font-sans font-black text-xs uppercase tracking-wider text-white">
                    DIAL STORM FREQUENCY
                  </h3>
                </div>
                <span className="font-mono text-[11px] font-black text-emerald-400">
                  {stormIntensity}%
                </span>
              </div>
              
              <p className="text-zinc-400 text-xs">
                Tweak the dial to charge the ambient air. Higher percentages increase real-time lightning frequency and system voltage.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <Sliders className="w-4 h-4 text-zinc-600" />
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={stormIntensity}
                  onChange={(e) => {
                    setStormIntensity(parseInt(e.target.value));
                    if (Math.random() > 0.6) {
                      playThunderSound(1200, 0.1, 'crackle');
                    }
                  }}
                  className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-between font-mono text-[9px] text-zinc-600 uppercase">
                <span>LOW BUZZ</span>
                <span>CAT 5 SUPERCELL</span>
              </div>
            </div>

            {/* Step 3: Trigger Mega Strike */}
            <div className="space-y-4 pt-2">
              <ButtonColorful
                onClick={triggerMegaStrike}
                disabled={isCharging}
                className="w-full h-auto py-4 font-mono font-black text-xs tracking-wider uppercase shadow-[0_4px_25px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_35px_rgba(16,185,129,0.5)]"
              >
                <Zap className={`w-4 h-4 ${isCharging ? 'animate-spin' : 'animate-bounce'}`} />
                UNLEASH MEGA THUNDERSTRIKE
              </ButtonColorful>
              <p className="text-center font-mono text-[9px] text-zinc-600 uppercase">
                // MANUALLY TRIGGER CORE SYSTEM DISCHARGE
              </p>
            </div>

          </div>

          {/* Middle Column: Immersive 3D Thunderstorm Chamber Stage */}
          <div className="lg:col-span-5 flex justify-center items-center py-4">
            <div 
              ref={chamberRef}
              className="relative w-full max-w-[370px] aspect-[4/5] bg-zinc-950/90 rounded-[32px] border border-zinc-800/80 overflow-hidden group shadow-[0_30px_70px_rgba(0,0,0,0.9)] flex items-center justify-center cursor-pointer"
              onClick={() => triggerLightningStrike(false)}
            >
              {/* Internal ambient dark green scanlines */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40 z-10" />

              {/* Grid backdrop overlay in chamber */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

              {/* Glowing horizontal ceiling grids */}
              <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-emerald-500/10 to-transparent border-t border-emerald-500/20 z-10" />
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-emerald-500/10 to-transparent border-b border-emerald-500/20 z-10" />

              {/* Intense circular ionization ring behind the active product can */}
              <div 
                className="absolute w-[260px] h-[260px] rounded-full border border-dashed opacity-25 animate-[spin_40s_linear_infinite]"
                style={{
                  borderColor: activeDrink.themeColor,
                  filter: `drop-shadow(0 0 10px ${activeDrink.themeColor})`,
                  transform: `scale(${1 + (stormIntensity / 300)})`
                }}
              />
              <div 
                className="absolute w-[280px] h-[280px] rounded-full border border-dotted opacity-15 animate-[spin_25s_linear_infinite_reverse]"
                style={{
                  borderColor: activeDrink.themeColor,
                  transform: `scale(${1 + (stormIntensity / 400)})`
                }}
              />

              {/* Vivid neon glowing core behind flavor can */}
              <div 
                className="absolute w-[180px] h-[180px] rounded-full filter blur-[80px] transition-all duration-700 pointer-events-none"
                style={{
                  backgroundColor: activeDrink.themeColor,
                  opacity: 0.2 + (stormIntensity / 250) + (isCharging ? 0.45 : 0)
                }}
              />

              {/* Procedural SVG Lightning Bolts Render Layer */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                <defs>
                  {DRINKS.map((drink) => (
                    <filter key={`glow-${drink.id}`} id={`lightning-glow-${drink.id}`}>
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  ))}
                </defs>

                {activeBolts.map((bolt) => (
                  <g key={bolt.id}>
                    {/* Outer Glowing strike */}
                    <path
                      d={bolt.path}
                      fill="none"
                      stroke={bolt.glowColor}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        filter: `url(#lightning-glow-${selectedDrinkId})`,
                        opacity: bolt.opacity,
                        transition: 'opacity 0.25s ease-out'
                      }}
                    />
                    {/* High energy inner white core strike */}
                    <path
                      d={bolt.path}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        opacity: bolt.opacity,
                        transition: 'opacity 0.2s ease-out'
                      }}
                    />
                  </g>
                ))}
              </svg>

              {/* 3D product showcase card */}
              <div 
                className="relative transition-all duration-500 ease-out z-10 w-full max-w-[190px] aspect-[1/2] rounded-[24px] overflow-hidden border border-zinc-800 bg-black/60 shadow-2xl flex items-center justify-center p-4 group"
                style={{
                  transform: isCharging 
                    ? 'scale(1.06) rotate(1.5deg)' 
                    : 'scale(1)',
                  boxShadow: `0 0 ${20 + (stormIntensity / 2.5)}px ${activeDrink.themeColor}20`
                }}
              >
                {/* Dynamic highlight sweep */}
                <div 
                  className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none transition-transform duration-1000 ease-in-out"
                  style={{
                    transform: isCharging ? 'translateX(100%) skewX(-15deg)' : 'translateX(-100%) skewX(-15deg)'
                  }}
                />

                <img
                  src={activeDrink.image}
                  alt={activeDrink.name}
                  className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105 pointer-events-none"
                  referrerPolicy="no-referrer"
                />

                {/* Electric Charging Level gauge inside can view */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2 py-1 bg-black/80 rounded-md border border-zinc-800/80">
                  <span className="font-mono text-[7px] text-zinc-500 tracking-wider">CORE STATUS</span>
                  <span className="font-mono text-[8px] text-emerald-400 font-bold animate-pulse">
                    {isCharging ? 'SUPERCHARGED' : 'ACTIVE'}
                  </span>
                </div>
              </div>

              {/* Aesthetic chamber bracket markings */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-zinc-800 pointer-events-none" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-zinc-800 pointer-events-none" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-zinc-800 pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-zinc-800 pointer-events-none" />

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 border border-zinc-800 px-3 py-1 rounded-full pointer-events-none">
                <span className="font-mono text-[8px] text-zinc-500 tracking-widest uppercase">
                  ⚡ TAP TO STRIKE LIGHTNING
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: High Energy Telemetry Real-time readout */}
          <div className="lg:col-span-3 flex flex-col space-y-6">
            
            <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-5 space-y-5 text-left">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <h3 className="font-mono text-[10px] font-black uppercase tracking-wider text-white">
                  REAL-TIME INDUCTION METRICS
                </h3>
              </div>

              {/* Voltage Stat */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[9px] text-zinc-500">
                  <span>SYSTEM INDUCTION VOLTAGE</span>
                  <span className="text-zinc-400 font-bold">MAX 1.2KV</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-sans font-black text-2xl text-white">
                    {systemVoltage}
                  </span>
                  <span className="font-mono text-[9px] text-emerald-400 uppercase font-black">
                    VOLTS (AC)
                  </span>
                </div>
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-400 transition-all duration-300"
                    style={{ width: `${(systemVoltage / 950) * 100}%` }}
                  />
                </div>
              </div>

              {/* Ionization Rate */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[9px] text-zinc-500">
                  <span>AIR IONIZATION RATE</span>
                  <span className="text-zinc-400 font-bold">STABLE</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-sans font-black text-2xl text-white">
                    {ionizationRate.toFixed(1)}
                  </span>
                  <span className="font-mono text-[9px] text-emerald-400 uppercase font-black">
                    M/CM³
                  </span>
                </div>
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-400 transition-all duration-300"
                    style={{ width: `${(ionizationRate / 65) * 100}%` }}
                  />
                </div>
              </div>

              {/* Magnetic Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[9px] text-zinc-500">
                  <span>TESLA ELECTROMAGNETIC FORCE</span>
                  <span className="text-zinc-400 font-bold">SURGE PROTECT</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-sans font-black text-2xl text-white">
                    {magneticField.toFixed(2)}
                  </span>
                  <span className="font-mono text-[9px] text-emerald-400 uppercase font-black">
                    TESLAS
                  </span>
                </div>
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-400 transition-all duration-300"
                    style={{ width: `${(magneticField / 5.2) * 100}%` }}
                  />
                </div>
              </div>

            </div>

            {/* High energy system profile */}
            <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5 text-left space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                <BatteryCharging className="w-4 h-4 text-emerald-400" />
                <h3 className="font-mono text-[10px] font-black uppercase tracking-wider text-white">
                  FLAVOR CHARGING SUMMARY
                </h3>
              </div>

              <div className="space-y-2 font-mono text-[10px] text-zinc-400">
                <div className="flex justify-between">
                  <span className="text-zinc-500">SELECTED:</span>
                  <span className="text-white uppercase font-black truncate max-w-[150px]">
                    {activeDrink.name.replace('Monster ', '')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">CAFFEINE BASE:</span>
                  <span className="text-emerald-400 font-black">{activeDrink.caffeine}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">TAURINE CHARGE:</span>
                  <span className="text-emerald-400 font-black">{activeDrink.taurine}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-900 pt-2 mt-2">
                  <span className="text-zinc-500">IONIZATION MATRIX:</span>
                  <span className="text-white font-black">
                    {stormIntensity > 75 ? 'HYPER-CHARGED' : stormIntensity > 40 ? 'BALANCED' : 'LOW LEVEL'}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-zinc-900/30 border border-zinc-800/60 p-3 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[9px] text-zinc-500 leading-normal font-mono uppercase">
                  THE DYNAMIC ELECTRO-SOUND ENGINE PROCEDURALLY HARMONIZES WITH THE AMBIENT LIGHTNING CORES OF THE SELECTED RECEPTACLE.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
