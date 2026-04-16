'use client';
import { useState, useEffect, useCallback } from 'react';
import { useStrideStore } from '@/lib/store';

interface NearbyRestaurant {
  id: string; name: string; type: string; distance: string;
  rating: number | null; priceLevel: string | null;
  hours: string; emoji: string; mapsUrl: string;
}

// ── Types ────────────────────────────────────────────────────────────────────
interface ReadyToEatCard {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  category: string;
  emoji: string;
}

// ── Ready-to-eat foods ────────────────────────────────────────────────────────
const READY_TO_EAT: ReadyToEatCard[] = [
  { id: 'f1',  name: 'Greek Yogurt (low-fat)', calories: 100, protein: 17, carbs: 6,  fat: 1,  category: 'High Protein', emoji: '🥛' },
  { id: 'f2',  name: 'Hard Boiled Eggs (2)',   calories: 140, protein: 12, carbs: 1,  fat: 10, category: 'High Protein', emoji: '🥚' },
  { id: 'f3',  name: 'Banana',                 calories: 105, protein: 1,  carbs: 27, fat: 0,  category: 'Low Cal',      emoji: '🍌' },
  { id: 'f4',  name: 'Almonds (1 oz)',         calories: 164, protein: 6,  carbs: 6,  fat: 14, category: 'Low Carb',     emoji: '🥜' },
  { id: 'f5',  name: 'Cottage Cheese (½ cup)', calories: 90,  protein: 14, carbs: 5,  fat: 1,  category: 'High Protein', emoji: '🧀' },
  { id: 'f6',  name: 'Apple',                  calories: 95,  protein: 0,  carbs: 25, fat: 0,  category: 'Low Cal',      emoji: '🍎' },
  { id: 'f7',  name: 'Protein Bar (Quest)',    calories: 200, protein: 21, carbs: 22, fat: 9,  category: 'High Protein', emoji: '🍫' },
  { id: 'f8',  name: 'Tuna Can (in water)',    calories: 130, protein: 29, carbs: 0,  fat: 1,  category: 'High Protein', emoji: '🐟' },
  { id: 'f9',  name: 'Rice Cakes (3)',         calories: 105, protein: 2,  carbs: 22, fat: 1,  category: 'Low Cal',      emoji: '🍙' },
  { id: 'f10', name: 'Avocado (½)',            calories: 120, protein: 1,  carbs: 6,  fat: 11, category: 'Low Carb',     emoji: '🥑' },
  { id: 'f11', name: 'String Cheese',          calories: 80,  protein: 7,  carbs: 1,  fat: 5,  category: 'Low Carb',     emoji: '🧀' },
  { id: 'f12', name: 'Oatmeal (½ cup dry)',    calories: 150, protein: 5,  carbs: 27, fat: 3,  category: 'Low Cal',      emoji: '🥣' },
];

const FILTERS = ['All', 'Under 400 kcal', 'High Protein', 'Low Carb', 'Low Cal'];
const FILTER_MATCH: Record<string, (f: ReadyToEatCard) => boolean> = {
  'All':            () => true,
  'Under 400 kcal': f => f.calories < 400,
  'High Protein':   f => f.category === 'High Protein',
  'Low Carb':       f => f.category === 'Low Carb',
  'Low Cal':        f => f.category === 'Low Cal',
};

