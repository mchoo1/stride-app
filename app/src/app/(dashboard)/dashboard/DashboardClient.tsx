'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useStrideStore } from '@/lib/store';
import { calculateTargetCalories, calculateMacros } from '@/lib/utils';
import {
  SG_RESTAURANTS, proteinPerDollar,
  type SGRestaurant, type SGMenuItem,
} from '@/lib/sgFoodDb';
import CalorieRing from '@/components/ui/CalorieRing';
import MacroBars from '@/components/ui/MacroBars';
import Avatar from '@/components/ui/Avatar';
import ValueBadge from '@/components/ui/ValueBadge';

/* ── helpers ── */
function todayLabel() {
  return new Date().toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'long' });
}

function getPopularMeals(): Array<{ item: SGMenuItem; restaurant: SGRestaurant }> {
  const out: Array<{ item: SGMenuItem; restaurant: SGRestaurant }> = [];
  for (const r of SG_RESTAURANTS) {
    const picks = r.menu.filter(m => m.isPopular).slice(0, 1);
    if (!picks.length) picks.push(r.menu[0]);
    picks.forEach(item => out.push({ item, restaurant: r }));
  }
  return out.slice(0, 10);
}

function getBestValueMeals(): Array<{ item: SGMenuItem; restaurant: SGRestaurant; ppd: number }> {
  const out: Array<{ item: SGMenuItem; restaurant: SGRestaurant; ppd: number }> = [];
  for (const r of SG_RESTAURANTS) {
    for (const item of r.menu) {
      if (item.price && item.protein) {
        const ppd = proteinPerDollar(item.protein, item.price);
        if (ppd > 0) out.push({ item, restaurant: r, ppd });
      }
    }
  }
  return out.sort((a, b) => b.ppd - a.ppd).slice(0, 6);
}

