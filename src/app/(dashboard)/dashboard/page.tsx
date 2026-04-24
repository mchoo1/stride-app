'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useStrideStore } from '@/lib/store';
import { api } from '@/lib/apiClient';

// ── Design tokens ──────────────────────────────────────────────────────────
const T = {
  canvas:        '#F7F8FB',
  card:          '#FFFFFF',
  border:        '#E5E9F2',
  shadowCard:    '0 1px 2px rgba(15,27,45,0.04), 0 1px 3px rgba(15,27,45,0.03)',
  shadowHero:    '0 8px 24px rgba(15,27,45,0.08)',
  textPrimary:   '#0F1B2D',
  textSecondary: '#5B6576',
  textMuted:     '#8B95A7',
  green:         '#1E7F5C',
  amber:         '#F2A93B',
  red:           '#D04E36',
  blue:          '#2E6FB8',
  fontDisplay:   "'Anton', Impact, sans-serif",
} as const;

// ── Types ──────────────────────────────────────────────────────────────────
interface DaySummary {
  date:            string;
  totalCalories:   number;
  totalProteinG:   number;
  totalCarbsG:     number;
  totalFatG:       number;
  totalWaterMl:    number;
  caloriesBurned:  number;
  activeMins:      number;
  netCalories:     number;
  targetCalories:  number | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getLast7Dates(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr === today) return 'Today';
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

// ── Status chip ────────────────────────────────────────────────────────────
function StatusChip({ state }: { state: 'on_track' | 'close' | 'over' }) {
  const map = {
    on_track: { label: 'On track',     color: T.green, bg: 'rgba(30,127,92,0.10)' },
    close:    { label: 'Close',        color: T.amber, bg: 'rgba(242,169,59,0.14)' },
    over:     { label: 'Over budget',  color: T.red,   bg: 'rgba(208,78,54,0.10)' },
  };
  const s = map[state];
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.bg, borderRadius: 99, padding: '4px 10px',
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: s.color, lineHeight: 1 }}>{s.label}</span>
    </div>
  );
}

// ── Hero calorie card ──────────────────────────────────────────────────────
function CalorieHeroCard({
  net, goal, consumed, burned,
}: { net: number; goal: number; consumed: number; burned: number }) {
  const remaining  = goal - net;
  const over       = remaining < -50;
  const close      = !over && remaining < goal * 0.10;
  const chipState: 'on_track' | 'close' | 'over' = over ? 'over' : close ? 'close' : 'on_track';

  const pct        = Math.min(net / Math.max(goal, 1), 1);
  const barColor   = over ? T.red : close ? T.amber : T.green;
  const numColor   = over ? T.red : T.textPrimary;

  return (
    <div style={{
      background: T.card,
      borderRadius: 24,
      border: `1px solid ${T.border}`,
      boxShadow: T.shadowHero,
      padding: '20px 20px 18px',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          color: T.textMuted, textTransform: 'uppercase',
        }}>
          Net Calories Left
        </span>
        <StatusChip state={chipState} />
      </div>

      <div style={{
        fontFamily: T.fontDisplay,
        fontSize: 96,
        lineHeight: 0.92,
        color: numColor,
        fontVariantNumeric: 'tabular-nums',
        marginBottom: 12,
      }}>
        {Math.abs(remaining)}
      </div>

      <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 14 }}>
        {consumed} in &nbsp;·&nbsp; {burned} out &nbsp;·&nbsp; {goal} goal
      </div>

      <div>
        <div style={{
          height: 8, background: T.border, borderRadius: 4, overflow: 'hidden', marginBottom: 6,
        }}>
          <div style={{
            height: '100%',
            width: `${pct * 100}%`,
            background: barColor,
            borderRadius: 4,
            transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: T.textMuted }}>0</span>
          <span style={{ fontSize: 12, color: T.textMuted }}>{goal} kcal</span>
        </div>
      </div>
    </div>
  );
}

