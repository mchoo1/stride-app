'use client';
import { useState } from 'react';
import { useStrideStore } from '@/lib/store';
import { calculateBMR, calculateTargetCalories, calculateMacros } from '@/lib/utils';
import type { GoalType, DietaryFlag } from '@/types';

const GOAL_OPTS: { key: GoalType; emoji: string; label: string }[] = [
  { key: 'weight_loss', emoji: '📉', label: 'Lose Weight'  },
  { key: 'muscle_gain', emoji: '💪', label: 'Build Muscle' },
  { key: 'maintenance', emoji: '⚖️', label: 'Maintain'     },
];

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary:   'Sedentary (desk job)',
  light:       'Lightly active (1-3x/wk)',
  moderate:    'Moderately active (3-5x/wk)',
  active:      'Very active (6-7x/wk)',
  very_active: 'Athlete (2x/day)',
};

/** Mini SVG sparkline for weight trend */
function WeightChart({ entries }: { entries: { date: string; weight: number }[] }) {
  if (entries.length < 2) return null;
  const W = 280, H = 80, PAD = 8;
  const weights = entries.map(e => e.weight);
  const min = Math.min(...weights) - 0.5;
  const max = Math.max(...weights) + 0.5;
  const xStep = (W - PAD * 2) / (entries.length - 1);
  const yScale = (H - PAD * 2) / (max - min || 1);
  const points = entries.map((e, i) => [
    PAD + i * xStep,
    H - PAD - (e.weight - min) * yScale,
  ]);
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  // area fill
  const area = d + ` L${points[points.length-1][0]},${H} L${points[0][0]},${H} Z`;

  const first = weights[0], last = weights[weights.length - 1];
  const trending = last <= first; // green if going down (weight loss is positive direction)

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={trending ? '#4CAF82' : '#FF6B6B'} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={trending ? '#4CAF82' : '#FF6B6B'} stopOpacity="0.0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#chartFill)"/>
      <path d={d} fill="none" stroke={trending ? '#4CAF82' : '#FF6B6B'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === points.length - 1 ? 4 : 2.5}
          fill={trending ? '#4CAF82' : '#FF6B6B'}
          stroke="#fff" strokeWidth="1.5"/>
      ))}
    </svg>
  );
}

