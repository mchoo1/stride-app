'use client';
import { useState, useEffect } from 'react';
import { useStrideStore } from '@/lib/store';

// ── MET calorie burn estimates ────────────────────────────────────────────────
const ACTIVITIES = [
  { id: 'run',    emoji: '🏃', name: 'Running',        metMin: 10, color: '#E76F51' },
  { id: 'cycle',  emoji: '🚴', name: 'Cycling',        metMin: 8,  color: '#4A90D9' },
  { id: 'walk',   emoji: '🚶', name: 'Walking',        metMin: 4,  color: '#4CAF82' },
  { id: 'swim',   emoji: '🏊', name: 'Swimming',       metMin: 9,  color: '#457B9D' },
  { id: 'gym',    emoji: '🏋️', name: 'Gym / Weights',  metMin: 6,  color: '#7B5EA7' },
  { id: 'yoga',   emoji: '🧘', name: 'Yoga',           metMin: 3,  color: '#4CAF82' },
  { id: 'hiit',   emoji: '⚡', name: 'HIIT',           metMin: 12, color: '#F5A623' },
  { id: 'hike',   emoji: '🥾', name: 'Hiking',         metMin: 6,  color: '#8B5E3C' },
  { id: 'tennis', emoji: '🎾', name: 'Tennis',         metMin: 8,  color: '#E76F51' },
  { id: 'dance',  emoji: '💃', name: 'Dance / Zumba',  metMin: 7,  color: '#FF6B9D' },
  { id: 'sport',  emoji: '⚽', name: 'Team Sport',     metMin: 8,  color: '#4CAF82' },
  { id: 'other',  emoji: '🔥', name: 'Other',          metMin: 5,  color: '#888'    },
];

interface NearbyPlace {
  id: string;
  name: string;
  type: string;
  distance: string;
  hours: string;
  emoji: string;
  mapsUrl: string;
}

const MOCK_PLACES: NearbyPlace[] = [
  { id: 'p1', name: 'LA Fitness',           type: 'Gym',             distance: '0.4 mi', hours: 'Open 24h',       emoji: '🏋️', mapsUrl: 'https://maps.google.com/?q=LA+Fitness' },
  { id: 'p2', name: 'Central Park Trail',   type: 'Park / Trail',    distance: '0.2 mi', hours: 'Always open',    emoji: '🌳', mapsUrl: 'https://maps.google.com/?q=central+park' },
  { id: 'p3', name: 'Orange Theory Fitness',type: 'Fitness Studio',  distance: '0.7 mi', hours: 'Open 6am–9pm',   emoji: '⚡', mapsUrl: 'https://maps.google.com/?q=orangetheory' },
  { id: 'p4', name: 'Community Pool',       type: 'Swimming Pool',   distance: '1.1 mi', hours: 'Open 7am–8pm',   emoji: '🏊', mapsUrl: 'https://maps.google.com/?q=swimming+pool' },
  { id: 'p5', name: 'Riverside Bike Path',  type: 'Cycling Trail',   distance: '0.3 mi', hours: 'Always open',    emoji: '🚴', mapsUrl: 'https://maps.google.com/?q=bike+path' },
  { id: 'p6', name: 'CorePower Yoga',       type: 'Yoga Studio',     distance: '0.9 mi', hours: 'Open 6am–10pm',  emoji: '🧘', mapsUrl: 'https://maps.google.com/?q=corepower+yoga' },
];

