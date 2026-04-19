'use client';
import { useState } from 'react';
import { useStrideStore } from '@/lib/store';

/* ── Design tokens ── */
const BG     = '#F7F8FB';
const CARD   = '#FFFFFF';
const BORDER = '#E5E9F2';
const FG1    = '#0F1B2D';
const FG2    = '#5B6576';
const FG3    = '#8B95A7';
const GREEN  = '#1E7F5C';
const SHADOW = '0 1px 2px rgba(15,27,45,0.04), 0 2px 6px rgba(15,27,45,0.05)';

const TABS = ['All', 'Restaurants', 'Delivery', 'Grocery'];

const MEALS = [
  {
    id: 'm1', type: 'restaurant', emoji: '🥗',
    name: 'Grilled Chicken Salad', restaurant: 'SaladStop!',
    distance: '0.8 km', deliveryTime: null, price: 14.90,
    cal: 420, p: 42, c: 24, f: 16,
    match: 94, tags: ['High Protein', 'Low Carb'],
    open: true, deliveryApp: null,
    valueScore: '$0.36/g protein',
  },
  {
    id: 'm2', type: 'delivery', emoji: '🍱',
    name: 'Salmon Rice Bowl', restaurant: 'The Grain Traders',
    distance: '1.4 km', deliveryTime: '25-35 min', price: 18.50,
    cal: 510, p: 38, c: 52, f: 14,
    match: 88, tags: ['Balanced', 'Omega-3'],
    open: true, deliveryApp: 'GrabFood',
    valueScore: '$0.49/g protein',
  },
  {
    id: 'm3', type: 'grocery', emoji: '🥩',
    name: 'Quest Protein Bar (Chocolate Chip)', restaurant: 'FairPrice',
    distance: '0.3 km', deliveryTime: null, price: 4.20,
    cal: 190, p: 21, c: 22, f: 7,
    match: 91, tags: ['High Protein', 'Convenient', 'Low Cal'],
    open: true, deliveryApp: null,
    valueScore: '$0.20/g protein',
  },
  {
    id: 'm4', type: 'delivery', emoji: '🍗',
    name: 'Grilled Chicken Wrap', restaurant: 'SaladBox',
    distance: '2.1 km', deliveryTime: '30-45 min', price: 12.90,
    cal: 385, p: 35, c: 38, f: 9,
    match: 85, tags: ['High Protein', 'Wrap'],
    open: true, deliveryApp: 'Deliveroo',
    valueScore: '$0.37/g protein',
  },
  {
    id: 'm5', type: 'restaurant', emoji: '🍜',
    name: 'Tom Yum Soup with Prawns', restaurant: 'Bangkok Street',
    distance: '1.1 km', deliveryTime: null, price: 10.50,
    cal: 295, p: 28, c: 22, f: 8,
    match: 80, tags: ['Low Cal', 'Seafood'],
    open: true, deliveryApp: null,
    valueScore: '$0.38/g protein',
  },
  {
    id: 'm6', type: 'grocery', emoji: '🧀',
    name: 'Chobani Greek Yogurt Plain 0%', restaurant: 'Cold Storage',
    distance: '0.6 km', deliveryTime: null, price: 3.80,
    cal: 90, p: 17, c: 6, f: 0,
    match: 76, tags: ['Low Fat', 'High Protein', 'Budget'],
    open: true, deliveryApp: null,
    valueScore: '$0.22/g protein',
  },
];

const DELIVERY_APPS: Record<string, { color: string }> = {
  GrabFood:    { color: '#00875A' },
  Deliveroo:   { color: '#00CCBC' },
  'Uber Eats': { color: '#333333' },
};

function MacroChip({ label, val, bg, color }: { label: string; val: number; bg: string; color: string }) {
  return (
    <div style={{
      background: bg, borderRadius: 8, padding: '4px 8px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 44,
    }}>
      <span style={{ fontSize: 11, fontWeight: 800, color }}>{val}g</span>
      <span style={{ fontSize: 9, color: FG3 }}>{label}</span>
    </div>
  );
}

