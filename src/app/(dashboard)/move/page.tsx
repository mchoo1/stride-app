'use client';
import { useState, useEffect, useCallback } from 'react';
import { useStrideStore } from '@/lib/store';

/* ── Design tokens ── */
const BG     = '#F7F8FB';
const CARD   = '#FFFFFF';
const BORDER = '#E5E9F2';
const FG1    = '#0F1B2D';
const FG2    = '#5B6576';
const FG3    = '#8B95A7';
const GREEN  = '#1E7F5C';
const SHADOW = '0 1px 2px rgba(15,27,45,0.04), 0 2px 6px rgba(15,27,45,0.05)';

interface NearbyPlace {
  id: string; name: string; type: string; distance: string;
  rating: number | null; hours: string; emoji: string; mapsUrl: string;
}

/* ── Place category classifier ── */
type PlaceCategory = 'Gym' | 'Fitness Corner' | 'Yoga Studio' | 'Running Track' | 'Pool' | 'Sports Court' | 'Martial Arts' | 'Park' | 'Other';

const PLACE_CATEGORY_CFG: { label: PlaceCategory; emoji: string; keywords: string[] }[] = [
  { label: 'Gym',            emoji: '🏋️', keywords: ['gym', 'fitness center', 'fitness club', 'weight', 'anytime fitness', 'pure fitness', 'planet fitness', 'crossfit', 'f45', 'gold\'s'] },
  { label: 'Fitness Corner', emoji: '🏃', keywords: ['fitness corner', 'outdoor fitness', 'exercise area', 'fitness station', 'exercise station'] },
  { label: 'Yoga Studio',    emoji: '🧘', keywords: ['yoga', 'pilates', 'barre', 'stretch', 'mindful', 'zen'] },
  { label: 'Running Track',  emoji: '👟', keywords: ['track', 'park connector', 'jogging', 'running track', 'athletics'] },
  { label: 'Pool',           emoji: '🏊', keywords: ['pool', 'swim', 'aquatic', 'water sport'] },
  { label: 'Sports Court',   emoji: '⚽', keywords: ['stadium', 'sports club', 'court', 'field', 'sepaktakraw', 'badminton', 'tennis', 'basketball', 'soccer', 'football', 'netball', 'volleyball', 'squash', 'handball', 'hockey', 'cricket', 'bowling'] },
  { label: 'Martial Arts',   emoji: '🥊', keywords: ['boxing', 'martial arts', 'judo', 'karate', 'taekwondo', 'muay thai', 'bjj', 'mma', 'kickboxing', 'wushu', 'silat'] },
  { label: 'Park',           emoji: '🌳', keywords: ['park', 'garden', 'nature', 'reserve', 'beach', 'hill', 'forest', 'trail', 'reservoir', 'hiking', 'green'] },
];

function classifyPlace(place: NearbyPlace): PlaceCategory {
  const haystack = (place.name + ' ' + place.type).toLowerCase();
  for (const cfg of PLACE_CATEGORY_CFG) {
    if (cfg.keywords.some(kw => haystack.includes(kw))) return cfg.label;
  }
  return 'Other';
}

