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
import type { DietaryFlag } from '@/types';

/* ── Design tokens ── */
const BG     = '#F7F8FB';
const CARD   = '#FFFFFF';
const BORDER = '#E5E9F2';
const FG1    = '#0F1B2D';
const FG2    = '#5B6576';
const FG3    = '#8B95A7';
const GREEN  = '#1E7F5C';
const BLUE   = '#2E6FB8';
const AMBER  = '#C98A2E';
const RED    = '#D04E36';
const SHADOW = '0 1px 2px rgba(15,27,45,0.04), 0 2px 6px rgba(15,27,45,0.05)';

/* ── Types ── */
interface NearbyPlace {
  id: string; name: string; type: string; distance: string; distKm?: number;
  rating: number | null; priceLevel: string | null;
  hours: string; emoji: string; mapsUrl: string;
}
interface EnrichedPlace extends NearbyPlace {
  dbMatch: SGRestaurant | null;
  tier: RestaurantTier;
}

type MealType     = 'breakfast' | 'lunch' | 'snack' | 'dinner';
type SortKey      = 'best_match' | 'protein_dollar' | 'price' | 'distance' | 'calories';
type DietFit      = 'great' | 'check' | 'warn' | 'neutral';
type ViewType     = 'meals' | 'restaurants' | 'recipes';
type DiningOption = 'all' | 'dine_in' | 'grab_go' | 'delivery';
type PriceFilter  = 'all' | '$' | '$$' | '$$$';
type DistFilter   = 0 | 0.5 | 1 | 2 | 5;

interface PooledItem {
  item: SGMenuItem; restaurant: SGRestaurant;
  distKm?: number; tier: RestaurantTier;
}

const DIET_LABEL: Record<DietaryFlag, string> = {
  vegetarian: '🥦 Vegetarian', vegan: '🌱 Vegan',
  gluten_free: '🌾 Gluten-Free', lactose_free: '🥛 Lactose-Free',
  keto: '🥑 Keto', halal: '☪️ Halal', kosher: '✡️ Kosher',
  dairy_free: '🧀 Dairy-Free', nut_free: '🥜 Nut-Free',
  low_carb: '🍞 Low-Carb', high_protein: '💪 High-Protein',
  pescatarian: '🐟 Pescatarian', no_pork: '🐷 No Pork',
};

/* ── Meal time context ── */
function getMealContext(): { label: string; mealType: MealType } {
  const h = new Date().getHours();
  if (h >= 6  && h < 11) return { label: 'Breakfast',  mealType: 'breakfast' };
  if (h >= 11 && h < 15) return { label: 'Lunch',      mealType: 'lunch'     };
  if (h >= 15 && h < 18) return { label: 'Snack',      mealType: 'snack'     };
  return                         { label: 'Dinner',     mealType: 'dinner'    };
}

/* ═══════════════════════════ Sub-components ══════════════════════════════ */

function getDietFit(compatibleWith: DietaryFlag[], userFlags: DietaryFlag[]): DietFit {
  if (!userFlags.length) return 'neutral';
  if (userFlags.every(f => compatibleWith.includes(f))) return 'great';
  if (userFlags.some(f => compatibleWith.includes(f)))  return 'check';
  return 'warn';
}

function DietBadge({ fit }: { fit: DietFit }) {
  if (fit === 'neutral') return null;
  const cfg = {
    great: { bg: 'rgba(30,127,92,0.08)',  border: 'rgba(30,127,92,0.22)',  color: GREEN, label: '✓ Fits your diet'         },
    check: { bg: 'rgba(242,169,59,0.08)', border: 'rgba(242,169,59,0.22)', color: AMBER, label: '⚠ Check before ordering'  },
    warn:  { bg: 'rgba(208,78,54,0.07)',  border: 'rgba(208,78,54,0.18)',  color: RED,   label: '✕ May not suit your diet' },
  }[fit];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function PpdBadge({ protein, price }: { protein: number; price?: number | null }) {
  if (!price) return null;
  const v = proteinPerDollar(protein, price);
  if (!v) return null;
  const c = ppdColor(v);
  return (
    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6, background: `${c}14`, border: `1px solid ${c}30`, color: c }}>
      {v}g/$
    </span>
  );
}

/* ── Toast ── */
function LogToast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
      background: FG1, color: '#fff', borderRadius: 24, padding: '10px 20px',
      fontSize: 14, fontWeight: 600, zIndex: 200, whiteSpace: 'nowrap',
      boxShadow: '0 4px 20px rgba(0,0,0,0.22)',
      animation: 'fadeInUp .25s ease',
    }}>
      {message}
    </div>
  );
}

