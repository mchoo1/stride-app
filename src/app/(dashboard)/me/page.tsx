'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useStrideStore } from '@/lib/store';
import { calculateBMR, calculateTargetCalories, calculateMacros } from '@/lib/utils';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { api } from '@/lib/apiClient';
import type { GoalType } from '@/types';

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
  const color    = '#1E7F5C';

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
          fill={color} stroke="#FFFFFF" strokeWidth="1.5"/>
      ))}
    </svg>
  );
}

export default function MePage() {
  const store   = useStrideStore();
  const profile = store.profile;
  const trend   = store.getWeightTrend(30);
  const streak  = store.streak;

  const bmr  = calculateBMR(profile);
  const tdee = calculateTargetCalories(profile);

  const [tab,         setTab        ] = useState<'body' | 'goals' | 'settings'>('body');
  const [weightInput, setWeightInput] = useState('');
  const [bfInput,     setBfInput    ] = useState('');
  const [saved,       setSaved      ] = useState(false);
  const [form,        setForm       ] = useState({ ...profile });

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

  // ── Design tokens ──────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    border: '1px solid #E5E9F2',
    boxShadow: '0 1px 2px rgba(15,27,45,0.04), 0 1px 3px rgba(15,27,45,0.03)',
    marginBottom: 12,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#FFFFFF',
    border: '1.5px solid #D3D9E3',
    borderRadius: 12,
    padding: '11px 14px',
    fontSize: 15,
    color: '#0F1B2D',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    transition: 'border-color .15s, box-shadow .15s',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: '#8B95A7',
    marginBottom: 6,
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  };

  // ── Today's date eyebrow ──────────────────────────────────────
  const todayStr = new Date().toLocaleDateString('en-SG', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();

  return (
    <div style={{ background: '#F7F8FB', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Header ── */}
      <div style={{ padding: '52px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#8B95A7', margin: 0, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {todayStr}
          </p>
          <h1 style={{
            fontSize: 40, fontWeight: 900, color: '#0F1B2D', margin: 0,
            fontFamily: "'Anton', Impact, sans-serif", letterSpacing: '0.01em', lineHeight: 1,
          }}>ME</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {streak > 0 && (
            <div style={{
              background: 'rgba(242,169,59,0.12)', border: '1px solid rgba(176,123,32,0.20)',
              borderRadius: 20, padding: '6px 12px',
              fontSize: 12, fontWeight: 700, color: '#B07B20',
            }}>
              🔥 {streak}d
            </div>
          )}
          <Link href="/log" style={{
            background: 'rgba(30,127,92,0.10)', border: '1px solid rgba(30,127,92,0.20)',
            borderRadius: 14, padding: '7px 14px',
            fontSize: 12, fontWeight: 800, color: '#1E7F5C', textDecoration: 'none',
          }}>+ Log</Link>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          padding: 4,
          display: 'flex',
          gap: 4,
          border: '1px solid #E5E9F2',
          boxShadow: '0 1px 2px rgba(15,27,45,0.04)',
        }}>
          {(['body', 'goals', 'settings'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 10,
              border: tab === t ? '1px solid #E5E9F2' : '1px solid transparent',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'capitalize',
              background: tab === t ? '#1E7F5C' : 'transparent',
              color:      tab === t ? '#FFFFFF' : '#5B6576',
              transition: 'all .2s',
              fontFamily: 'Inter, sans-serif',
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px 100px' }}>

        {/* ══════════ BODY TAB ══════════ */}
        {tab === 'body' && (
          <>
            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[
                { label: 'Current Weight', val: `${latestWeight} kg`, icon: '⚖️', color: '#2E6FB8'  },
                { label: 'Body Fat',       val: latestBf ? `${latestBf}%` : '—', icon: '📊', color: '#D04E36' },
                { label: 'BMR',            val: `${bmr} kcal`,                   icon: '🔋', color: '#1E7F5C' },
                { label: 'TDEE',           val: `${tdee} kcal`,                  icon: '⚡', color: '#5B6576' },
              ].map(s => (
                <div key={s.label} style={{
                  background: '#FFFFFF',
                  borderRadius: 18,
                  padding: '16px 14px',
                  border: '1px solid #E5E9F2',
                  boxShadow: '0 1px 2px rgba(15,27,45,0.04), 0 1px 3px rgba(15,27,45,0.03)',
                }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: '#8B95A7', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Info banner */}
            <div style={{
              background: 'rgba(30,127,92,0.06)',
              borderRadius: 16,
              padding: '14px 16px',
              marginBottom: 12,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              border: '1px solid rgba(30,127,92,0.15)',
            }}>
              <span style={{ fontSize: 16 }}>ℹ️</span>
              <span style={{ fontSize: 12, color: '#1E7F5C', lineHeight: 1.6 }}>
                Your body burns <strong>{bmr} kcal</strong> at rest (BMR). With your activity level your total daily burn is <strong>{tdee} kcal</strong> (TDEE) — the baseline before goal adjustments.
              </span>
            </div>

            {/* Weight chart */}
            {trend.length >= 1 ? (
              <div style={{ ...cardStyle }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#0F1B2D' }}>Weight (30 days)</span>
                  {trend.length >= 2 ? (
                    <span style={{ fontSize: 12, color: '#8B95A7' }}>
                      {trend[0].weight} → <strong style={{ color: '#0F1B2D' }}>{trend[trend.length - 1].weight} kg</strong>
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: '#8B95A7' }}>{trend[0].weight} kg today</span>
                  )}
                </div>
                {trend.length >= 2 ? (
                  <>
                    <div style={{ overflowX: 'auto' }}>
                      <WeightChart entries={trend} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                      <span style={{ fontSize: 10, color: '#8B95A7' }}>
                        {new Date(trend[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span style={{ fontSize: 10, color: '#8B95A7' }}>Today</span>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '8px 0 4px', fontSize: 12, color: '#8B95A7' }}>
                    Log more entries to see your trend chart
                  </div>
                )}
              </div>
            ) : (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '28px 16px' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📈</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#5B6576' }}>No weight logged yet</div>
                <div style={{ fontSize: 12, color: '#8B95A7', marginTop: 4 }}>Log your weight below to start tracking</div>
              </div>
            )}

            {/* Log weight */}
            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F1B2D', marginBottom: 12 }}>
                Log Today&apos;s Weight
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 2 }}>
                  <label style={labelStyle}>Weight (kg)</label>
                  <input
                    type="number" step="0.1"
                    style={{ ...inputStyle, fontSize: 18, fontWeight: 700, textAlign: 'center' }}
                    placeholder={`e.g. ${latestWeight}`}
                    value={weightInput} onChange={e => setWeightInput(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Body fat % <span style={{ color: '#D3D9E3', fontWeight: 400 }}>(opt.)</span></label>
                  <input
                    type="number" step="0.1"
                    style={{ ...inputStyle, textAlign: 'center' }}
                    placeholder="e.g. 22"
                    value={bfInput} onChange={e => setBfInput(e.target.value)}
                  />
                </div>
              </div>
              <button onClick={logWeight} style={{
                width: '100%',
                background: saved ? 'rgba(30,127,92,0.10)' : '#1E7F5C',
                color: saved ? '#1E7F5C' : '#FFFFFF',
                border: saved ? '1px solid rgba(30,127,92,0.20)' : 'none',
                borderRadius: 14,
                padding: '13px 0',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all .2s',
                boxShadow: saved ? 'none' : '0 6px 20px rgba(30,127,92,0.25)',
                fontFamily: 'Inter, sans-serif',
              }}>
                {saved ? '✓ Logged!' : 'Log Weight'}
              </button>
            </div>

            {/* Recent entries */}
            {trend.length > 0 && (
              <div style={cardStyle}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F1B2D', marginBottom: 10 }}>Recent Entries</div>
                {[...trend].reverse().slice(0, 7).map(e => (
                  <div key={e.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '9px 0', borderTop: '1px solid #E5E9F2',
                  }}>
                    <span style={{ fontSize: 13, color: '#8B95A7' }}>
                      {new Date(e.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#2E6FB8' }}>{e.weight} kg</span>
                      {e.bodyFat && <span style={{ fontSize: 13, color: '#D04E36' }}>{e.bodyFat}% bf</span>}
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
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F1B2D', marginBottom: 14 }}>Goal</div>
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
                    border: `1px solid ${form.goalType === g.key ? '#1E7F5C' : '#E5E9F2'}`,
                    background: form.goalType === g.key ? 'rgba(30,127,92,0.08)' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all .2s',
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    <span style={{ fontSize: 24 }}>{g.emoji}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: form.goalType === g.key ? '#1E7F5C' : '#8B95A7' }}>
                      {g.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F1B2D', marginBottom: 14 }}>Body Stats</div>
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
                    border: `1px solid ${form.activityLevel === key ? '#1E7F5C' : '#E5E9F2'}`,
                    background: form.activityLevel === key ? 'rgba(30,127,92,0.08)' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all .2s',
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    <span style={{ fontSize: 13, color: form.activityLevel === key ? '#0F1B2D' : '#5B6576', fontWeight: form.activityLevel === key ? 700 : 400 }}>
                      {label}
                    </span>
                    {form.activityLevel === key && <span style={{ color: '#1E7F5C', fontSize: 14 }}>✓</span>}
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
              <div style={{ fontSize: 12, color: '#1E7F5C', fontWeight: 700, marginBottom: 6 }}>Preview with these settings</div>
              <div style={{ fontSize: 13, color: '#5B6576' }}>
                BMR: <strong style={{ color: '#0F1B2D' }}>{calculateBMR(form)} kcal</strong>
                {'  ·  '}
                TDEE: <strong style={{ color: '#0F1B2D' }}>{calculateTargetCalories(form)} kcal</strong>
                {'  ·  '}
                Target: <strong style={{ color: '#0F1B2D' }}>
                  {Math.max(1200, calculateTargetCalories(form) + (form.goalType === 'weight_loss' ? -500 : form.goalType === 'muscle_gain' ? 300 : 0))} kcal
                </strong>
              </div>
            </div>

            <button onClick={saveProfile} style={{
              width: '100%',
              background: saved ? 'rgba(30,127,92,0.10)' : '#1E7F5C',
              color: saved ? '#1E7F5C' : '#FFFFFF',
              border: saved ? '1px solid rgba(30,127,92,0.20)' : 'none',
              borderRadius: 16,
              padding: '15px 0',
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all .2s',
              boxShadow: saved ? 'none' : '0 6px 20px rgba(30,127,92,0.25)',
              fontFamily: 'Inter, sans-serif',
            }}>
              {saved ? '✓ Saved!' : 'Save Goals'}
            </button>
          </>
        )}

        {/* ══════════ SETTINGS TAB ══════════ */}
        {tab === 'settings' && (
          <>
            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F1B2D', marginBottom: 14 }}>Personal Info</div>
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
                  Biological sex <span style={{ color: '#8B95A7', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(affects calorie calc)</span>
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['male', 'female', 'other'] as const).map(g => (
                    <button key={g} onClick={() => update('gender', g)} style={{
                      flex: 1,
                      padding: '9px 0',
                      borderRadius: 12,
                      border: `1px solid ${(form as unknown as Record<string, unknown>).gender === g ? '#1E7F5C' : '#E5E9F2'}`,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      background: (form as unknown as Record<string, unknown>).gender === g ? 'rgba(30,127,92,0.10)' : '#F2F4F8',
                      color:      (form as unknown as Record<string, unknown>).gender === g ? '#1E7F5C' : '#8B95A7',
                      transition: 'all .2s',
                      fontFamily: 'Inter, sans-serif',
                    }}>{g}</button>
                  ))}
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F1B2D', marginBottom: 14 }}>Manual Calorie Targets</div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Daily calories (kcal)</label>
                <input type="number" style={inputStyle} value={form.targetCalories}
                  onChange={e => update('targetCalories', Number(e.target.value))}/>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { key: 'targetProtein' as const, label: 'Protein (g)', color: '#2E6FB8' },
                  { key: 'targetCarbs'   as const, label: 'Carbs (g)',   color: '#F2A93B' },
                  { key: 'targetFat'     as const, label: 'Fat (g)',     color: '#1E7F5C' },
                ].map(f => (
                  <div key={f.key} style={{ flex: 1 }}>
                    <label style={{ ...labelStyle, color: f.color }}>{f.label}</label>
                    <input type="number" style={inputStyle} value={form[f.key]}
                      onChange={e => update(f.key, Number(e.target.value))}/>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={saveProfile} style={{
              width: '100%',
              background: saved ? 'rgba(30,127,92,0.10)' : '#1E7F5C',
              color: saved ? '#1E7F5C' : '#FFFFFF',
              border: saved ? '1px solid rgba(30,127,92,0.20)' : 'none',
              borderRadius: 16,
              padding: '15px 0',
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all .2s',
              boxShadow: saved ? 'none' : '0 6px 20px rgba(30,127,92,0.25)',
              marginBottom: 12,
              fontFamily: 'Inter, sans-serif',
            }}>
              {saved ? '✓ Saved!' : 'Save Settings'}
            </button>

            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F1B2D', marginBottom: 12 }}>Account</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={async () => {
                  try { await signOut(auth); } catch { /* ignore */ }
                  window.location.href = '/login';
                }} style={{
                  width: '100%',
                  borderRadius: 14,
                  padding: '12px 0',
                  fontSize: 14,
                  fontWeight: 700,
                  background: 'rgba(46,111,184,0.08)',
                  color: '#2E6FB8',
                  border: '1px solid rgba(46,111,184,0.20)',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  🚪 Sign Out
                </button>
                <button onClick={async () => {
                  if (confirm('Reset all app data and start over? This will clear all logs.')) {
                    store.resetAll();
                    try { await signOut(auth); } catch { /* ignore */ }
                    window.location.href = '/register';
                  }
                }} style={{
                  width: '100%',
                  borderRadius: 14,
                  padding: '12px 0',
                  fontSize: 14,
                  fontWeight: 600,
                  background: 'rgba(208,78,54,0.08)',
                  color: '#D04E36',
                  border: '1px solid rgba(208,78,54,0.20)',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
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
