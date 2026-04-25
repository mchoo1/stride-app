'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useStrideStore } from '@/lib/store';
import {
  matchRestaurant, searchAll, searchRecipes, getMenuCategories,
  macroMatchScore, proteinPerDollar, ppdColor, filterItemsByDiet,
  resolveIngredients, calcCostPerServing,
  SG_RESTAURANTS, SG_RECIPES,
  type SGRestaurant, type SGMenuItem, type SGRecipe, type RestaurantTab,
} from '@/lib/sgFoodDb';
import type { DietaryFlag } from '@/types';

/* ── Design tokens ── */
const BG     = '#F7F8FB';
const CARD   = '#FFFFFF';
const BORDER = '#E5E9F2';
const FG1    = '#0F1B2D';
const FG2    = '#5B6576';
const FG3    = '#8B95A7';
const GREEN  = '#1E7F5C';
const SHADOW = '0 1px 2px rgba(15,27,45,0.04), 0 2px 6px rgba(15,27,45,0.05)';

/* ── Types ── */
interface NearbyPlace {
  id: string; name: string; type: string; distance: string; distKm?: number;
  rating: number | null; priceLevel: string | null;
  hours: string; emoji: string; mapsUrl: string;
}
interface EnrichedPlace extends NearbyPlace { dbMatch: SGRestaurant | null; }

type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';
type SortKey  = 'best_match' | 'protein_dollar' | 'price' | 'distance';
type DietFit  = 'great' | 'check' | 'warn' | 'neutral';

/* ── Cuisine fallbacks ── */
interface FallbackDish {
  dish: string; emoji: string; price: number;
  calories: number; protein: number; carbs: number; fat: number;
  compatibleWith: DietaryFlag[];
}
const CUISINE_FALLBACK: Record<string, FallbackDish> = {
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
const FALLBACK_DEFAULT: FallbackDish = { dish: 'House Special', emoji: '🍽️', price: 10.0, calories: 480, protein: 25, carbs: 50, fat: 15, compatibleWith: [] };

const DIET_LABEL: Record<DietaryFlag, string> = {
  vegetarian: '🥦 Vegetarian', vegan: '🌱 Vegan',
  gluten_free: '🌾 Gluten-Free', lactose_free: '🥛 Lactose-Free',
  keto: '🥑 Keto', halal: '☪️ Halal', kosher: '✡️ Kosher',
};
const HIGH_PROTEIN_THRESHOLD = 25; // g

/* ── Meal time context ── */
function getMealContext(): { label: string; emoji: string; suggestion: string; mealType: MealType } {
  const h = new Date().getHours();
  if (h >= 6  && h < 11) return { label: 'Breakfast time',     emoji: '🌅', suggestion: 'Start strong with a protein-rich breakfast',   mealType: 'breakfast' };
  if (h >= 11 && h < 15) return { label: 'Lunchtime',          emoji: '☀️',  suggestion: 'Fuel up for the afternoon ahead',               mealType: 'lunch'     };
  if (h >= 15 && h < 18) return { label: 'Afternoon snack',    emoji: '🍵', suggestion: 'A light snack to keep your energy up',          mealType: 'snack'     };
  if (h >= 18 && h < 22) return { label: 'Dinner time',        emoji: '🌙', suggestion: 'Wind down with a balanced dinner',              mealType: 'dinner'    };
  return                         { label: 'Late night craving', emoji: '🌃', suggestion: 'Keep it light if eating late',                  mealType: 'snack'     };
}

/* ═══════════════════════════════ Sub-components ════════════════════════════ */

function getDietFit(compatibleWith: DietaryFlag[], userFlags: DietaryFlag[]): DietFit {
  if (!userFlags.length) return 'neutral';
  if (userFlags.every(f => compatibleWith.includes(f))) return 'great';
  if (userFlags.some(f => compatibleWith.includes(f)))  return 'check';
  return 'warn';
}

function DietBadge({ fit }: { fit: DietFit }) {
  if (fit === 'neutral') return null;
  const cfg = {
    great: { bg: 'rgba(30,127,92,0.08)',  border: 'rgba(30,127,92,0.22)',  color: GREEN,     label: '✓ Fits your diet'         },
    check: { bg: 'rgba(242,169,59,0.08)', border: 'rgba(242,169,59,0.22)', color: '#C98A2E', label: '⚠ Check before ordering'  },
    warn:  { bg: 'rgba(208,78,54,0.07)',  border: 'rgba(208,78,54,0.18)',  color: '#D04E36', label: '✕ May not suit your diet' },
  }[fit];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function PpdBadge({ protein, price }: { protein: number; price: number }) {
  const v = proteinPerDollar(protein, price);
  const c = ppdColor(v);
  return (
    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6, background: `${c}14`, border: `1px solid ${c}30`, color: c }}>
      {v}g/$
    </span>
  );
}

/* ── 1. Macro Match Bar ── */
function MacroMatchBar({ score }: { score: number }) {
  const pct   = Math.round(Math.max(0, Math.min(1, score)) * 100);
  const color = pct >= 70 ? GREEN : pct >= 40 ? '#C98A2E' : '#D04E36';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
      <div style={{ flex: 1, height: 3, background: BORDER, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width .4s ease' }} />
      </div>
      <span style={{ fontSize: 9, fontWeight: 700, color, flexShrink: 0, minWidth: 52, textAlign: 'right' }}>
        {pct}% match
      </span>
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div style={{ position: 'relative', marginBottom: 14 }}>
      <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none' }}>🔍</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', background: CARD, border: `1px solid ${BORDER}`,
          borderRadius: 14, padding: '11px 38px 11px 40px',
          fontSize: 14, color: FG1, outline: 'none',
          fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', boxShadow: SHADOW,
        }}
      />
      {value && (
        <button onClick={() => onChange('')} style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', color: FG3, fontSize: 16, lineHeight: 1, padding: 2,
        }}>✕</button>
      )}
    </div>
  );
}

