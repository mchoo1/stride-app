// Home.jsx — Net calorie hero + horizontal progress + three quick-action buttons.
function HomeScreen({ onTab, onQuickAction }) {
  const consumed = 1240, burned = 180, goal = 1720;
  const net = Math.max(0, consumed - burned);
  const remaining = goal - net;
  const pct = Math.min(100, (net / goal) * 100);
  const overPct = remaining < 0;
  const closePct = !overPct && remaining < 200;
  const barColor = overPct ? S.red : closePct ? S.amber : S.green;
  const chipKind = overPct ? 'danger' : closePct ? 'warning' : 'success';
  const chipLabel = overPct ? `${Math.abs(remaining)} over` : `${remaining} left`;

  return (
    <Screen activeTab="home" onTab={onTab}>
      <Header eyebrow="Mon 18 Apr" title="TODAY" right={<Avatar initial="J"/>}/>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Hero net-calorie card */}
        <Card pad={24} style={{ boxShadow: S.shHero, borderRadius: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <SectionLabel>Net calories left</SectionLabel>
            <StatusChip kind={chipKind}>{overPct ? 'Over budget' : closePct ? 'Close' : 'On track'}</StatusChip>
          </div>
          <div style={{
            fontFamily: S.display, fontSize: 96, lineHeight: .92,
            color: overPct ? S.red : S.fg1,
            fontVariantNumeric: 'tabular-nums', letterSpacing: '.005em',
            marginTop: 4,
          }}>{Math.abs(remaining)}</div>
          <div style={{ fontSize: 13, color: S.fg2, margin: '6px 0 16px' }}>
            {consumed.toLocaleString()} in · {burned} out · {goal.toLocaleString()} goal
          </div>
          <ProgressBar pct={pct} color={barColor}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8,
                        fontSize: 12, color: S.fg3 }}>
            <span>0</span><span>{goal.toLocaleString()} kcal</span>
          </div>
        </Card>

        {/* Quick action row */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <QuickActionTile icon={<IconPlus/>} label="Log food"
            tint={S.successBg} onClick={() => onQuickAction?.('food')}/>
          <QuickActionTile icon={<NavScanOutline/>} label="Scan"
            tint="rgba(46,111,184,.1)" onClick={() => onTab?.('scan')}/>
          <QuickActionTile icon={<IconBolt/>} label="Activity"
            tint="rgba(242,169,59,.14)" onClick={() => onQuickAction?.('activity')}/>
        </div>

        {/* Macros */}
        <Card>
          <SectionLabel style={{ marginBottom: 12 }}>Today's macros</SectionLabel>
          {[
            { l: 'Protein', v: 68, g: 110, c: '#2E6FB8' },
            { l: 'Carbs',   v: 142, g: 190, c: '#C98A2E' },
            { l: 'Fat',     v: 38, g: 55, c: S.green },
          ].map(m => (
            <div key={m.l} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: S.fg1 }}>{m.l}</span>
                <span style={{ fontSize: 12, color: S.fg3 }}>
                  <span style={{ color: S.fg1, fontWeight: 600 }}>{m.v}</span> / {m.g} g
                </span>
              </div>
              <ProgressBar pct={(m.v/m.g)*100} color={m.c}/>
            </div>
          ))}
          <div style={{ height: 0 }}/>
        </Card>

        {/* Recent */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <SectionLabel>Recent</SectionLabel>
            <span style={{ fontSize: 12, color: S.green, fontWeight: 600, cursor: 'pointer' }}>See all</span>
          </div>
          {[
            { n: 'Chicken rice',  loc: 'Maxwell · lunch',    k: 550, seed: 0 },
            { n: 'Kopi-o kosong', loc: '7-Eleven · morning', k: 5,   seed: 2 },
            { n: 'Nasi lemak',    loc: 'Adam Rd · breakfast', k: 630, seed: 1 },
          ].map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0',
              borderTop: i ? `1px solid ${S.hairline}` : 'none',
            }}>
              <div style={abstractTile(f.seed, 40)}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: S.fg1 }}>{f.n}</div>
                <div style={{ fontSize: 12, color: S.fg3, marginTop: 2 }}>{f.loc}</div>
              </div>
              <div style={{ fontFamily: S.display, fontSize: 22, color: S.fg1, lineHeight: 1 }}>{f.k}</div>
            </div>
          ))}
        </Card>

      </div>
    </Screen>
  );
}

window.HomeScreen = HomeScreen;
