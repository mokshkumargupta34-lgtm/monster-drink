import React from 'react';
import { ShieldCheck, Flame, Trophy, Zap, Globe2, Sparkles } from 'lucide-react';
import imgDevil from '../assets/images/monster_devil_can_1784478601991.jpg';

export default function AboutUs() {
  const cards = [
    {
      icon: <Trophy className="w-6 h-6 text-emerald-400" />,
      title: 'Action Sports & Esports Elite',
      desc: 'We support the scene, our bands, our athletes, and our fans. From motocross, skateboarding, and UFC to absolute world-dominating gaming teams in Valorant and CS2—Monster Energy fuels competitive supremacy.'
    },
    {
      icon: <Flame className="w-6 h-6 text-emerald-400" />,
      title: 'Legendary Blend of Ingredients',
      desc: 'Every single drop is packed with our trademark energy recipe: active Ginseng extract, raw L-Carnitine, high-purity Caffeine, and life-essential B-Vitamins to fuel your daily adventures and midnight grinds.'
    },
    {
      icon: <Globe2 className="w-6 h-6 text-emerald-400" />,
      title: 'Globally Unified Community',
      desc: 'Monster is more than an energy drink; it is a lifestyle in a can. Worn by champions, gamers, rebels, and dreamers alike across 140+ countries. We thrive in raw energy and absolute self-expression.'
    }
  ];

  return (
    <section 
      id="about-section"
      className="relative min-h-screen py-24 px-4 md:px-8 border-t border-zinc-900 overflow-hidden flex flex-col justify-center"
    >
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left column: Visual brand statement */}
        <div className="lg:col-span-5 order-2 lg:order-1 flex justify-center relative">
          {/* Neon radial glow behind */}
          <div className="absolute w-[80%] h-[80%] rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none" />

          {/* Gritty framed illustration of devil can */}
          <div className="relative rounded-[24px] border border-zinc-800 p-2 bg-zinc-950/40 backdrop-blur shadow-[0_15px_40px_rgba(0,0,0,0.8)] overflow-hidden max-w-[340px]">
            <img 
              src={imgDevil} 
              alt="Monster Devil Silhouette Reserve"
              className="rounded-[18px] w-full h-auto object-cover grayscale brightness-90 hover:grayscale-0 hover:brightness-100 transition-all duration-700 pointer-events-none"
              referrerPolicy="no-referrer"
            />
            
            {/* Holographic scanner overlay style border lines */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-500/50" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-500/50" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-500/50" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-500/50" />
          </div>
        </div>

        {/* Right column: Copywriting */}
        <div className="lg:col-span-7 order-1 lg:order-2 flex flex-col text-left space-y-6 md:space-y-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-emerald-400 font-mono text-xs uppercase tracking-widest mb-2">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              THE BEAST CHRONICLES
            </div>
            <h2 className="font-sans font-black text-4xl md:text-5xl text-white uppercase tracking-tight">
              WE RE-WRITE <br className="hidden sm:block"/>
              THE RULES OF ENERGY
            </h2>
            <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest mt-1">
              // NO LIMITS. NO REVENUE DEBATES. ONLY PURE ACTION.
            </p>
          </div>

          <p className="text-zinc-400 text-base md:text-lg leading-relaxed max-w-xl">
            At Monster Energy, we do not care about dry corporate metrics or cookie-cutter designs. We are all about the things you love—extreme sports, heavy metal punk, gaming supremacy, and living life on the absolute edge. We are a community of creators, athletes, gamers, and rebels who refuse to be tamed.
          </p>

          {/* Core pillar grid cards */}
          <div className="space-y-4 max-w-2xl pt-2">
            {cards.map((card, index) => (
              <div 
                key={index}
                className="group flex flex-col md:flex-row gap-4 p-5 rounded-xl border border-zinc-900 bg-zinc-950/60 hover:bg-zinc-950 hover:border-emerald-500/30 transition-all duration-300"
              >
                <div className="p-3 bg-zinc-900/50 group-hover:bg-emerald-500/10 rounded-lg self-start transition-colors duration-300">
                  {card.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-base text-white group-hover:text-emerald-400 transition-colors duration-300">
                    {card.title}
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