function SortBar({ active, onChange, showDistance }: {
  active: SortKey; onChange: (k: SortKey) => void; showDistance: boolean;
}) {
  const opts: { key: SortKey; label: string }[] = [
    { key: 'best_match',     label: '🎯 Best Match' },
    { key: 'protein_dollar', label: '💪 Protein/$'  },
    { key: 'price',          label: '💰 Price ↑'    },
    ...(showDistance ? [{ key: 'distance' as SortKey, label: '📍 Nearest' }] : []),
  ];
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, marginBottom: 8, scrollbarWidth: 'none' }}>
      {opts.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)} style={{
          flexShrink: 0, borderRadius: 999, padding: '6px 14px',
          fontSize: 11, fontWeight: 700, cursor: 'pointer',
          border: `1px solid ${active === o.key ? 'rgba(30,127,92,0.30)' : BORDER}`,
          background: active === o.key ? 'rgba(30,127,92,0.10)' : CARD,
          color: active === o.key ? GREEN : FG3, transition: 'all .2s',
        }}>{o.label}</button>
      ))}
    </div>
  );
}

/* ── 2. FilterBar with High Protein chip ── */
function FilterBar({
  filterOpenNow, setFilterOpenNow,
  filterMaxDist, setFilterMaxDist,
  filterCuisine, setFilterCuisine,
  filterHighProtein, setFilterHighProtein,
  cuisineOptions,
}: {
  filterOpenNow: boolean;      setFilterOpenNow: (v: boolean) => void;
  filterMaxDist: null|0.5|1|2; setFilterMaxDist: (v: null|0.5|1|2) => void;
  filterCuisine: string;       setFilterCuisine: (v: string) => void;
  filterHighProtein: boolean;  setFilterHighProtein: (v: boolean) => void;
  cuisineOptions: string[];
}) {
  const chip = (active: boolean): React.CSSProperties => ({
    flexShrink: 0, borderRadius: 999, padding: '5px 12px',
    fontSize: 11, fontWeight: 700, cursor: 'pointer',
    border: `1px solid ${active ? 'rgba(30,127,92,0.30)' : BORDER}`,
    background: active ? 'rgba(30,127,92,0.10)' : CARD,
    color: active ? GREEN : FG3, transition: 'all .15s', whiteSpace: 'nowrap' as const,
  });
  const distOpts: { val: null|0.5|1|2; label: string }[] = [
    { val: null, label: 'All' }, { val: 0.5, label: '< 500m' },
    { val: 1, label: '< 1km'  }, { val: 2,   label: '< 2km'  },
  ];
  return (
    <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Row 1: Open Now + High Protein + Distance */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
        <button onClick={() => setFilterOpenNow(!filterOpenNow)} style={chip(filterOpenNow)}>
          🟢 Open Now
        </button>
        <button
          onClick={() => setFilterHighProtein(!filterHighProtein)}
          style={{ ...chip(filterHighProtein), border: `1px solid ${filterHighProtein ? 'rgba(46,111,184,0.35)' : BORDER}`, background: filterHighProtein ? 'rgba(46,111,184,0.10)' : CARD, color: filterHighProtein ? '#2E6FB8' : FG3 }}
        >
          💪 High Protein
        </button>
        {distOpts.map(d => (
          <button key={String(d.val)} onClick={() => setFilterMaxDist(d.val)} style={chip(filterMaxDist === d.val)}>
            {d.label}
          </button>
        ))}
      </div>
      {/* Row 2: Cuisine types */}
      {cuisineOptions.length > 0 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
          {['All', ...cuisineOptions].map(c => (
            <button key={c} onClick={() => setFilterCuisine(c)} style={chip(filterCuisine === c)}>{c}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── 4. MenuItemRow with swipe-to-log ── */
function MenuItemRow({
  item, userFlags, onLog, logged,
}: {
  item: SGMenuItem; userFlags: DietaryFlag[];
  onLog: (item: SGMenuItem) => void; logged: boolean;
}) {
  const [swipeX, setSwipeX]     = useState(0);
  const touchStartX              = useRef(0);
  const touchStartY              = useRef(0);
  const isHorizSwipe             = useRef(false);
  const THRESHOLD                = 65;

  const fit = getDietFit(item.compatibleWith, userFlags);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current  = e.touches[0].clientX;
    touchStartY.current  = e.touches[0].clientY;
    isHorizSwipe.current = false;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.touches[0].clientX;
    const dy = Math.abs(touchStartY.current - e.touches[0].clientY);
    if (!isHorizSwipe.current && Math.abs(dx) > dy * 1.2 && dx > 4) isHorizSwipe.current = true;
    if (isHorizSwipe.current && dx > 0) setSwipeX(Math.min(dx, THRESHOLD + 20));
  };
  const onTouchEnd = () => {
    if (swipeX >= THRESHOLD) onLog(item);
    setSwipeX(0);
    isHorizSwipe.current = false;
  };

  const revealed = swipeX > 10;

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${BORDER}` }}>
      {/* Green swipe-reveal background */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 80,
        background: logged ? 'rgba(30,127,92,0.12)' : GREEN,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
        opacity: revealed ? 1 : 0, transition: 'opacity .15s',
      }}>
        <span style={{ fontSize: 16 }}>{logged ? '✓' : '⚡'}</span>
        <span style={{ fontSize: 9, fontWeight: 800, color: logged ? GREEN : '#fff' }}>
          {logged ? 'Logged' : 'Log'}
        </span>
      </div>

      {/* Swipeable content row */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
          transform: `translateX(-${swipeX}px)`,
          transition: swipeX === 0 ? 'transform .2s ease' : 'none',
          background: CARD, position: 'relative', zIndex: 1,
        }}
      >
        <span style={{ fontSize: 22, flexShrink: 0, width: 32, textAlign: 'center' }}>{item.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: FG1 }}>{item.name}</span>
            {item.isPopular && (
              <span style={{ fontSize: 9, fontWeight: 800, color: '#C98A2E', background: 'rgba(242,169,59,0.10)', borderRadius: 5, padding: '1px 5px' }}>⭐ POPULAR</span>
            )}
          </div>
          {item.description && (
            <div style={{ fontSize: 11, color: FG3, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.description}</div>
          )}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: GREEN }}>${item.price.toFixed(2)}</span>
            <span style={{ fontSize: 10, color: FG3 }}>{item.calories}kcal · P{item.protein}g · C{item.carbs}g · F{item.fat}g</span>
            <PpdBadge protein={item.protein} price={item.price} />
            <DietBadge fit={fit} />
          </div>
        </div>
        <button onClick={() => onLog(item)} style={{
          flexShrink: 0, borderRadius: 10, padding: '7px 10px',
          fontSize: 11, fontWeight: 800, cursor: 'pointer',
          border: `1px solid ${logged ? 'rgba(30,127,92,0.25)' : BORDER}`,
          background: logged ? 'rgba(30,127,92,0.10)' : CARD,
          color: logged ? GREEN : FG2, transition: 'all .2s',
        }}>
          {logged ? '✓' : '+ Log'}
        </button>
      </div>
    </div>
  );
}

function RestaurantMenuPanel({
  restaurant, userFlags, remaining, onLog, logged,
}: {
  restaurant: SGRestaurant;
  userFlags: DietaryFlag[];
  remaining: { protein: number; calories: number; carbs: number };
  onLog: (item: SGMenuItem, restaurant: SGRestaurant) => void;
  logged: Set<string>;
}) {
  const categories = getMenuCategories(restaurant);
  const [activeCat,    setActiveCat]    = useState(categories[0] ?? 'All');
  const [showDietOnly, setShowDietOnly] = useState(false);

  const visibleItems = useMemo(() => {
    let items = restaurant.menu;
    if (activeCat !== 'All') items = items.filter(i => i.category === activeCat);
    if (showDietOnly && userFlags.length) items = filterItemsByDiet(items, userFlags);
    return items;
  }, [restaurant.menu, activeCat, showDietOnly, userFlags]);

  const bestItem = useMemo(() => {
    if (!restaurant.menu.length) return null;
    return [...restaurant.menu].sort((a, b) => macroMatchScore(b, remaining) - macroMatchScore(a, remaining))[0];
  }, [restaurant.menu, remaining]);

  return (
    <div style={{ background: CARD, borderRadius: '0 0 18px 18px', borderTop: 'none' }}>
      {bestItem && (
        <div style={{ margin: '0 14px 0', padding: '10px 12px', background: 'rgba(30,127,92,0.05)', borderRadius: '0 0 12px 12px', borderBottom: `1px solid ${BORDER}` }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: GREEN }}>🏆 BEST MATCH FOR YOUR GOALS  </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: FG1 }}>{bestItem.name}</span>
          <span style={{ fontSize: 11, color: FG3 }}> · ${bestItem.price.toFixed(2)} · P{bestItem.protein}g</span>
        </div>
      )}
      {categories.length > 1 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '10px 14px 0', scrollbarWidth: 'none' }}>
          {['All', ...categories].map(cat => (
            <button key={cat} onClick={() => setActiveCat(cat)} style={{
              flexShrink: 0, borderRadius: 999, padding: '5px 12px',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${activeCat === cat ? 'rgba(30,127,92,0.25)' : BORDER}`,
              background: activeCat === cat ? 'rgba(30,127,92,0.08)' : BG,
              color: activeCat === cat ? GREEN : FG3, transition: 'all .15s',
            }}>{cat}</button>
          ))}
        </div>
      )}
      {userFlags.length > 0 && (
        <div style={{ padding: '8px 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setShowDietOnly(!showDietOnly)} style={{
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
            background: showDietOnly ? 'rgba(30,127,92,0.08)' : BG, color: showDietOnly ? GREEN : FG3,
            border: `1px solid ${showDietOnly ? 'rgba(30,127,92,0.22)' : BORDER}`,
            borderRadius: 999, padding: '4px 10px', transition: 'all .2s',
          }}>
            {showDietOnly ? '✓ ' : ''}My diet only
          </button>
          <span style={{ fontSize: 10, color: FG3 }}>{visibleItems.length} item{visibleItems.length !== 1 ? 's' : ''}</span>
        </div>
      )}
      <div style={{ padding: '8px 0 4px' }}>
        {visibleItems.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: FG3 }}>No items match your filters</div>
        ) : (
          visibleItems.map(item => (
            <MenuItemRow key={item.id} item={item} userFlags={userFlags} onLog={i => onLog(i, restaurant)} logged={logged.has(item.id)} />
          ))
        )}
      </div>
    </div>
  );
}

