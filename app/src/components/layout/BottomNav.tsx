'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* ── Icons — slightly heavier stroke on active ─────────────────────────── */
function IconHome({ active }: { active: boolean }) {
  const sw = active ? '2' : '1.6';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 10.5 12 3.5l8.5 7"/>
      <path d={active ? 'M5.5 9.2V19.5a1 1 0 0 0 1 1h3.5V15a.9.9 0 0 1 .9-.9h2.2a.9.9 0 0 1 .9.9v5.5h3.5a1 1 0 0 0 1-1V9.2' : 'M5.5 9v10.5a1 1 0 0 0 1 1h3.5v-5.5h4v5.5h3.5a1 1 0 0 0 1-1V9'} fill={active ? 'currentColor' : 'none'} stroke={active ? 'none' : 'currentColor'}/>
    </svg>
  );
}

function IconSearch({ active }: { active: boolean }) {
  const sw = active ? '2' : '1.6';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10.5" cy="10.5" r="6.5" fill={active ? 'currentColor' : 'none'}/>
      <path d="m15.5 15.5 4.5 4.5" stroke="currentColor" strokeWidth={active ? '2.2' : '1.6'}/>
    </svg>
  );
}

function IconLog({ active }: { active: boolean }) {
  const sw = active ? '2' : '1.6';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" fill={active ? 'currentColor' : 'none'}/>
      <path d="M12 8v4l2.5 2.5" stroke={active ? '#fff' : 'currentColor'} strokeWidth={sw}/>
    </svg>
  );
}

function IconProfile({ active }: { active: boolean }) {
  const sw = active ? '2' : '1.6';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.75" fill={active ? 'currentColor' : 'none'}/>
      <path d={active ? 'M4.5 20.5c0-3.8 3.4-6.8 7.5-6.8s7.5 3 7.5 6.8' : 'M4.5 20c0-3.8 3.4-6.5 7.5-6.5s7.5 2.7 7.5 6.5'} fill={active ? 'currentColor' : 'none'} stroke={active ? 'none' : 'currentColor'}/>
    </svg>
  );
}

const NAV = [
  { href: '/dashboard', prefix: '/dashboard', label: 'Home', Icon: IconHome },
  { href: '/eat', prefix: '/eat', label: 'Search',  Icon: IconSearch  },
  { href: '/log', prefix: '/log', label: 'Log',     Icon: IconLog     },
  { href: '/me',  prefix: '/me',  label: 'Profile', Icon: IconProfile },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'rgba(255,255,255,0.96)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderTop: '1px solid #e5ebe4',
      padding: '8px 0 max(20px, env(safe-area-inset-bottom))',
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'center' }}>
        {NAV.map(({ href, prefix, label, Icon }) => {
          const active = path === prefix || path.startsWith(prefix + '/');
          return (
            <Link key={href} href={href} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '4px 0', textDecoration: 'none',
              color: active ? '#0e7a4f' : '#8a978f',
              transition: 'color .15s',
            }}>
              <Icon active={active} />
              <span style={{
                fontSize: 10, fontWeight: active ? 700 : 600,
                fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
                letterSpacing: '0.01em',
              }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
