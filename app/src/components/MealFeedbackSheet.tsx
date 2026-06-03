'use client';
/**
 * MealFeedbackSheet
 * ─────────────────────────────────────────────────────────────────────────────
 * Bottom sheet for submitting meal feedback (accuracy rating, price correction,
 * or a general comment). Appears when user taps "Was this accurate?" in an
 * expanded meal card.
 *
 * Auth-gated: unauthenticated users see a sign-in prompt instead.
 *
 * Writes to POST /api/meal-feedback → /meal_feedback Firestore collection.
 */

import { useState } from 'react';
import Link         from 'next/link';
import { useAuth }  from '@/lib/auth-context';
import { auth }     from '@/lib/firebase';

// ─── Design tokens (shared with EatPageClient) ───────────────────────────────
const BG     = '#F7F8FB';
const CARD   = '#FFFFFF';
const BORDER = '#E5E9F2';
const FG1    = '#0F1B2D';
const FG2    = '#5B6576';
const FG3    = '#8B95A7';
const GREEN  = '#1E7F5C';
const AMBER  = '#C98A2E';
const RED    = '#C0392B';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MealFeedbackSheetProps {
  mealId:         string;
  mealName:       string;
  restaurantName?: string;
  isOpen:         boolean;
  onClose:        () => void;
}

type Step = 'rating' | 'details' | 'done';

// ─── Component ────────────────────────────────────────────────────────────────

