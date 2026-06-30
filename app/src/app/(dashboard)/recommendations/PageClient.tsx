'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useStrideStore } from '@/lib/store';
import { calculateTargetCalories, calculateMacros } from '@/lib/utils';

/* ── Design tokens (CSS variables aligned with design system) ── */
const BG     = 'var(--bg)';
const CARD   = 'var(--surface)';
const BORDER = 'var(--line)';
const FG1    = 'var(--ink)';
const FG2    = 'var(--ink-2)';
const FG3    = 'var(--muted)';
const GREEN  = 'var(--green)';
const SHADOW = 'var(--shadow-md)';

/* ── Types ── */
type RecType = 'food' | 'activity' | 'hydration' | 'habit';
type Priority = 'high' | 'medium' | 'low';

interface Rec {
  id:       string;
  type:     RecType;
  emoji:    string;
  title:    string;
  body:     string;
  priority: Priority;
  action?:  { label: string; href: string };
}

/* ── Priority styling ── */
const PRIORITY_STYLE: Record<Priority, { bg: string; color: string; label: string }> = {
  high:   { bg: 'var(--coral-tint)',    color: 'var(--coral)',    label: 'Priority' },
  medium: { bg: 'var(--gold-tint)',     color: 'var(--gold)',     label: 'Heads up'  },
  low:    { bg: 'var(--green-tint)',    color: 'var(--green)',    label: 'Tip'       },
};

/* ── Skeleton card ── */
function SkeletonCard() {
  return (
    <div style={{ background: CARD, borderRadius: 18, padding: '18px 16px', boxShadow: SHADOW }}>
      <style>{`@keyframes shimmer{0%{opacity:.6}50%{opacity:1}100%{opacity:.6}}`}</style>
      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
        <div style={{ width:44,height:44,borderRadius:12,background:'var(--surface-2)',animation:'shimmer 1.4s ease infinite',flexShrink:0 }} />
        <div style={{ flex:1 }}>
          <div style={{ height:14,borderRadius:6,background:'var(--surface-2)',width:'65%',animation:'shimmer 1.4s ease infinite',marginBottom:8 }} />
          <div style={{ height:11,borderRadius:6,background:'var(--surface-2)',width:'90%',animation:'shimmer 1.4s ease infinite',marginBottom:4 }} />
          <div style={{ height:11,borderRadius:6,background:'var(--surface-2)',width:'75%',animation:'shimmer 1.4s ease infinite' }} />
        </div>
      </div>
    </div>
  );
}

/* ── Recommendation card ── */
function RecCard({ rec }: { rec: Rec }) {
  const p = PRIORITY_STYLE[rec.priority];
  return (
    <div style={{
      background: CARD, borderRadius: 18, padding: '18px 16px',
      boxShadow: SHADOW, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Emoji icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: p.bg, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 22,
        }}>
          {rec.emoji}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Priority badge + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.06em', color: p.color, background: p.bg,
              borderRadius: 6, padding: '2px 6px',
            }}>{p.label}</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: FG1, lineHeight: 1.3 }}>
            {rec.title}
          </div>
        </div>
      </div>

      {/* Body */}
      <p style={{ margin: 0, fontSize: 13, color: FG2, lineHeight: 1.6 }}>{rec.body}</p>

      {/* Action */}
      {rec.action && (
        <Link href={rec.action.href} style={{
          display: 'block', textAlign: 'center',
          padding: '11px 0', borderRadius: 12,
          background: GREEN, color: '#fff',
          fontSize: 13, fontWeight: 700, textDecoration: 'none',
          boxShadow: 'var(--shadow-green)',
        }}>
          {rec.action.label} →
        </Link>
      )}
    </div>
  );
}

