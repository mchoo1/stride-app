'use client';
import { useState, useEffect } from 'react';
import { useStrideStore } from '@/lib/store';

// ── Types ────────────────────────────────────────────────────────────────────
interface RestaurantCard {
  id: string;
  name: string;
  cuisine: string;
  distance: string;
  calorieRange: string;
  rating: number;
  priceRange: string;
  mapsUrl: string;
  emoji: string;
}

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

// ── Mock restaurant data (replaced by Google Places / Yelp when key is set) ──
const MOCK_RESTAURANTS: RestaurantCard[] = [
  { id: 'r1', name: 'Sweetgreen',         cuisine: 'Salads',       distance: '0.3 mi', calorieRange: '300–600 kcal', rating: 4.5, priceRange: '$$', mapsUrl: 'https://maps.google.com/?q=sweetgreen', emoji: '🥗' },
  { id: 'r2', name: 'Chipotle',           cuisine: 'Mexican',      distance: '0.5 mi', calorieRange: '500–900 kcal', rating: 4.2, priceRange: '$$', mapsUrl: 'https://maps.google.com/?q=chipotle', emoji: '🌯' },
  { id: 'r3', name: 'Subway',             cuisine: 'Sandwiches',   distance: '0.2 mi', calorieRange: '350–750 kcal', rating: 3.9, priceRange: '$',  mapsUrl: 'https://maps.google.com/?q=subway', emoji: '🥪' },
  { id: 'r4', name: 'CAVA',               cuisine: 'Mediterranean',distance: '0.8 mi', calorieRange: '400–700 kcal', rating: 4.6, priceRange: '$$', mapsUrl: 'https://maps.google.com/?q=cava', emoji: '🫙' },
  { id: 'r5', name: 'Panera Bread',       cuisine: 'Café',         distance: '0.6 mi', calorieRange: '400–800 kcal', rating: 4.0, priceRange: '$$', mapsUrl: 'https://maps.google.com/?q=panera', emoji: '🥖' },
  { id: 'r6', name: 'Local Sushi Bar',    cuisine: 'Japanese',     distance: '1.0 mi', calorieRange: '400–700 kcal', rating: 4.4, priceRange: '$$$', mapsUrl: 'https://maps.google.com/?q=sushi', emoji: '🍱' },
];

// ── Ready-to-eat foods ────────────────────────────────────────────────────────
const READY_TO_EAT: ReadyToEatCard[] = [
  { id: 'f1', name: 'Greek Yogurt (low-fat)', calories: 100, protein: 17, carbs: 6,  fat: 1, category: 'High Protein', emoji: '🥛' },
  { id: 'f2', name: 'Hard Boiled Eggs (2)',   calories: 140, protein: 12, carbs: 1,  fat: 10, category: 'High Protein', emoji: '🥚' },
  { id: 'f3', name: 'Banana',                 calories: 105, protein: 1,  carbs: 27, fat: 0, category: 'Low Cal',       emoji: '🍌' },
  { id: 'f4', name: 'Almonds (1 oz)',         calories: 164, protein: 6,  carbs: 6,  fat: 14, category: 'Low Carb',      emoji: '🥜' },
  { id: 'f5', name: 'Cottage Cheese (½ cup)', calories: 90,  protein: 14, carbs: 5,  fat: 1, category: 'High Protein', emoji: '🧀' },
  { id: 'f6', name: 'Apple',                  calories: 95,  protein: 0,  carbs: 25, fat: 0, category: 'Low Cal',       emoji: '🍎' },
  { id: 'f7', name: 'Protein Bar (Quest)',    calories: 200, protein: 21, carbs: 22, fat: 9, category: 'High Protein', emoji: '🍫' },
  { id: 'f8', name: 'Tuna Can (in water)',    calories: 130, protein: 29, carbs: 0,  fat: 1, category: 'High Protein', emoji: '🐟' },
  { id: 'f9', name: 'Rice Cakes (3)',         calories: 105, protein: 2,  carbs: 22, fat: 1, category: 'Low Cal',       emoji: '🍙' },
  { id: 'f10',name: 'Avocado (½)',            calories: 120, protein: 1,  carbs: 6,  fat: 11, category: 'Low Carb',     emoji: '🥑' },
  { id: 'f11',name: 'String Cheese',          calories: 80,  protein: 7,  carbs: 1,  fat: 5, category: 'Low Carb',     emoji: '🧀' },
  { id: 'f12',name: 'Oatmeal (½ cup dry)',    calories: 150, protein: 5,  carbs: 27, fat: 3, category: 'Low Cal',      emoji: '🥣' },
];

const FILTERS = ['All', 'Under 400 kcal', 'High Protein', 'Low Carb', 'Low Cal'];

