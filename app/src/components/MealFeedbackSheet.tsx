'use client';
/**
 * MealFeedbackSheet — upgraded
 * ─────────────────────────────────────────────────────────────────────────────
 * Bottom sheet for submitting meal feedback.
 *
 * Changes from v1:
 *   - Accepts current macro/price values as props so inputs can be pre-filled
 *   - When "Macros seem wrong" is toggled, shows editable fields for calories,
 *     protein, carbs and fat (not just a flag)
 *   - Corrected macro values are sent as submittedCalories / submittedProteinG
 *     etc. in the macro_correction feedback doc
 *
 * Writes to POST /api/meal-feedback → /meal_feedback Firestore collection.
 */

import { useState } from 'react';
import Link         from 'next/link';
import { useAuth }  from '@/lib/auth-context';
import { auth }     from '@/lib/firebase';

const BG     = 'var(--bg)';
const CARD   = 'var(--surface)';
const BORDER = 'var(--line)';
const FG1    = 'var(--ink)';
const FG2    = 'var(--ink-2)';
const FG3    = 'var(--muted)';
const GREEN  = 'var(--green)';
const AMBER  = 'var(--gold)';
const RED    = 'var(--coral)';

export interface MealFeedbackSheetProps {
  mealId:           string;
  mealName:         string;
  restaurantName?:  string;
  /** Current values — used to pre-fill correction inputs */
  currentCalories?: number;
  currentProtein?:  number;
  currentCarbs?:    number;
  currentFat?:      number;
  currentPrice?:    number;
  isOpen:           boolean;
  onClose:          () => void;
}

type Step = 'rating' | 'details' | 'done';

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '10px 12px', borderRadius: 12,
  border: `1.5px solid var(--line)`,
  fontSize: 13, background: 'var(--bg)',
  color: 'var(--ink)', outline: 'none', fontFamily: 'inherit',
};

