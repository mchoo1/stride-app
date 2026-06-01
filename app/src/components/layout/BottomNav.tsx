'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

// ── Icons ──────────────────────────────────────────────────────────────────
const HomeOutline = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 10.5 12 3.5l8.5 7"/>
    <path d="M5.5 9v10.5a1 1 0 0 0 1 1h3.5v-5.5h4v5.5h3.5a1 1 0 0 0 1-1V9"/>
  </svg>
);
const HomeFill = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5.5 9.2V19.5a1 1 0 0 0 1 1h3.5V15a.9.9 0 0 1 .9-.9h2.2a.9.9 0 0 1 .9.9v5.5h3.5a1 1 0 0 0 1-1V9.2L12 3.8 5.5 9.2Z" fill="currentColor" stroke="none"/>
  </svg>
);

const SearchOutline = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10.5" cy="10.5" r="6.5"/>
    <path d="m15.5 15.5 4.5 4.5"/>
  </svg>
);
const SearchFill = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10.5" cy="10.5" r="6.5" fill="currentColor" stroke="none"/>
    <path d="m15.5 15.5 4.5 4.5" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const LogOutline = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 8v4l2.5 2.5"/>
    <path d="M16.5 7.5 18 6"/>
  </svg>
);
const LogFill = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none"/>
    <path d="M12 8v4l2.5 2.5" stroke="#fff"/>
    <path d="M16.5 7.5 18 6" stroke="currentColor"/>
  </svg>
);

const ProfileOutline = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="3.75"/>
    <path d="M4.5 20c0-3.8 3.4-6.5 7.5-6.5s7.5 2.7 7.5 6.5"/>
  </svg>
);
const ProfileFill = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="3.75" fill="currentColor" stroke="none"/>
    <path d="M4.5 20.5c0-3.8 3.4-6.8 7.5-6.8s7.5 3 7.5 6.8" fill="currentColor" stroke="none"/>
  </svg>
);

const NAV_ITEMS = [
  { href: '/dashboard', prefix: '/dashboard', label: 'Home',    Outline: HomeOutline,    Fill: HomeFill    },
  { href: '/eat',       prefix: '/eat',       label: 'Search',  Outline: SearchOutline,  Fill: SearchFill  },
  { href: '/log',       prefix: '/log',       label: 'Log',     Outline: LogOutline,     Fill: LogFill     },
  { href: '/me',        prefix: '/me',        label: 'Profile', Outline: ProfileOutline, Fill: ProfileFill },
];

const GREEN = '#1E7F5C';
const MUTED = '#8B95A7';

export default function BottomNav() {
  const path     = usePathname();
  // useAuth available for future conditional nav items
  const { user } = useAuth();
  void user;

  const navItems = NAV_ITEMS;

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderTop: '1px solid #E5E9F2',
      padding: '8px 0 max(20px, env(safe-area-inset-bottom))',
    }}>
      <div style={{ maxWidth: 500, margin: '0 auto', display: 'flex', alignItems: 'center' }}>
        {navItems.map((item) => {
          const active = path === item.prefix || path.startsWith(item.prefix + '/');
          const Icon   = active ? item.Fill : item.Outline;
          const color  = active ? GREEN : MUTED;
          return (
            <Link key={item.prefix} href={item.href} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3,
              padding: '4px 0', textDecoration: 'none', color,
              transition: 'color .15s',
            }}>
              <Icon />
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.02em' }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
