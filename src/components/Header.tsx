import React from 'react';
import { ShoppingCart, LogIn, Menu, X, Flame } from 'lucide-react';
import { NavSection } from '../types';
import imgFullLogo from '../assets/images/monster_lineup.png';
import { ButtonColorful } from './ui/button-colorful';

interface HeaderProps {
  currentSection: NavSection;
  onNavigate: (section: NavSection) => void;
  cartCount: number;
  isLoggedIn: boolean;
  username: string | null;
  onLogout: () => void;
  onOpenCart: () => void;
}

/** Scroll depth, in px, past which the bar retracts. Clears the hero's top edge. */
const HIDE_AFTER = 80;
/** How near the top edge the cursor must come to summon it back, in px. */
const REVEAL_ZONE = 90;

export default function Header({
  currentSection,
  onNavigate,
  cartCount,
  isLoggedIn,
  username,
  onLogout,
  onOpenCart
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);

  const headerRef = React.useRef<HTMLElement>(null);
  // Every input to the decision is a ref, so mousemove and scroll can run at
  // native rate without re-rendering — only a flip of the final boolean does.
  const hiddenRef = React.useRef(false);
  const nearTop = React.useRef(false);
  const scrolledUp = React.useRef(false);
  const focusInside = React.useRef(false);
  const menuOpen = React.useRef(false);
  menuOpen.current = mobileMenuOpen;

  React.useEffect(() => {
    // Touch devices never fire mousemove, so a cursor-only reveal would strand
    // the bar off screen for good. There, scrolling up summons it instead.
    const coarsePointer =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(hover: none)').matches;

    let raf = 0;
    let lastY = window.scrollY;

    const apply = () => {
      raf = 0;
      const summoned =
        nearTop.current ||
        focusInside.current ||
        menuOpen.current ||
        (coarsePointer && scrolledUp.current);
      const next = window.scrollY > HIDE_AFTER && !summoned;
      if (next !== hiddenRef.current) {
        hiddenRef.current = next;
        setHidden(next);
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const onScroll = () => {
      const y = window.scrollY;
      scrolledUp.current = y < lastY;
      lastY = y;
      schedule();
    };
    const onMove = (e: MouseEvent) => {
      const near = e.clientY <= REVEAL_ZONE;
      if (near !== nearTop.current) {
        nearTop.current = near;
        schedule();
      }
    };
    // Tabbing into the nav while it is retracted would otherwise move focus to
    // something off screen.
    const onFocusIn = () => {
      focusInside.current = !!headerRef.current?.contains(document.activeElement);
      schedule();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusIn);
    apply();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusIn);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Opening the mobile menu must pull the bar back down with it.
  React.useEffect(() => {
    if (mobileMenuOpen && hiddenRef.current) {
      hiddenRef.current = false;
      setHidden(false);
    }
  }, [mobileMenuOpen]);

  const navItems = [
    { id: 'home' as NavSection, label: 'Home' },
    { id: 'varieties' as NavSection, label: 'Varieties' },
    { id: 'about' as NavSection, label: 'About Us' }
  ];

  const handleNavClick = (sectionId: NavSection) => {
    onNavigate(sectionId);
    setMobileMenuOpen(false);
  };

  return (
    // Asymmetric on purpose: it retracts briskly on an accelerating curve so it
    // gets out of the way, and returns on a long easeOutExpo that decelerates
    // into place. Equal timings in both directions read mechanical.
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 w-full bg-black/80 backdrop-blur-md border-b border-zinc-900 px-4 md:px-8 py-4 transition-transform will-change-transform motion-reduce:transition-none ${
        hidden
          ? '-translate-y-full duration-[420ms] ease-[cubic-bezier(0.7,0,0.84,0)]'
          : 'translate-y-0 duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => onNavigate('home')} 
          className="flex items-center cursor-pointer group"
          id="brand-logo"
        >
          <img 
            src={imgFullLogo} 
            alt="Monster Energy" 
            className="h-12 md:h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.3)] group-hover:drop-shadow-[0_0_15px_rgba(16,185,129,0.65)]"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              className={`font-mono text-sm tracking-widest uppercase transition-all duration-300 relative py-1 cursor-pointer ${
                currentSection === item.id 
                  ? 'text-emerald-400 font-semibold' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {item.label}
              {currentSection === item.id && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-500 shadow-[0_0_8px_#10b981] rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {/* Action Controls */}
        <div className="hidden md:flex items-center gap-5">
          {/* Login / Profile button */}
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-emerald-500/30 rounded-full px-3.5 py-1.5">
                <Flame className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="font-mono text-xs text-zinc-300 uppercase tracking-wider max-w-[100px] truncate">
                  {username || 'BEAST'}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="font-mono text-xs tracking-wider text-zinc-500 hover:text-red-400 uppercase cursor-pointer transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          ) : (
            <ButtonColorful
              id="login-btn-header"
              onClick={() => onNavigate('login')}
              className="h-auto rounded-full px-4 py-2 font-mono text-xs tracking-wider uppercase"
            >
              <LogIn className="w-4 h-4" />
              Login
            </ButtonColorful>
          )}

          {/* Cart Toggle */}
          <button
            id="cart-toggle-btn"
            onClick={onOpenCart}
            className="relative p-2.5 rounded-full border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer shadow-[0_0_10px_rgba(0,0,0,0.8)]"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 flex items-center justify-center bg-emerald-500 text-black text-[10px] font-black rounded-full px-1.5 shadow-[0_0_8px_#10b981] border border-black animate-[bounce_1s_infinite]">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Controls Row */}
        <div className="flex items-center gap-3 md:hidden">
          {/* Mobile Cart */}
          <button
            onClick={onOpenCart}
            className="relative p-2 rounded-full border border-zinc-800 bg-zinc-950 text-zinc-300"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-emerald-500 text-black text-[9px] font-black rounded-full">
                {cartCount}
              </span>
            )}
          </button>

          {/* Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-zinc-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-[100%] left-0 w-full bg-black border-b border-zinc-900 py-6 px-6 flex flex-col gap-5 animate-fade-in shadow-2xl">
          <nav className="flex flex-col gap-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`font-mono text-left text-sm tracking-widest uppercase py-1 ${
                  currentSection === item.id ? 'text-emerald-400 font-bold' : 'text-zinc-300'
                }`}
              >
                {item.label}
              </button>
            ))}
            
            <button
              onClick={() => handleNavClick('login')}
              className={`font-mono text-left text-sm tracking-widest uppercase py-1 ${
                currentSection === 'login' ? 'text-emerald-400 font-bold' : 'text-zinc-300'
              }`}
            >
              {isLoggedIn ? `Profile (${username || 'Beast'})` : 'Login'}
            </button>
            
            {isLoggedIn && (
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="font-mono text-left text-sm tracking-widest uppercase py-1 text-red-400"
              >
                Logout
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
