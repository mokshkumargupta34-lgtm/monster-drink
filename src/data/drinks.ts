import { DrinkVariety, Review } from '../types';

// Let's import or write the relative paths of our generated images so they bundle correctly
import imgClassic from '../assets/images/monster_classic_can_1784478557802.jpg';
import imgZeroUltra from '../assets/images/monster_zero_ultra_1784478577779.jpg';
import imgMangoLoco from '../assets/images/monster_mango_loco_1784478589181.jpg';
import imgDevil from '../assets/images/monster_devil_can_1784478601991.jpg';
import imgBadApple from '../assets/images/monster_bad_apple_1784478619847.jpg';
import imgPacificPunch from '../assets/images/monster_pacific_punch_1784478631598.jpg';

export interface ExtendedDrinkVariety extends DrinkVariety {
  filterStyle?: string; // CSS Filter to apply for variations
  borderColorClass: string;
  shadowColor: string;
}

export const DRINKS: ExtendedDrinkVariety[] = [
  {
    id: 'classic',
    name: 'Monster Energy Classic',
    tagline: 'Unleash the Beast',
    description: 'Tear into a can of the meanest energy drink on the planet. It is the ideal combo of the right ingredients in the right proportion to deliver the big bad buzz that only Monster can.',
    price: 3.49,
    image: imgClassic,
    themeColor: '#10b981', // Emerald 500
    glowColor: 'rgba(16, 185, 129, 0.5)',
    accentColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    borderColorClass: 'border-emerald-500/40',
    shadowColor: 'shadow-emerald-500/20',
    bgGradient: 'from-zinc-950 via-zinc-900 to-emerald-950/40',
    caffeine: '160mg',
    taurine: '1000mg',
    sugar: '54g',
    calories: '210',
    rating: 4.9,
    reviewsCount: 1420,
    flavorProfile: 'Sweet & Salty, smooth carbonation with an intense energy punch.',
    badge: 'Best Seller'
  },
  {
    id: 'zero-ultra',
    name: 'Monster Zero Ultra',
    tagline: 'The White Monster',
    description: 'Some people are impossible to please. As soon as they get what they thought they wanted, they always want more. Zero Ultra is lighter-tasting, zero sugar, and zero calories, with a full load of our energy blend.',
    price: 3.49,
    image: imgZeroUltra,
    themeColor: '#f4f4f5', // Zinc 100
    glowColor: 'rgba(244, 244, 245, 0.4)',
    accentColor: 'text-zinc-200',
    borderColor: 'border-zinc-500/30',
    borderColorClass: 'border-zinc-500/40',
    shadowColor: 'shadow-zinc-300/10',
    bgGradient: 'from-zinc-950 via-zinc-900 to-zinc-800/20',
    caffeine: '140mg',
    taurine: '1000mg',
    sugar: '0g',
    calories: '10',
    rating: 4.8,
    reviewsCount: 980,
    flavorProfile: 'Light, crisp and refreshing citrus flavor with zero sugar.',
    badge: 'Sugar Free'
  },
  {
    id: 'mango-loco',
    name: 'Monster Mango Loco',
    tagline: 'Heavenly Juiced Experience',
    description: 'Mango Loco is a heavenly blend of exotic juices, certain to attract even the most stubborn spirit. Crazy good taste with just enough of that Monster magic to keep the party going for days.',
    price: 3.79,
    image: imgMangoLoco,
    // Mango: amber, not the sky palette this carried — it was swapped with
    // Pacific Punch's, so every glow and accent for the two ran the other's
    // colour. The button artwork letters this one at #e48026.
    themeColor: '#f59e0b', // Amber 500
    glowColor: 'rgba(245, 158, 11, 0.5)',
    accentColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    borderColorClass: 'border-amber-500/40',
    shadowColor: 'shadow-amber-500/20',
    bgGradient: 'from-zinc-950 via-zinc-900 to-amber-950/40',
    caffeine: '152mg',
    taurine: '900mg',
    sugar: '48g',
    calories: '180',
    rating: 4.9,
    reviewsCount: 1150,
    flavorProfile: 'Explosive, tropical mango juice blend with smooth carbonation.',
    badge: 'Juice'
  },
  {
    id: 'bad-apple',
    name: 'Juiced Bad Apple',
    tagline: 'Irresistible Temptation',
    description: 'Do not tempt fate, unleash your bad side with Juiced Bad Apple. A rebellious crisp apple juice blend infused with the full, legendary Monster energy mix. Sweet, tart, and completely addictive.',
    price: 3.79,
    image: imgBadApple,
    themeColor: '#ef4444', // Red 500
    glowColor: 'rgba(239, 68, 68, 0.5)',
    accentColor: 'text-red-400',
    borderColor: 'border-red-500/30',
    borderColorClass: 'border-red-500/40',
    shadowColor: 'shadow-red-500/20',
    bgGradient: 'from-zinc-950 via-zinc-900 to-red-950/40',
    caffeine: '160mg',
    taurine: '1000mg',
    sugar: '50g',
    calories: '190',
    rating: 4.7,
    reviewsCount: 430,
    flavorProfile: 'Crisp, slightly sour green apple with a rich juiced texture.',
    badge: 'New Flavor'
  },
  {
    id: 'pacific-punch',
    name: 'Monster Pacific Punch',
    tagline: 'Classic Sailor Tattoo Vibes',
    description: 'Pacific Punch is lighter, less sweet, and more refined than traditional fruit punches. It is styled after classic sailor tattoos with a deep tropical juice profile of cherry, orange, pineapple, and apple.',
    price: 3.79,
    image: imgPacificPunch,
    // Pacific: sky, the other half of the swap described on Mango Loco. The
    // button artwork letters this one at #4990d2.
    themeColor: '#38bdf8', // Sky 400
    glowColor: 'rgba(56, 189, 248, 0.5)',
    accentColor: 'text-sky-400',
    borderColor: 'border-sky-500/30',
    borderColorClass: 'border-sky-500/40',
    shadowColor: 'shadow-sky-500/20',
    bgGradient: 'from-zinc-950 via-zinc-900 to-sky-950/40',
    caffeine: '160mg',
    taurine: '950mg',
    sugar: '46g',
    calories: '170',
    rating: 4.8,
    reviewsCount: 750,
    flavorProfile: 'Deep tropical fruit punch featuring sweet cherry and pineapple notes.',
    badge: 'Punch'
  },
  {
    id: 'devil-reserve',
    name: "Devil's Special Reserve",
    tagline: 'From the Shadows',
    description: 'Born in the abyss of raw energy. An elite, hyper-charged edition reserved for the boldest of beasts. Infused with double ginseng, dynamic B-vitamins, and a black-magic extreme energy finish.',
    price: 4.29,
    image: imgDevil,
    themeColor: '#22c55e', // Green 500
    glowColor: 'rgba(34, 197, 94, 0.6)',
    accentColor: 'text-green-400',
    borderColor: 'border-green-500/30',
    borderColorClass: 'border-green-500/40',
    shadowColor: 'shadow-green-500/30',
    bgGradient: 'from-zinc-950 via-zinc-900 to-emerald-900/60',
    caffeine: '180mg',
    taurine: '1200mg',
    sugar: '55g',
    calories: '220',
    rating: 4.95,
    reviewsCount: 560,
    flavorProfile: 'Super intense herbal energy flavor, crisp ginseng bite.',
    badge: 'Limited Edition'
  },
  {
    id: 'nitro-dry',
    name: 'Monster Nitro Super Dry',
    tagline: 'Nitrous Charged Buzz',
    description: 'Super Dry is infused with nitrous oxide creating a unique, smooth, creamy texture and citrus taste that is out of this world. It is dry, carbonated, and packs a legendary punch.',
    price: 3.99,
    image: imgClassic, // base classic image
    filterStyle: 'hue-rotate(60deg) saturate(1.4)', // shifts classic green to a bright neon lime/yellow!
    themeColor: '#a3e635', // Lime 400
    glowColor: 'rgba(163, 230, 53, 0.5)',
    accentColor: 'text-lime-400',
    borderColor: 'border-lime-500/30',
    borderColorClass: 'border-lime-500/40',
    shadowColor: 'shadow-lime-500/20',
    bgGradient: 'from-zinc-950 via-zinc-900 to-lime-950/40',
    caffeine: '160mg',
    taurine: '1000mg',
    sugar: '51g',
    calories: '200',
    rating: 4.7,
    reviewsCount: 380,
    flavorProfile: 'Ultra-creamy citrus mousse style mouthfeel, dry bubbly finish.',
    badge: 'Nitrous Charged'
  },
  {
    id: 'ultra-violet',
    name: 'Monster Ultra Violet',
    tagline: 'Purple Pixie Power',
    description: 'Welcome to the 70s. A purple haze all in my brain... Ultra Violet is sweet, tart, and sugar-free. Light, crisp, refreshing with a mysterious grape and sweet-tart berry energy fusion.',
    price: 3.49,
    image: imgZeroUltra, // base white can image
    filterStyle: 'hue-rotate(240deg) saturate(1.8) brightness(0.85)', // transforms silver/white into an electric violet purple!
    themeColor: '#c084fc', // Purple 400
    glowColor: 'rgba(192, 132, 252, 0.5)',
    accentColor: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    borderColorClass: 'border-purple-500/40',
    shadowColor: 'shadow-purple-500/20',
    bgGradient: 'from-zinc-950 via-zinc-900 to-purple-950/40',
    caffeine: '140mg',
    taurine: '1000mg',
    sugar: '0g',
    calories: '10',
    rating: 4.8,
    reviewsCount: 840,
    flavorProfile: 'Lightly sweet and tart grape flavor, with zero calories.',
    badge: 'Zero Sugar'
  },
  {
    id: 'pipeline-punch',
    name: 'Monster Pipeline Punch',
    tagline: 'The Perfect Hawaiian Wave',
    description: 'The perfect blend of the best flavors Hawaii has to offer: passion fruit, orange, and guava, then "Monsterized" with a full load of our famous energy blend. A true tropical masterpiece.',
    price: 3.79,
    image: imgMangoLoco, // base mango loco blue image
    filterStyle: 'hue-rotate(150deg) saturate(1.6)', // transforms blue/orange into a gorgeous pink coral/pink magenta!
    themeColor: '#f472b6', // Pink 400
    glowColor: 'rgba(244, 114, 182, 0.5)',
    accentColor: 'text-pink-400',
    borderColor: 'border-pink-500/30',
    borderColorClass: 'border-pink-500/40',
    shadowColor: 'shadow-pink-500/20',
    bgGradient: 'from-zinc-950 via-zinc-900 to-pink-950/40',
    caffeine: '160mg',
    taurine: '950mg',
    sugar: '45g',
    calories: '165',
    rating: 4.9,
    reviewsCount: 1680,
    flavorProfile: 'Sweet, smooth combination of passion fruit, orange, and guava juices.',
    badge: 'Popular Juice'
  }
];

export const REVIEWS: Review[] = [
  {
    id: 'rev-1',
    author: 'Alex Carter',
    rating: 5,
    text: 'This classic is the fuel for my late-night coding and gaming sessions. The styling on this store is insane, matches the vibes completely!',
    date: '2026-07-15'
  },
  {
    id: 'rev-2',
    author: 'Jessica Miller',
    rating: 5,
    text: 'Zero Ultra is literally my daily morning go-to. Cold and crisp! Ordering on this site was smooth, love the 3D-like parallax details.',
    date: '2026-07-18'
  },
  {
    id: 'rev-3',
    author: 'Vince Stark',
    rating: 4.8,
    text: 'Bad Apple is a game-changer! Tastes like sweet green apple cider but with the legendary Monster buzz. Absolute masterpiece!',
    date: '2026-07-10'
  }
];
