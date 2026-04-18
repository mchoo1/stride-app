'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useStrideStore } from '@/lib/store';

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
  const remaining  = goal - net;          // positive = left, negative = over
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
      {/* Top row: label + chip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          color: T.textMuted, textTransform: 'uppercase',
        }}>
          Net Calories Left
        </span>
        <StatusChip state={chipState} />
      </div>

      {/* Big numeral */}
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

      {/* Sub-label */}
      <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 14 }}>
        {consumed} in &nbsp;·&nbsp; {burned} out &nbsp;·&nbsp; {goal} goal
      </div>

      {/* Progress bar */}
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

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const consumed = totals.calories;
  const net      = Math.max(0, consumed - burned);

  const h = new Date().getHours();
  const greet = h < 5 ? 'NIGHT OWL' : h < 12 ? 'GOOD MORNING' : h < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING';

  const doneCount = challenges.filter(c => c.done).length;

  const handleDeleteFood = (id: string) => {
    setDeletingId(id);
    setTimeout(() => { store.removeFoodEntry(id); setDeletingId(null); }, 280);
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
          {/* Eyebrow */}
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            color: T.textMuted, textTransform: 'uppercase', margin: '0 0 4px',
          }}>
            {dateLabel}
          </p>
          {/* Title */}
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
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  color: T.amber, lineHeight: 1,
                }}>
                  {streak}d
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Avatar */}
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
                      <span style={{
                        fontSize: 15, fontWeight: 700,
                        color: over ? T.red : m.color,
                      }}>
                        {m.val}
                      </span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>&nbsp;/ {m.goal} g</span>
                    </div>
                  </div>
                  <div style={{
                    height: 8, background: T.border, borderRadius: 4, overflow: 'hidden',
                  }}>
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

        {/* ── Today's Food card ── */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <SectionLabel>Recent</SectionLabel>
            <Link href="/log" style={{
              fontSize: 13, fontWeight: 600, color: T.green, textDecoration: 'none', marginTop: -4,
            }}>
              See all
            </Link>
          </div>

          {todayFood.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '18px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🍽️</div>
              <div style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>
                Nothing logged yet
              </div>
            </div>
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

        {/* ── Today's Activity card ── */}
        {todayAct.length > 0 && (
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <SectionLabel>Activity</SectionLabel>
              <Link href="/log?tab=activity" style={{
                fontSize: 13, fontWeight: 600, color: T.amber, textDecoration: 'none', marginTop: -4,
              }}>
                + Add
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todayAct.map(e => (
                <div key={e.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0',
                }}>
                  <span style={{ fontSize: 20 }}>{e.emoji}</span>
                  <span style={{ flex: 1, fontSize: 14, color: T.textPrimary }}>{e.name}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.amber }}>
                    -{e.caloriesBurned} kcal
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

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
                  <div style={{
                    height: 4, background: T.border, borderRadius: 2, overflow: 'hidden',
                  }}>
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
                    : <span style={{
                        fontSize: 11, fontWeight: 700,
                        color: T.textMuted,
                      }}>
                        +{ch.xp} XP
                      </span>
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
