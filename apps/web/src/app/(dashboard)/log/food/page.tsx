'use client';
import { useState } from 'react';
import { useStrideStore } from '@/lib/store';

const MEAL_TABS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

const QUICK_FOODS = [
  { name: 'Chicken Breast (100g)', cal: 165, protein: 31, carbs: 0,  fat: 3,  emoji: '🍗' },
  { name: 'Brown Rice (1 cup)',    cal: 215, protein: 5,  carbs: 45, fat: 2,  emoji: '🍚' },
  { name: 'Egg (1 large)',         cal: 72,  protein: 6,  carbs: 1,  fat: 5,  emoji: '🥚' },
  { name: 'Greek Yogurt (170g)',   cal: 100, protein: 17, carbs: 6,  fat: 0,  emoji: '🥛' },
  { name: 'Banana (1 medium)',     cal: 105, protein: 1,  carbs: 27, fat: 0,  emoji: '🍌' },
  { name: 'Almonds (1 oz)',        cal: 164, protein: 6,  carbs: 6,  fat: 14, emoji: '🥜' },
  { name: 'Salmon (100g)',         cal: 208, protein: 20, carbs: 0,  fat: 13, emoji: '🐟' },
  { name: 'Sweet Potato (med)',    cal: 103, protein: 2,  carbs: 24, fat: 0,  emoji: '🍠' },
  { name: 'Oatmeal (1 cup)',       cal: 154, protein: 6,  carbs: 28, fat: 3,  emoji: '🥣' },
  { name: 'Avocado (half)',        cal: 120, protein: 2,  carbs: 6,  fat: 11, emoji: '🥑' },
  { name: 'Broccoli (1 cup)',      cal: 55,  protein: 4,  carbs: 11, fat: 1,  emoji: '🥦' },
  { name: 'Protein Shake',         cal: 140, protein: 25, carbs: 6,  fat: 2,  emoji: '🧃' },
];

