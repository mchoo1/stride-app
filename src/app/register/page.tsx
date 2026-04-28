'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile, fetchSignInMethodsForEmail } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { useStrideStore } from '@/lib/store';
import type { GoalType, DietaryFlag, UserProfile } from '@/types';
import StrideWordmark from '@/components/StrideWordmark';
import StrideIcon from '@/components/StrideIcon';

// ─── Steps: Account → Goal & Diet → Body → Done ──────────────────────────────
const STEPS = ['Account', 'Goal & Diet', 'Body', 'Done'];

const GOALS: { key: GoalType; emoji: string; title: string; desc: string; color: string }[] = [
  { key: 'weight_loss', emoji: '📉', title: 'Lose Weight',  desc: 'Calorie deficit to shed body fat',          color: '#FF6B6B' },
  { key: 'muscle_gain', emoji: '💪', title: 'Build Muscle', desc: 'Surplus + more protein for lean gains',      color: '#4A90D9' },
  { key: 'maintenance', emoji: '⚖️', title: 'Stay Healthy', desc: 'Maintain weight, build better habits',       color: '#4CAF82' },
];

const ACTIVITY_LEVELS = [
  { key: 'sedentary',   label: 'Sedentary',   desc: 'Desk job, little or no exercise'    },
  { key: 'light',       label: 'Light',        desc: '1–3 days of exercise per week'      },
  { key: 'moderate',    label: 'Moderate',     desc: '3–5 days of exercise per week'      },
  { key: 'active',      label: 'Active',       desc: '6–7 days of hard exercise'          },
  { key: 'very_active', label: 'Very Active',  desc: 'Physical job + hard daily exercise' },
];

const DIETARY_OPTIONS: { key: DietaryFlag; label: string; emoji: string }[] = [
  { key: 'halal',        label: 'Halal',        emoji: '☪️' },
  { key: 'vegetarian',   label: 'Vegetarian',   emoji: '🥦' },
  { key: 'vegan',        label: 'Vegan',        emoji: '🌱' },
  { key: 'pescatarian',  label: 'Pescatarian',  emoji: '🐟' },
  { key: 'gluten_free',  label: 'Gluten-Free',  emoji: '🌾' },
  { key: 'lactose_free', label: 'Lactose-Free', emoji: '🥛' },
  { key: 'dairy_free',   label: 'Dairy-Free',   emoji: '🧀' },
  { key: 'nut_free',     label: 'Nut-Free',     emoji: '🥜' },
  { key: 'keto',         label: 'Keto',         emoji: '🥑' },
  { key: 'low_carb',     label: 'Low-Carb',     emoji: '🍞' },
  { key: 'high_protein', label: 'High-Protein', emoji: '💪' },
  { key: 'no_pork',      label: 'No Pork',      emoji: '🐷' },
  { key: 'kosher',       label: 'Kosher',       emoji: '✡️' },
];