const ALL_CATEGORY_EMOJIS: Record<PlaceCategory, string> = Object.fromEntries(
  PLACE_CATEGORY_CFG.map(c => [c.label, c.emoji])
) as Record<PlaceCategory, string>;

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

  const [places,        setPlaces]        = useState<NearbyPlace[]>([]);
  const [locState,      setLocState]      = useState<'locating' | 'fetching' | 'done' | 'error' | 'no_key'>('locating');
  const [locError,      setLocError]      = useState('');
  const [showAllPlaces, setShowAllPlaces] = useState(false);
  const [placeSearch,   setPlaceSearch]   = useState('');
  const [activeCategory, setActiveCategory] = useState<PlaceCategory | 'All'>('All');

  const PLACES_LIMIT = 5;

  // Derive available categories from actual places data
  const availableCategories = places.length > 0
    ? (['All', ...Array.from(new Set(places.map(classifyPlace))).sort()] as (PlaceCategory | 'All')[])
    : [];

  // Apply search + category filter, then limit
  const filteredPlaces = places.filter(p => {
    const matchesSearch   = !placeSearch || p.name.toLowerCase().includes(placeSearch.toLowerCase()) || p.type.toLowerCase().includes(placeSearch.toLowerCase());
    const matchesCategory = activeCategory === 'All' || classifyPlace(p) === activeCategory;
    return matchesSearch && matchesCategory;
  });

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
      err => { setLocError(`Location access denied: ${err.message}`); setLocState('error'); },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }, [fetchPlaces]);

  const effectiveDuration  = customDuration ? Number(customDuration) : duration;
  const displayName        = selectedAct
    ? (selectedAct.id === 'other' && activityType ? activityType : selectedAct.name)
    : '';
  const autoBurnEstimate   = selectedAct
    ? Math.round(selectedAct.met * weight * (effectiveDuration / 60) * gFactor)
    : 0;
  const burnEstimate       = customCalories ? Number(customCalories) : autoBurnEstimate;

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
    width: '100%', background: BG,
    border: `1.5px solid ${BORDER}`, borderRadius: 12,
    padding: '11px 14px', fontSize: 15, color: FG1,
    outline: 'none', fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div style={{ padding: '52px 20px 8px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: FG3, textTransform: 'uppercase', margin: '0 0 4px' }}>
          STAY ACTIVE
        </p>
        <h1 style={{
          color: FG1, fontSize: 40, lineHeight: 1, margin: '0 0 10px',
          fontFamily: "'Anton', Impact, sans-serif",
        }}>
          MOVE
        </h1>
        <div style={{
          background: burned > 0 ? 'rgba(30,127,92,0.08)' : 'rgba(242,169,59,0.08)',
          borderRadius: 14, padding: '10px 14px',
          display: 'inline-flex', alignItems: 'center', gap: 8,
          border: `1px solid ${burned > 0 ? 'rgba(30,127,92,0.20)' : 'rgba(242,169,59,0.20)'}`,
        }}>
          <span style={{ fontSize: 16 }}>🔥</span>
          <span style={{ color: burned > 0 ? GREEN : '#C98A2E', fontSize: 14, fontWeight: 700 }}>
            {burned > 0 ? `${burned} kcal burned today` : 'Log an activity to start burning'}
          </span>
        </div>
      </div>

      <div style={{ padding: '0 16px 100px' }}>

        {/* ── Nearby Places ── */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 2 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: FG1 }}>Active Places Nearby</div>
          <div style={{ fontSize: 12, color: FG3 }}>
            {locState === 'done'
              ? `${filteredPlaces.length}${activeCategory !== 'All' || placeSearch ? ` of ${places.length}` : ''} found`
              : locState === 'locating' ? 'Locating…'
              : locState === 'fetching' ? 'Loading…'
              : ''}
          </div>
        </div>
        {locState !== 'done' && (
          <div style={{ fontSize: 13, color: FG3, marginBottom: 14 }}>
            {locState === 'locating' ? 'Getting your location…'
              : locState === 'fetching' ? 'Finding gyms, parks and studios…'
              : 'Gyms, parks, trails and studios near you'}
          </div>
        )}

        {/* Loading */}
        {(locState === 'locating' || locState === 'fetching') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', marginBottom: 16 }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              border: `2.5px solid ${BORDER}`, borderTopColor: GREEN,
              animation: 'spin 1s linear infinite',
            }} />
            <span style={{ fontSize: 13, color: FG3 }}>
              {locState === 'locating' ? 'Getting your location…' : 'Finding places near you…'}
            </span>
          </div>
        )}

        {/* Error */}
        {locState === 'error' && (
          <div style={{
            background: 'rgba(208,78,54,0.06)', border: '1px solid rgba(208,78,54,0.18)',
            borderRadius: 14, padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 8,
          }}>
            <span>⚠️</span>
            <span style={{ fontSize: 12, color: '#D04E36', lineHeight: 1.6 }}>{locError}</span>
          </div>
        )}

        {/* No API key */}
        {locState === 'no_key' && (
          <div style={{
            background: 'rgba(46,111,184,0.06)', borderRadius: 14, padding: '12px 14px', marginBottom: 16,
            display: 'flex', gap: 8, border: '1px solid rgba(46,111,184,0.15)',
          }}>
            <span style={{ fontSize: 14 }}>💡</span>
            <span style={{ fontSize: 12, color: '#2E6FB8', lineHeight: 1.6 }}>
              Add <code style={{ background: BORDER, borderRadius: 4, padding: '1px 5px', color: FG1 }}>GOOGLE_PLACES_API_KEY</code> to your environment to show real gyms, parks and studios near you.
            </span>
          </div>
        )}

        {/* Search + category filter (only when places loaded) */}
        {locState === 'done' && places.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {/* Search bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 12,
              padding: '8px 12px', marginBottom: 10, boxShadow: SHADOW,
            }}>
              <span style={{ fontSize: 14, color: FG3 }}>🔍</span>
              <input
                type="text"
                placeholder="Search by name or type…"
                value={placeSearch}
                onChange={e => { setPlaceSearch(e.target.value); setShowAllPlaces(false); }}
                style={{
                  flex: 1, border: 'none', outline: 'none', background: 'none',
                  fontSize: 14, color: FG1, fontFamily: 'inherit',
                }}
              />
              {placeSearch && (
                <button onClick={() => setPlaceSearch('')} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 14, color: FG3, padding: 0, lineHeight: 1,
                }}>✕</button>
              )}
            </div>

            {/* Category chips */}
            {availableCategories.length > 1 && (
              <div style={{
                display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4,
                scrollbarWidth: 'none',
              }}>
                {availableCategories.map(cat => {
                  const isActive = activeCategory === cat;
                  const catEmoji = cat === 'All' ? '📍' : (ALL_CATEGORY_EMOJIS[cat as PlaceCategory] ?? '📍');
                  return (
                    <button
                      key={cat}
                      onClick={() => { setActiveCategory(cat); setShowAllPlaces(false); }}
                      style={{
                        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                        padding: '6px 12px', borderRadius: 20, border: 'none',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                        background: isActive ? GREEN : CARD,
                        color:      isActive ? '#fff' : FG2,
                        boxShadow:  isActive ? '0 2px 8px rgba(30,127,92,0.25)' : SHADOW,
                        transition: 'all .15s',
                      }}
                    >
                      <span>{catEmoji}</span>
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Places list */}
        {locState === 'done' && places.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            {filteredPlaces.length === 0 ? (
              <div style={{
                background: CARD, borderRadius: 14, padding: '20px 16px',
                textAlign: 'center', border: `1px solid ${BORDER}`, marginBottom: 8,
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: FG2 }}>No places match</div>
                <div style={{ fontSize: 12, color: FG3, marginTop: 4 }}>Try a different search or category</div>
                {(placeSearch || activeCategory !== 'All') && (
                  <button onClick={() => { setPlaceSearch(''); setActiveCategory('All'); }} style={{
                    marginTop: 10, padding: '6px 14px', borderRadius: 10,
                    background: BG, border: `1px solid ${BORDER}`, fontSize: 12,
                    fontWeight: 600, color: FG2, cursor: 'pointer',
                  }}>Clear filters</button>
                )}
              </div>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(showAllPlaces ? filteredPlaces : filteredPlaces.slice(0, PLACES_LIMIT)).map(p => {
                const cat      = classifyPlace(p);
                const catEmoji = ALL_CATEGORY_EMOJIS[cat] ?? '📍';
                return (
                <div key={p.id} style={{
                  background: CARD, borderRadius: 14, padding: '10px 12px',
                  border: `1px solid ${BORDER}`, boxShadow: SHADOW,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  {/* Icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: 'rgba(30,127,92,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  }}>
                    {p.emoji}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: FG1, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                      {/* Category badge */}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        background: 'rgba(30,127,92,0.08)', border: '1px solid rgba(30,127,92,0.18)',
                        borderRadius: 6, padding: '1px 6px', fontSize: 10, fontWeight: 700, color: GREEN,
                      }}>
                        {catEmoji} {cat}
                      </span>
                      <span style={{ fontSize: 10, color: FG3 }}>{p.distance}</span>
                      {p.rating && <span style={{ fontSize: 10, color: FG3 }}>· ⭐ {p.rating.toFixed(1)}</span>}
                      <span style={{
                        background: p.hours === 'Open now' ? 'rgba(30,127,92,0.07)' : 'rgba(139,149,167,0.10)',
                        borderRadius: 6, padding: '1px 6px', fontSize: 10, fontWeight: 700,
                        color: p.hours === 'Open now' ? GREEN : FG3,
                      }}>{p.hours}</span>
                    </div>
                  </div>

                  {/* Map button */}
                  <a href={p.mapsUrl} target="_blank" rel="noopener noreferrer" style={{
                    flexShrink: 0, background: GREEN, color: '#fff',
                    borderRadius: 10, padding: '6px 12px', fontSize: 11, fontWeight: 700,
                    textDecoration: 'none', boxShadow: '0 2px 6px rgba(30,127,92,0.20)',
                    whiteSpace: 'nowrap',
                  }}>Map →</a>
                </div>
                );
              })}
            </div>
            )}
            {filteredPlaces.length > PLACES_LIMIT && (
              <button onClick={() => setShowAllPlaces(v => !v)} style={{
                width: '100%', marginTop: 8, padding: '9px 0',
                background: CARD, border: `1px solid ${BORDER}`,
                borderRadius: 12, fontSize: 13, fontWeight: 600, color: FG2,
                cursor: 'pointer', boxShadow: SHADOW,
              }}>
                {showAllPlaces
                  ? 'Show fewer ▲'
                  : `Show all ${filteredPlaces.length} ▼`}
              </button>
            )}
          </div>
        )}

        {/* ── Activity list ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: FG1 }}>Log an Activity</span>
          <span style={{ fontSize: 12, color: FG3 }}>{ACTIVITY_LIST.length} activities</span>
        </div>

        <div style={{
          maxHeight: 320, overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 6,
          paddingRight: 2,
          scrollbarWidth: 'thin',
          scrollbarColor: `${BORDER} transparent`,
        }}>
          {ACTIVITY_LIST.map(a => {
            const isSel     = selectedAct?.id === a.id;
            const kcalMin   = Math.round(a.met * weight / 60);
            const intensity = a.met >= 9   ? { label: 'High',   dot: '#D04E36', bg: 'rgba(208,78,54,0.10)',  text: '#D04E36' }
                            : a.met >= 5.5 ? { label: 'Medium', dot: '#C98A2E', bg: 'rgba(201,138,46,0.10)', text: '#C98A2E' }
                            :                { label: 'Low',    dot: GREEN,     bg: 'rgba(30,127,92,0.10)',  text: GREEN     };
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
                    background: isSel ? 'rgba(30,127,92,0.05)' : CARD,
                    border: `1px solid ${isSel ? 'rgba(30,127,92,0.30)' : BORDER}`,
                    borderRadius: isSel ? '16px 16px 0 0' : 16,
                    transition: 'all .15s',
                  }}
                >
                  <div style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, background: intensity.dot }} />
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{a.emoji}</span>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: isSel ? FG1 : FG2 }}>
                    {a.name}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                    background: intensity.bg, color: intensity.text, flexShrink: 0,
                  }}>
                    {intensity.label}
                  </span>
                  <span style={{ fontSize: 11, color: FG3, flexShrink: 0, minWidth: 70, textAlign: 'right' }}>
                    ~{kcalMin} kcal/min
                  </span>
                  <span style={{ fontSize: 11, color: isSel ? GREEN : FG3, flexShrink: 0 }}>
                    {isSel ? '▲' : '▼'}
                  </span>
                </button>

                {/* Expanded panel */}
                {isSel && (
                  <div style={{
                    background: CARD,
                    border: `1px solid rgba(30,127,92,0.25)`, borderTop: 'none',
                    borderRadius: '0 0 16px 16px', padding: '16px 14px',
                    display: 'flex', flexDirection: 'column', gap: 12,
                  }}>
                    {/* Distance */}
                    {a.hasDistance && (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: FG2, marginBottom: 7 }}>
                          Distance (km) <span style={{ fontWeight: 400, color: FG3 }}>— optional</span>
                        </div>
                        <input style={inputStyle} type="number" min="0" step="0.1"
                          placeholder="e.g. 5.2" value={distance}
                          onChange={e => setDistance(e.target.value)} />
                      </div>
                    )}
                    {/* Activity type for Other */}
                    {a.id === 'other' && (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: FG2, marginBottom: 7 }}>Activity type</div>
                        <input style={inputStyle}
                          placeholder="e.g. Frisbee, Archery, Skateboarding…"
                          value={activityType} onChange={e => setActivityType(e.target.value)} />
                      </div>
                    )}
                    {/* Duration */}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: FG2, marginBottom: 7 }}>Duration (min)</div>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                        {DURATION_PRESETS.map(d => (
                          <button key={d} onClick={() => { setDuration(d); setCustomDuration(''); }} style={{
                            flex: 1, padding: '9px 0', borderRadius: 10, cursor: 'pointer',
                            fontSize: 12, fontWeight: 700,
                            background: duration === d && !customDuration ? 'rgba(30,127,92,0.10)' : BG,
                            color:      duration === d && !customDuration ? GREEN : FG3,
                            border: `1px solid ${duration === d && !customDuration ? 'rgba(30,127,92,0.30)' : BORDER}`,
                            transition: 'all .15s',
                          }}>{d}</button>
                        ))}
                      </div>
                      <input style={inputStyle} type="number" min="1" max="600"
                        placeholder="Custom minutes…" value={customDuration}
                        onChange={e => setCustomDuration(e.target.value)} />
                    </div>

                    {/* Preview card */}
                    <div style={{
                      background: BG, borderRadius: 14, padding: '12px 14px',
                      display: 'flex', alignItems: 'center', border: `1px solid ${BORDER}`,
                    }}>
                      <span style={{ fontSize: 30, marginRight: 12 }}>{a.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: FG1 }}>{displayName}</div>
                        <div style={{ fontSize: 11, color: FG3, marginTop: 2 }}>
                          {effectiveDuration} min · {weight} kg{distance ? ` · ${distance} km` : ''}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 30, fontWeight: 900, color: GREEN, lineHeight: 1, fontFamily: "'Anton', Impact, sans-serif" }}>
                          {autoBurnEstimate}
                        </div>
                        <div style={{ fontSize: 10, color: FG3 }}>kcal</div>
                      </div>
                    </div>

                    {/* Override calories */}
                    <input style={inputStyle} type="number" min="0"
                      placeholder={`Override calories (est. ${autoBurnEstimate} kcal)`}
                      value={customCalories} onChange={e => setCustomCalories(e.target.value)} />
                    {customCalories && (
                      <button onClick={() => setCustomCalories('')} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 11, color: FG3, padding: 0, marginTop: -6, textAlign: 'left',
                      }}>↩ Reset to auto-estimate ({autoBurnEstimate} kcal)</button>
                    )}

                    {/* Log button */}
                    <button onClick={handleLog} style={{
                      width: '100%', padding: '14px 0',
                      background: actLogged ? 'rgba(30,127,92,0.10)' : GREEN,
                      color: actLogged ? GREEN : '#fff',
                      border: 'none', borderRadius: 14,
                      fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all .2s',
                      boxShadow: actLogged ? 'none' : '0 4px 14px rgba(30,127,92,0.28)',
                    }}>
                      {actLogged ? '✓ Activity Logged!' : `Log ${displayName}`}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
