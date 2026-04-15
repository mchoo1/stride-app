'use client';
import { useState, useEffect } from 'react';
import { useStrideStore } from '@/lib/store';

// ── Activity data ─────────────────────────────────────────────────────────────
const ACTIVITIES = [
  { id: 'run',    emoji: '🏃', name: 'Running',       metMin: 10 },
  { id: 'cycle',  emoji: '🚴', name: 'Cycling',       metMin: 8  },
  { id: 'walk',   emoji: '🚶', name: 'Walking',       metMin: 4  },
  { id: 'swim',   emoji: '🏊', name: 'Swimming',      metMin: 9  },
  { id: 'gym',    emoji: '🏋️', name: 'Gym / Weights', metMin: 6  },
  { id: 'yoga',   emoji: '🧘', name: 'Yoga',          metMin: 3  },
  { id: 'hiit',   emoji: '⚡', name: 'HIIT',          metMin: 12 },
  { id: 'hike',   emoji: '🥾', name: 'Hiking',        metMin: 6  },
  { id: 'tennis', emoji: '🎾', name: 'Tennis',        metMin: 8  },
  { id: 'dance',  emoji: '💃', name: 'Dance',         metMin: 7  },
  { id: 'sport',  emoji: '⚽', name: 'Team Sport',    metMin: 8  },
  { id: 'other',  emoji: '🔥', name: 'Other',         metMin: 5  },
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
  { id: 'p1', name: 'LA Fitness',            type: 'Gym',            distance: '0.4 mi', hours: 'Open 24h',      emoji: '🏋️', mapsUrl: 'https://maps.google.com/?q=LA+Fitness'    },
  { id: 'p2', name: 'Central Park Trail',    type: 'Park / Trail',   distance: '0.2 mi', hours: 'Always open',   emoji: '🌳', mapsUrl: 'https://maps.google.com/?q=central+park'  },
  { id: 'p3', name: 'Orange Theory Fitness', type: 'Fitness Studio', distance: '0.7 mi', hours: 'Open 6am–9pm',  emoji: '⚡', mapsUrl: 'https://maps.google.com/?q=orangetheory'  },
  { id: 'p4', name: 'Community Pool',        type: 'Swimming Pool',  distance: '1.1 mi', hours: 'Open 7am–8pm',  emoji: '🏊', mapsUrl: 'https://maps.google.com/?q=swimming+pool' },
  { id: 'p5', name: 'Riverside Bike Path',   type: 'Cycling Trail',  distance: '0.3 mi', hours: 'Always open',   emoji: '🚴', mapsUrl: 'https://maps.google.com/?q=bike+path'     },
  { id: 'p6', name: 'CorePower Yoga',        type: 'Yoga Studio',    distance: '0.9 mi', hours: 'Open 6am–10pm', emoji: '🧘', mapsUrl: 'https://maps.google.com/?q=corepower+yoga'},
];

const DURATION_PRESETS = [15, 30, 45, 60, 90];

