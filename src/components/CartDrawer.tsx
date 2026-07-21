import React, { useState } from 'react';
import { CartItem, DrinkVariety } from '../types';
import { X, ShoppingBag, Trash2, ArrowRight, Sparkles, CreditCard, CheckCircle, Ticket } from 'lucide-react';
import { ButtonColorful } from './ui/button-colorful';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, newQty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  isLoggedIn: boolean;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  isLoggedIn
}: CartDrawerProps) {
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'details' | 'success'>('cart');
  const [formData, setFormData] = useState({
    name: isLoggedIn ? 'BEAST CODER' : '',
    email: '',
    address: 'MONSTER ARENA SECTOR 9',
    cardNumber: '4111 •••• •••• 9981'
  });

  if (!isOpen) return null;

  // Sound oscillators for checkout and button reactions
  const playBeep = (freq = 440) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {}
  };

  const getSinglePackPrice = (basePrice: number, size: number) => {
    if (size === 4) return Number((basePrice * 4 * 0.95).toFixed(2));
    if (size === 12) return Number((basePrice * 12 * 0.90).toFixed(2));
    return Number((basePrice * 24 * 0.85).toFixed(2));
  };

  // Pricing calculations
  const subtotal = cartItems.reduce((acc, item) => {
    const pricePerPack = getSinglePackPrice(item.variety.price, item.packSize);
    return acc + (pricePerPack * item.quantity);
  }, 0);

  const discount = promoApplied ? subtotal * 0.15 : 0; // 15% custom promo discount
  const shipping = subtotal > 50 ? 0 : 4.99;
  const total = subtotal - discount + shipping;

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'UNLEASH15') {
      setPromoApplied(true);
      playBeep(880);
    } else {
      alert('INVALID CODE. TRY "UNLEASH15" TO UNLOCK 15% SPECIAL SAVINGS.');
      playBeep(220);
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCheckingOut(true);
    playBeep(600);

    // Simulate epic transactions
    setTimeout(() => {
      setIsCheckingOut(false);
      setCheckoutStep('success');
      playBeep(1000);
      onClearCart();
    }, 2500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden flex justify-end"
      id="cart-drawer-backdrop"
    >
      {/* Semi-transparent dark blur backdrop */}
      <div 
        onClick={() => {
          if (checkoutStep !== 'success') onClose();
        }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Slide-out Panel container */}
      <div 
        className="relative w-full max-w-lg h-full bg-black border-l border-zinc-900 shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-left"
        id="cart-drawer-panel"
      >
        {/* Animated header block */}
        <div className="p-6 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            <h3 className="font-sans font-black text-xl text-white uppercase tracking-tight">
              {checkoutStep === 'cart' ? 'Beast Cart' : checkoutStep === 'details' ? 'Secure Dispatch' : 'Order Unleashed'}
            </h3>
          </div>
          {checkoutStep !== 'success' && (
            <button 
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Dynamic content sections depending on checkout state */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {checkoutStep === 'cart' && (
            <>
              {cartItems.length === 0 ? (
                <div className="h-[60%] flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full border border-zinc-900 bg-zinc-950 flex items-center justify-center text-zinc-600">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-sans font-bold text-lg text-white uppercase">Your cart is empty</h4>
                    <p className="text-xs text-zinc-500 font-mono tracking-wide max-w-[240px] uppercase">
                      No fuel loaded into system. Fill up on varieties.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => {
                    const pricePerPack = getSinglePackPrice(item.variety.price, item.packSize);
                    return (
                      <div 
                        key={item.id}
                        className="flex gap-4 p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 relative group"
                      >
                        {/* Can Thumbnail Image */}
                        <div className="w-20 h-20 bg-zinc-950 rounded-lg border border-zinc-900 overflow-hidden flex items-center justify-center relative shrink-0">
                          <img 
                            src={item.variety.image} 
                            alt={item.variety.name}
                            className="w-14 h-auto object-cover pointer-events-none"
                            style={{ filter: item.variety.filterStyle || 'none' }}
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Item specs and controls */}
                        <div className="flex-1 flex flex-col justify-between text-left">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-sans font-bold text-sm text-white uppercase leading-tight">
                                {item.variety.name}
                              </h4>
                              
                              {/* Remove Item */}
                              <button
                                onClick={() => {
                                  onRemoveItem(item.id);
                                  playBeep(200);
                                }}
                                className="text-zinc-600 hover:text-red-400 p-0.5 cursor-pointer transition-colors duration-200"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <span className="font-mono text-[10px] text-zinc-400 uppercase mt-0.5 block">
                              Bundle: {item.packSize}-Pack ({item.variety.id})
                            </span>
                          </div>

                          {/* Controls Row */}
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-mono text-xs text-emerald-400 font-bold">
                              ${(pricePerPack * item.quantity).toFixed(2)}
                            </span>

                            {/* Quantity buttons */}
                            <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-900 p-0.5 rounded-md">
                              <button
                                onClick={() => {
                                  onUpdateQuantity(item.id, Math.max(1, item.quantity - 1));
                                  playBeep(250);
                                }}
                                className="w-6 h-6 rounded bg-zinc-900 text-zinc-300 font-mono text-xs flex items-center justify-center hover:bg-zinc-800"
                              >
                                -
                              </button>
                              <span className="font-mono text-xs text-white text-center w-6 select-none">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => {
                                  onUpdateQuantity(item.id, item.quantity + 1);
                                  playBeep(350);
                                }}
                                className="w-6 h-6 rounded bg-zinc-900 text-zinc-300 font-mono text-xs flex items-center justify-center hover:bg-zinc-800"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Details & Secure Dispatch Page */}
          {checkoutStep === 'details' && (
            <form onSubmit={handleCheckoutSubmit} className="space-y-5 text-left">
              <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-900 mb-2">
                <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">ORDER SUMMARY:</span>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="font-sans font-black text-xl text-white">{cartItems.length} DISTINCT BUNDLES</span>
                  <span className="font-mono text-sm text-emerald-400 font-bold">${total.toFixed(2)} USD</span>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest">Recipient Beast Name:</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="e.g. AGENT BEAST"
                  className="block w-full px-4 py-3 bg-zinc-950/90 border border-zinc-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest">Dispatch Email Address:</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  placeholder="e.g. system@beast.com"
                  className="block w-full px-4 py-3 bg-zinc-950/90 border border-zinc-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest">Delivery Coordinates / Address:</label>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  required
                  placeholder="e.g. MONSTER ARENA SECTOR 9"
                  className="block w-full px-4 py-3 bg-zinc-950/90 border border-zinc-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Card info */}
              <div className="space-y-1">
                <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest">Payment Security Card:</label>
                <div className="relative rounded-lg border border-zinc-800 bg-zinc-950/90 focus-within:border-emerald-500/50">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <input 
                    type="text" 
                    value={formData.cardNumber}
                    onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
                    required
                    className="block w-full pl-10 pr-4 py-3 bg-transparent text-xs font-mono text-white focus:outline-none"
                    placeholder="4111 2222 3333 4444"
                  />
                </div>
              </div>

              {/* Action */}
              <ButtonColorful
                type="submit"
                disabled={isCheckingOut}
                className="w-full h-auto py-4 font-mono font-black text-xs tracking-widest uppercase"
              >
                {isCheckingOut ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Charging Core...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    CONFIRM & DISPATCH ORDER
                  </>
                )}
              </ButtonColorful>
            </form>
          )}

          {/* Success receipt page */}
          {checkoutStep === 'success' && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 p-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-8 h-8 animate-pulse" />
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">TRANSACTION SECURED</span>
                <h4 className="font-sans font-black text-2xl text-white uppercase tracking-tight">ORDER DISPATCHED!</h4>
                <p className="text-xs text-zinc-400 font-mono tracking-wide mt-1 uppercase">
                  System code: #MST-{Math.floor(Math.random() * 900000 + 100000)}
                </p>
              </div>

              <div className="w-full bg-zinc-950/60 rounded-xl border border-zinc-900 p-5 text-left space-y-3.5 max-w-sm">
                <h5 className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-2">SHIPMENT CO-ORDINATES:</h5>
                <div className="font-mono text-[11px] space-y-1.5 text-zinc-300">
                  <div className="flex justify-between"><span className="text-zinc-500">Recipient:</span> <span className="font-bold">{formData.name || 'BEAST'}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Address:</span> <span className="font-bold">{formData.address}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Status:</span> <span className="text-emerald-400 font-bold animate-pulse">PREPARING CARGO</span></div>
                </div>
              </div>

              <ButtonColorful
                onClick={() => {
                  setCheckoutStep('cart');
                  onClose();
                  playBeep(400);
                }}
                className="w-full max-w-xs h-auto py-4 font-mono text-xs uppercase tracking-widest"
              >
                Close Receipt
              </ButtonColorful>
            </div>
          )}
        </div>

        {/* Pricing Subtotals row */}
        {cartItems.length > 0 && checkoutStep === 'cart' && (
          <div className="p-6 border-t border-zinc-900 bg-zinc-950/90 space-y-4">
            
            {/* Promo Code input */}
            <div className="flex gap-2">
              <div className="relative flex-1 bg-zinc-950 border border-zinc-900 rounded-lg focus-within:border-emerald-500/40">
                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="text" 
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  disabled={promoApplied}
                  placeholder={promoApplied ? "15% PROMO ACTIVE" : "ENTER PROMO CODE (UNLEASH15)"}
                  className="w-full bg-transparent pl-10 pr-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none"
                />
              </div>
              <ButtonColorful
                onClick={handleApplyPromo}
                disabled={promoApplied || !promoCode.trim()}
                className="h-auto px-4 py-2 text-xs font-mono"
              >
                Apply
              </ButtonColorful>
            </div>

            {/* Price lines */}
            <div className="font-mono text-xs space-y-2 text-zinc-400">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="text-zinc-200 font-bold">${subtotal.toFixed(2)}</span>
              </div>
              {promoApplied && (
                <div className="flex justify-between text-emerald-400">
                  <span>Special (15%):</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Dispatch / Cargo:</span>
                <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-white border-t border-zinc-900 pt-3 text-sm font-black">
                <span className="font-sans uppercase">Total Fuel:</span>
                <span className="font-sans text-emerald-400">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout action Button */}
            <ButtonColorful
              onClick={() => {
                setCheckoutStep('details');
                playBeep(500);
              }}
              className="w-full h-auto py-4 font-mono font-black text-xs tracking-widest uppercase hover:shadow-[0_4px_20px_#10b981]"
            >
              Dispatch Cargo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </ButtonColorful>
          </div>
        )}

      </div>

      <style>{`
        @keyframes slideLeft {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-left {
          animation: slideLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
