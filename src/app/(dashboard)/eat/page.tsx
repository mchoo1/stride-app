'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useStrideStore } from '@/lib/store';
import type { DietaryFlag } from '@/types';

// ── Nearby place (from Google Places API) ────────────────────────────────────
interface NearbyPlace {
  id: string; name: string; type: string; distance: string; distKm?: number;
  rating: number | null; priceLevel: string | null;
  hours: string; emoji: string; mapsUrl: string;
}

// ── Dish recommendation mapped per cuisine type ───────────────────────────────
interface DishRec {
  dish: string; emoji: string; price: number;
  calories: number; protein: number; carbs: number; fat: number;
  compatibleWith: DietaryFlag[];
}

// Maps Google Places primaryType (spaces) → typical dish
const CUISINE_MAP: Record<string, DishRec> = {
  'halal restaurant':     { dish: 'Chicken Rice',         emoji: '🍗', price: 4.50, calories: 450, protein: 32, carbs: 55, fat:  9, compatibleWith: ['halal', 'gluten_free', 'lactose_free'] },
  'restaurant':           { dish: 'Grilled Chicken Set',  emoji: '🍽️', price: 12.0, calories: 480, protein: 38, carbs: 35, fat: 12, compatibleWith: ['gluten_free'] },
  'fast food restaurant': { dish: 'Chicken Burger Meal',  emoji: '🍔', price: 6.50, calories: 650, protein: 28, carbs: 70, fat: 22, compatibleWith: [] },
  'cafe':                 { dish: 'Egg Breakfast Set',    emoji: '🍳', price: 12.0, calories: 420, protein: 22, carbs: 30, fat: 18, compatibleWith: ['vegetarian', 'gluten_free'] },
  'bakery':               { dish: 'Tuna Sandwich',        emoji: '🥪', price: 4.00, calories: 320, protein: 18, carbs: 42, fat:  8, compatibleWith: ['lactose_free'] },
  'meal takeaway':        { dish: 'Mixed Rice (2 sides)', emoji: '🍱', price: 4.00, calories: 480, protein: 20, carbs: 65, fat: 10, compatibleWith: ['vegetarian', 'vegan', 'gluten_free', 'halal', 'lactose_free'] },
  'bar and grill':        { dish: 'Grilled Chicken',      emoji: '🍗', price: 14.0, calories: 380, protein: 32, carbs:  5, fat: 22, compatibleWith: ['gluten_free', 'keto', 'lactose_free'] },
  'seafood restaurant':   { dish: 'Steamed Fish Fillet',  emoji: '🐟', price: 15.0, calories: 280, protein: 35, carbs:  5, fat:  8, compatibleWith: ['gluten_free', 'lactose_free', 'halal', 'keto'] },
  'chinese restaurant':   { dish: 'Steamed Chicken Rice', emoji: '🍗', price: 5.00, calories: 420, protein: 30, carbs: 50, fat:  8, compatibleWith: ['gluten_free', 'lactose_free'] },
  'japanese restaurant':  { dish: 'Chicken Teriyaki Set', emoji: '🍱', price: 14.0, calories: 520, protein: 32, carbs: 60, fat: 10, compatibleWith: ['lactose_free'] },
  'korean restaurant':    { dish: 'Bibimbap',             emoji: '🥘', price: 14.0, calories: 560, protein: 25, carbs: 80, fat: 12, compatibleWith: ['gluten_free'] },
  'indian restaurant':    { dish: 'Dal & Roti',           emoji: '🫓', price: 8.00, calories: 480, protein: 18, carbs: 72, fat: 12, compatibleWith: ['vegetarian', 'vegan', 'halal', 'lactose_free'] },
  'thai restaurant':      { dish: 'Thai Basil Chicken',   emoji: '🌿', price: 10.0, calories: 450, protein: 28, carbs: 45, fat: 12, compatibleWith: ['gluten_free', 'halal'] },
  'western restaurant':   { dish: 'Grilled Salmon',       emoji: '🐟', price: 18.0, calories: 450, protein: 40, carbs: 25, fat: 18, compatibleWith: ['gluten_free', 'lactose_free', 'keto'] },
};
const FALLBACK_DISH: DishRec = { dish: 'House Special', emoji: '🍽️', price: 10.0, calories: 480, protein: 25, carbs: 50, fat: 15, compatibleWith: [] };

