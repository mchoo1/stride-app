'use client';
import { Suspense, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStrideStore } from '@/lib/store';

// ── Food database ─────────────────────────────────────────────────────────────
const FOOD_DB = [
  { id: 'db1',  name: 'Chicken Breast (100g)',   emoji: '🍗', cal: 165, p: 31, c: 0,  f: 4  },
  { id: 'db2',  name: 'White Rice (100g)',        emoji: '🍚', cal: 130, p: 3,  c: 28, f: 0  },
  { id: 'db3',  name: 'Egg (whole)',              emoji: '🥚', cal: 70,  p: 6,  c: 0,  f: 5  },
  { id: 'db4',  name: 'Banana',                   emoji: '🍌', cal: 105, p: 1,  c: 27, f: 0  },
  { id: 'db5',  name: 'Greek Yogurt (100g)',      emoji: '🥛', cal: 59,  p: 10, c: 4,  f: 0  },
  { id: 'db6',  name: 'Oatmeal (100g dry)',       emoji: '🥣', cal: 389, p: 17, c: 66, f: 7  },
  { id: 'db7',  name: 'Salmon (100g)',            emoji: '🐟', cal: 208, p: 20, c: 0,  f: 13 },
  { id: 'db8',  name: 'Almonds (30g)',            emoji: '🥜', cal: 174, p: 6,  c: 6,  f: 15 },
  { id: 'db9',  name: 'Avocado (½)',              emoji: '🥑', cal: 120, p: 1,  c: 6,  f: 11 },
  { id: 'db10', name: 'Whole Milk (240ml)',       emoji: '🥛', cal: 149, p: 8,  c: 12, f: 8  },
  { id: 'db11', name: 'Sweet Potato (100g)',      emoji: '🍠', cal: 86,  p: 2,  c: 20, f: 0  },
  { id: 'db12', name: 'Broccoli (100g)',          emoji: '🥦', cal: 34,  p: 3,  c: 7,  f: 0  },
  { id: 'db13', name: 'Bread (1 slice)',          emoji: '🍞', cal: 79,  p: 3,  c: 15, f: 1  },
  { id: 'db14', name: 'Peanut Butter (2 tbsp)',   emoji: '🥜', cal: 188, p: 8,  c: 6,  f: 16 },
  { id: 'db15', name: 'Protein Shake',            emoji: '🥤', cal: 150, p: 30, c: 5,  f: 3  },
  { id: 'db16', name: 'Tuna (85g can)',           emoji: '🐟', cal: 109, p: 24, c: 0,  f: 1  },
  { id: 'db17', name: 'Apple',                    emoji: '🍎', cal: 95,  p: 0,  c: 25, f: 0  },
  { id: 'db18', name: 'Cottage Cheese (100g)',    emoji: '🧀', cal: 98,  p: 11, c: 3,  f: 4  },
  { id: 'db19', name: 'Orange',                   emoji: '🍊', cal: 62,  p: 1,  c: 15, f: 0  },
  { id: 'db20', name: 'Brown Rice (100g)',        emoji: '🍚', cal: 111, p: 3,  c: 23, f: 1  },
  { id: 'db21', name: 'Turkey Breast (100g)',     emoji: '🦃', cal: 135, p: 30, c: 0,  f: 1  },
  { id: 'db22', name: 'Quinoa (100g cooked)',     emoji: '🌾', cal: 120, p: 4,  c: 22, f: 2  },
  { id: 'db23', name: 'Cheddar Cheese (30g)',     emoji: '🧀', cal: 120, p: 7,  c: 0,  f: 10 },
  { id: 'db24', name: 'Pasta (100g cooked)',      emoji: '🍝', cal: 131, p: 5,  c: 25, f: 1  },
  { id: 'db25', name: 'Pizza slice',              emoji: '🍕', cal: 285, p: 12, c: 36, f: 10 },
  { id: 'db26', name: 'Burger (beef)',            emoji: '🍔', cal: 350, p: 20, c: 30, f: 15 },
  { id: 'db27', name: 'Sushi roll (6 pcs)',       emoji: '🍣', cal: 200, p: 8,  c: 38, f: 2  },
  { id: 'db28', name: 'Latte (medium)',           emoji: '☕', cal: 190, p: 7,  c: 24, f: 7  },
  { id: 'db29', name: 'Orange Juice (240ml)',     emoji: '🍊', cal: 112, p: 2,  c: 26, f: 0  },
  { id: 'db30', name: 'Mixed Salad (200g)',       emoji: '🥗', cal: 60,  p: 3,  c: 10, f: 2  },
];