/* ── RestaurantCard with match bar + preview ── */
function RestaurantCard({
  restaurant, isExpanded, onToggle, userFlags, remaining, onLog, logged,
  badge, distanceLabel, rating,
}: {
  restaurant: SGRestaurant; isExpanded: boolean; onToggle: () => void;
  userFlags: DietaryFlag[]; remaining: { protein: number; calories: number; carbs: number };
  onLog: (item: SGMenuItem, restaurant: SGRestaurant) => void; logged: Set<string>;
  badge?: React.ReactNode; distanceLabel?: string; rating?: number | null;
}) {
  const dietFit   = getDietFit(restaurant.dietTags, userFlags);
  const itemCount = restaurant.menu.length;

  const previewItems = useMemo(() => {
    if (itemCount === 0) return [];
    return [...restaurant.menu].sort((a, b) => macroMatchScore(b, remaining) - macroMatchScore(a, remaining)).slice(0, 2);
  }, [restaurant.menu, remaining, itemCount]);

  /* 1. Best macro match score (0-1) across all menu items */
  const bestScore = useMemo(() => {
    if (itemCount === 0) return null;
    return Math.max(...restaurant.menu.map(i => macroMatchScore(i, remaining)));
  }, [restaurant.menu, remaining, itemCount]);

  const showPreview = itemCount > 0 && !isExpanded;
  const hasPanel    = isExpanded || showPreview;

  return (
    <div style={{ marginBottom: 10, boxShadow: hasPanel ? 'none' : SHADOW }}>
      <button onClick={onToggle} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 14px', cursor: 'pointer', textAlign: 'left',
        background: isExpanded ? 'rgba(30,127,92,0.04)' : CARD,
        border: `1px solid ${isExpanded ? 'rgba(30,127,92,0.25)' : BORDER}`,
        borderRadius: hasPanel ? '18px 18px 0 0' : 18,
        boxShadow: 'none', transition: 'all .15s',
      }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, background: 'rgba(30,127,92,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
          {restaurant.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: FG1 }}>{restaurant.name}</span>
            <span style={{ fontSize: 11, color: FG3 }}>{restaurant.priceRange}</span>
            {badge}
          </div>
          <div style={{ fontSize: 11, color: FG3, marginBottom: 4 }}>
            {restaurant.cuisine}
            {distanceLabel ? ` · ${distanceLabel}` : ''}
            {rating != null ? ` · ⭐ ${rating.toFixed(1)}` : ''}
            {itemCount > 0 ? ` · ${itemCount} items` : ''}
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            <DietBadge fit={dietFit} />
            {itemCount === 0 && <span style={{ fontSize: 10, color: FG3, fontStyle: 'italic' }}>Menu data coming soon</span>}
          </div>
          {/* 1. Macro match bar */}
          {bestScore !== null && <MacroMatchBar score={bestScore} />}
        </div>
        <span style={{ fontSize: 13, color: isExpanded ? GREEN : FG3, flexShrink: 0 }}>
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>

      {/* Collapsed preview: top 2 macro-matched items */}
      {showPreview && (
        <div style={{ borderRadius: '0 0 18px 18px', border: `1px solid ${BORDER}`, borderTop: 'none', background: CARD, padding: '8px 14px 12px', boxShadow: SHADOW }}>
          {previewItems.map((item, idx) => {
            const ppd  = proteinPerDollar(item.protein, item.price);
            const ppdC = ppdColor(ppd);
            const isLogged = logged.has(item.id);
            return (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0',
                borderBottom: idx < previewItems.length - 1 ? `1px solid ${BORDER}` : 'none',
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: FG1, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, flexShrink: 0 }}>${item.price.toFixed(2)}</span>
                <span style={{ fontSize: 10, color: '#2E6FB8', flexShrink: 0 }}>P{item.protein}g</span>
                <span style={{ fontSize: 10, color: FG3, flexShrink: 0 }}>{item.calories}kcal</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: ppdC, flexShrink: 0 }}>{ppd}g/$</span>
                <button
                  onClick={e => { e.stopPropagation(); onLog(item, restaurant); }}
                  style={{
                    flexShrink: 0, borderRadius: 8, padding: '4px 8px',
                    fontSize: 10, fontWeight: 800, cursor: 'pointer',
                    border: `1px solid ${isLogged ? 'rgba(30,127,92,0.25)' : BORDER}`,
                    background: isLogged ? 'rgba(30,127,92,0.10)' : CARD,
                    color: isLogged ? GREEN : FG2, transition: 'all .2s',
                  }}
                >{isLogged ? '✓' : '+ Log'}</button>
              </div>
            );
          })}
        </div>
      )}

      {isExpanded && itemCount > 0 && (
        <RestaurantMenuPanel restaurant={restaurant} userFlags={userFlags} remaining={remaining} onLog={onLog} logged={logged} />
      )}
      {isExpanded && itemCount === 0 && (
        <div style={{ background: CARD, border: `1px solid rgba(30,127,92,0.20)`, borderTop: 'none', borderRadius: '0 0 18px 18px', padding: 16, textAlign: 'center', fontSize: 12, color: FG3 }}>
          Menu data for this restaurant hasn&apos;t been added yet.{' '}
          <span style={{ color: '#2E6FB8', cursor: 'pointer' }}>Contribute →</span>
        </div>
      )}
    </div>
  );
}

