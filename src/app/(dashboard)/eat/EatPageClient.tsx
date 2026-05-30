'use client';
// Opt out of static pre-rendering — this page depends on user location and
// real-time data; attempting a static build causes a Turbopack TDZ crash.

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import loadable from 'next/dynamic';
import { useStrideStore } from '@/lib/store';
import { track, Events } from '@/lib/analytics';
import type { MapPin } from '@/components/MapView';

// Separate component avoids inline-JSX closure issues in the SSR bundle
function MapLoadingPlaceholder() {
  return (
    <div style={{ height: 'calc(100vh - 220px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F2F5', color: '#8B95A7', fontSize: 14 }}>
      Loading map…
    </div>
  );
}

// Load MapView client-side only — Leaflet requires window
const MapView = loadable(() => import('@/components/MapView'), {
  ssr: false,
  loading: MapLoadingPlaceholder,
});
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
const PURPLE = '#7C3AED';
const SHADOW = '0 1px 2px rgba(15,27,45,0.04), 0 2px 6px rgba(15,27,45,0.05)';

/* ── Types ── */
interface NearbyPlace {
  id: string; name: string; type: string; distance: string; distKm?: number;
  lat?: number; lng?: number;
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

// Pending log — holds item/recipe while confirm sheet is open
interface PendingLog {
  type: 'item' | 'recipe';
  item?: SGMenuItem;
  recipe?: SGRecipe;
  restaurant?: SGRestaurant;
}

const DIET_LABEL: Record<DietaryFlag, string> = {
  halal:       'Halal',        vegetarian:  'Vegetarian',
  vegan:       'Vegan',        gluten_free: 'Gluten-Free',
  lactose_free:'Lactose-Free', keto:        'Keto',
  kosher:      'Kosher',       dairy_free:  'Dairy-Free',
  nut_free:    'Nut-Free',     low_carb:    'Low-Carb',
  high_protein:'High Protein', pescatarian: 'Pescatarian',
  no_pork:     'No Pork',
};

// ── Initial avatar — consistent across all cards ───────────────────────────
const AVATAR_HUES = [215, 160, 280, 30, 190, 340, 120, 260, 80, 320];
function Initial({ name, size = 46, radius = 12 }: { name: string; size?: number; radius?: number }) {
  const hue = AVATAR_HUES[name.charCodeAt(0) % AVATAR_HUES.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: `hsl(${hue},28%,92%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.4), fontWeight: 700,
      color: `hsl(${hue},35%,42%)`,
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function getMealContext(): { label: string; mealType: MealType } {
  const h = new Date().getHours();
  if (h >= 6  && h < 11) return { label: 'Breakfast', mealType: 'breakfast' };
  if (h >= 11 && h < 15) return { label: 'Lunch',     mealType: 'lunch'     };
  if (h >= 15 && h < 18) return { label: 'Snack',     mealType: 'snack'     };
  return                         { label: 'Dinner',    mealType: 'dinner'    };
}

function todayStr() { return new Date().toISOString().slice(0, 10); }
function nowTimeStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
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
    great: { bg: 'rgba(30,127,92,0.08)',  border: 'rgba(30,127,92,0.22)',  color: GREEN, label: 'Fits your diet'         },
    check: { bg: 'rgba(242,169,59,0.08)', border: 'rgba(242,169,59,0.22)', color: AMBER, label: 'Check ingredients'      },
    warn:  { bg: 'rgba(208,78,54,0.07)',  border: 'rgba(208,78,54,0.18)',  color: RED,   label: 'May not suit your diet' },
  }[fit];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

// ── #2 Confidence badge — 3 tiers, dot + text ─────────────────────────────
function ConfidenceBadge({ source, verified, confidence }: {
  source?: string; verified?: boolean; confidence?: string;
}) {
  if (!source && !confidence) return null;

  if (source === 'official_sg' && verified) {
    return (
      <span title="Sourced from the brand's official SG nutrition data" style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
        background: 'rgba(30,127,92,0.07)', border: '1px solid rgba(30,127,92,0.18)', color: GREEN,
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: GREEN, flexShrink: 0 }} />
        Stride Approved
      </span>
    );
  }
  if (source === 'community' || confidence === 'community') {
    return (
      <span title="User-submitted data, not independently verified" style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
        background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)', color: PURPLE,
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: PURPLE, flexShrink: 0 }} />
        Community
      </span>
    );
  }
  return (
    <span title="Derived from reference data, may vary slightly" style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
      background: 'rgba(139,149,167,0.08)', border: `1px solid ${BORDER}`, color: FG3,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: FG3, flexShrink: 0 }} />
      Estimated
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

// ── #7 Set meal chip ───────────────────────────────────────────────────────
function SetMealChip({ includes }: { includes?: string[] }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
      background: 'rgba(201,138,46,0.08)', border: '1px solid rgba(201,138,46,0.22)', color: AMBER,
    }}>
      Set available{includes?.length ? ` — ${includes.slice(0,2).join(', ')}${includes.length > 2 ? '…' : ''}` : ''}
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
      boxShadow: '0 4px 20px rgba(0,0,0,0.22)', animation: 'fadeInUp .25s ease',
    }}>
      {message}
    </div>
  );
}

// ── #9 Log confirm sheet ───────────────────────────────────────────────────
function LogConfirmSheet({
  pending, onConfirm, onCancel,
}: {
  pending: PendingLog;
  onConfirm: (mealType: MealType, date: string, time: string) => void;
  onCancel: () => void;
}) {
  const ctx = getMealContext();
  const [mealType, setMealType] = useState<MealType>(ctx.mealType);
  const [date, setDate]         = useState(todayStr());
  const [time, setTime]         = useState(nowTimeStr());

  const name    = pending.item?.name ?? pending.recipe?.name ?? '';
  const emoji   = pending.item?.emoji ?? pending.recipe?.emoji ?? '🍽️';
  const cal     = pending.item?.calories ?? pending.recipe?.calories ?? 0;
  const protein = pending.item?.protein  ?? pending.recipe?.protein  ?? 0;
  const price   = pending.item?.price;

  const mealTypes: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
  const mealEmoji: Record<MealType, string> = { breakfast: '🌅', lunch: '☀️', snack: '🍵', dinner: '🌙' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.4)' }} onClick={onCancel}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: CARD, borderRadius: '22px 22px 0 0',
          padding: '8px 0 max(36px, env(safe-area-inset-bottom)) 0',
        }}
      >
        <div style={{ width: 36, height: 4, background: '#DDE0E8', borderRadius: 2, margin: '0 auto 20px' }} />
        <div style={{ padding: '0 20px' }}>
          {/* Item summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 0 16px', borderBottom: `1px solid ${BORDER}`, marginBottom: 18 }}>
            <span style={{ fontSize: 36 }}>{emoji}</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: FG1 }}>{name}</div>
              <div style={{ fontSize: 12, color: FG3, marginTop: 2 }}>
                {cal} cal · {protein}g protein{price ? ` · $${price.toFixed(2)}` : ''}
              </div>
            </div>
          </div>

          {/* Meal type */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: FG2, marginBottom: 10 }}>Meal type</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {mealTypes.map(m => (
                <button key={m} onClick={() => setMealType(m)} style={{
                  flex: 1, padding: '8px 4px', borderRadius: 12, cursor: 'pointer',
                  border: `1.5px solid ${mealType === m ? GREEN : BORDER}`,
                  background: mealType === m ? 'rgba(30,127,92,0.08)' : CARD,
                  color: mealType === m ? GREEN : FG2,
                  fontSize: 11, fontWeight: 700, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 16, marginBottom: 2 }}>{mealEmoji[m]}</div>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Date + time */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: FG2, marginBottom: 8 }}>Date</div>
              <input
                type="date" value={date} onChange={e => setDate(e.target.value)}
                style={{
                  width: '100%', padding: '11px 12px', borderRadius: 12, border: `1px solid ${BORDER}`,
                  fontSize: 13, color: FG1, background: BG, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: FG2, marginBottom: 8 }}>Time</div>
              <input
                type="time" value={time} onChange={e => setTime(e.target.value)}
                style={{
                  width: '100%', padding: '11px 12px', borderRadius: 12, border: `1px solid ${BORDER}`,
                  fontSize: 13, color: FG1, background: BG, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onCancel} style={{
              flex: 1, padding: '14px', borderRadius: 14, border: `1.5px solid ${BORDER}`,
              background: CARD, color: FG2, fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}>Cancel</button>
            <button onClick={() => onConfirm(mealType, date, time)} style={{
              flex: 2, padding: '14px', borderRadius: 14, border: 'none',
              background: GREEN, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}>Log meal ✓</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── MenuItemCard — expandable ── */
function MenuItemCard({
  item, restaurant, distKm, userFlags, onLog, onUnlog, logged,
  isExpanded, onToggle,
}: {
  item: SGMenuItem; restaurant: SGRestaurant; distKm?: number;
  userFlags: DietaryFlag[]; onLog: () => void; onUnlog: () => void; logged: boolean;
  isExpanded: boolean; onToggle: () => void;
}) {
  const ppd     = item.price ? proteinPerDollar(item.protein, item.price) : 0;
  const dietFit = getDietFit(item.compatibleWith ?? [], userFlags);
  const grabUrl  = `https://food.grab.com/sg/en/search?query=${encodeURIComponent(restaurant.name)}`;
  const pandaUrl = `https://www.foodpanda.sg/search?q=${encodeURIComponent(restaurant.name)}`;
  const mapsUrl  = `https://www.google.com/maps/search/${encodeURIComponent(restaurant.name + ' Singapore')}`;

  return (
    <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, marginBottom: 10, boxShadow: SHADOW, overflow: 'hidden' }}>
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', cursor: 'pointer' }}>
        <Initial name={item.name} size={46} radius={12} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: FG1, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
          </div>
          <div style={{ fontSize: 12, color: FG2, marginBottom: 4 }}>{restaurant.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {item.price != null && <span style={{ fontSize: 13, fontWeight: 700, color: FG1 }}>${item.price.toFixed(2)}</span>}
            <span style={{ fontSize: 11, color: FG3 }}>{item.calories} cal</span>
            {distKm !== undefined && <span style={{ fontSize: 11, color: FG3 }}>📍 {distKm < 1 ? `${(distKm*1000).toFixed(0)}m` : `${distKm.toFixed(1)}km`}</span>}
            {item.price && ppd > 0 && <PpdBadge protein={item.protein} price={item.price} />}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* #9 — + logs (open confirm), ✓ un-logs */}
          <button
            onClick={e => { e.stopPropagation(); logged ? onUnlog() : onLog(); }}
            title={logged ? 'Tap to remove from log' : 'Log this meal'}
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

      {isExpanded && (
        <div style={{ borderTop: `1px solid ${BORDER}`, padding: '12px 14px 0' }}>
          {/* Macro grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 10 }}>
            {[
              { label: 'Protein', val: `${item.protein}g`, color: BLUE  },
              { label: 'Carbs',   val: `${item.carbs}g`,   color: AMBER },
              { label: 'Fat',     val: `${item.fat}g`,     color: GREEN },
              { label: 'Calories',val: `${item.calories}`, color: FG2   },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center', background: BG, borderRadius: 10, padding: '8px 4px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: m.color }}>{m.val}</div>
                <div style={{ fontSize: 10, color: FG3, marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>
          {/* Badges row: confidence + diet + set meal */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {/* #2 confidence */}
            <ConfidenceBadge source={item.source} verified={item.verified} confidence={item.confidence} />
            {/* #7 set meal */}
            {item.isSetMeal && <SetMealChip includes={item.setIncludes} />}
            {/* diet fit */}
            <DietBadge fit={getDietFit(item.compatibleWith ?? [], userFlags)} />
          </div>
          {/* CTAs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
            {[
              { href: grabUrl,  label: '🛵 Grab',  color: GREEN },
              { href: pandaUrl, label: '🐼 Panda', color: RED   },
              { href: mapsUrl,  label: '🗺️ Maps',  color: BLUE  },
            ].map(l => (
              <a key={l.label} href={l.href} target="_blank" rel="noreferrer"
                onClick={() => track(Events.EAT_ORDER_LINK_TAPPED, { item: item.id })}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '9px 6px', borderRadius: 10, border: `1px solid ${BORDER}`, background: BG, textDecoration: 'none', fontSize: 11, fontWeight: 700, color: l.color }}>
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Restaurant browse card — DB matched ── */
function RestaurantBrowseCard({ restaurant, distKm, onSelect }: {
  restaurant: SGRestaurant; distKm?: number; onSelect: () => void;
}) {
  const serviceIcons: Record<ServiceType, string> = { dine_in: '🍽️', grab_go: '🥡', delivery: '🛵' };
  return (
    <div onClick={onSelect} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: `1px solid ${BORDER}`, cursor: 'pointer' }}>
      <Initial name={restaurant.name} size={52} radius={14} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: FG1, marginBottom: 2 }}>{restaurant.name}</div>
        <div style={{ fontSize: 12, color: FG2, marginBottom: 5 }}>
          {restaurant.cuisine}{restaurant.priceRange ? ` · ${restaurant.priceRange}` : ''}
          {distKm !== undefined ? ` · ${distKm < 1 ? `${(distKm*1000).toFixed(0)}m` : `${distKm.toFixed(1)}km`}` : ''}
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {/* #1 diet icons */}
          {restaurant.dietTags?.slice(0,3).map(t => (
            <span key={t} style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: 'rgba(30,127,92,0.07)', color: GREEN }}>{DIET_LABEL[t as DietaryFlag] ?? t}</span>
          ))}
          {(restaurant.serviceTypes ?? []).map(s => (
            <span key={s} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(139,149,167,0.08)', color: FG3, border: `1px solid ${BORDER}` }}>{serviceIcons[s]}</span>
          ))}
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: GREEN }}>{restaurant.menu.length}</div>
        <div style={{ fontSize: 10, color: FG3 }}>items</div>
      </div>
    </div>
  );
}

