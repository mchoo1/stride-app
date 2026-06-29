// screen-home.jsx — MVP: search-first home. Calorie tracking demoted to a
// slim strip (retention nudge → Log); discovery (search + value + spots) leads.

function TodayStrip({ onNav }) {
  const t = window.STRIDE_DATA.today;
  const left = (t.budget + t.burned - t.eaten).toLocaleString();
  const frac = Math.min(1, t.eaten / (t.budget + t.burned));
  const r = 15, c = 2 * Math.PI * r;
  return (
    <button onClick={() => onNav('log')} className="card" style={{ width: '100%', display: 'flex',
      alignItems: 'center', gap: 12, padding: '12px 14px', textAlign: 'left' }}>
      <svg width="38" height="38" style={{ transform: 'rotate(-90deg)', flex: '0 0 auto' }}>
        <circle cx="19" cy="19" r={r} fill="none" stroke="var(--green-tint-2)" strokeWidth="4" />
        <circle cx="19" cy="19" r={r} fill="none" stroke="var(--green)" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - frac)} />
      </svg>
      <div className="col" style={{ gap: 1, flex: 1, minWidth: 0 }}>
        <div className="row" style={{ gap: 5, alignItems: 'baseline' }}>
          <span className="num" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{left}</span>
          <span style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>kcal left today</span>
        </div>
        <span style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 500 }}>On track · tap to log a meal</span>
      </div>
      <span className="row" style={{ gap: 3, fontSize: 13, fontWeight: 600, color: 'var(--green)', whiteSpace: 'nowrap' }}>
        Log <Icon name="chevR" size={15} stroke={2.4} />
      </span>
    </button>
  );
}

function SpotCard({ spot }) {
  return (
    <div className="card" style={{ flex: '0 0 auto', width: 198, padding: 16 }}>
      <div className="between" style={{ marginBottom: 12 }}>
        <Avatar brand={spot.name} size={42} radius={13} />
        <span className="row" style={{ gap: 4, fontSize: 11.5, fontWeight: 600, color: 'var(--muted)' }}>
          <Icon name="pin" size={13} stroke={2.2} color="var(--green)" /> {spot.dist}
        </span>
      </div>
      <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.15 }}>{spot.name}</div>
      <div className="row" style={{ gap: 6, marginTop: 4, marginBottom: 13 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>{spot.cat}</span>
        {spot.halal && <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--green-deep)',
          background: 'var(--green-tint)', padding: '2px 7px', borderRadius: 999 }}>Halal</span>}
      </div>
      <hr className="hr" style={{ marginBottom: 11 }} />
      <span className="eyebrow" style={{ fontSize: 9.5 }}>Best value pick</span>
      <div className="between" style={{ marginTop: 6, gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis' }}>{spot.top}</span>
        <ValueBadge value={spot.topVal} top={spot.topVal >= 5} />
      </div>
    </div>
  );
}

