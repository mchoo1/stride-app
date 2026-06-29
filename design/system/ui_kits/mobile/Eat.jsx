// Eat.jsx — remaining-calorie banner + restaurant cards + ready-to-eat cards.
function EatScreen({ onTab }) {
  const remaining = 480;
  const [tab, setTab] = React.useState('nearby'); // nearby | rte

  const restaurants = [
    { n: 'Maxwell Food Centre',  c: 'Hawker',     d: '450 m', lo: 380, hi: 680, top: 'Chicken rice' },
    { n: 'Toast Box',            c: 'Café',       d: '280 m', lo: 320, hi: 540, top: 'Kaya toast set' },
    { n: 'Hawker @ Tg Pagar',    c: 'Hawker',     d: '1.1 km', lo: 420, hi: 720, top: 'Fishball noodles' },
    { n: 'SaladStop!',           c: 'Salad bar',  d: '650 m', lo: 380, hi: 520, top: 'Summer caesar' },
  ];
  const rte = [
    { n: 'FairPrice chicken breast wrap', brand: 'FairPrice', k: 320, fits: true },
    { n: '7-Select onigiri (salmon)',     brand: '7-Eleven',  k: 210, fits: true },
    { n: 'Char siew bao (2 pc)',          brand: '7-Eleven',  k: 420, fits: true },
    { n: 'Hakata tonkotsu ramen cup',     brand: 'FairPrice', k: 540, fits: false },
  ];

  return (
    <Screen activeTab="eat" onTab={onTab}>
      <Header eyebrow="Eat smart" title="NEARBY"/>

      {/* Remaining banner */}
      <div style={{ padding: '0 20px 12px' }}>
        <Card pad={16} style={{
          background: S.green, color: '#fff', border: 'none',
          boxShadow: S.shCta,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.06em',
                            textTransform: 'uppercase', color: 'rgba(255,255,255,.72)' }}>You have</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <span style={{ fontFamily: S.display, fontSize: 48, lineHeight: 1,
                               fontVariantNumeric: 'tabular-nums' }}>{remaining}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,.82)' }}>kcal left for today</span>
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 14,
                          background: 'rgba(255,255,255,.14)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <IconFork/>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 20px', display: 'flex', gap: 8, marginBottom: 12 }}>
        {[['nearby', 'Restaurants'], ['rte', 'Ready-to-eat']].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '8px 16px', borderRadius: 999,
            border: `1px solid ${tab === id ? S.green : S.hairline}`,
            background: tab === id ? S.green : S.card,
            color: tab === id ? '#fff' : S.fg1,
            fontFamily: S.sans, fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>{l}</button>
        ))}
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tab === 'nearby' && restaurants.map((r, i) => (
          <Card key={i} pad={14}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: '#F3F1EA',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C98A2E' }}>
                <IconPinEat/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: S.fg1 }}>{r.n}</div>
                  <div style={{ fontSize: 12, color: S.fg3 }}>{r.d}</div>
                </div>
                <div style={{ fontSize: 12, color: S.fg2, marginTop: 2 }}>{r.c} · top: {r.top}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <span style={{ fontFamily: S.display, fontSize: 18, color: S.fg1,
                                 fontVariantNumeric: 'tabular-nums' }}>{r.lo}–{r.hi}</span>
                  <span style={{ fontSize: 11, color: S.fg3 }}>kcal typical</span>
                  {r.lo <= remaining && <StatusChip kind="success">Fits</StatusChip>}
                </div>
              </div>
            </div>
          </Card>
        ))}

        {tab === 'rte' && rte.map((r, i) => (
          <Card key={i} pad={14}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={abstractTile(i + 2, 48)}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: S.fg1 }}>{r.n}</div>
                <div style={{ fontSize: 12, color: S.fg3, marginTop: 2 }}>{r.brand}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: S.display, fontSize: 22, color: r.fits ? S.fg1 : S.fg3, lineHeight: 1,
                              fontVariantNumeric: 'tabular-nums' }}>{r.k}</div>
                <div style={{ fontSize: 10, color: S.fg3, marginTop: 2 }}>kcal</div>
              </div>
              <button style={{
                width: 36, height: 36, borderRadius: 12, border: `1px solid ${S.green}`,
                background: S.successBg, color: S.green, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><IconPlus/></button>
            </div>
          </Card>
        ))}
        <div style={{ height: 8 }}/>
      </div>
    </Screen>
  );
}
window.EatScreen = EatScreen;
