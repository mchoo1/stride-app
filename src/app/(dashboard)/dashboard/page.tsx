'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useStrideStore } from '@/lib/store';
import { proteinPerDollar, ppdColor } from '@/lib/sgFoodDb';

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

// ── Thin divider ───────────────────────────────────────────────────────────
function Divider() {
  return <div style={{ height: 1, background: T.border, margin: '16px 0' }} />;
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

// ── Consolidated today card ────────────────────────────────────────────────
function TodayStatsCard({
  consumed, burned, goal,
  protein, proteinGoal,
  carbs, carbsGoal,
  fat, fatGoal,
}: {
  consumed: number; burned: number; goal: number;
  protein: number;  proteinGoal: number;
  carbs: number;    carbsGoal: number;
  fat: number;      fatGoal: number;
}) {
  const net       = Math.max(0, consumed - burned);
  const remaining = goal - net;
  const over      = remaining < -50;
  const close     = !over && remaining < goal * 0.10;
  const chipState: 'on_track' | 'close' | 'over' = over ? 'over' : close ? 'close' : 'on_track';
  const pct       = Math.min(net / Math.max(goal, 1), 1);
  const barColor  = over ? T.red : close ? T.amber : T.green;
  const numColor  = over ? T.red : T.textPrimary;

  const macros = [
    { label: 'Protein', val: protein, goal: proteinGoal, color: T.blue     },
    { label: 'Carbs',   val: carbs,   goal: carbsGoal,   color: '#C98A2E'  },
    { label: 'Fat',     val: fat,     goal: fatGoal,      color: T.green    },
  ];

  return (
    <div style={{
      background: T.card,
      borderRadius: 24,
      border: `1px solid ${T.border}`,
      boxShadow: T.shadowHero,
      padding: '20px 20px 16px',
      marginBottom: 12,
    }}>
      {/* ── Calories section ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: T.textMuted, textTransform: 'uppercase' }}>
          Calories Today
        </span>
        <StatusChip state={chipState} />
      </div>

      {/* Big remaining number */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 6 }}>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 72, lineHeight: 0.92,
          color: numColor, fontVariantNumeric: 'tabular-nums',
        }}>
          {Math.abs(remaining)}
        </div>
        <div style={{ paddingBottom: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: numColor }}>kcal</div>
          <div style={{ fontSize: 11, color: T.textMuted }}>{remaining >= 0 ? 'remaining' : 'over goal'}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 7, background: T.border, borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
        <div style={{
          height: '100%', width: `${pct * 100}%`,
          background: barColor, borderRadius: 4,
          transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
        }} />
      </div>

      {/* Eaten · Burned · Goal */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 0 }}>
        {[
          { label: 'Eaten',  value: consumed, color: T.textPrimary },
          { label: 'Burned', value: burned,   color: T.amber       },
          { label: 'Goal',   value: goal,     color: T.textMuted   },
        ].map((s, i) => (
          <div key={s.label} style={{
            flex: 1, textAlign: i === 0 ? 'left' : i === 2 ? 'right' : 'center',
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 11, color: T.textMuted }}> {s.label}</span>
          </div>
        ))}
      </div>

      <Divider />

      {/* ── Macros section ── */}
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: T.textMuted, textTransform: 'uppercase', marginBottom: 12 }}>
        Macros
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {macros.map(m => {
          const pct  = Math.min(m.val / Math.max(m.goal, 1), 1);
          const over = m.val > m.goal;
          return (
            <div key={m.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary }}>{m.label}</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: over ? T.red : m.color }}>{m.val}</span>
                  <span style={{ fontSize: 11, color: T.textMuted }}>&nbsp;/ {m.goal} g</span>
                </div>
              </div>
              <div style={{ height: 7, background: T.border, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${pct * 100}%`,
                  background: over ? T.red : m.color, borderRadius: 4,
                  transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
                }} />
              </div>
            </div>
          );
        })}
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

// ── Nearby Eats card ──────────────────────────────────────────────────────
const QUICK_EATS = [
  { name: 'Zinger Burger',      emoji: '🍔', cal: 500, protein: 26, price: 7.20, place: 'KFC'         },
  { name: 'Chicken Rice',       emoji: '🍗', cal: 450, protein: 32, price: 4.50, place: 'Mixed Rice'   },
  { name: 'Ya Kun Egg Set',     emoji: '🍳', cal: 380, protein: 18, price: 5.50, place: 'Ya Kun'       },
  { name: 'Curry Puff',         emoji: '🥟', cal: 240, protein: 6,  price: 1.80, place: 'Old Chang Kee'},
  { name: 'McChicken Burger',   emoji: '🍟', cal: 400, protein: 18, price: 4.45, place: "McDonald's"  },
  { name: 'Subway 6" Chicken',  emoji: '🥖', cal: 330, protein: 24, price: 6.50, place: 'Subway'       },
];

function NearbyEatsCard() {
  return (
    <div style={{
      background: T.card,
      borderRadius: 20,
      border: `1px solid ${T.border}`,
      boxShadow: T.shadowCard,
      padding: '16px 16px 8px',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            color: T.textMuted, textTransform: 'uppercase',
          }}>
            Nearby Eats
          </span>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Popular picks with best protein/$</div>
        </div>
        <Link href="/eat" style={{
          fontSize: 12, fontWeight: 700, color: T.green, textDecoration: 'none',
          background: 'rgba(30,127,92,0.08)', border: '1px solid rgba(30,127,92,0.18)',
          borderRadius: 10, padding: '5px 10px',
        }}>
          Find more →
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {QUICK_EATS.map((item, idx) => {
          const ppd  = proteinPerDollar(item.protein, item.price);
          const ppdC = ppdColor(ppd);
          return (
            <div key={idx} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 4px',
              borderBottom: idx < QUICK_EATS.length - 1 ? `1px solid ${T.border}` : 'none',
            }}>
              <span style={{ fontSize: 22, flexShrink: 0, width: 32, textAlign: 'center' }}>{item.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 11, color: T.textMuted }}>{item.place} · {item.cal} kcal · P{item.protein}g</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.green }}>${item.price.toFixed(2)}</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: ppdC }}>{ppd}g/$</div>
              </div>
            </div>
          );
        })}
      </div>

      <Link href="/eat" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '12px 0', textDecoration: 'none', marginTop: 4,
        background: 'rgba(30,127,92,0.05)',
        borderRadius: 14,
        border: `1px dashed rgba(30,127,92,0.20)`,
      }}>
        <span style={{ fontSize: 16 }}>🗺️</span>
        <span style={{ fontSize: 13, color: T.green, fontWeight: 700 }}>
          See all nearby restaurants →
        </span>
      </Link>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const store   = useStrideStore();
  const profile = store.profile;
  const totals  = store.getTodayTotals();
  const burned  = store.getTodayCaloriesBurned();
  const streak  = store.streak;

  // ── On mount: pull live data from Firestore ────────────────────────────
  useEffect(() => {
    store.loadTodayFromServer().catch(() => {/* offline — local state serves fine */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const consumed = totals.calories;

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

        {/* ── Consolidated today card ── */}
        <TodayStatsCard
          consumed={consumed}
          burned={burned}
          goal={profile.targetCalories}
          protein={totals.protein}
          proteinGoal={profile.targetProtein || Math.round((profile.targetCalories * 0.30) / 4)}
          carbs={totals.carbs}
          carbsGoal={profile.targetCarbs || Math.round((profile.targetCalories * 0.45) / 4)}
          fat={totals.fat}
          fatGoal={profile.targetFat || Math.round((profile.targetCalories * 0.25) / 9)}
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

        {/* ── Nearby Eats ── */}
        <NearbyEatsCard />

        {/* ── Move shortcut ── */}
        <Link href="/move" style={{
          display: 'flex', borderRadius: 20,
          padding: '16px 14px',
          background: T.card,
          border: `1px solid ${T.border}`,
          boxShadow: T.shadowCard,
          textDecoration: 'none',
          alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 24 }}>⚡</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>Move</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Nearby gyms &amp; activities</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 13, color: T.textMuted }}>›</div>
        </Link>

      </div>
    </div>
  );
}
