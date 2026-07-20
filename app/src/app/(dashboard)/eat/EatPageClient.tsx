'use client';
// Opt out of static pre-rendering — this page depends on user location and
// real-time data; attempting a static build causes a Turbopack TDZ crash.

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  SG_RESTAURANTS, SG_RECIPES, SG_INGREDIENTS,
  type SGRestaurant, type SGMenuItem, type SGRecipe, type ServiceType, type RestaurantTier,
  type MealBuilder, type MealSlot, type MealOption,
} from '@/lib/sgFoodDb';
import { isAvailableNow, daypartLabel } from '@/lib/dayparts';
import type { DietaryFlag } from '@/types';
import MealFeedbackSheet  from '@/components/MealFeedbackSheet';
import AddMealSheet       from '@/components/AddMealSheet';
import { useMealOverlay } from '@/lib/useMealOverlay';
import { resolveDisplay } from '@/lib/resolveDisplay';
import type { ConfidenceTier } from '@/lib/firestoreFoodDb';
import { HawkerStallGrid }    from '@/components/hawker/HawkerStallGrid';

/* ── Design tokens — now aligned to Stride design system ── */
const BG     = 'var(--bg)';
const CARD   = 'var(--surface)';
const BORDER = 'var(--line)';
const FG1    = 'var(--ink)';
const FG2    = 'var(--ink-2)';
const FG3    = 'var(--muted)';
const GREEN  = 'var(--green)';
const BLUE   = '#2E6FB8';
const AMBER  = 'var(--gold)';
const RED    = 'var(--coral)';
const PURPLE = '#7C3AED';
const SHADOW = 'var(--shadow-md)';

/* ── Types ── */
interface NearbyPlace {
  id: string; name: string; type: string; distance: string; distKm?: number;
  lat?: number; lng?: number;
  rating: number | null; priceLevel: string | null;
  hours: string; emoji: string; mapsUrl: string;
}
interface EnrichedPlace extends NearbyPlace {
  dbMatch: SGRestaurant | null;
  tier: number;   // sort priority: 1 = DB match, 2 = generic
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
  distKm?: number; tier: number;   // sort priority: 1 = DB match, 2 = generic
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

// ── Restaurant domain map for Clearbit logo CDN ──────────────────────────
const RESTAURANT_DOMAINS: Record<string, string> = {
  mcd:           'mcdonalds.com.sg',
  kfc:           'kfc.com.sg',
  bk:            'burgerking.com.sg',
  subway:        'subway.com',
  jollibee:      'jollibee.com.sg',
  starbucks:     'starbucks.com.sg',
  old_chang_kee: 'oldchangkee.com',
  stuffd:        'stuffd.com.sg',
  grain:         'grain.com.sg',
  popeyes:       'popeyes.com.sg',
  wingstop:      'wingstop.com.sg',
  nandos:        'nandos.com.sg',
  shake_shack:   'shakeshack.com',
  daily_cut:     'thedailycut.com.sg',
  salad_stop:    'saladstop.com',
  saladbox:      'saladbox.sg',
  toast_box:     'toastbox.com.sg',
  ya_kun:        'yakun.com',
  super_snacks:  'supersnacks.sg',
  bengawan_solo: 'bengawansolo.com.sg',
};

// ── RestaurantLogo — Clearbit CDN + initial fallback ─────────────────────
function RestaurantLogo({
  restaurantId, name, size = 46, radius = 14,
}: { restaurantId?: string; name: string; size?: number; radius?: number }) {
  const [failed, setFailed] = useState(false);
  const domain = restaurantId ? RESTAURANT_DOMAINS[restaurantId] : undefined;

  if (!failed && domain) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://logo.clearbit.com/${domain}`}
        alt={name}
        onError={() => setFailed(true)}
        style={{ width: size, height: size, borderRadius: radius, flexShrink: 0, objectFit: 'contain', background: 'var(--surface-2)' }}
      />
    );
  }
  // Fallback: initial letter
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: 'var(--surface-2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.42), fontWeight: 700,
      fontFamily: '"Space Grotesk", system-ui, sans-serif',
      color: 'var(--green-deep)',
      userSelect: 'none',
    }}>
      {name.trim().charAt(0).toUpperCase()}
    </div>
  );
}

// Keep Initial for non-restaurant usage
function Initial({ name, size = 46, radius = 14 }: { name: string; size?: number; radius?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: 'var(--surface-2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.42), fontWeight: 700,
      fontFamily: '"Space Grotesk", system-ui, sans-serif',
      color: 'var(--green-deep)',
      userSelect: 'none',
    }}>
      {name.trim().charAt(0).toUpperCase()}
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
const CONFIDENCE_TIPS: Record<string, string> = {
  approved:  'Sourced directly from the brand\'s official Singapore nutrition info. Highest accuracy.',
  community: 'User-submitted data, not independently verified. Values may vary slightly.',
  estimate:  'Estimated from reference data — reasonable accuracy for most tracking purposes.',
};

function ConfidenceBadge({ source, verified, confidence, confidenceTier }: {
  source?: string; verified?: boolean; confidence?: string;
  confidenceTier?: ConfidenceTier | null;
}) {
  const [tip, setTip] = useState(false);
  if (!source && !confidence) return null;

  // Resolve effective tier: prefer Firestore-stored tier, fall back to static
  const effectiveTier: ConfidenceTier | 'legacy_approved' | 'legacy_community' | 'legacy_estimate' =
    confidenceTier ??
    ((source === 'official_sg' && !!verified) ? 'legacy_approved'
     : (source === 'community' || confidence === 'community') ? 'legacy_community'
     : 'legacy_estimate');

  const TIER_CONFIG: Record<string, { label: string; tip: string; bg: string; border: string; color: string }> = {
    stride_approved:   { label: 'Stride Approved',   tip: CONFIDENCE_TIPS.approved,  bg: 'rgba(30,127,92,0.07)',   border: '1px solid rgba(30,127,92,0.18)',   color: GREEN  },
    merchant_verified: { label: 'Merchant Verified', tip: 'Data submitted and verified by the restaurant directly.',             bg: 'rgba(46,111,184,0.07)',   border: '1px solid rgba(46,111,184,0.20)',  color: BLUE   },
    staff_verified:    { label: 'Staff Verified',    tip: 'Checked against a primary source by the Stride team.',               bg: 'rgba(0,180,180,0.07)',    border: '1px solid rgba(0,180,180,0.22)',   color: '#0B9A9A' },
    community:         { label: 'Community',         tip: CONFIDENCE_TIPS.community, bg: 'rgba(124,58,237,0.06)',  border: '1px solid rgba(124,58,237,0.15)', color: PURPLE },
    stride_estimate:   { label: 'Estimated',         tip: CONFIDENCE_TIPS.estimate,  bg: 'rgba(139,149,167,0.08)', border: `1px solid ${BORDER}`,             color: FG3    },
    legacy_approved:   { label: 'Stride Approved',   tip: CONFIDENCE_TIPS.approved,  bg: 'rgba(30,127,92,0.07)',   border: '1px solid rgba(30,127,92,0.18)',   color: GREEN  },
    legacy_community:  { label: 'Community',         tip: CONFIDENCE_TIPS.community, bg: 'rgba(124,58,237,0.06)',  border: '1px solid rgba(124,58,237,0.15)', color: PURPLE },
    legacy_estimate:   { label: 'Estimated',         tip: CONFIDENCE_TIPS.estimate,  bg: 'rgba(139,149,167,0.08)', border: `1px solid ${BORDER}`,             color: FG3    },
  };
  const cfg      = TIER_CONFIG[effectiveTier] ?? TIER_CONFIG.legacy_estimate;
  const tipText  = cfg.tip;
  const badgeStyle: React.CSSProperties = { background: cfg.bg, border: cfg.border, color: cfg.color };
  const dotBg    = cfg.color;
  const label    = cfg.label;

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span
        onClick={e => { e.stopPropagation(); setTip(t => !t); }}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
          cursor: 'pointer', ...badgeStyle }}
      >
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: dotBg, flexShrink: 0 }} />
        {label}
        <span style={{ fontSize: 9, opacity: 0.55 }}>ⓘ</span>
      </span>
      {tip && (
        <>
          <span style={{ position: 'fixed', inset: 0, zIndex: 500 }} onClick={e => { e.stopPropagation(); setTip(false); }} />
          <span style={{
            position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, zIndex: 501,
            width: 220, background: '#1a1a2e', color: '#fff',
            fontSize: 11, lineHeight: 1.5, padding: '8px 12px', borderRadius: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,.3)', display: 'block', pointerEvents: 'none',
          }}>
            {tipText}
          </span>
        </>
      )}
    </span>
  );
}

