'use client';
import { Suspense, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStrideStore } from '@/lib/store';
import { api } from '@/lib/apiClient';
import { SG_RESTAURANTS } from '@/lib/sgFoodDb';

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

// Unified food item type (covers both FOOD_DB and SG_RESTAURANTS meals)
type FoodItem = { id: string; name: string; emoji: string; cal: number; p: number; c: number; f: number; _restaurant?: string; _price?: number; _perServing?: boolean };

// ── Activity list ─────────────────────────────────────────────────────────────
const ACTIVITY_LIST = [
  // Distance-based
  { id: 'run',        name: 'Running',        emoji: '🏃', met: 9.8,  hasDistance: true,  hasTreadmill: true,  hasType: false },
  { id: 'walk',       name: 'Walking',        emoji: '🚶', met: 3.5,  hasDistance: true,  hasTreadmill: true,  hasType: false },
  { id: 'cycle',      name: 'Cycling',        emoji: '🚴', met: 7.5,  hasDistance: true,  hasTreadmill: false, hasType: false },
  { id: 'swim',       name: 'Swimming',       emoji: '🏊', met: 8.0,  hasDistance: true,  hasTreadmill: false, hasType: false },
  { id: 'hike',       name: 'Hiking',         emoji: '🥾', met: 6.0,  hasDistance: true,  hasTreadmill: false, hasType: false },
  // Gym / Studio
  { id: 'gym',        name: 'Weight Training',emoji: '🏋️', met: 5.0,  hasDistance: false, hasTreadmill: false, hasType: false },
  { id: 'hiit',       name: 'HIIT',           emoji: '⚡', met: 10.0, hasDistance: false, hasTreadmill: false, hasType: false },
  { id: 'yoga',       name: 'Yoga',           emoji: '🧘', met: 2.5,  hasDistance: false, hasTreadmill: false, hasType: false },
  { id: 'pilates',    name: 'Pilates',        emoji: '🤸', met: 3.0,  hasDistance: false, hasTreadmill: false, hasType: false },
  { id: 'boxing',     name: 'Boxing',         emoji: '🥊', met: 9.0,  hasDistance: false, hasTreadmill: false, hasType: false },
  { id: 'jumprope',   name: 'Jump Rope',      emoji: '🪢', met: 11.0, hasDistance: false, hasTreadmill: false, hasType: false },
  { id: 'elliptical', name: 'Elliptical',     emoji: '🔄', met: 5.0,  hasDistance: false, hasTreadmill: false, hasType: false },
  { id: 'rowing',     name: 'Rowing',         emoji: '🚣', met: 7.0,  hasDistance: false, hasTreadmill: false, hasType: false },
  { id: 'stair',      name: 'Stair Climbing', emoji: '🪜', met: 8.0,  hasDistance: false, hasTreadmill: false, hasType: false },
  { id: 'stretch',    name: 'Stretching',     emoji: '🙆', met: 2.3,  hasDistance: false, hasTreadmill: false, hasType: false },
  // Racket sports
  { id: 'tennis',     name: 'Tennis',         emoji: '🎾', met: 8.0,  hasDistance: false, hasTreadmill: false, hasType: false },
  { id: 'badminton',  name: 'Badminton',      emoji: '🏸', met: 5.5,  hasDistance: false, hasTreadmill: false, hasType: false },
  { id: 'squash',     name: 'Squash',         emoji: '🎾', met: 12.0, hasDistance: false, hasTreadmill: false, hasType: false },
  // Team sports (user specifies which)
  { id: 'soccer',     name: 'Soccer',         emoji: '⚽', met: 7.0,  hasDistance: false, hasTreadmill: false, hasType: false },
  { id: 'basketball', name: 'Basketball',     emoji: '🏀', met: 6.5,  hasDistance: false, hasTreadmill: false, hasType: false },
  { id: 'football',   name: 'Football',       emoji: '🏈', met: 8.0,  hasDistance: false, hasTreadmill: false, hasType: false },
  { id: 'rugby',      name: 'Rugby',          emoji: '🏉', met: 8.3,  hasDistance: false, hasTreadmill: false, hasType: false },
  { id: 'volleyball', name: 'Volleyball',     emoji: '🏐', met: 4.0,  hasDistance: false, hasTreadmill: false, hasType: false },
  { id: 'hockey',     name: 'Hockey',         emoji: '🏒', met: 8.0,  hasDistance: false, hasTreadmill: false, hasType: false },
  { id: 'cricket',    name: 'Cricket',        emoji: '🏏', met: 5.0,  hasDistance: false, hasTreadmill: false, hasType: false },
  { id: 'baseball',   name: 'Baseball',       emoji: '⚾', met: 5.0,  hasDistance: false, hasTreadmill: false, hasType: false },
  { id: 'netball',    name: 'Netball',        emoji: '🏐', met: 5.5,  hasDistance: false, hasTreadmill: false, hasType: false },
  { id: 'handball',   name: 'Handball',       emoji: '🤾', met: 8.0,  hasDistance: false, hasTreadmill: false, hasType: false },
  // Other
  { id: 'dance',      name: 'Dancing',        emoji: '💃', met: 5.5,  hasDistance: false, hasTreadmill: false, hasType: false },
  { id: 'golf',       name: 'Golf',           emoji: '⛳', met: 4.5,  hasDistance: false, hasTreadmill: false, hasType: false },
  { id: 'surf',       name: 'Surfing',        emoji: '🏄', met: 6.0,  hasDistance: false, hasTreadmill: false, hasType: false },
  { id: 'climb',      name: 'Rock Climbing',  emoji: '🧗', met: 8.0,  hasDistance: false, hasTreadmill: false, hasType: false },
  { id: 'waterpolo',  name: 'Water Polo',     emoji: '🤽', met: 10.0, hasDistance: false, hasTreadmill: false, hasType: false },
  { id: 'other',      name: 'Other',          emoji: '🔥', met: 5.0,  hasDistance: false, hasTreadmill: false, hasType: true  },
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
  const [tab, setTab] = useState<'food' | 'activity'>(initialTab);

  // ── Food tab state ──────────────────────────────────────────────────────────
  const [query,         setQuery]         = useState('');
  const [selectedFood,  setSelectedFood]  = useState<FoodItem | null>(null);
  const [portion,       setPortion]       = useState(100);
  const [customPortion, setCustomPortion] = useState('');
  const [mealType,      setMealType]      = useState<typeof MEAL_TYPES[number]>('lunch');
  const [manualMode,    setManualMode]    = useState(false);
  const [manual,        setManual]        = useState({ name: '', cal: '', p: '', c: '', f: '' });
  const [foodLogged,    setFoodLogged]    = useState(false);

  // ── Activity tab state ──────────────────────────────────────────────────────
  const [actSearch,     setActSearch]     = useState('');
  const [selectedAct,   setSelectedAct]   = useState<typeof ACTIVITY_LIST[0] | null>(null);
  const [duration,      setDuration]      = useState(30);
  const [customDuration,setCustomDuration]= useState('');
  const [distance,      setDistance]      = useState('');   // km, for run/walk/cycle/swim/hike
  const [speed,         setSpeed]         = useState('');   // km/h, treadmill
  const [incline,       setIncline]       = useState('');   // %, treadmill
  const [activityType,  setActivityType]  = useState('');   // free-text, for "Other"
  const [customCalories,setCustomCalories]= useState('');
  const [actLogged,     setActLogged]     = useState(false);
  const [actManualMode, setActManualMode] = useState(false);
  const [actManual,     setActManual]     = useState({ name: '', cal: '', duration: '' });

  // Time/date picker for activity — default to now
  const [activityDate,  setActivityDate]  = useState(() => new Date().toISOString().slice(0, 10));
  const [activityTime,  setActivityTime]  = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  });

  // ── 7-day history ──────────────────────────────────────────────────────────
  const [history,     setHistory]     = useState<{ date: string; calories: number; burned: number; target: number | null }[]>([]);
  const [histLoading, setHistLoading] = useState(true);

  useEffect(() => {
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return d.toISOString().slice(0, 10);
    });
    Promise.all(dates.map(d => api.summary.getByDate(d).catch(() => null)))
      .then(results => {
        setHistory(dates.map((date, i) => {
          const r = results[i] as { totalCalories?: number; caloriesBurned?: number; targetCalories?: number } | null;
          return {
            date,
            calories: r?.totalCalories ?? 0,
            burned:   r?.caloriesBurned ?? 0,
            target:   r?.targetCalories ?? null,
          };
        }));
      })
      .finally(() => setHistLoading(false));
  }, []);

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

  // Combined food search: SG restaurant meals first, then generic FOOD_DB
  const sgMeals = useMemo<FoodItem[]>(() =>
    SG_RESTAURANTS.flatMap(r => r.menu.map(item => ({
      id:           item.id,
      name:         item.name,
      emoji:        item.emoji ?? '🍽️',
      cal:          item.calories,
      p:            item.protein,
      c:            item.carbs ?? 0,
      f:            item.fat ?? 0,
      _restaurant:  r.name,
      _price:       item.price ?? undefined,
      _perServing:  true,
    })))
  , []);

  const filtered = useMemo<FoodItem[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const sgHits = sgMeals.filter(f =>
      f.name.toLowerCase().includes(q) || (f._restaurant?.toLowerCase().includes(q) ?? false)
    ).slice(0, 15);
    const genericHits = FOOD_DB.filter(f =>
      f.name.toLowerCase().includes(q)
    ).slice(0, 10);
    return [...sgHits, ...genericHits];
  }, [query, sgMeals]);

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

  const logActivity = () => {
    if (!effectiveAct) return;
    const distNote    = distance ? ` · ${distance} km` : '';
    const speedNote   = speed   ? ` · ${speed} km/h`   : '';
    const inclineNote = incline ? ` · ${incline}% incline` : '';
    const loggedAt    = activityDate && activityTime
      ? new Date(`${activityDate}T${activityTime}:00`).toISOString()
      : new Date().toISOString();
    store.addActivityEntry({
      name:           effectiveAct.name + distNote + speedNote + inclineNote,
      emoji:          effectiveAct.emoji,
      durationMins:   effectiveDuration,
      caloriesBurned: burnEstimate,
      intensity:      burnEstimate > 300 ? 'high' : burnEstimate > 150 ? 'medium' : 'low',
      source:         'manual',
      loggedAt,
    });
    setActLogged(true);
    setTimeout(() => {
      setActLogged(false); setSelectedAct(null);
      setCustomCalories(''); setCustomDuration(''); setDistance('');
      setSpeed(''); setIncline(''); setActivityType('');
    }, 1600);
  };

  const logManualActivity = () => {
    if (!actManual.name || !actManual.cal) return;
    const loggedAt = activityDate && activityTime
      ? new Date(`${activityDate}T${activityTime}:00`).toISOString()
      : new Date().toISOString();
    const dur = Number(actManual.duration) || 30;
    const cal = Number(actManual.cal);
    store.addActivityEntry({
      name:           actManual.name,
      emoji:          '🔥',
      durationMins:   dur,
      caloriesBurned: cal,
      intensity:      cal > 300 ? 'high' : cal > 150 ? 'medium' : 'low',
      source:         'manual',
      loggedAt,
    });
    setActLogged(true);
    setTimeout(() => { setActLogged(false); setActManual({ name: '', cal: '', duration: '' }); setActManualMode(false); }, 1600);
  };

  // ── Design tokens — now using Stride CSS variables ──
  const BG     = 'var(--bg)';
  const CARD   = 'var(--surface)';
  const BORDER = 'var(--line)';
  const FG1    = 'var(--ink)';
  const FG2    = 'var(--ink-2)';
  const FG3    = 'var(--muted)';
  const GREEN  = 'var(--green)';
  const SHADOW = 'var(--shadow-md)';

  // ── Styles ───────────────────────────────────────────────────────────────────
  const cardStyle = {
    background: 'var(--surface)', borderRadius: 22, padding: 18,
    border: '1px solid var(--line)', boxShadow: 'var(--shadow-md)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--surface-3)',
    border: '1.5px solid var(--line)',
    borderRadius: 14, padding: '13px 16px',
    fontSize: 15, color: 'var(--ink)', outline: 'none',
    fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
    transition: 'border-color .15s, box-shadow .15s',
    boxSizing: 'border-box',
  };

  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '11px 0', borderRadius: 11, border: 'none',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    background: active ? 'var(--green)' : 'transparent',
    color: active ? '#fff' : 'var(--ink-2)',
    transition: 'all .15s',
    fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
  });

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div style={{ padding: '52px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 className="title" style={{ margin: 0 }}>Log</h1>
        <Link href="/log/history" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--green)', fontWeight: 600, fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap' }}>
          Full log
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>
      </div>

      {/* ── 7-Day History ── */}
      <div style={{ padding: '0 20px', marginBottom: 18 }}>
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-card)', border: '1px solid var(--line)', boxShadow: 'var(--shadow-md)', padding: 20 }}>
          {histLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--green-tint)', borderTopColor: 'var(--green)', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Loading history…</span>
            </div>
          ) : (
            <>
              {/* Stats row */}
              <div style={{ display: 'flex', gap: 0, marginBottom: 18 }}>
                {[
                  { label: 'Avg / day', value: history.length ? Math.round(history.reduce((s, d) => s + d.calories, 0) / history.length).toLocaleString() : '0', unit: 'kcal', color: 'var(--ink)' },
                  { label: 'Burned',    value: history.reduce((s, d) => s + d.burned, 0).toLocaleString(), unit: 'kcal', color: 'var(--gold)' },
                  { label: 'Active',    value: String(history.filter(d => d.calories > 0 || d.burned > 0).length), unit: '/ 7 days', color: 'var(--green)' },
                ].map((s, i) => (
                  <div key={s.label} style={{ flex: 1, borderLeft: i > 0 ? '1px solid var(--line)' : 'none', paddingLeft: i > 0 ? 16 : 0 }}>
                    <div className="eyebrow" style={{ fontSize: 10, marginBottom: 4 }}>{s.label}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontFamily: '"Space Grotesk",system-ui,sans-serif', fontSize: 22, fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</span>
                      <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>{s.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Bar chart */}
              {(() => {
                const goalCal = profile.targetCalories || 2000;
                const maxCal = Math.max(...history.map(h => h.calories), goalCal, 1);
                const H = 96;
                const goalY = H - (goalCal / maxCal) * H;
                return (
                  <div style={{ position: 'relative', height: H + 24, marginTop: 6 }}>
                    {/* Goal dashed line */}
                    <div style={{ position: 'absolute', left: 0, right: 0, top: goalY, borderTop: '1.5px dashed var(--green-tint-2)', zIndex: 1 }}>
                      <span style={{ position: 'absolute', right: 0, top: -16, fontSize: 10, fontWeight: 600, color: 'var(--green)', fontFamily: '"Space Grotesk",system-ui,sans-serif' }}>
                        goal {goalCal.toLocaleString()}
                      </span>
                    </div>
                    {/* Bars */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0, justifyContent: 'space-between', height: H }}>
                      {history.map((d, i) => {
                        const isToday = i === history.length - 1;
                        const over    = d.calories > goalCal;
                        const h       = d.calories > 0 ? Math.max(6, (d.calories / maxCal) * H) : 4;
                        const days    = ['Su','Mo','Tu','We','Th','Fr','Sa'];
                        const dow     = new Date(d.date + 'T00:00:00').getDay();
                        return (
                          <div key={d.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, flex: 1 }}>
                            <div style={{
                              width: 22, height: h, borderRadius: 7, position: 'relative',
                              background: isToday ? 'var(--green)' : over ? 'var(--coral-tint)' : 'var(--green-tint-2)',
                              boxShadow: isToday ? 'var(--shadow-green)' : 'none',
                              transition: 'height .6s ease',
                              outline: over && !isToday ? '1.5px solid var(--coral)' : 'none',
                            }} />
                            <span style={{ fontSize: 11, fontWeight: isToday ? 700 : 500, color: isToday ? 'var(--green)' : 'var(--faint)' }}>
                              {isToday ? 'Now' : days[dow]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div style={{ padding: '0 20px', marginBottom: 14 }}>
        <div style={{
          background: 'var(--surface-2)', borderRadius: 15, padding: 4,
          display: 'flex', gap: 3,
        }}>
          <button style={tabBtnStyle(tab === 'food')}     onClick={() => setTab('food')}>🍽 Food</button>
          <button style={tabBtnStyle(tab === 'activity')} onClick={() => setTab('activity')}>⚡ Activity</button>
        </div>
      </div>

      <div style={{ padding: '0 20px 100px' }}>

        {/* ══════════════════════ FOOD TAB ══════════════════════ */}
        {tab === 'food' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Meal type selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              {MEAL_TYPES.map(m => (
                <button key={m} onClick={() => setMealType(m)} style={{
                  height: 34, padding: '0 13px', borderRadius: 999,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                  background: mealType === m ? 'var(--green-tint)' : 'transparent',
                  color:      mealType === m ? 'var(--green-deep)' : 'var(--muted)',
                  border: mealType === m ? '1px solid var(--green-tint-2)' : '1px solid transparent',
                  transition: 'all .15s', fontFamily: '"Hanken Grotesk",system-ui,sans-serif',
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
                {/* Combined search + portion card */}
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
                            <div style={{ fontSize: 11, color: FG3, marginTop: 1 }}>
                              {f._restaurant && <><span style={{ color: GREEN, fontWeight: 600 }}>{f._restaurant}</span>{' · '}</>}
                              {f._price != null && <><span style={{ fontWeight: 600, color: FG2 }}>${f._price.toFixed(2)}</span>{' · '}</>}
                              {f.cal} cal · P{f.p}g · C{f.c}g · F{f.f}g
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Portion picker — grams for generic, servings for restaurant items */}
                  {selectedFood && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
                      {selectedFood._perServing ? (
                        <>
                          <div style={{ fontSize: 11, fontWeight: 700, color: FG3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Servings</div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {[100, 200, 300].map((v, i) => (
                              <button key={v} onClick={() => { setPortion(v); setCustomPortion(''); }} style={{
                                flex: 1, padding: '5px 0', borderRadius: 20,
                                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                background: portion === v && !customPortion ? 'rgba(30,127,92,0.10)' : BG,
                                color:      portion === v && !customPortion ? GREEN : FG3,
                                border: `1px solid ${portion === v && !customPortion ? 'rgba(30,127,92,0.25)' : BORDER}`,
                                transition: 'all .15s',
                              }}>{i + 1}×</button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: 11, fontWeight: 700, color: FG3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Portion (g)</div>
                          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                            {PORTION_PRESETS.map(p => (
                              <button key={p} onClick={() => { setPortion(p); setCustomPortion(''); }} style={{
                                flex: 1, padding: '5px 0', borderRadius: 20,
                                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                background: portion === p && !customPortion ? 'rgba(30,127,92,0.10)' : BG,
                                color:      portion === p && !customPortion ? GREEN : FG3,
                                border: `1px solid ${portion === p && !customPortion ? 'rgba(30,127,92,0.25)' : BORDER}`,
                                transition: 'all .15s',
                              }}>{p}</button>
                            ))}
                          </div>
                          <input style={{ ...inputStyle, padding: '8px 12px', fontSize: 13 }} type="number" placeholder="Custom grams…"
                            value={customPortion} onChange={e => setCustomPortion(e.target.value)}/>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {selectedFood && (
                  <>
                    {/* Macro preview — simplified single row */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: 'rgba(30,127,92,0.05)', border: '1px solid rgba(30,127,92,0.14)',
                      borderRadius: 14, padding: '10px 14px',
                    }}>
                      <span style={{ fontSize: 18 }}>{selectedFood.emoji}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: FG1, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedFood.name}
                      </span>
                      <span style={{ fontSize: 12, color: '#D04E36', fontWeight: 700 }}>{previewCal} cal</span>
                      <span style={{ fontSize: 11, color: FG3 }}>·</span>
                      <span style={{ fontSize: 12, color: '#2E6FB8', fontWeight: 600 }}>P{previewProt}</span>
                      <span style={{ fontSize: 11, color: FG3 }}>·</span>
                      <span style={{ fontSize: 12, color: '#C98A2E', fontWeight: 600 }}>C{previewCarb}</span>
                      <span style={{ fontSize: 11, color: FG3 }}>·</span>
                      <span style={{ fontSize: 12, color: GREEN, fontWeight: 600 }}>F{previewFat}</span>
                    </div>

                    <button onClick={logFood} style={{
                      background: foodLogged ? 'rgba(30,127,92,0.10)' : GREEN,
                      color: foodLogged ? GREEN : '#fff',
                      border: 'none', borderRadius: 16, padding: '15px 0',
                      fontSize: 15, fontWeight: 800, cursor: 'pointer', width: '100%',
                      transition: 'all .2s', boxShadow: foodLogged ? 'none' : '0 4px 16px rgba(30,127,92,0.28)',
                    }}>
                      {foodLogged ? '✓ Logged!' : selectedFood._perServing
                        ? `Log ${effectivePortion / 100 === 1 ? '1 serving' : `${effectivePortion / 100}× serving`} of ${selectedFood.name}`
                        : `Log ${effectivePortion}g of ${selectedFood.name}`}
                    </button>
                  </>
                )}
              </>
            )}

            {/* Find best-value meals CTA */}
            <Link href="/eat?sort=ppd" style={{
              display: 'block', textDecoration: 'none',
              background: 'var(--green-tint)', borderRadius: 'var(--r-card)', padding: 18,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
                    </svg>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--green-deep)' }}>Find best-value meals</span>
                    <span style={{ fontSize: 12.5, color: 'var(--green)', fontWeight: 500 }}>Grab &amp; Go options with full macros</span>
                  </div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </Link>
          </div>
        )}

        {/* ══════════════════════ ACTIVITY TAB ══════════════════════ */}
        {tab === 'activity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

            {/* Manual entry toggle */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setActManualMode(m => !m)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700,
                color: actManualMode ? GREEN : FG3,
                display: 'flex', alignItems: 'center', gap: 5, padding: '2px 0',
              }}>
                <span style={{ fontSize: 15 }}>✏️</span>
                {actManualMode ? '← Back to activities' : 'Manual entry'}
              </button>
            </div>

            {/* Manual activity entry form */}
            {actManualMode && (
              <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input style={inputStyle} placeholder="Activity name (e.g. Muay Thai, Basketball…)"
                  value={actManual.name} onChange={e => setActManual(v => ({ ...v, name: e.target.value }))}/>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: FG3, marginBottom: 6 }}>DURATION (min)</div>
                    <input style={inputStyle} type="number" min="1" placeholder="e.g. 45"
                      value={actManual.duration} onChange={e => setActManual(v => ({ ...v, duration: e.target.value }))}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: FG3, marginBottom: 6 }}>CALORIES BURNED</div>
                    <input style={inputStyle} type="number" min="0" placeholder="e.g. 300"
                      value={actManual.cal} onChange={e => setActManual(v => ({ ...v, cal: e.target.value }))}/>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: FG3, marginBottom: 6 }}>WHEN?</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="date" value={activityDate} onChange={e => setActivityDate(e.target.value)}
                      style={{ ...inputStyle, flex: 1, fontSize: 13 }}/>
                    <input type="time" value={activityTime} onChange={e => setActivityTime(e.target.value)}
                      style={{ ...inputStyle, width: 110, fontSize: 13 }}/>
                  </div>
                </div>
                <button onClick={logManualActivity} disabled={!actManual.name || !actManual.cal} style={{
                  background: actLogged ? 'rgba(30,127,92,0.10)' : GREEN,
                  color: actLogged ? GREEN : '#fff',
                  border: 'none', borderRadius: 14, padding: '13px 0',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  opacity: (!actManual.name || !actManual.cal) ? 0.4 : 1,
                  boxShadow: actLogged ? 'none' : 'var(--shadow-green)',
                }}>
                  {actLogged ? '✓ Activity Logged!' : 'Log Activity'}
                </button>
              </div>
            )}

            {/* Activity search — hidden in manual mode */}
            {!actManualMode && <input
              style={{ ...inputStyle, marginBottom: 4 }}
              placeholder="Search activities…"
              value={actSearch}
              onChange={e => setActSearch(e.target.value)}
            />}
            {!actManualMode && ACTIVITY_LIST.filter(a =>
              a.name.toLowerCase().includes(actSearch.toLowerCase())
            ).map(a => {
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
                      setCustomCalories(''); setCustomDuration(''); setDistance('');
                      setSpeed(''); setIncline(''); setActivityType('');
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

                      {/* Treadmill inputs — run / walk only */}
                      {a.hasTreadmill && (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: FG2, marginBottom: 7 }}>
                            Treadmill / Track <span style={{ fontWeight: 400, color: FG3 }}>— optional</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <input
                              style={inputStyle} type="number" min="0" step="0.1"
                              placeholder="e.g. 8.5"
                              value={speed}
                              onChange={e => setSpeed(e.target.value)}
                            />
                            <input
                              style={inputStyle} type="number" min="0" step="0.5"
                              placeholder="e.g. 5"
                              value={incline}
                              onChange={e => setIncline(e.target.value)}
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
                            <div style={{ fontSize: 10, color: FG3, textAlign: 'center' }}>Speed (km/h)</div>
                            <div style={{ fontSize: 10, color: FG3, textAlign: 'center' }}>Incline (%)</div>
                          </div>
                          {incline && Number(incline) > 0 && (
                            <div style={{ fontSize: 11, color: '#2E6FB8', marginTop: 6 }}>
                              Incline adds ~{Math.round(Number(incline) * 0.5)}% more burn
                            </div>
                          )}
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

                      {/* When did you do this? */}
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: FG2, marginBottom: 7 }}>When did you do this?</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            type="date" value={activityDate}
                            onChange={e => setActivityDate(e.target.value)}
                            style={{ ...inputStyle, flex: 1, fontSize: 13, padding: '9px 12px' }}
                          />
                          <input
                            type="time" value={activityTime}
                            onChange={e => setActivityTime(e.target.value)}
                            style={{ ...inputStyle, width: 110, fontSize: 13, padding: '9px 12px' }}
                          />
                        </div>
                      </div>

                      {/* Log button */}
                      <button onClick={logActivity} style={{
                        width: '100%', padding: '14px 0',
                        background: actLogged ? 'rgba(14,122,79,0.12)' : 'var(--green)',
                        color: actLogged ? 'var(--green)' : '#fff',
                        border: actLogged ? '1px solid var(--green-tint-2)' : 'none',
                        borderRadius: 14,
                        fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
                        boxShadow: actLogged ? 'none' : 'var(--shadow-green)',
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
      <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--green-tint-2)', borderTopColor: 'var(--green)', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <LogInner />
    </Suspense>
  );
}
