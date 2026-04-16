'use client';
import { useState, useEffect, useCallback } from 'react';
import { useStrideStore } from '@/lib/store';

interface NearbyPlace {
  id: string; name: string; type: string; distance: string;
  rating: number | null; hours: string; emoji: string; mapsUrl: string;
}

// ── Activity list (shared format with log page) ───────────────────────────────
const ACTIVITY_LIST = [
  { id: 'run',        name: 'Running',        emoji: '🏃', met: 9.8,  hasDistance: true  },
  { id: 'walk',       name: 'Walking',        emoji: '🚶', met: 3.5,  hasDistance: true  },
  { id: 'cycle',      name: 'Cycling',        emoji: '🚴', met: 7.5,  hasDistance: true  },
  { id: 'swim',       name: 'Swimming',       emoji: '🏊', met: 8.0,  hasDistance: true  },
  { id: 'hike',       name: 'Hiking',         emoji: '🥾', met: 6.0,  hasDistance: true  },
  { id: 'gym',        name: 'Weight Training',emoji: '🏋️', met: 5.0,  hasDistance: false },
  { id: 'hiit',       name: 'HIIT',           emoji: '⚡', met: 10.0, hasDistance: false },
  { id: 'yoga',       name: 'Yoga',           emoji: '🧘', met: 2.5,  hasDistance: false },
  { id: 'pilates',    name: 'Pilates',        emoji: '🤸', met: 3.0,  hasDistance: false },
  { id: 'boxing',     name: 'Boxing',         emoji: '🥊', met: 9.0,  hasDistance: false },
  { id: 'jumprope',   name: 'Jump Rope',      emoji: '🪢', met: 11.0, hasDistance: false },
  { id: 'elliptical', name: 'Elliptical',     emoji: '🔄', met: 5.0,  hasDistance: false },
  { id: 'rowing',     name: 'Rowing',         emoji: '🚣', met: 7.0,  hasDistance: false },
  { id: 'stair',      name: 'Stair Climbing', emoji: '🪜', met: 8.0,  hasDistance: false },
  { id: 'stretch',    name: 'Stretching',     emoji: '🙆', met: 2.3,  hasDistance: false },
  { id: 'tennis',     name: 'Tennis',         emoji: '🎾', met: 8.0,  hasDistance: false },
  { id: 'badminton',  name: 'Badminton',      emoji: '🏸', met: 5.5,  hasDistance: false },
  { id: 'squash',     name: 'Squash',         emoji: '🎾', met: 12.0, hasDistance: false },
  { id: 'soccer',     name: 'Soccer',         emoji: '⚽', met: 7.0,  hasDistance: false },
  { id: 'basketball', name: 'Basketball',     emoji: '🏀', met: 6.5,  hasDistance: false },
  { id: 'football',   name: 'Football',       emoji: '🏈', met: 8.0,  hasDistance: false },
  { id: 'rugby',      name: 'Rugby',          emoji: '🏉', met: 8.3,  hasDistance: false },
  { id: 'volleyball', name: 'Volleyball',     emoji: '🏐', met: 4.0,  hasDistance: false },
  { id: 'hockey',     name: 'Hockey',         emoji: '🏒', met: 8.0,  hasDistance: false },
  { id: 'cricket',    name: 'Cricket',        emoji: '🏏', met: 5.0,  hasDistance: false },
  { id: 'baseball',   name: 'Baseball',       emoji: '⚾', met: 5.0,  hasDistance: false },
  { id: 'netball',    name: 'Netball',        emoji: '🏐', met: 5.5,  hasDistance: false },
  { id: 'handball',   name: 'Handball',       emoji: '🤾', met: 8.0,  hasDistance: false },
  { id: 'dance',      name: 'Dancing',        emoji: '💃', met: 5.5,  hasDistance: false },
  { id: 'golf',       name: 'Golf',           emoji: '⛳', met: 4.5,  hasDistance: false },
  { id: 'surf',       name: 'Surfing',        emoji: '🏄', met: 6.0,  hasDistance: false },
  { id: 'climb',      name: 'Rock Climbing',  emoji: '🧗', met: 8.0,  hasDistance: false },
  { id: 'waterpolo',  name: 'Water Polo',     emoji: '🤽', met: 10.0, hasDistance: false },
  { id: 'other',      name: 'Other',          emoji: '🔥', met: 5.0,  hasDistance: false },
];