export default function MovePage() {
  const store   = useStrideStore();
  const profile = store.profile;

  const [selected, setSelected] = useState<typeof ACTIVITIES[0] | null>(null);
  const [minutes,  setMinutes]  = useState('30');
  const [logged,   setLogged]   = useState(false);
  const [locMsg,   setLocMsg]   = useState('Finding activities near you…');

  const burned   = store.getTodayCaloriesBurned();
  const burnGoal = Math.max(0, (store.getTodayTotals().calories - burned) - profile.targetCalories + 300);

  useEffect(() => {
    const t = setTimeout(() => setLocMsg(''), 1600);
    return () => clearTimeout(t);
  }, []);

  const estimateBurn = (act: typeof ACTIVITIES[0], mins: number) =>
    Math.round(act.metMin * (profile.currentWeight || 70) * (mins / 60));

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

  const burnEstimate = selected ? estimateBurn(selected, parseInt(minutes) || 30) : 0;

  const cardStyle = {
    background: '#161622', borderRadius: 20, padding: 16,
    border: '1px solid rgba(255,255,255,0.06)',
  };

  return (
    <div style={{ background: '#0C0C14', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div style={{ padding: '52px 20px 20px' }}>
        <h1 style={{ color: '#F0F0F8', fontSize: 22, fontWeight: 900, margin: 0, marginBottom: 10 }}>
          Move ⚡
        </h1>
        <div style={{
          background: 'rgba(167,139,250,0.12)', borderRadius: 14, padding: '10px 14px',
          display: 'inline-flex', alignItems: 'center', gap: 8,
          border: '1px solid rgba(167,139,250,0.20)',
        }}>
          <span style={{ fontSize: 16 }}>🔥</span>
          {burned > 0 ? (
            <span style={{ color: '#A78BFA', fontSize: 14, fontWeight: 700 }}>
              {burned} kcal burned today
              {burnGoal > 0 && ` · ${burnGoal} more to hit goal`}
            </span>
          ) : (
            <span style={{ color: '#A78BFA', fontSize: 14, fontWeight: 700 }}>
              Log an activity to start burning
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: '0 16px 100px' }}>

        {/* ── Log Activity ── */}
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#F0F0F8', marginBottom: 14 }}>
            Log an Activity
          </div>

          {/* Activity grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
            {ACTIVITIES.map(a => (
              <button key={a.id} onClick={() => setSelected(a)} style={{
                borderRadius: 14, padding: '10px 4px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                border: `1px solid ${selected?.id === a.id ? 'rgba(167,139,250,0.40)' : 'rgba(255,255,255,0.06)'}`,
                background: selected?.id === a.id ? 'rgba(167,139,250,0.12)' : '#1E1E2E',
                cursor: 'pointer', transition: 'all .15s',
              }}>
                <span style={{ fontSize: 20 }}>{a.emoji}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: selected?.id === a.id ? '#A78BFA' : '#6E6E90', textAlign: 'center' }}>
                  {a.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>

          {!selected && (
            <p style={{ fontSize: 13, color: '#6E6E90', textAlign: 'center', margin: '4px 0 0' }}>
              Pick an activity above
            </p>
          )}

          {selected && (
            <div style={{ animation: 'fadeIn .2s ease' }}>
              {/* Duration presets */}
              <div style={{ fontSize: 12, fontWeight: 700, color: '#A8A8C8', marginBottom: 8 }}>Duration (min)</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {DURATION_PRESETS.map(m => (
                  <button key={m} onClick={() => setMinutes(String(m))} style={{
                    flex: 1, padding: '9px 0', borderRadius: 12, border: 'none',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    background: minutes === String(m) ? 'rgba(167,139,250,0.15)' : '#1E1E2E',
                    color:      minutes === String(m) ? '#A78BFA' : '#6E6E90',
                    transition: 'all .15s',
                  }}>{m}</button>
                ))}
              </div>
              <input
                type="number" min="1" max="300"
                value={minutes} onChange={e => setMinutes(e.target.value)}
                style={{
                  width: '100%', background: '#1E1E2E',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12, padding: '10px 14px',
                  fontSize: 14, color: '#F0F0F8', outline: 'none',
                  fontFamily: 'Inter, sans-serif', marginBottom: 12,
                }}
                placeholder="Custom minutes…"
              />

              {/* Burn estimate card */}
              <div style={{
                background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)',
                borderRadius: 16, padding: '14px', marginBottom: 12,
                display: 'flex', alignItems: 'center',
              }}>
                <span style={{ fontSize: 32, marginRight: 14 }}>{selected.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#F0F0F8' }}>{selected.name}</div>
                  <div style={{ fontSize: 12, color: '#6E6E90', marginTop: 2 }}>
                    {minutes} min · {profile.currentWeight || 70} kg
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 30, fontWeight: 900, color: '#A78BFA', lineHeight: 1 }}>{burnEstimate}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#6E6E90' }}>kcal</div>
                </div>
              </div>

              <button onClick={handleLog} style={{
                width: '100%', padding: '14px 0',
                background: logged ? 'rgba(0,230,118,0.15)' : '#A78BFA', color: logged ? '#00E676' : '#fff',
                border: 'none', borderRadius: 16,
                fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all .2s',
                boxShadow: logged ? 'none' : '0 0 24px rgba(167,139,250,0.30)',
              }}>
                {logged ? '✓ Activity Logged!' : `Log ${selected.name}`}
              </button>
            </div>
          )}
        </div>

        {/* ── Nearby Places ── */}
        <div style={{ fontSize: 14, fontWeight: 800, color: '#F0F0F8', marginBottom: 4 }}>
          Active Places Nearby
        </div>
        <div style={{ fontSize: 12, color: '#6E6E90', marginBottom: 12 }}>
          {locMsg || 'Gyms, parks, trails and studios near you'}
        </div>

        {locMsg ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              border: '2.5px solid #A78BFA', borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
            }}/>
            <span style={{ fontSize: 13, color: '#6E6E90' }}>Finding places near you…</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {MOCK_PLACES.map(p => (
              <div key={p.id} style={{
                background: '#161622', borderRadius: 18, padding: '14px',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 16, flexShrink: 0,
                  background: 'rgba(167,139,250,0.10)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24,
                }}>
                  {p.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F0F8', marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: '#6E6E90', marginBottom: 5 }}>
                    {p.type} · {p.distance}
                  </div>
                  <div style={{
                    display: 'inline-block', background: 'rgba(167,139,250,0.12)',
                    borderRadius: 8, padding: '2px 8px',
                    fontSize: 11, fontWeight: 700, color: '#A78BFA',
                  }}>
                    {p.hours}
                  </div>
                </div>
                <a href={p.mapsUrl} target="_blank" rel="noopener noreferrer" style={{
                  flexShrink: 0, background: '#A78BFA', color: '#fff',
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
          background: 'rgba(74,158,255,0.06)', borderRadius: 14, padding: '12px 14px',
          display: 'flex', gap: 8, border: '1px solid rgba(74,158,255,0.12)',
        }}>
          <span style={{ fontSize: 14 }}>💡</span>
          <span style={{ fontSize: 12, color: '#4A9EFF', lineHeight: 1.6 }}>
            Live location-based activity discovery requires a <strong>Google Places API key</strong> added as <code style={{ background: '#1E1E2E', borderRadius: 4, padding: '1px 4px' }}>GOOGLE_PLACES_API_KEY</code>.
          </span>
        </div>
      </div>
    </div>
  );
}
