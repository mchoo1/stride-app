'use client';
import { useState } from 'react';
import { useStrideStore } from '@/lib/store';
import { calculateTargetCalories, calculateMacros } from '@/lib/utils';
import type { GoalType, DietaryFlag } from '@/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const GOAL_OPTS: { key: GoalType; emoji: string; label: string; cls: string }[] = [
  { key: 'weight_loss', emoji: '📉', label: 'Lose Weight',  cls: 'active-lose'  },
  { key: 'muscle_gain', emoji: '💪', label: 'Build Muscle', cls: 'active-gain'  },
  { key: 'maintenance', emoji: '⚖️', label: 'Maintain',     cls: 'active-maint' },
];

const DIET_OPTS: { key: DietaryFlag; emoji: string; label: string }[] = [
  { key: 'vegetarian',   emoji: '🥦', label: 'Vegetarian'  },
  { key: 'vegan',        emoji: '🌱', label: 'Vegan'        },
  { key: 'gluten_free',  emoji: '🌾', label: 'Gluten-Free'  },
  { key: 'lactose_free', emoji: '🥛', label: 'Lactose-Free' },
  { key: 'keto',         emoji: '🥑', label: 'Keto'         },
  { key: 'halal',        emoji: '☪️',  label: 'Halal'        },
];

const WEARABLES = [
  { id: 'apple',  name: 'Apple Health', emoji: '🍎', color: '#FF6B6B' },
  { id: 'fitbit', name: 'Fitbit',       emoji: '💚', color: '#4CAF82' },
  { id: 'garmin', name: 'Garmin',       emoji: '🏃', color: '#4A90D9' },
  { id: 'google', name: 'Google Fit',   emoji: '🔵', color: '#7C5CBF' },
];

