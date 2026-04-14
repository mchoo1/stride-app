'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard', activePrefix: '/dashboard', emoji: '🏠', label: 'Home'  },
  { href: '/scan',      activePrefix: '/scan',       emoji: '📷', label: 'Scan'  },
  { href: '/eat',       activePrefix: '/eat',        emoji: '🍜', label: 'Eat'   },
  { href: '/move',      activePrefix: '/move',       emoji: '🏃', label: 'Move'  },
  { href: '/me',        activePrefix: '/me',         emoji: '👤', label: 'Me'    },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: '#fff',
      borderTop: '1px solid #eee',
      padding: '8px 0 max(12px, env(safe-area-inset-bottom))',
    }}>
      <div style={{
        maxWidth: 500, margin: '0 auto',
        display: 'flex', alignItems: 'center',
      }}>
        {NAV_ITEMS.map((item) => {
          const active =
            path === item.activePrefix ||
            path.startsWith(item.activePrefix + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3,
                padding: '4px 0', textDecoration: 'none',
                border: 'none', background: 'none', cursor: 'pointer',
              }}
            >
              <span style={{
                fontSize: 20, lineHeight: 1,
                filter: active ? 'none' : 'grayscale(1) opacity(0.40)',
                transition: 'filter .2s',
              }}>
                {item.emoji}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: active ? '#4CAF82' : '#bbb',
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
