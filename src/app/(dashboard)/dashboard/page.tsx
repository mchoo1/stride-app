'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useStrideStore } from '@/lib/store';

const R = 72;
const CIRC = 2 * Math.PI * R;

function CalorieRing({
  net, goal, consumed, burned,
}: { net: number; goal: number; consumed: number; burned: number }) {
  const pct    = Math.min(net / Math.max(goal, 1), 1);
  const over   = net > goal + 50;
  const color  = over ? '#FF5A5A' : '#00E676';
  const offset = CIRC * (1 - pct);
  const remaining = Math.max(goal - net, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: 200, height: 200 }}>
        <svg width="200" height="200" viewBox="0 0 200 200" style={{ animation: 'ringPop .5s ease' }}>
          {/* Track */}
          <circle cx="100" cy="100" r={R}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12"/>
          {/* Progress */}
          <circle cx="100" cy="100" r={R}
            fill="none" stroke={color} strokeWidth="12"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
            style={{
              transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1), stroke .4s',
              filter: `drop-shadow(0 0 8px ${color}80)`,
            }}
          />
          {/* Center: net kcal */}
          <text x="100" y="85" textAnchor="middle"
            fill="#F0F0F8" fontSize="38" fontWeight="900"
            fontFamily="Inter, sans-serif">{net}</text>
          <text x="100" y="104" textAnchor="middle"
            fill="#44445A" fontSize="11" fontWeight="600"
            fontFamily="Inter, sans-serif">NET KCAL</text>
          <text x="100" y="126" textAnchor="middle"
            fill={over ? '#FF5A5A' : '#00E676'} fontSize="14" fontWeight="800"
            fontFamily="Inter, sans-serif">
            {over ? `${net - goal} over` : `${remaining} left`}
          </text>
        </svg>
      </div>

      {/* Eaten / Burned row */}
      <div style={{ display: 'flex', gap: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#44445A', fontWeight: 600, marginBottom: 2 }}>EATEN</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#F0F0F8' }}>{consumed}</div>
        </div>
        <div style={{ width: 1, background: 'rgba(255,255,255,0.06)' }}/>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#44445A', fontWeight: 600, marginBottom: 2 }}>BURNED</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#FF6B35' }}>{burned}</div>
        </div>
        <div style={{ width: 1, background: 'rgba(255,255,255,0.06)' }}/>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#44445A', fontWeight: 600, marginBottom: 2 }}>GOAL</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#9090B0' }}>{goal}</div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const store      = useStrideStore();
  const profile    = store.profile;
  const totals     = store.getTodayTotals();
  const burned     = store.getTodayCaloriesBurned();
  const todayFood  = store.getTodayFoodLog();
  const todayAct   = store.getTodayActivityLog();
  const challenges = store.getDailyChallenges();
  const streak     = store.streak;

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const consumed = totals.calories;
  const net      = Math.max(0, consumed - burned);

  const h = new Date().getHours();
  const greet = h < 5 ? 'Night owl' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  const doneCount = challenges.filter(c => c.done).length;

  const handleDeleteFood = (id: string) => {
    setDeletingId(id);
    setTimeout(() => { store.removeFoodEntry(id); setDeletingId(null); }, 280);
  };

  return (
    <div style={{ background: '#0C0C14', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div style={{ padding: '52px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 13, color: '#44445A', fontWeight: 600, marginBottom: 2 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#F0F0F8', margin: 0 }}>
            {greet}{profile.name ? `, ${profile.name.split(' ')[0]}` : ''} 👋
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {streak > 0 && (
            <div className="streak-badge">
              🔥 {streak}d
            </div>
          )}
          <Link href="/me" style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            textDecoration: 'none', fontSize: 18,
          }}>👤</Link>
        </div>
      </div>

      <div style={{ padding: '16px 16px 100px' }}>

        {/* ── Calorie Ring ── */}
        <div style={{
          background: '#161622', borderRadius: 28, padding: '24px 20px 20px',
          border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        }}>
          <CalorieRing net={net} goal={profile.targetCalories} consumed={consumed} burned={burned} />

          {/* Quick log buttons */}
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <Link href="/log" style={{
              flex: 1, borderRadius: 16,
              background: 'rgba(0,230,118,0.10)', border: '1px solid rgba(0,230,118,0.20)',
              padding: '13px 0', textAlign: 'center', textDecoration: 'none',
              fontSize: 13, fontWeight: 800, color: '#00E676',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00E676" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Log Food
            </Link>
            <Link href="/log?tab=activity" style={{
              flex: 1, borderRadius: 16,
              background: 'rgba(255,107,53,0.10)', border: '1px solid rgba(255,107,53,0.20)',
              padding: '13px 0', textAlign: 'center', textDecoration: 'none',
              fontSize: 13, fontWeight: 800, color: '#FF6B35',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>
              Log Activity
            </Link>
          </div>
        </div>

        {/* ── Daily Challenges ── */}
        <div style={{
          background: '#161622', borderRadius: 22, padding: 16,
          border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#F0F0F8' }}>Daily Challenges</span>
            <span style={{
              fontSize: 12, fontWeight: 700, color: doneCount === 3 ? '#00E676' : '#9090B0',
              background: doneCount === 3 ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.06)',
              borderRadius: 20, padding: '3px 10px',
            }}>
              {doneCount}/3 done
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {challenges.map(ch => (
              <div key={ch.id} className={`challenge-card${ch.done ? ' done' : ''}`}>
                <span style={{ fontSize: 20 }}>{ch.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: ch.done ? '#00E676' : '#F0F0F8', marginBottom: 4 }}>
                    {ch.label}
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      width: `${Math.min((ch.current / ch.target) * 100, 100)}%`,
                      background: ch.done ? '#00E676' : '#9090B0',
                      transition: 'width .5s',
                    }}/>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {ch.done
                    ? <span style={{ fontSize: 18 }}>✅</span>
                    : <span style={{ fontSize: 11, color: '#44445A', fontWeight: 700 }}>+{ch.xp} XP</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Today's Food ── */}
        <div style={{
          background: '#161622', borderRadius: 22, padding: 16,
          border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#F0F0F8' }}>Today&apos;s Food</span>
            <Link href="/log" style={{ fontSize: 12, color: '#00E676', fontWeight: 700, textDecoration: 'none' }}>
              + Add
            </Link>
          </div>
          {todayFood.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🍽️</div>
              <div style={{ fontSize: 13, color: '#44445A', fontWeight: 600 }}>Nothing logged yet</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {todayFood.slice(-5).map(e => (
                <div key={e.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 6px', borderRadius: 10,
                  opacity: deletingId === e.id ? 0.3 : 1,
                  transform: deletingId === e.id ? 'translateX(-10px)' : 'none',
                  transition: 'opacity .28s, transform .28s',
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E676', flexShrink: 0 }}/>
                  <span style={{ flex: 1, fontSize: 14, color: '#F0F0F8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.name}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#9090B0' }}>{e.calories} kcal</span>
                  <button onClick={() => handleDeleteFood(e.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#44445A', fontSize: 15, padding: '0 4px', lineHeight: 1,
                  }}>✕</button>
                </div>
              ))}
              {todayFood.length > 5 && (
                <Link href="/log" style={{ fontSize: 12, color: '#44445A', textDecoration: 'none', textAlign: 'center', paddingTop: 6 }}>
                  +{todayFood.length - 5} more entries
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ── Today's Activity ── */}
        {todayAct.length > 0 && (
          <div style={{
            background: '#161622', borderRadius: 22, padding: 16,
            border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#F0F0F8' }}>Activity</span>
              <Link href="/log?tab=activity" style={{ fontSize: 12, color: '#FF6B35', fontWeight: 700, textDecoration: 'none' }}>
                + Add
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {todayAct.map(e => (
                <div key={e.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 4px',
                }}>
                  <span style={{ fontSize: 18 }}>{e.emoji}</span>
                  <span style={{ flex: 1, fontSize: 13, color: '#F0F0F8' }}>{e.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#FF6B35' }}>-{e.caloriesBurned} kcal</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Discover row ── */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/eat" style={{
            flex: 1, borderRadius: 20, padding: '16px 14px',
            background: '#161622', border: '1px solid rgba(255,107,53,0.15)',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 22 }}>🍜</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#F0F0F8' }}>What to Eat</div>
              <div style={{ fontSize: 11, color: '#44445A', marginTop: 2 }}>Fits your budget</div>
            </div>
          </Link>
          <Link href="/move" style={{
            flex: 1, borderRadius: 20, padding: '16px 14px',
            background: '#161622', border: '1px solid rgba(167,139,250,0.15)',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 22 }}>⚡</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#F0F0F8' }}>Move</div>
              <div style={{ fontSize: 11, color: '#44445A', marginTop: 2 }}>Nearby activities</div>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}
