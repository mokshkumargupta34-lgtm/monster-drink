import React, { useState, useRef, useEffect } from 'react';
import { DRINKS, ExtendedDrinkVariety } from '../data/drinks';
import { ShoppingCart, Star, Zap, Flame, ShieldAlert, Sparkles, ChevronLeft, ChevronRight, HelpCircle, Activity } from 'lucide-react';
import { ButtonColorful } from './ui/button-colorful';

interface VarietiesShowcaseProps {
  onAddToCart: (variety: ExtendedDrinkVariety, packSize: number, quantity: number) => void;
}

interface VarietyCardProps {
  drink: ExtendedDrinkVariety;
  isSelected: boolean;
  onClick: () => void;
  key?: React.Key;
}

function VarietyCard({ drink, isSelected, onClick }: VarietyCardProps) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setCoords({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCoords({ x: 0, y: 0 });
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`flex items-center gap-3 py-2.5 px-4 rounded-xl border text-left shrink-0 cursor-pointer group relative overflow-hidden transition-all duration-300 ${
        isSelected
          ? 'bg-zinc-900 border-emerald-500/50 shadow-[0_4px_25px_rgba(16,185,129,0.15)] z-10'
          : 'bg-zinc-950/40 border-zinc-900/80 hover:bg-zinc-900/40 hover:border-zinc-800'
      }`}
      style={{
        perspective: '1000px',
        transform: isHovered 
          ? `perspective(1000px) rotateX(${coords.y * -25}deg) rotateY(${coords.x * 25}deg) scale(1.05) translateZ(10px)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
        transformStyle: 'preserve-3d',
        transition: isHovered ? 'none' : 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.3s, background-color 0.3s, shadow 0.3s'
      }}
    >
      {/* Glossy light reflection sweep */}
      {isHovered && (
        <div 
          className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent mix-blend-overlay z-20"
          style={{
            transform: `translate(${coords.x * 24}px, ${coords.y * 24}px) rotate(45deg) scale(2.2)`,
            transition: 'transform 0.1s ease-out'
          }}
        />
      )}

      {/* Micro Drink Image representing current selections */}
      <div 
        className="w-9 h-9 bg-zinc-950 rounded-lg flex items-center justify-center relative overflow-hidden border border-zinc-900/80 group-hover:scale-110 transition-transform duration-300"
        style={{ transform: 'translateZ(15px)' }}
      >
        <img
          src={drink.image}
          alt={drink.name}
          className="w-6 h-auto object-contain transition-all duration-500"
          style={{ filter: drink.filterStyle || 'none' }}
          referrerPolicy="no-referrer"
        />
        {isSelected && (
          <div 
            className="absolute inset-0 opacity-25 animate-pulse"
            style={{ backgroundColor: drink.themeColor }}
          />
        )}
      </div>

      <div style={{ transform: 'translateZ(12px)' }} className="relative z-10">
        <div className={`font-sans font-bold text-xs uppercase leading-tight ${
          isSelected ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'
        }`}>
          {drink.name.replace('Monster Energy', '').replace('Monster', '').replace('Juiced', '').trim()}
        </div>
        <span className="font-mono text-[9px] text-zinc-600 block uppercase mt-0.5">
          ${drink.price} USD // {drink.badge || 'variety'}
        </span>
      </div>
    </button>
  );
}

export default function VarietiesShowcase({ onAddToCart }: VarietiesShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'juice' | 'sugar-free' | 'punch' | 'limited'>('all');
  const [packSize, setPackSize] = useState<4 | 12 | 24>(12);
  const [quantity, setQuantity] = useState(1);
  const [hoverCoords, setHoverCoords] = useState({ x: 0, y: 0 });
  
  // Custom interactive features
  const [spinRotation, setSpinRotation] = useState(0); // custom manual spin 360-degree range
  const [isSpinning, setIsSpinning] = useState(false);
  const [electricFlash, setElectricFlash] = useState(false); // flash on change
  const [activeTab, setActiveTab] = useState<'flavor' | 'ingredients' | 'stats'>('flavor');
  const [showToast, setShowToast] = useState(false);
  const [addedItemName, setAddedItemName] = useState('');
  
  // Scroll parallax factor. Written straight to the DOM rather than held in
  // state: this used to setState on every scroll frame, re-rendering the whole
  // showcase 60x a second from anywhere on the page, on or off screen.
  const parallaxRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [dragY, setDragY] = useState(0);
  const slideContainerRef = useRef<HTMLDivElement>(null);

  // Custom cursor spotlight and trail states
  const sectionRef = useRef<HTMLDivElement>(null);
  const [sectionMousePos, setSectionMousePos] = useState({ x: 0, y: 0 });
  const [isSectionHovered, setIsSectionHovered] = useState(false);
  const [trailPoints, setTrailPoints] = useState<{ x: number; y: number; id: number; age: number }[]>([]);
  const nextTrailId = useRef(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const handleMouseMoveSection = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setSectionMousePos({ x, y });

      const now = Date.now();
      const newPoint = { x, y, id: nextTrailId.current++, age: now };
      setTrailPoints((prev) => {
        if (prev.length > 0) {
          const last = prev[prev.length - 1];
          const dist = Math.hypot(x - last.x, y - last.y);
          if (dist < 4) return prev;
        }
        const updated = [...prev, newPoint];
        if (updated.length > 25) {
          updated.shift();
        }
        return updated;
      });
    };

    const handleMouseEnterSection = () => {
      setIsSectionHovered(true);
    };

    const handleMouseLeaveSection = () => {
      setIsSectionHovered(false);
    };

    section.addEventListener('mousemove', handleMouseMoveSection, { passive: true });
    section.addEventListener('mouseenter', handleMouseEnterSection, { passive: true });
    section.addEventListener('mouseleave', handleMouseLeaveSection, { passive: true });

    return () => {
      section.removeEventListener('mousemove', handleMouseMoveSection);
      section.removeEventListener('mouseenter', handleMouseEnterSection);
      section.removeEventListener('mouseleave', handleMouseLeaveSection);
    };
  }, []);

  // Age out trail points
  useEffect(() => {
    if (!isSectionHovered || trailPoints.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setTrailPoints((prev) => {
        const filtered = prev.filter((p) => now - p.age < 500);
        if (filtered.length === prev.length) return prev;
        return filtered;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [isSectionHovered, trailPoints.length]);

  // Filter drinks based on categories
  const filteredDrinks = DRINKS.filter((drink) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'juice' && drink.badge?.toLowerCase().includes('juice')) return true;
    if (selectedCategory === 'sugar-free' && drink.badge?.toLowerCase().includes('sugar')) return true;
    if (selectedCategory === 'punch' && drink.badge?.toLowerCase().includes('punch')) return true;
    if (selectedCategory === 'limited' && drink.badge?.toLowerCase().includes('limited')) return true;
    return false;
  });

  // Automatically reset current index to 0 when category is toggled
  useEffect(() => {
    setCurrentIndex(0);
    triggerElectricFlash();
  }, [selectedCategory]);

  const activeDrink = filteredDrinks[currentIndex] || DRINKS[0];

  // Electric lighting flash simulation on flavor transition
  const triggerElectricFlash = () => {
    setElectricFlash(true);
    const audioFreqs = {
      'classic': 523.25, // C5
      'zero-ultra': 587.33, // D5
      'mango-loco': 659.25, // E5
      'bad-apple': 698.46, // F5
      'pacific-punch': 783.99, // G5
      'devil-reserve': 880.00, // A5
      'nitro-dry': 987.77, // B5
      'ultra-violet': 1046.50, // C6
      'pipeline-punch': 1174.66 // D6
    };
    const freq = audioFreqs[activeDrink.id as keyof typeof audioFreqs] || 600;
    playCyberPulse(freq, 'sine', 0.25);
    
    setTimeout(() => {
      setElectricFlash(false);
    }, 400);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? filteredDrinks.length - 1 : prev - 1));
    setQuantity(1);
    setSpinRotation(0);
    triggerElectricFlash();
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === filteredDrinks.length - 1 ? 0 : prev + 1));
    setQuantity(1);
    setSpinRotation(0);
    triggerElectricFlash();
  };

  const handleQuickSelect = (index: number) => {
    setCurrentIndex(index);
    setQuantity(1);
    setSpinRotation(0);
    triggerElectricFlash();
  };

  // Parallax calculations on scroll position
  useEffect(() => {
    let raf = 0;
    const compute = () => {
      raf = 0;
      if (!slideContainerRef.current || !parallaxRef.current) return;
      const rect = slideContainerRef.current.getBoundingClientRect();
      const relativeY = rect.top / window.innerHeight; // fraction of screen
      parallaxRef.current.style.transform = `translateY(${relativeY * 80 * 0.35}px)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Mouse tilt parallax on the active slide card
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!slideContainerRef.current) return;
    const { left, top, width, height } = slideContainerRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    setHoverCoords({ x, y });
  };

  const handleMouseLeave = () => {
    setHoverCoords({ x: 0, y: 0 });
  };

  const handleDragStart = (clientY: number) => {
    setIsDragging(true);
    setStartY(clientY);
  };

  const handleDragMove = (clientY: number) => {
    if (!isDragging) return;
    const deltaY = clientY - startY;
    const clampedY = Math.max(-30, Math.min(180, deltaY));
    setDragY(clampedY);

    // Dynamic background lightning trigger proportional to dragging depth!
    window.dispatchEvent(
      new CustomEvent('monster-background-shift', {
        detail: { yOffset: clampedY * 1.5 }
      })
    );

    if (clampedY > 10) {
      window.dispatchEvent(
        new CustomEvent('monster-lightning-trigger', {
          detail: { 
            intensity: Math.min(0.7, clampedY / 200), 
            scale: 1.05 + (clampedY / 800) 
          }
        })
      );
      
      // Small cyber tick sounds for rich sound engineering
      if (Math.abs(clampedY % 18) < 3) {
        playCyberPulse(90 + clampedY * 1.5, 'sine', 0.08);
      }
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Animate returning back to zero state smoothly
    let currentY = dragY;
    const animateBack = () => {
      if (currentY > 1) {
        currentY = currentY * 0.78;
        setDragY(currentY);
        window.dispatchEvent(
          new CustomEvent('monster-background-shift', {
            detail: { yOffset: currentY * 1.5 }
          })
        );
        requestAnimationFrame(animateBack);
      } else {
        setDragY(0);
        window.dispatchEvent(
          new CustomEvent('monster-background-shift', {
            detail: { yOffset: 0 }
          })
        );
      }
    };
    animateBack();
  };

  // Highly customized futuristic sound generator (Muted per user request)
  const playCyberPulse = (frequency = 440, type: OscillatorType = 'triangle', duration = 0.3) => {
    // Fully muted per user intent
    return;
  };

  // Pack pricing calculation logic
  const getPackPrice = (basePrice: number, size: number) => {
    if (size === 4) return Number((basePrice * 4 * 0.95).toFixed(2));
    if (size === 12) return Number((basePrice * 12 * 0.90).toFixed(2));
    return Number((basePrice * 24 * 0.85).toFixed(2));
  };

  const handleAdd = () => {
    onAddToCart(activeDrink, packSize, quantity);
    setAddedItemName(`${activeDrink.name} (${packSize}-Pack)`);
    setShowToast(true);
    playCyberPulse(880, 'sine', 0.45);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Stats parsing for beautiful interactive charging HUD meters
  const parseStat = (valueString: string) => {
    const val = parseInt(valueString.replace(/[^0-9]/g, '')) || 0;
    return val;
  };

  const getCaffeinePercent = () => Math.min(100, (parseStat(activeDrink.caffeine) / 200) * 100);
  const getTaurinePercent = () => Math.min(100, (parseStat(activeDrink.taurine) / 1200) * 100);
  const getSugarPercent = () => Math.min(100, (parseStat(activeDrink.sugar) / 60) * 100);
  const getCaloriesPercent = () => Math.min(100, (parseStat(activeDrink.calories) / 250) * 100);

  return (
    <section 
      ref={sectionRef}
      id="varieties-section"
      className="relative min-h-screen py-24 px-4 md:px-8 border-t border-zinc-900 bg-black/70 overflow-hidden group/varieties"
      style={{ cursor: isSectionHovered ? 'none' : 'default' }}
    >
      <style>{`
        @keyframes trail-fade {
          0% {
            transform: translate(-50%, -50%) scale(1.3);
            opacity: 0.95;
            filter: drop-shadow(0 0 6px rgba(52,211,153,0.9));
          }
          100% {
            transform: translate(-50%, -50%) scale(0.1);
            opacity: 0;
            filter: drop-shadow(0 0 0px rgba(52,211,153,0));
          }
        }
        .trail-particle {
          animation: trail-fade 0.45s cubic-bezier(0.1, 0.8, 0.25, 1) forwards;
        }
      `}</style>

      {/* Dynamic Cursor Spotlight and Trail Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
        {/* Dynamic Glowing Spotlight element */}
        <div 
          className="absolute pointer-events-none transition-opacity duration-300 ease-out mix-blend-screen"
          style={{
            left: `${sectionMousePos.x}px`,
            top: `${sectionMousePos.y}px`,
            width: '450px',
            height: '450px',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(52,211,153,0.18) 0%, rgba(16,185,129,0.04) 40%, rgba(0,0,0,0) 70%)',
            opacity: isSectionHovered ? 1 : 0,
          }}
        />

        {/* Green Neon Pointer core */}
        <div 
          className="absolute pointer-events-none transition-opacity duration-200 ease-out mix-blend-screen"
          style={{
            left: `${sectionMousePos.x}px`,
            top: `${sectionMousePos.y}px`,
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#34d399',
            boxShadow: '0 0 10px #34d399, 0 0 20px #10b981, 0 0 40px #059669',
            transform: 'translate(-50%, -50%)',
            opacity: isSectionHovered ? 1 : 0,
          }}
        />

        {/* Outer Pointer Ring */}
        <div 
          className="absolute pointer-events-none transition-all duration-150 ease-out border border-emerald-400/40 rounded-full"
          style={{
            left: `${sectionMousePos.x}px`,
            top: `${sectionMousePos.y}px`,
            width: '26px',
            height: '26px',
            transform: 'translate(-50%, -50%) scale(1)',
            opacity: isSectionHovered ? 0.8 : 0,
          }}
        />

        {/* Glowing Trail elements */}
        {trailPoints.map((point) => (
          <div
            key={point.id}
            className="absolute pointer-events-none rounded-full trail-particle"
            style={{
              left: `${point.x}px`,
              top: `${point.y}px`,
              width: '6px',
              height: '6px',
              backgroundColor: '#34d399',
            }}
          />
        ))}
      </div>

      {/* Background cyber grid and particle field purely confined to section */}
      <div className="absolute inset-0 bg-cover bg-center opacity-5 pointer-events-none -z-10" />

      {/* Decorative top title layout */}
      <div className="max-w-7xl mx-auto mb-12 flex flex-col xl:flex-row xl:items-end justify-between gap-6 relative z-10">
        <div>
          <div className="inline-flex items-center gap-1.5 text-emerald-400 font-mono text-xs uppercase tracking-widest mb-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            LIVE FLAVOR SELECTION MATRIX
          </div>
          <h2 className="font-sans font-black text-4xl md:text-5xl lg:text-6xl text-white uppercase tracking-tight leading-none">
            UNLEASH THE SENSES
          </h2>
          <p className="font-mono text-xs text-zinc-500 mt-2 uppercase tracking-widest">
            // INTERMEDIARY 3D GYROSCOPIC VISUALIZER & DIGITAL DISPATCH LAB
          </p>
        </div>

        {/* Categories Pills bar */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'juice', 'sugar-free', 'punch', 'limited'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                playCyberPulse(400, 'triangle', 0.15);
              }}
              className={`font-mono text-xs uppercase tracking-widest px-4.5 py-2.5 rounded-full border transition-all duration-300 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-500 border-emerald-500 text-black font-black shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                  : 'bg-zinc-950/80 border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800'
              }`}
            >
              {cat === 'sugar-free' ? 'Zero Sugar' : cat === 'all' ? 'All Varieties' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* 9-VARIETY PREVIEW STRIP / DYNAMIC COGNITIVE TAB BAR */}
      <div className="max-w-7xl mx-auto mb-8 relative z-20">
        <div className="bg-zinc-950/80 border border-zinc-900/60 p-2.5 rounded-2xl flex items-center justify-start xl:justify-between gap-3 overflow-x-auto no-scrollbar">
          {filteredDrinks.map((drink, index) => {
            const isSelected = index === currentIndex;
            return (
              <VarietyCard 
                key={drink.id}
                drink={drink}
                isSelected={isSelected}
                onClick={() => handleQuickSelect(index)}
              />
            );
          })}
        </div>
      </div>

      {/* MAIN ADVANCED 3D SLIDING CONSOLE CONTAINER */}
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Next and Previous Cyber-Paddles */}
        {filteredDrinks.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-[-20px] xl:left-[-30px] top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-xl border border-zinc-800 bg-zinc-950/90 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all duration-300 flex items-center justify-center cursor-pointer shadow-2xl hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] group"
              aria-label="Previous flavor"
            >
              <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-[-20px] xl:right-[-30px] top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-xl border border-zinc-800 bg-zinc-950/90 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all duration-300 flex items-center justify-center cursor-pointer shadow-2xl hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] group"
              aria-label="Next flavor"
            >
              <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </>
        )}

        {/* 3D Holographic Shell Card */}
        <div 
          ref={slideContainerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative min-h-[580px] lg:min-h-[640px] w-full rounded-3xl border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 shadow-[0_30px_70px_rgba(0,0,0,0.95)]"
          style={{ 
            perspective: '1500px',
            transform: `perspective(1500px) rotateY(${hoverCoords.x * 7}deg) rotateX(${hoverCoords.y * -7}deg) translateZ(0px)`,
            transformStyle: 'preserve-3d',
            transition: 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)'
          }}
        >
          {/* Dynamic lightning/voltage flash overlay on index change */}
          <div 
            className={`absolute inset-0 pointer-events-none transition-all duration-500 mix-blend-color-dodge z-30 ${
              electricFlash ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              background: `radial-gradient(circle, ${activeDrink.themeColor} 0%, transparent 70%)`
            }}
          />

          {/* Subtly animated theme radial aura backdrop */}
          <div 
            className="absolute inset-0 bg-gradient-to-br transition-all duration-1000 -z-10 opacity-20"
            style={{ backgroundImage: `radial-gradient(circle at 30% 50%, ${activeDrink.themeColor}33, transparent 60%)` }}
          />

          {/* LEFT COLUMN: 3D CYROSCOPIC INTERACTIVE CAN STAGE */}
          <div className="lg:col-span-5 flex flex-col justify-between items-center relative py-12 px-6 border-b lg:border-b-0 lg:border-r border-zinc-900/60 overflow-hidden">
            
            {/* Ambient Cyber Ring representing physical base */}
            <div 
              className="absolute w-[80%] h-[80%] rounded-full opacity-20 transition-all duration-1000 blur-[90px] -z-10"
              style={{
                backgroundColor: activeDrink.themeColor,
                transform: `translate3d(${hoverCoords.x * -35}px, ${hoverCoords.y * -35}px, 0)`,
              }}
            />

            {/* Futuristic Grid HUD Ring background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-dashed border-zinc-800/30 rounded-full animate-[spin_40s_linear_infinite] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-zinc-800/10 rounded-full pointer-events-none" />

            {/* Giant watermark id code */}
            <div className="absolute top-10 left-6 select-none pointer-events-none opacity-5 font-mono text-[10px] tracking-[6px] uppercase">
              FLV_ID // {activeDrink.id}
            </div>

            {/* THE CORE 3D INTERACTIVE FLUID CAN PANEL.
                The scroll parallax lives on the wrapper and is written directly
                from the scroll handler; the tilt/drag stay React-driven here. */}
            <div ref={parallaxRef} className="will-change-transform">
            <div
              className="relative w-full max-w-[240px] flex flex-col items-center py-4 select-none"
              style={{
                transform: `
                  rotateY(${(hoverCoords.x * 32) + spinRotation}deg)
                  rotateX(${hoverCoords.y * -32}deg)
                  translate3d(${hoverCoords.x * 20}px, ${(hoverCoords.y * 20) + dragY}px, 60px)
                `,
                filter: electricFlash ? 'brightness(1.5) contrast(1.1)' : 'none',
                transition: isDragging ? 'none' : 'transform 0.4s ease-out'
              }}
            >
              <div 
                onMouseDown={(e) => handleDragStart(e.clientY)}
                onMouseMove={(e) => handleDragMove(e.clientY)}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
                onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
                onTouchEnd={handleDragEnd}
                className={`relative rounded-[28px] overflow-hidden border border-zinc-800/50 bg-black/45 shadow-[0_20px_50px_rgba(0,0,0,0.9)] transition-all duration-300 cursor-grab active:cursor-grabbing select-none ${activeDrink.shadowColor}`}
                style={{
                  transform: `scale(${isDragging ? 0.96 : 1})`,
                }}
              >
                {/* Active thunder sparks overlay inside can during slide-down */}
                {dragY > 15 && (
                  <div className="absolute inset-0 bg-emerald-500/10 z-20 pointer-events-none flex flex-col items-center justify-center animate-pulse">
                    <div className="absolute inset-0 border-2 border-emerald-400/60 rounded-[28px] animate-ping" />
                    <Zap className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_10px_#10b981] animate-bounce" />
                    <span className="font-mono text-[9px] text-emerald-400 font-bold tracking-wider mt-1 animate-pulse">VOLTAGE REACTION</span>
                  </div>
                )}

                {/* Neon-Laser holographic framing borders */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 border border-emerald-500/30 rounded-[28px]" 
                  style={{ borderColor: `${activeDrink.themeColor}44` }}
                />

                <img
                  src={activeDrink.image}
                  alt={activeDrink.name}
                  className="w-full h-auto object-contain scale-95 hover:scale-100 transition-transform duration-700 pointer-events-none select-none"
                  style={{ filter: activeDrink.filterStyle || 'none' }}
                  referrerPolicy="no-referrer"
                />

                {/* Animated light flare simulation swept over can */}
                <div 
                  className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] transition-transform duration-1000 ease-in-out hover:translate-x-[100%]"
                  style={{
                    transform: `translateX(${(hoverCoords.x * 120) - 50}%) skewX(-20deg)`
                  }}
                />

                {/* Badge Overlay */}
                {activeDrink.badge && (
                  <span className="absolute top-4 right-4 bg-black/90 text-emerald-400 border border-emerald-500/20 font-mono text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg backdrop-blur">
                    {activeDrink.badge}
                  </span>
                )}
              </div>

              {/* Dynamic Drag Hint Label */}
              <div className="mt-3 font-mono text-[8px] text-zinc-500 uppercase tracking-widest animate-pulse flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-emerald-400 animate-spin" />
                <span>// Grab & slide can down to trigger thunderstorm //</span>
              </div>
            </div>
            </div>

            {/* ADVANCED CAN SPINNERS CONTROL WIDGET */}
            <div className="w-full max-w-[210px] space-y-1 relative z-20 mt-4 bg-zinc-950/80 border border-zinc-900/80 rounded-xl p-2.5">
              <div className="flex justify-between text-left">
                <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-widest">
                  3D CYLINDER ROTATION:
                </span>
                <span className="font-mono text-[8px] text-emerald-400 font-bold">
                  {Math.round(spinRotation)}°
                </span>
              </div>
              <input 
                type="range"
                min="-180"
                max="180"
                value={spinRotation}
                onChange={(e) => {
                  setSpinRotation(Number(e.target.value));
                  if (!isSpinning) {
                    setIsSpinning(true);
                    playCyberPulse(450, 'sine', 0.08);
                    setTimeout(() => setIsSpinning(false), 100);
                  }
                }}
                className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
              />
              <div className="flex justify-between font-mono text-[7px] text-zinc-600 uppercase tracking-wider">
                <span>// -180° left</span>
                <span>center</span>
                <span>right //</span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: CYBER DETAILS, FLAVOR STATS TAB SYSTEM, CTAs */}
          <div className="lg:col-span-7 p-6 md:p-10 lg:p-12 flex flex-col justify-between text-left space-y-8 relative">
            
            {/* Top decorative specs header */}
            <div className="flex justify-between items-start border-b border-zinc-900/60 pb-6 gap-4">
              <div className="space-y-1">
                {/* Micro Reviews count */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="font-mono text-[10px] text-zinc-500 uppercase">
                    {activeDrink.rating} Rating // {activeDrink.reviewsCount} Active Reviews
                  </span>
                </div>
                
                <h3 className="font-sans font-black text-3xl md:text-4xl text-white uppercase tracking-tight">
                  {activeDrink.name}
                </h3>
                
                <p 
                  className="font-mono text-xs uppercase tracking-widest font-bold mt-0.5"
                  style={{ color: activeDrink.themeColor }}
                >
                  // {activeDrink.tagline}
                </p>
              </div>

              {/* Pricing Badge block */}
              <div className="bg-zinc-950/80 border border-zinc-900 p-3 rounded-2xl text-right font-mono">
                <span className="text-[9px] text-zinc-600 block uppercase">SINGLE CAN:</span>
                <span className="text-xl font-black text-white">${activeDrink.price}</span>
                <span className="text-[9px] text-zinc-400 block mt-0.5">MSRP USD</span>
              </div>
            </div>

            {/* CENTER PANEL: INTERACTIVE HUD MODULE WITH THREE SELECTABLE DATA VIEWS */}
            <div className="space-y-4">
              {/* Tab Toggles */}
              <div className="flex gap-2 border-b border-zinc-900/60 pb-3">
                <button
                  onClick={() => {
                    setActiveTab('flavor');
                    playCyberPulse(500, 'triangle', 0.1);
                  }}
                  className={`font-mono text-[10px] uppercase tracking-widest px-4.5 py-2.5 rounded-lg border transition-all duration-300 cursor-pointer ${
                    activeTab === 'flavor'
                      ? 'bg-zinc-900 border-zinc-800 text-emerald-400 font-bold'
                      : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  01 // Flavor Profile
                </button>
                <button
                  onClick={() => {
                    setActiveTab('ingredients');
                    playCyberPulse(500, 'triangle', 0.1);
                  }}
                  className={`font-mono text-[10px] uppercase tracking-widest px-4.5 py-2.5 rounded-lg border transition-all duration-300 cursor-pointer ${
                    activeTab === 'ingredients'
                      ? 'bg-zinc-900 border-zinc-800 text-emerald-400 font-bold'
                      : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  02 // Description
                </button>
                <button
                  onClick={() => {
                    setActiveTab('stats');
                    playCyberPulse(500, 'triangle', 0.1);
                  }}
                  className={`font-mono text-[10px] uppercase tracking-widest px-4.5 py-2.5 rounded-lg border transition-all duration-300 cursor-pointer ${
                    activeTab === 'stats'
                      ? 'bg-zinc-900 border-zinc-800 text-emerald-400 font-bold'
                      : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  03 // Core Formula
                </button>
              </div>

              {/* Dynamic View Panels */}
              <div className="min-h-[100px] flex items-center">
                {activeTab === 'flavor' && (
                  <div className="space-y-2 text-left w-full animate-[fadeIn_0.3s_ease-out]">
                    <span className="font-mono text-[10px] uppercase text-zinc-500 tracking-wider">TASTE PROFILE DATA:</span>
                    <p className="font-mono text-xs text-emerald-300 leading-relaxed bg-zinc-900/30 p-4 border border-zinc-900 rounded-xl">
                      {activeDrink.flavorProfile}
                    </p>
                    <p className="text-zinc-400 text-xs italic leading-relaxed">
                      *Tasting notes are aggregated from sensory laboratories and feedback of esports elite.
                    </p>
                  </div>
                )}

                {activeTab === 'ingredients' && (
                  <div className="space-y-2 text-left w-full animate-[fadeIn_0.3s_ease-out]">
                    <span className="font-mono text-[10px] uppercase text-zinc-500 tracking-wider">BRAND SYNOPSIS:</span>
                    <p className="text-zinc-300 text-xs md:text-sm leading-relaxed max-w-2xl">
                      {activeDrink.description}
                    </p>
                  </div>
                )}

                {activeTab === 'stats' && (
                  <div className="space-y-2 text-left w-full animate-[fadeIn_0.3s_ease-out]">
                    <span className="font-mono text-[10px] uppercase text-zinc-500 tracking-wider">AMPLIFIED INGREDIENT BREAKDOWN:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-900/30 p-4 border border-zinc-900 rounded-xl font-mono text-[10px]">
                      <div className="flex justify-between border-b border-zinc-900 pb-1">
                        <span className="text-zinc-500">Panax Ginseng:</span>
                        <span className="text-white font-bold">120mg / Raw extract</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900 pb-1">
                        <span className="text-zinc-500">B-Vitamin Complex:</span>
                        <span className="text-white font-bold">B3, B5, B6, B12 (100% DV)</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900 pb-1">
                        <span className="text-zinc-500">L-Carnitine Tartrate:</span>
                        <span className="text-white font-bold">500mg / High purity</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900 pb-1">
                        <span className="text-zinc-500">Glucuronolactone:</span>
                        <span className="text-white font-bold">600mg / Synergistic</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* DYNAMIC CHARGING ENERGY HUD PROGRESS METERS */}
            <div className="bg-zinc-950/75 border border-zinc-900 rounded-2xl p-4.5 space-y-4 max-w-2xl w-full">
              <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500 uppercase tracking-wider pb-1 border-b border-zinc-900/60">
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                HUD COGNITIVE POWER READOUTS:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                
                {/* Caffeine bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono uppercase">
                    <span className="text-zinc-400">Caffeine Intensity</span>
                    <span className="text-white font-bold">{activeDrink.caffeine}</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${getCaffeinePercent()}%` }}
                    />
                  </div>
                </div>

                {/* Taurine bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono uppercase">
                    <span className="text-zinc-400">Taurine Support</span>
                    <span className="text-white font-bold">{activeDrink.taurine}</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${getTaurinePercent()}%` }}
                    />
                  </div>
                </div>

                {/* Sugar bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono uppercase">
                    <span className="text-zinc-400">Pure Sugar Core</span>
                    <span className="text-white font-bold">{activeDrink.sugar}</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${getSugarPercent()}%`,
                        backgroundColor: activeDrink.sugar === '0g' ? '#10b981' : '#f59e0b'
                      }}
                    />
                  </div>
                </div>

                {/* Calories bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono uppercase">
                    <span className="text-zinc-400">Caloric Load</span>
                    <span className="text-white font-bold">{activeDrink.calories} kcal</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${getCaloriesPercent()}%` }}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* BUNDLE PACK SELECTOR AND QUANTITY ADD ROWS */}
            <div className="space-y-6 pt-4 border-t border-zinc-900/60 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 justify-between">
                
                {/* Pack size */}
                <div className="space-y-2 text-left">
                  <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest block">
                    Choose Delivery Bundle Size:
                  </span>
                  <div className="flex gap-2">
                    {[4, 12, 24].map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setPackSize(size as 4 | 12 | 24);
                          playCyberPulse(600, 'triangle', 0.1);
                        }}
                        className={`font-mono text-xs uppercase px-4.5 py-3 rounded-xl border transition-all duration-300 cursor-pointer text-left ${
                          packSize === size
                            ? 'bg-white border-white text-black font-black shadow-[0_4px_15px_rgba(255,255,255,0.15)]'
                            : 'bg-zinc-950/80 border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800'
                        }`}
                      >
                        <span className="block font-black text-sm">{size}-Pack</span>
                        <span className="block text-[8px] opacity-70 mt-0.5 uppercase tracking-wide">
                          Save {size === 4 ? '5' : size === 12 ? '10' : '15'}% OFF
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Counter */}
                <div className="space-y-2 text-left self-start sm:self-auto">
                  <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest block">
                    Cargo Volume:
                  </span>
                  <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-900 p-1 rounded-xl">
                    <button
                      onClick={() => {
                        setQuantity((q) => Math.max(1, q - 1));
                        playCyberPulse(300, 'triangle', 0.08);
                      }}
                      className="w-9 h-9 rounded-lg bg-zinc-900 text-zinc-300 font-mono text-sm flex items-center justify-center hover:bg-zinc-800 active:scale-95 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono font-black text-sm text-white text-center w-8 select-none">
                      {quantity}
                    </span>
                    <button
                      onClick={() => {
                        setQuantity((q) => q + 1);
                        playCyberPulse(300, 'triangle', 0.08);
                      }}
                      className="w-9 h-9 rounded-lg bg-zinc-900 text-zinc-300 font-mono text-sm flex items-center justify-center hover:bg-zinc-800 active:scale-95 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

              </div>

              {/* Dynamic Price & Dispatch trigger */}
              <div className="flex items-center justify-between gap-6 pt-2">
                <div className="text-left font-mono">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">
                    TOTAL ESTIMATED COST:
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-sans font-black text-3xl md:text-4xl text-white">
                      ${(getPackPrice(activeDrink.price, packSize) * quantity).toFixed(2)}
                    </span>
                    <span className="text-xs text-zinc-400 font-bold">USD</span>
                  </div>
                </div>

                <ButtonColorful
                  id="add-to-cart-showcase"
                  onClick={handleAdd}
                  className="flex-1 max-w-xs h-auto rounded-xl py-4.5 font-mono font-black text-xs md:text-sm tracking-widest uppercase shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_30px_rgba(16,185,129,0.6)]"
                >
                  <ShoppingCart className="w-4 h-4 group-hover:scale-125 transition-transform" />
                  UNLEASH CARGO
                </ButtonColorful>
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* Floating Spark Toast alert */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-950/95 border-2 border-emerald-500 text-white rounded-xl py-4 px-6 flex items-center gap-3.5 shadow-2xl animate-[slideIn_0.3s_cubic-bezier(0.16,1,0.3,1)] backdrop-blur-md">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
          <div className="text-left">
            <div className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">BEAST CARGO VERIFIED</div>
            <div className="font-mono text-xs font-black uppercase text-emerald-400">{addedItemName} LOADED</div>
          </div>
        </div>
      )}

      <style>{`
        /* Avoid custom scrollbar noise inside browser viewports */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        @keyframes slideIn {
          from {
            transform: translateY(100px) scale(0.9);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </section>
  );
}
