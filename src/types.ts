export interface DrinkVariety {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  image: string;
  themeColor: string; // e.g., "#10b981"
  glowColor: string;  // e.g., "rgba(16, 185, 129, 0.4)"
  accentColor: string; // e.g., "text-emerald-400"
  borderColor: string; // e.g., "border-emerald-500/30"
  bgGradient: string; // e.g., "from-black via-zinc-950 to-emerald-950"
  caffeine: string;
  taurine: string;
  sugar: string;
  calories: string;
  rating: number;
  reviewsCount: number;
  flavorProfile: string;
  badge?: string;
  filterStyle?: string;
}

export interface CartItem {
  id: string; // combination of variety.id + packSize
  variety: DrinkVariety;
  quantity: number;
  packSize: number; // 4, 12, 24
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
}

export type NavSection = 'home' | 'varieties' | 'about' | 'login' | 'cart';