function PpdBadge({ protein, price }: { protein: number; price?: number | null }) {
  if (!price) return null;
  const v = proteinPerDollar(protein, price);
  if (!v) return null;
  const top = v >= 5;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'baseline', gap: 2,
      padding: '3px 9px', borderRadius: 9,
      // top tier: gold fill + white text (passes WCAG AA)
      // normal: deep amber text on tinted bg (≥4.5:1 contrast)
      background: top ? 'var(--gold)' : 'var(--gold-tint)',
      color: top ? '#fff' : '#7A5200',
      fontFamily: '"Space Grotesk", system-ui, sans-serif',
      fontWeight: 700, fontSize: 12, letterSpacing: '-0.02em', whiteSpace: 'nowrap',
    }}>
      {v.toFixed(1)}<span style={{ fontSize: 10, fontWeight: 600 }}>&thinsp;g&thinsp;/&thinsp;$</span>
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
  onConfirm: (mealType: MealType, date: string, time: string, servings: number) => void;
  onCancel: () => void;
}) {
  const ctx = getMealContext();
  const [mealType, setMealType] = useState<MealType>(ctx.mealType);
  const [date, setDate]         = useState(todayStr());
  const [time, setTime]         = useState(nowTimeStr());
  const [servings, setServings] = useState(1);

  const name    = pending.item?.name ?? pending.recipe?.name ?? '';
  const emoji   = pending.item?.emoji ?? pending.recipe?.emoji ?? '🍽️';
  const cal     = pending.item?.calories ?? pending.recipe?.macrosPerServing?.calories ?? 0;
  const protein = pending.item?.protein  ?? pending.recipe?.macrosPerServing?.protein  ?? 0;
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
                {Math.round(cal * servings)} cal · {Math.round(protein * servings)}g protein{price ? ` · $${(price * servings).toFixed(2)}` : ''}
              </div>
            </div>
          </div>

          {/* Servings picker */}
          {pending.type === 'item' && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: FG2, marginBottom: 10 }}>
                Servings
                <span style={{ fontSize: 11, fontWeight: 500, color: FG3, marginLeft: 6 }}>
                  {Math.round(cal * servings)} cal · {Math.round(protein * servings)}g P
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => setServings(s => Math.max(0.5, parseFloat((s - 0.5).toFixed(1))))}
                  style={{
                    width: 44, height: 44, borderRadius: 12, border: `1.5px solid ${BORDER}`,
                    background: CARD, color: FG1, fontSize: 22, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}
                >−</button>
                <input
                  type="number" value={servings} min="0.5" step="0.5"
                  onChange={e => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v) && v >= 0.5) setServings(parseFloat(v.toFixed(1)));
                  }}
                  style={{
                    flex: 1, textAlign: 'center', padding: '10px 4px', borderRadius: 12,
                    border: `1.5px solid ${GREEN}`, background: 'rgba(30,127,92,0.08)',
                    color: GREEN, fontSize: 20, fontWeight: 800, outline: 'none',
                  }}
                />
                <button
                  onClick={() => setServings(s => parseFloat((s + 0.5).toFixed(1)))}
                  style={{
                    width: 44, height: 44, borderRadius: 12, border: `1.5px solid ${BORDER}`,
                    background: CARD, color: FG1, fontSize: 22, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}
                >+</button>
              </div>
            </div>
          )}

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
            <button onClick={() => onConfirm(mealType, date, time, servings)} style={{
              flex: 2, padding: '14px', borderRadius: 14, border: 'none',
              background: GREEN, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}>Log meal ✓</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── MealBuilderPanel — inline set-meal configurator ── */
function MealBuilderPanel({
  item, restaurant, onLogSetMeal,
}: {
  item: SGMenuItem;
  restaurant: SGRestaurant;
  onLogSetMeal: (syntheticItem: SGMenuItem) => void;
}) {
  const mb = item.mealBuilder!;
  // Upsize hidden for now — show only the 'from' price. Re-enable when upsize deltas are finalized (v5).
  const SHOW_UPSIZE = false;
  const [open, setOpen]       = useState(false);
  const [upsize, setUpsize]   = useState(false);
  const [sideId, setSideId]   = useState(mb.side?.defaultId ?? '');
  const [drinkId, setDrinkId] = useState(mb.drink?.defaultId ?? '');

  // Resolve component items from restaurant menu
  const findItem = (id: string) => restaurant.menu.find(m => m.id === id);
  const side  = findItem(sideId);
  const drink = findItem(drinkId);
  const upsizeSideId  = mb.side?.defaultIdLarge  ?? sideId;
  const upsizeDrinkId = mb.drink?.defaultIdLarge ?? drinkId;
  const resolvedSide  = upsize ? (findItem(upsizeSideId)  ?? side)  : side;
  const resolvedDrink = upsize ? (findItem(upsizeDrinkId) ?? drink) : drink;

  // Price = mealPrice + upsize delta + option deltas
  const sideOpt  = mb.side?.options.find(o => o.itemId === sideId);
  const drinkOpt = mb.drink?.options.find(o => o.itemId === drinkId);
  const price = mb.mealPrice
    + (sideOpt?.priceDelta ?? 0)
    + (drinkOpt?.priceDelta ?? 0)
    + (upsize && mb.upsizeDelta ? mb.upsizeDelta : 0);

  // Combined macros
  const totalCal  = item.calories + (resolvedSide?.calories ?? 0) + (resolvedDrink?.calories ?? 0);
  const totalProt = item.protein  + (resolvedSide?.protein  ?? 0) + (resolvedDrink?.protein  ?? 0);
  const totalCarb = item.carbs    + (resolvedSide?.carbs    ?? 0) + (resolvedDrink?.carbs    ?? 0);
  const totalFat  = item.fat      + (resolvedSide?.fat      ?? 0) + (resolvedDrink?.fat      ?? 0);
  const ppd = price > 0 ? proteinPerDollar(totalProt, price) : 0;

  const handleLog = () => {
    const synthetic: SGMenuItem = {
      ...item,
      id:       `${item.id}_meal`,
      name:     `${item.name} Meal${upsize ? ' (L)' : ''}`,
      price,
      calories: totalCal,
      protein:  totalProt,
      carbs:    totalCarb,
      fat:      totalFat,
    };
    onLogSetMeal(synthetic);
  };

  const chipBtn = (selected: boolean, label: string, onClick: () => void) => (
    <button onClick={onClick} style={{
      padding: '5px 11px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
      border: `1.5px solid ${selected ? GREEN : BORDER}`,
      background: selected ? 'rgba(30,127,92,0.08)' : CARD,
      color: selected ? GREEN : FG2,
    }}>{label}</button>
  );

  return (
    <div style={{ marginBottom: 10 }}>
      {/* Toggle row */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 12px', borderRadius: 12, cursor: 'pointer',
          border: `1.5px solid ${open ? GREEN : BORDER}`,
          background: open ? 'rgba(30,127,92,0.06)' : CARD,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: open ? GREEN : FG2 }}>
          🍔 Make it a Meal from ${mb.mealPrice.toFixed(2)}
        </span>
        <span style={{ fontSize: 11, color: FG3, transform: `rotate(${open ? 180 : 0}deg)`, display: 'inline-block', transition: 'transform .2s' }}>▼</span>
      </button>

      {open && (
        <div style={{ marginTop: 10, padding: '12px 12px', background: BG, borderRadius: 12, border: `1px solid ${BORDER}` }}>
          {/* Upsize (hidden for now) */}
          {SHOW_UPSIZE && mb.upsizeDelta != null && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: FG3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Size</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {chipBtn(!upsize, 'Medium (default)', () => setUpsize(false))}
                {chipBtn(upsize,  `Large (+$${mb.upsizeDelta.toFixed(2)})`, () => setUpsize(true))}
              </div>
            </div>
          )}

          {/* Side picker — only shown if multiple options */}
          {mb.side && mb.side.options.length > 1 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: FG3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Side</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {mb.side.options.map(opt => {
                  const it = findItem(opt.itemId);
                  return chipBtn(sideId === opt.itemId, it?.name ?? opt.itemId, () => setSideId(opt.itemId));
                })}
              </div>
            </div>
          )}

          {/* Drink picker — only shown if multiple options */}
          {mb.drink && mb.drink.options.length > 1 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: FG3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Drink</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {mb.drink.options.map(opt => {
                  const it = findItem(opt.itemId);
                  return chipBtn(drinkId === opt.itemId, it?.name ?? opt.itemId, () => setDrinkId(opt.itemId));
                })}
              </div>
            </div>
          )}

          {/* Macro summary */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 12,
            background: CARD, borderRadius: 10, padding: '8px 6px',
          }}>
            {[
              { label: 'Cal',     val: String(totalCal),        color: RED   },
              { label: 'Protein', val: `${totalProt}g`,         color: GREEN },
              { label: 'Carbs',   val: `${totalCarb}g`,         color: AMBER },
              { label: 'Fat',     val: `${totalFat}g`,          color: FG2   },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: m.color }}>{m.val}</div>
                <div style={{ fontSize: 9, color: FG3 }}>{m.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: FG1 }}>Total: ${price.toFixed(2)}</span>
            {ppd > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: GREEN }}>{ppd.toFixed(1)} g protein/$</span>}
          </div>

          <button onClick={handleLog} style={{
            width: '100%', padding: '11px 0', borderRadius: 12, border: 'none',
            background: GREEN, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer',
          }}>
            Log Meal ✓
          </button>
        </div>
      )}
    </div>
  );
}

