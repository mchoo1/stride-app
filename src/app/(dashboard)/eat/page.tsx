'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useStrideStore } from '@/lib/store';
import {
  matchRestaurant, searchAll, searchRecipes, getMenuCategories,
  macroMatchScore, proteinPerDollar, ppdColor, filterItemsByDiet,
  resolveIngredients, calcCostPerServing,
  SG_RESTAURANTS, SG_RECIPES,
  type SGRestaurant, type SGMenuItem, type SGRecipe, type RestaurantTab,
} from '@/lib/sgFoodDb';
import type { DietaryFlag } from '@/types';

// ─── Nearby place from Google Places API ─────────────────────────────────────
interface NearbyPlace {
  id: string; name: string; type: string; distance: string; distKm?: number;
  rating: number | null; priceLevel: string | null;
  hours: string; emoji: string; mapsUrl: string;
}

// ─── Cuisine-type fallback when place isn't in DB ─────────────────────────────
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

// ─── Diet labels ──────────────────────────────────────────────────────────────
const DIET_LABEL: Record<DietaryFlag, string> = {
  vegetarian: '🥦 Vegetarian', vegan: '🌱 Vegan',
  gluten_free: '🌾 Gluten-Free', lactose_free: '🥛 Lactose-Free',
  keto: '🥑 Keto', halal: '☪️ Halal', kosher: '✡️ Kosher',
};

// ─── Sort options ─────────────────────────────────────────────────────────────
type SortKey = 'best_match' | 'protein_dollar' | 'price' | 'distance';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

// ── Diet fit badge ────────────────────────────────────────────────────────────
type DietFit = 'great' | 'check' | 'warn' | 'neutral';

function getDietFit(compatibleWith: DietaryFlag[], userFlags: DietaryFlag[]): DietFit {
  if (!userFlags.length) return 'neutral';
  if (userFlags.every(f => compatibleWith.includes(f))) return 'great';
  if (userFlags.some(f => compatibleWith.includes(f)))  return 'check';
  return 'warn';
}

function DietBadge({ fit }: { fit: DietFit }) {
  if (fit === 'neutral') return null;
  const cfg = {
    great: { bg: 'rgba(0,230,118,0.12)',   border: 'rgba(0,230,118,0.25)',   color: '#00E676', label: '✓ Fits your diet'          },
    check: { bg: 'rgba(255,209,102,0.12)', border: 'rgba(255,209,102,0.25)', color: '#FFD166', label: '⚠ Check before ordering'   },
    warn:  { bg: 'rgba(255,90,90,0.10)',   border: 'rgba(255,90,90,0.20)',   color: '#FF5A5A', label: '✕ May not suit your diet'  },
  }[fit];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

// ── Protein/$ badge ───────────────────────────────────────────────────────────
function PpdBadge({ protein, price }: { protein: number; price: number }) {
  const v = proteinPerDollar(protein, price);
  const c = ppdColor(v);
  return (
    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6, background: `${c}18`, border: `1px solid ${c}40`, color: c }}>
      {v}g/$
    </span>
  );
}

// ── Search bar ────────────────────────────────────────────────────────────────
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
          width: '100%', background: '#161622', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, padding: '11px 38px 11px 40px',
          fontSize: 14, color: '#F0F0F8', outline: 'none',
          fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
        }}
      />
      {value && (
        <button onClick={() => onChange('')} style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#6E6E90', fontSize: 16, lineHeight: 1, padding: 2,
        }}>✕</button>
      )}
    </div>
  );
}

// ── Sort bar ──────────────────────────────────────────────────────────────────
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
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, marginBottom: 14 }}>
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

