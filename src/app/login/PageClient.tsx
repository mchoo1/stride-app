'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import StrideWordmark from '@/components/StrideWordmark';

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#F7F8FB' }}
    >
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="flex justify-center mb-8">
          <StrideWordmark height={44} />
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E9F2',
            boxShadow: '0 1px 2px rgba(15,27,45,0.04), 0 1px 3px rgba(15,27,45,0.03)',
          }}
        >
          <h1
            className="text-xl font-bold mb-1"
            style={{ color: '#0F1B2D' }}
          >
            Welcome back
          </h1>
          <p className="text-sm mb-6" style={{ color: '#8B95A7' }}>
            Sign in to continue tracking
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 14px',
                borderRadius: 12,
                background: '#F7F8FB',
                border: '1px solid #E5E9F2',
                color: '#0F1B2D',
                fontSize: 15,
                outline: 'none',
                transition: 'border-color .15s',
              }}
              onFocus={e => (e.target.style.borderColor = '#1E7F5C')}
              onBlur={e  => (e.target.style.borderColor = '#E5E9F2')}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 14px',
                borderRadius: 12,
                background: '#F7F8FB',
                border: '1px solid #E5E9F2',
                color: '#0F1B2D',
                fontSize: 15,
                outline: 'none',
                transition: 'border-color .15s',
              }}
              onFocus={e => (e.target.style.borderColor = '#1E7F5C')}
              onBlur={e  => (e.target.style.borderColor = '#E5E9F2')}
            />

            {error && (
              <p className="text-sm text-center" style={{ color: '#D04E36' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'block',
                width: '100%',
                padding: '13px 0',
                borderRadius: 12,
                background: '#1E7F5C',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 15,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.65 : 1,
                boxShadow: '0 6px 20px rgba(30,127,92,0.25)',
                transition: 'opacity .15s',
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: '#8B95A7' }}>
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-semibold"
            style={{ color: '#1E7F5C' }}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