/* ── #5 GPS-only restaurant (no DB menu data) ── */
function GPSRestaurantCard({ place }: { place: NearbyPlace }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: `1px solid ${BORDER}` }}>
      <Initial name={place.name} size={52} radius={14} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: FG1, marginBottom: 2 }}>{place.name}</div>
        <div style={{ fontSize: 12, color: FG3, marginBottom: 4 }}>
          {place.distKm !== undefined ? `${place.distKm < 1 ? `${(place.distKm*1000).toFixed(0)}m` : `${place.distKm.toFixed(1)}km`} away` : place.distance}
          {place.rating ? ` · ⭐ ${place.rating}` : ''}
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: 'rgba(139,149,167,0.08)', color: FG3, border: `1px solid ${BORDER}` }}>
          Menu info not available
        </span>
      </div>
      <a href={place.mapsUrl} target="_blank" rel="noreferrer" style={{ padding: '8px 12px', borderRadius: 10, border: `1px solid ${BORDER}`, background: BG, textDecoration: 'none', fontSize: 11, fontWeight: 700, color: BLUE, flexShrink: 0 }}>
        🗺️ Maps
      </a>
    </div>
  );
}

/* ── Recipe card ── */
function RecipeCard({ recipe, onLog, onUnlog, logged, isExpanded, onToggle }: {
  recipe: SGRecipe; onLog: () => void; onUnlog: () => void; logged: boolean;
  isExpanded: boolean; onToggle: () => void;
}) {
  const rawCost = calcCostPerServing(recipe);
  const cost    = rawCost ?? 0;
  const hasCost = cost > 0;
  const ppd     = hasCost ? proteinPerDollar(recipe.protein, cost) : 0;

  return (
    <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, marginBottom: 10, boxShadow: SHADOW, overflow: 'hidden' }}>
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', cursor: 'pointer' }}>
        <Initial name={recipe.name} size={46} radius={12} />
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
            onClick={e => { e.stopPropagation(); logged ? onUnlog() : onLog(); }}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              border: `1.5px solid ${logged ? 'rgba(30,127,92,0.35)' : BORDER}`,
              background: logged ? 'rgba(30,127,92,0.12)' : CARD,
              color: logged ? GREEN : FG2, fontSize: 18, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            }}
          >{logged ? '✓' : '+'}</button>
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
          {resolveIngredients(recipe).length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: FG2, marginBottom: 6 }}>Ingredients</div>
              {resolveIngredients(recipe).map(ri => (
                <div key={ri.ingredientId} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${BORDER}`, fontSize: 12 }}>
                  <span style={{ color: FG1 }}>{ri.ingredientId}</span>
                  <span style={{ color: FG3 }}>{ri.quantityG}g</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── #8 Filter bottom sheet with swipe-dismiss + manual inputs ── */
function FilterSheet({
  open, onClose,
  diningOption, setDiningOption,
  priceFilter, setPriceFilter,
  dietFlags, setDietFlags,
  filterMinProtein, setFilterMinProtein,
  filterMaxCalories, setFilterMaxCalories,
  distFilter, setDistFilter,
  sortKey, setSortKey,
  filterStrideApproved, setFilterStrideApproved,
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
  filterStrideApproved: boolean; setFilterStrideApproved: (v: boolean) => void;
  showDistance: boolean;
  onClear: () => void;
}) {
  // #8 swipe-to-dismiss
  const sheetRef   = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const [dragY, setDragY] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setDragY(0);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const dy = Math.max(0, e.touches[0].clientY - touchStartY.current);
    setDragY(dy);
  };
  const handleTouchEnd = () => {
    if (dragY > 80) { setDragY(0); onClose(); }
    else setDragY(0);
  };

  if (!open) return null;

  const toggleDiet = (flag: DietaryFlag) =>
    setDietFlags(dietFlags.includes(flag) ? dietFlags.filter(f => f !== flag) : [...dietFlags, flag]);

  const chip = (active: boolean, accent = GREEN) => ({
    padding: '8px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
    border: `1.5px solid ${active ? accent : BORDER}`,
    background: active ? `${accent}14` : CARD, color: active ? accent : FG2,
    outline: 'none', WebkitTapHighlightColor: 'transparent', transition: 'all .15s',
  } as React.CSSProperties);

  const SL = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 13, fontWeight: 700, color: FG2, marginBottom: 10, marginTop: 4 }}>{children}</div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.35)' }} onClick={onClose}>
      <div
        ref={sheetRef}
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: CARD, borderRadius: '22px 22px 0 0',
          padding: '8px 0 max(32px, env(safe-area-inset-bottom)) 0',
          maxHeight: '88vh', overflowY: 'auto',
          transform: `translateY(${dragY}px)`,
          transition: dragY === 0 ? 'transform .2s ease' : 'none',
        }}
      >
        <div style={{ width: 36, height: 4, background: '#DDE0E8', borderRadius: 2, margin: '0 auto 20px' }} />
        <div style={{ padding: '0 20px' }}>

          {/* Sort */}
          <SL>Sort by</SL>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {([
              { key: 'best_match'     as SortKey, label: 'Best Match'       },
              { key: 'protein_dollar' as SortKey, label: 'Protein per $'    },
              { key: 'price'          as SortKey, label: 'Price: Low→High'  },
              { key: 'calories'       as SortKey, label: 'Lowest Calories'  },
              ...(showDistance ? [{ key: 'distance' as SortKey, label: 'Nearest' }] : []),
            ]).map(o => (
              <button key={o.key} onClick={() => setSortKey(o.key)} style={chip(sortKey === o.key)}>{o.label}</button>
            ))}
          </div>
          <div style={{ height: 1, background: BORDER, marginBottom: 20 }} />

          {/* #10 Stride Approved */}
          <div style={{ marginBottom: 20 }}>
            <button onClick={() => setFilterStrideApproved(!filterStrideApproved)} style={{
              ...chip(filterStrideApproved, GREEN),
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              Stride Approved data only
            </button>
            {filterStrideApproved && (
              <div style={{ fontSize: 11, color: FG3, marginTop: 6, lineHeight: 1.5 }}>
                Shows only items with macros from the brand's official SG nutrition data or HPB-verified sources.
              </div>
            )}
          </div>
          <div style={{ height: 1, background: BORDER, marginBottom: 20 }} />

          {/* Price */}
          <SL>Price range</SL>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {(['all', '$', '$$', '$$$'] as PriceFilter[]).map(p => (
              <button key={p} onClick={() => setPriceFilter(p)} style={chip(priceFilter === p, AMBER)}>
                {p === 'all' ? 'Any' : p}
              </button>
            ))}
          </div>
          <div style={{ height: 1, background: BORDER, marginBottom: 20 }} />

          {/* Dining option */}
          <SL>Dining option</SL>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {([
              { val: 'all'      as DiningOption, label: 'All'         },
              { val: 'dine_in'  as DiningOption, label: 'Dine-in'  },
              { val: 'grab_go'  as DiningOption, label: 'Takeaway' },
              { val: 'delivery' as DiningOption, label: 'Delivery' },
            ]).map(o => (
              <button key={o.val} onClick={() => setDiningOption(o.val)} style={chip(diningOption === o.val)}>{o.label}</button>
            ))}
          </div>
          <div style={{ height: 1, background: BORDER, marginBottom: 20 }} />

          {/* #1 Diet type with icons */}
          <SL>Diet type</SL>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {(['halal','vegetarian','vegan','gluten_free','no_pork','high_protein','keto','low_carb','pescatarian'] as DietaryFlag[]).map(f => (
              <button key={f} onClick={() => toggleDiet(f)} style={chip(dietFlags.includes(f))}>
                {DIET_LABEL[f]}
              </button>
            ))}
          </div>
          <div style={{ height: 1, background: BORDER, marginBottom: 20 }} />

          {/* Macros with #8 manual inputs */}
          <SL>Macros</SL>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: FG2 }}>Min Protein</span>
              {/* #8 manual input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="number" min={0} max={100} value={filterMinProtein || ''}
                  onChange={e => setFilterMinProtein(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  placeholder="0"
                  style={{ width: 52, padding: '4px 8px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 12, fontWeight: 700, color: filterMinProtein > 0 ? BLUE : FG2, textAlign: 'center', outline: 'none' }}
                />
                <span style={{ fontSize: 11, color: FG3 }}>g</span>
              </div>
            </div>
            <input type="range" min={0} max={100} step={5} value={filterMinProtein}
              onChange={e => setFilterMinProtein(Number(e.target.value))}
              style={{ width: '100%', accentColor: BLUE, cursor: 'pointer' }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: FG2 }}>Max Calories</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="number" min={0} max={2000} value={filterMaxCalories || ''}
                  onChange={e => setFilterMaxCalories(Math.min(2000, Math.max(0, Number(e.target.value) || 0)))}
                  placeholder="Any"
                  style={{ width: 64, padding: '4px 8px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 12, fontWeight: 700, color: filterMaxCalories > 0 ? RED : FG2, textAlign: 'center', outline: 'none' }}
                />
                <span style={{ fontSize: 11, color: FG3 }}>kcal</span>
              </div>
            </div>
            <input type="range" min={0} max={1200} step={50} value={filterMaxCalories}
              onChange={e => setFilterMaxCalories(Number(e.target.value))}
              style={{ width: '100%', accentColor: RED, cursor: 'pointer' }}
            />
          </div>

          {showDistance && (
            <>
              <div style={{ height: 1, background: BORDER, marginBottom: 20 }} />
              <SL>Max distance</SL>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
                {([0, 0.5, 1, 2, 5] as DistFilter[]).map(d => (
                  <button key={d} onClick={() => setDistFilter(d)} style={chip(distFilter === d)}>
                    {d === 0 ? 'Any' : d < 1 ? `${d*1000}m` : `${d}km`}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, paddingBottom: 8 }}>
            <button onClick={onClear} style={{
              flex: 1, padding: '13px', borderRadius: 14, border: `1.5px solid ${BORDER}`,
              background: CARD, color: FG2, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>Clear all</button>
            <button onClick={onClose} style={{
              flex: 2, padding: '13px', borderRadius: 14, border: 'none',
              background: GREEN, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>Show results</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════ Main page ════════════════════════════════ */
export default function EatPage() {
  const store   = useStrideStore();
  const mealCtx = getMealContext();

  // ── URL params ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    const v = p.get('view');
    if (v === 'restaurants' || v === 'recipes' || v === 'meals') setViewType(v as ViewType);
    const q = p.get('q');   if (q)   setQuery(q);
    const r = p.get('r');   if (r)   { setFilterRestaurantId(r); setViewType('meals'); }
    const sort = p.get('sort');
    if (sort === 'ppd' || sort === 'protein') setSortKey('protein_dollar');
    const diet = p.get('diet');
    if (diet) setFilterDietFlags([diet as DietaryFlag]);
  }, []);

  // ── Core state ──────────────────────────────────────────────────────────
  const [viewType,            setViewType]            = useState<ViewType>('meals');
  const [mapMode,             setMapMode]             = useState(false); // list vs map
  const [query,               setQuery]               = useState('');
  const [expandedId,          setExpandedId]          = useState<string | null>(null);
  const [showFilters,         setShowFilters]         = useState(false);
  const [filterRestaurantId,  setFilterRestaurantId]  = useState<string | null>(null);

  // #9 log confirm
  const [pendingLog,          setPendingLog]          = useState<PendingLog | null>(null);
  // loggedEntryIds maps menuItemId → store entry id (for un-log)
  const [loggedEntryIds,      setLoggedEntryIds]      = useState<Map<string, string>>(new Map());
  const loggedIds = useMemo(() => new Set(loggedEntryIds.keys()), [loggedEntryIds]);

  // ── Filter state ────────────────────────────────────────────────────────
  const [sortKey,             setSortKey]             = useState<SortKey>('best_match');
  const [diningOption,        setDiningOption]        = useState<DiningOption>('all');
  const [priceFilter,         setPriceFilter]         = useState<PriceFilter>('all');
  const [filterDietFlags,     setFilterDietFlags]     = useState<DietaryFlag[]>([]);
  const [filterMinProtein,    setFilterMinProtein]    = useState(0);
  const [filterMaxCalories,   setFilterMaxCalories]   = useState(0);
  const [distFilter,          setDistFilter]          = useState<DistFilter>(0);
  const [filterStrideApproved,setFilterStrideApproved]= useState(false); // #10

  // ── Location state ──────────────────────────────────────────────────────
  const [locState,            setLocState]            = useState<'idle'|'loading'|'granted'|'denied'|'no_key'>('idle');
  const [userLat,             setUserLat]             = useState<number>(1.3521);  // Singapore default
  const [userLng,             setUserLng]             = useState<number>(103.8198);
  const [nearbyPlaces,        setNearbyPlaces]        = useState<NearbyPlace[]>([]);
  const [enrichedPlaces,      setEnrichedPlaces]      = useState<EnrichedPlace[]>([]);
  const [locationLabel,       setLocationLabel]       = useState('Current location');
  const [showLocationPicker,  setShowLocationPicker]  = useState(false);
  const [locationInput,       setLocationInput]       = useState('');
  const [geocoding,           setGeocoding]           = useState(false);
  const [toastMsg,            setToastMsg]            = useState('');

  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const userFlags: DietaryFlag[] = store.profile?.dietaryFlags ?? [];
  const remaining = {
    protein:  (store.profile?.targetProtein  ?? 120) - store.todayProtein,
    calories: (store.profile?.targetCalories ?? 2000) - store.todayCalories,
    carbs:    (store.profile?.targetCarbs    ?? 200)  - store.todayCarbs,
  };
  const hasLocation = locState === 'granted';

  // ── Location helpers ─────────────────────────────────────────────────────
  const fetchNearbyForCoords = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(`/api/nearby-places?lat=${lat}&lng=${lng}&mode=restaurant`);
      if (!res.ok) return;
      const data = await res.json();
      setNearbyPlaces(data.results ?? []);
    } catch { /* silent */ }
  }, []);

  const requestLocation = useCallback(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!key) { setLocState('no_key'); return; }
    setLocState('loading');
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocState('granted');
        setLocationLabel('Current location');
        setUserLat(lat); setUserLng(lng);
        setSortKey('distance');
        await fetchNearbyForCoords(lat, lng);
      },
      () => setLocState('denied'),
      { timeout: 8000, maximumAge: 120_000 },
    );
  }, [fetchNearbyForCoords]);

  // Geocode a typed location name → lat/lng → nearby places
  const searchByLocation = useCallback(async (place: string) => {
    if (!place.trim()) return;
    const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!key) { showToast('Location search needs Google Maps key'); return; }
    setGeocoding(true);
    try {
      const q = encodeURIComponent(`${place}, Singapore`);
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${q}&key=${key}&region=sg`
      );
      const data = await res.json();
      if (data.status !== 'OK' || !data.results?.[0]) {
        showToast('Location not found — try another area name');
        return;
      }
      const { lat, lng } = data.results[0].geometry.location;
      const shortName = data.results[0].address_components?.[0]?.short_name ?? place;
      setLocationLabel(shortName);
      setLocState('granted');
      setUserLat(lat); setUserLng(lng);
      setSortKey('distance');
      await fetchNearbyForCoords(lat, lng);
      setShowLocationPicker(false);
      setLocationInput('');
    } catch {
      showToast('Could not search that location');
    } finally {
      setGeocoding(false);
    }
  }, [fetchNearbyForCoords, showToast]);

  useEffect(() => {
    if (locState === 'idle') requestLocation();
    track(Events.EAT_PAGE_VIEWED);
  }, []);

  // ── Enrich GPS results ──────────────────────────────────────────────────
  useEffect(() => {
    setEnrichedPlaces(nearbyPlaces.map(p => {
      const dbMatch = matchRestaurant(p.name);
      return { ...p, dbMatch, tier: dbMatch ? 1 : 2 } as EnrichedPlace;
    }));
  }, [nearbyPlaces]);

  const distLookup = useMemo(() => {
    const m = new Map<string, number>();
    for (const ep of enrichedPlaces) {
      if (ep.dbMatch && ep.distKm !== undefined) m.set(ep.dbMatch.id, ep.distKm);
    }
    return m;
  }, [enrichedPlaces]);

  // ── Pooled items ────────────────────────────────────────────────────────
  const pooledItems = useMemo((): PooledItem[] => {
    const seen = new Set<string>();
    const out: PooledItem[] = [];
    for (const ep of enrichedPlaces) {
      if (!ep.dbMatch) continue;
      for (const item of ep.dbMatch.menu) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        out.push({ item, restaurant: ep.dbMatch, distKm: ep.distKm, tier: 1 });
      }
    }
    for (const r of SG_RESTAURANTS) {
      if (r.tab === 'store') continue;
      const distKm = distLookup.get(r.id);
      for (const item of r.menu) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        out.push({ item, restaurant: r, distKm, tier: 2 });
      }
    }
    return out;
  }, [enrichedPlaces, distLookup]);

  // ── Filtered + sorted items ─────────────────────────────────────────────
  const filteredItems = useMemo((): PooledItem[] => {
    let f = pooledItems;
    if (filterRestaurantId) f = f.filter(p => p.restaurant.id === filterRestaurantId);
    if (diningOption !== 'all') {
      const svcMap: Record<DiningOption, ServiceType> = { dine_in:'dine_in', grab_go:'grab_go', delivery:'delivery', all:'dine_in' };
      f = f.filter(p => (p.restaurant.serviceTypes ?? []).includes(svcMap[diningOption]));
    }
    if (priceFilter !== 'all') f = f.filter(p => p.restaurant.priceRange === priceFilter);
    if (filterDietFlags.length) f = f.filter(p => filterDietFlags.every(flag => (p.item.compatibleWith ?? []).includes(flag)));
    if (filterMinProtein > 0)   f = f.filter(p => p.item.protein >= filterMinProtein);
    if (filterMaxCalories > 0)  f = f.filter(p => p.item.calories <= filterMaxCalories);
    if (distFilter > 0)         f = f.filter(p => p.distKm === undefined || p.distKm <= distFilter);
    // #10 Stride Approved
    if (filterStrideApproved)   f = f.filter(p =>
      (p.item.source === 'official_sg' || (p.item.source === 'hpb' && p.item.verified)) && p.item.verified
    );
    if (sortKey === 'protein_dollar') f = [...f].sort((a,b) => proteinPerDollar(b.item.protein,b.item.price??0) - proteinPerDollar(a.item.protein,a.item.price??0));
    else if (sortKey === 'price')    f = [...f].sort((a,b) => (a.item.price??999) - (b.item.price??999));
    else if (sortKey === 'calories') f = [...f].sort((a,b) => a.item.calories - b.item.calories);
    else if (sortKey === 'distance') f = [...f].sort((a,b) => (a.distKm??99) - (b.distKm??99));
    return f;
  }, [pooledItems, filterRestaurantId, diningOption, priceFilter, filterDietFlags, filterMinProtein, filterMaxCalories, distFilter, sortKey, filterStrideApproved]);

  // ── Search results ──────────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    return searchAll(query).map(h => ({ ...h, distKm: distLookup.get(h.restaurant.id) }));
  }, [query, distLookup]);

  const recipeSearchResults = useMemo(() => {
    if (!query.trim() || viewType !== 'recipes') return null;
    return searchRecipes(query);
  }, [query, viewType]);

  // ── Restaurant list (#5: includes GPS-only places) ──────────────────────
  const restaurantList = useMemo(() => {
    let list = SG_RESTAURANTS.filter(r => r.tab !== 'store');
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(r => r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q) || (r.aliases ?? []).some(a => a.includes(q)));
    }
    if (diningOption !== 'all') {
      const svcMap: Record<DiningOption, ServiceType> = { dine_in:'dine_in', grab_go:'grab_go', delivery:'delivery', all:'dine_in' };
      list = list.filter(r => (r.serviceTypes ?? []).includes(svcMap[diningOption]));
    }
    if (priceFilter !== 'all') list = list.filter(r => r.priceRange === priceFilter);
    if (filterDietFlags.length) list = list.filter(r => filterDietFlags.some(f => (r.dietTags ?? []).includes(f)));
    return list;
  }, [query, diningOption, priceFilter, filterDietFlags]);

  // #5 GPS-only places (no DB match)
  const gpsOnlyPlaces = useMemo(() =>
    enrichedPlaces.filter(ep => !ep.dbMatch),
  [enrichedPlaces]);

  // ── Toast ───────────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2200);
  }, []);

  // ── #9 Log confirm handler ──────────────────────────────────────────────
  const commitLog = useCallback((mealType: MealType, _date: string, _time: string) => {
    if (!pendingLog) return;
    const { type, item, recipe, restaurant } = pendingLog;

    if (type === 'item' && item && restaurant) {
      const entry = {
        name: item.name, emoji: item.emoji, mealType,
        calories: item.calories, protein: item.protein, carbs: item.carbs, fat: item.fat,
        quantity: 1, restaurantId: restaurant.id,
      };
      store.addFoodEntry(entry);
      // Capture the newest entry id right after (Zustand set is synchronous)
      const newId = store.foodLog[store.foodLog.length - 1]?.id ?? item.id;
      setLoggedEntryIds(prev => new Map([...prev, [item.id, newId]]));
      showToast(`${item.emoji} ${item.name} logged!`);
      track(Events.MEAL_LOGGED, { source: 'eat_page', itemId: item.id, calories: item.calories });
    } else if (type === 'recipe' && recipe) {
      const entry = {
        name: recipe.name, emoji: recipe.emoji, mealType,
        calories: recipe.calories, protein: recipe.protein, carbs: recipe.carbs, fat: recipe.fat,
        fibre: recipe.fibre, quantity: 1,
      };
      store.addFoodEntry(entry);
      const newId = store.foodLog[store.foodLog.length - 1]?.id ?? recipe.id;
      setLoggedEntryIds(prev => new Map([...prev, [recipe.id, newId]]));
      showToast(`${recipe.emoji} ${recipe.name} logged!`);
      track(Events.MEAL_LOGGED, { source: 'eat_page_recipe', recipeId: recipe.id, calories: recipe.calories });
    }
    setPendingLog(null);
  }, [pendingLog, store, showToast]);

  const unlog = useCallback((menuId: string, displayName: string, emoji: string) => {
    const entryId = loggedEntryIds.get(menuId);
    if (!entryId) return;
    store.removeFoodEntry(entryId);
    setLoggedEntryIds(prev => { const m = new Map(prev); m.delete(menuId); return m; });
    showToast(`${emoji} ${displayName} removed`);
  }, [loggedEntryIds, store, showToast]);

  // ── Active filter count ─────────────────────────────────────────────────
  const activeFilterCount = [
    diningOption !== 'all', priceFilter !== 'all', filterDietFlags.length > 0,
    filterMinProtein > 0, filterMaxCalories > 0, distFilter > 0, filterStrideApproved,
  ].filter(Boolean).length;

  const clearAllFilters = useCallback(() => {
    setDiningOption('all'); setPriceFilter('all'); setFilterDietFlags([]);
    setFilterMinProtein(0); setFilterMaxCalories(0); setDistFilter(0);
    setSortKey('best_match'); setFilterRestaurantId(null); setFilterStrideApproved(false);
  }, []);

  const handleQueryChange = (v: string) => {
    setQuery(v);
    clearTimeout(searchTimer.current);
    if (v.trim()) searchTimer.current = setTimeout(() => track(Events.EAT_SEARCHED, { query: v }), 800);
  };

  const recipeList = recipeSearchResults ?? SG_RECIPES;

  // ── Map pins — one per unique restaurant in current filtered results ─────
  const mapPins = useMemo((): MapPin[] => {
    const seen  = new Set<string>();
    const pins: MapPin[] = [];

    // DB restaurants — only those with GPS-matched coords
    for (const { restaurant, distKm } of filteredItems) {
      if (seen.has(restaurant.id)) continue;
      seen.add(restaurant.id);
      const ep = enrichedPlaces.find(e => e.dbMatch?.id === restaurant.id);
      if (!ep?.lat || !ep?.lng) continue; // no coords available
      const isApproved = restaurant.menu.some(i => i.source === 'official_sg' && i.verified);
      pins.push({
        id: restaurant.id, name: restaurant.name,
        lat: ep.lat, lng: ep.lng,
        restaurant, distKm,
        tier: isApproved ? 'approved' : 'menu',
      });
    }

    // GPS-only places (no DB match)
    for (const ep of gpsOnlyPlaces) {
      if (!ep.lat || !ep.lng) continue;
      if (seen.has(ep.id)) continue;
      seen.add(ep.id);
      pins.push({
        id: ep.id, name: ep.name,
        lat: ep.lat, lng: ep.lng,
        distKm: ep.distKm, tier: 'gps_only',
      });
    }

    return pins.filter(p => p.lat !== 0 && p.lng !== 0);
  }, [filteredItems, enrichedPlaces, gpsOnlyPlaces]);

  const handleSearchArea = useCallback(async (lat: number, lng: number) => {
    setUserLat(lat); setUserLng(lng);
    setLocationLabel('This area');
    setLocState('granted');
    setSortKey('distance');
    await fetchNearbyForCoords(lat, lng);
  }, [fetchNearbyForCoords]);

  /* ══════════════════════════ Render ═════════════════════════════════════ */
  return (
    <div style={{ minHeight: '100vh', background: BG, paddingBottom: 100 }}>
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translate(-50%,12px); } to { opacity:1; transform:translate(-50%,0); } }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      {/* ── Sticky header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(247,248,251,0.96)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${BORDER}`, padding: '48px 16px 0',
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
              width: '100%', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16,
              padding: '13px 40px 13px 44px', fontSize: 15, color: FG1, outline: 'none',
              boxSizing: 'border-box', boxShadow: SHADOW,
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: FG3, fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
          )}
        </div>

        {/* View tabs + List/Map toggle */}
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          {([
            { key: 'meals'       as ViewType, label: 'Meals'       },
            { key: 'restaurants' as ViewType, label: 'Restaurants'  },
            { key: 'recipes'     as ViewType, label: 'Recipes'      },
          ]).map(tab => (
            <button key={tab.key}
              onClick={() => { setViewType(tab.key); if (tab.key !== 'meals') setFilterRestaurantId(null); if (tab.key !== 'meals') setMapMode(false); }}
              style={{
                flex: 1, padding: '10px 4px', border: 'none', background: 'none',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                color: viewType === tab.key ? GREEN : FG3,
                borderBottom: `2.5px solid ${viewType === tab.key ? GREEN : 'transparent'}`,
                transition: 'all .15s', WebkitTapHighlightColor: 'transparent',
              }}
            >{tab.label}</button>
          ))}
          {/* List / Map toggle — only shown on Meals tab */}
          {viewType === 'meals' && (
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8, paddingBottom: 2, gap: 2, flexShrink: 0 }}>
              <button
                onClick={() => setMapMode(false)}
                title="List view"
                style={{
                  width: 30, height: 26, borderRadius: '6px 0 0 6px', border: `1px solid ${BORDER}`,
                  background: !mapMode ? FG1 : CARD, color: !mapMode ? '#fff' : FG3,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
              <button
                onClick={() => setMapMode(true)}
                title="Map view"
                style={{
                  width: 30, height: 26, borderRadius: '0 6px 6px 0', border: `1px solid ${BORDER}`, borderLeft: 'none',
                  background: mapMode ? FG1 : CARD, color: mapMode ? '#fff' : FG3,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                  <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Location + filter bar ── */}
      <div style={{ padding: '12px 16px 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Location pill */}
        <button onClick={() => setShowLocationPicker(!showLocationPicker)} style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 20,
          border: `1px solid ${hasLocation ? 'rgba(30,127,92,0.25)' : BORDER}`,
          background: hasLocation ? 'rgba(30,127,92,0.06)' : CARD,
          fontSize: 12, fontWeight: 600, color: hasLocation ? GREEN : FG3,
          cursor: 'pointer', flexShrink: 0, maxWidth: 180,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="11" r="3"/>
            <path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z"/>
          </svg>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {locState === 'loading' ? 'Locating…' : locationLabel}
          </span>
          <span style={{ fontSize: 10, color: FG3, flexShrink: 0 }}>▾</span>
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowFilters(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20,
          border: `1.5px solid ${activeFilterCount > 0 ? GREEN : BORDER}`,
          background: activeFilterCount > 0 ? 'rgba(30,127,92,0.08)' : CARD,
          fontSize: 12, fontWeight: 700, color: activeFilterCount > 0 ? GREEN : FG2,
          cursor: 'pointer', flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filter & Sort'}
        </button>
      </div>

      {/* Location picker dropdown */}
      {showLocationPicker && (
        <div style={{ padding: '4px 16px 10px' }}>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 14, boxShadow: SHADOW }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: FG2, marginBottom: 10 }}>Search location</div>
            {/* Current GPS option */}
            <button
              onClick={() => { requestLocation(); setShowLocationPicker(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 12px', borderRadius: 12, marginBottom: 8,
                border: `1.5px solid ${locationLabel === 'Current location' && hasLocation ? GREEN : BORDER}`,
                background: locationLabel === 'Current location' && hasLocation ? 'rgba(30,127,92,0.06)' : BG,
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 18 }}>📍</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: locationLabel === 'Current location' && hasLocation ? GREEN : FG1 }}>
                  Current location
                </div>
                <div style={{ fontSize: 11, color: FG3 }}>
                  {locState === 'denied' ? 'Location access denied' : 'Use your GPS location'}
                </div>
              </div>
              {locationLabel === 'Current location' && hasLocation && (
                <span style={{ marginLeft: 'auto', color: GREEN, fontSize: 14 }}>✓</span>
              )}
            </button>
            {/* Custom location search */}
            <div style={{ fontSize: 11, fontWeight: 600, color: FG3, marginBottom: 6, marginTop: 4 }}>
              OR search a specific area
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={locationInput}
                onChange={e => setLocationInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchByLocation(locationInput)}
                placeholder="e.g. Orchard, Tampines, Jurong…"
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 12,
                  border: `1px solid ${BORDER}`, fontSize: 13, color: FG1,
                  outline: 'none', background: BG,
                }}
              />
              <button
                onClick={() => searchByLocation(locationInput)}
                disabled={geocoding || !locationInput.trim()}
                style={{
                  padding: '10px 14px', borderRadius: 12, border: 'none',
                  background: locationInput.trim() ? GREEN : BORDER,
                  color: locationInput.trim() ? '#fff' : FG3,
                  fontSize: 12, fontWeight: 700, cursor: locationInput.trim() ? 'pointer' : 'default',
                  flexShrink: 0, minWidth: 64,
                }}
              >
                {geocoding ? '…' : 'Search'}
              </button>
            </div>
            {/* Quick area shortcuts */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              {['Orchard', 'CBD', 'Tampines', 'Jurong', 'Bugis', 'Toa Payoh'].map(area => (
                <button key={area} onClick={() => searchByLocation(area)} style={{
                  padding: '5px 10px', borderRadius: 20, border: `1px solid ${BORDER}`,
                  background: CARD, fontSize: 11, fontWeight: 600, color: FG2, cursor: 'pointer',
                }}>
                  {area}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active filter tags */}
      {(filterRestaurantId || activeFilterCount > 0) && (
        <div style={{ padding: '4px 16px 8px', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {filterRestaurantId && (() => {
            const r = SG_RESTAURANTS.find(r => r.id === filterRestaurantId);
            return r ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: 'rgba(30,127,92,0.08)', border: '1px solid rgba(30,127,92,0.2)', fontSize: 11, fontWeight: 600, color: GREEN, flexShrink: 0 }}>
                {r.emoji} {r.name}
                <button onClick={() => setFilterRestaurantId(null)} style={{ background:'none', border:'none', cursor:'pointer', color: GREEN, fontSize:12, padding:0 }}>✕</button>
              </span>
            ) : null;
          })()}
          {filterStrideApproved && (
            <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:20, background:'rgba(30,127,92,0.08)', border:'1px solid rgba(30,127,92,0.2)', fontSize:11, fontWeight:700, color:GREEN, flexShrink:0 }}>
              Stride Approved
              <button onClick={() => setFilterStrideApproved(false)} style={{ background:'none', border:'none', cursor:'pointer', color:GREEN, fontSize:12, padding:0 }}>✕</button>
            </span>
          )}
          {activeFilterCount > (filterStrideApproved ? 1 : 0) && (
            <button onClick={clearAllFilters} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:20, background:'rgba(208,78,54,0.06)', border:'1px solid rgba(208,78,54,0.18)', fontSize:11, fontWeight:700, color:RED, cursor:'pointer', flexShrink:0 }}>
              Clear all ✕
            </button>
          )}
        </div>
      )}

      {/* ── Map view (replaces results when mapMode=true on Meals tab) ── */}
      {viewType === 'meals' && mapMode && (
        <div style={{ padding: '0 0 0' }}>
          <MapView
            pins={mapPins}
            centerLat={userLat}
            centerLng={userLng}
            onSearchArea={handleSearchArea}
            onSelectRestaurant={(restaurant) => {
              setFilterRestaurantId(restaurant.id);
              setMapMode(false);
            }}
          />
        </div>
      )}

      {/* ── Results ── */}
      <div style={{ padding: '8px 16px 0', display: mapMode ? 'none' : undefined }}>

        {/* MEALS */}
        {viewType === 'meals' && (() => {
          const items = searchResults
            ? searchResults.map(h => ({ item: h.item as SGMenuItem, restaurant: h.restaurant as SGRestaurant, distKm: (h as any).distKm as number|undefined, tier: 1 as RestaurantTier }))
            : filteredItems;

          if (items.length === 0) return (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: FG3 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: FG2, marginBottom: 8 }}>No meals found</div>
              <div style={{ fontSize: 13 }}>Try adjusting your filters or search terms</div>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} style={{ marginTop: 16, padding: '10px 20px', borderRadius: 20, background: GREEN, color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>Clear filters</button>
              )}
              {/* #6 fallback suggestions when empty */}
              {pooledItems.length > 0 && (
                <div style={{ marginTop: 24, textAlign: 'left', background: CARD, borderRadius: 18, border: `1px solid ${BORDER}`, padding: 16, boxShadow: SHADOW }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: FG1, marginBottom: 12 }}>Other options nearby</div>
                  {pooledItems.slice(0,5).map(({ item, restaurant, distKm }) => (
                    <MenuItemCard key={`${restaurant.id}__${item.id}`} item={item} restaurant={restaurant} distKm={distKm}
                      userFlags={userFlags} onLog={() => setPendingLog({ type:'item', item, restaurant })}
                      onUnlog={() => unlog(item.id, item.name, item.emoji)}
                      logged={loggedIds.has(item.id)}
                      isExpanded={expandedId === item.id}
                      onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          );

          return (
            <>
              <div style={{ fontSize: 12, color: FG3, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{searchResults ? `${items.length} results for "${query}"` : `${items.length} meals`}</span>
                {filterRestaurantId && <span style={{ color: GREEN, fontSize: 11, fontWeight: 600 }}>from {SG_RESTAURANTS.find(r => r.id === filterRestaurantId)?.name}</span>}
              </div>
              {items.map(({ item, restaurant, distKm }) => (
                <MenuItemCard key={`${restaurant.id}__${item.id}`} item={item} restaurant={restaurant} distKm={distKm}
                  userFlags={userFlags} onLog={() => setPendingLog({ type:'item', item, restaurant })}
                  onUnlog={() => unlog(item.id, item.name, item.emoji)}
                  logged={loggedIds.has(item.id)}
                  isExpanded={expandedId === item.id}
                  onToggle={() => { setExpandedId(expandedId === item.id ? null : item.id); if (expandedId !== item.id) track(Events.EAT_ITEM_EXPANDED, { itemId: item.id }); }}
                />
              ))}

              {/* #6 "More options" fallback when few results */}
              {items.length > 0 && items.length < 5 && activeFilterCount > 0 && (
                <div style={{ marginTop: 12, background: CARD, borderRadius: 16, border: `1px dashed ${BORDER}`, padding: '14px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: FG2, marginBottom: 4 }}>More options outside your filters</div>
                  <div style={{ fontSize: 11, color: FG3, marginBottom: 10 }}>These don't match all your criteria but may be worth a look</div>
                  {pooledItems.filter(p => !items.find(i => i.item.id === p.item.id)).slice(0, 4).map(({ item, restaurant, distKm }) => (
                    <MenuItemCard key={`fallback__${restaurant.id}__${item.id}`} item={item} restaurant={restaurant} distKm={distKm}
                      userFlags={userFlags} onLog={() => setPendingLog({ type:'item', item, restaurant })}
                      onUnlog={() => unlog(item.id, item.name, item.emoji)}
                      logged={loggedIds.has(item.id)}
                      isExpanded={expandedId === item.id}
                      onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    />
                  ))}
                </div>
              )}
            </>
          );
        })()}

        {/* RESTAURANTS */}
        {viewType === 'restaurants' && (() => {
          const showGps = gpsOnlyPlaces.length > 0 && !query.trim();
          if (restaurantList.length === 0 && !showGps) return (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: FG3 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: FG2, marginBottom: 8 }}>No restaurants found</div>
            </div>
          );
          return (
            <div style={{ background: CARD, borderRadius: 18, border: `1px solid ${BORDER}`, padding: '0 14px', boxShadow: SHADOW }}>
              <div style={{ fontSize: 12, color: FG3, padding: '12px 0 4px' }}>
                {restaurantList.length} restaurant{restaurantList.length !== 1 ? 's' : ''} with menu data
                {showGps ? ` · ${gpsOnlyPlaces.length} more nearby` : ''}
              </div>
              {restaurantList.map(r => (
                <RestaurantBrowseCard key={r.id} restaurant={r} distKm={distLookup.get(r.id)}
                  onSelect={() => { setFilterRestaurantId(r.id); setViewType('meals'); setQuery(''); }}
                />
              ))}
              {/* #5 GPS-only restaurants below */}
              {showGps && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 700, color: FG3, padding: '14px 0 4px', borderTop: `1px dashed ${BORDER}`, marginTop: 6 }}>
                    Other places near you — no menu data yet
                  </div>
                  {gpsOnlyPlaces.map(p => <GPSRestaurantCard key={p.id} place={p} />)}
                </>
              )}
            </div>
          );
        })()}

        {/* RECIPES */}
        {viewType === 'recipes' && (() => {
          if (recipeList.length === 0) return (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: FG3 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: FG2, marginBottom: 8 }}>No recipes found</div>
            </div>
          );
          return (
            <>
              <div style={{ fontSize: 12, color: FG3, marginBottom: 10 }}>
                {recipeList.length} recipe{recipeList.length !== 1 ? 's' : ''}{query ? ` matching "${query}"` : ''}
              </div>
              {recipeList.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe}
                  onLog={() => setPendingLog({ type:'recipe', recipe })}
                  onUnlog={() => unlog(recipe.id, recipe.name, recipe.emoji)}
                  logged={loggedIds.has(recipe.id)}
                  isExpanded={expandedId === recipe.id}
                  onToggle={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
                />
              ))}
            </>
          );
        })()}
      </div>

      {/* Filter sheet */}
      <FilterSheet
        open={showFilters} onClose={() => setShowFilters(false)}
        diningOption={diningOption} setDiningOption={setDiningOption}
        priceFilter={priceFilter} setPriceFilter={setPriceFilter}
        dietFlags={filterDietFlags} setDietFlags={setFilterDietFlags}
        filterMinProtein={filterMinProtein} setFilterMinProtein={setFilterMinProtein}
        filterMaxCalories={filterMaxCalories} setFilterMaxCalories={setFilterMaxCalories}
        distFilter={distFilter} setDistFilter={setDistFilter}
        sortKey={sortKey} setSortKey={setSortKey}
        filterStrideApproved={filterStrideApproved} setFilterStrideApproved={setFilterStrideApproved}
        showDistance={hasLocation}
        onClear={clearAllFilters}
      />

      {/* #9 Log confirm sheet */}
      {pendingLog && (
        <LogConfirmSheet
          pending={pendingLog}
          onConfirm={commitLog}
          onCancel={() => setPendingLog(null)}
        />
      )}

      <LogToast message={toastMsg} />
    </div>
  );
}