// ── Single menu item row ──────────────────────────────────────────────────────
function MenuItemRow({
  item, userFlags, onLog, logged,
}: {
  item: SGMenuItem; userFlags: DietaryFlag[];
  onLog: (item: SGMenuItem) => void; logged: boolean;
}) {
  const fit = getDietFit(item.compatibleWith, userFlags);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '11px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{ fontSize: 22, flexShrink: 0, width: 32, textAlign: 'center' }}>{item.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#F0F0F8' }}>{item.name}</span>
          {item.isPopular && (
            <span style={{ fontSize: 9, fontWeight: 800, color: '#FFD166', background: 'rgba(255,209,102,0.12)', borderRadius: 5, padding: '1px 5px' }}>⭐ POPULAR</span>
          )}
        </div>
        {item.description && (
          <div style={{ fontSize: 11, color: '#6E6E90', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.description}</div>
        )}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#FF6B35' }}>${item.price.toFixed(2)}</span>
          <span style={{ fontSize: 10, color: '#A8A8C8' }}>
            {item.calories}kcal · P{item.protein}g · C{item.carbs}g · F{item.fat}g
          </span>
          <PpdBadge protein={item.protein} price={item.price} />
          <DietBadge fit={fit} />
        </div>
      </div>
      <button onClick={() => onLog(item)} style={{
        flexShrink: 0, borderRadius: 10, padding: '7px 10px',
        fontSize: 11, fontWeight: 800, cursor: 'pointer', border: 'none',
        background: logged ? 'rgba(0,230,118,0.15)' : 'rgba(255,107,53,0.12)',
        color:      logged ? '#00E676'              : '#FF6B35',
        transition: 'all .2s',
      }}>
        {logged ? '✓' : '+ Log'}
      </button>
    </div>
  );
}

