// screen-profile.jsx

function MetricCard({ icon, iconColor, iconBg, value, unit, label, sub }) {
  return (
    <div className="card" style={{ padding: 18, flex: 1 }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Icon name={icon} size={20} stroke={2.2} color={iconColor} />
      </div>
      <div className="row" style={{ alignItems: 'baseline', gap: 4 }}>
        <span className="num" style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.03em' }}>{value}</span>
        {unit && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function ProfileScreen() {
  const D = window.STRIDE_DATA;
  const b = D.body;
  const [tab, setTab] = React.useState('Body');

  return (
    <div className="screen-scroll">
      {/* header */}
      <div className="pad screen-top between" style={{ marginBottom: 20 }}>
        <div className="col" style={{ gap: 4 }}>
          <span className="eyebrow">Wednesday, 3 June</span>
          <div className="row" style={{ gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: 'var(--ink)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em' }}>QA</div>
            <div className="col" style={{ gap: 1 }}>
              <span className="display" style={{ fontSize: 23, color: 'var(--ink)' }}>My Profile</span>
              <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 500 }}>1-day streak · Singapore</span>
            </div>
          </div>
        </div>
        <button className="row" style={{ gap: 5, height: 40, padding: '0 15px', borderRadius: 13,
          background: 'var(--green)', color: '#fff', fontWeight: 600, fontSize: 14, boxShadow: 'var(--sh-green)' }}>
          <Icon name="plus" size={16} stroke={2.6} /> Log
        </button>
      </div>

      {/* tabs */}
      <div className="pad" style={{ marginBottom: 18 }}>
        <div className="seg">
          {['Body', 'Goals', 'Settings'].map(tb => (
            <button key={tb} className={tab === tb ? 'is-active green' : ''} onClick={() => setTab(tb)}>{tb}</button>
          ))}
        </div>
      </div>

      {/* metric grid */}
      <div className="pad col" style={{ gap: 12, marginBottom: 16 }}>
        <div className="row" style={{ gap: 12 }}>
          <MetricCard icon="scale" iconColor="var(--green)" iconBg="var(--green-tint)" value={b.weight} unit="kg" label="Current weight" sub="Last logged today" />
          <MetricCard icon="trend" iconColor="var(--gold)" iconBg="var(--gold-tint)" value="—" label="Body fat" sub="Not set" />
        </div>
        <div className="row" style={{ gap: 12 }}>
          <MetricCard icon="bolt" iconColor="var(--coral)" iconBg="var(--coral-tint)" value={b.bmr.toLocaleString()} unit="kcal" label="BMR" sub="At rest" />
          <MetricCard icon="flame" iconColor="var(--green-deep)" iconBg="var(--green-tint)" value={b.tdee.toLocaleString()} unit="kcal" label="TDEE" sub="Daily burn" />
        </div>
      </div>

      {/* info note */}
      <div className="pad" style={{ marginBottom: 18 }}>
        <div className="row" style={{ gap: 12, padding: 16, borderRadius: 'var(--r-card)',
          background: 'var(--surface-3)', border: '1px solid var(--line)', alignItems: 'flex-start' }}>
          <Icon name="info" size={19} stroke={2.2} color="var(--green)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--ink-2)', fontWeight: 500 }}>
            You burn <b style={{ color: 'var(--ink)' }}>{b.bmr.toLocaleString()} kcal</b> at rest. With your activity, total daily burn is <b style={{ color: 'var(--ink)' }}>{b.tdee.toLocaleString()} kcal</b> — the baseline before goal adjustments.
          </span>
        </div>
      </div>

      {/* weight trend placeholder */}
      <div className="pad" style={{ marginBottom: 18 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="between" style={{ marginBottom: 16 }}>
            <span className="h-sec" style={{ fontSize: 16 }}>Weight trend</span>
            <span className="row" style={{ gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>30 days <Icon name="chevD" size={13} stroke={2.4} /></span>
          </div>
          <div className="col" style={{ alignItems: 'center', justifyContent: 'center', gap: 8, height: 120,
            borderRadius: 14, background: 'var(--surface-3)', border: '1px dashed var(--line)' }}>
            <Icon name="trend" size={26} stroke={2} color="var(--faint)" />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-2)' }}>No weight logged yet</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Log below to start tracking</span>
          </div>
        </div>
      </div>

      {/* log weight */}
      <div className="pad">
        <div className="card" style={{ padding: 20 }}>
          <span className="h-sec" style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>Log today's weight</span>
          <div className="row" style={{ gap: 12, marginBottom: 16 }}>
            <div className="col" style={{ gap: 7, flex: 1 }}>
              <span className="eyebrow" style={{ fontSize: 10 }}>Weight (kg)</span>
              <div className="row" style={{ height: 52, padding: '0 16px', borderRadius: 14, background: 'var(--surface-3)',
                border: '1px solid var(--line)', color: 'var(--faint)', fontSize: 17, fontWeight: 600 }}>
                <span className="num">e.g. 75</span>
              </div>
            </div>
            <div className="col" style={{ gap: 7, flex: 1 }}>
              <span className="eyebrow" style={{ fontSize: 10 }}>Body fat % <span style={{ color: 'var(--faint)' }}>(opt)</span></span>
              <div className="row" style={{ height: 52, padding: '0 16px', borderRadius: 14, background: 'var(--surface-3)',
                border: '1px solid var(--line)', color: 'var(--faint)', fontSize: 17, fontWeight: 600 }}>
                <span className="num">e.g. 22</span>
              </div>
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }}>
            <Icon name="check" size={18} stroke={2.6} /> Log weight
          </button>
        </div>
      </div>
    </div>
  );
}

window.ProfileScreen = ProfileScreen;
