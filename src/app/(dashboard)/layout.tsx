'use client';
import BottomNav from '@/components/layout/BottomNav';
import { AuthGuard } from '@/components/AuthGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <main className="mx-auto max-w-lg pb-28">
          {children}
        </main>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