const DURATION_PRESETS = [15, 30, 45, 60, 90];
const GENDER_FACTOR: Record<string, number> = { male: 1.0, female: 0.90, other: 0.95 };




export default function MovePage() {
  const store   = useStrideStore();
  const profile = store.profile;
  const weight  = profile.currentWeight || 70;
  const gender  = profile.gender || 'male';
  const gFactor = GENDER_FACTOR[gender] ?? 1.0;

  const [selectedAct,    setSelectedAct]    = useState<typeof ACTIVITY_LIST[0] | null>(null);
  const [duration,       setDuration]       = useState(30);
  const [customDuration, setCustomDuration] = useState('');
  const [distance,       setDistance]       = useState('');
  const [activityType,   setActivityType]   = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [actLogged,      setActLogged]      = useState(false);

  // Location + nearby places state
  const [places,    setPlaces]    = useState<NearbyPlace[]>([]);
  const [locState,  setLocState]  = useState<'locating' | 'fetching' | 'done' | 'error' | 'no_key'>('locating');
  const [locError,  setLocError]  = useState('');

  const burned = store.getTodayCaloriesBurned();

  const fetchPlaces = useCallback(async (lat: number, lng: number) => {
    setLocState('fetching');
    try {
      const res  = await fetch(`/api/nearby-places?lat=${lat}&lng=${lng}&type=activity`);
      const data = await res.json();
      if (data.error) {
        if (res.status === 503) { setLocState('no_key'); return; }
        throw new Error(data.error);
      }
      setPlaces(data.places ?? []);
      setLocState('done');
    } catch (e) {
      setLocError(e instanceof Error ? e.message : 'Failed to load places');
      setLocState('error');
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocError('Geolocation not supported by your browser');
      setLocState('error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => fetchPlaces(pos.coords.latitude, pos.coords.longitude),
      err => {
        setLocError(`Location access denied: ${err.message}`);
        setLocState('error');
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }, [fetchPlaces]);

  const effectiveDuration = customDuration ? Number(customDuration) : duration;
  const displayName = selectedAct
    ? (selectedAct.id === 'other' && activityType ? activityType : selectedAct.name)
    : '';
  const autoBurnEstimate = selectedAct
    ? Math.round(selectedAct.met * weight * (effectiveDuration / 60) * gFactor)
    : 0;
  const burnEstimate = customCalories ? Number(customCalories) : autoBurnEstimate;

  const handleLog = () => {
    if (!selectedAct) return;
    const distNote = distance ? ` · ${distance} km` : '';
    store.addActivityEntry({
      name:           displayName + distNote,
      emoji:          selectedAct.emoji,
      durationMins:   effectiveDuration,
      caloriesBurned: burnEstimate,
      intensity:      burnEstimate > 300 ? 'high' : burnEstimate > 150 ? 'medium' : 'low',
      source:         'manual',
    });
    setActLogged(true);
    setTimeout(() => {
      setActLogged(false); setSelectedAct(null);
      setCustomCalories(''); setCustomDuration(''); setDistance(''); setActivityType('');
    }, 1600);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#FFFFFF',
    border: '1.5px solid #E0E0EC', borderRadius: 12,
    padding: '11px 14px', fontSize: 15, color: '#1A1A2E',
    outline: 'none', fontFamily: 'Inter, sans-serif',
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
          <span style={{ color: '#A78BFA', fontSize: 14, fontWeight: 700 }}>
            {burned > 0 ? `${burned} kcal burned today` : 'Log an activity to start burning'}
          </span>
        </div>
      </div>

      <div style={{ padding: '0 16px 100px' }}>

        {/* ── Activity list ── */}
        <div style={{ fontSize: 14, fontWeight: 800, color: '#F0F0F8', marginBottom: 12 }}>
          Log an Activity
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
          {ACTIVITY_LIST.map(a => {
            const isSel     = selectedAct?.id === a.id;
            const kcalMin   = Math.round(a.met * weight / 60);
            const intensity = a.met >= 9   ? { label: 'High',   dot: '#FF5A5A', badge: 'rgba(255,90,90,0.15)',   text: '#FF5A5A' }
                            : a.met >= 5.5 ? { label: 'Medium', dot: '#FFD166', badge: 'rgba(255,209,102,0.15)', text: '#FFD166' }
                            :                { label: 'Low',    dot: '#00E676', badge: 'rgba(0,230,118,0.15)',   text: '#00E676' };
            return (
              <div key={a.id}>
                {/* Row */}
                <button
                  onClick={() => {
                    setSelectedAct(isSel ? null : a);
                    setCustomCalories(''); setCustomDuration(''); setDistance(''); setActivityType('');
                  }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 14px', cursor: 'pointer', textAlign: 'left',
                    background: isSel ? 'rgba(167,139,250,0.08)' : '#161622',
                    border: `1px solid ${isSel ? 'rgba(167,139,250,0.30)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: isSel ? '16px 16px 0 0' : 16,
                    transition: 'all .15s',
                  }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: intensity.dot }}/>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: isSel ? '#F0F0F8' : '#C8C8E0' }}>
                    {a.name}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: intensity.badge, color: intensity.text, flexShrink: 0 }}>
                    {intensity.label}
                  </span>
                  <span style={{ fontSize: 11, color: '#6E6E90', flexShrink: 0, minWidth: 70, textAlign: 'right' }}>
                    ~{kcalMin} kcal/min
                  </span>
                  <span style={{ fontSize: 11, color: isSel ? '#A78BFA' : '#6E6E90', flexShrink: 0 }}>
                    {isSel ? '▲' : '▼'}
                  </span>
                </button>

                {/* Expanded panel */}
                {isSel && (
                  <div style={{
                    background: '#161622',
                    border: '1px solid rgba(167,139,250,0.30)', borderTop: 'none',
                    borderRadius: '0 0 16px 16px', padding: '16px 14px',
                    display: 'flex', flexDirection: 'column', gap: 12,
                  }}>
                    {/* Distance */}
                    {a.hasDistance && (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#A8A8C8', marginBottom: 7 }}>
                          Distance (km) <span style={{ fontWeight: 400, color: '#6E6E90' }}>— optional</span>
                        </div>
                        <input style={inputStyle} type="number" min="0" step="0.1"
                          placeholder="e.g. 5.2" value={distance}
                          onChange={e => setDistance(e.target.value)}/>
                      </div>
                    )}
                    {/* Activity type for Other */}
                    {a.id === 'other' && (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#A8A8C8', marginBottom: 7 }}>Activity type</div>
                        <input style={inputStyle}
                          placeholder="e.g. Frisbee, Archery, Skateboarding…"
                          value={activityType} onChange={e => setActivityType(e.target.value)}/>
                      </div>
                    )}
                    {/* Duration */}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#A8A8C8', marginBottom: 7 }}>Duration (min)</div>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                        {DURATION_PRESETS.map(d => (
                          <button key={d} onClick={() => { setDuration(d); setCustomDuration(''); }} style={{
                            flex: 1, padding: '9px 0', borderRadius: 10, border: 'none',
                            fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            background: duration === d && !customDuration ? 'rgba(167,139,250,0.18)' : '#1E1E2E',
                            color:      duration === d && !customDuration ? '#A78BFA' : '#6E6E90',
                            transition: 'all .15s',
                          }}>{d}</button>
                        ))}
                      </div>
                      <input style={inputStyle} type="number" min="1" max="600"
                        placeholder="Custom minutes…" value={customDuration}
                        onChange={e => setCustomDuration(e.target.value)}/>
                    </div>
                    {/* Preview */}
                    <div style={{
                      background: '#0C0C14', borderRadius: 14, padding: '12px 14px',
                      display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <span style={{ fontSize: 30, marginRight: 12 }}>{a.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#F0F0F8' }}>{displayName}</div>
                        <div style={{ fontSize: 11, color: '#6E6E90', marginTop: 2 }}>
                          {effectiveDuration} min · {weight} kg{distance ? ` · ${distance} km` : ''}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#A78BFA', lineHeight: 1 }}>{autoBurnEstimate}</div>
                        <div style={{ fontSize: 10, color: '#6E6E90' }}>kcal</div>
                      </div>
                    </div>
                    {/* Override */}
                    <input style={inputStyle} type="number" min="0"
                      placeholder={`Override calories (est. ${autoBurnEstimate} kcal)`}
                      value={customCalories} onChange={e => setCustomCalories(e.target.value)}/>
                    {customCalories && (
                      <button onClick={() => setCustomCalories('')} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 11, color: '#6E6E90', padding: 0, marginTop: -6,
                      }}>↩ Reset to auto-estimate ({autoBurnEstimate} kcal)</button>
                    )}
                    {/* Log button */}
                    <button onClick={handleLog} style={{
                      width: '100%', padding: '14px 0',
                      background: actLogged ? 'rgba(0,230,118,0.15)' : '#A78BFA',
                      color: actLogged ? '#00E676' : '#fff',
                      border: 'none', borderRadius: 14,
                      fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all .2s',
                      boxShadow: actLogged ? 'none' : '0 0 20px rgba(167,139,250,0.35)',
                    }}>
                      {actLogged ? '✓ Activity Logged!' : `Log ${displayName}`}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Nearby Places ── */}
        <div style={{ fontSize: 14, fontWeight: 800, color: '#F0F0F8', marginBottom: 4 }}>
          Active Places Nearby
        </div>
        <div style={{ fontSize: 12, color: '#6E6E90', marginBottom: 12 }}>
          {locState === 'done'
            ? `${places.length} places found near you`
            : locState === 'locating' ? 'Getting your location…'
            : locState === 'fetching' ? 'Finding gyms, parks and studios…'
            : 'Gyms, parks, trails and studios near you'}
        </div>

        {(locState === 'locating' || locState === 'fetching') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', marginBottom: 16 }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              border: '2.5px solid #A78BFA', borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
            }}/>
            <span style={{ fontSize: 13, color: '#6E6E90' }}>
              {locState === 'locating' ? 'Getting your location…' : 'Finding places near you…'}
            </span>
          </div>
        )}

        {locState === 'error' && (
          <div style={{
            background: 'rgba(255,90,90,0.08)', border: '1px solid rgba(255,90,90,0.20)',
            borderRadius: 14, padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 8,
          }}>
            <span>⚠️</span>
            <span style={{ fontSize: 12, color: '#FF5A5A', lineHeight: 1.6 }}>{locError}</span>
          </div>
        )}

        {locState === 'no_key' && (
          <div style={{
            background: 'rgba(74,158,255,0.06)', borderRadius: 14, padding: '12px 14px', marginBottom: 16,
            display: 'flex', gap: 8, border: '1px solid rgba(74,158,255,0.12)',
          }}>
            <span style={{ fontSize: 14 }}>💡</span>
            <span style={{ fontSize: 12, color: '#4A9EFF', lineHeight: 1.6 }}>
              Add <code style={{ background: '#1E1E2E', borderRadius: 4, padding: '1px 4px' }}>GOOGLE_PLACES_API_KEY</code> to your environment to show real gyms, parks and studios near you.
            </span>
          </div>
        )}

        {locState === 'done' && places.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {places.map(p => (
              <div key={p.id} style={{
                background: '#161622', borderRadius: 18, padding: '14px',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 16, flexShrink: 0,
                  background: 'rgba(167,139,250,0.10)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                }}>
                  {p.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F0F8', marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: '#6E6E90', marginBottom: 5 }}>
                    {p.type} · {p.distance}{p.rating ? ` · ⭐ ${p.rating.toFixed(1)}` : ''}
                  </div>
                  <div style={{
                    display: 'inline-block', background: 'rgba(167,139,250,0.12)',
                    borderRadius: 8, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: '#A78BFA',
                  }}>{p.hours}</div>
                </div>
                <a href={p.mapsUrl} target="_blank" rel="noopener noreferrer" style={{
                  flexShrink: 0, background: '#A78BFA', color: '#fff',
                  borderRadius: 12, padding: '8px 12px', fontSize: 12, fontWeight: 700,
                  textDecoration: 'none',
                }}>Map →</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
