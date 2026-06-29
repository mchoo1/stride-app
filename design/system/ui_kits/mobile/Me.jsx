// Me.jsx — weight trend + body stats + BMR/TDEE plain-English explainer.
function MeScreen({ onTab }) {
  // Weight trend (kg) across 30 days
  const weights = [70.2,70.1,70.0,69.8,69.9,69.6,69.5,69.4,69.2,69.1,69.0,68.9,68.9,68.8,68.6,68.7,68.5,68.4,68.6,68.4,68.3,68.2,68.3,68.4,68.2,68.1,68.0,68.1,68.3,68.4];
  const min = Math.min(...weights), max = Math.max(...weights);
  const range = max - min;
  const W = 320, H = 100;
  const pts = weights.map((w, i) => {
    const x = (i / (weights.length - 1)) * W;
    const y = H - ((w - min) / range) * H * 0.85 - 7;
    return [x, y];
  });
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${path} L${W} ${H} L 0 ${H} Z`;
  const delta = (weights[weights.length - 1] - weights[0]).toFixed(1);
  const trendDown = delta.startsWith('-');

  return (
    <Screen activeTab="me" onTab={onTab}>
      <Header eyebrow="Me" title="JAMIE LIM" right={
        <button style={{
          width: 36, height: 36, borderRadius: 12,
          background: S.card, border: `1px solid ${S.hairline}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: S.fg1, cursor: 'pointer',
        }}><IconSettings/></button>
      }/>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Weight trend */}
        <Card pad={16}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <SectionLabel>Weight · 30 days</SectionLabel>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <span style={{ fontFamily: S.display, fontSize: 48, lineHeight: 1, color: S.fg1,
                               fontVariantNumeric: 'tabular-nums' }}>{weights[weights.length - 1]}</span>
                <span style={{ fontSize: 14, color: S.fg3 }}>kg</span>
              </div>
            </div>
            <StatusChip kind={trendDown ? 'success' : 'neutral'}>
              {trendDown ? '↓' : '→'} {delta} kg
            </StatusChip>
          </div>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block', marginTop: 8 }}>
            <defs>
              <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#1E7F5C" stopOpacity="0.22"/>
                <stop offset="1" stopColor="#1E7F5C" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d={area} fill="url(#areaG)"/>
            <path d={path} fill="none" stroke="#1E7F5C" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"/>
            {/* endpoint */}
            <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="4" fill="#1E7F5C" stroke="#fff" strokeWidth="2"/>
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4,
                        fontSize: 11, color: S.fg3 }}>
            <span>Mar 19</span><span>Apr 18</span>
          </div>
        </Card>

        {/* Body stats */}
        <Card pad={16}>
          <SectionLabel style={{ marginBottom: 12 }}>Body stats</SectionLabel>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { l: 'Height',   v: 172, u: 'cm' },
              { l: 'Body fat', v: 22.4, u: '%' },
              { l: 'BMI',      v: 23.1, u: '' },
            ].map(s => (
              <div key={s.l} style={{
                flex: 1, background: S.canvas, borderRadius: 12, padding: '12px 10px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 10, color: S.fg3, fontWeight: 600,
                              letterSpacing: '.06em', textTransform: 'uppercase' }}>{s.l}</div>
                <div style={{ fontFamily: S.display, fontSize: 24, color: S.fg1, marginTop: 4,
                              fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
                {s.u && <div style={{ fontSize: 10, color: S.fg3, marginTop: -2 }}>{s.u}</div>}
              </div>
            ))}
          </div>
        </Card>

        {/* BMR/TDEE explainer */}
        <Card pad={16}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: S.warningBg,
                          color: '#B07B20',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconFlame/>
            </div>
            <SectionLabel>Your energy</SectionLabel>
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: S.fg3, fontWeight: 600,
                            letterSpacing: '.06em', textTransform: 'uppercase' }}>BMR</div>
              <div style={{ fontFamily: S.display, fontSize: 32, color: S.fg1, lineHeight: 1, marginTop: 4,
                            fontVariantNumeric: 'tabular-nums' }}>1,540</div>
              <div style={{ fontSize: 11, color: S.fg3, marginTop: 2 }}>kcal at rest</div>
            </div>
            <div style={{ width: 1, background: S.hairline }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: S.fg3, fontWeight: 600,
                            letterSpacing: '.06em', textTransform: 'uppercase' }}>TDEE</div>
              <div style={{ fontFamily: S.display, fontSize: 32, color: S.fg1, lineHeight: 1, marginTop: 4,
                            fontVariantNumeric: 'tabular-nums' }}>2,120</div>
              <div style={{ fontSize: 11, color: S.fg3, marginTop: 2 }}>kcal typical day</div>
            </div>
          </div>
          <div style={{
            fontSize: 13, color: S.fg2, lineHeight: 1.5,
            background: S.canvas, borderRadius: 12, padding: 12,
          }}>
            At rest you burn <b style={{ color: S.fg1 }}>1,540 kcal</b>. With light activity, about <b style={{ color: S.fg1 }}>2,120</b>. For ~0.4 kg a week, aim around <b style={{ color: S.green }}>1,720 kcal</b> a day.
          </div>
        </Card>

        {/* Secondary actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <GhostButton style={{ flex: 1, padding: '14px 10px' }}><IconWeight/> Log weight</GhostButton>
          <GhostButton style={{ flex: 1, padding: '14px 10px' }}><IconReport/> Weekly PDF</GhostButton>
        </div>
        <div style={{ height: 8 }}/>
      </div>
    </Screen>
  );
}
window.MeScreen = MeScreen;