function HomeScreen({ onNav }) {
  const D = window.STRIDE_DATA;
  const best = [...D.meals].sort((a, b) => b.value - a.value).slice(0, 4);
  const popular = D.meals.slice(0, 5);
  const [activeFilter, setActiveFilter] = React.useState('Best Value');

  return (
    <div className="screen-scroll">
      {/* greeting */}
      <div className="pad screen-top between" style={{ marginBottom: 18 }}>
        <div className="col" style={{ gap: 3, flex: 1, minWidth: 0 }}>
          <span className="eyebrow">{D.user.date}</span>
          <h1 className="h-screen rise" style={{ whiteSpace: 'nowrap' }}>Hello, {D.user.name}</h1>
        </div>
        <div className="row" style={{ gap: 5, height: 32, padding: '0 11px', borderRadius: 999, flex: '0 0 auto',
          background: 'var(--coral-tint)', color: 'var(--coral)', fontWeight: 700, fontSize: 13 }}>
          <Icon name="flame" size={15} stroke={2.4} /> {D.user.streak}d
        </div>
      </div>

      {/* slim today strip — retention hook, subordinate to search */}
      <div className="pad" style={{ marginBottom: 18 }}>
        <TodayStrip onNav={onNav} />
      </div>

      {/* SEARCH HERO — the primary MVP action */}
      <div className="pad" style={{ marginBottom: 14 }}>
        <div className="col" style={{ gap: 3, marginBottom: 12 }}>
          <h2 className="display" style={{ fontSize: 21, color: 'var(--ink)' }}>What are you eating?</h2>
          <span style={{ fontSize: 13.5, color: 'var(--muted)', fontWeight: 500 }}>Search by price, calories &amp; protein per dollar</span>
        </div>
        <button className="search rise" onClick={() => onNav('search')} style={{ width: '100%', height: 58, fontSize: 16 }}>
          <Icon name="search" size={21} stroke={2.2} color="var(--green)" />
          Search meals, restaurants, recipes…
        </button>
      </div>

      {/* filter chips */}
      <div className="chip-row" style={{ marginBottom: 26 }}>
        {D.filters.map(f => (
          <button key={f} className={'chip' + (activeFilter === f ? ' is-green' : '')} onClick={() => { setActiveFilter(f); onNav('search'); }}>
            {f === 'Best Value' && <Icon name="bolt" size={14} stroke={2.4} />}
            {f}
          </button>
        ))}
      </div>

      {/* BEST VALUE PICKS — spotlight */}
      <div className="pad between" style={{ marginBottom: 13 }}>
        <div className="col" style={{ gap: 2 }}>
          <h2 className="h-sec">Best value right now</h2>
          <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 500 }}>Most protein per dollar near you</span>
        </div>
        <button className="row" style={{ gap: 3, color: 'var(--green)', fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap' }} onClick={() => onNav('search')}>
          See all <Icon name="chevR" size={15} stroke={2.4} />
        </button>
      </div>
      <div className="chip-row" style={{ gap: 12, marginBottom: 28, paddingBottom: 4 }}>
        {best.map((m, i) => (
          <div key={m.id} className="card pop" style={{ flex: '0 0 auto', width: 186, padding: 16, animationDelay: (i * 0.05) + 's' }}>
            <div className="between" style={{ marginBottom: 12 }}>
              <Avatar brand={m.brand} size={40} radius={12} />
              {i === 0 && <span className="row" style={{ gap: 3, fontSize: 10.5, fontWeight: 700, color: 'var(--gold)',
                background: 'var(--gold-tint)', padding: '4px 8px', borderRadius: 999 }}>
                <Icon name="star" size={12} stroke={2.4} /> TOP</span>}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.18, marginBottom: 2 }}>{m.name}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', marginBottom: 14 }}>{m.brand}</div>
            <div className="row" style={{ alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
              <span className="num" style={{ fontSize: 28, fontWeight: 700, color: 'var(--gold)', letterSpacing: '-0.03em' }}>{m.value.toFixed(1)}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)' }}>g protein / $</span>
            </div>
            <ValueMeter value={m.value} />
            <div className="row" style={{ gap: 8, marginTop: 12, fontSize: 12.5 }}>
              <span className="num" style={{ fontWeight: 700, color: 'var(--ink)' }}>${m.price.toFixed(2)}</span>
              <span style={{ color: 'var(--muted)' }}>·</span>
              <span className="num" style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{m.cal} cal</span>
            </div>
          </div>
        ))}
      </div>

      {/* RECOMMENDED SPOTS */}
      <div className="pad between" style={{ marginBottom: 13 }}>
        <div className="col" style={{ gap: 2 }}>
          <h2 className="h-sec">Recommended spots</h2>
          <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 500 }}>Popular in Singapore</span>
        </div>
        <button className="row" style={{ gap: 3, color: 'var(--green)', fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap' }} onClick={() => onNav('search')}>
          See all <Icon name="chevR" size={15} stroke={2.4} />
        </button>
      </div>
      <div className="chip-row" style={{ gap: 12, marginBottom: 28, paddingBottom: 4 }}>
        {D.spots.map((s, i) => (
          <div key={s.id} className="pop" style={{ animationDelay: (i * 0.05) + 's' }}><SpotCard spot={s} /></div>
        ))}
      </div>

      {/* POPULAR MEALS */}
      <div className="pad between" style={{ marginBottom: 4 }}>
        <div className="col" style={{ gap: 2 }}>
          <h2 className="h-sec">Popular meals</h2>
          <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 500 }}>Price · calories · protein per dollar</span>
        </div>
        <button className="row" style={{ gap: 3, color: 'var(--green)', fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap' }} onClick={() => onNav('search')}>
          Browse <Icon name="chevR" size={15} stroke={2.4} />
        </button>
      </div>
      <div className="pad">
        <div className="card" style={{ padding: '4px 16px' }}>
          {popular.map((m, i) => (
            <React.Fragment key={m.id}>
              {i > 0 && <hr className="hr" />}
              <MealRow meal={m} />
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

window.HomeScreen = HomeScreen;
