'use client';
/**
 * AddMealSheet
 * ─────────────────────────────────────────────────────────────────────────────
 * Bottom sheet for submitting a new restaurant meal to the Stride database.
 * Auth-gated — guests see a sign-in prompt.
 *
 * Submissions go to POST /api/meals → /meals Firestore collection with:
 *   status           = 'pending'
 *   confidenceTier   = 'community'
 *
 * Meals are reviewed before appearing in the app (usually within 24 hours).
 */

import { useState }  from 'react';
import Link          from 'next/link';
import { useAuth }   from '@/lib/auth-context';
import { auth }      from '@/lib/firebase';

const BG     = 'var(--bg)';
const CARD   = 'var(--surface)';
const BORDER = 'var(--line)';
const FG1    = 'var(--ink)';
const FG2    = 'var(--ink-2)';
const FG3    = 'var(--muted)';
const GREEN  = 'var(--green)';
const RED    = 'var(--coral)';

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '11px 12px', borderRadius: 12,
  border: `1.5px solid var(--line)`,
  fontSize: 13, background: 'var(--bg)',
  color: 'var(--ink)', outline: 'none', fontFamily: 'inherit',
};

const DIET_OPTIONS = [
  { key: 'halal',        label: 'Halal'        },
  { key: 'vegetarian',   label: 'Vegetarian'   },
  { key: 'vegan',        label: 'Vegan'        },
  { key: 'gluten_free',  label: 'Gluten-Free'  },
  { key: 'high_protein', label: 'High Protein' },
  { key: 'keto',         label: 'Keto'         },
  { key: 'no_pork',      label: 'No Pork'      },
  { key: 'dairy_free',   label: 'Dairy-Free'   },
];

export interface AddMealSheetProps {
  isOpen:                  boolean;
  onClose:                 () => void;
  /** Pre-fill restaurant field when opened from a restaurant's menu */
  defaultRestaurantName?:  string;
}

type Step = 'form' | 'done';