/* ── MenuItemCard — expandable ── */
function MenuItemCard({
  item, restaurant, distKm, userFlags, onLog, onUnlog, logged,
  isExpanded, onToggle, onRestaurantFilter, onLogSetMeal,
}: {
  item: SGMenuItem; restaurant: SGRestaurant; distKm?: number;
  userFlags: DietaryFlag[]; onLog: () => void; onUnlog: () => void; logged: boolean;
  isExpanded: boolean; onToggle: () => void;
  onRestaurantFilter?: () => void;
  onLogSetMeal?: (syntheticItem: SGMenuItem) => void;
}) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  // Fetch Firestore overlay when card is expanded (lazy — not on every visible card)
  const overlay = useMealOverlay(item.id, isExpanded);
  const display = resolveDisplay(item, overlay);
  const ppd     = item.price ? proteinPerDollar(item.protein, item.price) : 0;
  // Compute min price across restaurant ala carte menu (for "from $X" display)
  const minPrice = useMemo(() => {
    const prices = restaurant.menu.filter(i => !i.isSetMeal && i.price != null).map(i => i.price!);
    return prices.length ? Math.min(...prices) : null;
  }, [restaurant]);
  const grabUrl  = `https://food.grab.com/sg/en/search?query=${encodeURIComponent(restaurant.name + ' Singapore')}`;
  const pandaUrl = `https://www.foodpanda.sg/search?q=${encodeURIComponent(restaurant.name)}`;
  const mapsUrl  = `https://www.google.com/maps/search/${encodeURIComponent(restaurant.name + ' Singapore')}`;

  return (
    <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, marginBottom: 10, boxShadow: SHADOW, overflow: 'hidden' }}>
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', cursor: 'pointer' }}>
        <RestaurantLogo restaurantId={restaurant.id} name={restaurant.name} size={46} radius={12} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: FG1, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
          </div>
          {/* Restaurant tag — tappable to filter to that eatery */}
          <button
            onClick={e => { e.stopPropagation(); onRestaurantFilter?.(); }}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: onRestaurantFilter ? 'pointer' : 'default',
              fontSize: 12, color: GREEN, fontWeight: 600, marginBottom: 4, textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 3,
            }}
          >
            {restaurant.name}
            {onRestaurantFilter && <span style={{ fontSize: 10, opacity: 0.6 }}>›</span>}
          </button>
          {/* Collapsed macro row — price + cal prominent; C/F muted to reduce rainbow noise */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {item.price != null
              ? <span style={{ fontSize: 13, fontWeight: 700, color: FG1 }}>${item.price.toFixed(2)}</span>
              : minPrice != null && <span style={{ fontSize: 11, color: FG3 }}>from ${minPrice.toFixed(2)}</span>
            }
            {item.price != null && <span style={{ fontSize: 11, color: FG3 }}>·</span>}
            <span style={{ fontSize: 11, color: RED, fontWeight: 700 }}>{item.calories} cal</span>
            <span style={{ fontSize: 11, color: FG3 }}>|</span>
            <span style={{ fontSize: 11, color: GREEN, fontWeight: 600 }}>P&thinsp;{item.protein}g</span>
            <span style={{ fontSize: 11, color: FG3 }}>·</span>
            <span style={{ fontSize: 11, color: FG3, fontWeight: 500 }}>C&thinsp;{item.carbs}g</span>
            <span style={{ fontSize: 11, color: FG3 }}>·</span>
            <span style={{ fontSize: 11, color: FG3, fontWeight: 500 }}>F&thinsp;{item.fat}g</span>
            {item.price && ppd > 0 && <PpdBadge protein={item.protein} price={item.price} />}
          </div>
          {distKm !== undefined && (
            <div style={{ fontSize: 10, color: FG3, marginTop: 2 }}>
              📍 {distKm < 1 ? `${(distKm * 1000).toFixed(0)}m away` : `${distKm.toFixed(1)}km away`}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* + navigates to log/food with pre-filled data */}
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
          {/* Macro grid — replaces the collapsed inline row; shows % of daily target too */}
          {(() => {
            const targetCal  = 2000; // sensible default; real value from store not in scope here
            const pctProt    = Math.round((item.protein  / 120)        * 100);
            const pctCarbs   = Math.round((item.carbs    / 250)        * 100);
            const pctFat     = Math.round((item.fat      / 65)         * 100);
            const pctCal     = Math.round((item.calories / targetCal)  * 100);
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 10 }}>
                {[
                  { label: 'Protein',  val: `${item.protein}g`,  sub: `${pctProt}% DV`,  color: GREEN },
                  { label: 'Carbs',    val: `${item.carbs}g`,    sub: `${pctCarbs}% DV`, color: AMBER },
                  { label: 'Fat',      val: `${item.fat}g`,      sub: `${pctFat}% DV`,   color: FG2   },
                  { label: 'Calories', val: `${item.calories}`,  sub: `${pctCal}% DV`,   color: RED   },
                ].map(m => (
                  <div key={m.label} style={{ textAlign: 'center', background: BG, borderRadius: 10, padding: '8px 4px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: m.color }}>{m.val}</div>
                    <div style={{ fontSize: 9,  color: FG3, marginTop: 1 }}>{m.sub}</div>
                    <div style={{ fontSize: 10, color: FG3, marginTop: 1 }}>{m.label}</div>
                  </div>
                ))}
              </div>
            );
          })()}
          {/* Badges row: confidence (5-tier) + diet + set meal */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            <ConfidenceBadge
              source={item.source} verified={item.verified} confidence={item.confidence}
              confidenceTier={display.confidenceTier ?? undefined}
            />
            {item.isSetMeal && <SetMealChip includes={item.setIncludes} />}
            <DietBadge fit={getDietFit(item.compatibleWith ?? [], userFlags)} />
          </div>
          {/* Community note — shown when ≥5 users corroborated */}
          {display.communityNote && (
            <div style={{
              fontSize: 11, fontWeight: 500, color: PURPLE,
              background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.12)',
              borderRadius: 8, padding: '5px 10px', marginBottom: 10,
            }}>
              {display.communityNote}
            </div>
          )}
          {/* ── Set meal builder ── */}
          {item.mealBuilder && onLogSetMeal && (
            <MealBuilderPanel item={item} restaurant={restaurant} onLogSetMeal={onLogSetMeal} />
          )}

          {/* ── Order online (delivery aggregators with brand colors) ── */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: FG3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Order online</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <a href={grabUrl} target="_blank" rel="noreferrer"
                onClick={() => track(Events.EAT_ORDER_LINK_TAPPED, { item: item.id, platform: 'grab' })}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px 6px', borderRadius: 10, background: '#00B14F', textDecoration: 'none', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                🛵 Grab
              </a>
              <a href={pandaUrl} target="_blank" rel="noreferrer"
                onClick={() => track(Events.EAT_ORDER_LINK_TAPPED, { item: item.id, platform: 'foodpanda' })}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px 6px', borderRadius: 10, background: '#D70F64', textDecoration: 'none', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                🐼 foodpanda
              </a>
            </div>
          </div>
          {/* ── Utility ── */}
          <div style={{ marginBottom: 10 }}>
            <a href={mapsUrl} target="_blank" rel="noreferrer"
              onClick={() => track(Events.EAT_ORDER_LINK_TAPPED, { item: item.id, platform: 'maps' })}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px 0', borderRadius: 10, border: `1px solid ${BORDER}`, background: BG, textDecoration: 'none', fontSize: 11, fontWeight: 600, color: FG2 }}>
              🗺️ View on Google Maps
            </a>
          </div>

          {/* Feedback row */}
          <button
            onClick={e => { e.stopPropagation(); setFeedbackOpen(true); }}
            style={{
              width: '100%', padding: '9px 0', marginBottom: 14,
              background: 'none', border: `1px solid ${BORDER}`,
              borderRadius: 10, cursor: 'pointer',
              fontSize: 11, fontWeight: 600, color: FG3,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}
          >
            <span>⭐</span> Was this accurate? Rate it
          </button>
        </div>
      )}

      {/* Feedback sheet */}
      <MealFeedbackSheet
        mealId={item.id}
        mealName={item.name}
        restaurantName={restaurant.name}
        currentCalories={item.calories}
        currentProtein={item.protein}
        currentCarbs={item.carbs}
        currentFat={item.fat}
        currentPrice={item.price ?? undefined}
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
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
      <RestaurantLogo restaurantId={restaurant.id} name={restaurant.name} size={52} radius={14} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: FG1, marginBottom: 2 }}>{restaurant.name}</div>
        <div style={{ fontSize: 12, color: FG2, marginBottom: 5 }}>
          {restaurant.cuisine}{restaurant.priceRange ? ` · ${restaurant.priceRange}` : ''}
          {distKm !== undefined
            ? ` · ${distKm < 1 ? `${(distKm * 1000).toFixed(0)}m away` : `${distKm.toFixed(1)}km away`}`
            : ' · 📍 Singapore'}
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
  const macros  = recipe.macrosPerServing;
  const cost    = recipe.costPerServing ?? 0;
  const hasCost = cost > 0;
  const ppd     = hasCost ? proteinPerDollar(macros?.protein ?? 0, cost) : 0;
  const totalMins = (recipe.prepMins ?? 0) + (recipe.cookMins ?? 0);
  const prepLabel = totalMins > 0 ? `${totalMins}min` : '';

  return (
    <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, marginBottom: 10, boxShadow: SHADOW, overflow: 'hidden' }}>
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', cursor: 'pointer' }}>
        <Initial name={recipe.name} size={46} radius={12} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: FG1, marginBottom: 2 }}>{recipe.name}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {hasCost && <span style={{ fontSize: 13, fontWeight: 700, color: FG1 }}>${cost.toFixed(2)}</span>}
            <span style={{ fontSize: 11, color: FG3 }}>{macros?.calories ?? 0} cal</span>
            <span style={{ fontSize: 11, color: FG3 }}>{prepLabel}{prepLabel ? ' · ' : ''}{recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}</span>
            {hasCost && ppd > 0 && <PpdBadge protein={macros?.protein ?? 0} price={cost} />}
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
              { label: 'Protein', val: `${macros?.protein ?? 0}g`, color: BLUE },
              { label: 'Carbs',   val: `${macros?.carbs   ?? 0}g`, color: AMBER },
              { label: 'Fat',     val: `${macros?.fat     ?? 0}g`, color: GREEN },
              { label: 'Fibre',   val: macros?.fibre ? `${macros.fibre}g` : '—', color: FG2 },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center', background: BG, borderRadius: 10, padding: '8px 4px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: m.color }}>{m.val}</div>
                <div style={{ fontSize: 10, color: FG3, marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: FG2, marginBottom: 6 }}>Ingredients</div>
              {recipe.ingredients.map(ri => {
                const ing = SG_INGREDIENTS.find(i => i.id === ri.ingredientId);
                const displayName = ing?.name ?? ri.ingredientId.replace(/^ing_/, '').replace(/_/g, ' ');
                const grams = Math.round(ri.quantity * (ing?.unit?.includes('100g') ? 100 : 1000));
                return (
                  <div key={ri.ingredientId} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${BORDER}`, fontSize: 12 }}>
                    <span style={{ color: FG1, textTransform: 'capitalize' }}>{displayName}</span>
                    <span style={{ color: FG3 }}>{ri.note ?? `${grams}g`}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Filter bottom sheet — accordion style ── */
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
  filterIncludeSetMeals, setFilterIncludeSetMeals,
  maxPriceNum, setMaxPriceNum,
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
  filterIncludeSetMeals: boolean; setFilterIncludeSetMeals: (v: boolean) => void;
  maxPriceNum: number | null; setMaxPriceNum: (v: number | null) => void;
  showDistance: boolean;
  onClear: () => void;
}) {
  const sheetRef    = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const [dragY, setDragY] = useState(0);
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(['sort', 'data', 'price', 'dining', 'diet'])
  );

  const toggleSection = (id: string) =>
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

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
    padding: '7px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
    border: `1.5px solid ${active ? accent : BORDER}`,
    background: active ? `${accent}1a` : CARD, color: active ? accent : FG2,
    outline: 'none', WebkitTapHighlightColor: 'transparent', transition: 'all .12s',
  } as React.CSSProperties);

  const secBtn = {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  } as React.CSSProperties;

  const chevron = (id: string) => ({
    width: 14, height: 14, flexShrink: 0, transition: 'transform .2s',
    transform: openSections.has(id) ? 'rotate(0deg)' : 'rotate(-90deg)',
  } as React.CSSProperties);

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
          maxHeight: '88vh', display: 'flex', flexDirection: 'column',
          transform: `translateY(${dragY}px)`,
          transition: dragY === 0 ? 'transform .2s ease' : 'none',
        }}
      >
        {/* Drag handle */}
        <div style={{ padding: '10px 0 0', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, background: '#DDE0E8', borderRadius: 2, margin: '0 auto' }} />
        </div>

        {/* Header */}
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px', borderBottom: `1px solid ${BORDER}`,
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: FG1 }}>Filter &amp; sort</span>
          <button onClick={onClear} style={{
            fontSize: 12, fontWeight: 700, color: GREEN, background: 'none', border: 'none',
            cursor: 'pointer', padding: 0,
          }}>Clear all</button>
        </div>

        {/* Scrollable sections */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* Sort by */}
          <div style={{ borderBottom: `1px solid ${BORDER}` }}>
            <button style={secBtn} onClick={() => toggleSection('sort')}>
              <span style={{ fontSize: 13, fontWeight: 700, color: FG1 }}>Sort by</span>
              <svg style={chevron('sort')} viewBox="0 0 14 14" fill="none">
                <path d="M3 5l4 4 4-4" stroke={FG3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {openSections.has('sort') && (
              <div style={{ padding: '0 20px 14px', display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {([
                  { key: 'best_match'     as SortKey, label: 'Best match'      },
                  { key: 'protein_dollar' as SortKey, label: 'Protein per $'   },
                  { key: 'price'          as SortKey, label: 'Price: low→high' },
                  { key: 'calories'       as SortKey, label: 'Lowest calories' },
                  ...(showDistance ? [{ key: 'distance' as SortKey, label: 'Nearest' }] : []),
                ]).map(o => (
                  <button key={o.key} onClick={() => setSortKey(o.key)} style={chip(sortKey === o.key)}>{o.label}</button>
                ))}
              </div>
            )}
          </div>

          {/* Data quality */}
          <div style={{ borderBottom: `1px solid ${BORDER}` }}>
            <button style={secBtn} onClick={() => toggleSection('data')}>
              <span style={{ fontSize: 13, fontWeight: 700, color: FG1 }}>Data quality</span>
              <svg style={chevron('data')} viewBox="0 0 14 14" fill="none">
                <path d="M3 5l4 4 4-4" stroke={FG3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {openSections.has('data') && (
              <div style={{ padding: '0 20px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Stride Approved toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: FG1 }}>Stride Approved only</div>
                    <div style={{ fontSize: 11, color: FG3, marginTop: 2 }}>Verified nutrition data</div>
                  </div>
                  <div
                    onClick={() => setFilterStrideApproved(!filterStrideApproved)}
                    style={{
                      width: 42, height: 24, borderRadius: 12, cursor: 'pointer', flexShrink: 0,
                      background: filterStrideApproved ? GREEN : '#DDE0E8',
                      position: 'relative', transition: 'background .2s',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 3, width: 18, height: 18,
                      borderRadius: '50%', background: '#fff',
                      boxShadow: '0 1px 3px rgba(0,0,0,.15)',
                      left: filterStrideApproved ? 21 : 3, transition: 'left .2s',
                    }} />
                  </div>
                </div>
                {/* Include set meals toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: FG1 }}>Include set meals</div>
                    <div style={{ fontSize: 11, color: FG3, marginTop: 2 }}>Show combo / bundled meals</div>
                  </div>
                  <div
                    onClick={() => setFilterIncludeSetMeals(!filterIncludeSetMeals)}
                    style={{
                      width: 42, height: 24, borderRadius: 12, cursor: 'pointer', flexShrink: 0,
                      background: filterIncludeSetMeals ? GREEN : '#DDE0E8',
                      position: 'relative', transition: 'background .2s',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 3, width: 18, height: 18,
                      borderRadius: '50%', background: '#fff',
                      boxShadow: '0 1px 3px rgba(0,0,0,.15)',
                      left: filterIncludeSetMeals ? 21 : 3, transition: 'left .2s',
                    }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Price range */}
          <div style={{ borderBottom: `1px solid ${BORDER}` }}>
            <button style={secBtn} onClick={() => toggleSection('price')}>
              <span style={{ fontSize: 13, fontWeight: 700, color: FG1 }}>Price range</span>
              <svg style={chevron('price')} viewBox="0 0 14 14" fill="none">
                <path d="M3 5l4 4 4-4" stroke={FG3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {openSections.has('price') && (
              <div style={{ padding: '0 20px 14px' }}>
                <div style={{ display: 'flex', gap: 7, marginBottom: 10 }}>
                  {(['all', '$', '$$', '$$$'] as PriceFilter[]).map(p => (
                    <button key={p} onClick={() => setPriceFilter(p)} style={chip(priceFilter === p)}>
                      {p === 'all' ? 'Any' : p}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: FG2, flexShrink: 0 }}>Max price</span>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 9, fontSize: 12, color: FG2, pointerEvents: 'none' }}>$</span>
                    <input
                      type='number' min='0' step='0.5'
                      value={maxPriceNum ?? ''}
                      onChange={e => setMaxPriceNum(e.target.value ? Number(e.target.value) : null)}
                      placeholder='e.g. 8'
                      style={{
                        width: 90, paddingLeft: 20, paddingRight: 10, paddingTop: 7, paddingBottom: 7,
                        borderRadius: 10, border: `1.5px solid ${maxPriceNum !== null ? GREEN : BORDER}`,
                        fontSize: 13, color: FG1, background: BG, outline: 'none',
                        fontFamily: '"Hanken Grotesk",system-ui,sans-serif',
                      }}
                    />
                  </div>
                  {maxPriceNum !== null && (
                    <button onClick={() => setMaxPriceNum(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: FG3, padding: 0 }}>✕</button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dining option */}
          <div style={{ borderBottom: `1px solid ${BORDER}` }}>
            <button style={secBtn} onClick={() => toggleSection('dining')}>
              <span style={{ fontSize: 13, fontWeight: 700, color: FG1 }}>Dining option</span>
              <svg style={chevron('dining')} viewBox="0 0 14 14" fill="none">
                <path d="M3 5l4 4 4-4" stroke={FG3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {openSections.has('dining') && (
              <div style={{ padding: '0 20px 14px', display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {([
                  { val: 'all'      as DiningOption, label: 'All'      },
                  { val: 'dine_in'  as DiningOption, label: 'Dine-in'  },
                  { val: 'grab_go'  as DiningOption, label: 'Takeaway' },
                  { val: 'delivery' as DiningOption, label: 'Delivery' },
                ]).map(o => (
                  <button key={o.val} onClick={() => setDiningOption(o.val)} style={chip(diningOption === o.val)}>{o.label}</button>
                ))}
              </div>
            )}
          </div>

          {/* Diet type — badge shows count of active flags */}
          <div style={{ borderBottom: `1px solid ${BORDER}` }}>
            <button style={secBtn} onClick={() => toggleSection('diet')}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: FG1 }}>Diet type</span>
                {dietFlags.length > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: '#fff', background: GREEN,
                    borderRadius: 999, padding: '1px 6px', lineHeight: 1.7,
                  }}>{dietFlags.length}</span>
                )}
              </span>
              <svg style={chevron('diet')} viewBox="0 0 14 14" fill="none">
                <path d="M3 5l4 4 4-4" stroke={FG3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {openSections.has('diet') && (
              <div style={{ padding: '0 20px 14px', display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {(['halal','vegetarian','vegan','gluten_free','no_pork','high_protein','keto','low_carb','pescatarian'] as DietaryFlag[]).map(f => (
                  <button key={f} onClick={() => toggleDiet(f)} style={chip(dietFlags.includes(f))}>
                    {DIET_LABEL[f]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Macros — number inputs only, no sliders */}
          <div style={{ borderBottom: `1px solid ${BORDER}` }}>
            <button style={secBtn} onClick={() => toggleSection('macros')}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: FG1 }}>Macros</span>
                {(filterMinProtein > 0 || filterMaxCalories > 0) && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: GREEN, background: `${GREEN}1a`,
                    borderRadius: 999, padding: '1px 7px', lineHeight: 1.7,
                  }}>set</span>
                )}
              </span>
              <svg style={chevron('macros')} viewBox="0 0 14 14" fill="none">
                <path d="M3 5l4 4 4-4" stroke={FG3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {openSections.has('macros') && (
              <div style={{ padding: '0 20px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: FG2, width: 96 }}>Min protein</span>
                  <input
                    type="number" min={0} max={100} value={filterMinProtein || ''} placeholder="0"
                    onChange={e => setFilterMinProtein(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                    style={{
                      width: 68, padding: '7px 10px', borderRadius: 10,
                      border: `1.5px solid ${filterMinProtein > 0 ? BLUE : BORDER}`,
                      fontSize: 13, fontWeight: 700,
                      color: filterMinProtein > 0 ? BLUE : FG2,
                      textAlign: 'center', outline: 'none', background: CARD,
                    }}
                  />
                  <span style={{ fontSize: 11, color: FG3 }}>g</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: FG2, width: 96 }}>Max calories</span>
                  <input
                    type="number" min={0} max={2000} value={filterMaxCalories || ''} placeholder="Any"
                    onChange={e => setFilterMaxCalories(Math.min(2000, Math.max(0, Number(e.target.value) || 0)))}
                    style={{
                      width: 68, padding: '7px 10px', borderRadius: 10,
                      border: `1.5px solid ${filterMaxCalories > 0 ? RED : BORDER}`,
                      fontSize: 13, fontWeight: 700,
                      color: filterMaxCalories > 0 ? RED : FG2,
                      textAlign: 'center', outline: 'none', background: CARD,
                    }}
                  />
                  <span style={{ fontSize: 11, color: FG3 }}>kcal</span>
                </div>
              </div>
            )}
          </div>

          {/* Max distance — only shown when GPS is available */}
          {showDistance && (
            <div>
              <button style={secBtn} onClick={() => toggleSection('dist')}>
                <span style={{ fontSize: 13, fontWeight: 700, color: FG1 }}>Max distance</span>
                <svg style={chevron('dist')} viewBox="0 0 14 14" fill="none">
                  <path d="M3 5l4 4 4-4" stroke={FG3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {openSections.has('dist') && (
                <div style={{ padding: '0 20px 14px', display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {([0, 0.5, 1, 2, 5] as DistFilter[]).map(d => (
                    <button key={d} onClick={() => setDistFilter(d)} style={chip(distFilter === d)}>
                      {d === 0 ? 'Any' : d < 1 ? `${d*1000}m` : `${d}km`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{
          flexShrink: 0, display: 'flex', gap: 10,
          padding: '12px 20px', paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          borderTop: `1px solid ${BORDER}`,
        }}>
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
  );
}


/* ── Build log URL for pre-filling the food log page ── */
function buildLogUrl(item: SGMenuItem, restaurant: SGRestaurant): string {
  const params = new URLSearchParams({
    name:   item.name,
    cal:    String(item.calories),
    p:      String(item.protein),
    c:      String(item.carbs),
    f:      String(item.fat),
    emoji:  item.emoji,
    rid:    restaurant.id,
    rname:  restaurant.name,
  });
  if (item.price != null) params.set('price', String(item.price));
  return `/log/food?${params.toString()}`;
}

/* ══════════════════════════════ Main page ════════════════════════════════ */
export default function EatPage() {
  const store   = useStrideStore();
  const router  = useRouter();
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
    else if (sort === 'price')    setSortKey('price');
    else if (sort === 'calories') setSortKey('calories');
    else if (sort === 'distance') setSortKey('distance');
    const diet = p.get('diet');
    if (diet) setFilterDietFlags([diet as DietaryFlag]);
    // Auto-open filter sheet when open_filter=1 is set (from Dashboard chips)
    if (p.get('open_filter') === '1') setShowFilters(true);
  }, []);

  // ── Core state ──────────────────────────────────────────────────────────
  const [viewType,            setViewType]            = useState<ViewType>('meals');
  const [mapMode,             setMapMode]             = useState(false); // list vs map
  const [query,               setQuery]               = useState('');
  const [expandedId,          setExpandedId]          = useState<string | null>(null);
  const [showFilters,         setShowFilters]         = useState(false);
  const [addMealOpen,         setAddMealOpen]         = useState(false);
  const [filterRestaurantId,  setFilterRestaurantId]  = useState<string | null>(null);

  // #9 log confirm
  const [pendingLog,          setPendingLog]          = useState<PendingLog | null>(null);
  // loggedEntryIds maps menuItemId → store entry id (for un-log)
  const [loggedEntryIds,      setLoggedEntryIds]      = useState<Map<string, string>>(new Map());
  const loggedIds = useMemo(() => new Set(loggedEntryIds.keys()), [loggedEntryIds]);

  // ── Filter state ────────────────────────────────────────────────────────
  const [sortKey,             setSortKey]             = useState<SortKey>('protein_dollar');
  const [diningOption,        setDiningOption]        = useState<DiningOption>('all');
  const [priceFilter,         setPriceFilter]         = useState<PriceFilter>('all');
  const [maxPriceNum,         setMaxPriceNum]         = useState<number | null>(null);
  const [filterDietFlags,     setFilterDietFlags]     = useState<DietaryFlag[]>([]);
  const [filterMinProtein,    setFilterMinProtein]    = useState(0);
  const [filterMaxCalories,   setFilterMaxCalories]   = useState(0);
  const [distFilter,          setDistFilter]          = useState<DistFilter>(0);
  const [filterStrideApproved,setFilterStrideApproved]= useState(false); // #10
  const [filterIncludeSetMeals,setFilterIncludeSetMeals]= useState(false); // ala carte only by default

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
  const todayTotals = store.getTodayTotals();
  const remaining = {
    protein:  (store.profile?.targetProtein  ?? 120) - todayTotals.protein,
    calories: (store.profile?.targetCalories ?? 2000) - todayTotals.calories,
    carbs:    (store.profile?.targetCarbs    ?? 200)  - todayTotals.carbs,
  };
  const hasLocation = locState === 'granted';

  // ── Toast — must be declared before any callback that uses it ────────────
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2200);
  }, []);

  // ── Location helpers ─────────────────────────────────────────────────────
  const fetchNearbyForCoords = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(`/api/nearby-places?lat=${lat}&lng=${lng}&type=food`);
      if (!res.ok) return;
      const data = await res.json();
      setNearbyPlaces(data.places ?? []);
    } catch { /* silent */ }
  }, []);

  const requestLocation = useCallback(() => {
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
    setGeocoding(true);
    try {
      const q = place.trim();
      let lat: number | null = null;
      let lng: number | null = null;
      let shortName = q;

      // 1️⃣ OneMap SG — best for postal codes, MRT stations, buildings, roads
      try {
        const omRes = await fetch(
          `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(q)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`
        );
        if (omRes.ok) {
          const omData = await omRes.json();
          if (omData.found > 0 && omData.results?.[0]) {
            const r = omData.results[0];
            lat = parseFloat(r.LATITUDE);
            lng = parseFloat(r.LONGITUDE);
            // Pick the most descriptive label: building > road > search value
            shortName = r.BUILDING && r.BUILDING !== 'NIL'
              ? r.BUILDING.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())
              : r.ROAD_NAME && r.ROAD_NAME !== 'NIL'
                ? r.ROAD_NAME.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())
                : r.SEARCHVAL;
          }
        }
      } catch { /* fall through to Nominatim */ }

      // 2️⃣ Nominatim fallback — good for general area names (Orchard, CBD, Jurong…)
      if (lat === null) {
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ', Singapore')}&format=json&limit=1&countrycodes=sg`,
          { headers: { 'Accept-Language': 'en', 'User-Agent': 'StrideApp/1.0' } }
        );
        const nomData = await nomRes.json();
        if (Array.isArray(nomData) && nomData.length > 0) {
          lat = parseFloat(nomData[0].lat);
          lng = parseFloat(nomData[0].lon);
          shortName = nomData[0].display_name?.split(',')[0] ?? q;
        }
      }

      if (lat === null || lng === null) {
        showToast('Location not found — try a postal code or MRT name');
        return;
      }

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
    // By default show only ala carte items; set meals hidden unless user enables them
    if (!filterIncludeSetMeals) f = f.filter(p => !p.item.isSetMeal);
    // Daypart: hide items not served now (breakfast vs regular). Browse only — search is unaffected.
    f = f.filter(p => isAvailableNow(p.item, new Date(), p.restaurant.dayparts));
    if (filterRestaurantId) f = f.filter(p => p.restaurant.id === filterRestaurantId);
    if (diningOption !== 'all') {
      const svcMap: Record<DiningOption, ServiceType> = { dine_in:'dine_in', grab_go:'grab_go', delivery:'delivery', all:'dine_in' };
      f = f.filter(p => (p.restaurant.serviceTypes ?? []).includes(svcMap[diningOption]));
    }
    if (priceFilter !== 'all') f = f.filter(p => p.restaurant.priceRange === priceFilter);
    if (maxPriceNum !== null) f = f.filter(p => (p.item.price ?? Infinity) <= maxPriceNum!);
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
    else if (sortKey === 'distance') f = [...f].sort((a, b) => {
      const aDist = a.distKm;
      const bDist = b.distKm;
      // Both have GPS distance → sort by real distance
      if (aDist !== undefined && bDist !== undefined) return aDist - bDist;
      // One has GPS, one doesn't → GPS item first
      if (aDist !== undefined) return -1;
      if (bDist !== undefined) return 1;
      // Neither has GPS → sort by protein/$ as useful secondary rank
      return proteinPerDollar(b.item.protein, b.item.price ?? 0) - proteinPerDollar(a.item.protein, a.item.price ?? 0);
    });
    return f;
  }, [pooledItems, filterRestaurantId, diningOption, priceFilter, filterDietFlags, filterMinProtein, filterMaxCalories, distFilter, sortKey, filterStrideApproved, filterIncludeSetMeals]);

  // ── Search results (item names + restaurant names) ──────────────────────
  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    // 1. Match by item name
    const byItemName = searchAll(query).items.map(h => ({ ...h, distKm: distLookup.get(h.restaurant.id) }));
    const seen = new Set(byItemName.map(h => h.item.id));
    // 2. Match by restaurant name — show all ala carte items of matching restaurants
    const byRestaurantName: typeof byItemName = [];
    for (const rest of SG_RESTAURANTS) {
      const matchesName = rest.name.toLowerCase().includes(q) ||
        (rest.aliases || []).some((a: string) => a.toLowerCase().includes(q));
      if (matchesName) {
        for (const item of rest.menu.filter(i => !i.isSetMeal)) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            byRestaurantName.push({ item, restaurant: rest, distKm: distLookup.get(rest.id) });
          }
        }
      }
    }
    return [...byItemName, ...byRestaurantName];
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

  // showToast declared above (before searchByLocation) to avoid TDZ in deps array

  // ── #9 Log confirm handler ──────────────────────────────────────────────
  const commitLog = useCallback((mealType: MealType, _date: string, _time: string, servings: number = 1) => {
    if (!pendingLog) return;
    const { type, item, recipe, restaurant } = pendingLog;

    if (type === 'item' && item && restaurant) {
      const entry = {
        foodItemId: item.id,
        name: item.name, emoji: item.emoji, mealType,
        calories: Math.round(item.calories * servings), protein: Math.round(item.protein * servings),
        carbs: Math.round(item.carbs * servings), fat: Math.round(item.fat * servings),
        quantity: servings, restaurantId: restaurant.id,
      };
      store.addFoodEntry(entry);
      // Capture the newest entry id right after (Zustand set is synchronous)
      const newId = store.foodLog[store.foodLog.length - 1]?.id ?? item.id;
      setLoggedEntryIds(prev => new Map([...prev, [item.id, newId]]));
      showToast(`${item.emoji} ${item.name} logged!`);
      track(Events.MEAL_LOGGED, { source: 'eat_page', itemId: item.id, calories: item.calories });
    } else if (type === 'recipe' && recipe) {
      const m = recipe.macrosPerServing;
      const entry = {
        foodItemId: recipe.id,
        name: recipe.name, emoji: recipe.emoji, mealType,
        calories: m?.calories ?? 0, protein: m?.protein ?? 0, carbs: m?.carbs ?? 0, fat: m?.fat ?? 0,
        fibre: m?.fibre, quantity: 1,
      };
      store.addFoodEntry(entry);
      const newId = store.foodLog[store.foodLog.length - 1]?.id ?? recipe.id;
      setLoggedEntryIds(prev => new Map([...prev, [recipe.id, newId]]));
      showToast(`${recipe.emoji} ${recipe.name} logged!`);
      track(Events.MEAL_LOGGED, { source: 'eat_page_recipe', recipeId: recipe.id, calories: recipe.macrosPerServing?.calories ?? 0 });
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
    diningOption !== 'all', priceFilter !== 'all', maxPriceNum !== null, filterDietFlags.length > 0,
    filterMinProtein > 0, filterMaxCalories > 0, distFilter > 0, filterStrideApproved,
  ].filter(Boolean).length;

  const clearAllFilters = useCallback(() => {
    setDiningOption('all'); setPriceFilter('all'); setMaxPriceNum(null); setFilterDietFlags([]);
    setFilterMinProtein(0); setFilterMaxCalories(0); setDistFilter(0);
    setSortKey('best_match'); setFilterRestaurantId(null); setFilterStrideApproved(false);
    setFilterIncludeSetMeals(false);
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
        background: 'rgba(241,245,240,0.96)', backdropFilter: 'blur(18px) saturate(160%)', WebkitBackdropFilter: 'blur(18px) saturate(160%)',
        borderBottom: '1px solid var(--line-2)', padding: '48px 20px 0',
      }}>
        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/>
            </svg>
          </span>
          <input
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder={viewType === 'restaurants' ? 'Search restaurants…' : viewType === 'recipes' ? 'Search recipes…' : 'Search meals, restaurants, recipes…'}
            style={{
              width: '100%', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16,
              padding: '14px 40px 14px 46px', fontSize: 15, color: 'var(--ink)', outline: 'none',
              boxSizing: 'border-box', boxShadow: 'var(--shadow-md)',
              fontFamily: '"Hanken Grotesk", system-ui, sans-serif', fontWeight: 500,
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
          )}
        </div>

        {/* Remaining budget strip */}
        {/* Hawker stall grid — renders only when ?r= is a hawker with stalls */}
        <HawkerStallGrid />

        {(remaining.calories > 0 || remaining.protein > 0) && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 11, fontWeight: 600, color: 'var(--ink-2)',
              background: 'rgba(0,0,0,0.04)', padding: '4px 10px', borderRadius: 999,
            }}>
              {Math.max(0, Math.round(remaining.calories))} kcal left
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600, color: GREEN,
              background: 'rgba(30,127,92,0.07)', padding: '4px 10px', borderRadius: 999,
            }}>
              {Math.max(0, Math.round(remaining.protein))}g protein left
            </span>
          </div>
        )}

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
                flex: 1, padding: '11px 4px', border: 'none', background: 'none',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                color: viewType === tab.key ? 'var(--ink)' : 'var(--muted)',
                borderBottom: `2.5px solid ${viewType === tab.key ? 'var(--green)' : 'transparent'}`,
                transition: 'all .15s', WebkitTapHighlightColor: 'transparent',
                fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
              }}
            >{tab.label}</button>
          ))}
          {/* List / Map toggle — only shown on Meals tab */}
          {viewType === 'meals' && (
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8, paddingBottom: 4, gap: 2, flexShrink: 0 }}>
              <button
                onClick={() => setMapMode(false)}
                title="List view"
                style={{
                  width: 30, height: 26, borderRadius: '6px 0 0 6px', border: '1px solid var(--line)',
                  background: !mapMode ? 'var(--ink)' : 'var(--surface)', color: !mapMode ? '#fff' : 'var(--muted)',
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
      <div style={{ padding: '12px 20px 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Location pill */}
        <button onClick={() => setShowLocationPicker(!showLocationPicker)} style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 999,
          border: `1px solid ${hasLocation ? 'var(--green-tint-2)' : 'var(--line)'}`,
          background: hasLocation ? 'var(--green-tint)' : 'var(--surface)',
          fontSize: 13, fontWeight: 600, color: hasLocation ? 'var(--green-deep)' : 'var(--ink-2)',
          cursor: 'pointer', flexShrink: 0, maxWidth: 180,
          fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--green)' }}>
            <circle cx="12" cy="11" r="3"/>
            <path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z"/>
          </svg>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {locState === 'loading' ? 'Locating…' : locationLabel}
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowFilters(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 999,
          border: 'none',
          background: activeFilterCount > 0 ? 'var(--green)' : 'var(--ink)',
          fontSize: 13, fontWeight: 600, color: '#fff',
          cursor: 'pointer', flexShrink: 0,
          fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
          boxShadow: activeFilterCount > 0 ? 'var(--shadow-green)' : 'var(--shadow-sm)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
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
                placeholder="Postal code, MRT, building, area…"
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

      {/* ── Sort strip — visible above map and above list results ── */}
      {viewType === 'meals' && (
        <div style={{ padding: '4px 0 8px', display: 'flex', gap: 7, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingLeft: 20, paddingRight: 20 } as React.CSSProperties}>
          {([
            { key: 'best_match'     as SortKey, label: 'Best Match', icon: false },
            { key: 'protein_dollar' as SortKey, label: 'Protein/$',  icon: true  },
            { key: 'price'          as SortKey, label: 'Price ↑',    icon: false },
            { key: 'calories'       as SortKey, label: 'Calories ↑', icon: false },
            ...(hasLocation ? [{ key: 'distance' as SortKey, label: 'Nearest', icon: false }] : []),
          ]).map(o => {
            const active = sortKey === o.key;
            return (
              <button
                key={o.key}
                onClick={() => setSortKey(o.key)}
                className={'sort-chip' + (active ? ' active' : '')}
                style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
              >
                {o.icon && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                )}
                {o.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Map view (replaces results when mapMode=true on Meals tab) ── */}
      {viewType === 'meals' && mapMode && (
        <div style={{ padding: '0 0 0' }}>
          <MapView
            pins={mapPins}
            centerLat={userLat}
            centerLng={userLng}
            hasGPS={hasLocation}
            onSearchArea={handleSearchArea}
            onSelectRestaurant={(restaurant) => {
              setFilterRestaurantId(restaurant.id);
              setMapMode(false);
            }}
          />
        </div>
      )}

      {/* ── Results ── */}
      <div style={{ padding: '8px 20px 0', display: mapMode ? 'none' : undefined }}>

        {/* MEALS */}
        {viewType === 'meals' && (() => {
          const items = searchResults
            ? searchResults.map(h => ({ item: h.item as SGMenuItem, restaurant: h.restaurant as SGRestaurant, distKm: (h as any).distKm as number|undefined, tier: 1 }))
            : filteredItems;

          if (items.length === 0) return (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: FG3 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: FG2, marginBottom: 8 }}>No meals found</div>
              <div style={{ fontSize: 13 }}>Try adjusting your filters or search terms</div>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} style={{ marginTop: 16, padding: '10px 20px', borderRadius: 20, background: GREEN, color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>Clear filters</button>
              )}
              <button
                onClick={() => setAddMealOpen(true)}
                style={{ marginTop: 12, padding: '9px 20px', borderRadius: 12, background: 'none', border: `1px solid ${BORDER}`, color: FG3, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span>＋</span> Can\'t find it? Add a meal
              </button>
              {/* #6 fallback suggestions when empty */}
              {pooledItems.length > 0 && (
                <div style={{ marginTop: 24, textAlign: 'left', background: CARD, borderRadius: 18, border: `1px solid ${BORDER}`, padding: 16, boxShadow: SHADOW }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: FG1, marginBottom: 12 }}>Other options nearby</div>
                  {pooledItems.slice(0,5).map(({ item, restaurant, distKm }) => (
                    <MenuItemCard key={`${restaurant.id}__${item.id}`} item={item} restaurant={restaurant} distKm={distKm}
                      userFlags={userFlags} onLog={() => setPendingLog({ type: 'item', item, restaurant })}
                      onUnlog={() => unlog(item.id, item.name, item.emoji)}
                      logged={loggedIds.has(item.id)}
                      isExpanded={expandedId === item.id}
                      onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      onRestaurantFilter={() => { setFilterRestaurantId(restaurant.id); setViewType('meals'); }}
                      onLogSetMeal={synth => setPendingLog({ type: 'item', item: synth, restaurant })}
                    />
                  ))}
                </div>
              )}
            </div>
          );

          return (
            <>
              <div style={{ fontSize: 12, color: FG3, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  {searchResults
                    ? `${items.length} results for "${query}"`
                    : `${items.length} meals`}
                </span>
                {!searchResults && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: GREEN }}>{daypartLabel()}</span>
                )}
                {filterRestaurantId && <span style={{ color: GREEN, fontSize: 11, fontWeight: 600 }}>from {SG_RESTAURANTS.find(r => r.id === filterRestaurantId)?.name}</span>}
              </div>

              {/* GPS prompt — shown only when no location and not filtering by restaurant */}
              {!hasLocation && !filterRestaurantId && !searchResults && locState !== 'loading' && (
                <button
                  onClick={requestLocation}
                  style={{
                    width: '100%', marginBottom: 12,
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                    background: 'rgba(30,127,92,0.06)',
                    border: '1.5px dashed rgba(30,127,92,0.3)',
                  }}
                >
                  <span style={{ fontSize: 18 }}>📍</span>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: GREEN }}>Enable GPS to find meals near you</div>
                    <div style={{ fontSize: 11, color: FG2, marginTop: 1 }}>See how far each restaurant is from your location</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: GREEN, flexShrink: 0 }}>Enable →</span>
                </button>
              )}
              {items.map(({ item, restaurant, distKm }) => (
                <MenuItemCard key={`${restaurant.id}__${item.id}`} item={item} restaurant={restaurant} distKm={distKm}
                  userFlags={userFlags} onLog={() => setPendingLog({ type: 'item', item, restaurant })}
                  onUnlog={() => unlog(item.id, item.name, item.emoji)}
                  logged={loggedIds.has(item.id)}
                  isExpanded={expandedId === item.id}
                  onToggle={() => { setExpandedId(expandedId === item.id ? null : item.id); if (expandedId !== item.id) track(Events.EAT_ITEM_EXPANDED, { itemId: item.id }); }}
                  onRestaurantFilter={filterRestaurantId ? undefined : () => { setFilterRestaurantId(restaurant.id); setViewType('meals'); }}
                  onLogSetMeal={synth => setPendingLog({ type: 'item', item: synth, restaurant })}
                />
              ))}

              {/* #6 "More options" fallback when few results */}
              {items.length > 0 && items.length < 5 && activeFilterCount > 0 && (
                <div style={{ marginTop: 12, background: CARD, borderRadius: 16, border: `1px dashed ${BORDER}`, padding: '14px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: FG2, marginBottom: 4 }}>More options outside your filters</div>
                  <div style={{ fontSize: 11, color: FG3, marginBottom: 10 }}>These don't match all your criteria but may be worth a look</div>
                  {pooledItems.filter(p => !items.find(i => i.item.id === p.item.id)).slice(0, 4).map(({ item, restaurant, distKm }) => (
                    <MenuItemCard key={`fallback__${restaurant.id}__${item.id}`} item={item} restaurant={restaurant} distKm={distKm}
                      userFlags={userFlags} onLog={() => setPendingLog({ type: 'item', item, restaurant })}
                      onUnlog={() => unlog(item.id, item.name, item.emoji)}
                      logged={loggedIds.has(item.id)}
                      isExpanded={expandedId === item.id}
                      onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      onRestaurantFilter={() => { setFilterRestaurantId(restaurant.id); setViewType('meals'); }}
                      onLogSetMeal={synth => setPendingLog({ type: 'item', item: synth, restaurant })}
                    />
                  ))}
                </div>
              )}
            </>
          );
        })()}

        {/* Add meal CTA */}
        {viewType === 'meals' && (
          <div style={{ padding: '12px 0 8px', textAlign: 'center' }}>
            <button
              onClick={() => setAddMealOpen(true)}
              style={{
                background: 'none', border: `1px solid ${BORDER}`,
                borderRadius: 12, padding: '9px 20px', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, color: FG3,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <span style={{ fontSize: 15 }}>＋</span> Can\'t find a meal? Add it
            </button>
          </div>
        )}

        {/* RESTAURANTS */}
        {viewType === 'restaurants' && (() => {
          const showGps = gpsOnlyPlaces.length > 0 && !query.trim();
          if (restaurantList.length === 0 && !showGps) return (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: FG3 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: FG2, marginBottom: 8 }}>No restaurants found</div>
            </div>
          );
          return (
            <>
              {!hasLocation && !query.trim() && locState !== 'loading' && (
                <button
                  onClick={requestLocation}
                  style={{
                    width: '100%', marginBottom: 12,
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                    background: 'rgba(30,127,92,0.06)',
                    border: '1.5px dashed rgba(30,127,92,0.3)',
                  }}
                >
                  <span style={{ fontSize: 18 }}>📍</span>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: GREEN }}>Enable GPS to find restaurants near you</div>
                    <div style={{ fontSize: 11, color: FG2, marginTop: 1 }}>See distance and discover places within walking distance</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: GREEN, flexShrink: 0 }}>Enable →</span>
                </button>
              )}
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
                {showGps && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: FG3, padding: '14px 0 4px', borderTop: `1px dashed ${BORDER}`, marginTop: 6 }}>
                      Other places near you — no menu data yet
                    </div>
                    {gpsOnlyPlaces.map(p => <GPSRestaurantCard key={p.id} place={p} />)}
                  </>
                )}
              </div>
            </>
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
        filterIncludeSetMeals={filterIncludeSetMeals} setFilterIncludeSetMeals={setFilterIncludeSetMeals}
        maxPriceNum={maxPriceNum} setMaxPriceNum={setMaxPriceNum}
        showDistance={hasLocation}
        onClear={clearAllFilters}
      />

      {pendingLog && (
        <LogConfirmSheet
          pending={pendingLog}
          onConfirm={commitLog}
          onCancel={() => setPendingLog(null)}
        />
      )}

      <AddMealSheet
        isOpen={addMealOpen}
        onClose={() => setAddMealOpen(false)}
      />

      <LogToast message={toastMsg} />
    </div>
  );
}