export default function MealFeedbackSheet({
  mealId, mealName, restaurantName, isOpen, onClose,
}: MealFeedbackSheetProps) {
  const { user } = useAuth();

  const [step,           setStep          ] = useState<Step>('rating');
  const [rating,         setRating        ] = useState<number>(0);          // 1–5
  const [hoverRating,    setHoverRating   ] = useState<number>(0);
  const [priceWrong,     setPriceWrong    ] = useState(false);
  const [correctedPrice, setCorrectedPrice] = useState('');
  const [macroWrong,     setMacroWrong    ] = useState(false);
  const [comment,        setComment       ] = useState('');
  const [submitting,     setSubmitting    ] = useState(false);
  const [error,          setError         ] = useState('');

  if (!isOpen) return null;

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const reset = () => {
    setStep('rating'); setRating(0); setHoverRating(0);
    setPriceWrong(false); setCorrectedPrice(''); setMacroWrong(false);
    setComment(''); setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  const ratingLabel = ['', 'Very inaccurate', 'Inaccurate', 'About right', 'Accurate', 'Spot on 🎯'];

  // ── Submit ───────────────────────────────────────────────────────────────────

  const submit = async () => {
    if (!user || !auth.currentUser) return;
    setSubmitting(true);
    setError('');
    try {
      const token = await auth.currentUser.getIdToken();

      // Always submit an accuracy_rating if rating is set
      if (rating > 0) {
        await fetch('/api/meal-feedback', {
          method:  'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            mealId,
            feedbackType:   'accuracy_rating',
            accuracyRating: rating,
            comment:        comment.trim() || null,
          }),
        });
      }

      // Also submit price_correction if flagged
      if (priceWrong && correctedPrice) {
        const price = parseFloat(correctedPrice);
        if (!isNaN(price) && price > 0) {
          await fetch('/api/meal-feedback', {
            method:  'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              mealId,
              feedbackType:     'price_correction',
              submittedPriceSgd: price,
            }),
          });
        }
      }

      // Submit macro_correction flag if noted
      if (macroWrong) {
        await fetch('/api/meal-feedback', {
          method:  'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            mealId,
            feedbackType: 'macro_correction',
            comment:      comment.trim() || 'User flagged macros as inaccurate',
          }),
        });
      }

      setStep('done');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 80,
          background: 'rgba(15,27,45,0.45)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 81,
        background: CARD,
        borderRadius: '20px 20px 0 0',
        padding: '12px 20px max(28px, env(safe-area-inset-bottom))',
        boxShadow: '0 -4px 24px rgba(15,27,45,0.12)',
        maxWidth: 560, margin: '0 auto',
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
            <Link
              href="/register"
              style={{ display: 'block', background: GREEN, color: '#fff', fontWeight: 700, borderRadius: 14, padding: '13px 0', textDecoration: 'none', fontSize: 14 }}
            >
              Get Started Free →
            </Link>
            <Link
              href="/login"
              style={{ display: 'block', marginTop: 10, color: FG2, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
            >
              Already have an account? Sign in
            </Link>
          </div>
        ) : step === 'done' ? (
          /* ── Done state ── */
          <div style={{ textAlign: 'center', padding: '8px 0 12px' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🙏</div>
            <p style={{ fontWeight: 700, color: FG1, fontSize: 16, margin: '0 0 6px' }}>Thanks for the feedback!</p>
            <p style={{ color: FG2, fontSize: 13, margin: '0 0 20px' }}>
              Your report helps keep the Stride database accurate for everyone.
            </p>
            <button
              onClick={handleClose}
              style={{ width: '100%', background: GREEN, color: '#fff', fontWeight: 700, borderRadius: 14, padding: '13px 0', border: 'none', fontSize: 14, cursor: 'pointer' }}
            >
              Done
            </button>
          </div>
        ) : step === 'rating' ? (
          /* ── Step 1: Star rating ── */
          <>
            <p style={{ fontSize: 12, fontWeight: 700, color: FG3, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>
              Rate accuracy
            </p>
            <p style={{ fontWeight: 700, color: FG1, fontSize: 15, margin: '0 0 2px' }}>{mealName}</p>
            {restaurantName && <p style={{ color: FG3, fontSize: 12, margin: '0 0 18px' }}>{restaurantName}</p>}

            {/* Stars */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    fontSize: 36, background: 'none', border: 'none', cursor: 'pointer',
                    filter: n <= (hoverRating || rating) ? 'none' : 'grayscale(1) opacity(0.35)',
                    transform: n <= (hoverRating || rating) ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform .15s, filter .15s',
                    padding: '4px',
                  }}
                >
                  ⭐
                </button>
              ))}
            </div>

            {/* Rating label */}
            <p style={{ textAlign: 'center', color: rating > 0 ? GREEN : FG3, fontSize: 13, fontWeight: 600, margin: '0 0 20px', minHeight: 20 }}>
              {ratingLabel[hoverRating || rating] || 'Tap to rate'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                onClick={handleClose}
                style={{ padding: '12px 0', borderRadius: 12, border: `1px solid ${BORDER}`, background: BG, color: FG2, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => rating > 0 ? setStep('details') : submit()}
                disabled={rating === 0}
                style={{
                  padding: '12px 0', borderRadius: 12, border: 'none',
                  background: rating > 0 ? GREEN : BORDER,
                  color: rating > 0 ? '#fff' : FG3,
                  fontWeight: 700, fontSize: 13, cursor: rating > 0 ? 'pointer' : 'default',
                  transition: 'background .15s',
                }}
              >
                Next →
              </button>
            </div>
          </>
        ) : (
          /* ── Step 2: Issue details ── */
          <>
            <p style={{ fontWeight: 700, color: FG1, fontSize: 15, margin: '0 0 14px' }}>
              {rating <= 3 ? 'What seems off?' : 'Any other details?'}
            </p>

            {/* Price wrong toggle */}
            <button
              onClick={() => setPriceWrong(v => !v)}
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 12, marginBottom: 8,
                border: `1.5px solid ${priceWrong ? AMBER : BORDER}`,
                background: priceWrong ? 'rgba(201,138,46,0.07)' : CARD,
                color: FG1, fontSize: 13, fontWeight: 600, textAlign: 'left', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>💰</span>
              Price seems wrong
              {priceWrong && <span style={{ marginLeft: 'auto', color: AMBER, fontSize: 12 }}>✓</span>}
            </button>

            {priceWrong && (
              <div style={{ marginBottom: 8, position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: FG2, fontSize: 13, fontWeight: 600 }}>$</span>
                <input
                  type="number"
                  placeholder="Enter correct price"
                  value={correctedPrice}
                  onChange={e => setCorrectedPrice(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '11px 14px 11px 26px',
                    borderRadius: 12, border: `1.5px solid ${AMBER}`,
                    fontSize: 13, background: CARD, color: FG1, outline: 'none',
                  }}
                  step="0.10" min="0.10"
                />
              </div>
            )}

            {/* Macros wrong toggle */}
            <button
              onClick={() => setMacroWrong(v => !v)}
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 12, marginBottom: 8,
                border: `1.5px solid ${macroWrong ? RED : BORDER}`,
                background: macroWrong ? 'rgba(192,57,43,0.06)' : CARD,
                color: FG1, fontSize: 13, fontWeight: 600, textAlign: 'left', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>📊</span>
              Macros / calories seem wrong
              {macroWrong && <span style={{ marginLeft: 'auto', color: RED, fontSize: 12 }}>✓</span>}
            </button>

            {/* Comment */}
            <textarea
              placeholder="Any other comments? (optional)"
              value={comment}
              onChange={e => setComment(e.target.value.slice(0, 300))}
              rows={2}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 12px', borderRadius: 12,
                border: `1.5px solid ${BORDER}`, fontSize: 13,
                background: BG, color: FG1, resize: 'none', outline: 'none',
                fontFamily: 'inherit', marginBottom: 14,
              }}
            />

            {error && (
              <p style={{ color: RED, fontSize: 12, margin: '-8px 0 10px', textAlign: 'center' }}>{error}</p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                onClick={() => setStep('rating')}
                style={{ padding: '12px 0', borderRadius: 12, border: `1px solid ${BORDER}`, background: BG, color: FG2, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                ← Back
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                style={{
                  padding: '12px 0', borderRadius: 12, border: 'none',
                  background: submitting ? BORDER : GREEN,
                  color: submitting ? FG3 : '#fff',
                  fontWeight: 700, fontSize: 13, cursor: submitting ? 'default' : 'pointer',
                }}
              >
                {submitting ? 'Sending…' : 'Submit'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
