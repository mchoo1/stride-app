'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStrideStore } from '@/lib/store';
import { calculateBMR, calculateTargetCalories, calculateMacros } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { api } from '@/lib/apiClient';
import type { GoalType, DietaryFlag } from '@/types';

const GOAL_OPTS: { key: GoalType; emoji: string; label: string }[] = [
  { key: 'weight_loss', emoji: '📉', label: 'Lose Weight'  },
  { key: 'muscle_gain', emoji: '💪', label: 'Build Muscle' },
  { key: 'maintenance', emoji: '⚖️', label: 'Maintain'     },
];

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary:   'Sedentary (desk job)',
  light:       'Lightly active (1–3x/wk)',
  moderate:    'Moderately active (3–5x/wk)',
  active:      'Very active (6–7x/wk)',
  very_active: 'Athlete (2x/day)',
};

const DIET_OPTIONS: { key: DietaryFlag; label: string; emoji: string }[] = [
  { key: 'halal',        label: 'Halal',         emoji: '☪️'  },
  { key: 'vegetarian',   label: 'Vegetarian',    emoji: '🥦'  },
  { key: 'vegan',        label: 'Vegan',         emoji: '🌱'  },
  { key: 'pescatarian',  label: 'Pescatarian',   emoji: '🐟'  },
  { key: 'gluten_free',  label: 'Gluten-Free',   emoji: '🌾'  },
  { key: 'lactose_free', label: 'Lactose-Free',  emoji: '🥛'  },
  { key: 'dairy_free',   label: 'Dairy-Free',    emoji: '🧀'  },
  { key: 'nut_free',     label: 'Nut-Free',      emoji: '🥜'  },
  { key: 'keto',         label: 'Keto',          emoji: '🥑'  },
  { key: 'low_carb',     label: 'Low-Carb',      emoji: '🍞'  },
  { key: 'high_protein', label: 'High-Protein',  emoji: '💪'  },
  { key: 'no_pork',      label: 'No Pork',       emoji: '🐷'  },
  { key: 'kosher',       label: 'Kosher',        emoji: '✡️'  },
];

/** SVG sparkline for weight trend */
function WeightChart({ entries }: { entries: { date: string; weight: number }[] }) {
  if (entries.length < 2) return null;
  const W = 280, H = 80, PAD = 8;
  const weights  = entries.map(e => e.weight);
  const min      = Math.min(...weights) - 0.5;
  const max      = Math.max(...weights) + 0.5;
  const xStep    = (W - PAD * 2) / (entries.length - 1);
  const yScale   = (H - PAD * 2) / (max - min || 1);
  const points   = entries.map((e, i) => [PAD + i * xStep, H - PAD - (e.weight - min) * yScale]);
  const d        = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area     = d + ` L${points[points.length - 1][0]},${H} L${points[0][0]},${H} Z`;
  const color    = 'var(--green)';

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(30,127,92,0.15)"/>
          <stop offset="100%" stopColor="rgba(30,127,92,0.00)"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#chartFill)"/>
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]}
          r={i === points.length - 1 ? 4 : 2.5}
          fill={color} stroke="var(--surface)" strokeWidth="1.5"/>
      ))}
    </svg>
  );
}

