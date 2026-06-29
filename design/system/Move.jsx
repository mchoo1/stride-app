// Move.jsx — map with category pins + activity logger.
function MoveScreen({ onTab }) {
  const [filter, setFilter] = React.useState('all');
  const filters = [
    { id: 'all',   label: 'All' },
    { id: 'gym',   label: 'Gyms' },
    { id: 'park',  label: 'Parks' },
    { id: 'trail', label: 'Trails' },
  ];
  const places = [
    { id: 1, type: 'park',  n: 'Fort Canning Park',     d: '420 m', x: 52, y: 30 },
    { id: 2, type: 'gym',   n: 'ActiveSG Tiong Bahru',  d: '1.2 km', x: 30, y: 58 },
    { id: 3, type: 'trail', n: 'Southern Ridges',       d: '2.3 km', x: 72, y: 66 },
    { id: 4, type: 'gym',   n: 'Anytime Fitness CBD',   d: '640 m', x: 60, y: 48 },
    { id: 5, type: 'park',  n: 'Pearl\u2019s Hill City Park', d: '900 m', x: 40, y: 38 },
  ];
  const typeColor = { park: S.green, gym: '#7A4BC2', trail: '#C98A2E' };
  const visible = places.filter(p => filter === 'all' || p.type === filter);

  return (
    <Screen activeTab="move" onTab={onTab}>
      <Header eyebrow="Move nearby" title="AROUND YOU"/>

      {/* Map */}
      <div style={{ padding: '0 20px 12px' }}>
        <div style={{
          height: 300, borderRadius: 20, overflow: 'hidden',
          border: `1px solid ${S.hairline}`, boxShadow: S.shCard,
          position: 'relative',
          background: '#EEF2F7',
        }}>
          {/* Fake map — grid + roads */}
          <svg width="100%" height="100%" viewBox="0 0 400 300" style={{ position: 'absolute', inset: 0 }}>
            <rect width="400" height="300" fill="#EEF2F7"/>
            {/* Park blobs */}
            <path d="M40 80 Q 90 60, 140 90 T 200 110 Q 170 150, 120 140 T 40 130 Z" fill="#DDE8DE"/>
            <path d="M260 180 Q 320 170, 360 200 T 390 260 L 340 280 Q 300 260, 260 240 Z" fill="#DDE8DE"/>
            {/* Roads */}
            <path d="M0 160 L 400 180" stroke="#fff" strokeWidth="8"/>
            <path d="M180 0 L 220 300" stroke="#fff" strokeWidth="8"/>
            <path d="M0 240 L 400 220" stroke="#fff" strokeWidth="5"/>
            <path d="M80 0 L 100 300" stroke="#fff" strokeWidth="5"/>
            <path d="M0 60 L 400 80" stroke="#fff" strokeWidth="4"/>
            {/* Water */}
            <path d="M0 280 Q 100 270, 200 285 T 400 280 L 400 300 L 0 300 Z" fill="#D6E3F0"/>
          </svg>

          {/* Pins */}
          {visible.map(p => (
            <div key={p.id} style={{
              position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
              transform: 'translate(-50%,-100%)',
            }}>
              <div style={{
                background: typeColor[p.type], color: '#fff',
                padding: '6px 10px', borderRadius: 14,
                fontSize: 11, fontWeight: 600,
                boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                whiteSpace: 'nowrap',
              }}>{p.n.split(' ')[0]}</div>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: typeColor[p.type], border: '2px solid #fff',
                margin: '2px auto 0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}/>
            </div>
          ))}

          {/* You */}
          <div style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%,-50%)',
          }}>
            <div style={{
              width: 16, height: 16, borderRadius: '50%',
              background: '#2E6FB8', border: '3px solid #fff',
              boxShadow: '0 0 0 6px rgba(46,111,184,.2)',
            }}/>
          </div>

          {/* Locate FAB */}
          <button style={{
            position: 'absolute', right: 12, bottom: 12,
            width: 40, height: 40, borderRadius: 12,
            background: S.card, border: `1px solid ${S.hairline}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: S.fg1, cursor: 'pointer', boxShadow: S.shRaised,
          }}><IconCrosshair/></button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: '0 20px', display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto' }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '8px 14px', borderRadius: 999, flexShrink: 0,
            border: `1px solid ${filter === f.id ? S.fg1 : S.hairline}`,
            background: filter === f.id ? S.fg1 : S.card,
            color: filter === f.id ? '#fff' : S.fg1,
            fontFamily: S.sans, fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>{f.label}</button>
        ))}
      </div>

      {/* List */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visible.map(p => (
          <Card key={p.id} pad={14}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12,
                            background: typeColor[p.type] + '22', color: typeColor[p.type],
                            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconPinMove/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: S.fg1 }}>{p.n}</div>
                <div style={{ fontSize: 12, color: S.fg3, marginTop: 2, textTransform: 'capitalize' }}>
                  {p.type} · {p.d}
                </div>
              </div>
              <button style={{
                padding: '8px 14px', borderRadius: 12,
                background: S.card, border: `1px solid ${S.hairline}`,
                color: S.fg1, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: S.sans,
              }}>Directions</button>
            </div>
          </Card>
        ))}

        {/* Log activity CTA */}
        <PrimaryButton full style={{ marginTop: 8 }}>
          <IconPlus/> Log activity
        </PrimaryButton>
        <div style={{ height: 8 }}/>
      </div>
    </Screen>
  );
}
window.MoveScreen = MoveScreen;
