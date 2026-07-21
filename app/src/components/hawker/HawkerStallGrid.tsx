'use client';

/**
 * HawkerStallGrid — Task 13 (v1.1)
 *
 * Reads the ?r= query param, finds the restaurant, and renders a stall grid
 * if restaurant.stalls is populated. Handles its own dish submission via
 * POST /api/meal-feedback. Returns null when not on a hawker page with stalls.
 *
 * Integration (EatPageClient.tsx):
 *   1. Add import:  import { HawkerStallGrid } from '@/components/hawker/HawkerStallGrid';
 *   2. Add render:  <HawkerStallGrid />
 * — place it just above the "Remaining budget strip" comment block.
 */

import { useState, useCallback } from 'react';
import { useSearchParams }       from 'next/navigation';
import { useAuth }               from '@/lib/auth-context';
import { SG_RESTAURANTS }        from '@/lib/sgFoodDb';
import type { SGRestaurant, HawkerStall } from '@/lib/sgFoodDb';

/* ── Colour map for SFA hygiene grades ──────────────────────────────────────── */
const GRADE: Record<string, { bg: string; text: string }> = {
  A:  { bg: '#E8F5E9', text: '#1B5E20' },
  B:  { bg: '#E3F2FD', text: '#0D47A1' },
  C:  { bg: '#FFF8E1', text: '#E65100' },
  D:  { bg: '#FFEBEE', text: '#B71C1C' },
  na: { bg: '#F5F5F5', text: '#757575' },
};