// ── 7-day trend chart ──────────────────────────────────────────────────────
function WeeklyTrendCard({
  history, goal, loading,
}: { history: DaySummary[]; goal: number; loading: boolean }) {
  const chartData = history.map(d => ({
    day:      dayLabel(d.date),
    calories: d.totalCalories,
    burned:   d.caloriesBurned,
    goal,
    hasData:  d.totalCalories > 0,
  }));

  const avgCalories = history.length
    ? Math.round(history.reduce((s, d) => s + d.totalCalories, 0) / history.length)
    : 0;
  const totalBurned = history.reduce((s, d) => s + d.caloriesBurned, 0);
  const activeDays  = history.filter(d => d.caloriesBurned > 0 || d.totalCalories > 0).length;

  return (
    <div style={{
      background: T.card,
      borderRadius: 20,
      border: `1px solid ${T.border}`,
      boxShadow: T.shadowCard,
      padding: '16px 16px 12px',
      marginBottom: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          color: T.textMuted, textTransform: 'uppercase',
        }}>
          7-Day History
        </span>
        <Link href="/me" style={{ fontSize: 13, fontWeight: 600, color: T.blue, textDecoration: 'none' }}>
          Full log →
        </Link>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16 }}>
        {[
          { label: 'Avg calories', value: loading ? '–' : `${avgCalories}`, unit: 'kcal/day', color: T.textPrimary },
          { label: 'Total burned', value: loading ? '–' : `${totalBurned}`,  unit: 'kcal',     color: T.amber },
          { label: 'Active days',  value: loading ? '–' : `${activeDays}`,   unit: '/ 7',       color: T.green },
        ].map((s, i) => (
          <div key={s.label} style={{
            flex: 1,
            borderLeft: i > 0 ? `1px solid ${T.border}` : 'none',
            paddingLeft: i > 0 ? 12 : 0,
            marginLeft:  i > 0 ? 12 : 0,
          }}>
            <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, marginBottom: 2 }}>
              {s.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{ fontSize: 20, fontWeight: 700, fontFamily: T.fontDisplay, color: s.color }}>
                {s.value}
              </span>
              <span style={{ fontSize: 10, color: T.textMuted }}>{s.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {loading ? (
        <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 12, color: T.textMuted }}>Loading history…</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -32, bottom: 0 }}>
            <defs>
              <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={T.green} stopOpacity={0.18} />
                <stop offset="95%" stopColor={T.green} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="burnGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={T.amber} stopOpacity={0.18} />
                <stop offset="95%" stopColor={T.amber} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: T.textMuted }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide domain={[0, Math.max(goal * 1.2, 500)]} />
            <Tooltip
              contentStyle={{
                background: T.card, border: `1px solid ${T.border}`,
                borderRadius: 10, fontSize: 11, boxShadow: T.shadowCard,
              }}
              formatter={(val: number, name: string) => [
                `${val} kcal`,
                name === 'calories' ? 'Consumed' : 'Burned',
              ]}
              labelStyle={{ color: T.textPrimary, fontWeight: 700, marginBottom: 2 }}
            />
            <ReferenceLine
              y={goal}
              stroke={T.textMuted}
              strokeDasharray="4 3"
              strokeWidth={1}
            />
            <Area
              type="monotone"
              dataKey="calories"
              stroke={T.green}
              strokeWidth={2}
              fill="url(#calGrad)"
              dot={false}
              activeDot={{ r: 4, fill: T.green, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="burned"
              stroke={T.amber}
              strokeWidth={1.5}
              fill="url(#burnGrad)"
              strokeDasharray="4 3"
              dot={false}
              activeDot={{ r: 4, fill: T.amber, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 6 }}>
        {[
          { color: T.green, label: 'Consumed', dash: false },
          { color: T.amber, label: 'Burned',   dash: true  },
          { color: T.textMuted, label: 'Goal', dash: true  },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 16, height: 2,
              background: l.dash
                ? `repeating-linear-gradient(90deg,${l.color} 0 3px,transparent 3px 6px)`
                : l.color,
            }} />
            <span style={{ fontSize: 10, color: T.textMuted }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Activity summary ───────────────────────────────────────────────────────
function ActivitySummaryCard({
  entries, weekBurned, weekMins,
}: {
  entries: Array<{ id: string; emoji: string; name: string; caloriesBurned: number; durationMins: number }>;
  weekBurned: number;
  weekMins: number;
}) {
  const todayBurned = entries.reduce((s, e) => s + e.caloriesBurned, 0);
  const todayMins   = entries.reduce((s, e) => s + e.durationMins, 0);

  return (
    <div style={{
      background: T.card,
      borderRadius: 20,
      border: `1px solid ${T.border}`,
      boxShadow: T.shadowCard,
      padding: 16,
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          color: T.textMuted, textTransform: 'uppercase',
        }}>
          Activity
        </span>
        <Link href="/log?tab=activity" style={{
          fontSize: 13, fontWeight: 600, color: T.amber, textDecoration: 'none',
        }}>
          + Log
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 0, marginBottom: entries.length > 0 ? 14 : 0 }}>
        {[
          { label: 'Today burned', value: todayBurned,  unit: 'kcal', color: T.amber },
          { label: 'Active mins',  value: todayMins,    unit: 'min',  color: T.blue  },
          { label: '7-day burned', value: weekBurned,   unit: 'kcal', color: T.green },
        ].map((s, i) => (
          <div key={s.label} style={{
            flex: 1,
            borderLeft: i > 0 ? `1px solid ${T.border}` : 'none',
            paddingLeft: i > 0 ? 12 : 0,
            marginLeft:  i > 0 ? 12 : 0,
          }}>
            <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, marginBottom: 2 }}>
              {s.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontSize: 20, fontWeight: 700, fontFamily: T.fontDisplay, color: s.color }}>
                {s.value}
              </span>
              <span style={{ fontSize: 10, color: T.textMuted }}>{s.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Today's activity list */}
      {entries.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {entries.map(e => (
            <div key={e.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '6px 8px',
              background: 'rgba(242,169,59,0.05)',
              borderRadius: 10,
              border: `1px solid rgba(242,169,59,0.12)`,
            }}>
              <span style={{ fontSize: 18 }}>{e.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{e.name}</div>
                <div style={{ fontSize: 11, color: T.textMuted }}>{e.durationMins} min</div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.amber }}>
                -{e.caloriesBurned} kcal
              </span>
            </div>
          ))}
        </div>
      ) : (
        <Link href="/log?tab=activity" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '14px 0', textDecoration: 'none',
          background: 'rgba(242,169,59,0.05)',
          borderRadius: 12,
          border: `1px dashed rgba(242,169,59,0.25)`,
          marginTop: 2,
        }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <span style={{ fontSize: 13, color: T.amber, fontWeight: 600 }}>
            Log today&apos;s activity
          </span>
        </Link>
      )}
    </div>
  );
}

