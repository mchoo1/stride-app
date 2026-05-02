'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useStrideStore } from '@/lib/store';
import {
  matchRestaurant, searchAll, searchRecipes, getMenuCategories,
  macroMatchScore, proteinPerDollar, ppdColor, filterItemsByDiet,
  resolveIngredients, calcCostPerServing,
  SG_RESTAURANTS, SG_RECIPES,
  type SGRestaurant, type SGMenuItem, type SGRecipe, type ServiceType, type RestaurantTier,
} from '@/lib/sgFoodDb';
import type { DietaryFlag, OutletType } from '@/types';

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
interface EnrichedPlace extends NearbyPlace {
  dbMatch: SGRestaurant | null;
  /** Computed tier — drives which section this place appears in */
  tier: RestaurantTier;
}

type MealType    = 'breakfast' | 'lunch' | 'snack' | 'dinner';
type SortKey     = 'best_match' | 'protein_dollar' | 'price' | 'distance';
type DietFit     = 'great' | 'check' | 'warn' | 'neutral';
type EatTab      = 'food' | 'store';
/** Unified filter covering both service type and outlet type */
type FilterMode  = 'all' | 'dine_in' | 'grab_go' | 'ready_to_eat' | 'delivery';

/** A single pooled item from any source (GPS or DB), with context */
interface PooledItem {
  item:       SGMenuItem;
  restaurant: SGRestaurant;
  distKm?:    number;         // undefined = came from DB chains (no GPS data)
  tier:       RestaurantTier;
}



const DIET_LABEL: Record<DietaryFlag, string> = {
  vegetarian: '🥦 Vegetarian', vegan: '🌱 Vegan',
  gluten_free: '🌾 Gluten-Free', lactose_free: '🥛 Lactose-Free',
  keto: '🥑 Keto', halal: '☪️ Halal', kosher: '✡️ Kosher',
  dairy_free: '🧀 Dairy-Free', nut_free: '🥜 Nut-Free',
  low_carb: '🍞 Low-Carb', high_protein: '💪 High-Protein',
  pescatarian: '🐟 Pescatarian', no_pork: '🐷 No Pork',
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

function ServiceBadges({ serviceTypes }: { serviceTypes: ServiceType[] }) {
  const map: Record<ServiceType, { label: string; emoji: string }> = {
    dine_in:  { label: 'Dine In',   emoji: '🍽️' },
    grab_go:  { label: 'Takeaway',  emoji: '🥡' },
    delivery: { label: 'Delivery',  emoji: '🛵' },
  };
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {serviceTypes.map(s => (
        <span key={s} style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 5, background: 'rgba(91,101,118,0.08)', border: `1px solid ${BORDER}`, color: FG3 }}>
          {map[s].emoji} {map[s].label}
        </span>
      ))}
    </div>
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

