'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function LogLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Food / Activity tab switcher */}
      <div style={{
        display: 'flex',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}>
        <Link
          href="/log/food"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '14px 0',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 700,
            borderBottom: path === '/log/food' ? '2px solid #4CAF82' : '2px solid transparent',
            color: path === '/log/food' ? '#4CAF82' : '#aaa',
            transition: 'color .2s',
          }}
        >
          🍽️ Food
        </Link>
        <Link
          href="/log/activity"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '14px 0',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 700,
            borderBottom: path === '/log/activity' ? '2px solid #4E9BFF' : '2px solid transparent',
            color: path === '/log/activity' ? '#4E9BFF' : '#aaa',
            transition: 'color .2s',
          }}
        >
          🏃 Activity
        </Link>
      </div>

      {/* Page content */}
      <div style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
}