export default function MePage() {
  const store   = useStrideStore();
  const profile = store.profile;
  const trend   = store.getWeightTrend(30);

  const bmr  = calculateBMR(profile);
  const tdee = calculateTargetCalories(profile);

  const [tab, setTab]             = useState<'body' | 'goals' | 'settings'>('body');
  const [weightInput, setWeightInput] = useState('');
  const [bfInput, setBfInput]     = useState('');
  const [saved, setSaved]         = useState(false);
  const [form, setForm]           = useState({ ...profile });

  const latestWeight = trend.length ? trend[trend.length - 1].weight : profile.currentWeight;
  const latestBf     = trend.length ? trend[trend.length - 1].bodyFat : undefined;

  const logWeight = () => {
    const w = parseFloat(weightInput);
    if (isNaN(w) || w < 20 || w > 300) return;
    const bf = bfInput ? parseFloat(bfInput) : undefined;
    store.addWeightEntry(w, bf);
    setWeightInput('');
    setBfInput('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveProfile = () => {
    const calories = calculateTargetCalories(form);
    const macros   = calculateMacros(calories, form.goalType);
    store.updateProfile({ ...form, targetCalories: calories, targetProtein: macros.protein, targetCarbs: macros.carbs, targetFat: macros.fat });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const update = (key: string, val: unknown) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(160deg, #457B9D 0%, #1d4e6e 100%)',
        padding: '44px 20px 20px',
      }}>
        <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 3 }}>Me</h1>
        <p style={{ color: 'rgba(255,255,255,.65)', fontSize: 13, margin: 0 }}>Body stats, goals &amp; settings</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, background: '#fff', borderBottom: '1px solid #eee' }}>
        {(['body', 'goals', 'settings'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '12px 0', fontSize: 13, fontWeight: 600,
            border: 'none', cursor: 'pointer', background: 'none',
            color: tab === t ? '#457B9D' : '#aaa',
            borderBottom: `2px solid ${tab === t ? '#457B9D' : 'transparent'}`,
            transition: 'all .2s', textTransform: 'capitalize',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '14px 14px 100px' }}>

        {/* ══ BODY TAB ══ */}
        {tab === 'body' && (
          <>
            {/* Stats summary */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14,
            }}>
              {[
                { label: 'Current Weight', val: `${latestWeight} kg`, icon: '⚖️', color: '#457B9D' },
                { label: 'Body Fat',       val: latestBf ? `${latestBf}%` : '—',  icon: '📊', color: '#E76F51' },
                { label: 'BMR',            val: `${bmr} kcal`,                     icon: '🔋', color: '#4CAF82' },
                { label: 'TDEE',           val: `${tdee} kcal`,                    icon: '⚡', color: '#F5A623' },
              ].map(s => (
                <div key={s.label} style={{
                  background: '#fff', borderRadius: 18, padding: '14px 12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,.06)',
                }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* BMR / TDEE plain-English */}
            <div style={{
              background: '#EBF3FD', borderRadius: 16, padding: '14px 16px', marginBottom: 14,
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 18 }}>ℹ️</span>
              <span style={{ fontSize: 13, color: '#3a6a8a', lineHeight: 1.6 }}>
                Your body burns <strong>{bmr} kcal</strong> per day just at rest (BMR). With your activity level, your total daily burn is <strong>{tdee} kcal</strong> (TDEE) — that&apos;s your daily calorie target before adjusting for your goal.
              </span>
            </div>

            {/* Weight trend chart */}
            {trend.length >= 2 ? (
              <div className="app-card" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>Weight (30 days)</div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    {trend[0].weight} → <strong style={{ color: '#1a1a2e' }}>{trend[trend.length - 1].weight} kg</strong>
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <WeightChart entries={trend} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: '#ccc' }}>
                    {new Date(trend[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span style={{ fontSize: 11, color: '#ccc' }}>Today</span>
                </div>
              </div>
            ) : (
              <div className="app-card" style={{ marginBottom: 14, textAlign: 'center', padding: '24px 16px' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📈</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#bbb' }}>No weight trend yet</div>
                <div style={{ fontSize: 12, color: '#ccc', marginTop: 4 }}>Log your weight below to start tracking</div>
              </div>
            )}

            {/* Log weight entry */}
            <div className="app-card" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>
                Log Today&apos;s Weight
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 2 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 5 }}>Weight (kg)</div>
                  <input
                    type="number" step="0.1" placeholder={`e.g. ${latestWeight}`}
                    value={weightInput} onChange={e => setWeightInput(e.target.value)}
                    className="form-input"
                    style={{ fontSize: 18, fontWeight: 700, textAlign: 'center' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 5 }}>Body fat % <span style={{ color: '#ccc', fontWeight: 400 }}>(opt.)</span></div>
                  <input
                    type="number" step="0.1" placeholder="e.g. 22"
                    value={bfInput} onChange={e => setBfInput(e.target.value)}
                    className="form-input"
                    style={{ fontSize: 16, fontWeight: 700, textAlign: 'center' }}
                  />
                </div>
              </div>
              <button onClick={logWeight} className="btn-primary" style={{ width: '100%', padding: '12px 0', fontSize: 14 }}>
                {saved ? '✅ Logged!' : 'Log Weight'}
              </button>
            </div>

            {/* Recent entries */}
            {trend.length > 0 && (
              <div className="app-card">
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 10 }}>Recent Entries</div>
                {[...trend].reverse().slice(0, 7).map(e => (
                  <div key={e.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0', borderTop: '1px solid #f5f5f5',
                  }}>
                    <span style={{ fontSize: 13, color: '#888' }}>
                      {new Date(e.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#457B9D' }}>{e.weight} kg</span>
                      {e.bodyFat && <span style={{ fontSize: 13, color: '#E76F51' }}>{e.bodyFat}% bf</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ══ GOALS TAB ══ */}
        {tab === 'goals' && (
          <>
            <div className="app-card" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 14 }}>Goal</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {GOAL_OPTS.map(g => (
                  <button key={g.key} onClick={() => update('goalType', g.key)} style={{
                    flex: 1, borderRadius: 16, padding: '12px 8px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    border: `2px solid ${form.goalType === g.key ? '#4CAF82' : '#eee'}`,
                    background: form.goalType === g.key ? 'rgba(76,175,130,.08)' : '#fafafa',
                    cursor: 'pointer', transition: 'all .2s',
                  }}>
                    <span style={{ fontSize: 24 }}>{g.emoji}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: form.goalType === g.key ? '#4CAF82' : '#bbb' }}>
                      {g.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="app-card" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 14 }}>Body Stats</div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 5 }}>Current weight (kg)</div>
                  <input type="number" step="0.1" className="form-input" value={form.currentWeight}
                    onChange={e => update('currentWeight', Number(e.target.value))}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 5 }}>Target weight (kg)</div>
                  <input type="number" step="0.1" className="form-input" value={form.targetWeight}
                    onChange={e => update('targetWeight', Number(e.target.value))}/>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 5 }}>Age</div>
                  <input type="number" className="form-input" value={form.age}
                    onChange={e => update('age', Number(e.target.value))}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 5 }}>Height (cm)</div>
                  <input type="number" className="form-input" value={form.heightCm}
                    onChange={e => update('heightCm', Number(e.target.value))}/>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 8 }}>Activity Level</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
                    <button key={key} onClick={() => update('activityLevel', key)} style={{
                      borderRadius: 12, padding: '10px 14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      border: `1.5px solid ${form.activityLevel === key ? '#4CAF82' : '#eee'}`,
                      background: form.activityLevel === key ? 'rgba(76,175,130,.08)' : '#fafafa',
                      cursor: 'pointer', transition: 'all .2s',
                    }}>
                      <span style={{ fontSize: 13, color: form.activityLevel === key ? '#1a1a2e' : '#888', fontWeight: form.activityLevel === key ? 700 : 400 }}>{label}</span>
                      {form.activityLevel === key && <span style={{ color: '#4CAF82', fontSize: 16 }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview new TDEE */}
            <div style={{
              background: 'rgba(76,175,130,.08)', borderRadius: 16, padding: '14px 16px', marginBottom: 14,
              border: '1px solid rgba(76,175,130,.20)',
            }}>
              <div style={{ fontSize: 13, color: '#4CAF82', fontWeight: 700, marginBottom: 4 }}>Preview with these settings</div>
              <div style={{ fontSize: 13, color: '#555' }}>
                BMR: <strong>{calculateBMR(form)} kcal</strong> &nbsp;·&nbsp;
                TDEE: <strong>{calculateTargetCalories(form)} kcal</strong> &nbsp;·&nbsp;
                Target: <strong>{Math.max(1200, calculateTargetCalories(form) + (form.goalType === 'weight_loss' ? -500 : form.goalType === 'muscle_gain' ? 300 : 0))} kcal</strong>
              </div>
            </div>

            <button onClick={saveProfile} className="btn-primary" style={{ width: '100%', padding: '14px 0', fontSize: 15 }}>
              {saved ? '✅ Saved!' : 'Save Goals'}
            </button>
          </>
        )}

        {/* ══ SETTINGS TAB ══ */}
        {tab === 'settings' && (
          <>
            <div className="app-card" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 14 }}>Personal Info</div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 5 }}>Name</div>
                <input className="form-input" value={form.name}
                  onChange={e => update('name', e.target.value)} placeholder="Your name"/>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 5 }}>Email</div>
                <input className="form-input" type="email" value={form.email}
                  onChange={e => update('email', e.target.value)} placeholder="your@email.com"/>
              </div>
            </div>

            <div className="app-card" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 14 }}>Manual Calorie Targets</div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 5 }}>Daily calories (kcal)</div>
                <input type="number" className="form-input" value={form.targetCalories}
                  onChange={e => update('targetCalories', Number(e.target.value))}/>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { key: 'targetProtein' as const, label: 'Protein (g)', color: '#4A90D9' },
                  { key: 'targetCarbs'   as const, label: 'Carbs (g)',   color: '#F5A623' },
                  { key: 'targetFat'     as const, label: 'Fat (g)',     color: '#4CAF82' },
                ].map(f => (
                  <div key={f.key} style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: f.color, marginBottom: 5 }}>{f.label}</div>
                    <input type="number" className="form-input" value={form[f.key]}
                      onChange={e => update(f.key, Number(e.target.value))}/>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={saveProfile} className="btn-primary" style={{ width: '100%', padding: '14px 0', fontSize: 15, marginBottom: 14 }}>
              {saved ? '✅ Saved!' : 'Save Settings'}
            </button>

            <div className="app-card">
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>Account</div>
              <button onClick={() => {
                if (confirm('Reset all app data and start over?')) {
                  store.updateProfile({ onboardingComplete: false });
                  window.location.href = '/onboarding';
                }
              }} style={{
                width: '100%', borderRadius: 14, padding: '12px 0', fontSize: 14, fontWeight: 600,
                background: 'rgba(255,107,107,.08)', color: '#FF6B6B',
                border: '1px solid rgba(255,107,107,.20)', cursor: 'pointer',
              }}>
                🔄 Reset App &amp; Start Over
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