export default function MealFeedbackSheet({
  mealId, mealName, restaurantName,
  currentCalories, currentProtein, currentCarbs, currentFat, currentPrice,
  isOpen, onClose,
}: MealFeedbackSheetProps) {
  const { user } = useAuth();

  const [step,        setStep       ] = useState<Step>('rating');
  const [rating,      setRating     ] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  // Price correction
  const [priceWrong,     setPriceWrong    ] = useState(false);
  const [correctedPrice, setCorrectedPrice] = useState('');

  // Macro correction — specific values
  const [macroWrong,    setMacroWrong   ] = useState(false);
  const [fixCalories,   setFixCalories  ] = useState('');
  const [fixProtein,    setFixProtein   ] = useState('');
  const [fixCarbs,      setFixCarbs     ] = useState('');
  const [fixFat,        setFixFat       ] = useState('');

  const [comment,    setComment   ] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError     ] = useState('');

  if (!isOpen) return null;

  const reset = () => {
    setStep('rating'); setRating(0); setHoverRating(0);
    setPriceWrong(false); setCorrectedPrice('');
    setMacroWrong(false); setFixCalories(''); setFixProtein(''); setFixCarbs(''); setFixFat('');
    setComment(''); setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  // Pre-fill macro inputs when the toggle is turned on
  const handleMacroToggle = () => {
    const next = !macroWrong;
    setMacroWrong(next);
    if (next) {
      // Pre-fill with current values so user only edits what's wrong
      if (currentCalories != null) setFixCalories(String(currentCalories));
      if (currentProtein  != null) setFixProtein(String(currentProtein));
      if (currentCarbs    != null) setFixCarbs(String(currentCarbs));
      if (currentFat      != null) setFixFat(String(currentFat));
    }
  };

  // Pre-fill price input when the toggle is turned on
  const handlePriceToggle = () => {
    const next = !priceWrong;
    setPriceWrong(next);
    if (next && currentPrice != null) setCorrectedPrice(String(currentPrice));
  };

  const ratingLabel = ['', 'Very inaccurate', 'Inaccurate', 'About right', 'Accurate', 'Spot on 🎯'];

  const submit = async () => {
    if (!user || !auth?.currentUser) return;
    setSubmitting(true);
    setError('');
    try {
      const token = await auth.currentUser.getIdToken();

      const post = async (body: Record<string, unknown>) => {
        await fetch('/api/meal-feedback', {
          method:  'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body:    JSON.stringify({ mealId, ...body }),
        });
      };

      if (rating > 0) {
        await post({ feedbackType: 'accuracy_rating', accuracyRating: rating, comment: comment.trim() || null });
      }

      if (priceWrong && correctedPrice) {
        const p = parseFloat(correctedPrice);
        if (!isNaN(p) && p > 0) {
          await post({ feedbackType: 'price_correction', submittedPriceSgd: p });
        }
      }

      if (macroWrong) {
        const cal = parseFloat(fixCalories);
        const pro = parseFloat(fixProtein);
        const crb = parseFloat(fixCarbs);
        const fat = parseFloat(fixFat);
        await post({
          feedbackType:      'macro_correction',
          submittedCalories: !isNaN(cal) && cal > 0 ? cal : null,
          submittedProteinG: !isNaN(pro) && pro >= 0 ? pro : null,
          submittedCarbsG:   !isNaN(crb) && crb >= 0 ? crb : null,
          submittedFatG:     !isNaN(fat) && fat >= 0 ? fat : null,
          comment:           comment.trim() || 'User submitted corrected macro values',
        });
      }

      setStep('done');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={handleClose} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(15,27,45,0.45)', backdropFilter: 'blur(2px)' }} />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 81,
        background: CARD, borderRadius: '20px 20px 0 0',
        padding: '12px 20px max(28px, env(safe-area-inset-bottom))',
        boxShadow: '0 -4px 24px rgba(15,27,45,0.12)',
        maxWidth: 560, margin: '0 auto',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: BORDER, margin: '0 auto 16px' }} />

        {/* ── Not signed in ── */}
        {!user ? (
          <div style={{ textAlign: 'center', padding: '8px 0 12px' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>⭐</div>
            <p style={{ fontWeight: 700, color: FG1, fontSize: 16, margin: '0 0 6px' }}>Rate this meal</p>
            <p style={{ color: FG2, fontSize: 13, margin: '0 0 20px', lineHeight: 1.6 }}>
              Sign in to rate accuracy and help improve the database for everyone.
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
            <div style={{ fontSize: 40, marginBottom: 10 }}>🙏</div>
            <p style={{ fontWeight: 700, color: FG1, fontSize: 16, margin: '0 0 6px' }}>Thanks for the feedback!</p>
            <p style={{ color: FG2, fontSize: 13, margin: '0 0 20px' }}>Your report helps keep the Stride database accurate for everyone.</p>
            <button onClick={handleClose} style={{ width: '100%', background: GREEN, color: '#fff', fontWeight: 700, borderRadius: 14, padding: '13px 0', border: 'none', fontSize: 14, cursor: 'pointer' }}>
              Done
            </button>
          </div>

        ) : step === 'rating' ? (
          /* ── Step 1: Star rating ── */
          <>
            <p style={{ fontSize: 12, fontWeight: 700, color: FG3, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>Rate accuracy</p>
            <p style={{ fontWeight: 700, color: FG1, fontSize: 15, margin: '0 0 2px' }}>{mealName}</p>
            {restaurantName && <p style={{ color: FG3, fontSize: 12, margin: '0 0 18px' }}>{restaurantName}</p>}

            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setRating(n)} onMouseEnter={() => setHoverRating(n)} onMouseLeave={() => setHoverRating(0)} style={{
                  fontSize: 36, background: 'none', border: 'none', cursor: 'pointer',
                  filter: n <= (hoverRating || rating) ? 'none' : 'grayscale(1) opacity(0.35)',
                  transform: n <= (hoverRating || rating) ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform .15s, filter .15s', padding: 4,
                }}>⭐</button>
              ))}
            </div>

            <p style={{ textAlign: 'center', color: rating > 0 ? GREEN : FG3, fontSize: 13, fontWeight: 600, margin: '0 0 20px', minHeight: 20 }}>
              {ratingLabel[hoverRating || rating] || 'Tap to rate'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={handleClose} style={{ padding: '12px 0', borderRadius: 12, border: `1px solid ${BORDER}`, background: BG, color: FG2, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => rating > 0 ? setStep('details') : undefined} disabled={rating === 0} style={{
                padding: '12px 0', borderRadius: 12, border: 'none',
                background: rating > 0 ? GREEN : BORDER,
                color: rating > 0 ? '#fff' : FG3,
                fontWeight: 700, fontSize: 13, cursor: rating > 0 ? 'pointer' : 'default', transition: 'background .15s',
              }}>
                Next →
              </button>
            </div>
          </>

        ) : (
          /* ── Step 2: Details ── */
          <>
            <p style={{ fontWeight: 700, color: FG1, fontSize: 15, margin: '0 0 14px' }}>
              {rating <= 3 ? 'What seems off?' : 'Any other details?'}
            </p>

            {/* Price toggle */}
            <button onClick={handlePriceToggle} style={{
              width: '100%', padding: '11px 14px', borderRadius: 12, marginBottom: 8,
              border: `1.5px solid ${priceWrong ? AMBER : BORDER}`,
              background: priceWrong ? 'rgba(201,138,46,0.07)' : CARD,
              color: FG1, fontSize: 13, fontWeight: 600, textAlign: 'left', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>💰</span>
              Price seems wrong
              {priceWrong && <span style={{ marginLeft: 'auto', color: AMBER, fontSize: 12 }}>✓</span>}
            </button>

            {priceWrong && (
              <div style={{ marginBottom: 8, position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: FG2, fontSize: 13, fontWeight: 600 }}>$</span>
                <input
                  type="number" placeholder="Correct price (SGD)"
                  value={correctedPrice} onChange={e => setCorrectedPrice(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 26, border: `1.5px solid ${AMBER}` }}
                  step="0.10" min="0.10"
                />
              </div>
            )}

            {/* Macro toggle */}
            <button onClick={handleMacroToggle} style={{
              width: '100%', padding: '11px 14px', borderRadius: 12, marginBottom: 8,
              border: `1.5px solid ${macroWrong ? RED : BORDER}`,
              background: macroWrong ? 'rgba(192,57,43,0.06)' : CARD,
              color: FG1, fontSize: 13, fontWeight: 600, textAlign: 'left', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>📊</span>
              Macros / calories seem wrong
              {macroWrong && <span style={{ marginLeft: 'auto', color: RED, fontSize: 12 }}>✓</span>}
            </button>

            {/* Macro correction inputs — pre-filled from current values */}
            {macroWrong && (
              <div style={{ background: BG, borderRadius: 12, padding: '12px', marginBottom: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: FG3, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Enter correct values (per serving)
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Calories (kcal)', val: fixCalories, set: setFixCalories },
                    { label: 'Protein (g)',     val: fixProtein,  set: setFixProtein  },
                    { label: 'Carbs (g)',       val: fixCarbs,    set: setFixCarbs    },
                    { label: 'Fat (g)',         val: fixFat,      set: setFixFat      },
                  ].map(f => (
                    <div key={f.label}>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: FG3, marginBottom: 4 }}>{f.label}</label>
                      <input
                        type="number" min="0" step="1"
                        value={f.val} onChange={e => f.set(e.target.value)}
                        placeholder="0"
                        style={{ ...inputStyle, border: `1.5px solid ${RED}` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comment */}
            <textarea
              placeholder="Any other comments? (optional)"
              value={comment} onChange={e => setComment(e.target.value.slice(0, 300))}
              rows={2}
              style={{ ...inputStyle, resize: 'none', marginBottom: 14 }}
            />

            {error && <p style={{ color: RED, fontSize: 12, margin: '-8px 0 10px', textAlign: 'center' }}>{error}</p>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => setStep('rating')} style={{ padding: '12px 0', borderRadius: 12, border: `1px solid ${BORDER}`, background: BG, color: FG2, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                ← Back
              </button>
              <button onClick={submit} disabled={submitting} style={{
                padding: '12px 0', borderRadius: 12, border: 'none',
                background: submitting ? BORDER : GREEN,
                color: submitting ? FG3 : '#fff',
                fontWeight: 700, fontSize: 13, cursor: submitting ? 'default' : 'pointer',
              }}>
                {submitting ? 'Sending…' : 'Submit'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
