'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ── Design system nav icons ────────────────────────────────────────────────
const HomeOutline = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 10.5 12 3.5l8.5 7"/>
    <path d="M5.5 9v10.5a1 1 0 0 0 1 1h3.5v-5.5h4v5.5h3.5a1 1 0 0 0 1-1V9"/>
  </svg>
);
const HomeFill = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 10.5 12 3.5l8.5 7v0" fill="none"/>
    <path d="M5.5 9.2V19.5a1 1 0 0 0 1 1h3.5V15a.9.9 0 0 1 .9-.9h2.2a.9.9 0 0 1 .9.9v5.5h3.5a1 1 0 0 0 1-1V9.2L12 3.8 5.5 9.2Z" fill="currentColor" stroke="none"/>
  </svg>
);
const LogOutline = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="3" width="16" height="18" rx="2.5"/>
    <path d="M8 8h8M8 12h8M8 16h5"/>
    <path d="M15.5 15.5l2 2 3-3"/>
  </svg>
);
const LogFill = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="3" width="16" height="18" rx="2.5" fill="currentColor" stroke="none"/>
    <path d="M8 8h8M8 12h8M8 16h5" stroke="#fff"/>
    <path d="M15.5 15.5l2 2 3-3" stroke="#fff"/>
  </svg>
);
const EatOutline = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 11h17"/>
    <path d="M4.5 11a7.5 7.5 0 0 0 15 0"/>
    <path d="M15.5 7 18 4.5"/>
    <path d="M13 7l1-3"/>
  </svg>
);
const EatFill = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 11h17a0 0 0 0 1 0 0 7.5 7.5 0 0 1-15 0 0 0 0 0 1 0 0z" fill="currentColor" stroke="none"/>
    <path d="M3.5 11h17" stroke="currentColor"/>
    <path d="M15.5 7 18 4.5" stroke="currentColor"/>
    <path d="M13 7l1-3" stroke="currentColor"/>
  </svg>
);
const MoveOutline = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13.5 3 5.5 13h5.5l-1 8 8-10h-5.5l1-8Z"/>
  </svg>
);
const MoveFill = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13.5 3 5.5 13h5.5l-1 8 8-10h-5.5l1-8Z" fill="currentColor" stroke="none"/>
  </svg>
);
const MeOutline = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="3.75"/>
    <path d="M4.5 20c0-3.8 3.4-6.5 7.5-6.5s7.5 2.7 7.5 6.5"/>
  </svg>
);
const MeFill = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="3.75" fill="currentColor" stroke="none"/>
    <path d="M4.5 20.5c0-3.8 3.4-6.8 7.5-6.8s7.5 3 7.5 6.8" fill="currentColor" stroke="none"/>
  </svg>
);

const NAV_ITEMS = [
  { href: '/dashboard', prefix: '/dashboard', label: 'Home',  Outline: HomeOutline,  Fill: HomeFill  },
  { href: '/log',       prefix: '/log',       label: 'Log',   Outline: LogOutline,   Fill: LogFill   },
  { href: '/eat',       prefix: '/eat',       label: 'Eat',   Outline: EatOutline,   Fill: EatFill   },
  { href: '/move',      prefix: '/move',      label: 'Move',  Outline: MoveOutline,  Fill: MoveFill  },
  { href: '/me',        prefix: '/me',        label: 'Me',    Outline: MeOutline,    Fill: MeFill    },
];

const GREEN = '#1E7F5C';
const MUTED = '#8B95A7';

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderTop: '1px solid #E5E9F2',
      padding: '8px 0 max(20px, env(safe-area-inset-bottom))',
    }}>
      <div style={{ maxWidth: 500, margin: '0 auto', display: 'flex', alignItems: 'center' }}>
        {NAV_ITEMS.map((item) => {
          const active = path === item.prefix || path.startsWith(item.prefix + '/');
          const Icon   = active ? item.Fill : item.Outline;
          const color  = active ? GREEN : MUTED;
          return (
            <Link key={item.href} href={item.href} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3,
              padding: '4px 0', textDecoration: 'none', color,
              transition: 'color .15s',
            }}>
              <Icon />
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.02em',
                fontFamily: 'var(--font-sans)',
              }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