export default function AddMealSheet({ isOpen, onClose, defaultRestaurantName = '' }: AddMealSheetProps) {
  const { user } = useAuth();

  const [step,        setStep       ] = useState<Step>('form');
  const [name,        setName       ] = useState('');
  const [restaurant,  setRestaurant ] = useState(defaultRestaurantName);
  const [price,       setPrice      ] = useState('');
  const [servingNote, setServingNote] = useState('');
  const [calories,    setCalories   ] = useState('');
  const [protein,     setProtein    ] = useState('');
  const [carbs,       setCarbs      ] = useState('');
  const [fat,         setFat        ] = useState('');
  const [dietTags,    setDietTags   ] = useState<string[]>([]);
  const [submitting,  setSubmitting ] = useState(false);
  const [error,       setError      ] = useState('');

  if (!isOpen) return null;

  const reset = () => {
    setStep('form');
    setName(''); setRestaurant(defaultRestaurantName); setPrice('');
    setServingNote(''); setCalories(''); setProtein(''); setCarbs(''); setFat('');
    setDietTags([]); setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  const toggleDiet = (key: string) =>
    setDietTags(t => t.includes(key) ? t.filter(k => k !== key) : [...t, key]);

  const canSubmit = name.trim().length >= 2 && calories !== '' && parseFloat(calories) > 0;

  const submit = async () => {
    if (!user || !auth?.currentUser || !canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/api/meals', {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:           name.trim(),
          restaurantName: restaurant.trim() || null,
          price:          price     ? parseFloat(price)    : null,
          calories:       parseFloat(calories),
          protein:        protein   ? parseFloat(protein)  : 0,
          carbs:          carbs     ? parseFloat(carbs)    : 0,
          fat:            fat       ? parseFloat(fat)      : 0,
          servingNote:    servingNote.trim() || null,
          dietTags,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? 'Submission failed');
      }
      setStep('done');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={handleClose} style={{
        position: 'fixed', inset: 0, zIndex: 80,
        background: 'rgba(15,27,45,0.45)', backdropFilter: 'blur(2px)',
      }} />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 81,
        background: CARD, borderRadius: '20px 20px 0 0',
        padding: '12px 20px max(28px, env(safe-area-inset-bottom))',
        boxShadow: '0 -4px 24px rgba(15,27,45,0.12)',
        maxWidth: 560, margin: '0 auto',
        maxHeight: '92vh', overflowY: 'auto',
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: BORDER, margin: '0 auto 16px' }} />

        {/* ── Guest gate ── */}
        {!user ? (
          <div style={{ textAlign: 'center', padding: '8px 0 12px' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🍽️</div>
            <p style={{ fontWeight: 700, color: FG1, fontSize: 16, margin: '0 0 6px' }}>Add a meal</p>
            <p style={{ color: FG2, fontSize: 13, margin: '0 0 20px', lineHeight: 1.6 }}>
              Sign in to contribute meals to the Stride database.
            </p>
            <Link href="/register" style={{ display: 'block', background: GREEN, color: '#fff', fontWeight: 700, borderRadius: 14, padding: '13px 0', textDecoration: 'none', fontSize: 14 }}>
              Get Started Free →
            </Link>
            <Link href="/login" style={{ display: 'block', marginTop: 10, color: FG2, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              Already have an account? Sign in
            </Link>
          </div>

        ) : step === 'done' ? (
          /* ── Done ── */
          <div style={{ textAlign: 'center', padding: '8px 0 12px' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🎉</div>
            <p style={{ fontWeight: 700, color: FG1, fontSize: 16, margin: '0 0 6px' }}>Meal submitted!</p>
            <p style={{ color: FG2, fontSize: 13, margin: '0 0 20px', lineHeight: 1.6 }}>
              Thanks for contributing. Your meal will appear after review — usually within 24 hours.
            </p>
            <button onClick={handleClose} style={{ width: '100%', background: GREEN, color: '#fff', fontWeight: 700, borderRadius: 14, padding: '13px 0', border: 'none', fontSize: 14, cursor: 'pointer' }}>
              Done
            </button>
          </div>

        ) : (
          /* ── Form ── */
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: FG3, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>Contribute</p>
                <p style={{ fontWeight: 700, color: FG1, fontSize: 16, margin: '2px 0 0' }}>Add a meal to Stride</p>
              </div>
              <button onClick={handleClose} style={{ background: 'none', border: 'none', color: FG3, fontSize: 22, cursor: 'pointer', padding: 4 }}>✕</button>
            </div>

            {/* Meal name */}
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: FG2, marginBottom: 4 }}>
              Meal name <span style={{ color: RED }}>*</span>
            </label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Chicken Rice, McSpicy, Spicy Ramen"
              style={inputStyle}
              autoFocus
            />

            {/* Restaurant */}
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: FG2, margin: '12px 0 4px' }}>
              Restaurant / hawker stall
            </label>
            <input
              value={restaurant} onChange={e => setRestaurant(e.target.value)}
              placeholder="e.g. Maxwell Food Centre, McDonald's (optional)"
              style={inputStyle}
            />

            {/* Price */}
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: FG2, margin: '12px 0 4px' }}>
              Price (SGD)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: FG2, fontSize: 13, fontWeight: 600, pointerEvents: 'none' }}>$</span>
              <input
                type="number" min="0.50" step="0.10"
                value={price} onChange={e => setPrice(e.target.value)}
                placeholder="0.00 (optional)"
                style={{ ...inputStyle, paddingLeft: 26 }}
              />
            </div>

            {/* Serving note */}
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: FG2, margin: '12px 0 4px' }}>
              Serving size
            </label>
            <input
              value={servingNote} onChange={e => setServingNote(e.target.value)}
              placeholder="e.g. 1 plate (350g), 1 piece (optional)"
              style={inputStyle}
            />

            {/* Macros */}
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: FG2, margin: '12px 0 4px' }}>
              Nutrition per serving <span style={{ color: RED }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Calories (kcal)', val: calories, set: setCalories, req: true  },
                { label: 'Protein (g)',     val: protein,  set: setProtein,  req: false },
                { label: 'Carbs (g)',       val: carbs,    set: setCarbs,    req: false },
                { label: 'Fat (g)',         val: fat,      set: setFat,      req: false },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: FG3, marginBottom: 4 }}>
                    {f.label}{f.req && <span style={{ color: RED }}> *</span>}
                  </label>
                  <input
                    type="number" min="0" step="1"
                    value={f.val} onChange={e => f.set(e.target.value)}
                    placeholder="0"
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>

            {/* Diet tags */}
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: FG2, margin: '12px 0 6px' }}>
              Diet tags (optional)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {DIET_OPTIONS.map(t => {
                const active = dietTags.includes(t.key);
                return (
                  <button key={t.key} onClick={() => toggleDiet(t.key)} style={{
                    padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: active ? GREEN : BG,
                    color:      active ? '#fff' : FG2,
                    border:     `1px solid ${active ? GREEN : BORDER}`,
                  }}>
                    {t.label}
                  </button>
                );
              })}
            </div>

            {error && <p style={{ color: RED, fontSize: 12, margin: '-4px 0 10px', textAlign: 'center' }}>{error}</p>}

            <p style={{ fontSize: 11, color: FG3, textAlign: 'center', marginBottom: 12, lineHeight: 1.5 }}>
              Meals are reviewed before going live. Singapore items only please.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={handleClose} style={{ padding: '13px 0', borderRadius: 14, border: `1px solid ${BORDER}`, background: BG, color: FG2, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={submit} disabled={!canSubmit || submitting} style={{
                padding: '13px 0', borderRadius: 14, border: 'none',
                background: canSubmit && !submitting ? GREEN : BORDER,
                color:      canSubmit && !submitting ? '#fff' : FG3,
                fontWeight: 700, fontSize: 13,
                cursor: canSubmit && !submitting ? 'pointer' : 'default',
                transition: 'background .15s',
              }}>
                {submitting ? 'Submitting…' : 'Submit meal'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