export default function MePage() {
  const { user, loading } = useAuth();
  const router  = useRouter();
  const store   = useStrideStore();
  const profile = store.profile;
  const trend   = store.getWeightTrend(30);
  const streak  = store.streak;

  const bmr  = calculateBMR(profile);
  const tdee = calculateTargetCalories(profile);

  // All hooks must be declared before any early returns (React rules of hooks)
  const [tab,         setTab        ] = useState<'body' | 'goals' | 'settings'>('body');
  const [weightInput, setWeightInput] = useState('');
  const [bfInput,     setBfInput    ] = useState('');
  const [saved,       setSaved      ] = useState(false);
  const [form,        setForm       ] = useState({ ...profile });
  const [dietFlags,   setDietFlags  ] = useState<DietaryFlag[]>(profile.dietaryFlags ?? []);
  const [dietSaved,   setDietSaved  ] = useState(false);
  const [signingOut,  setSigningOut ] = useState(false);

  // Track whether we've done the initial server sync so we don't overwrite
  // in-progress user edits after the first sync completes.
  const hasSyncedRef = useRef(false);

  // Sync profile from Firestore on mount, then update form with fresh data.
  useEffect(() => {
    store.syncProfileFromServer()
      .then(() => {
        if (!hasSyncedRef.current) {
          hasSyncedRef.current = true;
          // Read the freshly-synced state directly from the store (avoids
          // stale closure — profile in this closure is the pre-sync snapshot)
          const fresh = useStrideStore.getState().profile;
          setForm({ ...fresh });
          setDietFlags(fresh.dietaryFlags ?? []);
        }
      })
      .catch(() => {/* offline — local state serves fine */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 28, height: 28, border: '2.5px solid var(--green)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F8FB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', gap: 0 }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        {/* Avatar placeholder */}
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(30,127,92,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginBottom: 8 }}>You're browsing as a guest</div>
        <div style={{ fontSize: 14, color: 'var(--ink-2)', textAlign: 'center', lineHeight: 1.6, marginBottom: 32, maxWidth: 300 }}>
          Create a free account to track your calories, save favourite meals, and get personalised macro targets.
        </div>
        {/* Feature list */}
        <div style={{ width: '100%', maxWidth: 320, background: '#fff', borderRadius: 20, border: '1px solid var(--line)', padding: '20px 20px', marginBottom: 28, boxShadow: '0 1px 2px rgba(15,27,45,0.04), 0 4px 12px rgba(15,27,45,0.06)' }}>
          {[
            { emoji: '🎯', text: 'Personalised calorie & macro targets' },
            { emoji: '📊', text: 'Daily nutrition tracking & streaks'   },
            { emoji: '💾', text: 'Save meals and restaurant favourites'  },
            { emoji: '📈', text: 'Weight trend & progress charts'        },
          ].map(f => (
            <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
              <span style={{ fontSize: 20 }}>{f.emoji}</span>
              <span style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 600 }}>{f.text}</span>
            </div>
          ))}
        </div>
        <Link href="/register" style={{
          display: 'block', width: '100%', maxWidth: 320, textAlign: 'center',
          background: 'var(--green)', color: '#fff', fontWeight: 800, fontSize: 15,
          borderRadius: 16, padding: '16px 0', textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(30,127,92,0.28)', marginBottom: 14,
        }}>
          Create Free Account →
        </Link>
        <Link href="/login" style={{
          display: 'block', width: '100%', maxWidth: 320, textAlign: 'center',
          background: '#F7F8FB', color: 'var(--ink-2)', fontWeight: 700, fontSize: 14,
          borderRadius: 16, padding: '14px 0', textDecoration: 'none',
          border: '1.5px solid var(--line)',
        }}>
          Already have an account? Sign in
        </Link>
      </div>
    );
  }

  const toggleDietFlag = (flag: DietaryFlag) => {
    setDietFlags(prev => prev.includes(flag) ? prev.filter(f => f !== flag) : [...prev, flag]);
  };

  const saveDietPreferences = () => {
    const updated = { ...form, dietaryFlags: dietFlags };
    store.updateProfile(updated);
    api.profile.update(updated).catch(() => {});
    setDietSaved(true);
    setTimeout(() => setDietSaved(false), 2000);
  };

  const latestWeight = trend.length ? trend[trend.length - 1].weight : profile.currentWeight;
  const latestBf     = trend.length ? trend[trend.length - 1].bodyFat : undefined;

  const logWeight = () => {
    const w = parseFloat(weightInput);
    if (isNaN(w) || w < 20 || w > 300) return;
    store.addWeightEntry(w, bfInput ? parseFloat(bfInput) : undefined);
    setWeightInput(''); setBfInput('');
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const saveProfile = () => {
    const calories = calculateTargetCalories(form);
    const macros   = calculateMacros(calories, form.goalType);
    const updated  = { ...form, targetCalories: calories, targetProtein: macros.protein, targetCarbs: macros.carbs, targetFat: macros.fat };
    store.updateProfile(updated);
    // Background sync to Firestore
    api.profile.update(updated).catch(() => {});
    api.summary.recompute().catch(() => {});
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const update = (key: string, val: unknown) => setForm(f => ({ ...f, [key]: val }));

  // ── Design tokens — now using Stride CSS variables ──────────────────
  const cardStyle: React.CSSProperties = {
    background: 'var(--surface)',
    borderRadius: 22,
    padding: 20,
    border: '1px solid var(--line)',
    boxShadow: 'var(--shadow-md)',
    marginBottom: 12,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--surface-3)',
    border: '1.5px solid var(--line)',
    borderRadius: 14,
    padding: '13px 16px',
    fontSize: 15,
    color: 'var(--ink)',
    outline: 'none',
    fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
    transition: 'border-color .15s, box-shadow .15s',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--muted)',
    marginBottom: 6,
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.10em',
  };

  // ── Today's date eyebrow ──────────────────────────────────────
  const todayStr = new Date().toLocaleDateString('en-SG', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', fontFamily: '"Hanken Grotesk", system-ui, sans-serif' }}>

      {/* ── Header ── */}
      <div style={{ padding: '52px 20px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="eyebrow">{todayStr}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Square ink avatar with initials */}
            <div style={{
              width: 48, height: 48, borderRadius: 16,
              background: 'var(--ink)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: '"Space Grotesk", system-ui, sans-serif',
              fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em', flexShrink: 0,
            }}>
              {(user?.displayName ?? profile.name ?? 'U').trim().split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontFamily: '"Space Grotesk",system-ui,sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                My Profile
              </span>
              <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 500 }}>
                {streak > 0 ? `${streak}-day streak` : 'No streak yet'} · Singapore
              </span>
            </div>
          </div>
        </div>
        <Link href="/log" style={{
          display: 'flex', alignItems: 'center', gap: 5,
          height: 40, padding: '0 15px', borderRadius: 13,
          background: 'var(--green)', color: '#fff',
          fontWeight: 600, fontSize: 14, textDecoration: 'none',
          boxShadow: 'var(--shadow-green)',
          fontFamily: '"Hanken Grotesk",system-ui,sans-serif',
        }}>+ Log</Link>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ padding: '0 20px', marginBottom: 18 }}>
        <div style={{
          background: 'var(--surface-2)',
          borderRadius: 15,
          padding: 4,
          display: 'flex',
          gap: 3,
        }}>
          {(['body', 'goals', 'settings'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 11,
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
              background: tab === t ? 'var(--green)' : 'transparent',
              color:      tab === t ? '#fff' : 'var(--ink-2)',
              transition: 'all .15s',
              fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 20px 100px' }}>

        {/* ══════════ BODY TAB ══════════ */}
        {tab === 'body' && (
          <>
            {/* Metric 2×2 grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              {[
                { label: 'Current weight', val: latestWeight, unit: 'kg',   iconBg: 'var(--green-tint)', iconColor: 'var(--green)', sub: 'Last logged', icon: 'scale' },
                { label: 'Body fat',       val: latestBf ?? '—', unit: latestBf ? '%' : '', iconBg: 'var(--gold-tint)', iconColor: 'var(--gold)', sub: latestBf ? '' : 'Not set', icon: 'trend' },
                { label: 'BMR',            val: bmr.toLocaleString(), unit: 'kcal', iconBg: 'var(--coral-tint)', iconColor: 'var(--coral)', sub: 'At rest', icon: 'bolt' },
                { label: 'TDEE',           val: tdee.toLocaleString(), unit: 'kcal', iconBg: 'var(--green-tint)', iconColor: 'var(--green-deep)', sub: 'Daily burn', icon: 'flame' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 18, padding: 18, border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: s.iconColor, fontSize: 18 }}>
                    {s.icon === 'scale' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"/><path d="M3 21l3-8h12l3 8"/><path d="M8 13l-2 8"/><path d="M16 13l2 8"/></svg>}
                    {s.icon === 'trend' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>}
                    {s.icon === 'bolt' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>}
                    {s.icon === 'flame' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontFamily: '"Space Grotesk",system-ui,sans-serif', fontSize: 26, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.03em' }}>{s.val}</span>
                    {s.unit && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{s.unit}</span>}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginTop: 3 }}>{s.label}</div>
                  {s.sub && <div style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 1 }}>{s.sub}</div>}
                </div>
              ))}
            </div>

            {/* Info banner */}
            <div style={{
              background: 'var(--surface-3)',
              borderRadius: 'var(--r-card)',
              padding: '16px 18px',
              marginBottom: 14,
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
            }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--ink-2)', fontWeight: 500 }}>
                You burn <strong style={{ color: 'var(--ink)' }}>{bmr.toLocaleString()} kcal</strong> at rest. With your activity, total daily burn is <strong style={{ color: 'var(--ink)' }}>{tdee.toLocaleString()} kcal</strong> — the baseline before goal adjustments.
              </span>
            </div>

            {/* Weight trend card */}
            {trend.length >= 1 ? (
              <div style={{ ...cardStyle }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', fontFamily: '"Space Grotesk",system-ui,sans-serif' }}>Weight trend</span>
                  {trend.length >= 2 ? (
                    <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
                      {trend[0].weight} → <strong style={{ color: 'var(--ink)' }}>{trend[trend.length - 1].weight} kg</strong>
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{trend[0].weight} kg today</span>
                  )}
                </div>
                {trend.length >= 2 ? (
                  <>
                    <div style={{ overflowX: 'auto' }}>
                      <WeightChart entries={trend} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                      <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                        {new Date(trend[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--muted)' }}>Today</span>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '8px 0 4px', fontSize: 12, color: 'var(--muted)' }}>
                    Log more entries to see your trend chart
                  </div>
                )}
              </div>
            ) : (
              <div style={{ ...cardStyle }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', fontFamily: '"Space Grotesk",system-ui,sans-serif' }}>Weight trend</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>30 days</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, height: 120, borderRadius: 14, background: 'var(--surface-3)', border: '1px dashed var(--line)' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-2)' }}>No weight logged yet</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>Log below to start tracking</span>
                </div>
              </div>
            )}

            {/* Log weight */}
            <div style={cardStyle}>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 18, fontFamily: '"Space Grotesk",system-ui,sans-serif' }}>
                Log today&apos;s weight
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <label style={labelStyle}>Weight (kg)</label>
                  <input
                    type="number" step="0.1"
                    style={{ ...inputStyle }}
                    placeholder={`e.g. ${latestWeight}`}
                    value={weightInput} onChange={e => setWeightInput(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <label style={labelStyle}>Body fat % <span style={{ color: 'var(--faint)', textTransform: 'none', fontWeight: 400 }}>(opt.)</span></label>
                  <input
                    type="number" step="0.1"
                    style={{ ...inputStyle }}
                    placeholder="e.g. 22"
                    value={bfInput} onChange={e => setBfInput(e.target.value)}
                  />
                </div>
              </div>
              <button onClick={logWeight} className="btn-primary" style={{
                width: '100%', height: 52,
                background: saved ? 'var(--green-tint)' : 'var(--green)',
                color: saved ? 'var(--green-deep)' : '#fff',
                border: 'none', borderRadius: 'var(--r-btn)',
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                boxShadow: saved ? 'none' : 'var(--shadow-green)',
                transition: 'all .15s',
              }}>
                {saved ? '✓ Logged!' : 'Log weight'}
              </button>
            </div>

            {/* Recent entries */}
            {trend.length > 0 && (
              <div style={cardStyle}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', marginBottom: 10 }}>Recent Entries</div>
                {[...trend].reverse().slice(0, 7).map(e => (
                  <div key={e.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '9px 0', borderTop: '1px solid var(--line)',
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                      {new Date(e.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>{e.weight} kg</span>
                      {e.bodyFat && <span style={{ fontSize: 13, color: 'var(--coral)' }}>{e.bodyFat}% bf</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ══════════ GOALS TAB ══════════ */}
        {tab === 'goals' && (
          <>
            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', marginBottom: 14 }}>Goal</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {GOAL_OPTS.map(g => (
                  <button key={g.key} onClick={() => update('goalType', g.key)} style={{
                    flex: 1,
                    borderRadius: 16,
                    padding: '12px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    border: `1px solid ${form.goalType === g.key ? 'var(--green)' : 'var(--line)'}`,
                    background: form.goalType === g.key ? 'rgba(30,127,92,0.08)' : 'var(--surface)',
                    cursor: 'pointer',
                    transition: 'all .2s',
                    fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
                  }}>
                    <span style={{ fontSize: 24 }}>{g.emoji}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: form.goalType === g.key ? 'var(--green)' : 'var(--muted)' }}>
                      {g.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', marginBottom: 14 }}>Body Stats</div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Current weight (kg)</label>
                  <input type="number" step="0.1" style={inputStyle} value={form.currentWeight}
                    onChange={e => update('currentWeight', Number(e.target.value))}/>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Target weight (kg)</label>
                  <input type="number" step="0.1" style={inputStyle} value={form.targetWeight}
                    onChange={e => update('targetWeight', Number(e.target.value))}/>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Age</label>
                  <input type="number" style={inputStyle} value={form.age}
                    onChange={e => update('age', Number(e.target.value))}/>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Height (cm)</label>
                  <input type="number" style={inputStyle} value={form.heightCm}
                    onChange={e => update('heightCm', Number(e.target.value))}/>
                </div>
              </div>

              <label style={labelStyle}>Activity Level</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
                  <button key={key} onClick={() => update('activityLevel', key)} style={{
                    borderRadius: 12,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: `1px solid ${form.activityLevel === key ? 'var(--green)' : 'var(--line)'}`,
                    background: form.activityLevel === key ? 'rgba(30,127,92,0.08)' : 'var(--surface)',
                    cursor: 'pointer',
                    transition: 'all .2s',
                    fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
                  }}>
                    <span style={{ fontSize: 13, color: form.activityLevel === key ? 'var(--ink)' : 'var(--ink-2)', fontWeight: form.activityLevel === key ? 700 : 400 }}>
                      {label}
                    </span>
                    {form.activityLevel === key && <span style={{ color: 'var(--green)', fontSize: 14 }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* BMR/TDEE preview */}
            <div style={{
              background: 'rgba(30,127,92,0.06)',
              borderRadius: 16,
              padding: '14px 16px',
              marginBottom: 12,
              border: '1px solid rgba(30,127,92,0.15)',
            }}>
              <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700, marginBottom: 6 }}>Preview with these settings</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                BMR: <strong style={{ color: 'var(--ink)' }}>{calculateBMR(form)} kcal</strong>
                {'  ·  '}
                TDEE: <strong style={{ color: 'var(--ink)' }}>{calculateTargetCalories(form)} kcal</strong>
                {'  ·  '}
                Target: <strong style={{ color: 'var(--ink)' }}>
                  {Math.max(1200, calculateTargetCalories(form) + (form.goalType === 'weight_loss' ? -500 : form.goalType === 'muscle_gain' ? 300 : 0))} kcal
                </strong>
              </div>
            </div>

            <button onClick={saveProfile} style={{
              width: '100%',
              background: saved ? 'rgba(30,127,92,0.10)' : 'var(--green)',
              color: saved ? 'var(--green)' : 'var(--surface)',
              border: saved ? '1px solid rgba(30,127,92,0.20)' : 'none',
              borderRadius: 16,
              padding: '15px 0',
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all .2s',
              boxShadow: saved ? 'none' : '0 6px 20px rgba(30,127,92,0.25)',
              fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
            }}>
              {saved ? '✓ Saved!' : 'Save Goals'}
            </button>
          </>
        )}

        {/* ══════════ SETTINGS TAB ══════════ */}
        {tab === 'settings' && (
          <>
            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', marginBottom: 14 }}>Personal Info</div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Name</label>
                <input style={inputStyle} value={form.name}
                  onChange={e => update('name', e.target.value)} placeholder="Your name"/>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" value={form.email}
                  onChange={e => update('email', e.target.value)} placeholder="your@email.com"/>
              </div>
              <div>
                <label style={labelStyle}>
                  Biological sex <span style={{ color: 'var(--muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(affects calorie calc)</span>
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['male', 'female', 'other'] as const).map(g => (
                    <button key={g} onClick={() => update('gender', g)} style={{
                      flex: 1,
                      padding: '9px 0',
                      borderRadius: 12,
                      border: `1px solid ${form.gender === g ? 'var(--green)' : 'var(--line)'}`,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      background: form.gender === g ? 'rgba(30,127,92,0.10)' : '#F2F4F8',
                      color:      form.gender === g ? 'var(--green)' : 'var(--muted)',
                      transition: 'all .2s',
                      fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
                    }}>{g}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Dietary Preferences ── */}
            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', marginBottom: 6 }}>Dietary Preferences</div>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5 }}>
                Used to filter food recommendations on the Eat page. Select all that apply.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                {DIET_OPTIONS.map(opt => {
                  const active = dietFlags.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      onClick={() => toggleDietFlag(opt.key)}
                      style={{
                        borderRadius: 12, padding: '10px 10px',
                        display: 'flex', alignItems: 'center', gap: 8,
                        border: `1.5px solid ${active ? 'var(--green)' : 'var(--line)'}`,
                        background: active ? 'rgba(30,127,92,0.08)' : '#F7F8FB',
                        cursor: 'pointer', transition: 'all .2s',
                        fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{opt.emoji}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: active ? 'var(--green)' : 'var(--ink-2)', flex: 1 }}>{opt.label}</span>
                      {active && <span style={{ fontSize: 11, color: 'var(--green)' }}>✓</span>}
                    </button>
                  );
                })}
              </div>
              <button onClick={saveDietPreferences} style={{
                width: '100%',
                background: dietSaved ? 'rgba(30,127,92,0.10)' : 'var(--green)',
                color: dietSaved ? 'var(--green)' : 'var(--surface)',
                border: dietSaved ? '1px solid rgba(30,127,92,0.20)' : 'none',
                borderRadius: 14,
                padding: '12px 0',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all .2s',
                boxShadow: dietSaved ? 'none' : '0 4px 14px rgba(30,127,92,0.22)',
                fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
              }}>
                {dietSaved ? '✓ Preferences Saved!' : 'Save Dietary Preferences'}
              </button>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 14 }}>Manual Calorie Targets</div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Daily calories (kcal)</label>
                <input type="number" style={inputStyle} value={form.targetCalories}
                  onChange={e => update('targetCalories', Number(e.target.value))}/>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { key: 'targetProtein' as const, label: 'Protein (g)', color: 'var(--green)' },
                  { key: 'targetCarbs'   as const, label: 'Carbs (g)',   color: 'var(--gold)' },
                  { key: 'targetFat'     as const, label: 'Fat (g)',     color: 'var(--coral)' },
                ].map(f => (
                  <div key={f.key} style={{ flex: 1 }}>
                    <label style={{ ...labelStyle, color: f.color }}>{f.label}</label>
                    <input type="number" style={inputStyle} value={form[f.key]}
                      onChange={e => update(f.key, Number(e.target.value))}/>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={saveProfile} className="btn-primary" style={{
              width: '100%', height: 52,
              background: saved ? 'var(--green-tint)' : 'var(--green)',
              color: saved ? 'var(--green-deep)' : '#fff',
              border: 'none', borderRadius: 'var(--r-btn)',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              boxShadow: saved ? 'none' : 'var(--shadow-green)',
              marginBottom: 12,
            }}>
              {saved ? '✓ Saved!' : 'Save Settings'}
            </button>

            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>Account</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={async () => {
                  setSigningOut(true);
                  try { if (auth) await signOut(auth); } catch { /* ignore */ }
                  router.push('/login');
                }} disabled={signingOut} style={{
                  width: '100%', borderRadius: 14, padding: '12px 0',
                  fontSize: 14, fontWeight: 700,
                  background: signingOut ? 'var(--surface-3)' : 'var(--green-tint)',
                  color: signingOut ? 'var(--muted)' : 'var(--green-deep)',
                  border: '1px solid var(--green-tint-2)', cursor: signingOut ? 'default' : 'pointer',
                  fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
                  transition: 'all .15s',
                }}>
                  {signingOut ? 'Signing out…' : '🚪 Sign Out'}
                </button>
                <button onClick={async () => {
                  if (confirm('Reset all app data and start over? This will clear all logs.')) {
                    store.resetAll();
                    try { await signOut(auth!); } catch { /* ignore */ }
                    window.location.href = '/register';
                  }
                }} style={{
                  width: '100%', borderRadius: 14, padding: '12px 0',
                  fontSize: 14, fontWeight: 600,
                  background: 'var(--coral-tint)', color: 'var(--coral)',
                  border: '1px solid rgba(223,95,59,0.20)', cursor: 'pointer',
                  fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
                }}>
                  🔄 Reset App &amp; Start Over
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