// ── Food item for Grab & Go / Convenience ─────────────────────────────────────
interface FoodItem {
  id: string; brand: string; dish: string; emoji: string;
  price: number; calories: number; protein: number; carbs: number; fat: number;
  compatibleWith: DietaryFlag[]; category: 'grab_go' | 'convenience'; tag: string;
}

const FOOD_ITEMS: FoodItem[] = [
  // ── McDonald's ──────────────────────────────────────────────────────────────
  { id: 'gg1',  brand: "McDonald's",    dish: 'McChicken',              emoji: '🍔', price: 3.30, calories: 310, protein: 14, carbs: 36, fat: 12, compatibleWith: [],                                              category: 'grab_go',    tag: 'Fast Food'  },
  { id: 'gg2',  brand: "McDonald's",    dish: 'Egg McMuffin',           emoji: '🥚', price: 4.50, calories: 300, protein: 18, carbs: 29, fat: 12, compatibleWith: ['vegetarian'],                                  category: 'grab_go',    tag: 'Breakfast'  },
  { id: 'gg3',  brand: "McDonald's",    dish: 'Grilled Chicken Salad',  emoji: '🥗', price: 8.50, calories: 180, protein: 28, carbs: 10, fat:  5, compatibleWith: ['gluten_free', 'keto', 'lactose_free'],          category: 'grab_go',    tag: 'Salad'      },
  { id: 'gg4',  brand: "McDonald's",    dish: 'Double McSpicy',         emoji: '🌶️', price: 7.00, calories: 490, protein: 26, carbs: 43, fat: 22, compatibleWith: [],                                              category: 'grab_go',    tag: 'Fast Food'  },
  // ── KFC ─────────────────────────────────────────────────────────────────────
  { id: 'gg5',  brand: 'KFC',           dish: 'Original Chicken (1pc)', emoji: '🍗', price: 4.20, calories: 270, protein: 27, carbs: 11, fat: 13, compatibleWith: ['keto', 'gluten_free'],                          category: 'grab_go',    tag: 'Fast Food'  },
  { id: 'gg6',  brand: 'KFC',           dish: 'Zinger Burger',          emoji: '🍔', price: 5.90, calories: 480, protein: 28, carbs: 46, fat: 18, compatibleWith: [],                                              category: 'grab_go',    tag: 'Fast Food'  },
  // ── Subway ───────────────────────────────────────────────────────────────────
  { id: 'gg7',  brand: 'Subway',        dish: '6" Turkey Breast',       emoji: '🥪', price: 7.50, calories: 280, protein: 22, carbs: 44, fat:  4, compatibleWith: ['lactose_free'],                                 category: 'grab_go',    tag: 'Sandwich'   },
  { id: 'gg8',  brand: 'Subway',        dish: '6" Chicken Breast',      emoji: '🥪', price: 7.50, calories: 320, protein: 26, carbs: 45, fat:  5, compatibleWith: ['lactose_free'],                                 category: 'grab_go',    tag: 'Sandwich'   },
  { id: 'gg9',  brand: 'Subway',        dish: 'Veggie Delight (6")',    emoji: '🥗', price: 7.00, calories: 230, protein: 10, carbs: 44, fat:  3, compatibleWith: ['vegetarian', 'vegan', 'lactose_free'],           category: 'grab_go',    tag: 'Sandwich'   },
  // ── Old Chang Kee ────────────────────────────────────────────────────────────
  { id: 'gg10', brand: 'Old Chang Kee', dish: 'Curry Puff',             emoji: '🥟', price: 1.80, calories: 220, protein:  5, carbs: 28, fat: 10, compatibleWith: ['halal'],                                        category: 'grab_go',    tag: 'Snack'      },
  { id: 'gg11', brand: 'Old Chang Kee', dish: 'Chicken Wing',           emoji: '🍗', price: 2.00, calories: 180, protein: 15, carbs:  8, fat: 10, compatibleWith: ['halal', 'gluten_free'],                          category: 'grab_go',    tag: 'Snack'      },
  // ── Hawker Centre ────────────────────────────────────────────────────────────
  { id: 'gg12', brand: 'Hawker Centre', dish: 'Chicken Rice',           emoji: '🍗', price: 4.00, calories: 450, protein: 30, carbs: 55, fat:  9, compatibleWith: ['halal', 'gluten_free', 'lactose_free'],          category: 'grab_go',    tag: 'Local'      },
  { id: 'gg13', brand: 'Hawker Centre', dish: 'Char Kway Teow',         emoji: '🍜', price: 4.50, calories: 570, protein: 18, carbs: 72, fat: 20, compatibleWith: [],                                              category: 'grab_go',    tag: 'Local'      },
  { id: 'gg14', brand: 'Hawker Centre', dish: 'Yong Tau Fu (8pcs)',     emoji: '🍲', price: 5.00, calories: 380, protein: 20, carbs: 48, fat:  8, compatibleWith: ['vegetarian', 'vegan', 'gluten_free', 'halal', 'lactose_free'], category: 'grab_go', tag: 'Local' },
  { id: 'gg15', brand: 'Hawker Centre', dish: 'Bee Hoon w/ Tofu & Veg',emoji: '🍜', price: 3.50, calories: 320, protein: 14, carbs: 52, fat:  6, compatibleWith: ['vegetarian', 'vegan', 'halal', 'lactose_free'],  category: 'grab_go',    tag: 'Local'      },
  { id: 'gg16', brand: 'Hawker Centre', dish: 'Economy Rice (3 sides)', emoji: '🍱', price: 4.00, calories: 520, protein: 22, carbs: 68, fat: 14, compatibleWith: ['gluten_free', 'lactose_free'],                  category: 'grab_go',    tag: 'Local'      },
  // ── Convenience — 7-Eleven & FairPrice ──────────────────────────────────────
  { id: 'cv1',  brand: '7-Eleven',      dish: 'Hard Boiled Eggs (2pc)', emoji: '🥚', price: 1.20, calories: 140, protein: 12, carbs:  1, fat: 10, compatibleWith: ['vegetarian', 'gluten_free', 'lactose_free', 'keto', 'halal'], category: 'convenience', tag: 'Protein' },
  { id: 'cv2',  brand: '7-Eleven',      dish: 'Tuna Onigiri',          emoji: '🍙', price: 2.50, calories: 230, protein: 12, carbs: 38, fat:  3, compatibleWith: ['lactose_free', 'halal'],                         category: 'convenience', tag: 'Snack'      },
  { id: 'cv3',  brand: '7-Eleven',      dish: 'Egg Mayo Sandwich',     emoji: '🥪', price: 2.80, calories: 280, protein: 12, carbs: 32, fat:  9, compatibleWith: ['vegetarian', 'halal'],                           category: 'convenience', tag: 'Snack'      },
  { id: 'cv4',  brand: 'FairPrice',     dish: 'Chicken Breast (100g)', emoji: '🍗', price: 4.50, calories: 165, protein: 31, carbs:  2, fat:  4, compatibleWith: ['gluten_free', 'lactose_free', 'halal', 'keto'],   category: 'convenience', tag: 'Protein'    },
  { id: 'cv5',  brand: '7-Eleven',      dish: 'High Protein Milk',     emoji: '🥛', price: 2.80, calories: 130, protein: 10, carbs: 15, fat:  3, compatibleWith: ['vegetarian', 'gluten_free', 'halal'],             category: 'convenience', tag: 'Drink'      },
  { id: 'cv6',  brand: '7-Eleven',      dish: 'Protein Bar',           emoji: '🍫', price: 3.80, calories: 200, protein: 21, carbs: 22, fat:  7, compatibleWith: ['vegetarian', 'gluten_free'],                     category: 'convenience', tag: 'Protein'    },
  { id: 'cv7',  brand: '7-Eleven',      dish: 'Greek Yogurt (150g)',   emoji: '🥛', price: 2.50, calories:  90, protein: 15, carbs:  7, fat:  0, compatibleWith: ['vegetarian', 'gluten_free'],                     category: 'convenience', tag: 'Dairy'      },
  { id: 'cv8',  brand: '7-Eleven',      dish: 'Mixed Nuts (30g)',      emoji: '🥜', price: 2.20, calories: 180, protein:  5, carbs:  6, fat: 16, compatibleWith: ['vegetarian', 'vegan', 'gluten_free', 'lactose_free', 'halal', 'keto'], category: 'convenience', tag: 'Snack' },
  { id: 'cv9',  brand: 'FairPrice',     dish: 'Smoked Salmon (50g)',   emoji: '🐟', price: 4.80, calories: 100, protein: 16, carbs:  0, fat:  4, compatibleWith: ['gluten_free', 'lactose_free', 'keto'],             category: 'convenience', tag: 'Protein'    },
  { id: 'cv10', brand: '7-Eleven',      dish: 'Oatmeal Cup',           emoji: '🥣', price: 2.80, calories: 180, protein:  5, carbs: 32, fat:  3, compatibleWith: ['vegetarian', 'vegan', 'halal', 'lactose_free'],   category: 'convenience', tag: 'Breakfast'  },
  { id: 'cv11', brand: '7-Eleven',      dish: 'Cottage Cheese (100g)', emoji: '🧀', price: 3.50, calories:  98, protein: 11, carbs:  3, fat:  4, compatibleWith: ['vegetarian', 'gluten_free'],                     category: 'convenience', tag: 'Dairy'      },
  { id: 'cv12', brand: 'FairPrice',     dish: 'Tuna Can (85g)',        emoji: '🐟', price: 2.20, calories: 110, protein: 24, carbs:  0, fat:  1, compatibleWith: ['gluten_free', 'lactose_free', 'halal', 'keto'],   category: 'convenience', tag: 'Protein'    },
  { id: 'cv13', brand: '7-Eleven',      dish: 'Banana',                emoji: '🍌', price: 0.80, calories: 105, protein:  1, carbs: 27, fat:  0, compatibleWith: ['vegetarian', 'vegan', 'gluten_free', 'lactose_free', 'halal'], category: 'convenience', tag: 'Fruit' },
  { id: 'cv14', brand: 'FairPrice',     dish: 'String Cheese (2pc)',   emoji: '🧀', price: 2.00, calories: 160, protein: 14, carbs:  2, fat: 10, compatibleWith: ['vegetarian', 'gluten_free', 'keto'],              category: 'convenience', tag: 'Dairy'      },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const DIET_LABEL: Record<DietaryFlag, string> = {
  vegetarian: '🥦 Vegetarian', vegan: '🌱 Vegan',
  gluten_free: '🌾 Gluten-Free', lactose_free: '🥛 Lactose-Free',
  keto: '🥑 Keto', halal: '☪️ Halal', kosher: '✡️ Kosher',
};

type DietFit = 'great' | 'check' | 'warn' | 'neutral';

function getDietFit(compatibleWith: DietaryFlag[], userFlags: DietaryFlag[]): DietFit {
  if (!userFlags.length) return 'neutral';
  if (userFlags.every(f => compatibleWith.includes(f))) return 'great';
  if (userFlags.some(f => compatibleWith.includes(f))) return 'check';
  return 'warn';
}

function ppd(protein: number, price: number) {
  return price > 0 ? Math.round((protein / price) * 10) / 10 : 0;
}
function ppdColor(v: number) {
  return v >= 6 ? '#00E676' : v >= 3 ? '#FFD166' : '#FF5A5A';
}

function matchScore(
  item: { protein: number; calories: number; carbs: number },
  rem:  { protein: number; calories: number; carbs: number },
) {
  const p = rem.protein  > 0 ? Math.min(item.protein  / rem.protein,  1) : 0;
  const c = rem.calories > 0 ? Math.min(item.calories / rem.calories, 1) : 0;
  const b = rem.carbs    > 0 ? Math.min(item.carbs    / rem.carbs,    1) : 0;
  return p * 0.55 + c * 0.30 + b * 0.15;
}

type SortKey = 'best_match' | 'protein_dollar' | 'price' | 'distance';

// ── Diet fit badge ────────────────────────────────────────────────────────────
function DietBadge({ fit }: { fit: DietFit }) {
  if (fit === 'neutral') return null;
  const cfg = {
    great: { bg: 'rgba(0,230,118,0.12)',  border: 'rgba(0,230,118,0.25)',  color: '#00E676', label: '✓ Fits your diet' },
    check: { bg: 'rgba(255,209,102,0.12)', border: 'rgba(255,209,102,0.25)', color: '#FFD166', label: '⚠ Check before ordering' },
    warn:  { bg: 'rgba(255,90,90,0.10)',  border: 'rgba(255,90,90,0.20)',  color: '#FF5A5A', label: '✕ May not suit your diet' },
  }[fit];
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
      background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
    }}>
      {cfg.label}
    </span>
  );
}