export default function EatPage() {
  const store     = useStrideStore();
  const remaining = store.getCaloriesRemaining();
  const [filter,       setFilter]       = useState('All');
  const [added,        setAdded]        = useState<Set<string>>(new Set());
  const [restaurants,  setRestaurants]  = useState<NearbyRestaurant[]>([]);
  const [locState,     setLocState]     = useState<'locating' | 'fetching' | 'done' | 'error' | 'no_key'>('locating');
  const [locError,     setLocError]     = useState('');

  const fetchRestaurants = useCallback(async (lat: number, lng: number) => {
    setLocState('fetching');
    try {
      const res  = await fetch(`/api/nearby-places?lat=${lat}&lng=${lng}&type=food`);
      const data = await res.json();
      if (data.error) {
        if (res.status === 503) { setLocState('no_key'); return; }
        throw new Error(data.error);
      }
      setRestaurants(data.places ?? []);
      setLocState('done');
    } catch (e) {
      setLocError(e instanceof Error ? e.message : 'Failed to load restaurants');
      setLocState('error');
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocError('Geolocation not supported by your browser');
      setLocState('error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => fetchRestaurants(pos.coords.latitude, pos.coords.longitude),
      err => {
        setLocError(`Location access denied: ${err.message}`);
        setLocState('error');
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }, [fetchRestaurants]);

  const logFood = (food: ReadyToEatCard) => {
    store.addFoodEntry({
      foodItemId: food.id,
      name:       food.name,
      emoji:      food.emoji,
      mealType:   'snack',
      quantity:   100,
      calories:   food.calories,
      protein:    food.protein,
      carbs:      food.carbs,
      fat:        food.fat,
    });
    setAdded(s => new Set(Array.from(s).concat(food.id)));
    setTimeout(() => setAdded(s => { const n = new Set(Array.from(s)); n.delete(food.id); return n; }), 2000);
  };

  const filteredFoods = READY_TO_EAT.filter(FILTER_MATCH[filter] || (() => true));

  return (
    <div style={{ background: '#0C0C14', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div style={{ padding: '52px 20px 20px' }}>
        <h1 style={{ color: '#F0F0F8', fontSize: 22, fontWeight: 900, margin: 0, marginBottom: 10 }}>
          What to Eat 🍜
        </h1>
        <div style={{
          background: 'rgba(255,107,53,0.12)', borderRadius: 14, padding: '10px 14px',
          display: 'inline-flex', alignItems: 'center', gap: 8,
          border: '1px solid rgba(255,107,53,0.20)',
        }}>
          <span style={{ fontSize: 16 }}>🎯</span>
          <span style={{ color: '#FF6B35', fontSize: 14, fontWeight: 700 }}>
            {remaining} kcal remaining today
          </span>
        </div>
      </div>

      <div style={{ padding: '0 16px 100px' }}>

        {/* ── Nearby Restaurants ── */}
        <div style={{ fontSize: 14, fontWeight: 800, color: '#F0F0F8', marginBottom: 4 }}>
          Nearby Restaurants
        </div>
        <div style={{ fontSize: 12, color: '#6E6E90', marginBottom: 12 }}>
          {locState === 'done'
            ? `${restaurants.length} places found near you`
            : locState === 'locating' ? 'Getting your location…'
            : locState === 'fetching' ? 'Finding restaurants…'
            : 'Restaurants near you'}
        </div>

        {(locState === 'locating' || locState === 'fetching') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0', marginBottom: 16 }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              border: '2.5px solid #FF6B35', borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
            }}/>
            <span style={{ fontSize: 13, color: '#6E6E90' }}>
              {locState === 'locating' ? 'Getting your location…' : 'Finding nearby restaurants…'}
            </span>
          </div>
        )}

        {locState === 'error' && (
          <div style={{
            background: 'rgba(255,90,90,0.08)', border: '1px solid rgba(255,90,90,0.20)',
            borderRadius: 14, padding: '12px 14px', marginBottom: 16,
            display: 'flex', gap: 8,
          }}>
            <span>⚠️</span>
            <span style={{ fontSize: 12, color: '#FF5A5A', lineHeight: 1.6 }}>{locError}</span>
          </div>
        )}

        {locState === 'no_key' && (
          <div style={{
            background: 'rgba(74,158,255,0.06)', borderRadius: 14, padding: '12px 14px', marginBottom: 16,
            display: 'flex', gap: 8, border: '1px solid rgba(74,158,255,0.12)',
          }}>
            <span style={{ fontSize: 14 }}>💡</span>
            <span style={{ fontSize: 12, color: '#4A9EFF', lineHeight: 1.6 }}>
              Add <code style={{ background: '#1E1E2E', borderRadius: 4, padding: '1px 4px' }}>GOOGLE_PLACES_API_KEY</code> to your environment to enable live restaurant suggestions.
            </span>
          </div>
        )}

        {locState === 'done' && restaurants.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {restaurants.map(r => (
              <div key={r.id} style={{
                background: '#161622', borderRadius: 18, padding: '14px',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 16, flexShrink: 0,
                  background: 'rgba(255,107,53,0.10)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                }}>
                  {r.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#F0F0F8' }}>{r.name}</span>
                    {r.priceLevel && (
                      <span style={{ fontSize: 11, color: '#A8A8C8', fontWeight: 600 }}>{r.priceLevel}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#A8A8C8', marginBottom: 6 }}>
                    {r.type} · {r.distance}{r.rating ? ` · ⭐ ${r.rating.toFixed(1)}` : ''}
                  </div>
                  <div style={{
                    display: 'inline-block', background: 'rgba(255,107,53,0.12)',
                    borderRadius: 8, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: '#FF6B35',
                  }}>
                    {r.hours}
                  </div>
                </div>
                <a href={r.mapsUrl} target="_blank" rel="noopener noreferrer" style={{
                  flexShrink: 0, background: '#FF6B35', color: '#fff',
                  borderRadius: 12, padding: '8px 12px', fontSize: 12, fontWeight: 700,
                  textDecoration: 'none', whiteSpace: 'nowrap',
                }}>
                  Open →
                </a>
              </div>
            ))}
          </div>
        )}

        {/* ── Ready-to-Eat ── */}
        <div style={{ fontSize: 14, fontWeight: 800, color: '#F0F0F8', marginBottom: 10 }}>
          Ready-to-Eat Options
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 12 }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              flexShrink: 0, borderRadius: 999, padding: '6px 14px',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
              background: filter === f ? '#FF6B35' : '#1E1E2E',
              color:      filter === f ? '#fff'    : '#6E6E90',
              transition: 'all .2s',
            }}>{f}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {filteredFoods.map(food => (
            <div key={food.id} style={{
              background: '#161622', borderRadius: 18, padding: '14px 12px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: 26, marginBottom: 6 }}>{food.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#F0F0F8', marginBottom: 4, lineHeight: 1.3 }}>
                {food.name}
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#FF6B35', marginBottom: 3 }}>
                {food.calories} kcal
              </div>
              <div style={{ fontSize: 11, color: '#A8A8C8', marginBottom: 10 }}>
                P {food.protein}g · C {food.carbs}g · F {food.fat}g
              </div>
              <button
                onClick={() => logFood(food)}
                style={{
                  width: '100%', borderRadius: 10, padding: '8px 0',
                  fontSize: 11, fontWeight: 800, cursor: 'pointer', border: 'none',
                  background: added.has(food.id) ? 'rgba(0,230,118,0.15)' : 'rgba(255,107,53,0.12)',
                  color:      added.has(food.id) ? '#00E676'              : '#FF6B35',
                  transition: 'all .2s',
                }}
              >
                {added.has(food.id) ? '✓ Added!' : '+ Log this'}
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
