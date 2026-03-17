'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { useStrideStore } from '@/lib/store';
import type { GoalType, DietaryFlag, UserProfile } from '@/types';

// ─── Step definitions — Goal first, account last ─────────────────────────────
const STEPS = ['Goal', 'Body', 'Diet', 'Account', 'Done'];

const GOALS: { key: GoalType; emoji: string; title: string; desc: string; color: string }[] = [
  { key: 'weight_loss', emoji: '📉', title: 'Lose Weight',  desc: 'Burn more than I eat through a calorie deficit', color: '#FF6B6B' },
  { key: 'muscle_gain', emoji: '💪', title: 'Build Muscle', desc: 'Increase strength and lean mass with more protein',  color: '#4A90D9' },
  { key: 'maintenance', emoji: '⚖️', title: 'Stay Healthy', desc: 'Maintain current weight and build better habits',   color: '#4CAF82' },
];

const ACTIVITY_LEVELS = [
  { key: 'sedentary',   label: 'Sedentary',  desc: 'Desk job, little or no exercise'    },
  { key: 'light',       label: 'Light',       desc: '1–3 days of exercise per week'      },
  { key: 'moderate',    label: 'Moderate',    desc: '3–5 days of exercise per week'      },
  { key: 'active',      label: 'Active',      desc: '6–7 days of hard exercise'          },
  { key: 'very_active', label: 'Very Active', desc: 'Physical job + hard daily exercise' },
];