/* ════════════════════ Main ════════════════════ */
export default function RecommendationsPage() {
  const { user } = useAuth();
  const store    = useStrideStore();
  const router   = useRouter();
  const profile  = store.profile;
  const totals   = store.getTodayTotals();

  const [recs,    setRecs   ] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError  ] = useState('');

  // Targets with fallbacks
  const targetCal = profile.targetCalories > 0
    ? profile.targetCalories
    : calculateTargetCalories(profile);
  const macros = calculateMacros(targetCal, profile.goalType ?? 'maintenance');
  const targetProtein = profile.targetProtein  > 0 ? profile.targetProtein  : macros.protein;
  const targetCarbs   = profile.targetCarbs    > 0 ? profile.targetCarbs    : macros.carbs;
  const targetFat     = profile.targetFat      > 0 ? profile.targetFat      : macros.fat;

  const remaining = {
    cal:     Math.max(0, targetCal     - totals.calories),
    protein: Math.max(0, targetProtein - totals.protein),
    carbs:   Math.max(0, targetCarbs   - totals.carbs),
    fat:     Math.max(0, targetFat     - totals.fat),
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchRecs = async () => {
      setLoading(true);
      setError('');
      try {
        const { getAuth } = await import('firebase/auth');
        const token = await getAuth().currentUser?.getIdToken();
        if (!token) throw new Error('Not signed in');
        const res = await fetch('/api/recommendations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load recommendations');
        const data: Rec[] = await res.json();
        setRecs(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Could not load recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecs();
  }, [user]);

  /* ── Guest state ── */
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', gap: 16 }}>
        <span style={{ fontSize: 48 }}>🎯</span>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: FG1, margin: 0 }}>Sign in to see your recommendations</h2>
        <p style={{ fontSize: 14, color: FG2, textAlign: 'center', margin: 0 }}>Personalised tips based on today&apos;s macros, water, and activity.</p>
        <Link href="/login" style={{ background: GREEN, color: '#fff', fontWeight: 700, borderRadius: 14, padding: '13px 32px', textDecoration: 'none', fontSize: 15 }}>Sign in</Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: BG }}>

      {/* ── Header ── */}
      <div style={{ padding: '52px 20px 16px' }}>
        <h1 style={{ fontFamily: '"Space Grotesk",system-ui,sans-serif', fontSize: 24, fontWeight: 800, color: FG1, margin: '0 0 4px', letterSpacing: '-0.03em' }}>
          For you
        </h1>
        <p style={{ color: FG3, fontSize: 14, margin: 0 }}>Personalised to today&apos;s progress</p>
      </div>

      <div style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 100 }}>

        {/* ── Remaining macros banner ── */}
        <div style={{ background: CARD, borderRadius: 18, padding: '14px 16px', border: `1px solid ${BORDER}`, boxShadow: SHADOW }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: FG3, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Remaining today
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { l: 'Calories', v: remaining.cal,     unit: 'kcal', color: 'var(--coral)', bg: 'var(--coral-tint)' },
              { l: 'Protein',  v: remaining.protein, unit: 'g',    color: 'var(--green)', bg: 'var(--green-tint)' },
              { l: 'Carbs',    v: remaining.carbs,   unit: 'g',    color: 'var(--gold)',  bg: 'var(--gold-tint)'  },
              { l: 'Fat',      v: remaining.fat,     unit: 'g',    color: FG2,            bg: 'var(--surface-2)'  },
            ].map(r => (
              <div key={r.l} style={{ background: r.bg, borderRadius: 10, padding: '8px 4px', textAlign: 'center' }}>
                <div style={{ fontFamily: '"Space Grotesk",system-ui,sans-serif', fontSize: 16, fontWeight: 800, color: r.color, lineHeight: 1 }}>{r.v}</div>
                <div style={{ fontSize: 9, color: r.color, fontWeight: 600, marginTop: 1 }}>{r.unit}</div>
                <div style={{ fontSize: 9, color: FG3, marginTop: 2 }}>{r.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        {loading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: FG3 }}>
            <span style={{ fontSize: 40 }}>⚠️</span>
            <p style={{ fontSize: 14, color: FG2, marginTop: 12 }}>{error}</p>
            <button onClick={() => router.refresh()} style={{
              marginTop: 12, padding: '10px 24px', borderRadius: 12, border: 'none',
              background: GREEN, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13,
            }}>Retry</button>
          </div>
        )}

        {!loading && !error && recs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <span style={{ fontSize: 48 }}>🎉</span>
            <p style={{ fontSize: 15, fontWeight: 700, color: FG1, marginTop: 12 }}>You&apos;re on track!</p>
            <p style={{ fontSize: 13, color: FG3 }}>No recommendations right now — check back after your next meal.</p>
          </div>
        )}

        {!loading && !error && recs.map(rec => (
          <RecCard key={rec.id} rec={rec} />
        ))}

      </div>
    </div>
  );
}
