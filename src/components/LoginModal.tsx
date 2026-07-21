import React, { useState } from 'react';
import { ShieldCheck, User, Lock, Flame, Sparkles, CheckCircle2 } from 'lucide-react';
import { ButtonColorful } from './ui/button-colorful';
import DataGridHero from './ui/data-grid-hero';

interface LoginModalProps {
  onLoginSuccess: (username: string) => void;
}

export default function LoginModal({ onLoginSuccess }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authComplete, setAuthComplete] = useState(false);

  // Play synthetic computer alert sounds via the Web Audio API
  const playCyberSound = (type: 'beep' | 'success' | 'error') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      if (type === 'beep') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(1000, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.45);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(60, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {}
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('PLEASE PROVIDE ALL CREDENTIALS TO AUTHORIZE.');
      playCyberSound('error');
      return;
    }

    if (password.length < 5) {
      setError('SECURITY THREAT: PASSWORD MUST BE 5+ CHARACTERS.');
      playCyberSound('error');
      return;
    }

    // Trigger authentic simulated loader
    setIsAuthenticating(true);
    playCyberSound('beep');

    setTimeout(() => {
      setIsAuthenticating(false);
      setAuthComplete(true);
      playCyberSound('success');
      
      setTimeout(() => {
        onLoginSuccess(username.trim());
      }, 1000);
    }, 2000);
  };

  return (
    <div className="min-h-[calc(100vh-73px)] w-full flex items-center justify-center px-4 py-12 relative overflow-hidden">
      
      {/* Absolute glowing orbs in card background */}
      <div className="absolute top-[30%] left-[25%] w-[400px] h-[400px] bg-emerald-500/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-[20%] right-[25%] w-[350px] h-[350px] bg-emerald-600/5 blur-[100px] pointer-events-none rounded-full" />

      {/* Animated data-grid background */}
      <DataGridHero
        className="z-0"
        rows={22}
        cols={40}
        spacing={6}
        duration={5}
        color="#34d399"
        animationType="pulse"
        pulseEffect
        mouseGlow
        opacityMin={0.05}
        opacityMax={0.5}
        background="transparent"
      />

      {/* Cyberpunk login container */}
      <div 
        id="login-container-card"
        className="w-full max-w-md rounded-2xl border border-zinc-900 bg-zinc-950/70 backdrop-blur-md p-8 relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden"
      >
        {/* Animated scanning line overlay */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-40 animate-[pulse_3s_infinite]" />

        {/* Success screen overlay */}
        {authComplete ? (
          <div className="absolute inset-0 bg-black/95 z-20 flex flex-col items-center justify-center text-center p-6 animate-fade-in">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce mb-4" />
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">BEAST CREDENTIALS VERIFIED</span>
            <h3 className="font-sans font-black text-2xl text-white uppercase mt-1 tracking-tight">
              WELCOME BACK, <span className="text-emerald-400">{username.toUpperCase()}</span>
            </h3>
            <p className="font-mono text-xs text-zinc-500 mt-2">// SYSTEM INTERFACES SYNCHRONIZED</p>
          </div>
        ) : null}

        {/* Top brand identity header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-1.5 self-center bg-zinc-900 border border-emerald-500/20 rounded-full px-3.5 py-1 backdrop-blur-md">
            <Flame className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-300">
              BEAST ACCESS PORTAL
            </span>
          </div>
          <div>
            <h2 className="font-sans font-black text-3xl text-white uppercase tracking-tight">
              SECURE AUTHORIZE
            </h2>
            <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">
              // INPUT EMAIL & KEY TO EXPEDITE ORDERS
            </p>
          </div>
        </div>

        {/* The core login inputs */}
        <form onSubmit={handleFormSubmit} className="space-y-5 text-left">
          
          {/* Form alert */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Email / Username field */}
          <div className="space-y-1.5">
            <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest">
              Beast Username / Email:
            </label>
            <div className="relative rounded-lg border border-zinc-800 bg-zinc-950/90 focus-within:border-emerald-500/50 transition-colors duration-300">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                disabled={isAuthenticating}
                className="block w-full pl-10 pr-4 py-3 bg-transparent text-sm text-white font-mono placeholder-zinc-600 focus:outline-none"
                placeholder="e.g. BEAST_CODER_99"
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest">
                Access Security Key:
              </label>
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest hover:text-emerald-400 cursor-pointer">
                Recover key?
              </span>
            </div>
            <div className="relative rounded-lg border border-zinc-800 bg-zinc-950/90 focus-within:border-emerald-500/50 transition-colors duration-300">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                disabled={isAuthenticating}
                className="block w-full pl-10 pr-4 py-3 bg-transparent text-sm text-white font-mono placeholder-zinc-600 focus:outline-none"
                placeholder="••••••••••••"
                required
              />
            </div>
          </div>

          {/* Submit action button with active processing spinner */}
          <ButtonColorful
            type="submit"
            id="login-submit-btn"
            disabled={isAuthenticating}
            className="w-full h-auto py-4 mt-2 font-mono font-black text-xs tracking-widest uppercase"
          >
            {isAuthenticating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Validating Biomass...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Unleash Account
              </>
            )}
          </ButtonColorful>

          {/* Additional context for e-commerce user */}
          <p className="font-mono text-[9px] text-zinc-600 text-center uppercase tracking-widest mt-4">
            // SECURED BY HYPER-THREADED MONSTER ENCRYPTION //
          </p>
        </form>

      </div>
    </div>
  );
}
