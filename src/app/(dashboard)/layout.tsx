'use client';
import BottomNav from '@/components/layout/BottomNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#F7F8FB' }}>
      <main className="mx-auto max-w-lg pb-28">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
