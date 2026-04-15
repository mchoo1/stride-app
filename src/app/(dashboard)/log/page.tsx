'use client';
import { Suspense, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStrideStore } from '@/lib/store';

// ── Food database (subset) ────────────────────────────────────────────────────
const FOOD_DB = [
  { id: 'db1',  name: 'Chicken Breast (100g)',  emoji: '🍗', cal: 165, p: 31, c: 0,  f: 4  },
  { id: 'db2',  name: 'White Rice (100g)',       emoji: '🍚', cal: 130, p: 3,  c: 28, f: 0  },
  { id: 'db3',  name: 'Egg (whole)',             emoji: '🥚', cal: 70,  p: 6,  c: 0,  f: 5  },
  { id: 'db4',  name: 'Banana',                  emoji: '🍌', cal: 105, p: 1,  c: 27, f: 0  },
  { id: 'db5',  name: 'Greek Yogurt (100g)',     emoji: '🥛', cal: 59,  p: 10, c: 4,  f: 0  },
  { id: 'db6',  name: 'Oatmeal (100g dry)',      emoji: '🥣', cal: 389, p: 17, c: 66, f: 7  },
  { id: 'db7',  name: 'Salmon (100g)',           emoji: '🐟', cal: 208, p: 20, c: 0,  f: 13 },
  { id: 'db8',  name: 'Almonds (30g)',           emoji: '🥜', cal: 174, p: 6,  c: 6,  f: 15 },
  { id: 'db9',  name: 'Avocado (½)',             emoji: '🥑', cal: 120, p: 1,  c: 6,  f: 11 },
  { id: 'db10', name: 'Whole Milk (240ml)',      emoji: '🥛', cal: 149, p: 8,  c: 12, f: 8  },
  { id: 'db11', name: 'Sweet Potato (100g)',     emoji: '🍠', cal: 86,  p: 2,  c: 20, f: 0  },
  { id: 'db12', name: 'Broccoli (100g)',         emoji: '🥦', cal: 34,  p: 3,  c: 7,  f: 0  },
  { id: 'db13', name: 'Bread (1 slice)',         emoji: '🍞', cal: 79,  p: 3,  c: 15, f: 1  },
  { id: 'db14', name: 'Peanut Butter (2 tbsp)', emoji: '🥜', cal: 188, p: 8,  c: 6,  f: 16 },
  { id: 'db15', name: 'Protein Shake',          emoji: '🥤', cal: 150, p: 30, c: 5,  f: 3  },
  { id: 'db16', name: 'Tuna (85g can)',         emoji: '🐟', cal: 109, p: 24, c: 0,  f: 1  },
  { id: 'db17', name: 'Apple',                  emoji: '🍎', cal: 95,  p: 0,  c: 25, f: 0  },
  { id: 'db18', name: 'Cottage Cheese (100g)',  emoji: '🧀', cal: 98,  p: 11, c: 3,  f: 4  },
  { id: 'db19', name: 'Orange',                 emoji: '🍊', cal: 62,  p: 1,  c: 15, f: 0  },
  { id: 'db20', name: 'Brown Rice (100g)',      emoji: '🍚', cal: 111, p: 3,  c: 23, f: 1  },
];

// ── Activity database ─────────────────────────────────────────────────────────
const ACTIVITY_DB = [
  { id: 'a1',  name: 'Running',      emoji: '🏃', met: 9.8  },
  { id: 'a2',  name: 'Walking',      emoji: '🚶', met: 3.5  },
  { id: 'a3',  name: 'Cycling',      emoji: '🚴', met: 7.5  },
  { id: 'a4',  name: 'Swimming',     emoji: '🏊', met: 8.0  },
  { id: 'a5',  name: 'Weight Training', emoji: '🏋️', met: 5.0 },
  { id: 'a6',  name: 'HIIT',         emoji: '⚡', met: 10.0 },
  { id: 'a7',  name: 'Yoga',         emoji: '🧘', met: 2.5  },
  { id: 'a8',  name: 'Jump Rope',    emoji: '🪢', met: 11.0 },
  { id: 'a9',  name: 'Basketball',   emoji: '🏀', met: 6.5  },
  { id: 'a10', name: 'Soccer',       emoji: '⚽', met: 7.0  },
  { id: 'a11', name: 'Dancing',      emoji: '💃', met: 5.5  },
  { id: 'a12', name: 'Hiking',       emoji: '🥾', met: 6.0  },
];