export default function MovePage() {
  const store   = useStrideStore();
  const profile = store.profile;

  // Activity logger state
  const [selected, setSelected] = useState<typeof ACTIVITIES[0] | null>(null);
  const [minutes, setMinutes]   = useState('30');
  const [logged, setLogged]     = useState(false);

  // Calories to burn goal: tdee deficit
  const burned   = store.getTodayCaloriesBurned();
  const consumed = store.getTodayTotals().calories;
  const net      = consumed - burned;
  const target   = profile.targetCalories;
  const burnGoal = Math.max(0, net - target + 300); // suggest burning to reach a small deficit

  const [locMsg, setLocMsg] = useState('Finding activities near you…');
  useEffect(() => {
    const t = setTimeout(() => setLocMsg(''), 1600);
    return () => clearTimeout(t);
  }, []);

  // Estimate kcal burn: MET × weight(kg) × hours
  const estimateBurn = (activity: typeof ACTIVITIES[0], mins: number) => {
    return Math.round(activity.metMin * profile.currentWeight * (mins / 60));
  };

  const handleLog = () => {
    if (!selected) return;
    const mins = parseInt(minutes) || 30;
    const kcal = estimateBurn(selected, mins);
    store.addActivityEntry({
      name:           selected.name,
      emoji:          selected.emoji,
      durationMins:   mins,
      intensity:      kcal > 300 ? 'high' : kcal > 150 ? 'medium' : 'low',
      caloriesBurned: kcal,
      source:         'manual',
    });
    setLogged(true);
    setTimeout(() => { setLogged(false); setSelected(null); setMinutes('30'); }, 2000);
  };

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(160deg, #7B5EA7 0%, #4e3a72 100%)',
        padding: '44px 20px 24px',
      }}>
        <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 6 }}>Move 🏃</h1>
        {/* Burn goal banner */}
        <div style={{
          background: 'rgba(255,255,255,.18)', borderRadius: 14, padding: '10px 14px',
          display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 4,
        }}>
          <span style={{ fontSize: 18 }}>🔥</span>
          {burned > 0 ? (
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
              You&apos;ve burned <strong>{burned} kcal</strong> today
              {burnGoal > 0 && ` · burn ${burnGoal} more to hit your goal`}
            </span>
          ) : (
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
              Log an activity to start burning calories
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: '14px 14px 100px' }}>

        {/* ── Log Activity ── */}
        <div className="app-card" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e', marginBottom: 14 }}>
            Log an Activity
          </div>

          {/* Activity grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
            {ACTIVITIES.map(a => (
              <button key={a.id} onClick={() => setSelected(a)} style={{
                borderRadius: 14, padding: '10px 4px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                border: `2px solid ${selected?.id === a.id ? a.color : '#eee'}`,
                background: selected?.id === a.id ? a.color + '18' : '#fafafa',
                cursor: 'pointer', transition: 'all .15s',
              }}>
                <span style={{ fontSize: 20 }}>{a.emoji}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: selected?.id === a.id ? a.color : '#aaa', textAlign: 'center' }}>
                  {a.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>

          {/* Duration + preview */}
          {selected && (
            <div style={{ animation: 'fadeIn .2s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 5 }}>Duration (minutes)</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {[15, 30, 45, 60, 90].map(m => (
                      <button key={m} onClick={() => setMinutes(String(m))} style={{
                        borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 700,
                        border: 'none', cursor: 'pointer',
                        background: minutes === String(m) ? selected.color : '#eee',
                        color: minutes === String(m) ? '#fff' : '#888',
                        transition: 'all .15s',
                      }}>{m}m</button>
                    ))}
                    <input
                      type="number" min="1" max="300"
                      value={minutes} onChange={e => setMinutes(e.target.value)}
                      style={{
                        width: 60, borderRadius: 10, padding: '6px 10px',
                        border: '1.5px solid #ddd', fontSize: 12, fontWeight: 700,
                        textAlign: 'center', outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Burn estimate */}
              <div style={{
                background: selected.color + '12', borderRadius: 14,
                padding: '12px 14px', marginBottom: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>
                    {selected.emoji} {selected.name} · {minutes} min
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>
                    Estimated burn for {profile.currentWeight}kg
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: selected.color, lineHeight: 1 }}>
                    {estimateBurn(selected, parseInt(minutes) || 30)}
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>kcal</div>
                </div>
              </div>

              <button onClick={handleLog} className="btn-primary" style={{
                width: '100%', padding: '13px 0', fontSize: 14,
                background: logged ? '#4CAF82' : selected.color,
                border: 'none',
              }}>
                {logged ? '✅ Logged!' : `Log ${selected.name}`}
              </button>
            </div>
          )}

          {!selected && (
            <p style={{ fontSize: 13, color: '#ccc', textAlign: 'center', margin: '8px 0 0' }}>
              Pick an activity above to get started
            </p>
          )}
        </div>

        {/* ── Nearby Places ── */}
        <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e', marginBottom: 4 }}>
          Active Places Nearby
        </div>
        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 12 }}>
          {locMsg || 'Gyms, parks, trails and studios near you'}
        </div>

        {locMsg ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '3px solid #7B5EA7', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}/>
            <span style={{ fontSize: 13, color: '#aaa' }}>Finding places near you…</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {MOCK_PLACES.map(p => (
              <div key={p.id} style={{
                background: '#fff', borderRadius: 18, padding: '14px',
                boxShadow: '0 2px 8px rgba(0,0,0,.06)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                  background: 'linear-gradient(135deg, #f0ebf8, #e8e0f0)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26,
                }}>
                  {p.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
                    {p.type} · {p.distance}
                  </div>
                  <div style={{
                    display: 'inline-block', background: '#f0ebf8', borderRadius: 8,
                    padding: '2px 8px', fontSize: 11, fontWeight: 700, color: '#7B5EA7',
                  }}>
                    {p.hours}
                  </div>
                </div>
                <a href={p.mapsUrl} target="_blank" rel="noopener noreferrer" style={{
                  flexShrink: 0, background: '#7B5EA7', color: '#fff',
                  borderRadius: 12, padding: '8px 12px', fontSize: 12, fontWeight: 700,
                  textDecoration: 'none',
                }}>
                  Map →
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Setup note */}
        <div style={{
          background: '#EBF3FD', borderRadius: 14, padding: '12px 14px',
          display: 'flex', gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>💡</span>
          <span style={{ fontSize: 12, color: '#5A7FA8', lineHeight: 1.6 }}>
            Live location-based activity discovery requires a <strong>Google Places API key</strong> added to your Vercel environment variables as <code>GOOGLE_PLACES_API_KEY</code>.
          </span>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