// ── Protein/$ badge ───────────────────────────────────────────────────────────
function PpdBadge({ protein, price }: { protein: number; price: number }) {
  const v = ppd(protein, price);
  const c = ppdColor(v);
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6,
      background: `${c}18`, border: `1px solid ${c}40`, color: c,
    }}>
      {v}g/$
    </span>
  );
}

// ── Sort bar ──────────────────────────────────────────────────────────────────
function SortBar({ active, onChange, showDistance }: { active: SortKey; onChange: (k: SortKey) => void; showDistance: boolean }) {
  const opts: { key: SortKey; label: string }[] = [
    { key: 'best_match',     label: '🎯 Best Match'  },
    { key: 'protein_dollar', label: '💪 Protein/$'   },
    { key: 'price',          label: '💰 Price ↑'     },
    ...(showDistance ? [{ key: 'distance' as SortKey, label: '📍 Nearest' }] : []),
  ];
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, marginBottom: 16 }}>
      {opts.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)} style={{
          flexShrink: 0, borderRadius: 999, padding: '6px 12px',
          fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
          background: active === o.key ? '#FF6B35' : '#1E1E2E',
          color:      active === o.key ? '#fff'    : '#6E6E90',
          transition: 'all .2s',
        }}>{o.label}</button>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function EatPage() {
  const store     = useStrideStore();
  const profile   = store.profile;
  const totals    = store.getTodayTotals();
  const burned    = store.getTodayCaloriesBurned();
  const remaining = store.getCaloriesRemaining();
  const userFlags = profile.dietaryFlags ?? [];

  const remProtein = Math.max(0, (profile.targetProtein || 0) - totals.protein);
  const remCarbs   = Math.max(0, (profile.targetCarbs   || 0) - totals.carbs);
  const remCal     = Math.max(0, profile.targetCalories - totals.calories + burned);

  const [tab,      setTab]      = useState<'dine_in' | 'grab_go' | 'convenience'>('dine_in');
  const [sortBy,   setSortBy]   = useState<SortKey>('best_match');
  const [added,    setAdded]    = useState<Set<string>>(new Set());
  const [tagFilter, setTagFilter] = useState('All');

  // ── Nearby places state ───────────────────────────────────────────────────
  const [places,   setPlaces]   = useState<NearbyPlace[]>([]);
  const [locState, setLocState] = useState<'locating' | 'fetching' | 'done' | 'error' | 'no_key'>('locating');
  const [locError, setLocError] = useState('');

  const fetchPlaces = useCallback(async (lat: number, lng: number) => {
    setLocState('fetching');
    try {
      const res  = await fetch(`/api/nearby-places?lat=${lat}&lng=${lng}&type=food`);
      const data = await res.json();
      if (data.error) {
        if (res.status === 503) { setLocState('no_key'); return; }
        throw new Error(data.error);
      }
      setPlaces(data.places ?? []);
      setLocState('done');
    } catch (e) {
      setLocError(e instanceof Error ? e.message : 'Failed to load restaurants');
      setLocState('error');
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) { setLocError('Geolocation not supported'); setLocState('error'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => fetchPlaces(pos.coords.latitude, pos.coords.longitude),
      err => { setLocError(`Location denied: ${err.message}`); setLocState('error'); },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }, [fetchPlaces]);

  // ── Dine-in cards: enrich each place with a dish rec ─────────────────────
  const dineInItems = useMemo(() => {
    return places.map(p => {
      const rec = CUISINE_MAP[p.type] ?? FALLBACK_DISH;
      return { ...p, rec };
    });
  }, [places]);

  // ── Sort dine-in ──────────────────────────────────────────────────────────
  const sortedDineIn = useMemo(() => {
    const rem = { protein: remProtein, calories: remCal, carbs: remCarbs };
    return [...dineInItems].sort((a, b) => {
      if (sortBy === 'best_match')     return matchScore(b.rec, rem) - matchScore(a.rec, rem);
      if (sortBy === 'protein_dollar') return ppd(b.rec.protein, b.rec.price) - ppd(a.rec.protein, a.rec.price);
      if (sortBy === 'price')          return a.rec.price - b.rec.price;
      if (sortBy === 'distance')       return (a.distKm ?? 99) - (b.distKm ?? 99);
      return 0;
    });
  }, [dineInItems, sortBy, remProtein, remCal, remCarbs]);

  // ── Sort grab & convenience ───────────────────────────────────────────────
  const sortedItems = useCallback((cat: 'grab_go' | 'convenience') => {
    const rem  = { protein: remProtein, calories: remCal, carbs: remCarbs };
    const base = FOOD_ITEMS.filter(i => i.category === cat);
    const filtered = tagFilter === 'All' ? base : base.filter(i => i.tag === tagFilter);
    return [...filtered].sort((a, b) => {
      if (sortBy === 'best_match')     return matchScore(b, rem) - matchScore(a, rem);
      if (sortBy === 'protein_dollar') return ppd(b.protein, b.price) - ppd(a.protein, a.price);
      if (sortBy === 'price')          return a.price - b.price;
      return 0;
    });
  }, [sortBy, remProtein, remCal, remCarbs, tagFilter]);

  // ── Tags for current tab ──────────────────────────────────────────────────
  const tagOptions = useMemo(() => {
    const cat = tab === 'grab_go' ? 'grab_go' : 'convenience';
    const tags = Array.from(new Set(FOOD_ITEMS.filter(i => i.category === cat).map(i => i.tag)));
    return ['All', ...tags.sort()];
  }, [tab]);

  // ── Log quick food ────────────────────────────────────────────────────────
  const logItem = (item: FoodItem) => {
    store.addFoodEntry({
      foodItemId: item.id, name: `${item.dish} (${item.brand})`,
      emoji: item.emoji, mealType: 'snack', quantity: 100,
      calories: item.calories, protein: item.protein, carbs: item.carbs, fat: item.fat,
    });
    setAdded(s => new Set([...s, item.id]));
    setTimeout(() => setAdded(s => { const n = new Set(s); n.delete(item.id); return n; }), 2000);
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
    fontSize: 12, fontWeight: 700, cursor: 'pointer',
    background: active ? 'rgba(255,107,53,0.15)' : 'transparent',
    color: active ? '#FF6B35' : '#6E6E90', transition: 'all .2s',
  });

  const card: React.CSSProperties = {
    background: '#161622', borderRadius: 18, padding: 14,
    border: '1px solid rgba(255,255,255,0.06)', marginBottom: 10,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#0C0C14', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div style={{ padding: '52px 20px 16px' }}>
        <h1 style={{ color: '#F0F0F8', fontSize: 22, fontWeight: 900, margin: '0 0 10px' }}>
          What to Eat 🍜
        </h1>

        {/* Kcal pill */}
        <div style={{
          background: 'rgba(255,107,53,0.12)', borderRadius: 14, padding: '9px 14px',
          display: 'inline-flex', alignItems: 'center', gap: 8,
          border: '1px solid rgba(255,107,53,0.20)', marginBottom: 10,
        }}>
          <span style={{ fontSize: 15 }}>🎯</span>
          <span style={{ color: '#FF6B35', fontSize: 14, fontWeight: 700 }}>
            {remaining} kcal remaining today
          </span>
        </div>

        {/* Macro gap row */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Protein', val: remProtein, unit: 'g', color: '#4A9EFF'  },
            { label: 'Carbs',   val: remCarbs,   unit: 'g', color: '#FFD166'  },
          ].map(m => m.val > 0 && (
            <div key={m.label} style={{
              background: `${m.color}10`, border: `1px solid ${m.color}25`,
              borderRadius: 10, padding: '4px 10px',
              fontSize: 11, fontWeight: 700, color: m.color,
            }}>
              Need {m.val}{m.unit} {m.label}
            </div>
          ))}
          {/* Active diet flags */}
          {userFlags.map(f => (
            <div key={f} style={{
              background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.20)',
              borderRadius: 10, padding: '4px 10px',
              fontSize: 11, fontWeight: 700, color: '#00E676',
            }}>
              {DIET_LABEL[f]}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px 100px' }}>

        {/* ── Tab bar ── */}
        <div style={{
          background: '#161622', borderRadius: 16, padding: 4,
          display: 'flex', gap: 4, border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 16,
        }}>
          <button style={tabBtn(tab === 'dine_in')}     onClick={() => { setTab('dine_in');     setTagFilter('All'); }}>🍽️ Dine In</button>
          <button style={tabBtn(tab === 'grab_go')}     onClick={() => { setTab('grab_go');     setTagFilter('All'); }}>🥡 Grab & Go</button>
          <button style={tabBtn(tab === 'convenience')} onClick={() => { setTab('convenience'); setTagFilter('All'); }}>🏪 Store</button>
        </div>

        {/* ── Sort bar ── */}
        <SortBar active={sortBy} onChange={k => setSortBy(k)} showDistance={tab === 'dine_in'} />

        {/* ══════════ DINE IN ══════════ */}
        {tab === 'dine_in' && (
          <>
            {/* Loading / error states */}
            {(locState === 'locating' || locState === 'fetching') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0', marginBottom: 8 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid #FF6B35', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}/>
                <span style={{ fontSize: 13, color: '#6E6E90' }}>
                  {locState === 'locating' ? 'Getting your location…' : 'Finding nearby restaurants…'}
                </span>
              </div>
            )}
            {locState === 'error' && (
              <div style={{ background: 'rgba(255,90,90,0.08)', border: '1px solid rgba(255,90,90,0.20)', borderRadius: 14, padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 8 }}>
                <span>⚠️</span><span style={{ fontSize: 12, color: '#FF5A5A' }}>{locError}</span>
              </div>
            )}
            {locState === 'no_key' && (
              <div style={{ background: 'rgba(74,158,255,0.06)', borderRadius: 14, padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 8, border: '1px solid rgba(74,158,255,0.12)' }}>
                <span>💡</span>
                <span style={{ fontSize: 12, color: '#4A9EFF' }}>
                  Add <code style={{ background: '#1E1E2E', borderRadius: 4, padding: '1px 4px' }}>GOOGLE_PLACES_API_KEY</code> to enable nearby restaurant recommendations.
                </span>
              </div>
            )}

            {/* Best match card */}
            {locState === 'done' && sortedDineIn.length > 0 && (() => {
              const top = sortedDineIn[0];
              const fit = getDietFit(top.rec.compatibleWith, userFlags);
              const pv  = ppd(top.rec.protein, top.rec.price);
              return (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(255,107,53,0.10), rgba(167,139,250,0.08))',
                  borderRadius: 20, padding: 16, marginBottom: 12,
                  border: '1px solid rgba(255,107,53,0.20)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#FF6B35', background: 'rgba(255,107,53,0.15)', borderRadius: 6, padding: '2px 8px' }}>🏆 BEST MATCH</span>
                    {fit !== 'neutral' && <DietBadge fit={fit} />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,107,53,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                      {top.rec.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#F0F0F8', marginBottom: 2 }}>{top.rec.dish}</div>
                      <div style={{ fontSize: 12, color: '#A8A8C8', marginBottom: 6 }}>
                        {top.name} · {top.distance}{top.rating ? ` · ⭐ ${top.rating.toFixed(1)}` : ''}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 16, fontWeight: 900, color: '#FF6B35' }}>${top.rec.price.toFixed(2)}</span>
                        <span style={{ fontSize: 11, color: '#A8A8C8' }}>P{top.rec.protein}g · C{top.rec.carbs}g · F{top.rec.fat}g · {top.rec.calories}kcal</span>
                        <PpdBadge protein={top.rec.protein} price={top.rec.price} />
                      </div>
                    </div>
                    <a href={top.mapsUrl} target="_blank" rel="noopener noreferrer" style={{
                      flexShrink: 0, background: '#FF6B35', color: '#fff',
                      borderRadius: 12, padding: '8px 12px', fontSize: 12, fontWeight: 700, textDecoration: 'none',
                    }}>Map →</a>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 11, color: '#6E6E90', background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '7px 10px' }}>
                    💡 <strong style={{ color: '#A8A8C8' }}>Tip:</strong>{' '}
                    {profile.goalType === 'weight_loss'
                      ? 'Ask for rice portion reduction and extra veg to stay on deficit.'
                      : profile.goalType === 'muscle_gain'
                      ? 'Ask for extra protein or a double portion of chicken.'
                      : 'A balanced choice — enjoy without guilt!'}
                  </div>
                </div>
              );
            })()}

            {/* Rest of the list */}
            {locState === 'done' && sortedDineIn.slice(1).map(p => {
              const fit = getDietFit(p.rec.compatibleWith, userFlags);
              return (
                <div key={p.id} style={card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,107,53,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                      {p.rec.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#F0F0F8', marginBottom: 1 }}>{p.rec.dish}</div>
                      <div style={{ fontSize: 11, color: '#6E6E90', marginBottom: 5 }}>
                        {p.name} · {p.distance}{p.rating ? ` · ⭐ ${p.rating.toFixed(1)}` : ''}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#FF6B35' }}>${p.rec.price.toFixed(2)}</span>
                        <span style={{ fontSize: 10, color: '#A8A8C8' }}>P{p.rec.protein}g · C{p.rec.carbs}g · F{p.rec.fat}g · {p.rec.calories}kcal</span>
                        <PpdBadge protein={p.rec.protein} price={p.rec.price} />
                        <DietBadge fit={fit} />
                      </div>
                    </div>
                    <a href={p.mapsUrl} target="_blank" rel="noopener noreferrer" style={{
                      flexShrink: 0, background: 'rgba(255,107,53,0.12)', color: '#FF6B35',
                      borderRadius: 10, padding: '7px 11px', fontSize: 11, fontWeight: 700, textDecoration: 'none',
                      border: '1px solid rgba(255,107,53,0.20)',
                    }}>Map →</a>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ══════════ GRAB & GO / CONVENIENCE ══════════ */}
        {(tab === 'grab_go' || tab === 'convenience') && (
          <>
            {/* Tag filter chips */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
              {tagOptions.map(t => (
                <button key={t} onClick={() => setTagFilter(t)} style={{
                  flexShrink: 0, borderRadius: 999, padding: '5px 12px',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
                  background: tagFilter === t ? '#FF6B35' : '#1E1E2E',
                  color:      tagFilter === t ? '#fff'    : '#6E6E90',
                  transition: 'all .2s',
                }}>{t}</button>
              ))}
            </div>

            {/* Best match highlight */}
            {(() => {
              const items = sortedItems(tab as 'grab_go' | 'convenience');
              if (!items.length) return <div style={{ textAlign: 'center', padding: '30px 0', color: '#6E6E90', fontSize: 13 }}>No items found</div>;
              const top = items[0];
              const fit = getDietFit(top.compatibleWith, userFlags);
              const rest = items.slice(1);
              return (
                <>
                  {/* Top pick */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(255,107,53,0.10), rgba(74,158,255,0.06))',
                    borderRadius: 20, padding: 14, marginBottom: 10,
                    border: '1px solid rgba(255,107,53,0.20)',
                  }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#FF6B35', background: 'rgba(255,107,53,0.15)', borderRadius: 6, padding: '2px 8px' }}>🏆 TOP PICK</span>
                      <DietBadge fit={fit} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 50, height: 50, borderRadius: 16, background: '#1E1E2E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                        {top.emoji}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 900, color: '#F0F0F8', marginBottom: 1 }}>{top.dish}</div>
                        <div style={{ fontSize: 11, color: '#6E6E90', marginBottom: 6 }}>{top.brand} · {top.tag}</div>
                        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: 15, fontWeight: 900, color: '#FF6B35' }}>${top.price.toFixed(2)}</span>
                          <span style={{ fontSize: 10, color: '#A8A8C8' }}>P{top.protein}g · C{top.carbs}g · F{top.fat}g · {top.calories}kcal</span>
                          <PpdBadge protein={top.protein} price={top.price} />
                        </div>
                      </div>
                      <button onClick={() => logItem(top)} style={{
                        flexShrink: 0, borderRadius: 12, padding: '9px 12px',
                        fontSize: 12, fontWeight: 800, cursor: 'pointer', border: 'none',
                        background: added.has(top.id) ? 'rgba(0,230,118,0.15)' : '#FF6B35',
                        color:      added.has(top.id) ? '#00E676'              : '#fff',
                        transition: 'all .2s',
                      }}>
                        {added.has(top.id) ? '✓' : '+ Log'}
                      </button>
                    </div>
                  </div>

                  {/* Rest */}
                  {rest.map(item => {
                    const ifit = getDietFit(item.compatibleWith, userFlags);
                    return (
                      <div key={item.id} style={card}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 14, background: '#1E1E2E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                            {item.emoji}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F0F8', marginBottom: 1 }}>{item.dish}</div>
                            <div style={{ fontSize: 11, color: '#6E6E90', marginBottom: 5 }}>{item.brand} · {item.tag}</div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                              <span style={{ fontSize: 14, fontWeight: 800, color: '#FF6B35' }}>${item.price.toFixed(2)}</span>
                              <span style={{ fontSize: 10, color: '#A8A8C8' }}>P{item.protein}g · C{item.carbs}g · F{item.fat}g · {item.calories}kcal</span>
                              <PpdBadge protein={item.protein} price={item.price} />
                              <DietBadge fit={ifit} />
                            </div>
                          </div>
                          <button onClick={() => logItem(item)} style={{
                            flexShrink: 0, borderRadius: 10, padding: '8px 11px',
                            fontSize: 11, fontWeight: 800, cursor: 'pointer', border: 'none',
                            background: added.has(item.id) ? 'rgba(0,230,118,0.15)' : 'rgba(255,107,53,0.12)',
                            color:      added.has(item.id) ? '#00E676'              : '#FF6B35',
                            transition: 'all .2s',
                          }}>
                            {added.has(item.id) ? '✓' : '+ Log'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </>
        )}

      </div>
    </div>
  );
}
