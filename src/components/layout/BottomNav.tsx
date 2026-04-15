'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    href: '/dashboard', activePrefix: '/dashboard', label: 'Home',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#00E676' : '#44445A'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12L12 4l9 8v8a1 1 0 01-1 1h-5v-5H9v5H4a1 1 0 01-1-1v-8z"/>
      </svg>
    ),
  },
  {
    href: '/eat', activePrefix: '/eat', label: 'Eat',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF6B35' : '#44445A'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l19-9-9 19-2-8-8-2z"/>
      </svg>
    ),
  },
  {
    href: '/move', activePrefix: '/move', label: 'Move',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#A78BFA' : '#44445A'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>
      </svg>
    ),
  },
  {
    href: '/me', activePrefix: '/me', label: 'Me',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#4A9EFF' : '#44445A'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
];

const ACTIVE_COLORS: Record<string, string> = {
  '/dashboard': '#00E676',
  '/eat':       '#FF6B35',
  '/move':      '#A78BFA',
  '/me':        '#4A9EFF',
};

export default function BottomNav() {
  const path = usePathname();

  const getActiveColor = () => {
    for (const item of NAV_ITEMS) {
      if (path === item.activePrefix || path.startsWith(item.activePrefix + '/')) {
        return ACTIVE_COLORS[item.activePrefix] || '#00E676';
      }
    }
    return '#00E676';
  };

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'rgba(14,14,20,0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '10px 0 max(14px, env(safe-area-inset-bottom))',
    }}>
      <div style={{ maxWidth: 500, margin: '0 auto', display: 'flex', alignItems: 'center' }}>
        {NAV_ITEMS.map((item) => {
          const active = path === item.activePrefix || path.startsWith(item.activePrefix + '/');
          const color = active ? ACTIVE_COLORS[item.activePrefix] : '#44445A';
          return (
            <Link key={item.href} href={item.href} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 4,
              padding: '2px 0', textDecoration: 'none',
            }}>
              <div style={{
                width: 40, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 12,
                background: active ? `${ACTIVE_COLORS[item.activePrefix]}14` : 'transparent',
                transition: 'background .2s',
              }}>
                {item.icon(active)}
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.3px',
                color,
                transition: 'color .2s',
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
