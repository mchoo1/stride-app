'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F8FB' }}>
        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '2px solid #E5E9F2', borderTopColor: '#1E7F5C' }} />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