// ─── Shared styles ────────────────────────────────────────────────────────────
const sectionTitle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: '#8B95A7',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  marginBottom: 10, marginTop: 20,
};
const divider: React.CSSProperties = {
  height: 1, background: '#E5E9F2', margin: '20px 0',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const { completeOnboarding } = useStrideStore();

  const [step,          setStep]         = useState(0);
  const [loading,       setLoading]      = useState(false);
  const [error,         setError]        = useState('');
  const [emailChecking, setEmailChecking] = useState(false);

  const [data, setData] = useState({
    name:          '',
    email:         '',
    password:      '',
    goalType:      'weight_loss' as GoalType,
    dietaryFlags:  [] as DietaryFlag[],
    gender:        'male' as 'male' | 'female' | 'other',
    age:           27,
    heightCm:      170,
    currentWeight: 75,
    targetWeight:  65,
    activityLevel: 'moderate' as UserProfile['activityLevel'],
  });

  const [rawNums, setRawNums] = useState({ age: '27', height: '170', cw: '75', tw: '65' });
  const setRaw = (key: keyof typeof rawNums, val: string) => {
    setRawNums(r => ({ ...r, [key]: val }));
    const n = Number(val);
    if (!isNaN(n) && val !== '') {
      if (key === 'age')    setData(d => ({ ...d, age:           n }));
      if (key === 'height') setData(d => ({ ...d, heightCm:      n }));
      if (key === 'cw')     setData(d => ({ ...d, currentWeight: n }));
      if (key === 'tw')     setData(d => ({ ...d, targetWeight:  n }));
    }
  };

  const update     = (key: string, val: unknown) => setData(d => ({ ...d, [key]: val }));
  const toggleDiet = (flag: DietaryFlag) => setData(d => ({
    ...d,
    dietaryFlags: d.dietaryFlags.includes(flag)
      ? d.dietaryFlags.filter(f => f !== flag)
      : [...d.dietaryFlags, flag],
  }));

  // ── Step 0 validation: name / email / password + duplicate-email check ──────
  async function validateAccount(): Promise<boolean> {
    if (!data.name.trim())                     { setError('Please enter your name');              return false; }
    if (!data.email.trim())                    { setError('Please enter your email');             return false; }
    if (!/\S+@\S+\.\S+/.test(data.email))     { setError('Please enter a valid email');          return false; }
    if (data.password.length < 6)              { setError('Password must be at least 6 characters'); return false; }

    setEmailChecking(true);
    try {
      const methods = await fetchSignInMethodsForEmail(auth, data.email);
      if (methods.length > 0) {
        setError('This email is already registered — sign in instead.');
        return false;
      }
    } catch { /* network issue — let Firebase handle it at submit */ }
    finally { setEmailChecking(false); }
    return true;
  }

  async function next() {
    setError('');
    if (step === 0) {
      const ok = await validateAccount();
      if (!ok) return;
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  }
  const back = () => { setError(''); setStep(s => Math.max(s - 1, 0)); };

  // ── Final submit ─────────────────────────────────────────────────────────────
  async function finish() {
    setError('');
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(user, { displayName: data.name });

      completeOnboarding({
        name:          data.name,
        email:         data.email,
        gender:        data.gender,
        goalType:      data.goalType,
        currentWeight: data.currentWeight || Number(rawNums.cw)     || 75,
        targetWeight:  data.targetWeight  || Number(rawNums.tw)     || 65,
        heightCm:      data.heightCm      || Number(rawNums.height) || 170,
        age:           data.age           || Number(rawNums.age)    || 27,
        activityLevel: data.activityLevel,
        dietaryFlags:  data.dietaryFlags,
      });

      Promise.all([
        setDoc(doc(db, 'users', user.uid), {
          name: data.name, email: data.email.toLowerCase(), createdAt: serverTimestamp(),
        }),
        setDoc(doc(db, 'profiles', user.uid), {
          age: data.age, heightCm: data.heightCm,
          weightKg: data.currentWeight, goalWeightKg: data.targetWeight,
          activityLevel: data.activityLevel, goal: data.goalType,
          dietaryFlags: data.dietaryFlags, updatedAt: serverTimestamp(),
        }),
      ]).catch(() => {});

      router.push('/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/email-already-in-use')       setError('This email is already registered — sign in instead.');
      else if (code === 'auth/invalid-email')          setError('Please enter a valid email address.');
      else if (code === 'auth/weak-password')          setError('Password must be at least 6 characters.');
      else if (code === 'auth/operation-not-allowed')  setError('Email/Password sign-in is not enabled. Check Firebase Console → Authentication → Sign-in method.');
      else if (code === 'auth/network-request-failed') setError('Network error. Check your connection and try again.');
      else setError(`Error: ${code || String(err)}`);
    } finally { setLoading(false); }
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F7F8FB' }}>

      {/* Progress bar */}
      <div style={{ height: 4, background: '#E5E9F2' }}>
        <div style={{ height: '100%', background: '#1E7F5C', width: `${progress}%`, transition: 'width .4s ease' }} />
      </div>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', background: '#fff', borderBottom: '1px solid #E5E9F2',
      }}>
        <button onClick={() => step === 0 ? router.push('/') : back()} style={{
          background: 'none', border: 'none', fontSize: 14, fontWeight: 600,
          color: '#8B95A7', cursor: 'pointer',
        }}>← Back</button>
        <StrideWordmark height={26} />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#C8D0DC' }}>
          {step + 1} / {STEPS.length}
        </span>
      </div>

      <div style={{ flex: 1, maxWidth: 480, width: '100%', margin: '0 auto', padding: '28px 20px 48px', overflowY: 'auto' }}>

        {/* ══ Step 0: Account ══════════════════════════════════════════════════ */}
        {step === 0 && (
          <>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0F1B2D', margin: '0 0 6px' }}>
              Create your account
            </h2>
            <p style={{ fontSize: 14, color: '#8B95A7', marginBottom: 28 }}>Free forever. Your data stays yours.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5B6576', marginBottom: 6 }}>Your name</label>
                <input className="form-input" placeholder="e.g. Ming"
                  value={data.name} onChange={e => update('name', e.target.value)} autoFocus />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5B6576', marginBottom: 6 }}>Email</label>
                <input type="email" className="form-input" placeholder="you@example.com"
                  value={data.email} onChange={e => { update('email', e.target.value); setError(''); }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5B6576', marginBottom: 6 }}>Password</label>
                <input type="password" className="form-input" placeholder="Min 6 characters"
                  value={data.password} onChange={e => update('password', e.target.value)} />
              </div>
            </div>

            {error && (
              <div style={{
                marginTop: 14, borderRadius: 12, padding: '12px 14px',
                background: error.includes('already registered') ? 'rgba(46,111,184,0.06)' : '#fff5f5',
                border: `1px solid ${error.includes('already registered') ? 'rgba(46,111,184,0.20)' : '#fecaca'}`,
              }}>
                <p style={{ color: error.includes('already registered') ? '#2E6FB8' : '#c53030', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                  {error}
                  {error.includes('already registered') && (
                    <>{' '}<Link href="/login" style={{ color: '#2E6FB8', fontWeight: 700 }}>Sign in →</Link></>
                  )}
                </p>
              </div>
            )}

            <p style={{ textAlign: 'center', color: '#C8D0DC', fontSize: 13, marginTop: 20 }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#1E7F5C', fontWeight: 600 }}>Sign in</Link>
            </p>
          </>
        )}

        {/* ══ Step 1: Goal & Diet ══════════════════════════════════════════════ */}
        {step === 1 && (
          <>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0F1B2D', margin: '0 0 6px' }}>
              Goal &amp; preferences
            </h2>
            <p style={{ fontSize: 14, color: '#8B95A7', marginBottom: 24 }}>
              We&apos;ll tailor your calorie targets and food recommendations to match.
            </p>

            {/* ── Goal ── */}
            <div style={sectionTitle}>Your goal</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {GOALS.map(g => {
                const sel = data.goalType === g.key;
                return (
                  <button key={g.key} onClick={() => update('goalType', g.key)} style={{
                    width: '100%', borderRadius: 16, padding: '14px 16px', textAlign: 'left',
                    background: sel ? `${g.color}12` : '#fff',
                    border: `2px solid ${sel ? g.color : '#E5E9F2'}`,
                    cursor: 'pointer', transition: 'all .18s',
                    boxShadow: sel ? `0 2px 12px ${g.color}22` : '0 1px 3px rgba(15,27,45,0.04)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 28 }}>{g.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: sel ? g.color : '#0F1B2D' }}>{g.title}</div>
                        <div style={{ fontSize: 12, color: '#8B95A7', marginTop: 2 }}>{g.desc}</div>
                      </div>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${sel ? g.color : '#E5E9F2'}`,
                        background: sel ? g.color : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {sel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={divider} />

            {/* ── Dietary preferences ── */}
            <div style={sectionTitle}>Dietary preferences <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#C8D0DC' }}>(optional)</span></div>
            <p style={{ fontSize: 12, color: '#8B95A7', marginBottom: 14, marginTop: -4 }}>
              Used to filter food recommendations. Select all that apply.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {DIETARY_OPTIONS.map(d => {
                const sel = data.dietaryFlags.includes(d.key);
                return (
                  <button key={d.key} onClick={() => toggleDiet(d.key)} style={{
                    borderRadius: 12, padding: '10px 12px',
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: sel ? 'rgba(30,127,92,0.08)' : '#fff',
                    border: `1.5px solid ${sel ? '#1E7F5C' : '#E5E9F2'}`,
                    cursor: 'pointer', transition: 'all .15s',
                    textAlign: 'left',
                  }}>
                    <span style={{ fontSize: 18, lineHeight: 1 }}>{d.emoji}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: sel ? '#1E7F5C' : '#5B6576', flex: 1 }}>{d.label}</span>
                    {sel && <span style={{ fontSize: 11, color: '#1E7F5C', fontWeight: 800 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ══ Step 2: Body ═════════════════════════════════════════════════════ */}
        {step === 2 && (
          <>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0F1B2D', margin: '0 0 6px' }}>
              Your body stats
            </h2>
            <p style={{ fontSize: 14, color: '#8B95A7', marginBottom: 24 }}>
              Used to calculate your personalised calorie target.
            </p>

            {/* Sex */}
            <div style={sectionTitle}>Biological sex <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#C8D0DC' }}>(affects calorie calc)</span></div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {(['male', 'female', 'other'] as const).map(g => (
                <button key={g} onClick={() => update('gender', g)} style={{
                  flex: 1, borderRadius: 12, padding: '11px 8px',
                  border: `2px solid ${data.gender === g ? '#1E7F5C' : '#E5E9F2'}`,
                  background: data.gender === g ? 'rgba(30,127,92,0.08)' : '#fff',
                  cursor: 'pointer', transition: 'all .15s',
                  fontSize: 13, fontWeight: 700, textTransform: 'capitalize',
                  color: data.gender === g ? '#1E7F5C' : '#8B95A7',
                }}>{g}</button>
              ))}
            </div>

            {/* Numbers */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5B6576', marginBottom: 6 }}>Age</label>
                <input type="number" className="form-input" value={rawNums.age}
                  onChange={e => setRaw('age', e.target.value)} placeholder="27" min="10" max="100" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5B6576', marginBottom: 6 }}>Height (cm)</label>
                <input type="number" className="form-input" value={rawNums.height}
                  onChange={e => setRaw('height', e.target.value)} placeholder="170" min="100" max="250" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5B6576', marginBottom: 6 }}>Current weight (kg)</label>
                <input type="number" className="form-input" value={rawNums.cw}
                  onChange={e => setRaw('cw', e.target.value)} placeholder="75" min="20" max="300" step="0.1" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5B6576', marginBottom: 6 }}>Target weight (kg)</label>
                <input type="number" className="form-input" value={rawNums.tw}
                  onChange={e => setRaw('tw', e.target.value)} placeholder="65" min="20" max="300" step="0.1" />
              </div>
            </div>

            {/* Activity level */}
            <div style={sectionTitle}>Activity level</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ACTIVITY_LEVELS.map(a => {
                const sel = data.activityLevel === a.key;
                return (
                  <button key={a.key}
                    onClick={() => update('activityLevel', a.key as UserProfile['activityLevel'])}
                    style={{
                      borderRadius: 12, padding: '12px 14px', textAlign: 'left',
                      background: sel ? 'rgba(30,127,92,0.08)' : '#fff',
                      border: `1.5px solid ${sel ? '#1E7F5C' : '#E5E9F2'}`,
                      cursor: 'pointer', transition: 'all .15s',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: sel ? '#1E7F5C' : '#0F1B2D' }}>{a.label}</div>
                      <div style={{ fontSize: 12, color: '#8B95A7', marginTop: 2 }}>{a.desc}</div>
                    </div>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${sel ? '#1E7F5C' : '#E5E9F2'}`,
                      background: sel ? '#1E7F5C' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {sel && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ══ Step 3: Done ═════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 20 }}>
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              background: 'rgba(30,127,92,0.10)', border: '2px solid rgba(30,127,92,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
            }}>
              <StrideIcon size={52} />
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0F1B2D', marginBottom: 8 }}>
              You&apos;re all set, {data.name || 'Athlete'}!
            </h2>
            <p style={{ fontSize: 14, color: '#8B95A7', marginBottom: 28, lineHeight: 1.6 }}>
              Your personalised targets are ready.<br />Time to start tracking!
            </p>

            {/* Summary card */}
            <div style={{
              width: '100%', borderRadius: 20, padding: 16, marginBottom: 24,
              background: '#fff', border: '1px solid #E5E9F2',
              boxShadow: '0 2px 12px rgba(15,27,45,0.06)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#C8D0DC', letterSpacing: '0.08em', marginBottom: 14 }}>
                YOUR SETUP
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                {[
                  { l: 'Goal',     v: GOALS.find(g => g.key === data.goalType)?.title ?? '',       c: GOALS.find(g => g.key === data.goalType)?.color ?? '#4CAF82' },
                  { l: 'Activity', v: data.activityLevel.replace('_', ' '),                         c: '#2E6FB8' },
                ].map(i => (
                  <div key={i.l} style={{ flex: 1, borderRadius: 12, padding: '10px 12px', background: '#F7F8FB' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: i.c, textTransform: 'capitalize' }}>{i.v}</div>
                    <div style={{ fontSize: 11, color: '#8B95A7', marginTop: 3 }}>{i.l}</div>
                  </div>
                ))}
              </div>
              {data.dietaryFlags.length > 0 && (
                <div style={{ borderRadius: 12, padding: '10px 12px', background: '#F7F8FB' }}>
                  <div style={{ fontSize: 11, color: '#8B95A7', marginBottom: 8 }}>Dietary preferences</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {data.dietaryFlags.map(f => {
                      const opt = DIETARY_OPTIONS.find(o => o.key === f);
                      return opt ? (
                        <span key={f} style={{ fontSize: 12, fontWeight: 600, color: '#1E7F5C', background: 'rgba(30,127,92,0.08)', borderRadius: 8, padding: '3px 9px' }}>
                          {opt.emoji} {opt.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div style={{
                width: '100%', borderRadius: 12, padding: '12px 14px', marginBottom: 16,
                background: '#fff5f5', border: '1px solid #fecaca',
              }}>
                <p style={{ color: '#c53030', fontSize: 13, lineHeight: 1.5, margin: 0 }}>{error}</p>
              </div>
            )}

            <button onClick={finish} disabled={loading} className="btn-primary"
              style={{ width: '100%', padding: '15px 0', fontSize: 16, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating your account…' : '🚀 Start Tracking'}
            </button>
          </div>
        )}

        {/* Continue button (steps 0–2) */}
        {step < 3 && (
          <div style={{ marginTop: 28 }}>
            <button onClick={next} disabled={emailChecking} className="btn-primary"
              style={{ width: '100%', padding: '14px 0', fontSize: 16, opacity: emailChecking ? 0.7 : 1 }}>
              {emailChecking ? 'Checking email…' : 'Continue →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