const FILTER_MATCH: Record<string, (f: ReadyToEatCard) => boolean> = {
  'All':           () => true,
  'Under 400 kcal': f => f.calories < 400,
  'High Protein':  f => f.category === 'High Protein',
  'Low Carb':      f => f.category === 'Low Carb',
  'Low Cal':       f => f.category === 'Low Cal',
};

export default function EatPage() {
  const store     = useStrideStore();
  const remaining = store.getCaloriesRemaining();
  const [filter, setFilter]   = useState('All');
  const [added, setAdded]     = useState<Set<string>>(new Set());
  const [locMsg, setLocMsg]   = useState('Getting nearby restaurants…');

  // Simulate getting location (real impl calls Google Places API)
  useEffect(() => {
    const t = setTimeout(() => setLocMsg(''), 1800);
    return () => clearTimeout(t);
  }, []);

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
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(160deg, #E76F51 0%, #c1533b 100%)',
        padding: '44px 20px 24px',
      }}>
        <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 6 }}>What to Eat 🍜</h1>
        {/* Remaining calories banner */}
        <div style={{
          background: 'rgba(255,255,255,.18)', borderRadius: 14, padding: '10px 14px',
          display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 4,
        }}>
          <span style={{ fontSize: 18 }}>🎯</span>
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
            You have <strong>{remaining} kcal</strong> left today
          </span>
        </div>
      </div>

      <div style={{ padding: '14px 14px 100px' }}>

        {/* ── Restaurants Section ── */}
        <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e', marginBottom: 4 }}>
          Nearby Restaurants
        </div>
        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 12 }}>
          {locMsg || 'Showing restaurants that fit your calorie budget'}
        </div>

        {locMsg ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '3px solid #E76F51', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}/>
            <span style={{ fontSize: 13, color: '#aaa' }}>Locating you…</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {MOCK_RESTAURANTS.map(r => (
              <div key={r.id} style={{
                background: '#fff', borderRadius: 18, padding: '14px 14px',
                boxShadow: '0 2px 8px rgba(0,0,0,.06)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                  background: 'linear-gradient(135deg, #fff8f0, #ffe8d6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26,
                }}>
                  {r.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{r.name}</span>
                    <span style={{ fontSize: 11, color: '#888' }}>{r.priceRange}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
                    {r.cuisine} · {r.distance} · ⭐ {r.rating}
                  </div>
                  <div style={{
                    display: 'inline-block', background: '#fff0e8', borderRadius: 8,
                    padding: '2px 8px', fontSize: 11, fontWeight: 700, color: '#E76F51',
                  }}>
                    ~{r.calorieRange}
                  </div>
                </div>
                <a href={r.mapsUrl} target="_blank" rel="noopener noreferrer" style={{
                  flexShrink: 0, background: '#E76F51', color: '#fff',
                  borderRadius: 12, padding: '8px 12px', fontSize: 12, fontWeight: 700,
                  textDecoration: 'none', whiteSpace: 'nowrap',
                }}>
                  Open →
                </a>
              </div>
            ))}
          </div>
        )}

        {/* ── Ready-to-Eat Section ── */}
        <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e', marginBottom: 10 }}>
          Ready-to-Eat Options
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 12 }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              flexShrink: 0, borderRadius: 999, padding: '6px 14px',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: filter === f ? '#E76F51' : '#eee',
              color: filter === f ? '#fff' : '#888',
              transition: 'all .2s',
            }}>{f}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {filteredFoods.map(food => (
            <div key={food.id} style={{
              background: '#fff', borderRadius: 16, padding: '12px 12px',
              boxShadow: '0 2px 8px rgba(0,0,0,.05)',
            }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{food.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 4, lineHeight: 1.3 }}>
                {food.name}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#E76F51', marginBottom: 4 }}>
                {food.calories} kcal
              </div>
              <div style={{ fontSize: 10, color: '#aaa', marginBottom: 10 }}>
                P {food.protein}g · C {food.carbs}g · F {food.fat}g
              </div>
              <button
                onClick={() => logFood(food)}
                style={{
                  width: '100%', borderRadius: 10, padding: '7px 0',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
                  background: added.has(food.id) ? '#4CAF82' : 'rgba(231,111,81,.12)',
                  color: added.has(food.id) ? '#fff' : '#E76F51',
                  transition: 'all .2s',
                }}
              >
                {added.has(food.id) ? '✓ Added!' : '+ Log this'}
              </button>
            </div>
          ))}
        </div>

        {/* Setup note */}
        <div style={{
          background: '#EBF3FD', borderRadius: 14, padding: '12px 14px', marginTop: 20,
          display: 'flex', gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>💡</span>
          <span style={{ fontSize: 12, color: '#5A7FA8', lineHeight: 1.6 }}>
            Restaurant suggestions will use your live location once a <strong>Google Places API key</strong> or <strong>Yelp API key</strong> is added to your environment variables.
          </span>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