/* ── MenuItemCard — expandable ── */
function MenuItemCard({
  item, restaurant, distKm, userFlags, onLog, logged, isExpanded, onToggle,
}: {
  item: SGMenuItem; restaurant: SGRestaurant; distKm?: number;
  userFlags: DietaryFlag[]; onLog: () => void; logged: boolean;
  isExpanded: boolean; onToggle: () => void;
}) {
  const ppd     = item.price ? proteinPerDollar(item.protein, item.price) : 0;
  const ppdC    = ppdColor(ppd);
  const dietFit = getDietFit(item.compatibleWith ?? [], userFlags);

  const grabUrl  = `https://food.grab.com/sg/en/search?query=${encodeURIComponent(restaurant.name)}`;
  const pandaUrl = `https://www.foodpanda.sg/search?q=${encodeURIComponent(restaurant.name)}`;
  const mapsUrl  = `https://www.google.com/maps/search/${encodeURIComponent(restaurant.name + ' Singapore')}`;

  return (
    <div style={{
      background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`,
      marginBottom: 10, boxShadow: SHADOW, overflow: 'hidden',
    }}>
      {/* Main row */}
      <div
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', cursor: 'pointer' }}
      >
        <div style={{
          width: 46, height: 46, borderRadius: 12, background: '#F0F4F8',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0,
        }}>
          {item.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: FG1, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
            {item.isPopular && <span style={{ fontSize: 10, flexShrink: 0 }}>⭐</span>}
          </div>
          <div style={{ fontSize: 12, color: FG2, marginBottom: 4 }}>{restaurant.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {item.price != null && (
              <span style={{ fontSize: 13, fontWeight: 700, color: FG1 }}>${item.price.toFixed(2)}</span>
            )}
            <span style={{ fontSize: 11, color: FG3 }}>{item.calories} cal</span>
            {distKm !== undefined && (
              <span style={{ fontSize: 11, color: FG3 }}>📍 {distKm < 1 ? `${(distKm * 1000).toFixed(0)}m` : `${distKm.toFixed(1)}km`}</span>
            )}
            {item.price && ppd > 0 && <PpdBadge protein={item.protein} price={item.price} />}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); onLog(); }}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              border: `1.5px solid ${logged ? 'rgba(30,127,92,0.35)' : BORDER}`,
              background: logged ? 'rgba(30,127,92,0.12)' : CARD,
              color: logged ? GREEN : FG2, fontSize: 18, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s', padding: 0,
            }}
          >
            {logged ? '✓' : '+'}
          </button>
          <span style={{ fontSize: 9, color: FG3, transform: `rotate(${isExpanded ? 180 : 0}deg)`, transition: 'transform .2s', display: 'inline-block' }}>▼</span>
        </div>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div style={{ borderTop: `1px solid ${BORDER}`, padding: '14px 14px 0' }}>
          {/* Macro grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'Protein', val: `${item.protein}g`, color: BLUE },
              { label: 'Carbs',   val: `${item.carbs}g`,   color: AMBER },
              { label: 'Fat',     val: `${item.fat}g`,     color: GREEN },
              { label: 'Calories',val: `${item.calories}`, color: FG2  },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center', background: BG, borderRadius: 10, padding: '8px 4px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: m.color }}>{m.val}</div>
                <div style={{ fontSize: 10, color: FG3, marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>
          {/* Diet badge */}
          <div style={{ marginBottom: 12 }}>
            <DietBadge fit={dietFit} />
          </div>
          {/* Action links */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
            <a href={grabUrl} target="_blank" rel="noreferrer" onClick={() => track(Events.EAT_ORDER_LINK_TAPPED, { platform: 'grab', item: item.id })} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              padding: '9px 6px', borderRadius: 10, border: `1px solid ${BORDER}`,
              background: BG, textDecoration: 'none', fontSize: 11, fontWeight: 700, color: GREEN,
            }}>
              🛵 Grab
            </a>
            <a href={pandaUrl} target="_blank" rel="noreferrer" onClick={() => track(Events.EAT_ORDER_LINK_TAPPED, { platform: 'foodpanda', item: item.id })} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              padding: '9px 6px', borderRadius: 10, border: `1px solid ${BORDER}`,
              background: BG, textDecoration: 'none', fontSize: 11, fontWeight: 700, color: RED,
            }}>
              🐼 Panda
            </a>
            <a href={mapsUrl} target="_blank" rel="noreferrer" onClick={() => track(Events.EAT_MAP_LINK_TAPPED, { item: item.id })} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              padding: '9px 6px', borderRadius: 10, border: `1px solid ${BORDER}`,
              background: BG, textDecoration: 'none', fontSize: 11, fontWeight: 700, color: BLUE,
            }}>
              🗺️ Maps
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Restaurant browse card ── */
function RestaurantBrowseCard({
  restaurant, distKm, onSelect,
}: {
  restaurant: SGRestaurant; distKm?: number; onSelect: () => void;
}) {
  const popularItem  = restaurant.menu.find(m => m.isPopular) ?? restaurant.menu[0];
  const itemCount    = restaurant.menu.length;
  const serviceIcons: Record<ServiceType, string> = { dine_in: '🍽️', grab_go: '🥡', delivery: '🛵' };

  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
        borderBottom: `1px solid ${BORDER}`, cursor: 'pointer',
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 14, background: '#F0F4F8',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0,
      }}>
        {restaurant.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: FG1, marginBottom: 2 }}>{restaurant.name}</div>
        <div style={{ fontSize: 12, color: FG2, marginBottom: 5 }}>
          {restaurant.cuisine}
          {restaurant.priceRange ? ` · ${restaurant.priceRange}` : ''}
          {distKm !== undefined ? ` · ${distKm < 1 ? `${(distKm * 1000).toFixed(0)}m` : `${distKm.toFixed(1)}km`}` : ''}
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {restaurant.dietTags?.slice(0, 3).map(t => (
            <span key={t} style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: 'rgba(30,127,92,0.07)', color: GREEN }}>
              {t}
            </span>
          ))}
          {(restaurant.serviceTypes ?? []).map(s => (
            <span key={s} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(139,149,167,0.08)', color: FG3, border: `1px solid ${BORDER}` }}>
              {serviceIcons[s]}
            </span>
          ))}
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: GREEN }}>{itemCount}</div>
        <div style={{ fontSize: 10, color: FG3 }}>items</div>
      </div>
    </div>
  );
}

/* ── Recipe card ── */
function RecipeCard({
  recipe, onLog, logged, isExpanded, onToggle,
}: {
  recipe: SGRecipe; onLog: () => void; logged: boolean; isExpanded: boolean; onToggle: () => void;
}) {
  const resolved  = resolveIngredients(recipe);
  const rawCost   = calcCostPerServing(recipe);
  const cost      = rawCost ?? 0;
  const hasCost   = cost > 0;
  const ppd       = hasCost ? proteinPerDollar(recipe.protein, cost) : 0;
  const ppdC      = ppdColor(ppd);

  return (
    <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, marginBottom: 10, boxShadow: SHADOW, overflow: 'hidden' }}>
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', cursor: 'pointer' }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: '#F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
          {recipe.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: FG1, marginBottom: 2 }}>{recipe.name}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {hasCost && <span style={{ fontSize: 13, fontWeight: 700, color: FG1 }}>${cost.toFixed(2)}</span>}
            <span style={{ fontSize: 11, color: FG3 }}>{recipe.calories} cal</span>
            <span style={{ fontSize: 11, color: FG3 }}>{recipe.prepTime} · {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}</span>
            {hasCost && ppd > 0 && <PpdBadge protein={recipe.protein} price={cost} />}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); onLog(); }}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              border: `1.5px solid ${logged ? 'rgba(30,127,92,0.35)' : BORDER}`,
              background: logged ? 'rgba(30,127,92,0.12)' : CARD,
              color: logged ? GREEN : FG2, fontSize: 18, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            }}
          >
            {logged ? '✓' : '+'}
          </button>
          <span style={{ fontSize: 9, color: FG3, transform: `rotate(${isExpanded ? 180 : 0}deg)`, transition: 'transform .2s', display: 'inline-block' }}>▼</span>
        </div>
      </div>
      {isExpanded && (
        <div style={{ borderTop: `1px solid ${BORDER}`, padding: '12px 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'Protein', val: `${recipe.protein}g`, color: BLUE },
              { label: 'Carbs',   val: `${recipe.carbs}g`,   color: AMBER },
              { label: 'Fat',     val: `${recipe.fat}g`,     color: GREEN },
              { label: 'Fibre',   val: recipe.fibre ? `${recipe.fibre}g` : '—', color: FG2 },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center', background: BG, borderRadius: 10, padding: '8px 4px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: m.color }}>{m.val}</div>
                <div style={{ fontSize: 10, color: FG3, marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>
          {resolved.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: FG2, marginBottom: 6 }}>Ingredients</div>
              {resolved.map(ri => (
                <div key={ri.ingredient.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${BORDER}`, fontSize: 12 }}>
                  <span style={{ color: FG1 }}>{ri.ingredient.name}</span>
                  <span style={{ color: FG3 }}>{ri.qtyG}g{ri.ingredient.price ? ` · $${(ri.ingredient.price * ri.qtyG / 100).toFixed(2)}` : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Filter bottom sheet ── */
function FilterSheet({
  open, onClose,
  diningOption, setDiningOption,
  priceFilter, setPriceFilter,
  dietFlags, setDietFlags,
  filterMinProtein, setFilterMinProtein,
  filterMaxCalories, setFilterMaxCalories,
  distFilter, setDistFilter,
  sortKey, setSortKey,
  showDistance,
  onClear,
}: {
  open: boolean; onClose: () => void;
  diningOption: DiningOption; setDiningOption: (v: DiningOption) => void;
  priceFilter: PriceFilter; setPriceFilter: (v: PriceFilter) => void;
  dietFlags: DietaryFlag[]; setDietFlags: (v: DietaryFlag[]) => void;
  filterMinProtein: number; setFilterMinProtein: (v: number) => void;
  filterMaxCalories: number; setFilterMaxCalories: (v: number) => void;
  distFilter: DistFilter; setDistFilter: (v: DistFilter) => void;
  sortKey: SortKey; setSortKey: (v: SortKey) => void;
  showDistance: boolean;
  onClear: () => void;
}) {
  if (!open) return null;
  const toggleDiet = (flag: DietaryFlag) =>
    setDietFlags(dietFlags.includes(flag) ? dietFlags.filter(f => f !== flag) : [...dietFlags, flag]);

  const chip = (active: boolean, accent = GREEN) => ({
    padding: '8px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600,
    border: `1.5px solid ${active ? accent : BORDER}`,
    background: active ? `${accent}14` : CARD,
    color: active ? accent : FG2,
    outline: 'none', WebkitTapHighlightColor: 'transparent',
  } as React.CSSProperties);

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 13, fontWeight: 700, color: FG2, marginBottom: 10, marginTop: 4 }}>{children}</div>
  );

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.35)' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: CARD, borderRadius: '22px 22px 0 0',
          padding: '8px 0 max(32px, env(safe-area-inset-bottom)) 0',
          maxHeight: '88vh', overflowY: 'auto',
        }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: '#DDE0E8', borderRadius: 2, margin: '0 auto 20px' }} />

        <div style={{ padding: '0 20px' }}>
          {/* Sort */}
          <SectionLabel>Sort by</SectionLabel>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {[
              { key: 'best_match'     as SortKey, label: '🎯 Best Match'      },
              { key: 'protein_dollar' as SortKey, label: '💪 Protein per $'   },
              { key: 'price'          as SortKey, label: '💰 Price: Low→High' },
              { key: 'calories'       as SortKey, label: '🔥 Lowest Calories' },
              ...(showDistance ? [{ key: 'distance' as SortKey, label: '📍 Nearest' }] : []),
            ].map(o => (
              <button key={o.key} onClick={() => setSortKey(o.key)} style={chip(sortKey === o.key)}>
                {o.label}
              </button>
            ))}
          </div>

          <div style={{ height: 1, background: BORDER, marginBottom: 20 }} />

          {/* Price */}
          <SectionLabel>Price range</SectionLabel>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {(['all', '$', '$$', '$$$'] as PriceFilter[]).map(p => (
              <button key={p} onClick={() => setPriceFilter(p)} style={chip(priceFilter === p, AMBER)}>
                {p === 'all' ? 'Any' : p}
              </button>
            ))}
          </div>

          <div style={{ height: 1, background: BORDER, marginBottom: 20 }} />

          {/* Dining option */}
          <SectionLabel>Dining option</SectionLabel>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {([
              { val: 'all'     as DiningOption, label: 'All'       },
              { val: 'dine_in' as DiningOption, label: '🍽️ Dine-in'  },
              { val: 'grab_go' as DiningOption, label: '🥡 Takeaway' },
              { val: 'delivery'as DiningOption, label: '🛵 Delivery' },
            ]).map(o => (
              <button key={o.val} onClick={() => setDiningOption(o.val)} style={chip(diningOption === o.val)}>
                {o.label}
              </button>
            ))}
          </div>

          <div style={{ height: 1, background: BORDER, marginBottom: 20 }} />

          {/* Diet type */}
          <SectionLabel>Diet type</SectionLabel>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {(['halal', 'vegetarian', 'vegan', 'gluten_free', 'no_pork', 'high_protein', 'keto', 'low_carb'] as DietaryFlag[]).map(f => (
              <button key={f} onClick={() => toggleDiet(f)} style={chip(dietFlags.includes(f))}>
                {DIET_LABEL[f]}
              </button>
            ))}
          </div>

          <div style={{ height: 1, background: BORDER, marginBottom: 20 }} />

          {/* Macros */}
          <SectionLabel>Macros</SectionLabel>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: FG2 }}>Min Protein</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: filterMinProtein > 0 ? BLUE : FG3 }}>
                {filterMinProtein > 0 ? `≥ ${filterMinProtein}g` : 'Any'}
              </span>
            </div>
            <input type="range" min={0} max={50} step={5} value={filterMinProtein}
              onChange={e => setFilterMinProtein(Number(e.target.value))}
              style={{ width: '100%', accentColor: BLUE, cursor: 'pointer' }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: FG2 }}>Max Calories</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: filterMaxCalories > 0 ? RED : FG3 }}>
                {filterMaxCalories > 0 ? `≤ ${filterMaxCalories} kcal` : 'Any'}
              </span>
            </div>
            <input type="range" min={0} max={1200} step={50} value={filterMaxCalories}
              onChange={e => setFilterMaxCalories(Number(e.target.value))}
              style={{ width: '100%', accentColor: RED, cursor: 'pointer' }}
            />
          </div>

          {showDistance && (
            <>
              <div style={{ height: 1, background: BORDER, marginBottom: 20 }} />
              <SectionLabel>Max distance</SectionLabel>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {([0, 0.5, 1, 2, 5] as DistFilter[]).map(d => (
                  <button key={d} onClick={() => setDistFilter(d)} style={chip(distFilter === d)}>
                    {d === 0 ? 'Any' : d < 1 ? `${d * 1000}m` : `${d}km`}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, paddingBottom: 8 }}>
            <button onClick={onClear} style={{
              flex: 1, padding: '13px', borderRadius: 14, border: `1.5px solid ${BORDER}`,
              background: CARD, color: FG2, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>
              Clear all
            </button>
            <button onClick={onClose} style={{
              flex: 2, padding: '13px', borderRadius: 14,
              background: GREEN, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none',
            }}>
              Show results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════ Main page ════════════════════════════════ */
export default function EatPage() {
  const store    = useStrideStore();
  const mealCtx  = getMealContext();

  // ── URL params on mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    const v = p.get('view');
    if (v === 'restaurants' || v === 'recipes' || v === 'meals') setViewType(v as ViewType);
    const q = p.get('q');
    if (q) setQuery(q);
    const r = p.get('r');
    if (r) { setFilterRestaurantId(r); setViewType('meals'); }
    const sort = p.get('sort');
    if (sort === 'ppd') setSortKey('protein_dollar');
    if (sort === 'protein') { setSortKey('protein_dollar'); }
    const diet = p.get('diet');
    if (diet) setFilterDietFlags([diet as DietaryFlag]);
  }, []);

  // ── Core state ────────────────────────────────────────────────────────────
  const [viewType,           setViewType]           = useState<ViewType>('meals');
  const [query,              setQuery]              = useState('');
  const [expandedId,         setExpandedId]         = useState<string | null>(null);
  const [loggedIds,          setLoggedIds]          = useState<Set<string>>(new Set());
  const [toastMsg,           setToastMsg]           = useState('');
  const [showFilters,        setShowFilters]        = useState(false);
  const [filterRestaurantId, setFilterRestaurantId] = useState<string | null>(null);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [sortKey,            setSortKey]            = useState<SortKey>('best_match');
  const [diningOption,       setDiningOption]       = useState<DiningOption>('all');
  const [priceFilter,        setPriceFilter]        = useState<PriceFilter>('all');
  const [filterDietFlags,    setFilterDietFlags]    = useState<DietaryFlag[]>([]);
  const [filterMinProtein,   setFilterMinProtein]   = useState(0);
  const [filterMaxCalories,  setFilterMaxCalories]  = useState(0);
  const [distFilter,         setDistFilter]         = useState<DistFilter>(0);

  // ── Location state ────────────────────────────────────────────────────────
  const [locState,           setLocState]           = useState<'idle' | 'loading' | 'granted' | 'denied' | 'no_key'>('idle');
  const [userLat,            setUserLat]            = useState<number | null>(null);
  const [userLng,            setUserLng]            = useState<number | null>(null);
  const [nearbyPlaces,       setNearbyPlaces]       = useState<NearbyPlace[]>([]);
  const [enrichedPlaces,     setEnrichedPlaces]     = useState<EnrichedPlace[]>([]);
  const [customLocation,     setCustomLocation]     = useState<string>('');
  const [showLocationInput,  setShowLocationInput]  = useState(false);

  // ── Analytics refs ────────────────────────────────────────────────────────
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const userFlags: DietaryFlag[] = store.profile?.dietaryFlags ?? [];
  const remaining = {
    protein:  (store.profile?.targetProtein ?? 120) - store.todayProtein,
    calories: (store.profile?.targetCalories ?? 2000) - store.todayCalories,
    carbs:    (store.profile?.targetCarbs ?? 200) - store.todayCarbs,
  };

  // ── Location + nearby places ──────────────────────────────────────────────
  const requestLocation = useCallback(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!key) { setLocState('no_key'); return; }
    setLocState('loading');
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLat(lat); setUserLng(lng); setLocState('granted');
        try {
          const res = await fetch(`/api/nearby-places?lat=${lat}&lng=${lng}&mode=restaurant`);
          if (!res.ok) return;
          const data = await res.json();
          setNearbyPlaces(data.results ?? []);
        } catch { /* silent */ }
      },
      () => setLocState('denied'),
      { timeout: 8000, maximumAge: 120_000 },
    );
  }, []);

  useEffect(() => {
    if (locState === 'idle') requestLocation();
    track(Events.EAT_PAGE_VIEWED);
  }, []);

  // ── Enrich GPS places with DB matches ─────────────────────────────────────
  useEffect(() => {
    const enriched: EnrichedPlace[] = nearbyPlaces.map(p => {
      const dbMatch = matchRestaurant(p.name);
      const tier: RestaurantTier = dbMatch ? 1 : 2;
      return { ...p, dbMatch, tier };
    });
    setEnrichedPlaces(enriched);
  }, [nearbyPlaces]);

  // ── Distance lookup map ───────────────────────────────────────────────────
  const distLookup = useMemo(() => {
    const m = new Map<string, number>();
    for (const ep of enrichedPlaces) {
      if (ep.dbMatch && ep.distKm !== undefined) {
        m.set(ep.dbMatch.id, ep.distKm);
      }
    }
    return m;
  }, [enrichedPlaces]);

  const hasLocation = locState === 'granted';

  // ── pooledItems — flat list across all restaurants ────────────────────────
  const pooledItems = useMemo((): PooledItem[] => {
    const seenItemIds = new Set<string>();
    const out: PooledItem[] = [];

    // 1. GPS matches first
    for (const ep of enrichedPlaces) {
      if (!ep.dbMatch) continue;
      const r = ep.dbMatch;
      for (const item of r.menu) {
        if (seenItemIds.has(item.id)) continue;
        seenItemIds.add(item.id);
        out.push({ item, restaurant: r, distKm: ep.distKm, tier: 1 });
      }
    }

    // 2. All remaining DB chains
    for (const r of SG_RESTAURANTS) {
      if (r.tab === 'store') continue;
      const alreadyIn = out.some(p => p.restaurant.id === r.id);
      const distKm    = distLookup.get(r.id);
      for (const item of r.menu) {
        if (seenItemIds.has(item.id)) continue;
        seenItemIds.add(item.id);
        out.push({ item, restaurant: r, distKm, tier: alreadyIn ? 1 : 2 });
      }
    }

    return out;
  }, [enrichedPlaces, distLookup]);

  // ── Apply filters + sort ──────────────────────────────────────────────────
  const filteredItems = useMemo((): PooledItem[] => {
    let filtered = pooledItems;

    // Restaurant filter (from URL param or Restaurants view tap)
    if (filterRestaurantId) filtered = filtered.filter(p => p.restaurant.id === filterRestaurantId);

    // Dining option
    if (diningOption !== 'all') {
      const svcMap: Record<DiningOption, ServiceType> = {
        dine_in: 'dine_in', grab_go: 'grab_go', delivery: 'delivery', all: 'dine_in',
      };
      filtered = filtered.filter(p => (p.restaurant.serviceTypes ?? []).includes(svcMap[diningOption]));
    }

    // Price range
    if (priceFilter !== 'all') {
      filtered = filtered.filter(p => p.restaurant.priceRange === priceFilter);
    }

    // Diet flags (user-selected in filter sheet)
    if (filterDietFlags.length) {
      filtered = filtered.filter(p => filterDietFlags.every(f => (p.item.compatibleWith ?? []).includes(f)));
    }

    // Macro thresholds
    if (filterMinProtein > 0)  filtered = filtered.filter(p => p.item.protein >= filterMinProtein);
    if (filterMaxCalories > 0) filtered = filtered.filter(p => p.item.calories <= filterMaxCalories);

    // Distance filter
    if (distFilter > 0) {
      filtered = filtered.filter(p => p.distKm === undefined || p.distKm <= distFilter);
    }

    // Sort
    if (sortKey === 'protein_dollar') {
      filtered = [...filtered].sort((a, b) =>
        proteinPerDollar(b.item.protein, b.item.price ?? 0) - proteinPerDollar(a.item.protein, a.item.price ?? 0)
      );
    } else if (sortKey === 'price') {
      filtered = [...filtered].sort((a, b) => (a.item.price ?? 999) - (b.item.price ?? 999));
    } else if (sortKey === 'calories') {
      filtered = [...filtered].sort((a, b) => a.item.calories - b.item.calories);
    } else if (sortKey === 'distance') {
      filtered = [...filtered].sort((a, b) => (a.distKm ?? 99) - (b.distKm ?? 99));
    }

    return filtered;
  }, [pooledItems, filterRestaurantId, diningOption, priceFilter, filterDietFlags, filterMinProtein, filterMaxCalories, distFilter, sortKey]);

  // ── Search results ─────────────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    const hits = searchAll(query);
    // Attach distKm from lookup
    return hits.map(h => ({ ...h, distKm: distLookup.get(h.restaurant.id) }));
  }, [query, distLookup]);

  const recipeSearchResults = useMemo(() => {
    if (!query.trim() || viewType !== 'recipes') return null;
    return searchRecipes(query);
  }, [query, viewType]);

  // ── Restaurants for browse ─────────────────────────────────────────────────
  const restaurantList = useMemo(() => {
    let list = SG_RESTAURANTS.filter(r => r.tab !== 'store');

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q) ||
        (r.aliases ?? []).some(a => a.includes(q))
      );
    }

    if (diningOption !== 'all') {
      const svcMap: Record<DiningOption, ServiceType> = {
        dine_in: 'dine_in', grab_go: 'grab_go', delivery: 'delivery', all: 'dine_in',
      };
      list = list.filter(r => (r.serviceTypes ?? []).includes(svcMap[diningOption]));
    }

    if (priceFilter !== 'all') list = list.filter(r => r.priceRange === priceFilter);
    if (filterDietFlags.length) list = list.filter(r =>
      filterDietFlags.some(f => (r.dietTags ?? []).includes(f))
    );

    return list;
  }, [query, diningOption, priceFilter, filterDietFlags]);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2200);
  }, []);

  // ── Log actions ───────────────────────────────────────────────────────────
  const logMenuItem = useCallback((item: SGMenuItem, restaurant: SGRestaurant) => {
    if (loggedIds.has(item.id)) return;
    const entry = {
      name: item.name, emoji: item.emoji,
      mealType: mealCtx.mealType,
      calories: item.calories, protein: item.protein,
      carbs: item.carbs, fat: item.fat,
      quantity: 1, restaurantId: restaurant.id,
    };
    store.addFoodEntry(entry);
    setLoggedIds(prev => new Set([...prev, item.id]));
    showToast(`${item.emoji} ${item.name} logged!`);
    track(Events.MEAL_LOGGED, { source: 'eat_page', itemId: item.id, restaurantId: restaurant.id, calories: item.calories });
  }, [loggedIds, mealCtx.mealType, store, showToast]);

  const logRecipe = useCallback((recipe: SGRecipe) => {
    if (loggedIds.has(recipe.id)) return;
    const entry = {
      name: recipe.name, emoji: recipe.emoji,
      mealType: mealCtx.mealType,
      calories: recipe.calories, protein: recipe.protein,
      carbs: recipe.carbs, fat: recipe.fat, fibre: recipe.fibre,
      quantity: 1,
    };
    store.addFoodEntry(entry);
    setLoggedIds(prev => new Set([...prev, recipe.id]));
    showToast(`${recipe.emoji} ${recipe.name} logged!`);
    track(Events.MEAL_LOGGED, { source: 'eat_page_recipe', recipeId: recipe.id, calories: recipe.calories });
  }, [loggedIds, mealCtx.mealType, store, showToast]);

  // ── Count active filters ──────────────────────────────────────────────────
  const activeFilterCount = [
    diningOption !== 'all',
    priceFilter !== 'all',
    filterDietFlags.length > 0,
    filterMinProtein > 0,
    filterMaxCalories > 0,
    distFilter > 0,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setDiningOption('all');
    setPriceFilter('all');
    setFilterDietFlags([]);
    setFilterMinProtein(0);
    setFilterMaxCalories(0);
    setDistFilter(0);
    setSortKey('best_match');
    setFilterRestaurantId(null);
  };

  // ── Debounced search analytics ─────────────────────────────────────────────
  const handleQueryChange = (v: string) => {
    setQuery(v);
    clearTimeout(searchTimer.current);
    if (v.trim()) {
      searchTimer.current = setTimeout(() => track(Events.EAT_SEARCHED, { query: v }), 800);
    }
  };

  // ── Recipes list ──────────────────────────────────────────────────────────
  const recipeList = recipeSearchResults ?? SG_RECIPES;

  /* ══════════════════════════ Render ═════════════════════════════════════ */
  return (
    <div style={{ minHeight: '100vh', background: BG, paddingBottom: 100 }}>
      <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translate(-50%,12px); } to { opacity: 1; transform: translate(-50%,0); } }`}</style>

      {/* ── Sticky header: search + tabs ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(247,248,251,0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${BORDER}`,
        padding: '48px 16px 0',
      }}>
        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={FG3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/>
            </svg>
          </span>
          <input
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder={viewType === 'restaurants' ? 'Search restaurants…' : viewType === 'recipes' ? 'Search recipes…' : 'Search meals, restaurants, recipes…'}
            style={{
              width: '100%', background: CARD, border: `1px solid ${BORDER}`,
              borderRadius: 16, padding: '13px 40px 13px 44px',
              fontSize: 15, color: FG1, outline: 'none',
              boxSizing: 'border-box', boxShadow: SHADOW,
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: FG3, fontSize: 18, lineHeight: 1, padding: 4,
            }}>✕</button>
          )}
        </div>

        {/* View tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid transparent` }}>
          {([
            { key: 'meals'       as ViewType, label: '🍽️ Meals'       },
            { key: 'restaurants' as ViewType, label: '🏪 Restaurants'  },
            { key: 'recipes'     as ViewType, label: '👨‍🍳 Recipes'     },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => { setViewType(tab.key); if (tab.key !== 'meals') setFilterRestaurantId(null); }}
              style={{
                flex: 1, padding: '10px 4px', border: 'none', background: 'none',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                color: viewType === tab.key ? GREEN : FG3,
                borderBottom: `2.5px solid ${viewType === tab.key ? GREEN : 'transparent'}`,
                transition: 'all .15s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Location + filter bar ── */}
      <div style={{ padding: '12px 16px 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Location indicator */}
        <button
          onClick={() => setShowLocationInput(!showLocationInput)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 12px', borderRadius: 20,
            border: `1px solid ${BORDER}`, background: CARD,
            fontSize: 12, fontWeight: 600,
            color: hasLocation ? GREEN : FG3, cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <span>📍</span>
          <span>{hasLocation ? 'Near you' : customLocation || 'Singapore'}</span>
          <span style={{ fontSize: 10, color: FG3 }}>▾</span>
        </button>

        <div style={{ flex: 1 }} />

        {/* Filters button */}
        <button
          onClick={() => setShowFilters(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 20,
            border: `1.5px solid ${activeFilterCount > 0 ? GREEN : BORDER}`,
            background: activeFilterCount > 0 ? 'rgba(30,127,92,0.08)' : CARD,
            fontSize: 12, fontWeight: 700,
            color: activeFilterCount > 0 ? GREEN : FG2,
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filter & Sort'}
        </button>
      </div>

      {/* Location input */}
      {showLocationInput && (
        <div style={{ padding: '4px 16px 8px' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={customLocation}
              onChange={e => setCustomLocation(e.target.value)}
              placeholder="Enter area (e.g. Orchard, Tampines…)"
              style={{
                flex: 1, padding: '9px 14px', borderRadius: 12,
                border: `1px solid ${BORDER}`, fontSize: 13, color: FG1, outline: 'none',
                background: CARD,
              }}
            />
            <button onClick={() => { setShowLocationInput(false); requestLocation(); }} style={{
              padding: '9px 14px', borderRadius: 12, border: 'none',
              background: GREEN, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>
              Use GPS
            </button>
          </div>
        </div>
      )}

      {/* Active filter tags */}
      {(filterRestaurantId || activeFilterCount > 0) && (
        <div style={{ padding: '4px 16px 8px', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {filterRestaurantId && (() => {
            const r = SG_RESTAURANTS.find(r => r.id === filterRestaurantId);
            return r ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: 'rgba(30,127,92,0.08)', border: `1px solid rgba(30,127,92,0.2)`, fontSize: 11, fontWeight: 600, color: GREEN, flexShrink: 0 }}>
                {r.emoji} {r.name}
                <button onClick={() => setFilterRestaurantId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: GREEN, fontSize: 12, padding: 0 }}>✕</button>
              </span>
            ) : null;
          })()}
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: 'rgba(208,78,54,0.06)', border: `1px solid rgba(208,78,54,0.18)`, fontSize: 11, fontWeight: 700, color: RED, cursor: 'pointer', flexShrink: 0 }}>
              Clear filters ✕
            </button>
          )}
        </div>
      )}

      {/* ── Results ── */}
      <div style={{ padding: '8px 16px 0' }}>

        {/* ── MEALS view ── */}
        {viewType === 'meals' && (() => {
          const items = searchResults
            ? searchResults.map(h => ({ item: h.item as SGMenuItem, restaurant: h.restaurant as SGRestaurant, distKm: (h as any).distKm as number | undefined, tier: 1 as RestaurantTier }))
            : filteredItems;

          if (items.length === 0) return (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: FG3 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: FG2, marginBottom: 8 }}>No meals found</div>
              <div style={{ fontSize: 13 }}>Try adjusting your filters or search terms</div>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} style={{ marginTop: 16, padding: '10px 20px', borderRadius: 20, background: GREEN, color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
                  Clear filters
                </button>
              )}
            </div>
          );

          return (
            <>
              <div style={{ fontSize: 12, color: FG3, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  {searchResults ? `${items.length} results for "${query}"` : `${items.length} meals${hasLocation ? ' near you' : ''}`}
                </span>
                {filterRestaurantId && (
                  <span style={{ color: GREEN, fontSize: 11, fontWeight: 600 }}>
                    from {SG_RESTAURANTS.find(r => r.id === filterRestaurantId)?.name}
                  </span>
                )}
              </div>
              {items.map(({ item, restaurant, distKm }) => (
                <MenuItemCard
                  key={`${restaurant.id}__${item.id}`}
                  item={item} restaurant={restaurant} distKm={distKm}
                  userFlags={userFlags}
                  onLog={() => logMenuItem(item, restaurant)}
                  logged={loggedIds.has(item.id)}
                  isExpanded={expandedId === item.id}
                  onToggle={() => {
                    setExpandedId(expandedId === item.id ? null : item.id);
                    if (expandedId !== item.id) track(Events.EAT_ITEM_EXPANDED, { itemId: item.id });
                  }}
                />
              ))}
            </>
          );
        })()}

        {/* ── RESTAURANTS view ── */}
        {viewType === 'restaurants' && (() => {
          if (restaurantList.length === 0) return (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: FG3 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: FG2, marginBottom: 8 }}>No restaurants found</div>
              <div style={{ fontSize: 13 }}>Try a different search or filter</div>
            </div>
          );
          return (
            <div style={{ background: CARD, borderRadius: 18, border: `1px solid ${BORDER}`, padding: '0 14px', boxShadow: SHADOW }}>
              <div style={{ fontSize: 12, color: FG3, padding: '12px 0 4px' }}>
                {restaurantList.length} restaurant{restaurantList.length !== 1 ? 's' : ''}
                {query ? ` matching "${query}"` : ' in Singapore'}
              </div>
              {restaurantList.map((restaurant, idx) => (
                <RestaurantBrowseCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  distKm={distLookup.get(restaurant.id)}
                  onSelect={() => {
                    setFilterRestaurantId(restaurant.id);
                    setViewType('meals');
                    setQuery('');
                  }}
                />
              ))}
            </div>
          );
        })()}

        {/* ── RECIPES view ── */}
        {viewType === 'recipes' && (() => {
          if (recipeList.length === 0) return (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: FG3 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍🍳</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: FG2, marginBottom: 8 }}>No recipes found</div>
              <div style={{ fontSize: 13 }}>Try a different search term</div>
            </div>
          );
          return (
            <>
              <div style={{ fontSize: 12, color: FG3, marginBottom: 10 }}>
                {recipeList.length} recipe{recipeList.length !== 1 ? 's' : ''}{query ? ` matching "${query}"` : ''}
              </div>
              {recipeList.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onLog={() => logRecipe(recipe)}
                  logged={loggedIds.has(recipe.id)}
                  isExpanded={expandedId === recipe.id}
                  onToggle={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
                />
              ))}
            </>
          );
        })()}

      </div>

      {/* ── Filter bottom sheet ── */}
      <FilterSheet
        open={showFilters} onClose={() => setShowFilters(false)}
        diningOption={diningOption} setDiningOption={setDiningOption}
        priceFilter={priceFilter} setPriceFilter={setPriceFilter}
        dietFlags={filterDietFlags} setDietFlags={setFilterDietFlags}
        filterMinProtein={filterMinProtein} setFilterMinProtein={setFilterMinProtein}
        filterMaxCalories={filterMaxCalories} setFilterMaxCalories={setFilterMaxCalories}
        distFilter={distFilter} setDistFilter={setDistFilter}
        sortKey={sortKey} setSortKey={setSortKey}
        showDistance={hasLocation}
        onClear={clearAllFilters}
      />

      {/* Toast */}
      <LogToast message={toastMsg} />
    </div>
  );
}
