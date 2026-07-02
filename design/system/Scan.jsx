// Scan.jsx — camera viewfinder placeholder with recognised-food result.
function ScanScreen({ onTab }) {
  const [state, setState] = React.useState('scanning'); // scanning | result
  const result = { name: 'Chicken rice', kcal: 550, protein: 28, carbs: 62, fat: 18, source: 'SG hawker DB' };

  return (
    <Screen activeTab="scan" onTab={onTab} bg="#0F1B2D">
      {/* Camera viewfinder (dark) */}
      <div style={{ height: 520, position: 'relative', background:
        'radial-gradient(ellipse at center, #1E2D4A 0%, #0F1B2D 70%)' }}>
        {/* status top bar */}
        <div style={{ padding: '52px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button style={{ background: 'rgba(255,255,255,.14)', border: 'none', borderRadius: 999,
                           width: 36, height: 36, color: '#fff', cursor: 'pointer' }}>
            <IconClose/>
          </button>
          <div style={{ color: 'rgba(255,255,255,.72)', fontSize: 13, fontWeight: 500 }}>Point at food</div>
          <div style={{ width: 36 }}/>
        </div>

        {/* reticle */}
        <div style={{ position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%,-50%)', width: 240, height: 240 }}>
          {[[0,0],[1,0],[0,1],[1,1]].map(([x,y],i) => (
            <div key={i} style={{
              position: 'absolute', width: 36, height: 36,
              [x?'right':'left']: 0, [y?'bottom':'top']: 0,
              borderTop: !y && '3px solid #13A26B',
              borderBottom: y && '3px solid #13A26B',
              borderLeft: !x && '3px solid #13A26B',
              borderRight: x && '3px solid #13A26B',
              borderTopLeftRadius: !x && !y ? 18 : 0,
              borderTopRightRadius: x && !y ? 18 : 0,
              borderBottomLeftRadius: !x && y ? 18 : 0,
              borderBottomRightRadius: x && y ? 18 : 0,
            }}/>
          ))}
          {/* shimmer */}
          <div style={{
            position: 'absolute', top: 0, left: 8, right: 8, height: 2,
            background: 'linear-gradient(90deg, transparent, #13A26B, transparent)',
            animation: 'scan 1.6s ease-in-out infinite',
          }}/>
        </div>

        <div style={{ position: 'absolute', bottom: 24, left: 0, right: 0,
                      textAlign: 'center', color: 'rgba(255,255,255,.72)', fontSize: 13 }}>
          Identifying…
        </div>

        <style>{`@keyframes scan {0%,100%{transform:translateY(0)}50%{transform:translateY(236px)}}`}</style>
      </div>

      {/* Result bottom sheet */}
      <div style={{
        marginTop: -20, background: S.canvas,
        borderRadius: '24px 24px 0 0', padding: '24px 20px 20px',
        minHeight: 300,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <SectionLabel>Recognised</SectionLabel>
            <div style={{ fontFamily: S.display, fontSize: 32, color: S.fg1,
                          marginTop: 4, letterSpacing: '.005em', textTransform: 'uppercase' }}>
              {result.name}
            </div>
            <div style={{ fontSize: 12, color: S.fg3, marginTop: 4 }}>from {result.source}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <SectionLabel>kcal</SectionLabel>
            <div style={{ fontFamily: S.display, fontSize: 40, color: S.fg1, lineHeight: 1, marginTop: 2,
                          fontVariantNumeric: 'tabular-nums' }}>{result.kcal}</div>
          </div>
        </div>

        {/* Macro boxes */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {[['Protein', result.protein, '#2E6FB8'],
            ['Carbs',   result.carbs,   '#C98A2E'],
            ['Fat',     result.fat,     S.green]].map(([l, v, c]) => (
            <div key={l} style={{
              flex: 1, background: S.card, border: `1px solid ${S.hairline}`, borderRadius: 12,
              padding: '10px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: S.fg3, fontWeight: 500, marginBottom: 2 }}>{l}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: c, fontFamily: S.sans }}>{v}<span style={{ fontSize: 11, color: S.fg3, fontWeight: 500 }}> g</span></div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <GhostButton style={{ flex: 1, padding: '14px 16px' }}>Not this</GhostButton>
          <PrimaryButton style={{ flex: 1 }} onClick={() => onTab?.('home')}>Log 550 kcal</PrimaryButton>
        </div>
      </div>
    </Screen>
  );
}
window.ScanScreen = ScanScreen;