/* ── Bottom sheet: "What did you eat here?" ─────────────────────────────────── */
function DishSheet({
  restaurant,
  stall,
  onClose,
}: {
  restaurant: SGRestaurant;
  stall:      HawkerStall;
  onClose:    () => void;
}) {
  const [dishName,   setDishName]   = useState('');
  const [price,      setPrice]      = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState('');

  const submit = useCallback(async () => {
    if (!dishName.trim()) { setError('Please enter a dish name.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/meal-feedback', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealId:           restaurant.id,        // hawker centre id as anchor
          restaurantId:     restaurant.id,
          feedbackType:     'new_submission',
          submitterRole:    'user',
          stallUnit:        stall.unit,           // NEW — links dish to stall
          proposedName:     dishName.trim(),
          proposedPriceSgd: price ? parseFloat(price) : undefined,
          notes: `Stall ${stall.unit}${stall.name ? ` (${stall.name})` : ''} at ${restaurant.name}`,
        }),
      });
      if (!res.ok) throw new Error('Server error');
      setDone(true);
    } catch {
      setError('Could not submit — please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [dishName, price, restaurant, stall]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 900 }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 901,
        maxWidth: 520, margin: '0 auto',
        background: '#fff', borderRadius: '20px 20px 0 0',
        padding: '20px 20px 44px',
        boxShadow: '0 -4px 40px rgba(0,0,0,.12)',
      }}>
        {done ? (
          /* ── Success state ── */
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#0F1B2D', marginBottom: 6 }}>
              Dish submitted!
            </div>
            <p style={{ fontSize: 13, color: '#8B95A7', margin: '0 0 20px' }}>
              It&apos;ll appear once our team reviews it.
            </p>
            <button
              onClick={onClose}
              style={{
                background: '#1E7F5C', color: '#fff', border: 'none', borderRadius: 12,
                padding: '12px 32px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#0F1B2D' }}>
                  What did you eat here?
                </div>
                <div style={{ fontSize: 12, color: '#8B95A7', marginTop: 3 }}>
                  Stall {stall.unit}{stall.name ? ` · ${stall.name}` : ''} · {restaurant.name}
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none', border: 'none', fontSize: 18,
                  color: '#8B95A7', cursor: 'pointer', padding: 4,
                }}
              >
                ✕
              </button>
            </div>

            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5B6576', marginBottom: 6 }}>
              Dish name *
            </label>
            <input
              type="text"
              placeholder="e.g. Char Kway Teow"
              value={dishName}
              onChange={e => setDishName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              autoFocus
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: 15,
                border: '1.5px solid #E5E9F2', outline: 'none', boxSizing: 'border-box',
                color: '#0F1B2D', marginBottom: 14,
              }}
            />

            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5B6576', marginBottom: 6 }}>
              Price (SGD) · optional
            </label>
            <input
              type="number"
              placeholder="e.g. 4.50"
              value={price}
              onChange={e => setPrice(e.target.value)}
              inputMode="decimal"
              min={0}
              max={999}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: 15,
                border: '1.5px solid #E5E9F2', outline: 'none', boxSizing: 'border-box',
                color: '#0F1B2D', marginBottom: 20,
              }}
            />

            {error && (
              <div style={{ fontSize: 13, color: '#DF5F3B', fontWeight: 600, marginBottom: 12 }}>
                {error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={submitting}
              style={{
                width: '100%', padding: 14, borderRadius: 12, border: 'none',
                background: submitting ? '#8B95A7' : '#1E7F5C', color: '#fff',
                fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Submitting…' : 'Submit dish'}
            </button>

            <p style={{ fontSize: 11, color: '#8B95A7', textAlign: 'center', margin: '10px 0 0' }}>
              Submissions go to our moderation queue before appearing.
            </p>
          </>
        )}
      </div>
    </>
  );
}

/* ── Main export ─────────────────────────────────────────────────────────────── */
export function HawkerStallGrid() {
  const { user }   = useAuth();
  const params     = useSearchParams();
  const rId        = params.get('r');
  const restaurant = rId ? SG_RESTAURANTS.find(r => r.id === rId) ?? null : null;

  const [search,      setSearch]      = useState('');
  const [activeStall, setActiveStall] = useState<HawkerStall | null>(null);

  // Only render for hawker outlets that have stalls populated
  if (!restaurant?.stalls?.length) return null;

  const stalls   = restaurant.stalls;
  const filtered = search
    ? stalls.filter(s =>
        s.unit.toLowerCase().includes(search.toLowerCase()) ||
        s.name?.toLowerCase().includes(search.toLowerCase())
      )
    : stalls;

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0F1B2D' }}>
          🏪 Stalls ({stalls.length})
        </div>
        <div style={{ fontSize: 11, color: '#8B95A7', marginTop: 2 }}>
          Tap a stall to add a dish you ate there
        </div>
      </div>

      {/* Search — only when there are many stalls */}
      {stalls.length > 20 && (
        <input
          type="text"
          placeholder="Search stall number or name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '9px 14px', borderRadius: 10, fontSize: 13,
            border: '1.5px solid #E5E9F2', outline: 'none', boxSizing: 'border-box',
            color: '#0F1B2D', background: '#F7F8FB', marginBottom: 10,
          }}
        />
      )}

      {/* Stall grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))',
        gap: 8, maxHeight: 360, overflowY: 'auto', paddingRight: 2,
      }}>
        {filtered.map(stall => {
          const g  = stall.grade ?? 'na';
          const gs = GRADE[g] ?? GRADE.na;
          return (
            <button
              key={stall.unit}
              onClick={() => {
                // Guest — redirect to register
                if (!user) { window.location.href = '/register'; return; }
                setActiveStall(stall);
              }}
              style={{
                background: '#fff', border: '1.5px solid #E5E9F2', borderRadius: 12,
                padding: '10px 8px', cursor: 'pointer', textAlign: 'left',
                transition: 'border-color .15s, box-shadow .15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#1E7F5C';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(30,127,92,.12)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E9F2';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
              }}
            >
              {/* Grade badge */}
              {g !== 'na' && (
                <span style={{
                  display: 'inline-block', fontSize: 9, fontWeight: 700,
                  background: gs.bg, color: gs.text,
                  borderRadius: 999, padding: '1px 6px', marginBottom: 4,
                }}>
                  Grade {g}
                </span>
              )}
              {/* Unit */}
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0F1B2D', marginBottom: 2 }}>
                {stall.unit}
              </div>
              {/* Name or placeholder */}
              {stall.name ? (
                <div style={{
                  fontSize: 10, color: '#5B6576', lineHeight: 1.3,
                  overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                }}>
                  {stall.name}
                </div>
              ) : (
                <div style={{ fontSize: 10, color: '#C8D0DC', fontStyle: 'italic' }}>
                  Add dish
                </div>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && search && (
        <div style={{ textAlign: 'center', color: '#8B95A7', fontSize: 13, padding: '16px 0' }}>
          No stalls match &ldquo;{search}&rdquo;
        </div>
      )}

      {/* Dish submission sheet */}
      {activeStall && (
        <DishSheet
          restaurant={restaurant}
          stall={activeStall}
          onClose={() => setActiveStall(null)}
        />
      )}
    </div>
  );
}