function SortBar({ active, onChange, showDistance, recommendedKey }: {
  active: SortKey; onChange: (k: SortKey) => void; showDistance: boolean;
  recommendedKey?: SortKey;
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
        }}>
          {o.label}
          {recommendedKey === o.key && (
            <span style={{ fontSize: 8, fontWeight: 800, background: 'rgba(30,127,92,0.18)', color: GREEN, borderRadius: 4, padding: '1px 5px', marginLeft: 4, verticalAlign: 'middle' }}>
              REC
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ── 2. FilterBar ── */
function FilterBar({
  filterMode, setFilterMode,
  filterOpenNow, setFilterOpenNow,
  filterMaxDist, setFilterMaxDist,
  filterCuisine, setFilterCuisine,
  filterHighProtein, setFilterHighProtein,
  filterDietMatch, setFilterDietMatch,
  cuisineOptions, hasDietPrefs,
}: {
  filterMode: FilterMode;        setFilterMode: (v: FilterMode) => void;
  filterOpenNow: boolean;        setFilterOpenNow: (v: boolean) => void;
  filterMaxDist: null|0.5|1|2;  setFilterMaxDist: (v: null|0.5|1|2) => void;
  filterCuisine: string;         setFilterCuisine: (v: string) => void;
  filterHighProtein: boolean;    setFilterHighProtein: (v: boolean) => void;
  filterDietMatch: boolean;      setFilterDietMatch: (v: boolean) => void;
  cuisineOptions: string[];      hasDietPrefs: boolean;
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
  const modeOpts: { val: FilterMode; label: string; soon?: boolean }[] = [
    { val: 'all',         label: '🍴 All'          },
    { val: 'dine_in',     label: '🍽️ Dine In'     },
    { val: 'grab_go',     label: '🥡 Takeaway'     },
    { val: 'ready_to_eat',label: '🏪 Ready-to-Eat' },
    { val: 'delivery',    label: '🛵 Delivery', soon: true },
  ];
  return (
    <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Row 0: Mode filter */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
        {modeOpts.map(s => (
          <button key={s.val} onClick={() => !s.soon && setFilterMode(s.val)}
            style={{
              ...chip(filterMode === s.val),
              opacity: s.soon ? 0.45 : 1, cursor: s.soon ? 'not-allowed' : 'pointer',
              position: 'relative' as const,
            }}
          >
            {s.label}{s.soon && <span style={{ fontSize: 8, marginLeft: 3, verticalAlign: 'super', color: FG3 }}>soon</span>}
          </button>
        ))}
      </div>
      {/* Row 1: Diet Match + Open Now + High Protein + Distance */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
        {hasDietPrefs && (
          <button
            onClick={() => setFilterDietMatch(!filterDietMatch)}
            style={{
              ...chip(filterDietMatch),
              border: `1px solid ${filterDietMatch ? 'rgba(30,127,92,0.45)' : BORDER}`,
              background: filterDietMatch ? 'rgba(30,127,92,0.15)' : CARD,
              color: filterDietMatch ? GREEN : FG3, fontWeight: 800,
              boxShadow: filterDietMatch ? '0 0 0 1px rgba(30,127,92,0.20)' : 'none',
            }}
          >
            {filterDietMatch ? '🔒' : '🥗'} My Diet
          </button>
        )}
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

/* ── MenuFirstGroup: items are the primary element, restaurant header is compact ── */
function MenuFirstGroup({
  restaurant, userFlags, remaining, onLog, logged,
  distanceLabel, rating, mapsUrl, badge,
}: {
  restaurant: SGRestaurant;
  userFlags: DietaryFlag[];
  remaining: { protein: number; calories: number; carbs: number };
  onLog: (item: SGMenuItem, r: SGRestaurant) => void;
  logged: Set<string>;
  distanceLabel?: string;
  rating?: number | null;
  mapsUrl?: string;
  badge?: React.ReactNode;
}) {
  const [showAll, setShowAll] = useState(false);

  const sortedItems = useMemo(() =>
    [...restaurant.menu].sort((a, b) => macroMatchScore(b, remaining) - macroMatchScore(a, remaining)),
    [restaurant.menu, remaining],
  );

  const PREVIEW = 3;
  const visibleItems = showAll ? sortedItems : sortedItems.slice(0, PREVIEW);
  const hasMore     = sortedItems.length > PREVIEW;
  const dietFit     = getDietFit(restaurant.dietTags, userFlags);

  return (
    <div style={{ marginBottom: 12, background: CARD, borderRadius: 18, border: `1px solid ${BORDER}`, overflow: 'hidden', boxShadow: SHADOW }}>
      {/* Compact restaurant header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px 8px', borderBottom: `1px solid ${BORDER}`, background: 'rgba(15,27,45,0.025)' }}>
        <span style={{ fontSize: 19, flexShrink: 0 }}>{restaurant.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: FG1 }}>{restaurant.name}</span>
            <span style={{ fontSize: 10, color: FG3 }}>{restaurant.priceRange}</span>
            {badge}
          </div>
          <div style={{ fontSize: 10, color: FG3, marginTop: 1 }}>
            {restaurant.cuisine}
            {distanceLabel ? ` · 📍 ${distanceLabel}` : ''}
            {rating != null ? ` · ⭐ ${rating.toFixed(1)}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <DietBadge fit={dietFit} />
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              style={{ fontSize: 10, fontWeight: 700, color: '#2E6FB8', background: 'rgba(46,111,184,0.08)', border: '1px solid rgba(46,111,184,0.18)', borderRadius: 7, padding: '4px 8px', textDecoration: 'none', flexShrink: 0 }}>
              Map
            </a>
          )}
        </div>
      </div>

      {/* Items listed directly */}
      {restaurant.menu.length === 0 ? (
        <div style={{ padding: '12px 14px', fontSize: 12, color: FG3, fontStyle: 'italic' }}>Menu data coming soon</div>
      ) : (
        <>
          {visibleItems.map(item => (
            <MenuItemRow key={item.id} item={item} userFlags={userFlags}
              onLog={i => onLog(i, restaurant)} logged={logged.has(item.id)} />
          ))}
          {hasMore && (
            <button onClick={() => setShowAll(!showAll)} style={{
              width: '100%', padding: '9px 0', background: 'rgba(15,27,45,0.025)',
              border: 'none', borderTop: `1px solid ${BORDER}`,
              fontSize: 11, fontWeight: 700, color: FG3, cursor: 'pointer', transition: 'color .15s',
            }}>
              {showAll ? '▲ Show less' : `▼ Show all ${restaurant.menu.length} items`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* ── RestaurantCard with match bar + preview ── */
function RestaurantCard({
  restaurant, isExpanded, onToggle, userFlags, remaining, onLog, logged,
  badge, distanceLabel, rating, mapsUrl,
}: {
  restaurant: SGRestaurant; isExpanded: boolean; onToggle: () => void;
  userFlags: DietaryFlag[]; remaining: { protein: number; calories: number; carbs: number };
  onLog: (item: SGMenuItem, restaurant: SGRestaurant) => void; logged: Set<string>;
  badge?: React.ReactNode; distanceLabel?: string; rating?: number | null; mapsUrl?: string;
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
      <div
        role="button" tabIndex={0} onClick={onToggle}
        onKeyDown={e => e.key === 'Enter' && onToggle()}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '13px 14px', cursor: 'pointer', textAlign: 'left',
          background: isExpanded ? 'rgba(30,127,92,0.04)' : CARD,
          border: `1px solid ${isExpanded ? 'rgba(30,127,92,0.25)' : BORDER}`,
          borderRadius: hasPanel ? '18px 18px 0 0' : 18,
          boxShadow: 'none', transition: 'all .15s',
          boxSizing: 'border-box',
        }}
      >
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
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', marginBottom: 3 }}>
            <DietBadge fit={dietFit} />
            {itemCount === 0 && <span style={{ fontSize: 10, color: FG3, fontStyle: 'italic' }}>Menu data coming soon</span>}
          </div>
          <ServiceBadges serviceTypes={restaurant.serviceTypes} />
          {/* 1. Macro match bar */}
          {bestScore !== null && <MacroMatchBar score={bestScore} />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {mapsUrl && (
            <a
              href={mapsUrl} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                fontSize: 11, fontWeight: 700, color: '#2E6FB8',
                background: 'rgba(46,111,184,0.08)', border: '1px solid rgba(46,111,184,0.18)',
                borderRadius: 8, padding: '5px 10px', textDecoration: 'none',
              }}
            >
              📍 Map
            </a>
          )}
          <span style={{ fontSize: 13, color: isExpanded ? GREEN : FG3 }}>
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

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

/* ── MenuItemCard — flat item card for pooled browse view ── */
const OUTLET_LABEL: Record<OutletType, { label: string; emoji: string }> = {
  restaurant:   { label: 'Restaurant',   emoji: '🍽️' },
  hawker:       { label: 'Hawker',       emoji: '🍜' },
  grab_go:      { label: 'Takeaway',     emoji: '🥡' },
  ready_to_eat: { label: 'Ready-to-Eat', emoji: '🏪' },
};

function MenuItemCard({
  item, restaurant, distKm, userFlags, onLog, logged,
}: {
  item: SGMenuItem; restaurant: SGRestaurant; distKm?: number;
  userFlags: DietaryFlag[]; onLog: (item: SGMenuItem, r: SGRestaurant) => void; logged: boolean;
}) {
  const fit   = getDietFit(item.compatibleWith, userFlags);
  const score = macroMatchScore(item, { protein: 0, calories: 0, carbs: 0 }); // placeholder — overridden below
  const outlet = OUTLET_LABEL[restaurant.outletType] ?? OUTLET_LABEL.restaurant;
  return (
    <div style={{
      background: CARD, borderRadius: 18, border: `1px solid ${BORDER}`,
      padding: '12px 14px', marginBottom: 8, boxShadow: SHADOW,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Emoji */}
        <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(30,127,92,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
          {item.emoji}
        </div>
        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Row 1: item name + badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: FG1 }}>{item.name}</span>
            {item.isPopular && (
              <span style={{ fontSize: 9, fontWeight: 800, color: '#C98A2E', background: 'rgba(242,169,59,0.10)', borderRadius: 5, padding: '1px 5px' }}>⭐ POPULAR</span>
            )}
          </div>
          {/* Row 2: restaurant + outlet type + distance */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: FG3 }}>{restaurant.emoji} {restaurant.name}</span>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 5, background: 'rgba(91,101,118,0.07)', border: `1px solid ${BORDER}`, color: FG3 }}>
              {outlet.emoji} {outlet.label}
            </span>
            {distKm !== undefined && (
              <span style={{ fontSize: 9, color: FG3 }}>📍 {distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`}</span>
            )}
          </div>
          {/* Row 3: price + macros + Protein/$ */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: GREEN }}>${item.price.toFixed(2)}</span>
            <span style={{ fontSize: 10, color: FG3 }}>{item.calories}kcal · P{item.protein}g · C{item.carbs}g · F{item.fat}g</span>
            <PpdBadge protein={item.protein} price={item.price} />
            <DietBadge fit={fit} />
          </div>
        </div>
        {/* Log button */}
        <button onClick={() => onLog(item, restaurant)} style={{
          flexShrink: 0, borderRadius: 10, padding: '8px 12px',
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

/* ── Tier section header ── */
function TierSectionHeader({
  emoji, title, count, color, note,
}: {
  emoji: string; title: string; count: number; color: string; note?: string;
}) {
  if (count === 0) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, marginBottom: 10 }}>
      <span style={{ fontSize: 16 }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color }}>{title}</span>
        {note && <span style={{ fontSize: 10, color: FG3, marginLeft: 6 }}>{note}</span>}
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color: FG3, background: BORDER, borderRadius: 999, padding: '2px 8px' }}>
        {count}
      </span>
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

/* ── Smart sort recommendation ── */
function getRecommendedSort(
  goalType: string,
  remProtein: number,
  remCal: number,
  targetProtein: number,
  targetCalories: number,
): { key: SortKey; reason: string } {
  const proteinPct = targetProtein   > 0 ? remProtein / targetProtein   : 0;
  const calPct     = targetCalories  > 0 ? remCal     / targetCalories  : 0;
  if (goalType === 'muscle_gain' || proteinPct > 0.5)
    return { key: 'protein_dollar', reason: 'Maximise protein per dollar for your muscle goal' };
  if (goalType === 'weight_loss' && calPct < 0.3)
    return { key: 'price', reason: 'Budget options to stay within your calorie deficit' };
  return { key: 'best_match', reason: 'Best macro fit for your remaining daily targets' };
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

  const [tab,           setTab         ] = useState<EatTab>('food');
  const [sortBy,        setSortBy      ] = useState<SortKey>('best_match');
  const [query,         setQuery       ] = useState('');
  const [expandedId,    setExpandedId  ] = useState<string | null>(null);
  const [logged,        setLogged      ] = useState<Set<string>>(new Set());
  const [recipeLogged,  setRecipeLogged] = useState<Set<string>>(new Set());

  /* Smart sort — auto-apply once on mount based on user's goal */
  const sortInitialised = useRef(false);
  const recommendedSort = useMemo(
    () => getRecommendedSort(
      profile.goalType ?? 'maintenance',
      remProtein, remCal,
      profile.targetProtein || 0, profile.targetCalories,
    ),
    [profile.goalType, remProtein, remCal, profile.targetProtein, profile.targetCalories],
  );
  useEffect(() => {
    if (!sortInitialised.current) {
      setSortBy(recommendedSort.key);
      sortInitialised.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Filter state */
  const [filterMode,        setFilterMode       ] = useState<FilterMode>('all');
  const [filterOpenNow,     setFilterOpenNow    ] = useState(false);
  const [filterMaxDist,     setFilterMaxDist    ] = useState<null|0.5|1|2>(1);
  const [filterCuisine,     setFilterCuisine    ] = useState('All');
  const [filterHighProtein, setFilterHighProtein] = useState(false);
  const [filterDietMatch,   setFilterDietMatch  ] = useState(userFlags.length > 0);
  /* Show More in pooled browse view */
  const [showMore,          setShowMore         ] = useState(false);

  const switchTab = (t: EatTab) => {
    setTab(t); setQuery(''); setExpandedId(null); setShowMore(false);
    setFilterMode('all'); setFilterOpenNow(false); setFilterMaxDist(1);
    setFilterCuisine('All'); setFilterHighProtein(false);
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
    places.map(p => {
      const dbMatch = matchRestaurant(p.name);
      const tier: RestaurantTier = !dbMatch ? 'place_only' : dbMatch.tier;
      return { ...p, dbMatch, tier };
    }), [places]);

  /* Cuisine chip options derived from actual nearby places */
  const cuisineOptions = useMemo(() => {
    const seen = new Set<string>();
    enrichedPlaces.forEach(p => {
      const raw = p.dbMatch ? p.dbMatch.cuisine : p.type;
      if (raw) seen.add(raw.charAt(0).toUpperCase() + raw.slice(1));
    });
    return Array.from(seen).sort();
  }, [enrichedPlaces]);

  /* ── Sorted + filtered GPS places, split into 3 tiers ── */
  const { tier1Places, tier2Places, tier3Places } = useMemo(() => {
    let list = [...enrichedPlaces];

    // ── Shared filters ──────────────────────────────────────────────────────
    if (filterMode !== 'all') list = list.filter(p => {
      if (!p.dbMatch) return true;
      if (filterMode === 'ready_to_eat') return p.dbMatch.outletType === 'ready_to_eat';
      if (filterMode === 'delivery')     return p.dbMatch.serviceTypes.includes('delivery');
      return p.dbMatch.serviceTypes.includes(filterMode as ServiceType);
    });
    if (filterOpenNow)           list = list.filter(p => p.hours === 'Open now');
    if (filterMaxDist !== null)  list = list.filter(p => (p.distKm ?? 999) <= filterMaxDist);
    if (filterCuisine !== 'All') list = list.filter(p => {
      const c = p.dbMatch ? p.dbMatch.cuisine : p.type;
      return c.toLowerCase().includes(filterCuisine.toLowerCase());
    });
    if (filterHighProtein) list = list.filter(p =>
      p.dbMatch?.menu.some(i => i.protein >= HIGH_PROTEIN_THRESHOLD) ?? false
    );
    if (filterDietMatch && userFlags.length > 0) {
      list = list.filter(p =>
        p.dbMatch?.menu.some(i => userFlags.every(f => i.compatibleWith.includes(f))) ?? false
      );
    }

    // ── Sort comparator — applied within each tier independently ────────────
    const sortFn = (a: EnrichedPlace, b: EnrichedPlace): number => {
      if (sortBy === 'distance') return (a.distKm ?? 999) - (b.distKm ?? 999);
      if (sortBy === 'protein_dollar') {
        const ppd = (p: EnrichedPlace) => p.dbMatch && p.dbMatch.menu.length
          ? Math.max(...p.dbMatch.menu.map(i => proteinPerDollar(i.protein, i.price)))
          : -1;  // no data → sort last
        return ppd(b) - ppd(a);
      }
      if (sortBy === 'price') {
        const minP = (p: EnrichedPlace) => p.dbMatch && p.dbMatch.menu.length
          ? Math.min(...p.dbMatch.menu.map(i => i.price))
          : 9999;  // no data → sort last
        return minP(a) - minP(b);
      }
      // best_match — places with menu data ranked by macro score; no-data places go last
      if (a.dbMatch?.menu.length && b.dbMatch?.menu.length) {
        const sc = (p: EnrichedPlace) => Math.max(...p.dbMatch!.menu.map(i => macroMatchScore(i, macroRem)));
        return sc(b) - sc(a);
      }
      if (a.dbMatch?.menu.length) return -1;
      if (b.dbMatch?.menu.length) return  1;
      return (a.distKm ?? 999) - (b.distKm ?? 999);  // both no data → sort by distance
    };

    const t1 = list.filter(p => p.tier === 'full_menu').sort(sortFn);
    const t2 = list.filter(p => p.tier === 'estimated_menu').sort(sortFn);
    const t3 = list.filter(p => p.tier === 'place_only').sort(sortFn);

    return { tier1Places: t1, tier2Places: t2, tier3Places: t3 };
  }, [enrichedPlaces, sortBy, filterOpenNow, filterMaxDist, filterCuisine, filterHighProtein, filterDietMatch, userFlags, macroRem, filterMode]);

  /* Keep a flat list for the "N places · M with menu" count line */
  const sortedFilteredPlaces = useMemo(
    () => [...tier1Places, ...tier2Places, ...tier3Places],
    [tier1Places, tier2Places, tier3Places],
  );

  const anyFilterActive = filterMode !== 'all' || filterOpenNow || filterMaxDist !== 1 || filterCuisine !== 'All' || filterHighProtein || (filterDietMatch && userFlags.length > 0);

  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    if (tab === 'store') return { type: 'recipes' as const, recipes: searchRecipes(query) };
    const svcFilter = (filterMode === 'dine_in' || filterMode === 'grab_go')
      ? filterMode as ServiceType : undefined;
    const { restaurants, items } = searchAll(query, svcFilter);
    return { type: 'food' as const, restaurants, items };
  }, [query, tab, filterMode]);

  /* Detect whether the search query is targeting a restaurant by name */
  const isRestaurantSearch = useMemo(() => {
    if (!query.trim() || tab !== 'food') return false;
    const q = query.toLowerCase().trim();
    return SG_RESTAURANTS.some(r =>
      r.name.toLowerCase().includes(q) ||
      r.aliases.some(a => a.includes(q) || q.includes(a))
    );
  }, [query, tab]);

  /* DB chains — shown below GPS results or when GPS unavailable.
     Excludes any outlet already surfaced by GPS (avoid duplicates). */
  const dbChains = useMemo(() => {
    const gpsMatchedIds = new Set(enrichedPlaces.filter(p => p.dbMatch).map(p => p.dbMatch!.id));
    let base = SG_RESTAURANTS
      .filter(r => !gpsMatchedIds.has(r.id))
      .filter(r => {
        if (filterMode === 'all') return true;
        if (filterMode === 'ready_to_eat') return r.outletType === 'ready_to_eat';
        if (filterMode === 'delivery')     return r.serviceTypes.includes('delivery');
        return r.serviceTypes.includes(filterMode as ServiceType);
      })
      .filter(r => !filterDietMatch || !userFlags.length ||
        r.menu.some(i => userFlags.every(f => i.compatibleWith.includes(f))));
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
  }, [enrichedPlaces, sortBy, macroRem, filterMode, filterDietMatch, userFlags]);

  /* ── Pooled items: all menu items from GPS places + DB chains, ranked by macro match ── */
  const pooledItems = useMemo((): PooledItem[] => {
    const items: PooledItem[] = [];
    // From GPS tier1 + tier2 places
    [...tier1Places, ...tier2Places].forEach(place => {
      if (place.dbMatch) {
        place.dbMatch.menu.forEach(item => {
          items.push({ item, restaurant: place.dbMatch!, distKm: place.distKm, tier: place.tier });
        });
      }
    });
    // From DB chains (no distance)
    dbChains.forEach(r => {
      r.menu.forEach(item => {
        items.push({ item, restaurant: r, distKm: undefined, tier: r.tier });
      });
    });
    // Apply item-level filters
    let filtered = items;
    if (filterHighProtein) filtered = filtered.filter(p => p.item.protein >= HIGH_PROTEIN_THRESHOLD);
    if (filterDietMatch && userFlags.length > 0)
      filtered = filtered.filter(p => userFlags.every(f => p.item.compatibleWith.includes(f)));
    // Sort by macro match score against remaining macros
    return filtered.sort((a, b) => macroMatchScore(b.item, macroRem) - macroMatchScore(a.item, macroRem));
  }, [tier1Places, tier2Places, dbChains, filterHighProtein, filterDietMatch, userFlags, macroRem]);

  /* Slice rules for pooled browse:
     - Initial: top 8 items regardless of distance
     - Expanded: items within 1km (or from DB with no distance), capped at 20 */
  const pooledInitial  = pooledItems.slice(0, 8);
  const pooledExpanded = pooledItems
    .filter(p => p.distKm === undefined || p.distKm <= 1)
    .slice(0, 20);
  const visiblePooled  = showMore ? pooledExpanded : pooledInitial;
  const hasMore        = !showMore && pooledItems.length > 8;

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

        {/* Tab bar — 2 tabs */}
        <div style={{ background: CARD, borderRadius: 16, padding: 4, display: 'flex', gap: 4, border: `1px solid ${BORDER}`, marginBottom: 14, boxShadow: SHADOW }}>
          <button style={tabBtn(tab === 'food')}  onClick={() => switchTab('food')}>🍴 Eat Out</button>
          <button style={tabBtn(tab === 'store')} onClick={() => switchTab('store')}>🥗 Cook / Prep</button>
        </div>

        <SearchBar
          value={query} onChange={setQuery}
          placeholder={tab === 'food' ? 'Search restaurants, chains, or dishes…' : 'Search recipes or ingredients…'}
        />

        {!query && tab === 'food' && (
          <SortBar active={sortBy} onChange={setSortBy} showDistance={locState === 'done'} recommendedKey={recommendedSort.key} />
        )}

        {/* Filter bar: Food tab */}
        {tab === 'food' && !query && (
          <FilterBar
            filterMode={filterMode}               setFilterMode={setFilterMode}
            filterOpenNow={filterOpenNow}         setFilterOpenNow={setFilterOpenNow}
            filterMaxDist={filterMaxDist}         setFilterMaxDist={setFilterMaxDist}
            filterCuisine={filterCuisine}         setFilterCuisine={setFilterCuisine}
            filterHighProtein={filterHighProtein} setFilterHighProtein={setFilterHighProtein}
            filterDietMatch={filterDietMatch}     setFilterDietMatch={setFilterDietMatch}
            cuisineOptions={cuisineOptions}       hasDietPrefs={userFlags.length > 0}
          />
        )}


        {/* ══ EAT OUT TAB ══ */}
        {tab === 'food' && (
          <>
            {/* ── SEARCH MODE ── */}
            {query && searchResults?.type === 'food' && (
              <>
                {/* Restaurant-name search → show restaurant card with full menu */}
                {isRestaurantSearch && searchResults.restaurants.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: FG3, marginBottom: 10 }}>
                      {searchResults.restaurants.length} restaurant{searchResults.restaurants.length !== 1 ? 's' : ''} found
                    </div>
                    {searchResults.restaurants.map(r => (
                      <MenuFirstGroup key={r.id} restaurant={r}
                        userFlags={userFlags} remaining={macroRem} onLog={logMenuItem} logged={logged}
                        badge={<span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(46,111,184,0.10)', color: '#2E6FB8', borderRadius: 5, padding: '1px 5px' }}>📋 IN DATABASE</span>}
                      />
                    ))}
                  </>
                )}

                {/* Dish/macro search → flat item cards ranked by macro match */}
                {!isRestaurantSearch && (
                  <>
                    {searchResults.items.length > 0 && (
                      <>
                        <div style={{ fontSize: 12, fontWeight: 700, color: FG3, marginBottom: 10 }}>
                          {searchResults.items.length} item{searchResults.items.length !== 1 ? 's' : ''} found
                        </div>
                        {[...searchResults.items]
                          .sort((a, b) => macroMatchScore(b.item, macroRem) - macroMatchScore(a.item, macroRem))
                          .map(({ restaurant, item }) => (
                            <MenuItemCard
                              key={`${restaurant.id}-${item.id}`}
                              item={item} restaurant={restaurant}
                              userFlags={userFlags}
                              onLog={logMenuItem}
                              logged={logged.has(item.id)}
                            />
                          ))}
                      </>
                    )}
                  </>
                )}

                {/* No results */}
                {searchResults.restaurants.length === 0 && searchResults.items.length === 0 && (
                  query.trim().length > 0 ? (
                    <div style={{ background: CARD, borderRadius: 20, border: `1px solid ${BORDER}`, padding: '28px 20px', textAlign: 'center', boxShadow: SHADOW }}>
                      <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: FG2, marginBottom: 8 }}>Not in our database yet</div>
                      <a
                        href={`https://www.google.com/maps/search/${encodeURIComponent(query)}+Singapore`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-block', background: 'rgba(46,111,184,0.08)', color: '#2E6FB8', borderRadius: 12, padding: '10px 16px', fontSize: 13, fontWeight: 700, textDecoration: 'none', marginBottom: 8 }}
                      >
                        📍 Search on Google Maps →
                      </a>
                      <div style={{ fontSize: 11, color: '#8B95A7' }}>Opens Google Maps for nearby options</div>
                    </div>
                  ) : (
                    <EmptyState emoji="🔍" title="No results" subtitle={`"${query}" not found yet. Try a dish name or restaurant.`} />
                  )
                )}
              </>
            )}

            {/* ── BROWSE MODE (no query) ── */}
            {!query && (
              <>
                {/* GPS status banners */}
                {(locState === 'locating' || locState === 'fetching') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2.5px solid ${BORDER}`, borderTopColor: GREEN, animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: 13, color: FG3 }}>{locState === 'locating' ? 'Getting your location…' : 'Finding nearby places…'}</span>
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
                      Add <code style={{ background: BORDER, borderRadius: 4, padding: '1px 4px', color: FG1 }}>GOOGLE_PLACES_API_KEY</code> to show places near you.
                    </span>
                  </div>
                )}

                {/* GPS summary line */}
                {locState === 'done' && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: FG3, marginBottom: 4 }}>
                    {enrichedPlaces.length} places nearby
                    {' · '}<span style={{ color: GREEN }}>{enrichedPlaces.filter(p => p.tier === 'full_menu').length} full menu</span>
                    {' · '}<span style={{ color: '#C98A2E' }}>{enrichedPlaces.filter(p => p.tier === 'estimated_menu').length} estimated</span>
                    {anyFilterActive ? ` · ${sortedFilteredPlaces.length} shown` : ''}
                  </div>
                )}

                {/* ── Pooled items — items-first ranked browse ── */}
                {pooledItems.length === 0 && (locState === 'done' || locState === 'error' || locState === 'no_key') && (
                  <EmptyState emoji="🍽️" title="No items match your filters" subtitle="Try adjusting the filters above." />
                )}

                {visiblePooled.map(p => (
                  <MenuItemCard
                    key={`${p.restaurant.id}-${p.item.id}`}
                    item={p.item} restaurant={p.restaurant} distKm={p.distKm}
                    userFlags={userFlags} onLog={logMenuItem} logged={logged.has(p.item.id)}
                  />
                ))}

                {/* Show More button — expands to 20 items within 1km */}
                {hasMore && (
                  <button
                    onClick={() => setShowMore(true)}
                    style={{
                      width: '100%', padding: '12px 0', borderRadius: 14, marginBottom: 12,
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      background: CARD, border: `1px solid ${BORDER}`, color: FG2,
                      boxShadow: SHADOW, transition: 'all .2s',
                    }}
                  >
                    Show more within 1km ({Math.min(pooledItems.filter(p => p.distKm === undefined || p.distKm <= 1).length, 20)} items) ↓
                  </button>
                )}

                {/* ── Tier 3: GPS-only places with no DB match ── */}
                {locState === 'done' && tier3Places.length > 0 && (
                  <>
                    <TierSectionHeader
                      emoji="📍" title="Other Nearby Places" count={tier3Places.length}
                      color={FG3} note="No menu data yet"
                    />
                    {tier3Places.map(place => {
                      return (
                        <div key={place.id} style={{ background: CARD, borderRadius: 18, padding: 14, border: `1px solid ${BORDER}`, marginBottom: 10, boxShadow: SHADOW }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(139,149,167,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                              {place.emoji}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 14, fontWeight: 800, color: FG1 }}>{place.name}</span>
                                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: 'rgba(139,149,167,0.10)', border: `1px solid ${BORDER}`, color: FG3 }}>No data</span>
                              </div>
                              <div style={{ fontSize: 11, color: FG3, marginBottom: 6 }}>
                                {place.type} · {place.distance}{place.rating ? ` · ⭐ ${place.rating.toFixed(1)}` : ''} · {place.hours}
                              </div>

                              <a
                                href={`mailto:hello@strideapp.sg?subject=Menu data for ${encodeURIComponent(place.name)}&body=Hi, I'd like to submit nutrition data for ${encodeURIComponent(place.name)}.`}
                                style={{ fontSize: 11, color: '#2E6FB8', fontWeight: 600, textDecoration: 'none' }}
                              >
                                📋 Help add {place.name}&apos;s menu →
                              </a>
                            </div>
                            <a href={place.mapsUrl} target="_blank" rel="noopener noreferrer"
                              style={{ flexShrink: 0, background: 'rgba(139,149,167,0.12)', color: FG2, borderRadius: 10, padding: '8px 12px', fontSize: 11, fontWeight: 700, textDecoration: 'none', alignSelf: 'flex-start', border: `1px solid ${BORDER}` }}>
                              Map →
                            </a>
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

        {/* ══ COOK / PREP TAB ══ */}
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
                <EmptyState emoji="🥗" title="Recipes coming soon" subtitle={"We're building budget-friendly, macro-optimised recipes using FairPrice and Cold Storage ingredients.\n\nHigh Protein, Meal Prep, and Budget Meals will be the first categories."} />
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
