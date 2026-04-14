'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useStrideStore } from '@/lib/store';

export default function DashboardPage() {
  const store      = useStrideStore();
  const profile    = store.profile;
  const totals     = store.getTodayTotals();
  const burned     = store.getTodayCaloriesBurned();
  const todayFood  = store.getTodayFoodLog();
  const todayAct   = store.getTodayActivityLog();

  const [macrosOpen, setMacrosOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const consumed  = totals.calories;
  const net       = Math.max(0, consumed - burned);
  const remaining = Math.max(profile.targetCalories - net, 0);
  const over      = net > profile.targetCalories + 50;
  const calPct    = Math.min((net / Math.max(profile.targetCalories, 1)) * 100, 100);

  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  const handleDeleteFood = (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      store.removeFoodEntry(id);
      setDeletingId(null);
    }, 300);
  };

  return (
    <div className="animate-fade-in">

      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(160deg, #4CAF82 0%, #38a169 100%)',
        padding: '44px 20px 28px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ color: '#fff', fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>
              {greet}, {profile.name || 'Athlete'} 👋
            </div>
            <div style={{ color: 'rgba(255,255,255,.70)', fontSize: 13, marginTop: 3 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <Link href="/me" style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            textDecoration: 'none',
          }}>👤</Link>
        </div>
      </div>

      <div style={{ padding: '0 14px 100px' }}>

        {/* ── Net Calorie Hero Card ── */}
        <div style={{
          background: '#fff', borderRadius: 24, marginTop: -14,
          padding: 18, boxShadow: '0 8px 24px rgba(0,0,0,.10)', marginBottom: 12,
        }}>
          {/* Eaten / Burned / Net row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e' }}>{consumed}</div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>eaten</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>─</div>
              <div style={{ fontSize: 13, color: '#4CAF82', fontWeight: 700 }}>🔥 {burned}</div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>burned</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#888' }}>=</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: over ? '#FF6B6B' : '#1a1a2e', lineHeight: 1 }}>{net}</div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>net kcal</div>
            </div>
          </div>

          {/* Progress bar — tappable to show macros */}
          <button
            onClick={() => setMacrosOpen(o => !o)}
            style={{ width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{
              height: 12, borderRadius: 999, background: '#f0f0f0', overflow: 'hidden', position: 'relative',
            }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${calPct}%`,
                background: over ? 'linear-gradient(90deg,#FF6B6B,#ff4444)' : 'linear-gradient(90deg,#4CAF82,#38a169)',
                borderRadius: 999, transition: 'width .6s cubic-bezier(.4,0,.2,1)',
              }}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: '#aaa' }}>Goal: {profile.targetCalories} kcal</span>
              <span style={{ fontSize: 11, color: over ? '#FF6B6B' : '#4CAF82', fontWeight: 700 }}>
                {over ? `${net - profile.targetCalories} over` : `${remaining} left`}
                {' '}{macrosOpen ? '▲' : '▼'}
              </span>
            </div>
          </button>

          {/* Collapsible Macros */}
          {macrosOpen && (
            <div style={{
              marginTop: 14, paddingTop: 14, borderTop: '1px solid #f5f5f5',
              display: 'flex', justifyContent: 'space-around',
              animation: 'fadeIn .2s ease',
            }}>
              {[
                { label: 'Protein', val: totals.protein, goal: profile.targetProtein, color: '#4A90D9' },
                { label: 'Carbs',   val: totals.carbs,   goal: profile.targetCarbs,   color: '#F5A623' },
                { label: 'Fat',     val: totals.fat,     goal: profile.targetFat,     color: '#4CAF82' },
              ].map(m => {
                const pct = Math.min(m.val / Math.max(m.goal, 1), 1);
                const r = 24, circ = 2 * Math.PI * r;
                return (
                  <div key={m.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ position: 'relative', width: 60, height: 60 }}>
                      <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="30" cy="30" r={r} fill="none" stroke="#f0f0f0" strokeWidth="5"/>
                        <circle cx="30" cy="30" r={r} fill="none" stroke={m.color} strokeWidth="5"
                          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"/>
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: m.color }}>{m.val}g</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#555' }}>{m.label}</span>
                    <span style={{ fontSize: 10, color: '#bbb' }}>{Math.max(m.goal - m.val, 0)}g left</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Quick Actions ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <Link href="/log/food" className="qa-card qa-green" style={{ textDecoration: 'none' }}>
            <div className="qa-icon">🍽️</div>
            <div className="qa-label">Log Food</div>
          </Link>
          <Link href="/scan" className="qa-card qa-blue" style={{ textDecoration: 'none' }}>
            <div className="qa-icon">📷</div>
            <div className="qa-label">Scan Food</div>
          </Link>
          <Link href="/move" className="qa-card qa-purple" style={{ textDecoration: 'none' }}>
            <div className="qa-icon">🏃</div>
            <div className="qa-label">Log Activity</div>
          </Link>
        </div>

        {/* ── Today's Food ── */}
        <div className="app-card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>Today&apos;s Food</div>
            <Link href="/log/food" style={{ fontSize: 13, color: '#4CAF82', fontWeight: 600, textDecoration: 'none' }}>
              See all →
            </Link>
          </div>
          {todayFood.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🍴</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#bbb' }}>No meals logged yet</div>
              <div style={{ fontSize: 12, color: '#ccc', marginTop: 4 }}>Tap &quot;Log Food&quot; or &quot;Scan Food&quot; to start</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {todayFood.slice(-5).map(e => (
                <div key={e.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 6px', borderRadius: 10,
                  background: deletingId === e.id ? '#fff0f0' : 'transparent',
                  transition: 'background .3s, opacity .3s',
                  opacity: deletingId === e.id ? 0.4 : 1,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4CAF82', flexShrink: 0 }}/>
                  <span style={{ flex: 1, fontSize: 14, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.name}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#888', marginRight: 6 }}>{e.calories} kcal</span>
                  <button
                    onClick={() => handleDeleteFood(e.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#ddd', padding: '0 4px', lineHeight: 1 }}
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Today's Activity ── */}
        {todayAct.length > 0 && (
          <div className="app-card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>Today&apos;s Activity</div>
              <Link href="/move" style={{ fontSize: 13, color: '#4CAF82', fontWeight: 600, textDecoration: 'none' }}>
                Add more →
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {todayAct.map(e => (
                <div key={e.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 0', borderTop: '1px solid #f5f5f5',
                }}>
                  <span style={{ fontSize: 18 }}>{e.emoji}</span>
                  <span style={{ flex: 1, fontSize: 14, color: '#333' }}>{e.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#4CAF82' }}>-{e.caloriesBurned} kcal</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Discover more row ── */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/eat" style={{
            flex: 1, borderRadius: 18, padding: '14px 12px',
            background: 'linear-gradient(135deg, #fff8f0, #ffe8d6)',
            border: '1px solid rgba(231,111,81,.15)',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 26 }}>🍜</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>What to Eat</div>
              <div style={{ fontSize: 11, color: '#bbb', marginTop: 1 }}>Nearby + fits your budget</div>
            </div>
          </Link>
          <Link href="/move" style={{
            flex: 1, borderRadius: 18, padding: '14px 12px',
            background: 'linear-gradient(135deg, #f0f4ff, #e8eeff)',
            border: '1px solid rgba(107,81,231,.15)',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 26 }}>🏃</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Move</div>
              <div style={{ fontSize: 11, color: '#bbb', marginTop: 1 }}>Activities nearby</div>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}
