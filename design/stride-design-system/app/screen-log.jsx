// screen-log.jsx

function BarChart({ data }) {
  const max = Math.max(...data.map(d => Math.max(d.cal, d.goal))) * 1.08;
  const goal = data[0].goal;
  const H = 96;
  return (
    <div style={{ position: 'relative', height: H, marginTop: 6 }}>
      {/* goal line */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: H - (goal / max) * H,
        borderTop: '1.5px dashed var(--green-tint-2)', zIndex: 1 }}>
        <span style={{ position: 'absolute', right: 0, top: -16, fontSize: 10, fontWeight: 600, color: 'var(--green)' }}>
          goal {goal.toLocaleString()}
        </span>
      </div>
      <div className="row" style={{ height: H, alignItems: 'flex-end', gap: 0, justifyContent: 'space-between' }}>
        {data.map((d, i) => {
          const isNow = d.d === 'Now';
          const over = d.cal > d.goal;
          const h = (d.cal / max) * H;
          return (
            <div key={i} className="col" style={{ alignItems: 'center', gap: 7, flex: 1 }}>
              <div style={{ width: 22, height: h, borderRadius: 7, position: 'relative',
                background: isNow ? 'var(--green)' : over ? 'var(--coral-tint)' : 'var(--green-tint-2)',
                boxShadow: isNow ? 'var(--sh-green)' : 'none', transition: 'height .6s ease' }}>
                {over && !isNow && <span style={{ position: 'absolute', inset: 0, borderRadius: 7,
                  border: '1.5px solid var(--coral)', opacity: 0.45 }} />}
              </div>
              <span style={{ fontSize: 11, fontWeight: isNow ? 700 : 600, color: isNow ? 'var(--green)' : 'var(--faint)' }}>{d.d}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LogScreen() {
  const D = window.STRIDE_DATA;
  const [mode, setMode] = React.useState('Food');
  const [meal, setMeal] = React.useState('Lunch');
  const avg = Math.round(D.history.reduce((s, d) => s + d.cal, 0) / D.history.length);
  const activeDays = D.history.filter(d => d.cal > 0).length;

  return (
    <div className="screen-scroll">
      {/* header */}
      <div className="pad screen-top between" style={{ marginBottom: 18 }}>
        <h1 className="h-screen">Log</h1>
        <button className="row" style={{ gap: 4, color: 'var(--green)', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' }}>
          Full log <Icon name="arrowR" size={15} stroke={2.4} />
        </button>
      </div>

      {/* 7-day history */}
      <div className="pad" style={{ marginBottom: 18 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="row" style={{ gap: 0, marginBottom: 18, justifyContent: 'space-between' }}>
            {[
              { l: 'Avg / day', v: avg.toLocaleString(), u: 'kcal', c: 'var(--ink)' },
              { l: 'Burned', v: '1.9k', u: 'kcal', c: 'var(--gold)' },
              { l: 'Active', v: activeDays, u: '/ 7 days', c: 'var(--green)' },
            ].map((s, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--line)', margin: '2px 0' }} />}
                <div className="col" style={{ gap: 3, flex: 1, paddingLeft: i ? 16 : 0 }}>
                  <span className="eyebrow" style={{ fontSize: 10 }}>{s.l}</span>
                  <div className="row" style={{ alignItems: 'baseline', gap: 4 }}>
                    <span className="num" style={{ fontSize: 22, fontWeight: 700, color: s.c }}>{s.v}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>{s.u}</span>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
          <BarChart data={D.history} />
        </div>
      </div>

      {/* mode segmented */}
      <div className="pad" style={{ marginBottom: 14 }}>
        <div className="seg">
          {[{ k: 'Food', icon: 'bowl' }, { k: 'Scan', icon: 'scan' }, { k: 'Activity', icon: 'bolt' }].map(m => (
            <button key={m.k} className={(mode === m.k ? 'is-active green' : '')} onClick={() => setMode(m.k)}>
              <Icon name={m.icon} size={17} stroke={2.2} /> {m.k}
            </button>
          ))}
        </div>
      </div>

      {/* meal type */}
      <div className="pad between" style={{ marginBottom: 12 }}>
        <div className="row" style={{ gap: 8 }}>
          {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(m => (
            <button key={m} onClick={() => setMeal(m)} style={{
              height: 34, padding: '0 13px', borderRadius: 999, fontSize: 13, fontWeight: 600,
              background: meal === m ? 'var(--green-tint)' : 'transparent',
              color: meal === m ? 'var(--green-deep)' : 'var(--muted)',
              border: meal === m ? '1px solid var(--green-tint-2)' : '1px solid transparent' }}>{m}</button>
          ))}
        </div>
      </div>

      {/* search food */}
      <div className="pad" style={{ marginBottom: 16 }}>
        <div className="row between" style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>Add to {meal}</span>
          <button className="row" style={{ gap: 5, fontSize: 13, fontWeight: 600, color: 'var(--coral)', whiteSpace: 'nowrap' }}>
            <Icon name="pencil" size={14} stroke={2.2} /> Manual entry
          </button>
        </div>
        <div className="search" style={{ marginBottom: 14 }}>
          <Icon name="search" size={20} stroke={2.2} color="var(--muted)" /> Search food…
        </div>

        {/* today's logged */}
        <div className="card" style={{ padding: '4px 16px' }}>
          {D.loggedToday.map((it, i) => (
            <React.Fragment key={it.id}>
              {i > 0 && <hr className="hr" />}
              <div className="row between" style={{ padding: '13px 0', gap: 12 }}>
                <div className="row" style={{ gap: 12, minWidth: 0, flex: 1 }}>
                  <Avatar brand={it.brand} size={40} radius={12} />
                  <div className="col" style={{ gap: 2, minWidth: 0 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>{it.meal} · {it.protein}g protein</span>
                  </div>
                </div>
                <span className="num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--coral)', flex: '0 0 auto' }}>{it.cal}<span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}> cal</span></span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* find something */}
      <div className="pad">
        <button style={{ width: '100%', textAlign: 'left', display: 'block',
          background: 'var(--green-tint)', borderRadius: 'var(--r-card)', padding: 18 }}>
          <div className="row between">
            <div className="row" style={{ gap: 13 }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="bowl" size={22} stroke={2.2} color="#fff" />
              </div>
              <div className="col" style={{ gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--green-deep)' }}>Find best-value meals</span>
                <span style={{ fontSize: 12.5, color: 'var(--green)', fontWeight: 500 }}>Grab &amp; Go options with full macros</span>
              </div>
            </div>
            <Icon name="arrowR" size={20} stroke={2.4} color="var(--green)" />
          </div>
        </button>
      </div>
    </div>
  );
}

window.LogScreen = LogScreen;