export default function ProfilePage() {
  const store   = useStrideStore();
  const router  = useRouter();
  const profile = store.profile;

  const [form, setForm]           = useState({ ...profile });
  const [saved, setSaved]         = useState(false);
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const [tab, setTab]             = useState('Profile');

  const update = (key: string, val: unknown) => setForm(f => ({ ...f, [key]: val }));
  const toggleDiet = (flag: DietaryFlag) =>
    setForm(f => ({
      ...f,
      dietaryFlags: f.dietaryFlags.includes(flag)
        ? f.dietaryFlags.filter(d => d !== flag)
        : [...f.dietaryFlags, flag],
    }));

  const save = () => {
    const calories = calculateTargetCalories(form);
    const macros   = calculateMacros(calories, form.goalType);
    store.updateProfile({ ...form, targetCalories: calories, targetProtein: macros.protein, targetCarbs: macros.carbs, targetFat: macros.fat });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleWearable = (id: string) => {
    setConnected(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>

      {/* ── Green header ── */}
      <div style={{
        background: 'linear-gradient(160deg, #4CAF82 0%, #38a169 100%)',
        padding: '44px 20px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={save} style={{
          position: 'absolute', right: 20,
          background: 'rgba(255,255,255,.25)', border: 'none',
          color: '#fff', fontSize: 13, fontWeight: 700, borderRadius: 10,
          padding: '6px 14px', cursor: 'pointer',
        }}>
          {saved ? 'Saved ✓' : 'Save'}
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>Profile &amp; Goals</h1>
        </div>
      </div>

      {/* ── Tab chips ── */}
      <div style={{
        display: 'flex', gap: 8, padding: '12px 14px',
        background: '#fff', borderBottom: '1px solid #eee',
      }}>
        {['Profile', 'Wearables', 'Targets'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            borderRadius: 20, padding: '6px 16px', fontSize: 13, fontWeight: 600,
            border: 'none', cursor: 'pointer',
            background: t === tab ? '#4CAF82' : '#f0f2f5',
            color: t === tab ? '#fff' : '#888',
            transition: 'all .2s',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '14px 14px 100px' }}>

        {/* ══ PROFILE TAB ══ */}
        {tab === 'Profile' && (
          <>
            {/* Personal section */}
            <div style={{ marginBottom: 16 }}>
              <div className="section-label" style={{ marginBottom: 8 }}>Personal</div>
              <div className="app-card">
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 5 }}>Name</div>
                  <input className="form-input" value={form.name}
                    onChange={e => update('name', e.target.value)} placeholder="Your name"/>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 5 }}>Email</div>
                  <input className="form-input" type="email" value={form.email}
                    onChange={e => update('email', e.target.value)} placeholder="your@email.com"/>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 5 }}>Age</div>
                    <input type="number" className="form-input" value={form.age}
                      onChange={e => update('age', Number(e.target.value))}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 5 }}>Height (cm)</div>
                    <input type="number" className="form-input" value={form.heightCm}
                      onChange={e => update('heightCm', Number(e.target.value))}/>
                  </div>
                </div>
              </div>
            </div>

            {/* Fitness goal */}
            <div style={{ marginBottom: 16 }}>
              <div className="section-label" style={{ marginBottom: 8 }}>Fitness Goal</div>
              <div className="app-card">
                <div style={{ display: 'flex', gap: 8 }}>
                  {GOAL_OPTS.map(g => (
                    <div
                      key={g.key}
                      className={`goal-card ${form.goalType === g.key ? g.cls : ''}`}
                      onClick={() => update('goalType', g.key)}
                    >
                      <span style={{ fontSize: 22 }}>{g.emoji}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, textAlign: 'center',
                        color: form.goalType === g.key
                          ? g.key === 'weight_loss' ? '#FF6B6B' : g.key === 'muscle_gain' ? '#4A90D9' : '#4CAF82'
                          : '#bbb',
                      }}>{g.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Dietary prefs */}
            <div style={{ marginBottom: 16 }}>
              <div className="section-label" style={{ marginBottom: 8 }}>Dietary Preferences</div>
              <div className="app-card">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {DIET_OPTS.map(d => {
                    const active = form.dietaryFlags.includes(d.key);
                    return (
                      <button key={d.key} onClick={() => toggleDiet(d.key)} style={{
                        borderRadius: 12, padding: '8px 12px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        border: `2px solid ${active ? '#4CAF82' : '#eee'}`,
                        background: active ? 'rgba(76,175,130,.08)' : '#fafafa',
                        cursor: 'pointer', transition: 'all .2s', minWidth: 70,
                      }}>
                        <span style={{ fontSize: 20 }}>{d.emoji}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: active ? '#4CAF82' : '#bbb' }}>
                          {d.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Macro tip */}
            <div style={{
              background: '#EBF3FD', borderRadius: 14, padding: '12px 14px',
              display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 16,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
              <span style={{ fontSize: 12, color: '#5A7FA8', lineHeight: 1.6 }}>
                A common starting point: <strong>40% carbs / 30% protein / 30% fat</strong>.
                Adjust based on your goal and how your body responds.
              </span>
            </div>

            <button onClick={save} className="btn-primary" style={{ width: '100%', padding: '14px 0', fontSize: 15 }}>
              {saved ? '✅ Saved!' : 'Save Changes'}
            </button>
          </>
        )}

        {/* ══ WEARABLES TAB ══ */}
        {tab === 'Wearables' && (
          <>
            <div style={{
              background: 'linear-gradient(135deg, rgba(76,175,130,.10), rgba(74,144,217,.10))',
              borderRadius: 18, padding: 16, marginBottom: 14,
              border: '1px solid rgba(76,175,130,.15)',
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>Connect Your Devices</div>
              <div style={{ fontSize: 13, color: '#666' }}>
                Sync activity, calories burned, steps, and heart rate automatically.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              {WEARABLES.map(w => (
                <div key={w.id} className="app-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 16,
                    background: w.color + '22', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 24, flexShrink: 0,
                  }}>{w.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{w.name}</div>
                    <div style={{ fontSize: 11, color: connected.has(w.id) ? '#4CAF82' : '#bbb', marginTop: 2 }}>
                      {connected.has(w.id) ? '● Connected — syncing data' : '○ Not connected'}
                    </div>
                  </div>
                  <button onClick={() => toggleWearable(w.id)} style={{
                    borderRadius: 12, padding: '7px 14px', fontSize: 12, fontWeight: 700,
                    border: `1px solid ${connected.has(w.id) ? '#FF6B6B40' : w.color + '40'}`,
                    background: connected.has(w.id) ? 'rgba(255,107,107,.12)' : w.color + '22',
                    color: connected.has(w.id) ? '#FF6B6B' : w.color,
                    cursor: 'pointer', transition: 'all .2s',
                  }}>
                    {connected.has(w.id) ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>

            {connected.size > 0 && (
              <div className="app-card">
                <div className="section-label" style={{ marginBottom: 10 }}>Last Synced Data</div>
                {[
                  { label: 'Steps today',        val: '8,420',   icon: '👟' },
                  { label: 'Active calories',    val: '312 kcal', icon: '🔥' },
                  { label: 'Resting heart rate', val: '62 bpm',   icon: '❤️' },
                  { label: 'Sleep last night',   val: '7h 14m',   icon: '😴' },
                ].map(s => (
                  <div key={s.label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 0', borderTop: '1px solid #f5f5f5',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{s.icon}</span>
                      <span style={{ fontSize: 13, color: '#666' }}>{s.label}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{s.val}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ══ TARGETS TAB ══ */}
        {tab === 'Targets' && (
          <>
            <div className="app-card" style={{ marginBottom: 14 }}>
              <div className="section-label" style={{ marginBottom: 14 }}>Daily Calorie &amp; Macro Targets</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 5 }}>Calories (kcal)</div>
                <input type="number" className="form-input" value={form.targetCalories}
                  onChange={e => update('targetCalories', Number(e.target.value))}/>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
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
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 5 }}>Water target (ml)</div>
                <input type="number" className="form-input" value={form.targetWater}
                  onChange={e => update('targetWater', Number(e.target.value))}/>
              </div>
            </div>

            <button onClick={save} className="btn-primary" style={{ width: '100%', padding: '14px 0', fontSize: 15, marginBottom: 14 }}>
              {saved ? '✅ Saved!' : 'Save Targets'}
            </button>
          </>
        )}

        {/* ── Account section (always visible) ── */}
        <div className="app-card">
          <div className="section-label" style={{ marginBottom: 12 }}>Account</div>
          <Link href="/provider" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', borderRadius: 14, background: '#f5f7fa',
            textDecoration: 'none', marginBottom: 8,
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>🏢 Partner / Provider Portal</span>
            <span style={{ color: '#aaa', fontSize: 18 }}>›</span>
          </Link>
          <button onClick={() => {
            if (confirm('Reset all app data?')) {
              store.updateProfile({ onboardingComplete: false });
              router.push('/onboarding');
            }
          }} style={{
            width: '100%', borderRadius: 14, padding: '12px 0', fontSize: 14, fontWeight: 600,
            background: 'rgba(255,107,107,.08)', color: '#FF6B6B',
            border: '1px solid rgba(255,107,107,.20)', cursor: 'pointer',
          }}>
            🔄 Reset App &amp; Start Over
          </button>
        </div>
      </div>
    </div>
  );
}