function RecipeCard({ recipe, userFlags, onLog, logged }: {
  recipe: SGRecipe; userFlags: DietaryFlag[];
  onLog: (recipe: SGRecipe) => void; logged: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const fit        = getDietFit(recipe.compatibleWith, userFlags);
  const resolved   = resolveIngredients(recipe);
  const actualCost = calcCostPerServing(recipe) ?? recipe.costPerServing;
  const m          = recipe.macrosPerServing;
  return (
    <div style={{ marginBottom: 10 }}>
      <button onClick={() => setExpanded(!expanded)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 14px', cursor: 'pointer', textAlign: 'left',
        background: expanded ? 'rgba(30,127,92,0.04)' : CARD,
        border: `1px solid ${expanded ? 'rgba(30,127,92,0.22)' : BORDER}`,
        borderRadius: expanded ? '18px 18px 0 0' : 18,
        boxShadow: expanded ? 'none' : SHADOW, transition: 'all .15s',
      }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, background: 'rgba(30,127,92,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
          {recipe.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: FG1 }}>{recipe.name}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#2E6FB8', background: 'rgba(46,111,184,0.08)', borderRadius: 5, padding: '1px 6px' }}>{recipe.category}</span>
          </div>
          <div style={{ fontSize: 11, color: FG3, marginBottom: 4 }}>
            {recipe.cuisine} · {recipe.prepMins + recipe.cookMins} min · {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: GREEN }}>${actualCost.toFixed(2)}/serving</span>
            <span style={{ fontSize: 10, color: FG3 }}>P{m.protein}g · C{m.carbs}g · F{m.fat}g · {m.calories}kcal</span>
            <PpdBadge protein={m.protein} price={actualCost} />
            <DietBadge fit={fit} />
          </div>
        </div>
        <span style={{ fontSize: 13, color: expanded ? GREEN : FG3, flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div style={{ background: CARD, border: `1px solid rgba(30,127,92,0.20)`, borderTop: 'none', borderRadius: '0 0 18px 18px', padding: 14 }}>
          <p style={{ fontSize: 12, color: FG2, margin: '0 0 12px', lineHeight: 1.6 }}>{recipe.description}</p>
          <div style={{ fontSize: 12, fontWeight: 800, color: FG1, marginBottom: 8 }}>🛒 Ingredients</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {resolved.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{r.ingredient?.emoji ?? '🥘'}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, color: FG1 }}>{r.ingredient?.name ?? `Ingredient #${i + 1} (not in DB)`}</span>
                  {r.note && <span style={{ fontSize: 11, color: FG3 }}> — {r.note}</span>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: FG2 }}>×{r.quantity} {r.ingredient?.unit ?? 'unit'}</div>
                  {r.ingredient && <div style={{ fontSize: 10, color: FG3 }}>{r.ingredient.store} · ${(r.ingredient.price * r.quantity).toFixed(2)}</div>}
                </div>
              </div>
            ))}
          </div>
          {recipe.steps.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 800, color: FG1, marginBottom: 8 }}>👨‍🍳 Steps</div>
              <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recipe.steps.map((step, i) => <li key={i} style={{ fontSize: 12, color: FG2, lineHeight: 1.6 }}>{step}</li>)}
              </ol>
            </>
          )}
          <button onClick={() => onLog(recipe)} style={{
            width: '100%', marginTop: 14, padding: '12px 0', borderRadius: 14, border: 'none',
            fontSize: 13, fontWeight: 800, cursor: 'pointer',
            background: logged ? 'rgba(30,127,92,0.10)' : GREEN, color: logged ? GREEN : '#fff',
            transition: 'all .2s', boxShadow: logged ? 'none' : '0 4px 14px rgba(30,127,92,0.25)',
          }}>
            {logged ? '✓ Logged!' : `Log 1 Serving (${m.calories} kcal)`}
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: 44, marginBottom: 12 }}>{emoji}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: FG2, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: FG3, lineHeight: 1.6 }}>{subtitle}</div>
    </div>
  );
}