// ── Activity list ─────────────────────────────────────────────────────────────
const ACTIVITY_LIST = [
  // Distance-based
  { id: 'run',        name: 'Running',        emoji: '🏃', met: 9.8,  hasDistance: true,  hasType: false },
  { id: 'walk',       name: 'Walking',        emoji: '🚶', met: 3.5,  hasDistance: true,  hasType: false },
  { id: 'cycle',      name: 'Cycling',        emoji: '🚴', met: 7.5,  hasDistance: true,  hasType: false },
  { id: 'swim',       name: 'Swimming',       emoji: '🏊', met: 8.0,  hasDistance: true,  hasType: false },
  { id: 'hike',       name: 'Hiking',         emoji: '🥾', met: 6.0,  hasDistance: true,  hasType: false },
  // Gym / Studio
  { id: 'gym',        name: 'Weight Training',emoji: '🏋️', met: 5.0,  hasDistance: false, hasType: false },
  { id: 'hiit',       name: 'HIIT',           emoji: '⚡', met: 10.0, hasDistance: false, hasType: false },
  { id: 'yoga',       name: 'Yoga',           emoji: '🧘', met: 2.5,  hasDistance: false, hasType: false },
  { id: 'pilates',    name: 'Pilates',        emoji: '🤸', met: 3.0,  hasDistance: false, hasType: false },
  { id: 'boxing',     name: 'Boxing',         emoji: '🥊', met: 9.0,  hasDistance: false, hasType: false },
  { id: 'jumprope',   name: 'Jump Rope',      emoji: '🪢', met: 11.0, hasDistance: false, hasType: false },
  { id: 'elliptical', name: 'Elliptical',     emoji: '🔄', met: 5.0,  hasDistance: false, hasType: false },
  { id: 'rowing',     name: 'Rowing',         emoji: '🚣', met: 7.0,  hasDistance: false, hasType: false },
  { id: 'stair',      name: 'Stair Climbing', emoji: '🪜', met: 8.0,  hasDistance: false, hasType: false },
  { id: 'stretch',    name: 'Stretching',     emoji: '🙆', met: 2.3,  hasDistance: false, hasType: false },
  // Racket sports
  { id: 'tennis',     name: 'Tennis',         emoji: '🎾', met: 8.0,  hasDistance: false, hasType: false },
  { id: 'badminton',  name: 'Badminton',      emoji: '🏸', met: 5.5,  hasDistance: false, hasType: false },
  { id: 'squash',     name: 'Squash',         emoji: '🎾', met: 12.0, hasDistance: false, hasType: false },
  // Team sports (user specifies which)
  { id: 'soccer',     name: 'Soccer',         emoji: '⚽', met: 7.0,  hasDistance: false, hasType: false },
  { id: 'basketball', name: 'Basketball',     emoji: '🏀', met: 6.5,  hasDistance: false, hasType: false },
  { id: 'football',   name: 'Football',       emoji: '🏈', met: 8.0,  hasDistance: false, hasType: false },
  { id: 'rugby',      name: 'Rugby',          emoji: '🏉', met: 8.3,  hasDistance: false, hasType: false },
  { id: 'volleyball', name: 'Volleyball',     emoji: '🏐', met: 4.0,  hasDistance: false, hasType: false },
  { id: 'hockey',     name: 'Hockey',         emoji: '🏒', met: 8.0,  hasDistance: false, hasType: false },
  { id: 'cricket',    name: 'Cricket',        emoji: '🏏', met: 5.0,  hasDistance: false, hasType: false },
  { id: 'baseball',   name: 'Baseball',       emoji: '⚾', met: 5.0,  hasDistance: false, hasType: false },
  { id: 'netball',    name: 'Netball',        emoji: '🏐', met: 5.5,  hasDistance: false, hasType: false },
  { id: 'handball',   name: 'Handball',       emoji: '🤾', met: 8.0,  hasDistance: false, hasType: false },
  // Other
  { id: 'dance',      name: 'Dancing',        emoji: '💃', met: 5.5,  hasDistance: false, hasType: false },
  { id: 'golf',       name: 'Golf',           emoji: '⛳', met: 4.5,  hasDistance: false, hasType: false },
  { id: 'surf',       name: 'Surfing',        emoji: '🏄', met: 6.0,  hasDistance: false, hasType: false },
  { id: 'climb',      name: 'Rock Climbing',  emoji: '🧗', met: 8.0,  hasDistance: false, hasType: false },
  { id: 'waterpolo',  name: 'Water Polo',     emoji: '🤽', met: 10.0, hasDistance: false, hasType: false },
  { id: 'other',      name: 'Other',          emoji: '🔥', met: 5.0,  hasDistance: false, hasType: true  },
];

