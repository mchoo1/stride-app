'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useStrideStore } from '@/lib/store';
import { calculateBMR, calculateTargetCalories, calculateMacros } from '@/lib/utils';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
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
  const trending = weights[weights.length - 1] <= weights[0];
  const color    = trending ? '#00E676' : '#FF5A5A';

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#chartFill)"/>
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]}
          r={i === points.length - 1 ? 4 : 2.5}
          fill={color} stroke="#161622" strokeWidth="1.5"/>
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
    store.updateProfile({ ...form, targetCalories: calories, targetProtein: macros.protein, targetCarbs: macros.carbs, targetFat: macros.fat });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const update = (key: string, val: unknown) => setForm(f => ({ ...f, [key]: val }));

  const cardStyle = {
    background: '#161622', borderRadius: 20, padding: 16,
    border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12,
  };

  // White inputs with dark font for readability (bug 2 + 6 fix)
  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#FFFFFF',
    border: '1.5px solid #E0E0EC',
    borderRadius: 12, padding: '11px 14px',
    fontSize: 15, color: '#1A1A2E', outline: 'none',
    fontFamily: 'Inter, sans-serif',
    transition: 'border-color .15s',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: '#A8A8C8', marginBottom: 6, display: 'block',
  };

  return (
    <div style={{ background: '#0C0C14', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div style={{ padding: '52px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#F0F0F8', margin: 0, marginBottom: 2 }}>Me</h1>
          <p style={{ fontSize: 13, color: '#6E6E90', margin: 0 }}>Body stats, goals &amp; settings</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {streak > 0 && <div className="streak-badge">🔥 {streak}d</div>}
          {/* Log shortcut */}
          <Link href="/log" style={{
            background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.20)',
            borderRadius: 14, padding: '7px 14px',
            fontSize: 12, fontWeight: 800, color: '#00E676', textDecoration: 'none',
          }}>+ Log</Link>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={{
          background: '#161622', borderRadius: 14, padding: 4,
          display: 'flex', gap: 4, border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {(['body', 'goals', 'settings'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '9px 0', borderRadius: 10, border: 'none',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize',
              background: tab === t ? 'rgba(74,158,255,0.15)' : 'transparent',
              color:      tab === t ? '#4A9EFF' : '#6E6E90',
              transition: 'all .2s',
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
                { label: 'Current Weight', val: `${latestWeight} kg`, icon: '⚖️', color: '#4A9EFF'  },
                { label: 'Body Fat',       val: latestBf ? `${latestBf}%` : '—', icon: '📊', color: '#FF6B35' },
                { label: 'BMR',            val: `${bmr} kcal`,                   icon: '🔋', color: '#00E676' },
                { label: 'TDEE',           val: `${tdee} kcal`,                  icon: '⚡', color: '#A78BFA' },
              ].map(s => (
                <div key={s.label} style={{ background: '#161622', borderRadius: 18, padding: '16px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: '#6E6E90', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Info banner */}
            <div style={{
              background: 'rgba(74,158,255,0.06)', borderRadius: 16, padding: '14px 16px', marginBottom: 12,
              display: 'flex', gap: 10, alignItems: 'flex-start', border: '1px solid rgba(74,158,255,0.12)',
            }}>
              <span style={{ fontSize: 16 }}>ℹ️</span>
              <span style={{ fontSize: 12, color: '#4A9EFF', lineHeight: 1.6 }}>
                Your body burns <strong>{bmr} kcal</strong> at rest (BMR). With your activity level your total daily burn is <strong>{tdee} kcal</strong> (TDEE) — the baseline before goal adjustments.
              </span>
            </div>

            {/* Weight chart — show as soon as there's at least 1 entry */}
            {trend.length >= 1 ? (
              <div style={{ ...cardStyle }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#F0F0F8' }}>Weight (30 days)</span>
                  {trend.length >= 2 ? (
                    <span style={{ fontSize: 12, color: '#6E6E90' }}>
                      {trend[0].weight} → <strong style={{ color: '#F0F0F8' }}>{trend[trend.length - 1].weight} kg</strong>
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: '#6E6E90' }}>{trend[0].weight} kg today</span>
                  )}
                </div>
                {trend.length >= 2 ? (
                  <>
                    <div style={{ overflowX: 'auto' }}>
                      <WeightChart entries={trend} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                      <span style={{ fontSize: 10, color: '#6E6E90' }}>
                        {new Date(trend[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span style={{ fontSize: 10, color: '#6E6E90' }}>Today</span>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '8px 0 4px', fontSize: 12, color: '#6E6E90' }}>
                    Log more entries to see your trend chart
                  </div>
                )}
              </div>
            ) : (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '28px 16px' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📈</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#A8A8C8' }}>No weight logged yet</div>
                <div style={{ fontSize: 12, color: '#6E6E90', marginTop: 4 }}>Log your weight below to start tracking</div>
              </div>
            )}

            {/* Log weight */}
            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#F0F0F8', marginBottom: 12 }}>
                Log Today&apos;s Weight
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 2 }}>
                  <label style={labelStyle}>Weight (kg)</label>
                  <input
                    type="number" step="0.1" style={{ ...inputStyle, fontSize: 18, fontWeight: 700, textAlign: 'center' }}
                    placeholder={`e.g. ${latestWeight}`}
                    value={weightInput} onChange={e => setWeightInput(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Body fat % <span style={{ color: '#2A2A3A' }}>(opt.)</span></label>
                  <input
                    type="number" step="0.1" style={{ ...inputStyle, textAlign: 'center' }}
                    placeholder="e.g. 22"
                    value={bfInput} onChange={e => setBfInput(e.target.value)}
                  />
                </div>
              </div>
              <button onClick={logWeight} style={{
                width: '100%', background: saved ? 'rgba(0,230,118,0.15)' : '#00E676',
                color: saved ? '#00E676' : '#000',
                border: 'none', borderRadius: 14, padding: '13px 0',
                fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all .2s',
              }}>
                {saved ? '✓ Logged!' : 'Log Weight'}
              </button>
            </div>

            {/* Recent entries */}
            {trend.length > 0 && (
              <div style={cardStyle}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#F0F0F8', marginBottom: 10 }}>Recent Entries</div>
                {[...trend].reverse().slice(0, 7).map(e => (
                  <div key={e.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '9px 0', borderTop: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <span style={{ fontSize: 13, color: '#6E6E90' }}>
                      {new Date(e.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#4A9EFF' }}>{e.weight} kg</span>
                      {e.bodyFat && <span style={{ fontSize: 13, color: '#FF6B35' }}>{e.bodyFat}% bf</span>}
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
              <div style={{ fontSize: 14, fontWeight: 800, color: '#F0F0F8', marginBottom: 14 }}>Goal</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {GOAL_OPTS.map(g => (
                  <button key={g.key} onClick={() => update('goalType', g.key)} style={{
                    flex: 1, borderRadius: 16, padding: '12px 8px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    border: `1px solid ${form.goalType === g.key ? 'rgba(0,230,118,0.40)' : 'rgba(255,255,255,0.06)'}`,
                    background: form.goalType === g.key ? 'rgba(0,230,118,0.08)' : '#1E1E2E',
                    cursor: 'pointer', transition: 'all .2s',
                  }}>
                    <span style={{ fontSize: 24 }}>{g.emoji}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: form.goalType === g.key ? '#00E676' : '#6E6E90' }}>
                      {g.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#F0F0F8', marginBottom: 14 }}>Body Stats</div>
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
                    borderRadius: 12, padding: '10px 14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    border: `1px solid ${form.activityLevel === key ? 'rgba(0,230,118,0.30)' : 'rgba(255,255,255,0.06)'}`,
                    background: form.activityLevel === key ? 'rgba(0,230,118,0.08)' : '#1E1E2E',
                    cursor: 'pointer', transition: 'all .2s',
                  }}>
                    <span style={{ fontSize: 13, color: form.activityLevel === key ? '#F0F0F8' : '#6E6E90', fontWeight: form.activityLevel === key ? 700 : 400 }}>
                      {label}
                    </span>
                    {form.activityLevel === key && <span style={{ color: '#00E676', fontSize: 14 }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div style={{
              background: 'rgba(0,230,118,0.06)', borderRadius: 16, padding: '14px 16px', marginBottom: 12,
              border: '1px solid rgba(0,230,118,0.15)',
            }}>
              <div style={{ fontSize: 12, color: '#00E676', fontWeight: 700, marginBottom: 6 }}>Preview with these settings</div>
              <div style={{ fontSize: 13, color: '#A8A8C8' }}>
                BMR: <strong style={{ color: '#F0F0F8' }}>{calculateBMR(form)} kcal</strong>
                {'  ·  '}
                TDEE: <strong style={{ color: '#F0F0F8' }}>{calculateTargetCalories(form)} kcal</strong>
                {'  ·  '}
                Target: <strong style={{ color: '#F0F0F8' }}>
                  {Math.max(1200, calculateTargetCalories(form) + (form.goalType === 'weight_loss' ? -500 : form.goalType === 'muscle_gain' ? 300 : 0))} kcal
                </strong>
              </div>
            </div>

            <button onClick={saveProfile} style={{
              width: '100%', background: saved ? 'rgba(0,230,118,0.15)' : '#00E676',
              color: saved ? '#00E676' : '#000',
              border: 'none', borderRadius: 16, padding: '15px 0',
              fontSize: 15, fontWeight: 800, cursor: 'pointer', transition: 'all .2s',
              boxShadow: saved ? 'none' : '0 0 24px rgba(0,230,118,0.30)',
            }}>
              {saved ? '✓ Saved!' : 'Save Goals'}
            </button>
          </>
        )}

        {/* ══════════ SETTINGS TAB ══════════ */}
        {tab === 'settings' && (
          <>
            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#F0F0F8', marginBottom: 14 }}>Personal Info</div>
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
                <label style={labelStyle}>Biological sex <span style={{ color: '#6E6E90', fontWeight: 400 }}>(affects calorie calc)</span></label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['male', 'female', 'other'] as const).map(g => (
                    <button key={g} onClick={() => update('gender', g)} style={{
                      flex: 1, padding: '9px 0', borderRadius: 12, border: 'none',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize',
                      background: (form as unknown as Record<string, unknown>).gender === g ? 'rgba(0,230,118,0.15)' : '#1E1E2E',
                      color:      (form as unknown as Record<string, unknown>).gender === g ? '#00E676' : '#6E6E90',
                      transition: 'all .2s',
                    }}>{g}</button>
                  ))}
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#F0F0F8', marginBottom: 14 }}>Manual Calorie Targets</div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Daily calories (kcal)</label>
                <input type="number" style={inputStyle} value={form.targetCalories}
                  onChange={e => update('targetCalories', Number(e.target.value))}/>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { key: 'targetProtein' as const, label: 'Protein (g)', color: '#4A9EFF' },
                  { key: 'targetCarbs'   as const, label: 'Carbs (g)',   color: '#FFD166' },
                  { key: 'targetFat'     as const, label: 'Fat (g)',     color: '#00E676' },
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
              width: '100%', background: saved ? 'rgba(0,230,118,0.15)' : '#00E676',
              color: saved ? '#00E676' : '#000',
              border: 'none', borderRadius: 16, padding: '15px 0',
              fontSize: 15, fontWeight: 800, cursor: 'pointer', transition: 'all .2s',
              boxShadow: saved ? 'none' : '0 0 24px rgba(0,230,118,0.30)',
              marginBottom: 12,
            }}>
              {saved ? '✓ Saved!' : 'Save Settings'}
            </button>

            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#F0F0F8', marginBottom: 12 }}>Account</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={async () => {
                  try { await signOut(auth); } catch { /* ignore */ }
                  window.location.href = '/login';
                }} style={{
                  width: '100%', borderRadius: 14, padding: '12px 0',
                  fontSize: 14, fontWeight: 700,
                  background: 'rgba(74,158,255,0.08)', color: '#4A9EFF',
                  border: '1px solid rgba(74,158,255,0.20)', cursor: 'pointer',
                }}>
                  🚪 Sign Out
                </button>
                <button onClick={() => {
                  if (confirm('Reset all app data and start over? This will clear all logs.')) {
                    store.resetAll();
                    window.location.href = '/register';
                  }
                }} style={{
                  width: '100%', borderRadius: 14, padding: '12px 0',
                  fontSize: 14, fontWeight: 600,
                  background: 'rgba(255,90,90,0.08)', color: '#FF5A5A',
                  border: '1px solid rgba(255,90,90,0.20)', cursor: 'pointer',
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