/* ═══════════════════════════════ Main page ══════════════════════════════════ */
export default function EatPage() {
  const store   = useStrideStore();
  const profile = store.profile;
  const totals  = store.getTodayTotals();
  const burned  = store.getTodayCaloriesBurned();

  const userFlags  = profile.dietaryFlags ?? [];
  const remaining  = store.getCaloriesRemaining();
  const remProtein = Math.max(0, (profile.targetProtein || 0) - totals.protein);
  const remCarbs   = Math.max(0, (profile.targetCarbs   || 0) - totals.carbs);
  const remCal     = Math.max(0, profile.targetCalories - totals.calories + burned);
  const macroRem   = { protein: remProtein, calories: remCal, carbs: remCarbs };

  /* 3. Meal time context — computed once */
  const mealCtx = useMemo(() => getMealContext(), []);

  const [tab,           setTab         ] = useState<RestaurantTab | 'store'>('restaurant');
  const [sortBy,        setSortBy      ] = useState<SortKey>('best_match');
  const [query,         setQuery       ] = useState('');
  const [expandedId,    setExpandedId  ] = useState<string | null>(null);
  const [logged,        setLogged      ] = useState<Set<string>>(new Set());
  const [recipeLogged,  setRecipeLogged] = useState<Set<string>>(new Set());

  /* Filter state */
  const [filterOpenNow,     setFilterOpenNow    ] = useState(false);
  const [filterMaxDist,     setFilterMaxDist    ] = useState<null|0.5|1|2>(null);
  const [filterCuisine,     setFilterCuisine    ] = useState('All');
  const [filterHighProtein, setFilterHighProtein] = useState(false);

  const switchTab = (t: typeof tab) => {
    setTab(t); setQuery(''); setExpandedId(null);
    setFilterOpenNow(false); setFilterMaxDist(null); setFilterCuisine('All'); setFilterHighProtein(false);
  };

  const [places,   setPlaces  ] = useState<NearbyPlace[]>([]);
  const [locState, setLocState] = useState<'locating'|'fetching'|'done'|'error'|'no_key'>('locating');
  const [locError, setLocError] = useState('');

  const fetchPlaces = useCallback(async (lat: number, lng: number) => {
    setLocState('fetching');
    try {
      const res  = await fetch(`/api/nearby-places?lat=${lat}&lng=${lng}&type=food`);
      const data = await res.json();
      if (data.error) { if (res.status === 503) { setLocState('no_key'); return; } throw new Error(data.error); }
      setPlaces(data.places ?? []);
      setLocState('done');
    } catch (e) { setLocError(e instanceof Error ? e.message : 'Failed to load'); setLocState('error'); }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) { setLocError('Geolocation not supported'); setLocState('error'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => fetchPlaces(pos.coords.latitude, pos.coords.longitude),
      err => { setLocError(`Location denied: ${err.message}`); setLocState('error'); },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }, [fetchPlaces]);

  const enrichedPlaces = useMemo((): EnrichedPlace[] =>
    places.map(p => ({ ...p, dbMatch: matchRestaurant(p.name) })), [places]);

  /* Cuisine chip options derived from actual nearby places */
  const cuisineOptions = useMemo(() => {
    const seen = new Set<string>();
    enrichedPlaces.forEach(p => {
      const raw = p.dbMatch ? p.dbMatch.cuisine : p.type;
      if (raw) seen.add(raw.charAt(0).toUpperCase() + raw.slice(1));
    });
    return Array.from(seen).sort();
  }, [enrichedPlaces]);

  /* Sorted + filtered GPS places */
  const sortedFilteredPlaces = useMemo(() => {
    let list = [...enrichedPlaces];

    if (filterOpenNow)        list = list.filter(p => p.hours === 'Open now');
    if (filterMaxDist !== null) list = list.filter(p => (p.distKm ?? 999) <= filterMaxDist);
    if (filterCuisine !== 'All') list = list.filter(p => {
      const c = p.dbMatch ? p.dbMatch.cuisine : p.type;
      return c.toLowerCase().includes(filterCuisine.toLowerCase());
    });
    /* 2. High Protein filter */
    if (filterHighProtein) list = list.filter(p => {
      if (p.dbMatch && p.dbMatch.menu.length > 0)
        return p.dbMatch.menu.some(i => i.protein >= HIGH_PROTEIN_THRESHOLD);
      return (CUISINE_FALLBACK[p.type] ?? FALLBACK_DEFAULT).protein >= HIGH_PROTEIN_THRESHOLD;
    });

    list.sort((a, b) => {
      if (sortBy === 'distance') return (a.distKm ?? 999) - (b.distKm ?? 999);
      if (sortBy === 'protein_dollar') {
        const ppd = (p: EnrichedPlace) => p.dbMatch && p.dbMatch.menu.length
          ? Math.max(...p.dbMatch.menu.map(i => proteinPerDollar(i.protein, i.price)))
          : proteinPerDollar((CUISINE_FALLBACK[p.type] ?? FALLBACK_DEFAULT).protein, (CUISINE_FALLBACK[p.type] ?? FALLBACK_DEFAULT).price);
        return ppd(b) - ppd(a);
      }
      if (sortBy === 'price') {
        const minP = (p: EnrichedPlace) => p.dbMatch && p.dbMatch.menu.length
          ? Math.min(...p.dbMatch.menu.map(i => i.price))
          : (CUISINE_FALLBACK[p.type] ?? FALLBACK_DEFAULT).price;
        return minP(a) - minP(b);
      }
      /* best_match */
      const aDb = !!a.dbMatch, bDb = !!b.dbMatch;
      if (aDb && !bDb) return -1;
      if (!aDb && bDb) return 1;
      if (aDb && bDb) {
        const sc = (p: EnrichedPlace) => p.dbMatch!.menu.length
          ? Math.max(...p.dbMatch!.menu.map(i => macroMatchScore(i, macroRem))) : 0;
        return sc(b) - sc(a);
      }
      const fb = (p: EnrichedPlace) => CUISINE_FALLBACK[p.type] ?? FALLBACK_DEFAULT;
      return proteinPerDollar(fb(b).protein, fb(b).price) - proteinPerDollar(fb(a).protein, fb(a).price);
    });
    return list;
  }, [enrichedPlaces, sortBy, filterOpenNow, filterMaxDist, filterCuisine, filterHighProtein, macroRem]);

  const anyFilterActive = filterOpenNow || filterMaxDist !== null || filterCuisine !== 'All' || filterHighProtein;

  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    if (tab === 'store') return { type: 'recipes' as const, recipes: searchRecipes(query) };
    const { restaurants, items } = searchAll(query, tab as RestaurantTab);
    return { type: 'food' as const, restaurants, items };
  }, [query, tab]);

  const grabGoRestaurants = useMemo(() => {
    const base = SG_RESTAURANTS.filter(r => r.tab === 'grab_go');
    return [...base].sort((a, b) => {
      if (sortBy === 'protein_dollar') {
        const ppd = (r: SGRestaurant) => r.menu.length ? Math.max(...r.menu.map(i => proteinPerDollar(i.protein, i.price))) : 0;
        return ppd(b) - ppd(a);
      }
      if (sortBy === 'price') {
        const minP = (r: SGRestaurant) => r.menu.length ? Math.min(...r.menu.map(i => i.price)) : Infinity;
        return minP(a) - minP(b);
      }
      const sc = (r: SGRestaurant) => r.menu.length ? Math.max(...r.menu.map(i => macroMatchScore(i, macroRem))) : 0;
      return sc(b) - sc(a);
    });
  }, [sortBy, macroRem]);

  /* Log helpers — use meal context mealType */
  const logMenuItem = useCallback((item: SGMenuItem, restaurant: SGRestaurant) => {
    store.addFoodEntry({
      foodItemId: item.id, name: `${item.name} (${restaurant.name})`,
      emoji: item.emoji, mealType: mealCtx.mealType,
      quantity: 100, calories: item.calories, protein: item.protein, carbs: item.carbs, fat: item.fat,
    });
    setLogged(s => new Set([...s, item.id]));
    setTimeout(() => setLogged(s => { const n = new Set(s); n.delete(item.id); return n; }), 2000);
  }, [store, mealCtx.mealType]);

  const logRecipe = useCallback((recipe: SGRecipe) => {
    const m = recipe.macrosPerServing;
    store.addFoodEntry({
      foodItemId: recipe.id, name: `${recipe.name} (1 serving)`,
      emoji: recipe.emoji, mealType: mealCtx.mealType,
      quantity: 100, calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat,
    });
    setRecipeLogged(s => new Set([...s, recipe.id]));
    setTimeout(() => setRecipeLogged(s => { const n = new Set(s); n.delete(recipe.id); return n; }), 2000);
  }, [store, mealCtx.mealType]);

  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
    fontSize: 12, fontWeight: 700, cursor: 'pointer',
    background: active ? 'rgba(30,127,92,0.12)' : 'transparent',
    color: active ? GREEN : FG3, transition: 'all .2s',
  });

  /* ── Render ── */
  return (
    <div style={{ background: BG, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ padding: '52px 20px 8px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: FG3, textTransform: 'uppercase', margin: '0 0 4px' }}>
          DISCOVER FOOD
        </p>
        <h1 style={{ color: FG1, fontSize: 40, lineHeight: 1, margin: '0 0 10px', fontFamily: "'Anton', Impact, sans-serif" }}>
          WHAT TO EAT 🍜
        </h1>

        {/* 3. Meal time context banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
          background: 'rgba(30,127,92,0.05)', border: '1px solid rgba(30,127,92,0.14)',
          borderRadius: 14, padding: '9px 14px',
        }}>
          <span style={{ fontSize: 18 }}>{mealCtx.emoji}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: FG1 }}>{mealCtx.label}</div>
            <div style={{ fontSize: 11, color: FG3 }}>{mealCtx.suggestion} · {remaining} kcal left</div>
          </div>
        </div>

        {/* Macro gaps + diet flags */}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {remProtein > 0 && (
            <div style={{ background: 'rgba(46,111,184,0.08)', border: '1px solid rgba(46,111,184,0.20)', borderRadius: 10, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#2E6FB8' }}>
              Need {remProtein}g protein
            </div>
          )}
          {remCarbs > 0 && (
            <div style={{ background: 'rgba(201,138,46,0.08)', border: '1px solid rgba(201,138,46,0.20)', borderRadius: 10, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#C98A2E' }}>
              Need {remCarbs}g carbs
            </div>
          )}
          {userFlags.map(f => (
            <div key={f} style={{ background: 'rgba(30,127,92,0.07)', border: '1px solid rgba(30,127,92,0.18)', borderRadius: 10, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: GREEN }}>
              {DIET_LABEL[f]}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px 100px' }}>

        {/* Tab bar */}
        <div style={{ background: CARD, borderRadius: 16, padding: 4, display: 'flex', gap: 4, border: `1px solid ${BORDER}`, marginBottom: 14, boxShadow: SHADOW }}>
          <button style={tabBtn(tab === 'restaurant')} onClick={() => switchTab('restaurant')}>🍽️ Restaurant</button>
          <button style={tabBtn(tab === 'grab_go')}    onClick={() => switchTab('grab_go')}>🥡 Grab &amp; Go</button>
          <button style={tabBtn(tab === 'store')}      onClick={() => switchTab('store')}>🛒 Store</button>
        </div>

        <SearchBar
          value={query} onChange={setQuery}
          placeholder={tab === 'restaurant' ? 'Search restaurants or dishes…' : tab === 'grab_go' ? 'Search brands or ready-to-eat items…' : 'Search recipes or ingredients…'}
        />

        {!query && tab !== 'store' && (
          <SortBar active={sortBy} onChange={setSortBy} showDistance={tab === 'restaurant'} />
        )}

        {/* Filter bar: Restaurant GPS tab only */}
        {tab === 'restaurant' && !query && locState === 'done' && (
          <FilterBar
            filterOpenNow={filterOpenNow}         setFilterOpenNow={setFilterOpenNow}
            filterMaxDist={filterMaxDist}         setFilterMaxDist={setFilterMaxDist}
            filterCuisine={filterCuisine}         setFilterCuisine={setFilterCuisine}
            filterHighProtein={filterHighProtein} setFilterHighProtein={setFilterHighProtein}
            cuisineOptions={cuisineOptions}
          />
        )}

        {/* ══ RESTAURANT TAB ══ */}
        {tab === 'restaurant' && (
          <>
            {searchResults?.type === 'food' && (
              <>
                {searchResults.restaurants.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: FG3, marginBottom: 10 }}>
                      {searchResults.restaurants.length} restaurant{searchResults.restaurants.length !== 1 ? 's' : ''} in database
                    </div>
                    {searchResults.restaurants.map(r => (
                      <RestaurantCard key={r.id} restaurant={r}
                        isExpanded={expandedId === r.id}
                        onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
                        userFlags={userFlags} remaining={macroRem} onLog={logMenuItem} logged={logged}
                        badge={<span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(46,111,184,0.10)', color: '#2E6FB8', borderRadius: 5, padding: '1px 5px' }}>📋 IN DATABASE</span>}
                      />
                    ))}
                  </>
                )}
                {searchResults.items.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: FG3, margin: '14px 0 10px' }}>
                      {searchResults.items.length} menu item{searchResults.items.length !== 1 ? 's' : ''}
                    </div>
                    <div style={{ background: CARD, borderRadius: 18, border: `1px solid ${BORDER}`, overflow: 'hidden', boxShadow: SHADOW }}>
                      {searchResults.items.map(({ restaurant, item }) => (
                        <div key={`${restaurant.id}-${item.id}`}>
                          <div style={{ padding: '6px 14px 0', fontSize: 10, fontWeight: 700, color: FG3 }}>{restaurant.name}</div>
                          <MenuItemRow item={item} userFlags={userFlags} onLog={i => logMenuItem(i, restaurant)} logged={logged.has(item.id)} />
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {searchResults.restaurants.length === 0 && searchResults.items.length === 0 && (
                  query.trim().length > 0 ? (
                    <div style={{ background: CARD, borderRadius: 20, border: `1px solid ${BORDER}`, padding: '28px 20px', textAlign: 'center', boxShadow: SHADOW }}>
                      <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: FG2, marginBottom: 8 }}>Not in our database yet</div>
                      <a
                        href={`https://www.google.com/maps/search/${encodeURIComponent(query)}+Singapore`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          background: 'rgba(46,111,184,0.08)',
                          color: '#2E6FB8',
                          borderRadius: 12,
                          padding: '10px 16px',
                          fontSize: 13,
                          fontWeight: 700,
                          textDecoration: 'none',
                          marginBottom: 8,
                        }}
                      >
                        📍 Search on Google Maps →
                      </a>
                      <div style={{ fontSize: 11, color: '#8B95A7' }}>Opens Google Maps for nearby options</div>
                    </div>
                  ) : (
                    <EmptyState emoji="🔍" title="No results" subtitle={`"${query}" not found in the database yet.\nCheck back as more restaurants are added.`} />
                  )
                )}
              </>
            )}

            {!query && (
              <>
                {(locState === 'locating' || locState === 'fetching') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2.5px solid ${BORDER}`, borderTopColor: GREEN, animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: 13, color: FG3 }}>{locState === 'locating' ? 'Getting your location…' : 'Finding nearby restaurants…'}</span>
                  </div>
                )}
                {locState === 'error' && (
                  <div style={{ background: 'rgba(208,78,54,0.06)', border: '1px solid rgba(208,78,54,0.18)', borderRadius: 14, padding: '12px 14px', marginBottom: 12, display: 'flex', gap: 8 }}>
                    <span>⚠️</span><span style={{ fontSize: 12, color: '#D04E36' }}>{locError}</span>
                  </div>
                )}
                {locState === 'no_key' && (
                  <div style={{ background: 'rgba(46,111,184,0.06)', borderRadius: 14, padding: '12px 14px', marginBottom: 12, display: 'flex', gap: 8, border: '1px solid rgba(46,111,184,0.15)' }}>
                    <span>💡</span>
                    <span style={{ fontSize: 12, color: '#2E6FB8' }}>
                      Add <code style={{ background: BORDER, borderRadius: 4, padding: '1px 4px', color: FG1 }}>GOOGLE_PLACES_API_KEY</code> to show restaurants near you.
                    </span>
                  </div>
                )}
                {locState === 'done' && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: FG3, marginBottom: 10 }}>
                      {enrichedPlaces.length} places · {enrichedPlaces.filter(p => p.dbMatch).length} with full menu data
                      {anyFilterActive ? ` · ${sortedFilteredPlaces.length} shown` : ''}
                    </div>
                    {sortedFilteredPlaces.length === 0 && (
                      <EmptyState emoji="🗺️" title="No restaurants match your filters" subtitle="Try adjusting or clearing the filters above." />
                    )}
                    {sortedFilteredPlaces.map(place => {
                      const fallback = CUISINE_FALLBACK[place.type] ?? FALLBACK_DEFAULT;

                      if (place.dbMatch) {
                        return (
                          <RestaurantCard key={place.id} restaurant={place.dbMatch}
                            isExpanded={expandedId === place.dbMatch.id}
                            onToggle={() => setExpandedId(expandedId === place.dbMatch!.id ? null : place.dbMatch!.id)}
                            userFlags={userFlags} remaining={macroRem} onLog={logMenuItem} logged={logged}
                            badge={<span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(30,127,92,0.10)', color: GREEN, borderRadius: 5, padding: '1px 5px' }}>✓ FULL MENU</span>}
                            distanceLabel={place.distance} rating={place.rating}
                          />
                        );
                      }

                      const fit            = getDietFit(fallback.compatibleWith, userFlags);
                      const fallbackPpd    = proteinPerDollar(fallback.protein, fallback.price);
                      const fallbackPpdClr = ppdColor(fallbackPpd);
                      return (
                        <div key={place.id} style={{ background: CARD, borderRadius: 18, padding: 14, border: `1px solid ${BORDER}`, marginBottom: 10, boxShadow: SHADOW }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(30,127,92,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                              {place.emoji}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 14, fontWeight: 800, color: FG1 }}>{place.name}</span>
                                <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 6, background: 'rgba(139,149,167,0.10)', border: `1px solid ${BORDER}`, color: FG3 }}>⚡ Estimated</span>
                              </div>
                              <div style={{ fontSize: 11, color: FG3, marginBottom: 6 }}>
                                {place.type} · {place.distance}{place.rating ? ` · ⭐ ${place.rating.toFixed(1)}` : ''} · {place.hours}
                              </div>
                              <div style={{ marginBottom: 6 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: FG1, marginBottom: 2 }}>{fallback.emoji} {fallback.dish}</div>
                                <div style={{ fontSize: 11, color: FG2 }}>~${fallback.price.toFixed(2)} · P{fallback.protein}g · C{fallback.carbs}g · F{fallback.fat}g · {fallback.calories}kcal</div>
                              </div>
                              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6, background: `${fallbackPpdClr}14`, border: `1px solid ${fallbackPpdClr}30`, color: fallbackPpdClr }}>{fallbackPpd}g/$</span>
                                <DietBadge fit={fit} />
                              </div>
                              {/* 5. Request menu data CTA */}
                              <a
                                href={`mailto:hello@strideapp.sg?subject=Menu data for ${encodeURIComponent(place.name)}&body=Hi, I'd like to submit nutrition data for ${encodeURIComponent(place.name)}.`}
                                style={{ fontSize: 11, color: '#2E6FB8', fontWeight: 600, textDecoration: 'none' }}
                              >
                                📋 Help add {place.name}'s menu →
                              </a>
                            </div>
                            <a href={place.mapsUrl} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, background: GREEN, color: '#fff', borderRadius: 10, padding: '8px 12px', fontSize: 11, fontWeight: 700, textDecoration: 'none', boxShadow: '0 2px 8px rgba(30,127,92,0.22)', alignSelf: 'flex-start' }}>Map →</a>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* ══ GRAB & GO ══ */}
        {tab === 'grab_go' && (
          <>
            {searchResults?.type === 'food' && (
              searchResults.restaurants.length === 0 && searchResults.items.length === 0 ? (
                query.trim().length > 0 ? (
                  <div style={{ background: CARD, borderRadius: 20, border: `1px solid ${BORDER}`, padding: '28px 20px', textAlign: 'center', boxShadow: SHADOW }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: FG2, marginBottom: 8 }}>Not in our database yet</div>
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(query)}+Singapore`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        background: 'rgba(46,111,184,0.08)',
                        color: '#2E6FB8',
                        borderRadius: 12,
                        padding: '10px 16px',
                        fontSize: 13,
                        fontWeight: 700,
                        textDecoration: 'none',
                        marginBottom: 8,
                      }}
                    >
                      📍 Search on Google Maps →
                    </a>
                    <div style={{ fontSize: 11, color: '#8B95A7' }}>Opens Google Maps for nearby options</div>
                  </div>
                ) : (
                  <EmptyState emoji="🔍" title="No results" subtitle={`"${query}" not found yet. More brands coming soon.`} />
                )
              ) : (
                <>
                  {searchResults.restaurants.map(r => (
                    <RestaurantCard key={r.id} restaurant={r}
                      isExpanded={expandedId === r.id}
                      onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
                      userFlags={userFlags} remaining={macroRem} onLog={logMenuItem} logged={logged}
                    />
                  ))}
                  {searchResults.items.length > 0 && (
                    <div style={{ background: CARD, borderRadius: 18, border: `1px solid ${BORDER}`, overflow: 'hidden', boxShadow: SHADOW }}>
                      {searchResults.items.map(({ restaurant, item }) => (
                        <div key={`${restaurant.id}-${item.id}`}>
                          <div style={{ padding: '6px 14px 0', fontSize: 10, fontWeight: 700, color: FG3 }}>{restaurant.name}</div>
                          <MenuItemRow item={item} userFlags={userFlags} onLog={i => logMenuItem(i, restaurant)} logged={logged.has(item.id)} />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )
            )}
            {!query && (
              grabGoRestaurants.length === 0 ? (
                <EmptyState emoji="🥡" title="Grab & Go database coming soon" subtitle="We're adding Old Chang Kee, Ya Kun, 7-Eleven, BreadTalk and more. Check back shortly." />
              ) : (
                grabGoRestaurants.map(r => (
                  <RestaurantCard key={r.id} restaurant={r}
                    isExpanded={expandedId === r.id}
                    onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    userFlags={userFlags} remaining={macroRem} onLog={logMenuItem} logged={logged}
                  />
                ))
              )
            )}
          </>
        )}

        {/* ══ STORE / RECIPES ══ */}
        {tab === 'store' && (
          <>
            {query && searchResults?.type === 'recipes' && (
              searchResults.recipes.length === 0 ? (
                <EmptyState emoji="🔍" title="No recipes found" subtitle={`Try searching "high protein", "budget", or a cuisine type.`} />
              ) : (
                searchResults.recipes.map(r => <RecipeCard key={r.id} recipe={r} userFlags={userFlags} onLog={logRecipe} logged={recipeLogged.has(r.id)} />)
              )
            )}
            {!query && (
              SG_RECIPES.length === 0 ? (
                <EmptyState emoji="🛒" title="Recipes coming soon" subtitle={"We're building budget-friendly, macro-optimised recipes using FairPrice and Cold Storage ingredients.\n\nHigh Protein, Meal Prep, and Budget Meals will be the first categories."} />
              ) : (
                SG_RECIPES.map(r => <RecipeCard key={r.id} recipe={r} userFlags={userFlags} onLog={logRecipe} logged={recipeLogged.has(r.id)} />)
              )
            )}
          </>
        )}

      </div>
    </div>
  );
}