export default function RecommendationsPage() {
  const store   = useStrideStore();
  const profile = store.profile;
  const totals  = store.getTodayTotals();
  const [activeTab, setActiveTab] = useState('All');
  const [budget, setBudget] = useState(false);

  const remaining = {
    cal: Math.max(0, profile.targetCalories - totals.calories),
    p:   Math.max(0, profile.targetProtein  - totals.protein),
    c:   Math.max(0, profile.targetCarbs    - totals.carbs),
    f:   Math.max(0, profile.targetFat      - totals.fat),
  };

  const filtered = MEALS.filter(m => {
    if (activeTab === 'Restaurants') return m.type === 'restaurant';
    if (activeTab === 'Delivery')    return m.type === 'delivery';
    if (activeTab === 'Grocery')     return m.type === 'grocery';
    return true;
  }).filter(m => !budget || m.price <= 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: BG }}>

      {/* ── Header ── */}
      <div style={{ padding: '52px 20px 16px' }}>
        <h1 style={{ color: FG1, fontSize: 24, fontWeight: 900, margin: '0 0 4px', fontFamily: "'Anton', Impact, sans-serif", letterSpacing: '-0.3px' }}>
          MEAL IDEAS
        </h1>
        <p style={{ color: FG3, fontSize: 14, margin: 0 }}>Matched to your remaining macros</p>
      </div>

      <div style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 100 }}>

        {/* Remaining macros banner */}
        <div style={{
          background: CARD, borderRadius: 18, padding: '14px 16px',
          border: `1px solid ${BORDER}`, boxShadow: SHADOW,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: FG3, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Your Remaining Macros
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { l: 'Calories', v: remaining.cal, unit: 'kcal', color: '#D04E36', bg: 'rgba(208,78,54,0.08)' },
              { l: 'Protein',  v: remaining.p,   unit: 'g',    color: '#2E6FB8', bg: 'rgba(46,111,184,0.08)' },
              { l: 'Carbs',    v: remaining.c,   unit: 'g',    color: '#C98A2E', bg: 'rgba(201,138,46,0.08)' },
              { l: 'Fat',      v: remaining.f,   unit: 'g',    color: GREEN,     bg: 'rgba(30,127,92,0.08)'  },
            ].map(r => (
              <div key={r.l} style={{ background: r.bg, borderRadius: 10, padding: '8px 4px', textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: r.color, lineHeight: 1, fontFamily: "'Anton', Impact, sans-serif" }}>
                  {r.v}
                </div>
                <div style={{ fontSize: 9, color: r.color, fontWeight: 600, marginTop: 1 }}>{r.unit}</div>
                <div style={{ fontSize: 9, color: FG3, marginTop: 2 }}>{r.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs + budget filter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding: '7px 14px', borderRadius: 20, border: 'none',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                background: activeTab === t ? GREEN : CARD,
                color:      activeTab === t ? '#fff' : FG2,
                boxShadow:  activeTab === t ? '0 2px 8px rgba(30,127,92,0.25)' : SHADOW,
                transition: 'all .15s',
              }}>{t}</button>
            ))}
          </div>
          <button onClick={() => setBudget(!budget)} style={{
            padding: '7px 12px', borderRadius: 20, border: `1px solid ${budget ? '#C98A2E' : BORDER}`,
            fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            background: budget ? 'rgba(201,138,46,0.1)' : CARD,
            color: budget ? '#C98A2E' : FG2,
            transition: 'all .15s',
          }}>
            💰 Under $10
          </button>
        </div>

        {/* Location bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: CARD, borderRadius: 14, padding: '10px 14px',
          border: `1px solid ${BORDER}`, boxShadow: SHADOW,
        }}>
          <span style={{ fontSize: 14 }}>📍</span>
          <span style={{ flex: 1, fontSize: 12, color: FG3 }}>Orchard Road, Singapore · Within 2km</span>
          <button style={{
            fontSize: 12, fontWeight: 700, color: GREEN,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}>Change</button>
        </div>

        {/* Meal cards */}
        {filtered.map(meal => {
          const matchColor = meal.match >= 90 ? GREEN : meal.match >= 80 ? '#C98A2E' : '#D04E36';
          return (
            <div key={meal.id} style={{
              background: CARD, borderRadius: 20, padding: 16,
              border: `1px solid ${BORDER}`, boxShadow: SHADOW,
              overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', gap: 12 }}>
                {/* Emoji */}
                <div style={{
                  width: 72, height: 72, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: BG, borderRadius: 16, fontSize: 36,
                  border: `1px solid ${BORDER}`,
                }}>{meal.emoji}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Name + price */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: FG1, lineHeight: 1.3, flex: 1 }}>{meal.name}</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: FG1, flexShrink: 0, fontFamily: "'Anton', Impact, sans-serif" }}>
                      ${meal.price.toFixed(2)}
                    </div>
                  </div>

                  {/* Restaurant + distance */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: FG2 }}>{meal.restaurant}</span>
                    <span style={{ fontSize: 9, color: FG3 }}>·</span>
                    <span style={{ fontSize: 11, color: FG3 }}>📍 {meal.distance}</span>
                    {meal.deliveryTime && (
                      <>
                        <span style={{ fontSize: 9, color: FG3 }}>·</span>
                        <span style={{ fontSize: 11, color: FG3 }}>⏱ {meal.deliveryTime}</span>
                      </>
                    )}
                  </div>

                  {/* Match bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <div style={{ flex: 1, height: 5, background: BORDER, borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 99, width: `${meal.match}%`, background: matchColor }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: matchColor, whiteSpace: 'nowrap' }}>
                      {meal.match}% match
                    </span>
                  </div>
                </div>
              </div>

              {/* Macros row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#D04E36' }}>{meal.cal} kcal</span>
                <div style={{ flex: 1 }} />
                <MacroChip label="P" val={meal.p} bg="rgba(46,111,184,0.08)"  color="#2E6FB8" />
                <MacroChip label="C" val={meal.c} bg="rgba(201,138,46,0.08)" color="#C98A2E" />
                <MacroChip label="F" val={meal.f} bg="rgba(30,127,92,0.08)"  color={GREEN}   />
              </div>

              {/* Tags row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                <span style={{
                  background: 'rgba(201,138,46,0.1)', color: '#C98A2E',
                  borderRadius: 20, padding: '3px 8px', fontSize: 10, fontWeight: 700,
                }}>
                  💰 {meal.valueScore}
                </span>
                {meal.tags.map(t => (
                  <span key={t} style={{
                    background: BG, color: FG2, border: `1px solid ${BORDER}`,
                    borderRadius: 20, padding: '3px 8px', fontSize: 10, fontWeight: 600,
                  }}>{t}</span>
                ))}
              </div>

              {/* CTA buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button style={{
                  flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
                  background: GREEN, color: '#fff', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', boxShadow: '0 4px 14px rgba(30,127,92,0.25)',
                }}>
                  📋 Log This
                </button>
                {meal.deliveryApp ? (
                  <button style={{
                    flex: 1, padding: '10px 0', borderRadius: 12,
                    background: CARD, border: `1.5px solid ${BORDER}`,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    color: DELIVERY_APPS[meal.deliveryApp]?.color ?? FG2,
                  }}>
                    Order via {meal.deliveryApp}
                  </button>
                ) : (
                  <button style={{
                    flex: 1, padding: '10px 0', borderRadius: 12,
                    background: CARD, border: `1.5px solid ${BORDER}`,
                    color: FG2, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}>
                    🗺 Directions
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', color: FG3 }}>
            <span style={{ fontSize: 48, marginBottom: 12 }}>🔍</span>
            <div style={{ fontSize: 15, fontWeight: 700, color: FG2 }}>No meals found</div>
            <div style={{ fontSize: 13, color: FG3, marginTop: 4 }}>Try removing filters or expanding your budget</div>
          </div>
        )}

      </div>
    </div>
  );
}