const DURATION_PRESETS = [15, 30, 45, 60, 90];
const PORTION_PRESETS  = [50, 100, 150, 200];
const MEAL_TYPES       = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

// Gender-adjusted calorie burn: females ~10% lower on average
const GENDER_FACTOR: Record<string, number> = { male: 1.0, female: 0.90, other: 0.95 };

// ── Inner component ───────────────────────────────────────────────────────────
function LogInner() {
  const router  = useRouter();
  const params  = useSearchParams();
  const store   = useStrideStore();

  const initialTab = params.get('tab') === 'activity' ? 'activity' : 'food';
  const [tab, setTab] = useState<'food' | 'scan' | 'activity'>(initialTab);

  // ── Food tab state ──────────────────────────────────────────────────────────
  const [query,         setQuery]         = useState('');
  const [selectedFood,  setSelectedFood]  = useState<typeof FOOD_DB[0] | null>(null);
  const [portion,       setPortion]       = useState(100);
  const [customPortion, setCustomPortion] = useState('');
  const [mealType,      setMealType]      = useState<typeof MEAL_TYPES[number]>('lunch');
  const [manualMode,    setManualMode]    = useState(false);
  const [manual,        setManual]        = useState({ name: '', cal: '', p: '', c: '', f: '' });
  const [foodLogged,    setFoodLogged]    = useState(false);

  // ── Scan tab state ──────────────────────────────────────────────────────────
  const fileRef     = useRef<HTMLInputElement>(null);
  const [scanImg,   setScanImg]   = useState<string | null>(null);
  const [scanResult,setScanResult]= useState<null | { name: string; calories: number; protein: number; carbs: number; fat: number; emoji: string }>(null);
  const [scanning,  setScanning]  = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanLogged,setScanLogged]= useState(false);

  // ── Activity tab state ──────────────────────────────────────────────────────
  const [selectedAct,   setSelectedAct]   = useState<typeof ACTIVITY_LIST[0] | null>(null);
  const [duration,      setDuration]      = useState(30);
  const [customDuration,setCustomDuration]= useState('');
  const [distance,      setDistance]      = useState('');   // km, for run/walk/cycle/swim/hike
  const [activityType,  setActivityType]  = useState('');   // free-text, for "Other"
  const [customCalories,setCustomCalories]= useState('');
  const [actLogged,     setActLogged]     = useState(false);

  const profile = store.profile;
  const weight  = profile.currentWeight || 70;
  const gender  = profile.gender || 'male';
  const gFactor = GENDER_FACTOR[gender] ?? 1.0;

  // ── Computed ────────────────────────────────────────────────────────────────
  const effectiveDuration  = customDuration  ? Number(customDuration)  : duration;
  const effectivePortion   = customPortion   ? Number(customPortion)   : portion;
  const scale = effectivePortion / 100;

  const previewCal  = selectedFood ? Math.round(selectedFood.cal  * scale) : 0;
  const previewProt = selectedFood ? Math.round(selectedFood.p    * scale) : 0;
  const previewCarb = selectedFood ? Math.round(selectedFood.c    * scale) : 0;
  const previewFat  = selectedFood ? Math.round(selectedFood.f    * scale) : 0;

  // For "Other", use typed name; otherwise use activity name
  const effectiveAct = selectedAct
    ? { ...selectedAct, name: (selectedAct.hasType && activityType) ? activityType : selectedAct.name }
    : null;

  const autoBurnEstimate = effectiveAct
    ? Math.round(effectiveAct.met * weight * (effectiveDuration / 60) * gFactor)
    : 0;

  // Use manual override if provided, otherwise use auto estimate
  const burnEstimate = customCalories ? Number(customCalories) : autoBurnEstimate;

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
    setScanError(''); setScanResult(null); setScanLogged(false);
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
    if (!effectiveAct) return;
    const distNote = distance ? ` · ${distance} km` : '';
    store.addActivityEntry({
      name:           effectiveAct.name + distNote,
      emoji:          effectiveAct.emoji,
      durationMins:   effectiveDuration,
      caloriesBurned: burnEstimate,
      intensity:      burnEstimate > 300 ? 'high' : burnEstimate > 150 ? 'medium' : 'low',
      source:         'manual',
    });
    setActLogged(true);
    setTimeout(() => {
      setActLogged(false); setSelectedAct(null);
      setCustomCalories(''); setCustomDuration(''); setDistance(''); setActivityType('');
    }, 1600);
  };

  // ── Design tokens ──
  const BG     = '#F7F8FB';
  const CARD   = '#FFFFFF';
  const BORDER = '#E5E9F2';
  const FG1    = '#0F1B2D';
  const FG2    = '#5B6576';
  const FG3    = '#8B95A7';
  const GREEN  = '#1E7F5C';
  const SHADOW = '0 1px 2px rgba(15,27,45,0.04), 0 2px 6px rgba(15,27,45,0.05)';

  // ── Styles ───────────────────────────────────────────────────────────────────
  const cardStyle = {
    background: CARD, borderRadius: 20, padding: 16,
    border: `1px solid ${BORDER}`, boxShadow: SHADOW,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: BG,
    border: `1.5px solid ${BORDER}`,
    borderRadius: 12, padding: '11px 14px',
    fontSize: 15, color: FG1, outline: 'none',
    fontFamily: 'Inter, sans-serif',
    transition: 'border-color .15s',
    boxSizing: 'border-box',
  };

  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
    background: active ? 'rgba(30,127,92,0.12)' : 'transparent',
    color: active ? GREEN : FG3,
    transition: 'all .2s',
  });

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div style={{ padding: '52px 20px 0', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={() => router.back()} style={{
          background: CARD, border: `1px solid ${BORDER}`,
          borderRadius: 10, width: 36, height: 36, color: FG2,
          fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: SHADOW,
        }}>←</button>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: FG1, margin: 0, flex: 1 }}>Log</h1>
      </div>

      {/* ── Tab Switcher ── */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={{
          background: CARD, borderRadius: 16, padding: 4,
          display: 'flex', gap: 4, border: `1px solid ${BORDER}`,
          boxShadow: SHADOW,
        }}>
          <button style={tabBtnStyle(tab === 'food')}     onClick={() => setTab('food')}>🍽 Food</button>
          <button style={tabBtnStyle(tab === 'scan')}     onClick={() => setTab('scan')}>📷 Scan</button>
          <button style={tabBtnStyle(tab === 'activity')} onClick={() => setTab('activity')}>⚡ Activity</button>
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
                  flex: 1, padding: '8px 0', borderRadius: 12,
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize',
                  background: mealType === m ? 'rgba(30,127,92,0.10)' : CARD,
                  color:      mealType === m ? GREEN : FG3,
                  border: `1px solid ${mealType === m ? 'rgba(30,127,92,0.28)' : BORDER}`,
                  transition: 'all .2s',
                }}>{m}</button>
              ))}
            </div>

            {/* Toggle manual */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setManualMode(!manualMode)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, color: FG3, padding: 0,
              }}>
                {manualMode ? '← Search foods' : '✏️ Manual entry'}
              </button>
            </div>

            {manualMode ? (
              <div style={cardStyle}>
                <div style={{ fontSize: 13, fontWeight: 700, color: FG1, marginBottom: 12 }}>Manual Entry</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input style={inputStyle} placeholder="Food name"
                    value={manual.name} onChange={e => setManual(v => ({ ...v, name: e.target.value }))}/>
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
                    background: foodLogged ? 'rgba(30,127,92,0.10)' : GREEN,
                    color: foodLogged ? GREEN : '#fff',
                    border: 'none', borderRadius: 14, padding: '13px 0',
                    fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all .2s',
                    opacity: (!manual.name || !manual.cal) ? 0.4 : 1,
                    boxShadow: foodLogged ? 'none' : '0 4px 14px rgba(30,127,92,0.25)',
                  }}>
                    {foodLogged ? '✓ Logged!' : 'Log Food'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={cardStyle}>
                  <input style={inputStyle} placeholder="Search food…"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setSelectedFood(null); }}
                  />
                  {query && !selectedFood && (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 240, overflowY: 'auto' }}>
                      {filtered.length === 0 ? (
                        <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 13, color: FG3 }}>No results</div>
                      ) : filtered.map(f => (
                        <button key={f.id}
                          onClick={() => { setSelectedFood(f); setQuery(f.name); setPortion(100); setCustomPortion(''); }}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 8px', borderRadius: 10, textAlign: 'left',
                          }}
                          onMouseOver={e => (e.currentTarget.style.background = 'rgba(15,27,45,0.04)')}
                          onMouseOut={e  => (e.currentTarget.style.background = 'none')}
                        >
                          <span style={{ fontSize: 20 }}>{f.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: FG1 }}>{f.name}</div>
                            <div style={{ fontSize: 11, color: FG3, marginTop: 1 }}>{f.cal} kcal · P{f.p}g · C{f.c}g · F{f.f}g</div>
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
                      <div style={{ fontSize: 13, fontWeight: 700, color: FG2, marginBottom: 10 }}>Portion (g)</div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        {PORTION_PRESETS.map(p => (
                          <button key={p} onClick={() => { setPortion(p); setCustomPortion(''); }} style={{
                            flex: 1, padding: '9px 0', borderRadius: 12,
                            fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            background: portion === p && !customPortion ? 'rgba(30,127,92,0.10)' : BG,
                            color:      portion === p && !customPortion ? GREEN : FG3,
                            border: `1px solid ${portion === p && !customPortion ? 'rgba(30,127,92,0.25)' : BORDER}`,
                            transition: 'all .2s',
                          }}>{p}</button>
                        ))}
                      </div>
                      <input style={inputStyle} type="number" placeholder="Custom grams…"
                        value={customPortion} onChange={e => setCustomPortion(e.target.value)}/>
                    </div>

                    {/* Macro preview */}
                    <div style={{ ...cardStyle, background: 'rgba(30,127,92,0.04)', border: '1px solid rgba(30,127,92,0.15)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 24 }}>{selectedFood.emoji}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: FG1 }}>{selectedFood.name}</span>
                        </div>
                        <span style={{ fontSize: 11, color: FG3 }}>{effectivePortion}g</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[
                          { label: 'CAL',  val: previewCal,  color: '#D04E36', bg: 'rgba(208,78,54,0.08)'   },
                          { label: 'PRO',  val: previewProt, color: '#2E6FB8', bg: 'rgba(46,111,184,0.08)'  },
                          { label: 'CARB', val: previewCarb, color: '#C98A2E', bg: 'rgba(201,138,46,0.08)'  },
                          { label: 'FAT',  val: previewFat,  color: GREEN,     bg: 'rgba(30,127,92,0.08)'   },
                        ].map(m => (
                          <div key={m.label} style={{ flex: 1, borderRadius: 12, padding: '8px 4px', textAlign: 'center', background: m.bg }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: m.color }}>{m.val}</div>
                            <div style={{ fontSize: 9, fontWeight: 700, color: FG3, marginTop: 2 }}>{m.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button onClick={logFood} style={{
                      background: foodLogged ? 'rgba(30,127,92,0.10)' : GREEN,
                      color: foodLogged ? GREEN : '#fff',
                      border: 'none', borderRadius: 16, padding: '15px 0',
                      fontSize: 15, fontWeight: 800, cursor: 'pointer', width: '100%',
                      transition: 'all .2s', boxShadow: foodLogged ? 'none' : '0 4px 16px rgba(30,127,92,0.28)',
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
                background: CARD, border: `2px dashed ${BORDER}`,
                borderRadius: 24, minHeight: 200, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 12, color: FG3, transition: 'all .2s',
              }}
              onMouseOver={e => (e.currentTarget.style.borderColor = GREEN)}
              onMouseOut={e  => (e.currentTarget.style.borderColor = BORDER)}
              >
                <span style={{ fontSize: 44 }}>📷</span>
                <div style={{ fontSize: 15, fontWeight: 700, color: FG2 }}>Take a photo or upload</div>
                <div style={{ fontSize: 12, color: FG3 }}>AI will identify the food &amp; macros</div>
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
                <div style={{ width: 32, height: 32, borderRadius: '50%', border: `3px solid ${BORDER}`, borderTopColor: GREEN, animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                <div style={{ fontSize: 13, color: FG3 }}>Analysing with AI…</div>
              </div>
            )}

            {scanError && (
              <div style={{ background: 'rgba(208,78,54,0.06)', border: '1px solid rgba(208,78,54,0.18)', borderRadius: 14, padding: '12px 14px' }}>
                <div style={{ fontSize: 13, color: '#D04E36' }}>⚠️ {scanError}</div>
              </div>
            )}

            {scanResult && (
              <>
                <div style={{ ...cardStyle, background: 'rgba(30,127,92,0.04)', border: '1px solid rgba(30,127,92,0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 28 }}>{scanResult.emoji || '🍽️'}</span>
                    <div style={{ fontSize: 15, fontWeight: 800, color: FG1 }}>{scanResult.name}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { label: 'CAL',  val: scanResult.calories, color: '#D04E36', bg: 'rgba(208,78,54,0.08)'  },
                      { label: 'PRO',  val: scanResult.protein,  color: '#2E6FB8', bg: 'rgba(46,111,184,0.08)' },
                      { label: 'CARB', val: scanResult.carbs,    color: '#C98A2E', bg: 'rgba(201,138,46,0.08)' },
                      { label: 'FAT',  val: scanResult.fat,      color: GREEN,     bg: 'rgba(30,127,92,0.08)'  },
                    ].map(m => (
                      <div key={m.label} style={{ flex: 1, borderRadius: 12, padding: '8px 4px', textAlign: 'center', background: m.bg }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: m.color }}>{m.val}</div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: FG3, marginTop: 2 }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={logScanResult} style={{
                  background: scanLogged ? 'rgba(30,127,92,0.10)' : GREEN,
                  color: scanLogged ? GREEN : '#fff',
                  border: 'none', borderRadius: 16, padding: '15px 0',
                  fontSize: 15, fontWeight: 800, cursor: 'pointer', width: '100%',
                  transition: 'all .2s', boxShadow: scanLogged ? 'none' : '0 4px 16px rgba(30,127,92,0.28)',
                }}>
                  {scanLogged ? '✓ Logged!' : 'Log This Food'}
                </button>
              </>
            )}

            <div style={{
              background: 'rgba(46,111,184,0.06)', borderRadius: 14, padding: '12px 14px',
              display: 'flex', gap: 8, border: '1px solid rgba(46,111,184,0.14)',
            }}>
              <span style={{ fontSize: 14 }}>💡</span>
              <span style={{ fontSize: 12, color: '#2E6FB8', lineHeight: 1.6 }}>
                AI scan uses <strong>Claude Haiku</strong> vision. Add <code style={{ background: BORDER, borderRadius: 4, padding: '1px 4px', color: FG1 }}>ANTHROPIC_API_KEY</code> to enable.
              </span>
            </div>
          </div>
        )}

        {/* ══════════════════════ ACTIVITY TAB ══════════════════════ */}
        {tab === 'activity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ACTIVITY_LIST.map(a => {
              const isSel     = selectedAct?.id === a.id;
              const kcalMin   = Math.round(a.met * (weight) / 60);
              const intensity = a.met >= 9   ? { label: 'High',   dot: '#D04E36', badge: 'rgba(208,78,54,0.10)',   text: '#D04E36' }
                              : a.met >= 5.5 ? { label: 'Medium', dot: '#C98A2E', badge: 'rgba(201,138,46,0.10)', text: '#C98A2E' }
                              :                { label: 'Low',    dot: GREEN,     badge: 'rgba(30,127,92,0.10)',  text: GREEN     };
              return (
                <div key={a.id}>
                  {/* Row button */}
                  <button
                    onClick={() => {
                      setSelectedAct(isSel ? null : a);
                      setCustomCalories(''); setCustomDuration(''); setDistance(''); setActivityType('');
                    }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '13px 14px', cursor: 'pointer', textAlign: 'left',
                      background: isSel ? 'rgba(30,127,92,0.05)' : CARD,
                      border: `1px solid ${isSel ? 'rgba(30,127,92,0.28)' : BORDER}`,
                      borderRadius: isSel ? '16px 16px 0 0' : 16,
                      transition: 'all .15s',
                    }}
                  >
                    {/* Intensity dot */}
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                      background: intensity.dot,
                    }}/>
                    {/* Name */}
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: isSel ? FG1 : FG2 }}>
                      {a.name}
                    </span>
                    {/* Intensity badge */}
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                      background: intensity.badge, color: intensity.text, flexShrink: 0,
                    }}>
                      {intensity.label}
                    </span>
                    {/* kcal/min */}
                    <span style={{ fontSize: 11, color: FG3, flexShrink: 0, minWidth: 70, textAlign: 'right' }}>
                      ~{kcalMin} kcal/min
                    </span>
                    {/* Chevron */}
                    <span style={{ fontSize: 11, color: isSel ? GREEN : FG3, flexShrink: 0 }}>
                      {isSel ? '▲' : '▼'}
                    </span>
                  </button>

                  {/* Expanded panel */}
                  {isSel && (
                    <div style={{
                      background: CARD,
                      border: `1px solid rgba(30,127,92,0.25)`, borderTop: 'none',
                      borderRadius: '0 0 16px 16px', padding: '16px 14px',
                      display: 'flex', flexDirection: 'column', gap: 12,
                    }}>

                      {/* Distance — run / walk / cycle / swim / hike */}
                      {a.hasDistance && (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: FG2, marginBottom: 7 }}>
                            Distance (km) <span style={{ fontWeight: 400, color: FG3 }}>— optional</span>
                          </div>
                          <input
                            style={inputStyle} type="number" min="0" step="0.1"
                            placeholder="e.g. 5.2"
                            value={distance}
                            onChange={e => setDistance(e.target.value)}
                          />
                        </div>
                      )}

                      {/* Activity type — "Other" free text */}
                      {a.hasType && (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: FG2, marginBottom: 7 }}>
                            Activity type
                          </div>
                          <input
                            style={inputStyle}
                            placeholder="e.g. Frisbee, Archery, Skateboarding…"
                            value={activityType}
                            onChange={e => setActivityType(e.target.value)}
                          />
                        </div>
                      )}

                      {/* Duration */}
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: FG2, marginBottom: 7 }}>Duration (min)</div>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                          {DURATION_PRESETS.map(d => (
                            <button key={d} onClick={() => { setDuration(d); setCustomDuration(''); }} style={{
                              flex: 1, padding: '9px 0', borderRadius: 10, border: 'none',
                              fontSize: 12, fontWeight: 700, cursor: 'pointer',
                              background: duration === d && !customDuration ? 'rgba(30,127,92,0.12)' : BG,
                              color:      duration === d && !customDuration ? GREEN : FG3,
                              transition: 'all .15s',
                            }}>{d}</button>
                          ))}
                        </div>
                        <input
                          style={inputStyle} type="number" min="1" max="600"
                          placeholder="Custom minutes…"
                          value={customDuration}
                          onChange={e => setCustomDuration(e.target.value)}
                        />
                      </div>

                      {/* Preview card */}
                      <div style={{
                        background: BG, borderRadius: 14, padding: '12px 14px',
                        display: 'flex', alignItems: 'center',
                        border: `1px solid ${BORDER}`,
                      }}>
                        <span style={{ fontSize: 30, marginRight: 12 }}>{a.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: FG1 }}>
                            {effectiveAct?.name}
                          </div>
                          <div style={{ fontSize: 11, color: FG3, marginTop: 2 }}>
                            {effectiveDuration} min · {weight} kg
                            {distance ? ` · ${distance} km` : ''}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 28, fontWeight: 900, color: GREEN, lineHeight: 1, fontFamily: "'Anton', Impact, sans-serif" }}>
                            {autoBurnEstimate}
                          </div>
                          <div style={{ fontSize: 10, color: FG3 }}>kcal</div>
                        </div>
                      </div>

                      {/* Override calories */}
                      <input
                        style={inputStyle} type="number" min="0"
                        placeholder={`Override calories (est. ${autoBurnEstimate} kcal)`}
                        value={customCalories}
                        onChange={e => setCustomCalories(e.target.value)}
                      />
                      {customCalories && (
                        <button onClick={() => setCustomCalories('')} style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 11, color: FG3, padding: 0, marginTop: -6,
                        }}>
                          ↩ Reset to auto-estimate ({autoBurnEstimate} kcal)
                        </button>
                      )}

                      {/* Log button */}
                      <button onClick={logActivity} style={{
                        width: '100%', padding: '14px 0',
                        background: actLogged ? 'rgba(30,127,92,0.12)' : GREEN,
                        color: actLogged ? GREEN : '#fff',
                        border: actLogged ? `1px solid rgba(30,127,92,0.3)` : 'none',
                        borderRadius: 14,
                        fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all .2s',
                        boxShadow: actLogged ? 'none' : '0 4px 14px rgba(30,127,92,0.28)',
                      }}>
                        {actLogged ? '✓ Activity Logged!' : `Log ${effectiveAct?.name}`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

// ── Page wrapper with Suspense ─────────────────────────────────────────────────
export default function LogPage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#F7F8FB', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E5E9F2', borderTopColor: '#1E7F5C', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <LogInner />
    </Suspense>
  );
}
