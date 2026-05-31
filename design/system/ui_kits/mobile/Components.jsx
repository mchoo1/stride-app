// Components.jsx — shared Stride UI components (BottomNav, Screen, Header, Card, etc.)

function Screen({ children, activeTab, onTab, bg }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: bg || S.canvas,
      display: 'flex', flexDirection: 'column',
      fontFamily: S.sans,
    }}>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 88 }}>
        {children}
      </div>
      <BottomNav active={activeTab} onTab={onTab}/>
    </div>
  );
}

function Header({ eyebrow, title, right, greenBg }) {
  const fg = greenBg ? '#FFFFFF' : S.fg1;
  const fgMuted = greenBg ? 'rgba(255,255,255,.72)' : S.fg3;
  return (
    <div style={{ padding: '52px 20px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          {eyebrow && <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase',
            color: fgMuted, marginBottom: 6,
          }}>{eyebrow}</div>}
          <h1 style={{
            fontFamily: S.display, fontSize: 40, fontWeight: 400, letterSpacing: '.01em',
            color: fg, margin: 0, lineHeight: 1, textTransform: 'uppercase',
          }}>{title}</h1>
        </div>
        {right}
      </div>
    </div>
  );
}

function Card({ children, style, pad = 16, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: S.card, border: `1px solid ${S.hairline}`, borderRadius: 16,
      boxShadow: S.shCard, padding: pad,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform .15s, box-shadow .15s',
      ...style,
    }}>{children}</div>
  );
}

function SectionLabel({ children, style }) {
  return <div style={{
    fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase',
    color: S.fg3, ...style,
  }}>{children}</div>;
}

function StatusChip({ kind = 'success', children }) {
  const map = {
    success: { bg: S.successBg, fg: S.green, dot: S.greenBright },
    warning: { bg: S.warningBg, fg: '#B07B20', dot: S.amber },
    danger:  { bg: S.dangerBg,  fg: S.red,   dot: S.red },
    neutral: { bg: S.navyBg,    fg: S.fg1,   dot: S.fg2 },
  }[kind] || {};
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 11px', borderRadius: 999,
      background: map.bg, color: map.fg, fontSize: 12, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: map.dot }}/>
      {children}
    </span>
  );
}

function PrimaryButton({ children, onClick, style, full }) {
  return (
    <button onClick={onClick} style={{
      background: S.green, color: '#fff',
      fontFamily: S.sans, fontWeight: 600, fontSize: 15,
      padding: '14px 20px', border: 'none', borderRadius: 16,
      boxShadow: S.shCta, cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      width: full ? '100%' : undefined,
      ...style,
    }}>{children}</button>
  );
}

function GhostButton({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      background: S.card, color: S.fg1,
      fontFamily: S.sans, fontWeight: 600, fontSize: 14,
      padding: '11px 16px', border: `1px solid ${S.hairline}`, borderRadius: 14,
      cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      ...style,
    }}>{children}</button>
  );
}

function QuickActionTile({ icon, label, tint, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, background: S.card, border: `1px solid ${S.hairline}`, borderRadius: 20,
      boxShadow: S.shCard, padding: '16px 12px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      cursor: 'pointer', transition: 'transform .12s',
      fontFamily: S.sans,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 14,
        background: tint || S.successBg, color: S.green,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: S.fg1 }}>{label}</div>
    </button>
  );
}

function ProgressBar({ pct, color }) {
  const c = color || S.green;
  return (
    <div style={{ height: 8, background: S.hairline, borderRadius: 4, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${Math.min(100, pct)}%`,
        background: c, borderRadius: 4,
        transition: 'width .6s cubic-bezier(.4,0,.2,1)',
      }}/>
    </div>
  );
}

function BottomNav({ active = 'home', onTab }) {
  const items = [
    { id: 'home', label: 'Home', O: NavHomeOutline, F: NavHomeFill },
    { id: 'scan', label: 'Scan', O: NavScanOutline, F: NavScanFill },
    { id: 'eat',  label: 'Eat',  O: NavEatOutline,  F: NavEatFill },
    { id: 'move', label: 'Move', O: NavMoveOutline, F: NavMoveFill },
    { id: 'me',   label: 'Me',   O: NavMeOutline,   F: NavMeFill },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderTop: `1px solid ${S.hairline}`,
      padding: '8px 0 28px',
      display: 'flex',
    }}>
      {items.map(it => {
        const isActive = it.id === active;
        const Icon = isActive ? it.F : it.O;
        const color = isActive ? S.green : S.fg3;
        return (
          <button key={it.id} onClick={() => onTab && onTab(it.id)} style={{
            flex: 1, background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '4px 0', fontFamily: S.sans,
          }}>
            <span style={{ color, display: 'flex' }}><Icon/></span>
            <span style={{
              fontSize: 10, fontWeight: 600, color, letterSpacing: '.02em',
            }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Avatar — small circle with initial
function Avatar({ initial = 'J', size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: S.navyBg, color: S.fg1,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: S.sans, fontWeight: 600, fontSize: size * 0.42,
    }}>{initial}</div>
  );
}

Object.assign(window, {
  Screen, Header, Card, SectionLabel, StatusChip, PrimaryButton, GhostButton,
  QuickActionTile, ProgressBar, BottomNav, Avatar,
});
