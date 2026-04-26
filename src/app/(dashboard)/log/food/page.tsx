'use client';
import { useState, useRef, useEffect } from 'react';
import { useStrideStore } from '@/lib/store';
import { MOCK_FOODS, MOCK_SCAN_RESULTS } from '@/lib/mockFoods';
import { api } from '@/lib/apiClient';

// Unified food shape for search results (mock + API)
interface FoodSearchResult {
  id: string; name: string; emoji: string;
  calories: number; protein: number; carbs: number; fat: number;
}

const MEAL_TABS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
type ModalTab = 'search' | 'ai' | 'manual';

export default function FoodLogPage() {
  const store     = useStrideStore();
  const todayFood = store.getTodayFoodLog();
  const totals    = store.getTodayTotals();
  const profile   = store.profile;

  const [activeTab, setActiveTab] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalTab,  setModalTab]  = useState<ModalTab>('search');
  const [toast,     setToast]     = useState('');

  /* ── Search tab ── */
  const [search,        setSearch]       = useState('');
  const [selectedFood,  setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [weight,        setWeight]       = useState('100');
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  /* ── AI tab ── */
  const [aiPhoto,   setAiPhoto]   = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult,  setAiResult]  = useState<typeof MOCK_SCAN_RESULTS[0] | null>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);

  /* ── Manual tab ── */
  const [mPhoto, setMPhoto] = useState<string | null>(null);
  const [mName,  setMName]  = useState('');
  const [mQty,   setMQty]   = useState('100');
  const [mCal,   setMCal]   = useState('');
  const [mPro,   setMPro]   = useState('');
  const [mCarb,  setMCarb]  = useState('');
  const [mFat,   setMFat]   = useState('');
  const manualInputRef = useRef<HTMLInputElement>(null);

  const mealType = MEAL_TABS[activeTab].toLowerCase() as 'breakfast' | 'lunch' | 'dinner' | 'snack';

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  // Debounced API food search
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const items = await api.foods.search(search.trim());
        setSearchResults(items.map(f => ({
          id:       f.id,
          name:     f.name,
          emoji:    f.emoji ?? '🍽️',
          calories: f.caloriesPer100g,
          protein:  f.proteinPer100g,
          carbs:    f.carbsPer100g,
          fat:      f.fatPer100g,
        })));
      } catch {
        setSearchResults([]); // fall back to mock
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const openModal = (tab: ModalTab = 'search') => { setModalTab(tab); setShowModal(true); };

  const closeModal = () => {
    setShowModal(false);
    setSearch(''); setSelectedFood(null); setWeight('100');
    setAiPhoto(null); setAiResult(null); setAiLoading(false);
    setMPhoto(null); setMName(''); setMQty('100');
    setMCal(''); setMPro(''); setMCarb(''); setMFat('');
  };

  /* Scaled nutrition for search tab */
  const scaledNutrition = selectedFood ? {
    cal:     Math.round((selectedFood.calories / 100) * Number(weight || 100)),
    protein: Math.round((selectedFood.protein  / 100) * Number(weight || 100) * 10) / 10,
    carbs:   Math.round((selectedFood.carbs    / 100) * Number(weight || 100) * 10) / 10,
    fat:     Math.round((selectedFood.fat      / 100) * Number(weight || 100) * 10) / 10,
  } : null;

  const addFromSearch = () => {
    if (!selectedFood) return;
    store.addFoodEntry({
      name: `${selectedFood.name} (${weight}g)`,
      calories: scaledNutrition!.cal, protein: scaledNutrition!.protein,
      carbs: scaledNutrition!.carbs, fat: scaledNutrition!.fat,
      emoji: selectedFood.emoji, foodItemId: selectedFood.id, quantity: Number(weight), mealType,
    });
    showToast(`✅ ${selectedFood.name} added!`);
    closeModal();
  };

  const [aiError, setAiError] = useState<string | null>(null);

  const handleAiPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const dataUrl = ev.target?.result as string;
      setAiPhoto(dataUrl);
      setAiLoading(true);
      setAiResult(null);
      setAiError(null);
      try {
        const res = await fetch('/api/scan-food', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          setAiError(data.error ?? 'Could not identify food. Try a clearer photo.');
        } else {
          setAiResult(data);
        }
      } catch {
        setAiError('Network error. Please try again.');
      } finally {
        setAiLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const addFromAI = () => {
    if (!aiResult) return;
    store.addFoodEntry({
      name: aiResult.name, calories: aiResult.calories,
      protein: aiResult.protein, carbs: aiResult.carbs, fat: aiResult.fat,
      emoji: aiResult.emoji, foodItemId: '', quantity: 100, mealType,
    });
    showToast(`✅ ${aiResult.name} added!`);
    closeModal();
  };

  const handleManualPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setMPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const addManual = () => {
    if (!mName.trim() || !mCal) { showToast('⚠️ Name and calories are required'); return; }
    store.addFoodEntry({
      name: mName.trim(), calories: Number(mCal),
      protein: Number(mPro) || 0, carbs: Number(mCarb) || 0, fat: Number(mFat) || 0,
      emoji: '🍽️', foodItemId: '', quantity: Number(mQty) || 100, mealType,
    });
    showToast(`✅ ${mName.trim()} added!`);
    closeModal();
  };

  const calPct = Math.min((totals.calories / Math.max(profile.targetCalories, 1)) * 100, 100);
  // Display list: API results when searching, fallback to MOCK_FOODS for browse
  const displayFoods: FoodSearchResult[] = search.trim()
    ? (searchResults.length > 0
        ? searchResults
        : MOCK_FOODS.filter(f => f.name.toLowerCase().includes(search.toLowerCase())))
    : MOCK_FOODS.slice(0, 20);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* Macro bar */}
      <div style={{ background: '#fff', padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div className="cal-bar-track">
              <div className="cal-bar-fill" style={{ width: `${calPct}%`, background: calPct > 95 ? '#FF6B6B' : '#4CAF82' }}/>
            </div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#333', whiteSpace: 'nowrap' }}>
            {totals.calories} / {profile.targetCalories} kcal
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          {[
            { label: 'P', val: totals.protein, goal: profile.targetProtein, color: '#4A90D9' },
            { label: 'C', val: totals.carbs,   goal: profile.targetCarbs,   color: '#F5A623' },
            { label: 'F', val: totals.fat,      goal: profile.targetFat,     color: '#4CAF82' },
          ].map(m => (
            <div key={m.label} style={{ flex: 1 }}>
              <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 2, background: m.color, width: `${Math.min((m.val / Math.max(m.goal, 1)) * 100, 100)}%` }}/>
              </div>
              <div style={{ fontSize: 10, color: '#aaa', marginTop: 2, textAlign: 'center' }}>{m.label}: {m.val}g</div>
            </div>
          ))}
        </div>
      </div>

      {/* Meal chips */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 14px 4px', overflowX: 'auto' }}>
        {MEAL_TABS.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)} style={{
            borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600,
            border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            background: i === activeTab ? '#4CAF82' : '#fff',
            color: i === activeTab ? '#fff' : '#888',
            boxShadow: '0 1px 4px rgba(0,0,0,.06)', transition: 'all .2s',
          }}>{t}</button>
        ))}
      </div>

      {/* 3 Add method buttons */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 14px 14px' }}>
        {([
          { tab: 'search' as ModalTab, icon: '🔍', label: 'Search DB',    color: '#4A90D9' },
          { tab: 'ai'     as ModalTab, icon: '🤖', label: 'AI Scan',      color: '#9B59B6' },
          { tab: 'manual' as ModalTab, icon: '✏️', label: 'Manual Entry', color: '#F5A623' },
        ]).map(btn => (
          <button key={btn.tab} onClick={() => openModal(btn.tab)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 4, padding: '10px 4px', background: '#fff',
            border: `2px solid ${btn.color}30`, borderRadius: 14, cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,.05)', transition: 'all .2s',
          }}>
            <span style={{ fontSize: 22 }}>{btn.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: btn.color }}>{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Today log */}
      <div style={{ flex: 1, padding: '0 14px 100px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#999', marginBottom: 10 }}>TODAY&apos;S LOG</div>
        {todayFood.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 40, color: '#ccc' }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🍽️</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#bbb' }}>Nothing logged yet</div>
            <div style={{ fontSize: 13, color: '#ccc', marginTop: 6 }}>Use the buttons above to add a meal</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todayFood.map(e => (
              <div key={e.id} className="food-card">
                <div className="food-thumb">{e.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 2, textTransform: 'capitalize' }}>
                    {e.mealType} · {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
                    <span className="macro-pill pill-cal">{e.calories} kcal</span>
                    <span className="macro-pill pill-pro">P:{e.protein}g</span>
                    <span className="macro-pill pill-carb">C:{e.carbs}g</span>
                    <span className="macro-pill pill-fat">F:{e.fat}g</span>
                  </div>
                </div>
                <button onClick={() => store.removeFoodEntry(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#ddd', padding: 4 }}>🗑</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ MODAL ══ */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
          zIndex: 200, display: 'flex', alignItems: 'flex-end',
        }} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div style={{
            background: '#fff', width: '100%', maxHeight: '88vh',
            borderRadius: '24px 24px 0 0', display: 'flex', flexDirection: 'column',
            animation: 'slideUp .25s ease',
          }}>
            <div style={{ width: 40, height: 4, background: '#e0e0e0', borderRadius: 2, margin: '12px auto 0' }}/>

            {/* Modal tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', padding: '6px 16px 0' }}>
              {([
                { id: 'search' as ModalTab, icon: '🔍', label: 'Search DB' },
                { id: 'ai'     as ModalTab, icon: '🤖', label: 'AI Scan' },
                { id: 'manual' as ModalTab, icon: '✏️', label: 'Manual' },
              ]).map(t => (
                <button key={t.id} onClick={() => setModalTab(t.id)} style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  padding: '6px 0 10px', background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: modalTab === t.id ? '2px solid #4CAF82' : '2px solid transparent',
                  fontSize: 11, fontWeight: 700,
                  color: modalTab === t.id ? '#4CAF82' : '#aaa', transition: 'all .2s',
                }}>
                  <span style={{ fontSize: 18 }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── SEARCH ── */}
            {modalTab === 'search' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px 16px' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 10 }}>Search Food Database</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8f9fa', borderRadius: 12, padding: '10px 14px', marginBottom: 10 }}>
                  <span>🔍</span>
                  <input autoFocus value={search}
                    onChange={e => { setSearch(e.target.value); setSelectedFood(null); }}
                    placeholder="Search food name…"
                    style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, background: 'transparent' }}
                  />
                  {search && <button onClick={() => { setSearch(''); setSelectedFood(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 16 }}>✕</button>}
                </div>

                {selectedFood && (
                  <div style={{ background: '#f0faf5', border: '2px solid #4CAF82', borderRadius: 14, padding: 14, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 28 }}>{selectedFood.emoji}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedFood.name}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>Per 100g: {selectedFood.calories} kcal</div>
                      </div>
                      <button onClick={() => setSelectedFood(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 16 }}>✕</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#555', whiteSpace: 'nowrap' }}>Weight (g):</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button onClick={() => setWeight(w => String(Math.max(5, Number(w) - 25)))} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 16 }}>−</button>
                        <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
                          style={{ width: 64, textAlign: 'center', border: '1px solid #ddd', borderRadius: 8, padding: '4px 0', fontSize: 14, fontWeight: 700 }}
                        />
                        <button onClick={() => setWeight(w => String(Number(w) + 25))} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 16 }}>+</button>
                      </div>
                    </div>
                    {scaledNutrition && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                        <span className="macro-pill pill-cal">{scaledNutrition.cal} kcal</span>
                        <span className="macro-pill pill-pro">P:{scaledNutrition.protein}g</span>
                        <span className="macro-pill pill-carb">C:{scaledNutrition.carbs}g</span>
                        <span className="macro-pill pill-fat">F:{scaledNutrition.fat}g</span>
                      </div>
                    )}
                    <button onClick={addFromSearch} className="btn-primary">Add to {MEAL_TABS[activeTab]}</button>
                  </div>
                )}

                {!selectedFood && (
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {searchLoading && (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: '#aaa', fontSize: 13 }}>
                        Searching…
                      </div>
                    )}
                    {!searchLoading && displayFoods.map(f => (
                      <div key={f.id} onClick={() => setSelectedFood(f)} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                        borderRadius: 12, marginBottom: 4, cursor: 'pointer', background: '#f8f9fa',
                      }}>
                        <span style={{ fontSize: 24 }}>{f.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{f.name}</div>
                          <div style={{ fontSize: 11, color: '#aaa' }}>{f.calories} kcal · P:{f.protein}g · C:{f.carbs}g · F:{f.fat}g per 100g</div>
                        </div>
                        <span style={{ color: '#4CAF82', fontSize: 20 }}>›</span>
                      </div>
                    ))}
                    {!searchLoading && search.trim() && displayFoods.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: '#aaa', fontSize: 13 }}>
                        No results found — try Manual Entry
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── AI SCAN ── */}
            {modalTab === 'ai' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 24px' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>AI Food Recognition</div>
                <div style={{ fontSize: 12, color: '#aaa', marginBottom: 14 }}>Upload a photo — AI will identify the food and estimate nutrition.</div>
                <input ref={aiInputRef} type="file" accept="image/*" capture="environment" onChange={handleAiPhoto} style={{ display: 'none' }}/>
                <div onClick={() => !aiLoading && aiInputRef.current?.click()} style={{
                  border: '2px dashed #d0d0d0', borderRadius: 16, minHeight: 180,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: aiLoading ? 'default' : 'pointer', overflow: 'hidden',
                  background: aiPhoto ? 'transparent' : '#fafafa', marginBottom: 14, position: 'relative',
                }}>
                  {aiPhoto
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={aiPhoto} alt="food" style={{ width: '100%', maxHeight: 220, objectFit: 'cover' }}/>
                    : (
                      <>
                        <span style={{ fontSize: 40, marginBottom: 8 }}>📷</span>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#888' }}>Tap to upload photo</div>
                        <div style={{ fontSize: 12, color: '#bbb', marginTop: 4 }}>Camera or gallery</div>
                      </>
                    )
                  }
                  {aiLoading && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <div style={{ fontSize: 32 }}>🤖</div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Analysing food…</div>
                      <div style={{ width: 120, height: 4, background: 'rgba(255,255,255,.3)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: '#4CAF82', borderRadius: 2, animation: 'loadBar 1.8s ease forwards' }}/>
                      </div>
                    </div>
                  )}
                </div>
                {aiError && !aiLoading && (
                  <div style={{ background: '#fff5f5', border: '2px solid #FF6B6B', borderRadius: 14, padding: 14, marginBottom: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#c0392b', marginBottom: 8 }}>⚠️ {aiError}</div>
                    <button onClick={() => { setAiPhoto(null); setAiError(null); }} className="btn-secondary">Try again</button>
                  </div>
                )}
                {aiResult && !aiLoading && (
                  <div style={{ background: '#f5f0ff', border: '2px solid #9B59B6', borderRadius: 16, padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 28 }}>{aiResult.emoji}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{aiResult.name}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                          <span style={{ fontSize: 11, color: '#9B59B6', fontWeight: 600 }}>🎯 {Math.round(((aiResult as Record<string, unknown>).confidence as number ?? 0.9) * 100)}% confidence</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                      <span className="macro-pill pill-cal">{aiResult.calories} kcal</span>
                      <span className="macro-pill pill-pro">P:{aiResult.protein}g</span>
                      <span className="macro-pill pill-carb">C:{aiResult.carbs}g</span>
                      <span className="macro-pill pill-fat">F:{aiResult.fat}g</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { setAiPhoto(null); setAiResult(null); }} className="btn-secondary" style={{ flex: 1 }}>Retake</button>
                      <button onClick={addFromAI} className="btn-primary" style={{ flex: 2 }}>Add to {MEAL_TABS[activeTab]}</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── MANUAL ── */}
            {modalTab === 'manual' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 24px' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>Manual Entry</div>
                <div style={{ fontSize: 12, color: '#aaa', marginBottom: 14 }}>Optionally attach a photo and fill in the nutrition details.</div>
                <input ref={manualInputRef} type="file" accept="image/*" capture="environment" onChange={handleManualPhoto} style={{ display: 'none' }}/>
                <div onClick={() => manualInputRef.current?.click()} style={{
                  border: '2px dashed #e0e0e0', borderRadius: 14, height: mPhoto ? 160 : 80,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14, overflow: 'hidden', background: '#fafafa', position: 'relative',
                }}>
                  {mPhoto
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={mPhoto} alt="food" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    : <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#bbb' }}>
                        <span style={{ fontSize: 22 }}>📎</span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>Attach photo (optional)</span>
                      </div>
                  }
                  {mPhoto && (
                    <button onClick={e => { e.stopPropagation(); setMPhoto(null); }} style={{
                      position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.5)',
                      border: 'none', borderRadius: '50%', width: 24, height: 24,
                      color: '#fff', cursor: 'pointer', fontSize: 11,
                    }}>✕</button>
                  )}
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 5 }}>Food name *</div>
                  <input className="form-input" value={mName} onChange={e => setMName(e.target.value)} placeholder="e.g. Grilled Chicken Salad"/>
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 5 }}>Weight (g)</div>
                    <input className="form-input" type="number" value={mQty} onChange={e => setMQty(e.target.value)} placeholder="100"/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 5 }}>Calories *</div>
                    <input className="form-input" type="number" value={mCal} onChange={e => setMCal(e.target.value)} placeholder="kcal"/>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 5 }}>Protein (g)</div>
                    <input className="form-input" type="number" value={mPro} onChange={e => setMPro(e.target.value)} placeholder="0"/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 5 }}>Carbs (g)</div>
                    <input className="form-input" type="number" value={mCarb} onChange={e => setMCarb(e.target.value)} placeholder="0"/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 5 }}>Fat (g)</div>
                    <input className="form-input" type="number" value={mFat} onChange={e => setMFat(e.target.value)} placeholder="0"/>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={closeModal} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                  <button onClick={addManual} className="btn-primary" style={{ flex: 2 }}>Add to {MEAL_TABS[activeTab]}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a2e', color: '#fff', padding: '10px 20px', borderRadius: 20,
          fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', zIndex: 300,
        }}>{toast}</div>
      )}
      <style>{`@keyframes loadBar { from { width: 0% } to { width: 100% } }`}</style>
    </div>
  );
}
