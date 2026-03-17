'use client';
import Link from 'next/link';
import { useStrideStore } from '@/lib/store';

/** Small SVG macro ring — matches demo exactly */
function MacroRing({
  val, goal, color, label,
}: {
  val: number; goal: number; color: string; label: string;
}) {
  const r = 30, circ = 2 * Math.PI * r;
  const pct = Math.min(val / Math.max(goal, 1), 1);
  const dash = pct * circ;
  const remain = Math.max(goal - val, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', width: 76, height: 76 }}>
        <svg width="76" height="76" viewBox="0 0 76 76" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="38" cy="38" r={r} fill="none" stroke="#f0f0f0" strokeWidth="6"/>
          <circle cx="38" cy="38" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray .5s' }}/>
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 15, fontWeight: 800, color, lineHeight: 1 }}>{val}</span>
          <span style={{ fontSize: 9, color: '#aaa' }}>g</span>
        </div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>{label}</span>
      <span style={{ fontSize: 10, color: '#bbb' }}>{remain}g left</span>
    </div>
  );
}

export default function DashboardPage() {
  const store   = useStrideStore();
  const profile = store.profile;
  const totals  = store.getTodayTotals();
  const burned  = store.getTodayCaloriesBurned();
  const water   = store.getTodayWater();
  const todayFood = store.getTodayFoodLog();
  const todayAct  = store.getTodayActivityLog();

  const consumed  = totals.calories;
  const net       = Math.max(0, consumed - burned);
  const remaining = Math.max(profile.targetCalories - net, 0);
  const calPct    = Math.min((net / Math.max(profile.targetCalories, 1)) * 100, 100);
  const over      = net > profile.targetCalories + 50;
  const waterPct  = Math.min((water / Math.max(profile.targetWater, 1)) * 100, 100);

  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="animate-fade-in">

      {/* ── Green gradient header ── */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Streak badge */}
            <div style={{
              background: 'rgba(255,255,255,.20)', borderRadius: 20,
              padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span style={{ fontSize: 14 }}>🔥</span>
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 800 }}>3d</span>
            </div>
            <Link href="/profile" style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>👤</Link>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 14px 100px' }}>

        {/* ── Calorie card (lifted, overlaps header) ── */}
        <div style={{
          background: '#fff', borderRadius: 24, marginTop: -14,
          padding: 18, boxShadow: '0 8px 24px rgba(0,0,0,.10)',
          marginBottom: 12,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>
            Daily Calories
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Consumed */}
            <div style={{ width: 68, textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e', lineHeight: 1 }}>{consumed}</div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>consumed</div>
            </div>
            {/* Bar */}
            <div style={{ flex: 1 }}>
              <div className="cal-bar-track">
                <div className="cal-bar-fill" style={{
                  width: `${calPct}%`,
                  background: over ? '#FF6B6B' : '#4CAF82',
                }}/>
              </div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 5, textAlign: 'center' }}>
                Goal: {profile.targetCalories} kcal
              </div>
            </div>
            {/* Remaining */}
            <div style={{ width: 68, textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: over ? '#FF6B6B' : '#4CAF82', lineHeight: 1 }}>
                {remaining}
              </div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>remaining</div>
            </div>
          </div>
          {/* Burned sub-row */}
          {burned > 0 && (
            <div style={{
              marginTop: 10, paddingTop: 10, borderTop: '1px solid #f5f5f5',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 13 }}>🔥</span>
              <span style={{ fontSize: 12, color: '#888' }}>
                <strong style={{ color: '#4CAF82' }}>{burned}</strong> kcal burned today
              </span>
            </div>
          )}
        </div>

        {/* ── Macro rings ── */}
        <div className="app-card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 14 }}>
            Macros Today
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <MacroRing val={totals.protein} goal={profile.targetProtein} color="#4A90D9" label="Protein"/>
            <MacroRing val={totals.carbs}   goal={profile.targetCarbs}   color="#F5A623" label="Carbs"/>
            <MacroRing val={totals.fat}     goal={profile.targetFat}     color="#4CAF82" label="Fat"/>
          </div>
        </div>

        {/* ── Quick actions ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <Link href="/log/food" className="qa-card qa-green" style={{ textDecoration: 'none' }}>
            <div className="qa-icon">🍽️</div>
            <div className="qa-label">Log Food</div>
          </Link>
          <Link href="/scan" className="qa-card qa-blue" style={{ textDecoration: 'none' }}>
            <div className="qa-icon">📷</div>
            <div className="qa-label">Scan Food</div>
          </Link>
          <Link href="/log/activity" className="qa-card qa-purple" style={{ textDecoration: 'none' }}>
            <div className="qa-icon">🏃</div>
            <div className="qa-label">Activity</div>
          </Link>
        </div>

        {/* ── Water tracker ── */}
        <div className="app-card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>Water 💧</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#4A90D9' }}>{water} ml</span>
          </div>
          <div className="cal-bar-track" style={{ marginBottom: 10 }}>
            <div className="cal-bar-fill" style={{ width: `${waterPct}%`, background: '#4A90D9' }}/>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[150, 250, 500].map(ml => (
              <button key={ml} onClick={() => store.addWater(ml)} style={{
                flex: 1, borderRadius: 10, padding: '7px 0',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                background: 'rgba(74,144,217,.10)', color: '#4A90D9', border: 'none',
              }}>+{ml}ml</button>
            ))}
          </div>
        </div>

        {/* ── Today's Food log preview ── */}
        <div className="app-card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>Today&apos;s Food</div>
            <Link href="/log/food" style={{ fontSize: 13, color: '#4CAF82', fontWeight: 600, textDecoration: 'none' }}>
              See all →
            </Link>
          </div>
          {todayFood.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#ccc' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🍴</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#bbb' }}>No meals logged yet</div>
              <div style={{ fontSize: 12, color: '#ccc', marginTop: 4 }}>Tap &quot;Log Food&quot; to get started</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {todayFood.slice(-4).map(e => (
                <div key={e.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 0', borderTop: '1px solid #f5f5f5',
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#4CAF82', flexShrink: 0,
                  }}/>
                  <span style={{ flex: 1, fontSize: 14, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.name}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#888' }}>{e.calories} kcal</span>
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
              <Link href="/log/activity" style={{ fontSize: 13, color: '#4CAF82', fontWeight: 600, textDecoration: 'none' }}>
                See all →
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

        {/* ── More options row ── */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/recommendations" className="qa-card qa-orange" style={{ textDecoration: 'none', flexDirection: 'row', justifyContent: 'flex-start', gap: 10 }}>
            <div className="qa-icon" style={{ width: 38, height: 38, borderRadius: 12, fontSize: 18 }}>🍜</div>
            <div>
              <div className="qa-label">Meal Ideas</div>
              <div style={{ fontSize: 11, color: '#bbb', marginTop: 1 }}>Match my macros</div>
            </div>
          </Link>
          <Link href="/community" className="qa-card qa-green" style={{ textDecoration: 'none', flexDirection: 'row', justifyContent: 'flex-start', gap: 10 }}>
            <div className="qa-icon" style={{ width: 38, height: 38, borderRadius: 12, fontSize: 18 }}>🌐</div>
            <div>
              <div className="qa-label">Community</div>
              <div style={{ fontSize: 11, color: '#bbb', marginTop: 1 }}>What&apos;s trending</div>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}
