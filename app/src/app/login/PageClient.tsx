'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import StrideWordmark from '@/components/StrideWordmark';

export default function LoginPage() {
  const router = useRouter();
  const [email,       setEmail      ] = useState('');
  const [password,    setPassword   ] = useState('');
  const [error,       setError      ] = useState('');
  const [loading,     setLoading    ] = useState(false);

  // Forgot password state
  const [showReset,   setShowReset  ] = useState(false);
  const [resetEmail,  setResetEmail ] = useState('');
  const [resetSent,   setResetSent  ] = useState(false);
  const [resetLoading,setResetLoading] = useState(false);
  const [resetError,  setResetError ] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!auth) throw new Error('Firebase not configured');
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Try again later or reset your password.');
      } else if (code === 'auth/network-request-failed') {
        setError('Network error. Check your connection and try again.');
      } else {
        setError('Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setResetError('');
    if (!resetEmail.trim() || !/\S+@\S+\.\S+/.test(resetEmail)) {
      setResetError('Please enter a valid email address.');
      return;
    }
    setResetLoading(true);
    try {
      if (!auth) throw new Error('Firebase not configured');
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSent(true);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      // Don't reveal whether email exists — always show success
      if (code === 'auth/network-request-failed') {
        setResetError('Network error. Check your connection and try again.');
      } else {
        setResetSent(true); // treat all other errors as success for privacy
      }
    } finally {
      setResetLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    display: 'block', width: '100%',
    padding: '12px 14px', borderRadius: 12,
    background: '#F7F8FB', border: '1px solid #E5E9F2',
    color: '#0F1B2D', fontSize: 15, outline: 'none',
    transition: 'border-color .15s', boxSizing: 'border-box',
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F7F8FB' }}>
      <div className="w-full max-w-sm">

        {/* Wordmark */}
        <div className="flex justify-center mb-8">
          <StrideWordmark height={44} />
        </div>

        {/* ── Forgot password panel ── */}
        {showReset ? (
          <div className="rounded-2xl p-7" style={{ background: '#FFFFFF', border: '1px solid #E5E9F2', boxShadow: '0 1px 2px rgba(15,27,45,0.04), 0 1px 3px rgba(15,27,45,0.03)' }}>
            {resetSent ? (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F1B2D', marginBottom: 8 }}>Check your inbox</h2>
                <p style={{ fontSize: 13, color: '#8B95A7', lineHeight: 1.6, marginBottom: 24 }}>
                  If <strong>{resetEmail}</strong> is registered, a password reset link is on its way. Check your spam folder if you don't see it.
                </p>
                <button
                  onClick={() => { setShowReset(false); setResetSent(false); setResetEmail(''); setEmail(resetEmail); }}
                  style={{ width: '100%', padding: '13px 0', borderRadius: 12, background: '#1E7F5C', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F1B2D', marginBottom: 6 }}>Reset your password</h2>
                <p style={{ fontSize: 13, color: '#8B95A7', marginBottom: 20 }}>
                  Enter your email and we'll send a reset link.
                </p>
                <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input
                    type="email" placeholder="Email" value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)} required
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#1E7F5C')}
                    onBlur={e  => (e.target.style.borderColor = '#E5E9F2')}
                    autoFocus
                  />
                  {resetError && <p style={{ fontSize: 13, color: '#D04E36', textAlign: 'center', margin: 0 }}>{resetError}</p>}
                  <button type="submit" disabled={resetLoading} style={{
                    padding: '13px 0', borderRadius: 12, background: '#1E7F5C', color: '#fff',
                    fontWeight: 700, fontSize: 15, border: 'none', cursor: resetLoading ? 'not-allowed' : 'pointer',
                    opacity: resetLoading ? 0.65 : 1,
                  }}>
                    {resetLoading ? 'Sending…' : 'Send reset link'}
                  </button>
                  <button type="button" onClick={() => { setShowReset(false); setResetError(''); }} style={{
                    padding: '11px 0', borderRadius: 12, border: '1px solid #E5E9F2',
                    background: '#F7F8FB', color: '#8B95A7', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  }}>
                    ← Back to sign in
                  </button>
                </form>
              </>
            )}
          </div>
        ) : (
          /* ── Sign in card ── */
          <div className="rounded-2xl p-7" style={{ background: '#FFFFFF', border: '1px solid #E5E9F2', boxShadow: '0 1px 2px rgba(15,27,45,0.04), 0 1px 3px rgba(15,27,45,0.03)' }}>
            <h1 className="text-xl font-bold mb-1" style={{ color: '#0F1B2D' }}>Welcome back</h1>
            <p className="text-sm mb-6" style={{ color: '#8B95A7' }}>Sign in to continue tracking</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                type="email" placeholder="Email" value={email}
                onChange={e => setEmail(e.target.value)} required
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#1E7F5C')}
                onBlur={e  => (e.target.style.borderColor = '#E5E9F2')}
              />
              <div>
                <input
                  type="password" placeholder="Password" value={password}
                  onChange={e => setPassword(e.target.value)} required
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = '#1E7F5C')}
                  onBlur={e  => (e.target.style.borderColor = '#E5E9F2')}
                />
                {/* Forgot password link */}
                <button
                  type="button"
                  onClick={() => { setShowReset(true); setResetEmail(email); setResetError(''); setResetSent(false); }}
                  style={{ background: 'none', border: 'none', padding: '6px 0 0', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#8B95A7', display: 'block' }}
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <div style={{ borderRadius: 10, padding: '10px 12px', background: '#fff5f5', border: '1px solid #fecaca' }}>
                  <p style={{ color: '#c53030', fontSize: 13, margin: 0, textAlign: 'center' }}>{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                padding: '13px 0', borderRadius: 12, background: '#1E7F5C', color: '#FFFFFF',
                fontWeight: 700, fontSize: 15, border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.65 : 1,
                boxShadow: '0 6px 20px rgba(30,127,92,0.25)', transition: 'opacity .15s',
              }}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-sm mt-5" style={{ color: '#8B95A7' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold" style={{ color: '#1E7F5C' }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