// ── Quick action tile ──────────────────────────────────────────────────────
function QuickTile({
  href, icon, label, iconBg,
}: { href: string; icon: React.ReactNode; label: string; iconBg: string }) {
  return (
    <Link href={href} style={{
      flex: 1, background: T.card, borderRadius: 20,
      border: `1px solid ${T.border}`,
      boxShadow: T.shadowCard,
      padding: '16px 12px',
      textDecoration: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 14,
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, textAlign: 'center' }}>
        {label}
      </span>
    </Link>
  );
}

// ── Section label ──────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
      color: T.textMuted, textTransform: 'uppercase', marginBottom: 14,
    }}>
      {children}
    </div>
  );
}

// ── White card wrapper ─────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: T.card,
      borderRadius: 20,
      border: `1px solid ${T.border}`,
      boxShadow: T.shadowCard,
      padding: 16,
      marginBottom: 12,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const store      = useStrideStore();
  const profile    = store.profile;
  const totals     = store.getTodayTotals();
  const burned     = store.getTodayCaloriesBurned();
  const todayFood  = store.getTodayFoodLog();
  const todayAct   = store.getTodayActivityLog();
  const challenges = store.getDailyChallenges();
  const streak     = store.streak;

  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [history,     setHistory]     = useState<DaySummary[]>([]);
  const [histLoading, setHistLoading] = useState(true);

  // ── On mount: pull live data from Firestore ────────────────────────────
  useEffect(() => {
    // 1. Sync today's logs (food, activity, water, streak) into the Zustand store
    store.loadTodayFromServer().catch(() => {/* offline — local state serves fine */});

    // 2. Fetch the last 7 days of daily summaries for the trend chart
    const dates = getLast7Dates();
    Promise.all(dates.map(d => api.summary.getByDate(d).catch(() => null)))
      .then(results => {
        const filled: DaySummary[] = dates.map((date, i) => {
          const r = results[i] as DaySummary | null;
          return r
            ? { ...r, date }
            : {
                date,
                totalCalories:  0,
                totalProteinG:  0,
                totalCarbsG:    0,
                totalFatG:      0,
                totalWaterMl:   0,
                caloriesBurned: 0,
                activeMins:     0,
                netCalories:    0,
                targetCalories: profile.targetCalories ?? null,
              };
        });
        setHistory(filled);
      })
      .finally(() => setHistLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const consumed = totals.calories;
  const net      = Math.max(0, consumed - burned);

  const h = new Date().getHours();
  // greet is declared but used as a potential future feature — keeping for now
  const _greet = h < 5 ? 'NIGHT OWL' : h < 12 ? 'GOOD MORNING' : h < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING';

  const doneCount = challenges.filter(c => c.done).length;

  // Week-level stats derived from history
  const weekBurned = history.reduce((s, d) => s + d.caloriesBurned, 0);
  const weekMins   = history.reduce((s, d) => s + d.activeMins, 0);

  const handleDeleteFood = (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      store.removeFoodEntry(id);
      setDeletingId(null);
      // Recompute summary so history reflects the deletion
      api.summary.recompute().then(updated => {
        if (!updated) return;
        setHistory(prev => prev.map(d =>
          d.date === updated.date ? { ...d, ...updated } : d
        ));
      }).catch(() => {/* silently ignore */});
    }, 280);
  };

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  }).toUpperCase();

  return (
    <div style={{ background: T.canvas, minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div style={{
        padding: '52px 20px 8px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            color: T.textMuted, textTransform: 'uppercase', margin: '0 0 4px',
          }}>
            {dateLabel}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{
              fontFamily: T.fontDisplay,
              fontSize: 40,
              lineHeight: 1,
              color: T.textPrimary,
              margin: 0,
            }}>
              TODAY
            </h1>
            {streak > 0 && (
              <div style={{
                background: 'rgba(242,169,59,0.12)',
                borderRadius: 99,
                padding: '4px 10px',
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                <span style={{ fontSize: 14 }}>🔥</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.amber, lineHeight: 1 }}>
                  {streak}d
                </span>
              </div>
            )}
          </div>
        </div>

        <Link href="/me" style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(15,27,45,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none', fontSize: 18, flexShrink: 0,
        }}>
          👤
        </Link>
      </div>

      <div style={{ padding: '16px 16px 100px' }}>

        {/* ── Hero Calorie Card ── */}
        <CalorieHeroCard
          net={net}
          goal={profile.targetCalories}
          consumed={consumed}
          burned={burned}
        />

        {/* ── Quick action row ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <QuickTile
            href="/log"
            label="Log food"
            iconBg="rgba(30,127,92,0.10)"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke={T.green} strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            }
          />
          <QuickTile
            href="/scan"
            label="Scan"
            iconBg="rgba(46,111,184,0.10)"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke={T.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            }
          />
          <QuickTile
            href="/log?tab=activity"
            label="Activity"
            iconBg="rgba(242,169,59,0.14)"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke={T.amber} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
              </svg>
            }
          />
        </div>

        {/* ── 7-day trend chart ── */}
        <WeeklyTrendCard
          history={history}
          goal={profile.targetCalories}
          loading={histLoading}
        />

        {/* ── Macros card ── */}
        <Card>
          <SectionLabel>Today&apos;s Macros</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              {
                label: 'Protein',
                val:   totals.protein,
                goal:  profile.targetProtein || Math.round((profile.targetCalories * 0.30) / 4),
                color: T.blue,
              },
              {
                label: 'Carbs',
                val:   totals.carbs,
                goal:  profile.targetCarbs || Math.round((profile.targetCalories * 0.45) / 4),
                color: '#C98A2E',
              },
              {
                label: 'Fat',
                val:   totals.fat,
                goal:  profile.targetFat || Math.round((profile.targetCalories * 0.25) / 9),
                color: T.green,
              },
            ].map(m => {
              const pct  = Math.min(m.val / Math.max(m.goal, 1), 1);
              const over = m.val > m.goal;
              const barColor = over ? T.red : m.color;
              return (
                <div key={m.label}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'baseline', marginBottom: 6,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary }}>
                      {m.label}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: over ? T.red : m.color }}>
                        {m.val}
                      </span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>&nbsp;/ {m.goal} g</span>
                    </div>
                  </div>
                  <div style={{ height: 8, background: T.border, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct * 100}%`,
                      background: barColor,
                      borderRadius: 4,
                      transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ── Activity summary (always shown) ── */}
        <ActivitySummaryCard
          entries={todayAct}
          weekBurned={weekBurned}
          weekMins={weekMins}
        />

        {/* ── Today's Food log ── */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <SectionLabel>Today&apos;s Food</SectionLabel>
            <Link href="/log" style={{
              fontSize: 13, fontWeight: 600, color: T.green, textDecoration: 'none', marginTop: -4,
            }}>
              See all
            </Link>
          </div>

          {todayFood.length === 0 ? (
            <Link href="/log" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px 0', textDecoration: 'none',
              background: 'rgba(30,127,92,0.04)',
              borderRadius: 12,
              border: `1px dashed rgba(30,127,92,0.20)`,
            }}>
              <span style={{ fontSize: 20 }}>🍽️</span>
              <span style={{ fontSize: 13, color: T.green, fontWeight: 600 }}>
                Log your first meal
              </span>
            </Link>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {todayFood.slice(-5).map(e => (
                <div key={e.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 4px', borderRadius: 10,
                  opacity:   deletingId === e.id ? 0.3 : 1,
                  transform: deletingId === e.id ? 'translateX(-10px)' : 'none',
                  transition: 'opacity .28s, transform .28s',
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: T.green, flexShrink: 0,
                  }} />
                  <span style={{
                    flex: 1, fontSize: 14, color: T.textPrimary,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {e.name}
                  </span>
                  <span style={{
                    fontFamily: T.fontDisplay,
                    fontSize: 22, lineHeight: 1,
                    color: T.textSecondary,
                  }}>
                    {e.calories}
                  </span>
                  <span style={{ fontSize: 11, color: T.textMuted, marginLeft: -4 }}>kcal</span>
                  <button
                    onClick={() => handleDeleteFood(e.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: T.textMuted, fontSize: 14, padding: '0 2px', lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {todayFood.length > 5 && (
                <Link href="/log" style={{
                  fontSize: 12, color: T.textMuted, textDecoration: 'none',
                  textAlign: 'center', paddingTop: 6,
                }}>
                  +{todayFood.length - 5} more entries
                </Link>
              )}
            </div>
          )}
        </Card>

        {/* ── Daily Challenges card ── */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <SectionLabel>Daily Challenges</SectionLabel>
            <div style={{
              fontSize: 12, fontWeight: 600,
              color: doneCount === 3 ? T.green : T.textMuted,
              background: doneCount === 3 ? 'rgba(30,127,92,0.10)' : T.border,
              borderRadius: 99, padding: '3px 10px',
            }}>
              {doneCount}/3 done
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {challenges.map(ch => (
              <div key={ch.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px',
                background: ch.done ? 'rgba(30,127,92,0.06)' : T.canvas,
                borderRadius: 12,
                border: `1px solid ${ch.done ? 'rgba(30,127,92,0.15)' : T.border}`,
              }}>
                <span style={{ fontSize: 20 }}>{ch.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600,
                    color: ch.done ? T.green : T.textPrimary,
                    marginBottom: 5,
                  }}>
                    {ch.label}
                  </div>
                  <div style={{ height: 4, background: T.border, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      borderRadius: 2,
                      width: `${Math.min((ch.current / ch.target) * 100, 100)}%`,
                      background: ch.done ? T.green : T.textMuted,
                      transition: 'width .5s',
                    }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {ch.done
                    ? <span style={{ fontSize: 18 }}>✅</span>
                    : <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted }}>+{ch.xp} XP</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Discover row ── */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/eat" style={{
            flex: 1, borderRadius: 20,
            padding: '16px 14px',
            background: T.card,
            border: `1px solid ${T.border}`,
            boxShadow: T.shadowCard,
            textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 24 }}>🍜</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>What to Eat</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Fits your budget</div>
            </div>
          </Link>
          <Link href="/move" style={{
            flex: 1, borderRadius: 20,
            padding: '16px 14px',
            background: T.card,
            border: `1px solid ${T.border}`,
            boxShadow: T.shadowCard,
            textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 24 }}>⚡</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>Move</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Nearby activities</div>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}
