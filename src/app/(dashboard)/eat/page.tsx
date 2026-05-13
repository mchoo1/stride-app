'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useStrideStore } from '@/lib/store';
import { track, Events } from '@/lib/analytics';
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

function SortDropdown({ active, onChange, showDistance }: {
  active: SortKey; onChange: (k: SortKey) => void; showDistance: boolean;
}) {
  const opts: { key: SortKey; label: string }[] = [
    { key: 'best_match',     label: '🎯 Best Match'  },
    { key: 'protein_dollar', label: '💪 Protein/$'   },
    { key: 'price',          label: '💰 Price: Low → High' },
    ...(showDistance ? [{ key: 'distance' as SortKey, label: '📍 Nearest' }] : []),
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: FG3, flexShrink: 0 }}>Sort</span>
      <select
        value={active}
        onChange={e => onChange(e.target.value as SortKey)}
        style={{
          fontSize: 12, fontWeight: 600, color: FG2,
          border: `1px solid ${BORDER}`, borderRadius: 10,
          padding: '6px 28px 6px 10px', background: CARD, cursor: 'pointer',
          outline: 'none', flex: 1,
          WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
        }}
      >
        {opts.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
    </div>
  );
}

/* ── 2. FilterBar — chips row + macro sliders ── */
function FilterBar({
  filterMode, setFilterMode,
  filterOpenNow, setFilterOpenNow,
  filter500m, setFilter500m,
  filterMinProtein, setFilterMinProtein,
  filterMaxCalories, setFilterMaxCalories,
}: {
  filterMode: FilterMode; setFilterMode: (v: FilterMode) => void;
  filterOpenNow: boolean; setFilterOpenNow: (v: boolean) => void;
  filter500m: boolean;    setFilter500m: (v: boolean) => void;
  filterMinProtein: number;   setFilterMinProtein: (v: number) => void;
  filterMaxCalories: number;  setFilterMaxCalories: (v: number) => void;
}) {
  const [showSliders, setShowSliders] = useState(false);
  const chip = (active: boolean, accent?: string): React.CSSProperties => ({
    flexShrink: 0, borderRadius: 999, padding: '5px 12px',
    fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const,
    border: `1.5px solid ${active ? (accent ?? GREEN) : BORDER}`,
    background: active ? (accent ? `${accent}22` : 'rgba(30,127,92,0.14)') : CARD,
    color: active ? (accent ?? GREEN) : FG3, transition: 'all .15s',
    outline: 'none', WebkitTapHighlightColor: 'transparent',
  });
  const modeOpts: { val: FilterMode; label: string }[] = [
    { val: 'all',          label: 'All'          },
    { val: 'dine_in',      label: '🍽 Dine In'   },
    { val: 'grab_go',      label: '🥡 Takeaway'  },
    { val: 'ready_to_eat', label: '🏪 Ready-to-Eat' },
  ];
  const macroActive = filterMinProtein > 0 || filterMaxCalories > 0;
  return (
    <div style={{ marginBottom: 12 }}>
      {/* Chip row */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
        {modeOpts.map(s => (
          <button key={s.val} onClick={() => setFilterMode(s.val)} style={chip(filterMode === s.val)}>
            {s.label}
          </button>
        ))}
        <div style={{ width: 1, background: BORDER, flexShrink: 0, margin: '4px 2px' }} />
        <button onClick={() => setFilterOpenNow(!filterOpenNow)} style={chip(filterOpenNow)}>🟢 Open Now</button>
        <button onClick={() => setFilter500m(!filter500m)} style={chip(filter500m)}>📍 &lt; 500m</button>
        <button onClick={() => setShowSliders(!showSliders)} style={chip(showSliders || macroActive, macroActive ? '#2E6FB8' : undefined)}>
          {macroActive ? '🎛 Filtered' : '🎛 Macros'}
        </button>
      </div>

      {/* Macro sliders (expandable) */}
      {showSliders && (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '12px 14px', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Min protein */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: FG2 }}>Min Protein</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: filterMinProtein > 0 ? GREEN : FG3 }}>
                {filterMinProtein > 0 ? `≥ ${filterMinProtein}g` : 'Any'}
              </span>
            </div>
            <input type="range" min={0} max={50} step={5} value={filterMinProtein}
              onChange={e => setFilterMinProtein(Number(e.target.value))}
              style={{ width: '100%', accentColor: GREEN, cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: FG3, marginTop: 2 }}>
              <span>0g</span><span>10g</span><span>20g</span><span>30g</span><span>40g</span><span>50g</span>
            </div>
          </div>
          {/* Max calories */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: FG2 }}>Max Calories</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: filterMaxCalories > 0 ? '#D04E36' : FG3 }}>
                {filterMaxCalories > 0 ? `≤ ${filterMaxCalories} kcal` : 'Any'}
              </span>
            </div>
            <input type="range" min={0} max={1200} step={50} value={filterMaxCalories}
              onChange={e => setFilterMaxCalories(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#D04E36', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: FG3, marginTop: 2 }}>
              <span>Any</span><span>300</span><span>600</span><span>900</span><span>1200</span>
            </div>
          </div>
          {macroActive && (
            <button onClick={() => { setFilterMinProtein(0); setFilterMaxCalories(0); }} style={{
              background: 'rgba(208,78,54,0.07)', border: '1px solid rgba(208,78,54,0.18)',
              borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, color: '#D04E36', cursor: 'pointer',
            }}>Clear macro filters</button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── 4. MenuItemRow — clean two-line row ── */
function MenuItemRow({
  item, onLog, logged,
}: {
  item: SGMenuItem; userFlags?: DietaryFlag[];
  onLog: (item: SGMenuItem) => void; logged: boolean;
}) {
  const ppd  = proteinPerDollar(item.protein, item.price);
  const ppdC = ppdColor(ppd);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: `1px solid ${BORDER}` }}>
      <span style={{ fontSize: 22, flexShrink: 0, width: 28, textAlign: 'center' }}>{item.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: FG1, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
          {item.name}{item.isPopular ? ' ⭐' : ''}
        </div>
        <div style={{ fontSize: 11, color: FG3 }}>
          <span style={{ color: GREEN, fontWeight: 700 }}>${item.price.toFixed(2)}</span>
          {' · '}{item.calories} kcal · P{item.protein}g
          {' · '}<span style={{ color: ppdC, fontWeight: 700 }}>{ppd}g/$</span>
        </div>
      </div>
      <button onClick={() => onLog(item)} style={{
        flexShrink: 0, width: 30, height: 30, borderRadius: '50%',
        border: `1px solid ${logged ? 'rgba(30,127,92,0.30)' : BORDER}`,
        background: logged ? 'rgba(30,127,92,0.10)' : CARD,
        color: logged ? GREEN : FG2, fontSize: 18, fontWeight: 700, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s',
        padding: 0,
      }}>
        {logged ? '✓' : '+'}
      </button>
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
  const resolved   = resolveIngredients(recipe).filter(r => r.ingredient !== null);
  const rawCost    = calcCostPerServing(recipe) ?? recipe.costPerServing;
  const actualCost = (rawCost != null && !isNaN(rawCost as number)) ? rawCost as number : null;
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
            {actualCost != null
              ? <span style={{ fontSize: 13, fontWeight: 800, color: GREEN }}>${actualCost.toFixed(2)}/serving</span>
              : <span style={{ fontSize: 11, color: FG3 }}>Price TBC</span>
            }
            <span style={{ fontSize: 10, color: FG3 }}>P{m.protein}g · C{m.carbs}g · F{m.fat}g · {m.calories}kcal</span>
            {actualCost != null && <PpdBadge protein={m.protein} price={actualCost} />}
            <DietBadge fit={fit} />
          </div>
        </div>
        <span style={{ fontSize: 13, color: expanded ? GREEN : FG3, flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div style={{ background: CARD, border: `1px solid rgba(30,127,92,0.20)`, borderTop: 'none', borderRadius: '0 0 18px 18px', padding: 14 }}>
          <p style={{ fontSize: 12, color: FG2, margin: '0 0 12px', lineHeight: 1.6 }}>{recipe.description}</p>
          <div style={{ fontSize: 12, fontWeight: 800, color: FG1, marginBottom: 8 }}>🛒 Ingredients</div>
          {resolved.length === 0 ? (
            <div style={{ fontSize: 12, color: FG3, fontStyle: 'italic', marginBottom: 14 }}>Ingredient details coming soon</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {resolved.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{r.ingredient!.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, color: FG1 }}>{r.ingredient!.name}</span>
                    {r.note && <span style={{ fontSize: 11, color: FG3 }}> — {r.note}</span>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: FG2 }}>×{r.quantity} {r.ingredient!.unit}</div>
                    <div style={{ fontSize: 10, color: FG3 }}>{r.ingredient!.store} · ${(r.ingredient!.price * r.quantity).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
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

/* ── MenuItemCard — flat item card for pooled browse view, tappable for detail ── */
function MenuItemCard({
  item, restaurant, distKm, userFlags, onLog, logged, isExpanded, onToggle,
}: {
  item: SGMenuItem; restaurant: SGRestaurant; distKm?: number;
  userFlags?: DietaryFlag[]; onLog: (item: SGMenuItem, r: SGRestaurant) => void;
  logged: boolean; isExpanded: boolean; onToggle: () => void;
}) {
  const ppd      = proteinPerDollar(item.protein, item.price);
  const ppdC     = ppdColor(ppd);
  const dietFit  = (userFlags?.length && item.compatibleWith)
    ? getDietFit(item.compatibleWith, userFlags)
    : 'neutral' as DietFit;
  const distLabel = distKm !== undefined
    ? (distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`)
    : undefined;

  const grabUrl  = `https://food.grab.com/sg/en/search?query=${encodeURIComponent(restaurant.name)}`;
  const pandaUrl = `https://www.foodpanda.sg/search?q=${encodeURIComponent(restaurant.name)}`;
  const mapsUrl  = `https://www.google.com/maps/search/${encodeURIComponent(restaurant.name + ' Singapore')}`;

  return (
    <div style={{ borderBottom: `1px solid ${BORDER}` }}>
      {/* Compact row — tap to expand */}
      <div role="button" onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
        <span style={{ fontSize: 22, flexShrink: 0, width: 28, textAlign: 'center' }}>{item.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: FG1, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
            {item.name}{item.isPopular ? ' ⭐' : ''}
          </div>
          <div style={{ fontSize: 11, color: FG3, marginBottom: 1 }}>
            {restaurant.emoji} {restaurant.name}{distLabel ? ` · 📍 ${distLabel}` : ''}
          </div>
          <div style={{ fontSize: 11, color: FG3 }}>
            <span style={{ color: GREEN, fontWeight: 700 }}>${item.price.toFixed(2)}</span>
            {' · '}{item.calories} kcal · P{item.protein}g
            {' · '}<span style={{ color: ppdC, fontWeight: 700 }}>{ppd}g/$</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: isExpanded ? GREEN : FG3, transition: 'color .15s' }}>
            {isExpanded ? '▲' : '▼'}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onLog(item, restaurant); }}
            style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none',
              background: logged ? GREEN : 'rgba(30,127,92,0.10)',
              color: logged ? '#fff' : GREEN, fontSize: logged ? 15 : 20, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .18s', padding: 0, transform: logged ? 'scale(0.92)' : 'scale(1)',
            }}
          >
            {logged ? '✓' : '+'}
          </button>
        </div>
      </div>

      {/* ── Expanded detail ── */}
      {isExpanded && (
        <div style={{ padding: '0 14px 14px', background: 'rgba(30,127,92,0.025)' }}>
          {/* Macro grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
            {([
              { label: 'Calories', value: item.calories,        unit: 'kcal' },
              { label: 'Protein',  value: item.protein,         unit: 'g'    },
              { label: 'Carbs',    value: item.carbs,           unit: 'g'    },
              { label: 'Fat',      value: item.fat,             unit: 'g'    },
            ] as { label: string; value: number; unit: string }[]).map(({ label, value, unit }) => (
              <div key={label} style={{ background: CARD, borderRadius: 10, padding: '8px 4px', textAlign: 'center', border: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: FG1 }}>
                  {value}<span style={{ fontSize: 9, fontWeight: 600, color: FG3 }}>{unit}</span>
                </div>
                <div style={{ fontSize: 9, color: FG3, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Diet fit */}
          {dietFit !== 'neutral' && <div style={{ marginBottom: 10 }}><DietBadge fit={dietFit} /></div>}

          {/* Order + map CTAs */}
          <div style={{ display: 'flex', gap: 6 }}>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                background: 'rgba(46,111,184,0.08)', color: '#2E6FB8', border: '1px solid rgba(46,111,184,0.20)',
                borderRadius: 10, padding: '9px 6px', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
              📍 Maps
            </a>
            <a href={grabUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                background: 'rgba(0,173,89,0.08)', color: '#00AD59', border: '1px solid rgba(0,173,89,0.20)',
                borderRadius: 10, padding: '9px 6px', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
              🛵 GrabFood
            </a>
            <a href={pandaUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                background: 'rgba(217,0,77,0.06)', color: '#D9004D', border: '1px solid rgba(217,0,77,0.18)',
                borderRadius: 10, padding: '9px 6px', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
              🐼 foodpanda
            </a>
          </div>
        </div>
      )}
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

/* ── RestaurantGroup — grouped browse card ── */
function RestaurantGroup({
  restaurant, items, distKm, hours, mapsUrl, macroRem, onLog, logged,
}: {
  restaurant: SGRestaurant;
  items: PooledItem[];
  distKm?: number;
  hours?: string;
  mapsUrl?: string;
  macroRem: { protein: number; calories: number; carbs: number };
  onLog: (item: SGMenuItem, r: SGRestaurant) => void;
  logged: Set<string>;
}) {
  const [showAll, setShowAll] = useState(false);
  const PREVIEW = 3;

  const sortedItems = useMemo(() =>
    [...items].sort((a, b) => macroMatchScore(b.item, macroRem) - macroMatchScore(a.item, macroRem)),
    [items, macroRem],
  );

  const visible  = showAll ? sortedItems : sortedItems.slice(0, PREVIEW);
  const hasMore  = sortedItems.length > PREVIEW;
  const distLabel = distKm !== undefined
    ? (distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`)
    : undefined;

  const metaStr = [distLabel, hours].filter(Boolean).join(' · ');

  return (
    <div style={{ background: CARD, borderRadius: 18, border: `1px solid ${BORDER}`, marginBottom: 10, overflow: 'hidden', boxShadow: SHADOW }}>
      {/* Restaurant header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, background: 'rgba(15,27,45,0.02)' }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>{restaurant.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: FG1 }}>{restaurant.name}</div>
          {metaStr && <div style={{ fontSize: 11, color: FG3, marginTop: 1 }}>{metaStr} · {items.length} items</div>}
          {!metaStr && <div style={{ fontSize: 11, color: FG3, marginTop: 1 }}>{items.length} items</div>}
        </div>
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 10, fontWeight: 700, color: '#2E6FB8', background: 'rgba(46,111,184,0.07)', border: '1px solid rgba(46,111,184,0.15)', borderRadius: 8, padding: '5px 9px', textDecoration: 'none', flexShrink: 0 }}>
            Map
          </a>
        )}
      </div>
      {/* Items */}
      {visible.map(p => (
        <MenuItemRow key={p.item.id} item={p.item}
          onLog={i => onLog(i, restaurant)} logged={logged.has(p.item.id)} />
      ))}
      {hasMore && (
        <button onClick={() => setShowAll(!showAll)} style={{
          width: '100%', padding: '9px 0', background: 'rgba(15,27,45,0.02)',
          border: 'none', borderTop: `1px solid ${BORDER}`,
          fontSize: 11, fontWeight: 700, color: FG3, cursor: 'pointer',
        }}>
          {showAll ? '▲ Show less' : `▼ ${sortedItems.length - PREVIEW} more items`}
        </button>
      )}
    </div>
  );
}

/* ── Log toast ── */
function LogToast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      background: '#0F1B2D', color: '#fff', borderRadius: 20,
      padding: '9px 18px', fontSize: 13, fontWeight: 700,
      whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 9999,
      boxShadow: '0 4px 16px rgba(0,0,0,0.25)', animation: 'fadeInUp .15s ease',
    }}>
      ✓ {message}
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
  const [toastMsg,      setToastMsg    ] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    track(Events.EAT_PAGE_VIEWED, { meal_context: mealCtx.mealType });
    if (!sortInitialised.current) {
      setSortBy(recommendedSort.key);
      sortInitialised.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Track search queries (debounced — only fire when query settles)
  useEffect(() => {
    if (!query.trim()) return;
    const t = setTimeout(() => track(Events.EAT_SEARCHED, { query: query.trim(), tab }), 800);
    return () => clearTimeout(t);
  }, [query, tab]);

  /* Filter state */
  const [filterMode,        setFilterMode       ] = useState<FilterMode>('all');
  const [filterOpenNow,     setFilterOpenNow    ] = useState(false);
  const [filterMaxDist,     setFilterMaxDist    ] = useState<null|0.5|1|2>(1);
  const [filterCuisine,     setFilterCuisine    ] = useState('All');
  const [filterHighProtein, setFilterHighProtein] = useState(false);
  const [filterDietMatch,   setFilterDietMatch  ] = useState(false);
  const [filterMinProtein,  setFilterMinProtein ] = useState(0);
  const [filterMaxCalories, setFilterMaxCalories] = useState(0);  // 0 = no limit
  const switchTab = (t: EatTab) => {
    setTab(t); setQuery(''); setExpandedId(null);
    setFilterMode('all'); setFilterOpenNow(false); setFilterMaxDist(1);
    setFilterMinProtein(0); setFilterMaxCalories(0);
    setShowMoreNearby(false); setShowMoreDb(false);
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

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocError('Geolocation not supported'); setLocState('error'); return; }
    setLocState('locating');
    navigator.geolocation.getCurrentPosition(
      pos => fetchPlaces(pos.coords.latitude, pos.coords.longitude),
      err => { setLocError(`Location denied: ${err.message}`); setLocState('error'); },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }, [fetchPlaces]);

  useEffect(() => { requestLocation(); }, [requestLocation]);

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

  const anyFilterActive = filterMode !== 'all' || filterOpenNow || filterMaxDist !== 1;

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
    // Deduplicate: same chain can have multiple GPS outlets nearby — keep only the nearest instance per item
    const seen = new Map<string, PooledItem>();
    for (const p of items) {
      const existing = seen.get(p.item.id);
      if (!existing || (p.distKm ?? 999) < (existing.distKm ?? 999)) {
        seen.set(p.item.id, p);
      }
    }
    // Apply item-level filters
    let filtered = Array.from(seen.values());
    if (filterHighProtein) filtered = filtered.filter(p => p.item.protein >= HIGH_PROTEIN_THRESHOLD);
    if (filterDietMatch && userFlags.length > 0)
      filtered = filtered.filter(p => userFlags.every(f => p.item.compatibleWith.includes(f)));
    if (filterMinProtein  > 0) filtered = filtered.filter(p => p.item.protein  >= filterMinProtein);
    if (filterMaxCalories > 0) filtered = filtered.filter(p => p.item.calories <= filterMaxCalories);
    // Sort pooled items by selected sort key
    return filtered.sort((a, b) => {
      if (sortBy === 'price')
        return a.item.price - b.item.price;
      if (sortBy === 'protein_dollar')
        return proteinPerDollar(b.item.protein, b.item.price) - proteinPerDollar(a.item.protein, a.item.price);
      if (sortBy === 'distance') {
        if (a.distKm !== undefined && b.distKm !== undefined) return a.distKm - b.distKm;
        if (a.distKm !== undefined) return -1;
        if (b.distKm !== undefined) return  1;
        return 0;
      }
      return macroMatchScore(b.item, macroRem) - macroMatchScore(a.item, macroRem);
    });
  }, [tier1Places, tier2Places, dbChains, filterHighProtein, filterDietMatch, userFlags, macroRem, sortBy, filterMinProtein, filterMaxCalories]);

  /* Group pooled items by restaurant for the browse view.
     Each restaurant appears once, at its nearest outlet distance. */
  const restaurantGroups = useMemo(() => {
    type RGroup = { restaurant: SGRestaurant; distKm?: number; hours?: string; mapsUrl?: string; items: PooledItem[] };
    const groups = new Map<string, RGroup>();
    for (const p of pooledItems) {
      const key = p.restaurant.id;
      if (!groups.has(key)) {
        const gpsPlace = enrichedPlaces.find(ep => ep.dbMatch?.id === p.restaurant.id);
        groups.set(key, {
          restaurant: p.restaurant,
          distKm: p.distKm,
          hours: gpsPlace?.hours,
          mapsUrl: gpsPlace?.mapsUrl,
          items: [],
        });
      }
      const g = groups.get(key)!;
      g.items.push(p);
      if (p.distKm !== undefined && (g.distKm === undefined || p.distKm < g.distKm)) {
        g.distKm = p.distKm;
      }
    }
    return Array.from(groups.values());
  }, [pooledItems, enrichedPlaces]);

  const nearbyGroups = restaurantGroups.filter(g => g.distKm !== undefined);
  const dbGroups     = restaurantGroups.filter(g => g.distKm === undefined);

  /* Flat item lists for the browse feed */
  const nearbyItems = pooledItems.filter(p => p.distKm !== undefined);
  const dbItems     = pooledItems.filter(p => p.distKm === undefined);
  const ITEM_INITIAL           = 8;
  const [showMoreNearby, setShowMoreNearby] = useState(false);
  const [showMoreDb,     setShowMoreDb    ] = useState(false);
  const visibleNearby = showMoreNearby ? nearbyItems : nearbyItems.slice(0, ITEM_INITIAL);
  const visibleDb     = showMoreDb     ? dbItems     : dbItems.slice(0, ITEM_INITIAL);
  const hasMoreNearby = nearbyItems.length > ITEM_INITIAL && !showMoreNearby;
  const hasMoreDb     = dbItems.length     > ITEM_INITIAL && !showMoreDb;

  /* Toast helper */
  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2200);
  }, []);

  /* Log helpers — use meal context mealType */
  const logMenuItem = useCallback((item: SGMenuItem, restaurant: SGRestaurant) => {
    store.addFoodEntry({
      foodItemId: item.id, name: `${item.name} (${restaurant.name})`,
      emoji: item.emoji, mealType: mealCtx.mealType,
      quantity: 100, calories: item.calories, protein: item.protein, carbs: item.carbs, fat: item.fat,
    });
    setLogged(s => new Set([...s, item.id]));
    showToast(`${item.name} — ${item.calories} kcal`);
    track(Events.MEAL_LOGGED, { source: 'eat_menu', item_id: item.id, restaurant_id: restaurant.id, calories: item.calories, protein: item.protein, meal_type: mealCtx.mealType });
    setTimeout(() => setLogged(s => { const n = new Set(s); n.delete(item.id); return n; }), 2000);
  }, [store, mealCtx.mealType, showToast]);

  const logRecipe = useCallback((recipe: SGRecipe) => {
    const m = recipe.macrosPerServing;
    store.addFoodEntry({
      foodItemId: recipe.id, name: `${recipe.name} (1 serving)`,
      emoji: recipe.emoji, mealType: mealCtx.mealType,
      quantity: 100, calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat,
    });
    setRecipeLogged(s => new Set([...s, recipe.id]));
    showToast(`${recipe.name} — ${m.calories} kcal`);
    track(Events.MEAL_LOGGED, { source: 'eat_recipe', item_id: recipe.id, calories: m.calories, protein: m.protein, meal_type: mealCtx.mealType });
    setTimeout(() => setRecipeLogged(s => { const n = new Set(s); n.delete(recipe.id); return n; }), 2000);
  }, [store, mealCtx.mealType, showToast]);

  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
    fontSize: 12, fontWeight: 700, cursor: 'pointer',
    background: active ? 'rgba(30,127,92,0.12)' : 'transparent',
    color: active ? GREEN : FG3, transition: 'all .2s',
  });

  /* ── Render ── */
  return (
    <div style={{ background: BG, minHeight: '100vh' }}>

      {/* Compact header */}
      <div style={{ padding: '52px 20px 10px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <h1 style={{ color: FG1, fontSize: 22, fontWeight: 800, margin: '0 0 4px', lineHeight: 1 }}>What to Eat 🍜</h1>
          <div style={{ fontSize: 11, color: FG3, lineHeight: 1.4 }}>
            {mealCtx.emoji} {mealCtx.label} · <span style={{ color: FG2, fontWeight: 700 }}>{remaining} kcal left</span>
            {remProtein > 0 ? <> · <span style={{ color: '#2E6FB8', fontWeight: 700 }}>P{remProtein}g needed</span></> : null}
          </div>
        </div>
        {userFlags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0, maxWidth: 130 }}>
            {userFlags.slice(0, 2).map(f => (
              <span key={f} style={{ fontSize: 9, fontWeight: 700, padding: '3px 7px', background: 'rgba(30,127,92,0.07)', border: `1px solid rgba(30,127,92,0.15)`, borderRadius: 999, color: GREEN, whiteSpace: 'nowrap' as const }}>
                {DIET_LABEL[f]}
              </span>
            ))}
          </div>
        )}
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

        {/* Sort + filter — always visible on food tab */}
        {tab === 'food' && (
          <>
            <SortDropdown active={sortBy} onChange={setSortBy} showDistance={locState === 'done'} />
            <FilterBar
              filterMode={filterMode}       setFilterMode={setFilterMode}
              filterOpenNow={filterOpenNow} setFilterOpenNow={setFilterOpenNow}
              filter500m={filterMaxDist === 0.5}
              setFilter500m={v => setFilterMaxDist(v ? 0.5 : 1)}
              filterMinProtein={filterMinProtein}   setFilterMinProtein={setFilterMinProtein}
              filterMaxCalories={filterMaxCalories} setFilterMaxCalories={setFilterMaxCalories}
            />
          </>
        )}


        {/* ══ EAT OUT TAB ══ */}
        {tab === 'food' && (
          <>
            {/* ── SEARCH MODE — always flat item list ── */}
            {query && searchResults?.type === 'food' && (() => {
              // Build distKm lookup: restaurantId → nearest distKm from GPS results
              const distLookup = new Map<string, number>();
              for (const ep of enrichedPlaces) {
                if (ep.dbMatch && ep.distKm != null) {
                  const existing = distLookup.get(ep.dbMatch.id);
                  if (existing === undefined || ep.distKm < existing) distLookup.set(ep.dbMatch.id, ep.distKm);
                }
              }
              // Flatten: restaurant search → all menu items from matched restaurants
              //          dish search → matched items directly
              const flat: { restaurant: SGRestaurant; item: SGMenuItem; distKm?: number }[] = isRestaurantSearch
                ? searchResults.restaurants.flatMap(r => r.menu.map(item => ({ restaurant: r, item, distKm: distLookup.get(r.id) })))
                : searchResults.items.map(({ restaurant, item }) => ({ restaurant, item, distKm: distLookup.get(restaurant.id) }));

              const sorted = [...flat].sort((a, b) => macroMatchScore(b.item, macroRem) - macroMatchScore(a.item, macroRem));

              if (sorted.length === 0) {
                return query.trim().length > 0 ? (
                  <div style={{ background: CARD, borderRadius: 18, border: `1px solid ${BORDER}`, padding: '28px 20px', textAlign: 'center', boxShadow: SHADOW }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: FG2, marginBottom: 8 }}>Not in our database yet</div>
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(query)}+Singapore`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-block', background: 'rgba(46,111,184,0.08)', color: '#2E6FB8', borderRadius: 12, padding: '10px 16px', fontSize: 13, fontWeight: 700, textDecoration: 'none', marginBottom: 8 }}
                    >
                      📍 Search on Google Maps →
                    </a>
                    <div style={{ fontSize: 11, color: FG3 }}>Opens Google Maps for nearby options</div>
                  </div>
                ) : null;
              }

              return (
                <>
                  <div style={{ fontSize: 11, color: FG3, marginBottom: 8 }}>
                    {sorted.length} item{sorted.length !== 1 ? 's' : ''} found
                  </div>
                  <div style={{ background: CARD, borderRadius: 18, border: `1px solid ${BORDER}`, overflow: 'hidden', boxShadow: SHADOW }}>
                    {sorted.map(({ restaurant, item, distKm }) => (
                      <MenuItemCard
                        key={`${restaurant.id}-${item.id}`}
                        item={item} restaurant={restaurant} distKm={distKm}
                        userFlags={userFlags}
                        onLog={logMenuItem} logged={logged.has(item.id)}
                        isExpanded={expandedId === item.id}
                        onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      />
                    ))}
                  </div>
                </>
              );
            })()}

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
                  <div style={{ background: 'rgba(208,78,54,0.06)', border: '1px solid rgba(208,78,54,0.18)', borderRadius: 14, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ flexShrink: 0 }}>⚠️</span>
                    <span style={{ fontSize: 12, color: '#D04E36', flex: 1 }}>{locError}</span>
                    <button onClick={requestLocation} style={{ flexShrink: 0, background: 'rgba(208,78,54,0.12)', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#D04E36', cursor: 'pointer' }}>Retry</button>
                    <button onClick={() => setLocState('no_key')} style={{ flexShrink: 0, background: 'transparent', border: 'none', fontSize: 16, color: '#D04E36', cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}>×</button>
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
                {locState === 'done' && enrichedPlaces.length > 0 && (
                  <div style={{ fontSize: 11, color: FG3, marginBottom: 8 }}>
                    {enrichedPlaces.length} places found within {filterMaxDist ?? 1}km{anyFilterActive ? ` · ${nearbyGroups.length} shown` : ''}
                  </div>
                )}

                {/* ── Empty state when nothing at all ── */}
                {pooledItems.length === 0 && tier3Places.length === 0 && (locState === 'done' || locState === 'error' || locState === 'no_key') && (
                  <EmptyState emoji="🍽️" title="No items match your filters" subtitle="Try adjusting the filters above." />
                )}

                {/* ════ Nearby menu items (flat, sorted) ════ */}
                {nearbyItems.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, color: FG3, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span>📍</span> Nearby · <span style={{ color: GREEN, fontWeight: 700 }}>{nearbyGroups.length} place{nearbyGroups.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ background: CARD, borderRadius: 18, border: `1px solid ${BORDER}`, overflow: 'hidden', boxShadow: SHADOW, marginBottom: 14 }}>
                      {visibleNearby.map(p => (
                        <MenuItemCard
                          key={`${p.restaurant.id}-${p.item.id}`}
                          item={p.item} restaurant={p.restaurant} distKm={p.distKm}
                          userFlags={userFlags}
                          onLog={logMenuItem} logged={logged.has(p.item.id)}
                          isExpanded={expandedId === p.item.id}
                          onToggle={() => setExpandedId(expandedId === p.item.id ? null : p.item.id)}
                        />
                      ))}
                      {hasMoreNearby && (
                        <button onClick={() => setShowMoreNearby(true)} style={{
                          width: '100%', padding: '11px 0', background: 'rgba(15,27,45,0.02)',
                          border: 'none', borderTop: `1px solid ${BORDER}`,
                          fontSize: 11, fontWeight: 700, color: FG3, cursor: 'pointer',
                        }}>
                          ▼ {nearbyItems.length - ITEM_INITIAL} more items
                        </button>
                      )}
                    </div>
                  </>
                )}

                {/* ════ More from our database (flat, sorted) ════ */}
                {dbItems.length > 0 && (
                  <>
                    {nearbyItems.length > 0 && <div style={{ height: 4 }} />}
                    <div style={{ background: CARD, borderRadius: 18, border: `1px solid ${BORDER}`, overflow: 'hidden', boxShadow: SHADOW, marginBottom: 14 }}>
                      {visibleDb.map(p => (
                        <MenuItemCard
                          key={`${p.restaurant.id}-${p.item.id}`}
                          item={p.item} restaurant={p.restaurant}
                          userFlags={userFlags}
                          onLog={logMenuItem} logged={logged.has(p.item.id)}
                          isExpanded={expandedId === p.item.id}
                          onToggle={() => setExpandedId(expandedId === p.item.id ? null : p.item.id)}
                        />
                      ))}
                      {hasMoreDb && (
                        <button onClick={() => setShowMoreDb(true)} style={{
                          width: '100%', padding: '11px 0', background: 'rgba(15,27,45,0.02)',
                          border: 'none', borderTop: `1px solid ${BORDER}`,
                          fontSize: 11, fontWeight: 700, color: FG3, cursor: 'pointer',
                        }}>
                          ▼ {dbItems.length - ITEM_INITIAL} more options
                        </button>
                      )}
                    </div>
                  </>
                )}

                {/* ════ CARD 3: GPS-only places with no DB match ════ */}
                {locState === 'done' && tier3Places.length > 0 && (
                  <div style={{ background: CARD, borderRadius: 20, border: `1px solid ${BORDER}`, marginBottom: 14, overflow: 'hidden', boxShadow: SHADOW }}>
                    {/* Section header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, background: 'rgba(139,149,167,0.04)' }}>
                      <span style={{ fontSize: 14 }}>🗺️</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: FG3 }}>Other Nearby Places</span>
                        <span style={{ fontSize: 10, color: FG3, marginLeft: 6 }}>No menu data yet · help us expand</span>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: FG3, background: BORDER, borderRadius: 999, padding: '2px 8px' }}>
                        {tier3Places.length}
                      </span>
                    </div>
                    {/* Restaurant rows */}
                    <div>
                      {tier3Places.map((place, idx) => (
                        <div key={place.id} style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                          borderBottom: idx < tier3Places.length - 1 ? `1px solid ${BORDER}` : 'none',
                        }}>
                          {/* Icon */}
                          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(139,149,167,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                            {place.emoji}
                          </div>
                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 13, fontWeight: 800, color: FG1 }}>{place.name}</span>
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 5, background: 'rgba(139,149,167,0.10)', border: `1px solid ${BORDER}`, color: FG3 }}>No data</span>
                            </div>
                            <div style={{ fontSize: 11, color: FG3, marginBottom: 5 }}>
                              {place.type} · {place.distance}{place.rating ? ` · ⭐ ${place.rating.toFixed(1)}` : ''} · {place.hours}
                            </div>
                            <a
                              href={`mailto:hello@strideapp.sg?subject=Menu data for ${encodeURIComponent(place.name)}&body=Hi, I'd like to submit nutrition data for ${encodeURIComponent(place.name)}.`}
                              style={{ fontSize: 11, color: '#2E6FB8', fontWeight: 600, textDecoration: 'none' }}
                            >
                              📋 Help add {place.name}&apos;s menu →
                            </a>
                          </div>
                          {/* Map link */}
                          <a href={place.mapsUrl} target="_blank" rel="noopener noreferrer"
                            style={{ flexShrink: 0, background: 'rgba(46,111,184,0.07)', color: '#2E6FB8', borderRadius: 9, padding: '7px 11px', fontSize: 11, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(46,111,184,0.16)' }}>
                            Map →
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
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

      <LogToast message={toastMsg} />

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