const DIETARY_OPTIONS: { key: DietaryFlag; label: string; emoji: string }[] = [
  { key: 'vegetarian',   label: 'Vegetarian',  emoji: '🥦' },
  { key: 'vegan',        label: 'Vegan',        emoji: '🌱' },
  { key: 'gluten_free',  label: 'Gluten-Free',  emoji: '🌾' },
  { key: 'lactose_free', label: 'Lactose-Free', emoji: '🥛' },
  { key: 'keto',         label: 'Keto',         emoji: '🥑' },
  { key: 'halal',        label: 'Halal',        emoji: '☪️' },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const { completeOnboarding } = useStrideStore();

  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const [data, setData] = useState({
    // Goal (step 0)
    goalType:      'weight_loss' as GoalType,
    // Body (step 1)
    age:           27,
    heightCm:      170,
    currentWeight: 75,
    targetWeight:  65,
    activityLevel: 'moderate' as UserProfile['activityLevel'],
    // Diet (step 2)
    dietaryFlags:  [] as DietaryFlag[],
    // Account (step 3)
    name:     '',
    email:    '',
    password: '',
  });

  const update     = (key: string, value: unknown) => setData(d => ({ ...d, [key]: value }));
  const toggleDiet = (flag: DietaryFlag) => setData(d => ({
    ...d,
    dietaryFlags: d.dietaryFlags.includes(flag)
      ? d.dietaryFlags.filter(f => f !== flag)
      : [...d.dietaryFlags, flag],
  }));

  function canAdvance(): { ok: boolean; msg?: string } {
    if (step === 3) { // Account step validation
      if (!data.name.trim())        return { ok: false, msg: 'Please enter your name' };
      if (!data.email.trim())       return { ok: false, msg: 'Please enter your email' };
      if (data.password.length < 6) return { ok: false, msg: 'Password must be at least 6 characters' };
    }
    return { ok: true };
  }

  function next() {
    const { ok, msg } = canAdvance();
    if (!ok) { setError(msg ?? ''); return; }
    setError('');
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError('');
    setStep(s => Math.max(s - 1, 0));
  }

  // ── Final submit: create Firebase account + save profile ──
  async function finish() {
    setError('');
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(user, { displayName: data.name });

      await setDoc(doc(db, 'users', user.uid), {
        name:      data.name,
        email:     data.email.toLowerCase(),
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'profiles', user.uid), {
        age:           data.age,
        heightCm:      data.heightCm,
        weightKg:      data.currentWeight,
        goalWeightKg:  data.targetWeight,
        activityLevel: data.activityLevel,
        goal:          data.goalType,
        dietaryFlags:  data.dietaryFlags,
        updatedAt:     serverTimestamp(),
      });

      // Also persist to Zustand so the dashboard works immediately
      completeOnboarding({
        name:          data.name,
        email:         data.email,
        goalType:      data.goalType,
        currentWeight: data.currentWeight,
        targetWeight:  data.targetWeight,
        heightCm:      data.heightCm,
        age:           data.age,
        activityLevel: data.activityLevel,
        dietaryFlags:  data.dietaryFlags,
      });

      router.push('/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';

      if (code === 'auth/email-already-in-use')     setError('This email is already registered — sign in instead.');
      else if (code === 'auth/invalid-email')        setError('Please enter a valid email address.');
      else if (code === 'auth/weak-password')        setError('Password must be at least 6 characters.');
      else if (code === 'auth/operation-not-allowed') setError('Email/Password sign-in is not enabled. Go to Firebase Console → Authentication → Sign-in method → Email/Password and enable it.');
      else if (code === 'auth/network-request-failed') setError('Network error. Check your connection and try again.');
      else setError(`Error: ${code || String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f2f5' }}>

      {/* Progress bar */}
      <div style={{ height: 4, background: '#e8eaed' }}>
        <div style={{ height: '100%', background: '#4CAF82', width: `${progress}%`, transition: 'width .4s ease' }}/>
      </div>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', background: '#fff', borderBottom: '1px solid #eee',
      }}>
        <button onClick={() => step === 0 ? router.push('/') : back()} style={{
          background: 'none', border: 'none', fontSize: 14, fontWeight: 600, color: '#888', cursor: 'pointer',
        }}>
          ← Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <span style={{ fontWeight: 800, color: '#1a1a2e', fontSize: 16 }}>Stride</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#bbb' }}>{step + 1} / {STEPS.length}</span>
      </div>

      <div style={{ flex: 1, maxWidth: 440, width: '100%', margin: '0 auto', padding: '24px 20px 40px' }}>

        {/* ── Step 0: Goal ── */}
        {step === 0 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 6 }}>What&apos;s your goal?</h2>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
              We&apos;ll personalise your calorie and macro targets around this.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {GOALS.map(g => {
                const sel = data.goalType === g.key;
                return (
                  <button key={g.key} onClick={() => update('goalType', g.key)} style={{
                    width: '100%', borderRadius: 16, padding: 16, textAlign: 'left',
                    background: sel ? `${g.color}10` : '#fff',
                    border: `2px solid ${sel ? g.color : '#e8eaed'}`,
                    cursor: 'pointer', transition: 'all .2s',
                    boxShadow: '0 2px 8px rgba(0,0,0,.05)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span style={{ fontSize: 30 }}>{g.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: sel ? g.color : '#1a1a2e', fontSize: 15 }}>{g.title}</div>
                        <div style={{ fontSize: 13, color: '#888', marginTop: 3 }}>{g.desc}</div>
                      </div>
                      {sel && <span style={{ fontSize: 18 }}>✅</span>}
                    </div>
                  </button>
                );
              })}
            </div>
            <p style={{ textAlign: 'center', color: '#aaa', fontSize: 13, marginTop: 8 }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#4A90D9', fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>
        )}

        {/* ── Step 1: Body ── */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 6 }}>Tell us about you</h2>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>Used to calculate your calorie needs accurately.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 6 }}>Age</label>
                  <input type="number" className="form-input" value={data.age}
                    onChange={e => update('age', Number(e.target.value))}/>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 6 }}>Height (cm)</label>
                  <input type="number" className="form-input" value={data.heightCm}
                    onChange={e => update('heightCm', Number(e.target.value))}/>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 6 }}>Current weight (kg)</label>
                  <input type="number" className="form-input" value={data.currentWeight}
                    onChange={e => update('currentWeight', Number(e.target.value))}/>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 6 }}>Target weight (kg)</label>
                  <input type="number" className="form-input" value={data.targetWeight}
                    onChange={e => update('targetWeight', Number(e.target.value))}/>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 10 }}>Activity level</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ACTIVITY_LEVELS.map(a => {
                    const sel = data.activityLevel === a.key;
                    return (
                      <button key={a.key} onClick={() => update('activityLevel', a.key as UserProfile['activityLevel'])}
                        style={{
                          borderRadius: 12, padding: '12px 14px', textAlign: 'left',
                          background: sel ? 'rgba(76,175,130,.10)' : '#fff',
                          border: `1.5px solid ${sel ? '#4CAF82' : '#e8eaed'}`,
                          cursor: 'pointer', transition: 'all .2s',
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: sel ? '#4CAF82' : '#1a1a2e' }}>{a.label}</div>
                            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{a.desc}</div>
                          </div>
                          {sel && <span style={{ fontSize: 16 }}>✅</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Diet ── */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 6 }}>Dietary preferences</h2>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
              Select any that apply — or skip. You can change these later.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {DIETARY_OPTIONS.map(d => {
                const sel = data.dietaryFlags.includes(d.key);
                return (
                  <button key={d.key} onClick={() => toggleDiet(d.key)} style={{
                    borderRadius: 16, padding: '14px 12px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: sel ? 'rgba(76,175,130,.10)' : '#fff',
                    border: `2px solid ${sel ? '#4CAF82' : '#e8eaed'}`,
                    cursor: 'pointer', transition: 'all .2s',
                  }}>
                    <span style={{ fontSize: 22 }}>{d.emoji}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: sel ? '#4CAF82' : '#555' }}>{d.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 3: Account ── */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 6 }}>Create your account</h2>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>Free forever. Your data stays yours.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 6 }}>Your name</label>
                <input className="form-input" placeholder="e.g. Ming"
                  value={data.name} onChange={e => update('name', e.target.value)} autoFocus/>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 6 }}>Email</label>
                <input type="email" className="form-input" placeholder="you@example.com"
                  value={data.email} onChange={e => update('email', e.target.value)}/>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 6 }}>Password</label>
                <input type="password" className="form-input" placeholder="Min 6 characters"
                  value={data.password} onChange={e => update('password', e.target.value)}/>
              </div>
            </div>
            {error && <p style={{ color: '#e53e3e', fontSize: 13, marginTop: 12, textAlign: 'center' }}>{error}</p>}
            <p style={{ textAlign: 'center', color: '#aaa', fontSize: 13, marginTop: 16 }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#4A90D9', fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>
        )}

        {/* ── Step 4: Done ── */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 24 }}>
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: 'rgba(76,175,130,.15)', border: '2px solid #4CAF82',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 48, marginBottom: 20,
            }}>⚡</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>
              You&apos;re all set, {data.name || 'Athlete'}!
            </h2>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 28, lineHeight: 1.6 }}>
              Your personalised calorie and macro targets are ready.<br/>Time to start tracking!
            </p>
            <div style={{
              width: '100%', borderRadius: 20, padding: 16, marginBottom: 24,
              background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,.08)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: 1, marginBottom: 12 }}>YOUR SETUP</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { l: 'Goal',     v: GOALS.find(g => g.key === data.goalType)?.title ?? '', c: '#4CAF82' },
                  { l: 'Activity', v: data.activityLevel.replace('_', ' '),                  c: '#4A90D9' },
                ].map(i => (
                  <div key={i.l} style={{ borderRadius: 12, padding: 12, background: '#f5f7fa' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: i.c, textTransform: 'capitalize' }}>{i.v}</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 3 }}>{i.l}</div>
                  </div>
                ))}
              </div>
            </div>
            {error && (
              <div style={{
                width: '100%', borderRadius: 12, padding: '12px 14px', marginBottom: 16,
                background: '#fff5f5', border: '1px solid #fed7d7',
              }}>
                <p style={{ color: '#c53030', fontSize: 13, lineHeight: 1.5, margin: 0 }}>{error}</p>
              </div>
            )}
            <button onClick={finish} disabled={loading} className="btn-primary"
              style={{ width: '100%', padding: '14px 0', fontSize: 16, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating your account…' : '🚀 Start Tracking'}
            </button>
          </div>
        )}

        {/* Continue button (steps 0–3 except step 3 which uses the same next()) */}
        {step < 4 && (
          <div style={{ marginTop: 28 }}>
            <button onClick={next} className="btn-primary" style={{ width: '100%', padding: '14px 0', fontSize: 16 }}>
              Continue →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