/* ── Value meter ── */
function ValueMeter({ value, max = 7 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="meter">
      <span className="meter-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ── Best-value rail card ── */
function BestValueCard({ item, restaurant, ppd, index }: {
  item: SGMenuItem; restaurant: SGRestaurant; ppd: number; index: number;
}) {
  const isTop = index === 0;
  return (
    <Link
      href={`/eat?r=${restaurant.id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        width: 186,
        background: 'var(--surface)',
        borderRadius: 'var(--r-card)',
        boxShadow: 'var(--shadow-md)',
        padding: 16,
        textDecoration: 'none',
        animation: `scaleIn .4s ease ${index * 0.05}s both`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <Avatar name={restaurant.name} size={40} radius={12} />
        {isTop && (
          <span style={{
            fontSize: 10.5, fontWeight: 700, color: 'var(--gold)',
            background: 'var(--gold-tint)', padding: '3px 8px', borderRadius: 999,
          }}>
            ★ TOP
          </span>
        )}
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2, marginBottom: 2 }}>
        {item.name}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', marginBottom: 14 }}>
        {restaurant.name}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
        <span style={{
          fontFamily: '"Space Grotesk", system-ui, sans-serif',
          fontSize: 26, fontWeight: 700, color: 'var(--gold)', letterSpacing: '-0.03em',
        }}>
          {ppd.toFixed(1)}
        </span>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--gold)' }}>g protein / $</span>
      </div>
      <ValueMeter value={ppd} />
      <div style={{ display: 'flex', gap: 8, marginTop: 10, fontSize: 12.5 }}>
        {item.price != null && (
          <span style={{ fontFamily: '"Space Grotesk", system-ui, sans-serif', fontWeight: 700, color: 'var(--ink)' }}>
            ${item.price.toFixed(2)}
          </span>
        )}
        <span style={{ color: 'var(--muted)' }}>·</span>
        <span style={{ fontFamily: '"Space Grotesk", system-ui, sans-serif', color: 'var(--ink-2)', fontWeight: 600 }}>
          {item.calories} cal
        </span>
      </div>
    </Link>
  );
}

/* ── Popular meal row ── */
function PopularMealRow({ item, restaurant }: { item: SGMenuItem; restaurant: SGRestaurant }) {
  const ppd = item.price ? proteinPerDollar(item.protein, item.price) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, padding: '14px 0' }}>
      <Avatar name={item.name} size={46} radius={14} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2 }}>
          {item.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 600, color: 'var(--green)' }}>
          {restaurant.name}
          {restaurant.dietTags?.includes('halal') && (
            <span style={{ color: 'var(--muted)', fontWeight: 500 }}>· Halal</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 1, flexWrap: 'wrap' }}>
          {item.price != null && (
            <span style={{ fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
              ${item.price.toFixed(2)}
            </span>
          )}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12.5, color: 'var(--ink-2)' }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--coral)', display: 'inline-block' }} />
            <span style={{ fontFamily: '"Space Grotesk", system-ui, sans-serif', fontWeight: 600 }}>{item.calories}</span>&nbsp;cal
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12.5, color: 'var(--ink-2)' }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--green)', display: 'inline-block' }} />
            <span style={{ fontFamily: '"Space Grotesk", system-ui, sans-serif', fontWeight: 600 }}>{item.protein}g</span>&nbsp;protein
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
        {ppd > 0 && <ValueBadge value={ppd} />}
        <Link
          href="/log/food"
          style={{
            width: 36, height: 36, borderRadius: 11, flexShrink: 0,
            background: 'var(--green-tint)', color: 'var(--green-deep)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            textDecoration: 'none', fontSize: 20, lineHeight: 1,
          }}
        >
          +
        </Link>
      </div>
    </div>
  );
}

/* ════════════════════════════════════ Main ══════════════════════════════ */
export default function DashboardClient() {
  const { user }  = useAuth();
  const store     = useStrideStore();
  const profile   = store.profile;

  const firstName = user?.displayName?.split(' ')[0] ?? profile.name?.split(' ')[0] ?? 'there';

  useEffect(() => { store.loadTodayFromServer?.(); }, []); // eslint-disable-line

  const totals       = store.getTodayTotals();
  const targetCal    = calculateTargetCalories(profile);
  const macroTargets = calculateMacros(targetCal, profile.goalType ?? 'maintenance');
  const burned       = (store as unknown as { todayBurned?: number }).todayBurned ?? 0;

  const macroData = {
    protein: { have: totals.protein, goal: macroTargets.protein },
    carbs:   { have: totals.carbs,   goal: macroTargets.carbs   },
    fat:     { have: totals.fat,     goal: macroTargets.fat     },
  };

  const streak    = store.streak ?? 0;
  const bestMeals = getBestValueMeals();
  const popular   = getPopularMeals();

  const FILTER_CHIPS = [
    { label: 'Best Value', icon: true },
    { label: 'High Protein', icon: false },
    { label: 'Halal', icon: false },
    { label: 'Grab & Go', icon: false },
    { label: 'Recipes', icon: false },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 88 }}>

      {/* Greeting */}
      <div style={{ padding: '52px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 }}>
          <span className="eyebrow">{todayLabel()}</span>
          <h1 className="title animate-enter" style={{ margin: 0, whiteSpace: 'nowrap' }}>Hello, {firstName}</h1>
        </div>
        {streak > 0 && (
          <div className="streak-pill">
            🔥 {streak}d
          </div>
        )}
      </div>

      {/* TODAY HERO */}
      <div style={{ padding: '0 20px', marginBottom: 20 }}>
        <Link
          href="/log"
          className="card-hero animate-enter-d1"
          style={{ display: 'block', padding: '20px 20px 22px', textDecoration: 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
            <CalorieRing eaten={totals.calories} budget={targetCal} burned={burned} size={128} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'rgba(255,255,255,0.18)', color: '#fff',
                fontSize: 12, fontWeight: 700, padding: '4px 11px', borderRadius: 999,
                alignSelf: 'flex-start',
              }}>✓ On track</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Eaten</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                  <span style={{ fontFamily: '"Space Grotesk",system-ui,sans-serif', fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' }}>{totals.calories.toLocaleString()}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.70)', fontWeight: 600 }}>kcal</span>
                </div>
              </div>
              {burned > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Burned</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                    <span style={{ fontFamily: '"Space Grotesk",system-ui,sans-serif', fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' }}>{burned.toLocaleString()}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.70)', fontWeight: 600 }}>kcal</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <MacroBars data={macroData} onDark />
        </Link>
      </div>

      {/* Search */}
      <div style={{ padding: '0 20px', marginBottom: 14 }}>
        <Link href="/eat" style={{ textDecoration: 'none' }}>
          <div className="search-field animate-enter-d2" style={{ cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 4.5 4.5" />
            </svg>
            <span>Search meals, restaurants, recipes…</span>
          </div>
        </Link>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 9, overflowX: 'auto', padding: '2px 20px', marginBottom: 26, scrollbarWidth: 'none' }}>
        {FILTER_CHIPS.map(({ label, icon }) => (
          <Link key={label} href={`/eat?q=${encodeURIComponent(label)}`} className="chip" style={{ textDecoration: 'none' }}>
            {icon && (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            )}
            {label}
          </Link>
        ))}
      </div>

      {/* Best value section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 20px', marginBottom: 13 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h2 className="section" style={{ margin: 0 }}>Best value right now</h2>
          <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 500 }}>Most protein per dollar</span>
        </div>
        <Link href="/eat?sort=ppd" style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--green)', fontWeight: 600, fontSize: 13.5, textDecoration: 'none', whiteSpace: 'nowrap' }}>
          See all <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </Link>
      </div>

      {/* Best value rail */}
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '2px 20px 6px', marginBottom: 28, scrollbarWidth: 'none' }}>
        {bestMeals.map((m, i) => (
          <BestValueCard key={`${m.restaurant.id}-${m.item.id}`} item={m.item} restaurant={m.restaurant} ppd={m.ppd} index={i} />
        ))}
      </div>

      {/* Popular meals */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 20px', marginBottom: 4 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h2 className="section" style={{ margin: 0 }}>Popular meals</h2>
          <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 500 }}>Price · calories · protein per dollar</span>
        </div>
        <Link href="/eat" style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--green)', fontWeight: 600, fontSize: 13.5, textDecoration: 'none', whiteSpace: 'nowrap' }}>
          Browse <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </Link>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div className="card-md" style={{ padding: '4px 16px' }}>
          {popular.map(({ item, restaurant }, i) => (
            <div key={`${restaurant.id}-${item.id}`}>
              {i > 0 && <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: 0 }} />}
              <PopularMealRow item={item} restaurant={restaurant} />
            </div>
          ))}
        </div>
      </div>

      {/* Guest CTA */}
      {!user && (
        <div style={{ padding: '24px 20px 0' }}>
          <div className="card" style={{ padding: '22px 20px' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Track what you eat</div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 20, lineHeight: 1.6 }}>
              Sign in to log meals, track macros, and monitor progress.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/login" className="btn-secondary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>Sign in</Link>
              <Link href="/register" className="btn-primary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>Get started</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