export default function FoodLogPage() {
  const store = useStrideStore();
  const todayFood = store.getTodayFoodLog();
  const totals    = store.getTodayTotals();
  const profile   = store.profile;

  const [activeTab, setActiveTab]   = useState(0);
  const [panel, setPanel]           = useState<'log' | 'quick'>('log');
  const [showModal, setShowModal]   = useState(false);
  const [search, setSearch]         = useState('');
  const [toast, setToast]           = useState('');

  // Manual form state
  const [fName, setFName] = useState('');
  const [fCal,  setFCal]  = useState('');
  const [fPro,  setFPro]  = useState('');
  const [fCarb, setFCarb] = useState('');
  const [fFat,  setFFat]  = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const submitManual = () => {
    if (!fName.trim() || !fCal) { showToast('⚠️ Name and calories are required'); return; }
    store.addFoodEntry({
      name: fName.trim(), calories: Number(fCal),
      protein: Number(fPro) || 0, carbs: Number(fCarb) || 0, fat: Number(fFat) || 0,
      emoji: '🍽️', foodItemId: '', quantity: 100,
      mealType: MEAL_TABS[activeTab].toLowerCase() as 'breakfast'|'lunch'|'dinner'|'snack',
    });
    showToast(`✅ ${fName.trim()} added!`);
    setFName(''); setFCal(''); setFPro(''); setFCarb(''); setFFat('');
    setShowModal(false);
  };

  const quickAdd = (f: typeof QUICK_FOODS[0]) => {
    store.addFoodEntry({
      name: f.name, calories: f.cal,
      protein: f.protein, carbs: f.carbs, fat: f.fat,
      emoji: f.emoji, foodItemId: '', quantity: 100,
      mealType: MEAL_TABS[activeTab].toLowerCase() as 'breakfast'|'lunch'|'dinner'|'snack',
    });
    showToast(`✅ ${f.name} added!`);
  };

  const filtered = QUICK_FOODS.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const calPct = Math.min((totals.calories / Math.max(profile.targetCalories, 1)) * 100, 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>

      {/* ── Calorie + add row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 0' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>
          {totals.calories} / {profile.targetCalories} kcal
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowModal(true)} style={{
          width: 34, height: 34, borderRadius: '50%',
          background: '#4CAF82', border: 'none',
          color: '#fff', fontSize: 22, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>+</button>
      </div>

      {/* ── Macro summary bar ── */}
      <div style={{ background: '#fff', padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div className="cal-bar-track">
              <div className="cal-bar-fill" style={{
                width: `${calPct}%`,
                background: calPct > 95 ? '#FF6B6B' : '#4CAF82',
              }}/>
            </div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#333', whiteSpace: 'nowrap' }}>
            {totals.calories} / {profile.targetCalories} kcal
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          {[
            { label: 'P', val: totals.protein,  goal: profile.targetProtein,  color: '#4A90D9' },
            { label: 'C', val: totals.carbs,     goal: profile.targetCarbs,    color: '#F5A623' },
            { label: 'F', val: totals.fat,       goal: profile.targetFat,      color: '#4CAF82' },
          ].map(m => (
            <div key={m.label} style={{ flex: 1 }}>
              <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2, background: m.color,
                  width: `${Math.min((m.val / Math.max(m.goal, 1)) * 100, 100)}%`,
                }}/>
              </div>
              <div style={{ fontSize: 10, color: '#aaa', marginTop: 2, textAlign: 'center' }}>
                {m.label}: {m.val}g
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panel switcher tabs ── */}
      <div className="tab-bar">
        <div className={`tab-item ${panel === 'log' ? 'active' : ''}`} onClick={() => setPanel('log')}>
          Today&apos;s Log
        </div>
        <div className={`tab-item ${panel === 'quick' ? 'active' : ''}`} onClick={() => setPanel('quick')}>
          Quick Add
        </div>
      </div>

      {/* ── TODAY LOG panel ── */}
      {panel === 'log' && (
        <div style={{ flex: 1, padding: '12px 14px 100px' }}>
          {/* Meal type chips */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
            {MEAL_TABS.map((t, i) => (
              <button key={t} onClick={() => setActiveTab(i)} style={{
                borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600,
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                background: i === activeTab ? '#4CAF82' : '#fff',
                color: i === activeTab ? '#fff' : '#888',
                boxShadow: '0 1px 4px rgba(0,0,0,.06)',
                transition: 'all .2s',
              }}>{t}</button>
            ))}
          </div>

          {todayFood.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 60, color: '#ccc' }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>🍽️</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#bbb' }}>Nothing logged yet</div>
              <div style={{ fontSize: 13, color: '#ccc', marginTop: 6 }}>
                Tap <strong style={{ color: '#4CAF82' }}>+</strong> to add a meal
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todayFood.map(e => (
                <div key={e.id} className="food-card">
                  <div className="food-thumb">{e.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 600, color: '#1a1a2e',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {e.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                      {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
                      <span className="macro-pill pill-cal">{e.calories} kcal</span>
                      <span className="macro-pill pill-pro">P:{e.protein}g</span>
                      <span className="macro-pill pill-carb">C:{e.carbs}g</span>
                      <span className="macro-pill pill-fat">F:{e.fat}g</span>
                    </div>
                  </div>
                  <button onClick={() => store.removeFoodEntry(e.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 18, color: '#ddd', padding: 4,
                  }}>🗑</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── QUICK ADD panel ── */}
      {panel === 'quick' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Search box */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#fff', margin: '12px 14px', borderRadius: 14,
            padding: '10px 14px', boxShadow: '0 2px 8px rgba(0,0,0,.05)',
          }}>
            <span>🔍</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search foods…"
              style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: '#333', background: 'transparent' }}
            />
          </div>
          {/* Food list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px 100px' }}>
            {filtered.map(f => (
              <div key={f.name} style={{
                display: 'flex', alignItems: 'center',
                background: '#fff', marginBottom: 6, borderRadius: 14,
                padding: '12px 14px', boxShadow: '0 1px 4px rgba(0,0,0,.04)',
              }}>
                <span style={{ fontSize: 26, marginRight: 10 }}>{f.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{f.name}</div>
                  <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>
                    {f.cal} kcal · P:{f.protein}g · C:{f.carbs}g · F:{f.fat}g
                  </div>
                </div>
                <button onClick={() => quickAdd(f)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 28, color: '#4CAF82', lineHeight: 1, padding: 2,
                }}>⊕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Add Food Modal ── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.40)',
          zIndex: 200, display: 'flex', alignItems: 'flex-end',
        }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{
            background: '#fff', width: '100%', borderRadius: '24px 24px 0 0',
            padding: 20, animation: 'slideUp .25s ease',
          }}>
            <div style={{ width: 40, height: 4, background: '#e0e0e0', borderRadius: 2, margin: '0 auto 16px' }}/>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Add Food Entry</div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 5 }}>Food name *</div>
              <input className="form-input" value={fName} onChange={e => setFName(e.target.value)} placeholder="e.g. Grilled Chicken"/>
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 5 }}>Calories *</div>
                <input className="form-input" type="number" value={fCal} onChange={e => setFCal(e.target.value)} placeholder="kcal"/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 5 }}>Protein</div>
                <input className="form-input" type="number" value={fPro} onChange={e => setFPro(e.target.value)} placeholder="g"/>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 5 }}>Carbs</div>
                <input className="form-input" type="number" value={fCarb} onChange={e => setFCarb(e.target.value)} placeholder="g"/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 5 }}>Fat</div>
                <input className="form-input" type="number" value={fFat} onChange={e => setFFat(e.target.value)} placeholder="g"/>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={submitManual} className="btn-primary" style={{ flex: 2 }}>Add Entry</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a2e', color: '#fff', padding: '10px 20px', borderRadius: 20,
          fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', zIndex: 300,
        }}>{toast}</div>
      )}
    </div>
  );
}