// ── Expanded restaurant panel with category tabs ──────────────────────────────
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
  const [activeCat, setActiveCat] = useState(categories[0] ?? 'All');
  const [showDietOnly, setShowDietOnly] = useState(false);

  const visibleItems = useMemo(() => {
    let items = restaurant.menu;
    if (activeCat !== 'All') items = items.filter(i => i.category === activeCat);
    if (showDietOnly && userFlags.length) items = filterItemsByDiet(items, userFlags);
    return items;
  }, [restaurant.menu, activeCat, showDietOnly, userFlags]);

  // Best match item across full menu
  const bestItem = useMemo(() => {
    if (!restaurant.menu.length) return null;
    return [...restaurant.menu].sort(
      (a, b) => macroMatchScore(b, remaining) - macroMatchScore(a, remaining)
    )[0];
  }, [restaurant.menu, remaining]);

  return (
    <div style={{ background: '#161622', borderRadius: '0 0 18px 18px', borderTop: 'none' }}>

      {/* Best match callout */}
      {bestItem && (
        <div style={{
          margin: '0 14px 0', padding: '10px 12px',
          background: 'rgba(255,107,53,0.07)', borderRadius: '0 0 12px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#FF6B35' }}>🏆 BEST MATCH FOR YOUR GOALS  </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#F0F0F8' }}>{bestItem.name}</span>
          <span style={{ fontSize: 11, color: '#6E6E90' }}> · ${bestItem.price.toFixed(2)} · P{bestItem.protein}g</span>
        </div>
      )}

      {/* Category tabs */}
      {categories.length > 1 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '10px 14px 0', scrollbarWidth: 'none' }}>
          {['All', ...categories].map(cat => (
            <button key={cat} onClick={() => setActiveCat(cat)} style={{
              flexShrink: 0, borderRadius: 999, padding: '5px 11px',
              fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
              background: activeCat === cat ? '#FF6B35' : '#1E1E2E',
              color:      activeCat === cat ? '#fff'    : '#6E6E90',
              transition: 'all .15s',
            }}>{cat}</button>
          ))}
        </div>
      )}

      {/* Diet filter toggle */}
      {userFlags.length > 0 && (
        <div style={{ padding: '8px 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setShowDietOnly(!showDietOnly)} style={{
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
            background: showDietOnly ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.04)',
            color:      showDietOnly ? '#00E676'              : '#6E6E90',
            border: `1px solid ${showDietOnly ? 'rgba(0,230,118,0.25)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 999, padding: '4px 10px', transition: 'all .2s',
          }}>
            {showDietOnly ? '✓ ' : ''}My diet only
          </button>
          <span style={{ fontSize: 10, color: '#6E6E90' }}>{visibleItems.length} item{visibleItems.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Item list */}
      <div style={{ padding: '8px 0 4px' }}>
        {visibleItems.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: '#6E6E90' }}>
            No items match your filters
          </div>
        ) : (
          visibleItems.map(item => (
            <MenuItemRow
              key={item.id}
              item={item}
              userFlags={userFlags}
              onLog={i => onLog(i, restaurant)}
              logged={logged.has(item.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Restaurant card (collapsed + expandable) ──────────────────────────────────
function RestaurantCard({
  restaurant, isExpanded, onToggle, userFlags, remaining, onLog, logged,
  badge, distanceLabel, rating,
}: {
  restaurant: SGRestaurant;
  isExpanded: boolean;
  onToggle: () => void;
  userFlags: DietaryFlag[];
  remaining: { protein: number; calories: number; carbs: number };
  onLog: (item: SGMenuItem, restaurant: SGRestaurant) => void;
  logged: Set<string>;
  badge?: React.ReactNode;
  distanceLabel?: string;
  rating?: number | null;
}) {
  const dietFit = getDietFit(restaurant.dietTags, userFlags);
  const itemCount = restaurant.menu.length;

  return (
    <div style={{ marginBottom: 10 }}>
      {/* Header row */}
      <button onClick={onToggle} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 14px', cursor: 'pointer', textAlign: 'left',
        background: isExpanded ? 'rgba(255,107,53,0.06)' : '#161622',
        border: `1px solid ${isExpanded ? 'rgba(255,107,53,0.25)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: isExpanded ? '18px 18px 0 0' : 18,
        transition: 'all .15s',
      }}>
        <div style={{
          width: 46, height: 46, borderRadius: 14, flexShrink: 0,
          background: 'rgba(255,107,53,0.10)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        }}>
          {restaurant.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#F0F0F8' }}>{restaurant.name}</span>
            <span style={{ fontSize: 11, color: '#A8A8C8' }}>{restaurant.priceRange}</span>
            {badge}
          </div>
          <div style={{ fontSize: 11, color: '#6E6E90', marginBottom: 4 }}>
            {restaurant.cuisine}
            {distanceLabel ? ` · ${distanceLabel}` : ''}
            {rating != null ? ` · ⭐ ${rating.toFixed(1)}` : ''}
            {itemCount > 0 ? ` · ${itemCount} items` : ''}
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            <DietBadge fit={dietFit} />
            {itemCount === 0 && (
              <span style={{ fontSize: 10, color: '#6E6E90', fontStyle: 'italic' }}>Menu data coming soon</span>
            )}
          </div>
        </div>
        <span style={{ fontSize: 13, color: isExpanded ? '#FF6B35' : '#6E6E90', flexShrink: 0 }}>
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>

      {/* Expanded menu */}
      {isExpanded && itemCount > 0 && (
        <RestaurantMenuPanel
          restaurant={restaurant}
          userFlags={userFlags}
          remaining={remaining}
          onLog={onLog}
          logged={logged}
        />
      )}
      {isExpanded && itemCount === 0 && (
        <div style={{
          background: '#161622', border: '1px solid rgba(255,255,255,0.06)', borderTop: 'none',
          borderRadius: '0 0 18px 18px', padding: '16px',
          textAlign: 'center', fontSize: 12, color: '#6E6E90',
        }}>
          Menu data for this restaurant hasn&apos;t been added yet.{' '}
          <span style={{ color: '#4A9EFF' }}>Contribute →</span>
        </div>
      )}
    </div>
  );
}

// ── Recipe card ───────────────────────────────────────────────────────────────
function RecipeCard({
  recipe, userFlags, onLog, logged,
}: {
  recipe: SGRecipe; userFlags: DietaryFlag[];
  onLog: (recipe: SGRecipe) => void; logged: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const fit = getDietFit(recipe.compatibleWith, userFlags);
  const resolved = resolveIngredients(recipe);
  const actualCost = calcCostPerServing(recipe) ?? recipe.costPerServing;
  const m = recipe.macrosPerServing;

  return (
    <div style={{ marginBottom: 10 }}>
      <button onClick={() => setExpanded(!expanded)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 14px', cursor: 'pointer', textAlign: 'left',
        background: expanded ? 'rgba(0,230,118,0.05)' : '#161622',
        border: `1px solid ${expanded ? 'rgba(0,230,118,0.20)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: expanded ? '18px 18px 0 0' : 18,
        transition: 'all .15s',
      }}>
        <div style={{
          width: 46, height: 46, borderRadius: 14, flexShrink: 0,
          background: 'rgba(0,230,118,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        }}>
          {recipe.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#F0F0F8' }}>{recipe.name}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#A78BFA', background: 'rgba(167,139,250,0.12)', borderRadius: 5, padding: '1px 6px' }}>{recipe.category}</span>
          </div>
          <div style={{ fontSize: 11, color: '#6E6E90', marginBottom: 4 }}>
            {recipe.cuisine} · {recipe.prepMins + recipe.cookMins} min · {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#00E676' }}>${actualCost.toFixed(2)}/serving</span>
            <span style={{ fontSize: 10, color: '#A8A8C8' }}>P{m.protein}g · C{m.carbs}g · F{m.fat}g · {m.calories}kcal</span>
            <PpdBadge protein={m.protein} price={actualCost} />
            <DietBadge fit={fit} />
          </div>
        </div>
        <span style={{ fontSize: 13, color: expanded ? '#00E676' : '#6E6E90', flexShrink: 0 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {/* Expanded recipe detail */}
      {expanded && (
        <div style={{
          background: '#161622', border: '1px solid rgba(0,230,118,0.20)', borderTop: 'none',
          borderRadius: '0 0 18px 18px', padding: '14px',
        }}>
          <p style={{ fontSize: 12, color: '#A8A8C8', margin: '0 0 12px', lineHeight: 1.6 }}>{recipe.description}</p>

          {/* Ingredient list */}
          <div style={{ fontSize: 12, fontWeight: 800, color: '#F0F0F8', marginBottom: 8 }}>🛒 Ingredients</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {resolved.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{r.ingredient?.emoji ?? '🥘'}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, color: '#F0F0F8' }}>
                    {r.ingredient?.name ?? `Ingredient #${i + 1} (not in DB)`}
                  </span>
                  {r.note && <span style={{ fontSize: 11, color: '#6E6E90' }}> — {r.note}</span>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: '#A8A8C8' }}>×{r.quantity} {r.ingredient?.unit ?? 'unit'}</div>
                  {r.ingredient && (
                    <div style={{ fontSize: 10, color: '#6E6E90' }}>{r.ingredient.store} · ${(r.ingredient.price * r.quantity).toFixed(2)}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Steps */}
          {recipe.steps.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#F0F0F8', marginBottom: 8 }}>👨‍🍳 Steps</div>
              <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recipe.steps.map((step, i) => (
                  <li key={i} style={{ fontSize: 12, color: '#A8A8C8', lineHeight: 1.6 }}>{step}</li>
                ))}
              </ol>
            </>
          )}

          <button onClick={() => onLog(recipe)} style={{
            width: '100%', marginTop: 14, padding: '12px 0', borderRadius: 14, border: 'none',
            fontSize: 13, fontWeight: 800, cursor: 'pointer',
            background: logged ? 'rgba(0,230,118,0.15)' : '#00E676',
            color:      logged ? '#00E676'              : '#000',
            transition: 'all .2s',
          }}>
            {logged ? '✓ Logged!' : `Log 1 Serving (${m.calories} kcal)`}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: 44, marginBottom: 12 }}>{emoji}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#A8A8C8', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: '#6E6E90', lineHeight: 1.6 }}>{subtitle}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
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

  // ── UI state ────────────────────────────────────────────────────────────────
  const [tab,         setTab        ] = useState<RestaurantTab | 'store'>('restaurant');
  const [sortBy,      setSortBy     ] = useState<SortKey>('best_match');
  const [query,       setQuery      ] = useState('');
  const [expandedId,  setExpandedId ] = useState<string | null>(null);
  const [logged,      setLogged     ] = useState<Set<string>>(new Set());
  const [recipeLogged,setRecipeLogged] = useState<Set<string>>(new Set());

  // Reset search & expanded when tab changes
  const switchTab = (t: typeof tab) => { setTab(t); setQuery(''); setExpandedId(null); };

  // ── Nearby places (restaurant tab only) ─────────────────────────────────────
  const [places,   setPlaces  ] = useState<NearbyPlace[]>([]);
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
      setLocError(e instanceof Error ? e.message : 'Failed to load');
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

  // ── Enrich GPS places with DB match ─────────────────────────────────────────
  const enrichedPlaces = useMemo(() =>
    places.map(p => ({ ...p, dbMatch: matchRestaurant(p.name) })),
    [places],
  );

  // ── Search results ───────────────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    if (tab === 'store') {
      return { type: 'recipes' as const, recipes: searchRecipes(query) };
    }
    const { restaurants, items } = searchAll(query, tab as RestaurantTab);
    return { type: 'food' as const, restaurants, items };
  }, [query, tab]);

  // ── Grab & Go DB restaurants (sorted) ────────────────────────────────────────
  const grabGoRestaurants = useMemo(() => {
    const base = SG_RESTAURANTS.filter(r => r.tab === 'grab_go');
    return [...base].sort((a, b) => {
      if (sortBy === 'protein_dollar') {
        const aBest = Math.max(...(a.menu.map(i => proteinPerDollar(i.protein, i.price))), 0);
        const bBest = Math.max(...(b.menu.map(i => proteinPerDollar(i.protein, i.price))), 0);
        return bBest - aBest;
      }
      if (sortBy === 'price') {
        const aMin = Math.min(...(a.menu.map(i => i.price)), Infinity);
        const bMin = Math.min(...(b.menu.map(i => i.price)), Infinity);
        return aMin - bMin;
      }
      return a.name.localeCompare(b.name);
    });
  }, [sortBy]);

  // ── Log helpers ──────────────────────────────────────────────────────────────
  const logMenuItem = useCallback((item: SGMenuItem, restaurant: SGRestaurant) => {
    store.addFoodEntry({
      foodItemId: item.id,
      name:       `${item.name} (${restaurant.name})`,
      emoji:      item.emoji,
      mealType:   'lunch',
      quantity:   100,
      calories:   item.calories,
      protein:    item.protein,
      carbs:      item.carbs,
      fat:        item.fat,
    });
    setLogged(s => new Set([...s, item.id]));
    setTimeout(() => setLogged(s => { const n = new Set(s); n.delete(item.id); return n; }), 2000);
  }, [store]);

  const logRecipe = useCallback((recipe: SGRecipe) => {
    const m = recipe.macrosPerServing;
    store.addFoodEntry({
      foodItemId: recipe.id,
      name:       `${recipe.name} (1 serving)`,
      emoji:      recipe.emoji,
      mealType:   'dinner',
      quantity:   100,
      calories:   m.calories,
      protein:    m.protein,
      carbs:      m.carbs,
      fat:        m.fat,
    });
    setRecipeLogged(s => new Set([...s, recipe.id]));
    setTimeout(() => setRecipeLogged(s => { const n = new Set(s); n.delete(recipe.id); return n; }), 2000);
  }, [store]);

  // ── Styles ───────────────────────────────────────────────────────────────────
  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
    fontSize: 12, fontWeight: 700, cursor: 'pointer',
    background: active ? 'rgba(255,107,53,0.15)' : 'transparent',
    color:      active ? '#FF6B35' : '#6E6E90',
    transition: 'all .2s',
  });

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#0C0C14', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div style={{ padding: '52px 20px 16px' }}>
        <h1 style={{ color: '#F0F0F8', fontSize: 22, fontWeight: 900, margin: '0 0 10px' }}>
          What to Eat 🍜
        </h1>

        {/* Kcal remaining */}
        <div style={{
          background: 'rgba(255,107,53,0.12)', borderRadius: 14, padding: '9px 14px',
          display: 'inline-flex', alignItems: 'center', gap: 8,
          border: '1px solid rgba(255,107,53,0.20)', marginBottom: 10,
        }}>
          <span style={{ fontSize: 15 }}>🎯</span>
          <span style={{ color: '#FF6B35', fontSize: 14, fontWeight: 700 }}>{remaining} kcal remaining today</span>
        </div>

        {/* Macro gap + diet flags */}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {remProtein > 0 && (
            <div style={{ background: 'rgba(74,158,255,0.10)', border: '1px solid rgba(74,158,255,0.25)', borderRadius: 10, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#4A9EFF' }}>
              Need {remProtein}g protein
            </div>
          )}
          {remCarbs > 0 && (
            <div style={{ background: 'rgba(255,209,102,0.10)', border: '1px solid rgba(255,209,102,0.25)', borderRadius: 10, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#FFD166' }}>
              Need {remCarbs}g carbs
            </div>
          )}
          {userFlags.map(f => (
            <div key={f} style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.20)', borderRadius: 10, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#00E676' }}>
              {DIET_LABEL[f]}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px 100px' }}>

        {/* ── Tab bar ── */}
        <div style={{
          background: '#161622', borderRadius: 16, padding: 4,
          display: 'flex', gap: 4, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 14,
        }}>
          <button style={tabBtn(tab === 'restaurant')} onClick={() => switchTab('restaurant')}>🍽️ Restaurant</button>
          <button style={tabBtn(tab === 'grab_go')}    onClick={() => switchTab('grab_go')}>🥡 Grab & Go</button>
          <button style={tabBtn(tab === 'store')}      onClick={() => switchTab('store')}>🛒 Store</button>
        </div>

        {/* ── Search bar ── */}
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder={
            tab === 'restaurant' ? 'Search restaurants or dishes…' :
            tab === 'grab_go'    ? 'Search brands or ready-to-eat items…' :
            'Search recipes or ingredients…'
          }
        />

        {/* ── Sort bar (not shown during search) ── */}
        {!query && tab !== 'store' && (
          <SortBar
            active={sortBy}
            onChange={setSortBy}
            showDistance={tab === 'restaurant'}
          />
        )}

        {/* ══════════ RESTAURANT TAB ══════════ */}
        {tab === 'restaurant' && (
          <>
            {/* Search results */}
            {searchResults?.type === 'food' && (
              <>
                {/* Matching restaurants from DB */}
                {searchResults.restaurants.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#6E6E90', marginBottom: 10 }}>
                      {searchResults.restaurants.length} restaurant{searchResults.restaurants.length !== 1 ? 's' : ''} in database
                    </div>
                    {searchResults.restaurants.map(r => (
                      <RestaurantCard
                        key={r.id}
                        restaurant={r}
                        isExpanded={expandedId === r.id}
                        onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
                        userFlags={userFlags}
                        remaining={macroRem}
                        onLog={logMenuItem}
                        logged={logged}
                        badge={<span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(74,158,255,0.15)', color: '#4A9EFF', borderRadius: 5, padding: '1px 5px' }}>📋 IN DATABASE</span>}
                      />
                    ))}
                  </>
                )}

                {/* Matching menu items */}
                {searchResults.items.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#6E6E90', margin: '14px 0 10px' }}>
                      {searchResults.items.length} menu item{searchResults.items.length !== 1 ? 's' : ''}
                    </div>
                    <div style={{ background: '#161622', borderRadius: 18, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      {searchResults.items.map(({ restaurant, item }) => (
                        <div key={`${restaurant.id}-${item.id}`}>
                          <div style={{ padding: '6px 14px 0', fontSize: 10, fontWeight: 700, color: '#6E6E90' }}>{restaurant.name}</div>
                          <MenuItemRow item={item} userFlags={userFlags} onLog={i => logMenuItem(i, restaurant)} logged={logged.has(item.id)} />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {searchResults.restaurants.length === 0 && searchResults.items.length === 0 && (
                  <EmptyState emoji="🔍" title="No results" subtitle={`"${query}" not found in the database yet.\nCheck back as more restaurants are added.`} />
                )}
              </>
            )}

            {/* No search — show GPS nearby */}
            {!query && (
              <>
                {/* Location states */}
                {(locState === 'locating' || locState === 'fetching') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid #FF6B35', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}/>
                    <span style={{ fontSize: 13, color: '#6E6E90' }}>
                      {locState === 'locating' ? 'Getting your location…' : 'Finding nearby restaurants…'}
                    </span>
                  </div>
                )}
                {locState === 'error' && (
                  <div style={{ background: 'rgba(255,90,90,0.08)', border: '1px solid rgba(255,90,90,0.20)', borderRadius: 14, padding: '12px 14px', marginBottom: 12, display: 'flex', gap: 8 }}>
                    <span>⚠️</span><span style={{ fontSize: 12, color: '#FF5A5A' }}>{locError}</span>
                  </div>
                )}
                {locState === 'no_key' && (
                  <div style={{ background: 'rgba(74,158,255,0.06)', borderRadius: 14, padding: '12px 14px', marginBottom: 12, display: 'flex', gap: 8, border: '1px solid rgba(74,158,255,0.12)' }}>
                    <span>💡</span>
                    <span style={{ fontSize: 12, color: '#4A9EFF' }}>
                      Add <code style={{ background: '#1E1E2E', borderRadius: 4, padding: '1px 4px' }}>GOOGLE_PLACES_API_KEY</code> to show restaurants near you.
                    </span>
                  </div>
                )}

                {/* GPS place list */}
                {locState === 'done' && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#6E6E90', marginBottom: 10 }}>
                      {enrichedPlaces.length} places near you · {enrichedPlaces.filter(p => p.dbMatch).length} with full menu data
                    </div>
                    {enrichedPlaces.length === 0 && (
                      <EmptyState emoji="🗺️" title="No restaurants found nearby" subtitle="Try moving to a different area or check your location settings." />
                    )}
                    {enrichedPlaces.map(place => {
                      const fallback = CUISINE_FALLBACK[place.type] ?? FALLBACK_DEFAULT;

                      // Matched to DB — show restaurant card with full menu
                      if (place.dbMatch) {
                        return (
                          <RestaurantCard
                            key={place.id}
                            restaurant={place.dbMatch}
                            isExpanded={expandedId === place.dbMatch.id}
                            onToggle={() => setExpandedId(expandedId === place.dbMatch!.id ? null : place.dbMatch!.id)}
                            userFlags={userFlags}
                            remaining={macroRem}
                            onLog={logMenuItem}
                            logged={logged}
                            badge={<span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(0,230,118,0.12)', color: '#00E676', borderRadius: 5, padding: '1px 5px' }}>✓ FULL MENU</span>}
                            distanceLabel={place.distance}
                            rating={place.rating}
                          />
                        );
                      }

                      // Not in DB — show fallback estimate
                      const fit = getDietFit(fallback.compatibleWith, userFlags);
                      return (
                        <div key={place.id} style={{
                          background: '#161622', borderRadius: 18, padding: 14,
                          border: '1px solid rgba(255,255,255,0.06)', marginBottom: 10,
                          display: 'flex', alignItems: 'center', gap: 12,
                        }}>
                          <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,107,53,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                            {place.emoji}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#F0F0F8', marginBottom: 2 }}>{place.name}</div>
                            <div style={{ fontSize: 11, color: '#6E6E90', marginBottom: 4 }}>
                              {place.type} · {place.distance}{place.rating ? ` · ⭐ ${place.rating.toFixed(1)}` : ''} · {place.hours}
                            </div>
                            <div style={{ fontSize: 11, color: '#A8A8C8', marginBottom: 5 }}>
                              Try: <strong style={{ color: '#F0F0F8' }}>{fallback.dish}</strong> · ~${fallback.price.toFixed(2)} · P{fallback.protein}g · {fallback.calories}kcal
                            </div>
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                              <PpdBadge protein={fallback.protein} price={fallback.price} />
                              <DietBadge fit={fit} />
                              <span style={{ fontSize: 9, color: '#6E6E90', fontStyle: 'italic' }}>estimated · not in DB</span>
                            </div>
                          </div>
                          <a href={place.mapsUrl} target="_blank" rel="noopener noreferrer" style={{
                            flexShrink: 0, background: 'rgba(255,107,53,0.12)', color: '#FF6B35',
                            borderRadius: 10, padding: '7px 10px', fontSize: 11, fontWeight: 700,
                            textDecoration: 'none', border: '1px solid rgba(255,107,53,0.20)',
                          }}>Map →</a>
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* ══════════ GRAB & GO TAB ══════════ */}
        {tab === 'grab_go' && (
          <>
            {/* Search results */}
            {searchResults?.type === 'food' && (
              <>
                {searchResults.restaurants.length === 0 && searchResults.items.length === 0 ? (
                  <EmptyState emoji="🔍" title="No results" subtitle={`"${query}" not found yet. More brands coming soon.`} />
                ) : (
                  <>
                    {searchResults.restaurants.map(r => (
                      <RestaurantCard
                        key={r.id} restaurant={r}
                        isExpanded={expandedId === r.id}
                        onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
                        userFlags={userFlags} remaining={macroRem}
                        onLog={logMenuItem} logged={logged}
                      />
                    ))}
                    {searchResults.items.length > 0 && (
                      <div style={{ background: '#161622', borderRadius: 18, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        {searchResults.items.map(({ restaurant, item }) => (
                          <div key={`${restaurant.id}-${item.id}`}>
                            <div style={{ padding: '6px 14px 0', fontSize: 10, fontWeight: 700, color: '#6E6E90' }}>{restaurant.name}</div>
                            <MenuItemRow item={item} userFlags={userFlags} onLog={i => logMenuItem(i, restaurant)} logged={logged.has(item.id)} />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Browse by brand */}
            {!query && (
              grabGoRestaurants.length === 0 ? (
                <EmptyState
                  emoji="🥡"
                  title="Grab & Go database coming soon"
                  subtitle="We're adding Old Chang Kee, Ya Kun, 7-Eleven, BreadTalk and more. Check back shortly."
                />
              ) : (
                grabGoRestaurants.map(r => (
                  <RestaurantCard
                    key={r.id} restaurant={r}
                    isExpanded={expandedId === r.id}
                    onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    userFlags={userFlags} remaining={macroRem}
                    onLog={logMenuItem} logged={logged}
                  />
                ))
              )
            )}
          </>
        )}

        {/* ══════════ STORE / RECIPES TAB ══════════ */}
        {tab === 'store' && (
          <>
            {/* Search results */}
            {query && searchResults?.type === 'recipes' && (
              searchResults.recipes.length === 0 ? (
                <EmptyState emoji="🔍" title="No recipes found" subtitle={`Try searching "high protein", "budget", or a cuisine type.`} />
              ) : (
                searchResults.recipes.map(r => (
                  <RecipeCard key={r.id} recipe={r} userFlags={userFlags} onLog={logRecipe} logged={recipeLogged.has(r.id)} />
                ))
              )
            )}

            {/* All recipes */}
            {!query && (
              SG_RECIPES.length === 0 ? (
                <EmptyState
                  emoji="🛒"
                  title="Recipes coming soon"
                  subtitle={"We're building budget-friendly, macro-optimised recipes using FairPrice and Cold Storage ingredients.\n\nHigh Protein, Meal Prep, and Budget Meals will be the first categories."}
                />
              ) : (
                SG_RECIPES.map(r => (
                  <RecipeCard key={r.id} recipe={r} userFlags={userFlags} onLog={logRecipe} logged={recipeLogged.has(r.id)} />
                ))
              )
            )}
          </>
        )}

      </div>
    </div>
  );
}
