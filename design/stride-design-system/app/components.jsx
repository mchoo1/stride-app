// components.jsx — shared Stride UI primitives

const { useState } = React;

/* ---- Avatar (consistent, no rainbow) ---- */
function Avatar({ brand, size = 48, radius = 14 }) {
  const letter = window.brandLetter(brand);
  return (
    <div className="avatar" style={{ width: size, height: size, borderRadius: radius, fontSize: size * 0.42 }}>
      {letter}
    </div>
  );
}

/* ---- Value badge (protein per $) ---- */
function ValueBadge({ value, top = false }) {
  return (
    <span className={'value-badge' + (top ? ' is-top' : '')}>
      {value.toFixed(1)}<span className="u">g/$</span>
    </span>
  );
}

/* ---- Inline metric (cal / protein) ---- */
function Metric({ color, children }) {
  return (
    <span className="metric">
      {color && <span className="dot" style={{ background: color }} />}
      {children}
    </span>
  );
}

/* ---- Value meter (mini bar, normalized to ~6 g/$ max) ---- */
function ValueMeter({ value, max = 6 }) {
  const pct = Math.min(100, (value / max) * 100);
  return <div className="meter"><i style={{ width: pct + '%' }} /></div>;
}

/* ---- Meal row (Home popular list + Search results) ---- */
function MealRow({ meal, onAdd }) {
  const [added, setAdded] = useState(false);
  return (
    <div className="row" style={{ gap: 13, padding: '14px 0', alignItems: 'flex-start' }}>
      <Avatar brand={meal.brand} size={46} />
      <div className="col" style={{ flex: 1, gap: 4, minWidth: 0 }}>
        <div style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2 }}>{meal.name}</div>
        <div className="row" style={{ gap: 4, fontSize: 12.5, fontWeight: 600, color: 'var(--green)' }}>
          {meal.brand}
          <Icon name="chevR" size={13} stroke={2.4} />
          {meal.halal && <span style={{ color: 'var(--muted)', fontWeight: 500 }}>· Halal</span>}
        </div>
        <div className="row" style={{ gap: 9, marginTop: 2, flexWrap: 'wrap' }}>
          <span className="num" style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>${meal.price.toFixed(2)}</span>
          <Metric color="var(--coral)"><span className="num">{meal.cal}</span>&nbsp;cal</Metric>
          <Metric color="var(--green)"><span className="num">{meal.protein}g</span>&nbsp;protein</Metric>
        </div>
      </div>
      <div className="col" style={{ alignItems: 'flex-end', gap: 10, flex: '0 0 auto' }}>
        <ValueBadge value={meal.value} top={meal.value >= 5} />
        <button className="btn-add" onClick={() => { setAdded(a => !a); onAdd && onAdd(meal); }}
          style={added ? { background: 'var(--green)', color: '#fff' } : null}>
          <Icon name={added ? 'check' : 'plus'} size={20} stroke={2.4} />
        </button>
      </div>
    </div>
  );
}

/* ---- Calorie ring ---- */
function CalorieRing({ eaten, budget, burned, size = 132 }) {
  const total = budget + burned;
  const remaining = total - eaten;
  const frac = Math.max(0, Math.min(1, eaten / total));
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: '0 0 auto' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth={12} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#fff" strokeWidth={12}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - frac)}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.22,.61,.36,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <div className="ring-num" style={{ fontSize: 34, lineHeight: 1 }}>{remaining.toLocaleString()}</div>
        <div style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.82, marginTop: 3, letterSpacing: '0.02em' }}>kcal left</div>
      </div>
    </div>
  );
}

/* ---- Macro bars ---- */
function MacroBars({ data, onDark = false }) {
  const items = [
    { k: 'Protein', v: data.protein, color: '#ffffff', accent: 'var(--green-bright)' },
    { k: 'Carbs',   v: data.carbs,   color: '#ffffff', accent: 'var(--gold-bright)' },
    { k: 'Fat',     v: data.fat,     color: '#ffffff', accent: 'var(--coral)' },
  ];
  const trackBg = onDark ? 'rgba(255,255,255,0.20)' : 'var(--surface-2)';
  const fill = onDark ? '#ffffff' : null;
  const lbl = onDark ? 'rgba(255,255,255,0.85)' : 'var(--muted)';
  const val = onDark ? '#ffffff' : 'var(--ink)';
  return (
    <div className="row" style={{ gap: 14 }}>
      {items.map(it => {
        const pct = Math.min(100, (it.v.have / it.v.goal) * 100);
        return (
          <div className="macro" key={it.k}>
            <div className="between">
              <span style={{ fontSize: 11.5, fontWeight: 600, color: lbl }}>{it.k}</span>
            </div>
            <div className="macro-track" style={{ background: trackBg }}>
              <i style={{ width: pct + '%', background: fill || it.accent }} />
            </div>
            <div className="num" style={{ fontSize: 12, fontWeight: 600, color: val }}>
              {it.v.have}<span style={{ opacity: 0.6 }}>/{it.v.goal}g</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---- Bottom nav ---- */
function BottomNav({ active, onNav }) {
  const items = [
    { k: 'home', label: 'Home', icon: 'home' },
    { k: 'search', label: 'Search', icon: 'search' },
    { k: 'log', label: 'Log', icon: 'clock' },
    { k: 'profile', label: 'Profile', icon: 'user' },
  ];
  return (
    <div className="nav">
      {items.map(it => (
        <button key={it.k} className={'nav-item' + (active === it.k ? ' is-active' : '')} onClick={() => onNav(it.k)}>
          <Icon name={it.icon} size={24} stroke={active === it.k ? 2.4 : 2} />
          {it.label}
        </button>
      ))}
    </div>
  );
}

Object.assign(window, { Avatar, ValueBadge, Metric, ValueMeter, MealRow, CalorieRing, MacroBars, BottomNav });
