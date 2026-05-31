'use client';
import { useState } from 'react';
import { useStrideStore } from '@/lib/store';

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

const DELIVERY_APPS: Record<string, { color: string; emoji: string }> = {
  GrabFood:  { color: '#00D68F', emoji: '🟢' },
  Deliveroo: { color: '#00CCBC', emoji: '🔵' },
  'Uber Eats': { color: '#4E9BFF', emoji: '⚫' },
};

function MacroBit({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg px-2 py-1 min-w-[44px]" style={{ background: color + '18' }}>
      <span className="text-[11px] font-black" style={{ color }}>{val}g</span>
      <span className="text-[9px]" style={{ color: '#55556A' }}>{label}</span>
    </div>
  );
}

export default function RecommendationsPage() {
  const store = useStrideStore();
  const profile = store.profile;
  const totals = store.getTodayTotals();
  const [activeTab, setActiveTab] = useState('All');
  const [budget, setBudget] = useState(false);

  const remaining = {
    cal: Math.max(0, profile.targetCalories - totals.calories),
    p: Math.max(0, profile.targetProtein - totals.protein),
    c: Math.max(0, profile.targetCarbs - totals.carbs),
    f: Math.max(0, profile.targetFat - totals.fat),
  };

  const filtered = MEALS.filter(m => {
    if (activeTab === 'Restaurants') return m.type === 'restaurant';
    if (activeTab === 'Delivery')    return m.type === 'delivery';
    if (activeTab === 'Grocery')     return m.type === 'grocery';
    return true;
  }).filter(m => !budget || m.price <= 10);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden px-5 pb-4 pt-14">
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%,rgba(255,140,66,.18) 0%,transparent 70%)' }}/>
        <div className="relative">
          <h1 className="text-2xl font-black" style={{ color: '#EEEEF8' }}>Meal Ideas 🍜</h1>
          <p className="text-sm" style={{ color: '#8888A8' }}>Matched to your remaining macros</p>
        </div>
      </div>

      {/* Remaining macros banner */}
      <div className="mx-4 mb-3 card" style={{ background: 'linear-gradient(135deg,#1E1E30,#111120)' }}>
        <p className="section-label mb-2">Your Remaining Macros</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { l: 'Calories', v: remaining.cal, c: '#FF5A5A', s: 'kcal' },
            { l: 'Protein',  v: remaining.p,   c: '#4E9BFF', s: 'g' },
            { l: 'Carbs',    v: remaining.c,   c: '#FFD166', s: 'g' },
            { l: 'Fat',      v: remaining.f,   c: '#00D68F', s: 'g' },
          ].map(r => (
            <div key={r.l} className="text-center">
              <p className="text-base font-black" style={{ color: r.c }}>{r.v}<span className="text-[9px] ml-0.5">{r.s}</span></p>
              <p className="text-[9px]" style={{ color: '#55556A' }}>{r.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs + filters */}
      <div className="flex items-center justify-between px-4 mb-2">
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`pill-tab ${activeTab === t ? 'active' : ''}`}>{t}</button>
          ))}
        </div>
        <button onClick={() => setBudget(!budget)}
          className="ml-2 rounded-full px-3 py-1.5 text-xs font-bold transition-all"
          style={{
            background: budget ? 'rgba(255,209,102,.2)' : '#1E1E30',
            color: budget ? '#FFD166' : '#55556A',
            border: '1px solid ' + (budget ? '#FFD166' : '#252538'),
          }}>
          💰 Under $10
        </button>
      </div>

      {/* Location bar */}
      <div className="mx-4 mb-3 flex items-center gap-2 rounded-xl px-3 py-2"
        style={{ background: '#1E1E30', border: '1px solid #252538' }}>
        <span className="text-sm">📍</span>
        <span className="flex-1 text-xs" style={{ color: '#8888A8' }}>Orchard Road, Singapore · Within 2km</span>
        <button className="text-xs font-bold" style={{ color: '#00D68F' }}>Change</button>
      </div>

      {/* Meal cards */}
      <div className="space-y-3 px-4 pb-4">
        {filtered.map(meal => (
          <div key={meal.id} className="card overflow-hidden">
            <div className="flex gap-3">
              {/* Emoji / image */}
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-4xl"
                style={{ background: 'linear-gradient(135deg,#1E1E30,#161626)' }}>{meal.emoji}</div>

              <div className="flex-1 min-w-0">
                {/* Name + price */}
                <div className="flex items-start justify-between gap-1">
                  <p className="text-sm font-bold leading-tight" style={{ color: '#EEEEF8' }}>{meal.name}</p>
                  <span className="text-sm font-black shrink-0" style={{ color: '#FFD166' }}>${meal.price.toFixed(2)}</span>
                </div>

                {/* Restaurant + distance */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px]" style={{ color: '#8888A8' }}>{meal.restaurant}</span>
                  <span className="text-[9px]" style={{ color: '#55556A' }}>·</span>
                  <span className="text-[11px]" style={{ color: '#55556A' }}>📍 {meal.distance}</span>
                  {meal.deliveryTime && (
                    <>
                      <span className="text-[9px]" style={{ color: '#55556A' }}>·</span>
                      <span className="text-[11px]" style={{ color: '#55556A' }}>⏱ {meal.deliveryTime}</span>
                    </>
                  )}
                </div>

                {/* Match score */}
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-16 rounded-full overflow-hidden" style={{ background: '#1E1E30' }}>
                      <div className="h-full rounded-full" style={{ width: `${meal.match}%`, background: meal.match >= 90 ? '#00D68F' : meal.match >= 80 ? '#FFD166' : '#FF8C42' }}/>
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: meal.match >= 90 ? '#00D68F' : '#FFD166' }}>{meal.match}% match</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Macros */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm font-black" style={{ color: '#FF5A5A' }}>{meal.cal} kcal</span>
              <div className="flex-1"/>
              <MacroBit label="P" val={meal.p} color="#4E9BFF"/>
              <MacroBit label="C" val={meal.c} color="#FFD166"/>
              <MacroBit label="F" val={meal.f} color="#00D68F"/>
            </div>

            {/* Value score */}
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: 'rgba(255,209,102,.1)', color: '#FFD166' }}>
                💰 {meal.valueScore}
              </span>
              {meal.tags.map(t => (
                <span key={t} className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: '#1E1E30', color: '#55556A' }}>{t}</span>
              ))}
            </div>

            {/* CTAs */}
            <div className="mt-3 flex gap-2">
              <button className="btn-primary flex-1 py-2 text-xs">
                📋 Log This
              </button>
              {meal.deliveryApp ? (
                <button className="btn-secondary flex-1 py-2 text-xs"
                  style={{ color: DELIVERY_APPS[meal.deliveryApp]?.color ?? '#8888A8' }}>
                  {DELIVERY_APPS[meal.deliveryApp]?.emoji} Order via {meal.deliveryApp}
                </button>
              ) : (
                <button className="btn-secondary flex-1 py-2 text-xs">
                  🗺 Get Directions
                </button>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-16" style={{ color: '#55556A' }}>
            <span className="text-5xl mb-3">🔍</span>
            <p className="text-sm font-semibold">No meals found</p>
            <p className="text-xs mt-1">Try removing filters or expanding your budget</p>
          </div>
        )}
      </div>
    </div>
  );
}