const DURATION_PRESETS = [15, 20, 30, 45, 60, 90];
const PORTION_PRESETS  = [50, 100, 150, 200];
const MEAL_TYPES       = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

// ── Inner component (uses useSearchParams) ─────────────────────────────────────
function LogInner() {
  const router  = useRouter();
  const params  = useSearchParams();
  const store   = useStrideStore();

  const initialTab = params.get('tab') === 'activity' ? 'activity' : 'food';
  const [tab, setTab] = useState<'food' | 'scan' | 'activity'>(initialTab);

  // ── Food tab state ──────────────────────────────────────────────────────────
  const [query,        setQuery]        = useState('');
  const [selectedFood, setSelectedFood] = useState<typeof FOOD_DB[0] | null>(null);
  const [portion,      setPortion]      = useState(100);
  const [customPortion,setCustomPortion]= useState('');
  const [mealType,     setMealType]     = useState<typeof MEAL_TYPES[number]>('lunch');
  const [manualMode,   setManualMode]   = useState(false);
  const [manual,       setManual]       = useState({ name: '', cal: '', p: '', c: '', f: '' });
  const [foodLogged,   setFoodLogged]   = useState(false);

  // ── Scan tab state ──────────────────────────────────────────────────────────
  const fileRef        = useRef<HTMLInputElement>(null);
  const [scanImg,      setScanImg]      = useState<string | null>(null);
  const [scanResult,   setScanResult]   = useState<null | { name: string; calories: number; protein: number; carbs: number; fat: number; emoji: string }>(null);
  const [scanning,     setScanning]     = useState(false);
  const [scanError,    setScanError]    = useState('');
  const [scanLogged,   setScanLogged]   = useState(false);

  // ── Activity tab state ──────────────────────────────────────────────────────
  const [selectedAct,  setSelectedAct]  = useState<typeof ACTIVITY_DB[0] | null>(null);
  const [duration,     setDuration]     = useState(30);
  const [actLogged,    setActLogged]    = useState(false);

  const weight = store.profile.currentWeight || 70;

  // ── Computed ────────────────────────────────────────────────────────────────
  const effectivePortion = customPortion ? Number(customPortion) : portion;
  const scale = effectivePortion / 100;

  const previewCal  = selectedFood ? Math.round(selectedFood.cal  * scale) : 0;
  const previewProt = selectedFood ? Math.round(selectedFood.p    * scale) : 0;
  const previewCarb = selectedFood ? Math.round(selectedFood.c    * scale) : 0;
  const previewFat  = selectedFood ? Math.round(selectedFood.f    * scale) : 0;

  const burnEstimate = selectedAct
    ? Math.round((selectedAct.met * weight * duration) / 60)
    : 0;

  const filtered = FOOD_DB.filter(f =>
    f.name.toLowerCase().includes(query.toLowerCase())
  );

  // ── Handlers ────────────────────────────────────────────────────────────────
  const logFood = () => {
    if (!selectedFood) return;
    store.addFoodEntry({
      foodItemId: selectedFood.id,
      name:       selectedFood.name,
      emoji:      selectedFood.emoji,
      mealType,
      quantity:   effectivePortion,
      calories:   previewCal,
      protein:    previewProt,
      carbs:      previewCarb,
      fat:        previewFat,
    });
    setFoodLogged(true);
    setTimeout(() => { setFoodLogged(false); setSelectedFood(null); setQuery(''); }, 1600);
  };

  const logManual = () => {
    if (!manual.name || !manual.cal) return;
    store.addFoodEntry({
      foodItemId: `manual_${Date.now()}`,
      name:       manual.name,
      emoji:      '🍽️',
      mealType,
      quantity:   100,
      calories:   Number(manual.cal),
      protein:    Number(manual.p)  || 0,
      carbs:      Number(manual.c)  || 0,
      fat:        Number(manual.f)  || 0,
    });
    setFoodLogged(true);
    setTimeout(() => { setFoodLogged(false); setManual({ name: '', cal: '', p: '', c: '', f: '' }); }, 1600);
  };

  const handleScanUpload = async (file: File) => {
    setScanError('');
    setScanResult(null);
    setScanLogged(false);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      setScanImg(e.target?.result as string);
      setScanning(true);
      try {
        const res  = await fetch('/api/scan-food', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, mimeType: file.type }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setScanResult(data);
      } catch (err: unknown) {
        setScanError(err instanceof Error ? err.message : 'Scan failed');
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const logScanResult = () => {
    if (!scanResult) return;
    store.addFoodEntry({
      foodItemId: `scan_${Date.now()}`,
      name:       scanResult.name,
      emoji:      scanResult.emoji || '📷',
      mealType,
      quantity:   100,
      calories:   scanResult.calories,
      protein:    scanResult.protein,
      carbs:      scanResult.carbs,
      fat:        scanResult.fat,
    });
    setScanLogged(true);
    setTimeout(() => { setScanLogged(false); setScanResult(null); setScanImg(null); }, 1600);
  };

  const logActivity = () => {
    if (!selectedAct) return;
    store.addActivityEntry({
      activityId:    selectedAct.id,
      name:          selectedAct.name,
      emoji:         selectedAct.emoji,
      durationMins:  duration,
      caloriesBurned: burnEstimate,
      intensity:     'moderate',
      source:        'manual',
    });
    setActLogged(true);
    setTimeout(() => { setActLogged(false); setSelectedAct(null); }, 1600);
  };

  // ── Styles ───────────────────────────────────────────────────────────────────
  const cardStyle = {
    background: '#161622', borderRadius: 20, padding: 16,
    border: '1px solid rgba(255,255,255,0.06)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#1E1E2E',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12, padding: '11px 14px',
    fontSize: 15, color: '#F0F0F8', outline: 'none',
    fontFamily: 'Inter, sans-serif',
  };

  const tabBtnStyle = (active: boolean, color: string): React.CSSProperties => ({
    flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
    background: active ? `${color}20` : 'transparent',
    color: active ? color : '#44445A',
    transition: 'all .2s',
  });

  return (
    <div style={{ background: '#0C0C14', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div style={{ padding: '52px 20px 0', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={() => router.back()} style={{
          background: '#1E1E2E', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10, width: 36, height: 36, color: '#9090B0',
          fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>←</button>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#F0F0F8', margin: 0, flex: 1 }}>Log</h1>
      </div>

      {/* ── Tab Switcher ── */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={{
          background: '#161622', borderRadius: 16, padding: 4,
          display: 'flex', gap: 4, border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <button style={tabBtnStyle(tab === 'food',     '#00E676')} onClick={() => setTab('food')}>
            🍽 Food
          </button>
          <button style={tabBtnStyle(tab === 'scan',     '#4A9EFF')} onClick={() => setTab('scan')}>
            📷 Scan
          </button>
          <button style={tabBtnStyle(tab === 'activity', '#FF6B35')} onClick={() => setTab('activity')}>
            ⚡ Activity
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px 100px' }}>

        {/* ══════════════════════ FOOD TAB ══════════════════════ */}
        {tab === 'food' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Meal type selector */}
            <div style={{ display: 'flex', gap: 8 }}>
              {MEAL_TYPES.map(m => (
                <button key={m} onClick={() => setMealType(m)} style={{
                  flex: 1, padding: '8px 0', borderRadius: 12, border: 'none',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize',
                  background: mealType === m ? 'rgba(0,230,118,0.15)' : '#1E1E2E',
                  color:      mealType === m ? '#00E676' : '#44445A',
                  transition: 'all .2s',
                }}>{m}</button>
              ))}
            </div>

            {/* Toggle manual */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setManualMode(!manualMode)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, color: '#44445A', padding: 0,
              }}>
                {manualMode ? '← Search foods' : '✏️ Manual entry'}
              </button>
            </div>

            {manualMode ? (
              /* ── Manual entry ── */
              <div style={cardStyle}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#F0F0F8', marginBottom: 12 }}>Manual Entry</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    style={inputStyle} placeholder="Food name"
                    value={manual.name} onChange={e => setManual(v => ({ ...v, name: e.target.value }))}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <input style={inputStyle} placeholder="Calories" type="number"
                      value={manual.cal} onChange={e => setManual(v => ({ ...v, cal: e.target.value }))}/>
                    <input style={inputStyle} placeholder="Protein (g)" type="number"
                      value={manual.p} onChange={e => setManual(v => ({ ...v, p: e.target.value }))}/>
                    <input style={inputStyle} placeholder="Carbs (g)" type="number"
                      value={manual.c} onChange={e => setManual(v => ({ ...v, c: e.target.value }))}/>
                    <input style={inputStyle} placeholder="Fat (g)" type="number"
                      value={manual.f} onChange={e => setManual(v => ({ ...v, f: e.target.value }))}/>
                  </div>
                  <button onClick={logManual} disabled={!manual.name || !manual.cal} style={{
                    background: foodLogged ? '#00c864' : '#00E676', color: '#000',
                    border: 'none', borderRadius: 14, padding: '13px 0',
                    fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all .2s',
                    opacity: (!manual.name || !manual.cal) ? 0.4 : 1,
                  }}>
                    {foodLogged ? '✓ Logged!' : 'Log Food'}
                  </button>
                </div>
              </div>
            ) : (
              /* ── Search & select ── */
              <>
                <div style={cardStyle}>
                  <input
                    style={inputStyle}
                    placeholder="Search food…"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setSelectedFood(null); }}
                  />
                  {query && !selectedFood && (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 240, overflowY: 'auto' }}>
                      {filtered.length === 0 ? (
                        <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 13, color: '#44445A' }}>No results</div>
                      ) : filtered.map(f => (
                        <button key={f.id} onClick={() => { setSelectedFood(f); setQuery(f.name); setPortion(100); setCustomPortion(''); }} style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 8px', borderRadius: 10, textAlign: 'left',
                          transition: 'background .15s',
                        }}
                        onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                        onMouseOut={e  => (e.currentTarget.style.background = 'none')}
                        >
                          <span style={{ fontSize: 20 }}>{f.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#F0F0F8' }}>{f.name}</div>
                            <div style={{ fontSize: 11, color: '#44445A' }}>{f.cal} kcal · P{f.p} C{f.c} F{f.f}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedFood && (
                  <>
                    {/* Portion picker */}
                    <div style={cardStyle}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#9090B0', marginBottom: 10 }}>Portion (g)</div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        {PORTION_PRESETS.map(p => (
                          <button key={p} onClick={() => { setPortion(p); setCustomPortion(''); }} style={{
                            flex: 1, padding: '9px 0', borderRadius: 12, border: 'none',
                            fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            background: portion === p && !customPortion ? 'rgba(0,230,118,0.15)' : '#1E1E2E',
                            color:      portion === p && !customPortion ? '#00E676' : '#44445A',
                            transition: 'all .2s',
                          }}>{p}</button>
                        ))}
                      </div>
                      <input
                        style={{ ...inputStyle, fontSize: 14 }}
                        type="number" placeholder="Custom grams…"
                        value={customPortion}
                        onChange={e => setCustomPortion(e.target.value)}
                      />
                    </div>

                    {/* Macro preview */}
                    <div style={{ ...cardStyle, background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.15)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 24 }}>{selectedFood.emoji}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#F0F0F8' }}>{selectedFood.name}</span>
                        </div>
                        <span style={{ fontSize: 11, color: '#44445A' }}>{effectivePortion}g</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[
                          { label: 'CAL',  val: previewCal,  color: '#FF5A5A' },
                          { label: 'PRO',  val: previewProt, color: '#4A9EFF' },
                          { label: 'CARB', val: previewCarb, color: '#FFD166' },
                          { label: 'FAT',  val: previewFat,  color: '#00E676' },
                        ].map(m => (
                          <div key={m.label} style={{
                            flex: 1, borderRadius: 12, padding: '8px 4px', textAlign: 'center',
                            background: '#161622',
                          }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: m.color }}>{m.val}</div>
                            <div style={{ fontSize: 9, fontWeight: 700, color: '#44445A', marginTop: 2 }}>{m.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button onClick={logFood} style={{
                      background: foodLogged ? '#00c864' : '#00E676', color: '#000',
                      border: 'none', borderRadius: 16, padding: '15px 0',
                      fontSize: 15, fontWeight: 800, cursor: 'pointer', width: '100%',
                      transition: 'all .2s',
                      boxShadow: '0 0 24px rgba(0,230,118,0.30)',
                    }}>
                      {foodLogged ? '✓ Logged!' : `Log ${effectivePortion}g of ${selectedFood.name}`}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ══════════════════════ SCAN TAB ══════════════════════ */}
        {tab === 'scan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input ref={fileRef} type="file" accept="image/*" capture="environment"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleScanUpload(f); }}
            />

            {!scanImg ? (
              <button onClick={() => fileRef.current?.click()} style={{
                background: '#161622', border: '2px dashed rgba(74,158,255,0.25)',
                borderRadius: 24, minHeight: 200, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 12, color: '#44445A', transition: 'all .2s',
              }}
              onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(74,158,255,0.6)')}
              onMouseOut={e  => (e.currentTarget.style.borderColor = 'rgba(74,158,255,0.25)')}
              >
                <span style={{ fontSize: 44 }}>📷</span>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#9090B0' }}>Take a photo or upload</div>
                <div style={{ fontSize: 12, color: '#44445A' }}>AI will identify the food & macros</div>
              </button>
            ) : (
              <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={scanImg} alt="Scanned food" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', display: 'block' }} />
                <button onClick={() => { setScanImg(null); setScanResult(null); setScanError(''); setScanLogged(false); }} style={{
                  position: 'absolute', top: 10, right: 10,
                  background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                  width: 30, height: 30, color: '#fff', cursor: 'pointer', fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✕</button>
              </div>
            )}

            {scanning && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div className="spinner" style={{ margin: '0 auto 12px' }}/>
                <div style={{ fontSize: 13, color: '#9090B0' }}>Analysing with AI…</div>
              </div>
            )}

            {scanError && (
              <div style={{ background: 'rgba(255,90,90,0.10)', border: '1px solid rgba(255,90,90,0.2)', borderRadius: 14, padding: '12px 14px' }}>
                <div style={{ fontSize: 13, color: '#FF5A5A' }}>⚠️ {scanError}</div>
              </div>
            )}

            {scanResult && (
              <>
                <div style={{ ...cardStyle, background: 'rgba(74,158,255,0.06)', border: '1px solid rgba(74,158,255,0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 28 }}>{scanResult.emoji || '🍽️'}</span>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#F0F0F8' }}>{scanResult.name}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { label: 'CAL',  val: scanResult.calories, color: '#FF5A5A' },
                      { label: 'PRO',  val: scanResult.protein,  color: '#4A9EFF' },
                      { label: 'CARB', val: scanResult.carbs,    color: '#FFD166' },
                      { label: 'FAT',  val: scanResult.fat,      color: '#00E676' },
                    ].map(m => (
                      <div key={m.label} style={{ flex: 1, borderRadius: 12, padding: '8px 4px', textAlign: 'center', background: '#161622' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: m.color }}>{m.val}</div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#44445A', marginTop: 2 }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={logScanResult} style={{
                  background: scanLogged ? '#00c864' : '#4A9EFF', color: '#fff',
                  border: 'none', borderRadius: 16, padding: '15px 0',
                  fontSize: 15, fontWeight: 800, cursor: 'pointer', width: '100%',
                  transition: 'all .2s', boxShadow: '0 0 24px rgba(74,158,255,0.30)',
                }}>
                  {scanLogged ? '✓ Logged!' : 'Log This Food'}
                </button>
              </>
            )}

            <div style={{
              background: 'rgba(74,158,255,0.06)', borderRadius: 14, padding: '12px 14px',
              display: 'flex', gap: 8,
            }}>
              <span style={{ fontSize: 14 }}>💡</span>
              <span style={{ fontSize: 12, color: '#4A9EFF', lineHeight: 1.6 }}>
                AI scan uses <strong>Claude claude-3-5-haiku-20241022</strong>. Add <code style={{ background: '#1E1E2E', borderRadius: 4, padding: '1px 4px' }}>ANTHROPIC_API_KEY</code> to your env to enable it.
              </span>
            </div>
          </div>
        )}

        {/* ══════════════════════ ACTIVITY TAB ══════════════════════ */}
        {tab === 'activity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Activity grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {ACTIVITY_DB.map(a => (
                <button key={a.id} onClick={() => setSelectedAct(a)} style={{
                  background: selectedAct?.id === a.id ? 'rgba(255,107,53,0.15)' : '#161622',
                  border: selectedAct?.id === a.id ? '1px solid rgba(255,107,53,0.4)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16, padding: '14px 8px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  cursor: 'pointer', transition: 'all .2s',
                }}>
                  <span style={{ fontSize: 26 }}>{a.emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: selectedAct?.id === a.id ? '#FF6B35' : '#9090B0' }}>
                    {a.name}
                  </span>
                </button>
              ))}
            </div>

            {selectedAct && (
              <>
                {/* Duration picker */}
                <div style={cardStyle}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#9090B0', marginBottom: 10 }}>Duration (min)</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {DURATION_PRESETS.map(d => (
                      <button key={d} onClick={() => setDuration(d)} style={{
                        padding: '9px 14px', borderRadius: 12, border: 'none',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        background: duration === d ? 'rgba(255,107,53,0.15)' : '#1E1E2E',
                        color:      duration === d ? '#FF6B35' : '#44445A',
                        transition: 'all .2s',
                      }}>{d}</button>
                    ))}
                  </div>
                </div>

                {/* Burn estimate */}
                <div style={{ ...cardStyle, background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 32 }}>{selectedAct.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#F0F0F8' }}>{selectedAct.name}</div>
                      <div style={{ fontSize: 12, color: '#44445A', marginTop: 2 }}>{duration} min · {weight} kg</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 28, fontWeight: 900, color: '#FF6B35' }}>{burnEstimate}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#44445A' }}>kcal burned</div>
                    </div>
                  </div>
                </div>

                <button onClick={logActivity} style={{
                  background: actLogged ? '#c84f00' : '#FF6B35', color: '#fff',
                  border: 'none', borderRadius: 16, padding: '15px 0',
                  fontSize: 15, fontWeight: 800, cursor: 'pointer', width: '100%',
                  transition: 'all .2s', boxShadow: '0 0 24px rgba(255,107,53,0.30)',
                }}>
                  {actLogged ? '✓ Logged!' : `Log ${duration}min of ${selectedAct.name}`}
                </button>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// ── Page wrapper with Suspense ─────────────────────────────────────────────────
export default function LogPage() {
  return (
    <Suspense fallback={<div style={{ background: '#0C0C14', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner"/>
    </div>}>
      <LogInner />
    </Suspense>
  );
}
