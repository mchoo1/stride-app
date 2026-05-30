'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/apiClient';
import type { DailySummary } from '@/lib/apiClient';
import { useStrideStore } from '@/lib/store';

/* ── Design tokens ── */
const BG     = '#F7F8FB';
const CARD   = '#FFFFFF';
const BORDER = '#E5E9F2';
const FG1    = '#0F1B2D';
const FG2    = '#5B6576';
const FG3    = '#8B95A7';
const GREEN  = '#1E7F5C';
const AMBER  = '#F2A93B';
const RED    = '#D04E36';
const SHADOW = '0 1px 2px rgba(15,27,45,0.04), 0 2px 6px rgba(15,27,45,0.05)';

/* Generate last 14 dates as YYYY-MM-DD strings, most recent first */
function getLast14Dates(): string[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  });
}

function formatDateLabel(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return 'Today';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-SG', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function HistoryPage() {
  const router   = useRouter();
  const profile  = useStrideStore(s => s.profile);
  const target   = profile.targetCalories || 2000;

  const [summaries, setSummaries] = useState<(DailySummary | null)[]>([]);
  const [loading,   setLoading  ] = useState(true);

  const dates   = getLast14Dates();
  const todayStr = dates[0];

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const results = await Promise.allSettled(
          dates.map(d => api.summary.getByDate(d)),
        );
        if (cancelled) return;
        setSummaries(
          results.map(r => (r.status === 'fulfilled' ? r.value : null)),
        );
      } catch {
        if (!cancelled) setSummaries(dates.map(() => null));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Aggregate stats ── */
  const daysLogged = summaries.filter(
    s => s && (s.totalCalories > 0 || s.caloriesBurned > 0),
  ).length;
  const totalConsumed = summaries.reduce((acc, s) => acc + (s?.totalCalories ?? 0), 0);
  const totalBurned   = summaries.reduce((acc, s) => acc + (s?.caloriesBurned ?? 0), 0);

  return (
    <div style={{ background: BG, minHeight: '100vh', paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ padding: '52px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={() => router.back()}
          style={{
            background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12,
            width: 38, height: 38, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
            fontSize: 18, color: FG2, boxShadow: SHADOW,
          }}
          aria-label="Go back"
        >
          ←
        </button>
        <h1
          style={{
            color: FG1, fontSize: 36, lineHeight: 1, margin: 0,
            fontFamily: "'Anton', Impact, sans-serif",
          }}
        >
          FULL LOG
        </h1>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* Summary row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
          marginBottom: 20,
        }}>
          {[
            { label: 'Days Logged',    value: loading ? '—' : String(daysLogged),                      color: FG1   },
            { label: 'Total Consumed', value: loading ? '—' : `${totalConsumed.toLocaleString()} kcal`, color: GREEN },
            { label: 'Total Burned',   value: loading ? '—' : `${totalBurned.toLocaleString()} kcal`,   color: AMBER },
          ].map(stat => (
            <div key={stat.label} style={{
              background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`,
              padding: '12px 10px', textAlign: 'center', boxShadow: SHADOW,
            }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: stat.color, marginBottom: 4 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 10, color: FG3, fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0' }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              border: `2.5px solid ${BORDER}`, borderTopColor: GREEN,
              animation: 'spin 1s linear infinite',
            }} />
            <span style={{ fontSize: 13, color: FG3 }}>Loading 14-day history…</span>
          </div>
        )}

        {/* Day cards */}
        {!loading && dates.map((date, i) => {
          const s        = summaries[i];
          const consumed = s?.totalCalories   ?? 0;
          const burned   = s?.caloriesBurned  ?? 0;
          const hasData  = consumed > 0 || burned > 0;
          const ratio    = Math.min(1, target > 0 ? consumed / target : 0);
          const overTarget = consumed > target && target > 0;
          const barColor = overTarget ? RED : GREEN;

          return (
            <div key={date} style={{
              background: CARD, borderRadius: 20, border: `1px solid ${BORDER}`,
              padding: '14px 16px', marginBottom: 10, boxShadow: SHADOW,
            }}>

              {/* Date label */}
              <div style={{
                fontSize: 13, fontWeight: 800, color: FG1, marginBottom: hasData ? 12 : 8,
              }}>
                {formatDateLabel(date, todayStr)}
                {date === todayStr && (
                  <span style={{
                    marginLeft: 8, fontSize: 9, fontWeight: 800,
                    background: 'rgba(30,127,92,0.10)', color: GREEN,
                    borderRadius: 5, padding: '2px 6px',
                  }}>TODAY</span>
                )}
              </div>

              {!hasData ? (
                <div style={{ fontSize: 12, color: FG3, fontStyle: 'italic' }}>
                  No data logged
                </div>
              ) : (
                <>
                  {/* Stat rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: FG2 }}>🍽️ Consumed</span>
                      <span style={{
                        fontSize: 13, fontWeight: 800,
                        color: overTarget ? RED : GREEN,
                      }}>
                        {consumed.toLocaleString()} kcal
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: FG2 }}>⚡ Burned</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: AMBER }}>
                        {burned.toLocaleString()} kcal
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{
                    height: 4, background: BORDER, borderRadius: 2, overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.round(ratio * 100)}%`,
                      background: barColor,
                      borderRadius: 2,
                      transition: 'width .4s ease',
                    }} />
                  </div>
                  <div style={{ fontSize: 10, color: FG3, marginTop: 4 }}>
                    {Math.round(ratio * 100)}% of {target.toLocaleString()} kcal goal
                  </div>
                </>
              )}
            </div>
          );
        })}

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
