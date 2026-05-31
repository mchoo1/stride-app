'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStrideStore } from '@/lib/store';
import BottomNav from '@/components/layout/BottomNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const { profile } = useStrideStore();
  const [hydrated, setHydrated] = useState(false);

  // Wait one tick for Zustand persist to rehydrate from localStorage
  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (hydrated && !profile.onboardingComplete) {
      router.replace('/onboarding');
    }
  }, [hydrated, profile.onboardingComplete, router]);

  if (!hydrated) return null;
  if (!profile.onboardingComplete) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <main className="mx-auto max-w-lg pb-28">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
