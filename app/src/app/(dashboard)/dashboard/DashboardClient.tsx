'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useStrideStore } from '@/lib/store';
import { calculateTargetCalories } from '@/lib/utils';
import {
  SG_RESTAURANTS, proteinPerDollar,
  type SGRestaurant, type SGMenuItem,
} from '@/lib/sgFoodDb';
import Avatar from '@/components/ui/Avatar';
import ValueBadge from '@/components/ui/ValueBadge';

/* ── helpers ── */
function todayLabel() {
  return new Date().toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
}

function getPopularMeals(): Array<{ item: SGMenuItem; restaurant: SGRestaurant }> {
  const out: Array<{ item: SGMenuItem; restaurant: SGRestaurant }> = [];
  for (const r of SG_RESTAURANTS) {
    const picks = r.menu.filter(m => m.isPopular).slice(0, 1);
    if (!picks.length) picks.push(r.menu[0]);
    picks.forEach(item => out.push({ item, restaurant: r }));
  }
  return out.slice(0, 8);
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

/* ── Mini calorie ring (slim strip) ── */
function MiniRing({ frac, size = 38 }: { frac: number; size?: number }) {
  const sw = 4, r = (size - sw) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--green-tint-2)" strokeWidth={sw} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--green)" strokeWidth={sw}
        strokeLinecap="round" strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.min(1, Math.max(0, frac)))}
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.22,.61,.36,1)' }} />
    </svg>
  );
}

/* ── Value meter bar ── */
function ValueMeter({ value, max = 7 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ height: 5, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, var(--gold-bright), var(--gold))' }} />
    </div>
  );
}

/* ── Best value card (horizontal rail) ── */
function BestValueCard({ item, restaurant, ppd, index }: {
  item: SGMenuItem; restaurant: SGRestaurant; ppd: number; index: number;
}) {
  return (
    <Link href={`/eat?r=${restaurant.id}`} style={{
      display: 'flex', flexDirection: 'column', flexShrink: 0, width: 190,
      background: 'var(--surface)', borderRadius: 'var(--r-card)',
      boxShadow: 'var(--shadow-md)', padding: 16, textDecoration: 'none',
      animation: `scaleIn .4s ease ${index * 0.05}s both`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <Avatar name={restaurant.name} size={40} radius={12} />
        {index === 0 && (
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', background: 'var(--gold-tint)', padding: '3px 8px', borderRadius: 999 }}>⭐ TOP</span>
        )}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2, marginBottom: 2 }}>{item.name}</div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--green)', marginBottom: 14 }}>{restaurant.name}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 8 }}>
        <span style={{ fontFamily: '"Space Grotesk",system-ui,sans-serif', fontSize: 26, fontWeight: 700, color: 'var(--gold)', letterSpacing: '-0.03em' }}>{ppd.toFixed(1)}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gold)' }}>g protein / $</span>
      </div>
      <ValueMeter value={ppd} />
      <div style={{ display: 'flex', gap: 6, marginTop: 10, fontSize: 12 }}>
        {item.price != null && <span style={{ fontFamily: '"Space Grotesk",system-ui,sans-serif', fontWeight: 700, color: 'var(--ink)' }}>${item.price.toFixed(2)}</span>}
        <span style={{ color: 'var(--faint)' }}>·</span>
        <span style={{ fontFamily: '"Space Grotesk",system-ui,sans-serif', color: 'var(--ink-2)', fontWeight: 600 }}>{item.calories} cal</span>
      </div>
    </Link>
  );
}

/* ── Popular meal row ── */
function PopularMealRow({ item, restaurant }: { item: SGMenuItem; restaurant: SGRestaurant }) {
  const ppd = item.price ? proteinPerDollar(item.protein, item.price) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 0' }}>
      <Avatar name={item.name} size={44} radius={13} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 3, lineHeight: 1.2 }}>{item.name}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', marginBottom: 4 }}>
          {restaurant.name}
          {restaurant.dietTags?.includes('halal') && <span style={{ color: 'var(--muted)', fontWeight: 500 }}> · Halal</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {item.price != null && <span style={{ fontFamily: '"Space Grotesk",system-ui,sans-serif', fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>${item.price.toFixed(2)}</span>}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--ink-2)' }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--coral)', display: 'inline-block' }} />
            <span style={{ fontFamily: '"Space Grotesk",system-ui,sans-serif', fontWeight: 600 }}>{item.calories}</span> cal
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--ink-2)' }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--green)', display: 'inline-block' }} />
            <span style={{ fontFamily: '"Space Grotesk",system-ui,sans-serif', fontWeight: 600 }}>{item.protein}g</span> protein
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 9, flexShrink: 0 }}>
        {ppd > 0 && <ValueBadge value={ppd} />}
        <Link href={`/log/food?name=${encodeURIComponent(item.name)}&cal=${item.calories}&p=${item.protein}&c=${item.carbs}&f=${item.fat}&emoji=${encodeURIComponent(item.emoji)}&rid=${restaurant.id}&rname=${encodeURIComponent(restaurant.name)}${item.price != null ? `&price=${item.price}` : ''}`} style={{
          width: 34, height: 34, borderRadius: 10, background: 'var(--green-tint)', color: 'var(--green-deep)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
          fontSize: 20, lineHeight: 1,
        }}>+</Link>
      </div>
    </div>
  );
}


/* ── Skeleton shimmer ── */
function SkeletonBlock({ w = '100%', h = 16, r = 8 }: { w?: string | number; h?: number; r?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'var(--surface-2)',
      animation: 'skshimmer 1.4s ease infinite',
      flexShrink: 0,
    }} />
  );
}

/* ════════════════════════════════════ Main ══════════════════════════════ */
export default function DashboardClient() {
  const { user }  = useAuth();
  const store     = useStrideStore();
  const profile   = store.profile;
  const firstName = user?.displayName?.split(' ')[0] ?? profile.name?.split(' ')[0] ?? 'there';

  const [serverLoaded, setServerLoaded] = useState(false);
  useEffect(() => {
    store.loadTodayFromServer?.()
      .catch(() => {/* offline */})
      .finally(() => setServerLoaded(true));
  }, []); // eslint-disable-line

  const totals    = store.getTodayTotals();
  const targetCal = profile.targetCalories > 0 ? profile.targetCalories : calculateTargetCalories(profile);
  const burned    = store.getTodayCaloriesBurned();
  const remaining = Math.max(0, targetCal + burned - totals.calories);
  const frac      = targetCal > 0 ? Math.min(1, totals.calories / (targetCal + burned)) : 0;
  const streak    = store.streak ?? 0;
  const onTrack   = totals.calories <= (targetCal + burned);
  const waterMl   = store.getTodayWater();
  const targetWaterMl = profile.targetWater ?? 2500;
  const waterFrac = Math.min(1, waterMl / targetWaterMl);

  // Memoised — these iterate all 30+ restaurants on every call
  const bestMeals = useMemo(() => getBestValueMeals(), []);
  const popular   = useMemo(() => getPopularMeals(), []);

  const FILTERS = [
    { label: 'Best Value',   bolt: true,  href: '/eat?open_filter=1&sort=ppd'   },
    { label: 'High Protein', bolt: false, href: '/eat?open_filter=1&sort=protein' },
    { label: 'Halal',        bolt: false, href: '/eat?open_filter=1&diet=halal'  },
    { label: 'Under $5',     bolt: false, href: '/eat?open_filter=1'             },
    { label: 'Recipes',      bolt: false, href: '/eat?view=recipes'              },
  ];

  // Show skeleton until server data arrives (only on first load, no data yet)
  const showSkeleton = !serverLoaded && totals.calories === 0 && totals.protein === 0;

  if (showSkeleton) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 88 }}>
        <style>{`@keyframes skshimmer{0%{opacity:.5}50%{opacity:1}100%{opacity:.5}}`}</style>
        {/* Header skeleton */}
        <div style={{ padding: '52px 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SkeletonBlock w={140} h={14} />
            <SkeletonBlock w={100} h={20} />
          </div>
          <SkeletonBlock w={44} h={44} r={14} />
        </div>
        {/* Calorie ring card skeleton */}
        <div style={{ margin: '0 16px 20px', background: 'var(--surface)', borderRadius: 24, padding: '24px 20px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <SkeletonBlock w={140} h={140} r={70} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                <SkeletonBlock w={48} h={22} />
                <SkeletonBlock w={36} h={11} />
              </div>
            ))}
          </div>
        </div>
        {/* Section header skeleton */}
        <div style={{ padding: '0 20px', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
          <SkeletonBlock w={160} h={18} />
          <SkeletonBlock w={50} h={14} />
        </div>
        {/* Horizontal cards skeleton */}
        <div style={{ display: 'flex', gap: 12, padding: '2px 20px', overflowX: 'hidden' }}>
          {[1,2,3].map(i => <SkeletonBlock key={i} w={190} h={160} r={16} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 88 }}>

      {/* ── Greeting ── */}
      <div style={{ padding: '52px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span className="eyebrow" style={{ fontSize: 11 }}>{todayLabel()}</span>
          <h1 style={{ fontFamily: '"Space Grotesk",system-ui,sans-serif', fontSize: 32, fontWeight: 700, color: 'var(--ink)', margin: 0, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Hello, {firstName}
          </h1>
        </div>
        {streak > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 30, padding: '0 10px', borderRadius: 999, background: 'var(--coral-tint)', color: 'var(--coral)', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
            🔥 {streak}d
          </div>
        )}
      </div>

      {/* ── Today strip (logged in) / Sign-up banner (guest) ── */}
      <div style={{ padding: '0 20px', marginBottom: 22 }}>
        {user ? (
          /* Calorie strip for authenticated users */
          <Link href="/log" style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--surface)', borderRadius: 'var(--r-card)',
            boxShadow: 'var(--shadow-md)', padding: '12px 14px', textDecoration: 'none',
          }}>
            <MiniRing frac={frac} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <span style={{ fontFamily: '"Space Grotesk",system-ui,sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                  {remaining.toLocaleString()}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>kcal left today</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, marginTop: 1 }}>
                {onTrack ? 'On track' : 'Over budget'} · tap to log a meal
              </div>
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 13, fontWeight: 600, color: 'var(--green)', flexShrink: 0 }}>
              Log
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </span>
          </Link>
        ) : (
          /* Sign-up CTA for guests */
          <Link href="/register" style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--green-tint)', borderRadius: 'var(--r-card)',
            border: '1px solid var(--green-tint-2)', padding: '14px 16px', textDecoration: 'none',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, background: 'var(--green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green-deep)', lineHeight: 1.2 }}>
                Start tracking calories today
              </div>
              <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 500, marginTop: 2 }}>
                Create your free Stride account →
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* ── Water tracker ── */}
      {user && (
        <div style={{ padding: '0 20px', marginBottom: 22 }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 'var(--r-card)',
            boxShadow: 'var(--shadow-md)', padding: '14px 16px',
          }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: '#e8f4fd', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2196f3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontFamily: '"Space Grotesk",system-ui,sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                    {waterMl}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>/ {targetWaterMl} ml</span>
                </div>
                <div style={{ fontSize: 12, color: waterFrac >= 1 ? '#2196f3' : 'var(--muted)', fontWeight: 500, marginTop: 1 }}>
                  {waterFrac >= 1 ? '💧 Goal reached!' : `${targetWaterMl - waterMl} ml to go`}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 6, borderRadius: 999, background: '#e8f4fd', overflow: 'hidden', marginBottom: 12 }}>
              <div style={{
                width: `${waterFrac * 100}%`, height: '100%', borderRadius: 999,
                background: 'linear-gradient(90deg, #64b5f6, #2196f3)',
                transition: 'width 0.6s cubic-bezier(.22,.61,.36,1)',
              }} />
            </div>

            {/* Quick-add buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              {[250, 500, 750].map(ml => (
                <button
                  key={ml}
                  onClick={() => store.addWater(ml)}
                  style={{
                    flex: 1, height: 36, borderRadius: 10, border: '1.5px solid #bbdefb',
                    background: '#e8f4fd', color: '#1565c0', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', letterSpacing: '-0.01em',
                  }}
                >
                  +{ml}ml
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Search hero ── */}
      <div style={{ padding: '0 20px', marginBottom: 14 }}>
        <div style={{ marginBottom: 6 }}>
          <h2 style={{ fontFamily: '"Space Grotesk",system-ui,sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: 0, letterSpacing: '-0.02em' }}>
            What are you eating?
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500, margin: '3px 0 0' }}>
            Search by price, calories &amp; protein per dollar
          </p>
        </div>
        <Link href="/eat" style={{ textDecoration: 'none', display: 'block', marginTop: 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            height: 54, padding: '0 16px',
            background: 'var(--surface)', borderRadius: 16,
            boxShadow: 'var(--shadow-md)', cursor: 'pointer',
            color: 'var(--muted)', fontSize: 15, fontWeight: 500,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 4.5 4.5" />
            </svg>
            Search meals, restaurants, recipes…
          </div>
        </Link>
      </div>

      {/* ── Filter chips ── */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 20px', marginBottom: 26, scrollbarWidth: 'none' }}>
        {FILTERS.map(({ label, bolt, href }, i) => (
          <Link key={label} href={href} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            height: 36, padding: '0 14px', borderRadius: 999, flexShrink: 0, textDecoration: 'none',
            background: i === 0 ? 'var(--green)' : 'var(--surface)',
            border: i === 0 ? 'none' : '1.5px solid var(--line)',
            color: i === 0 ? '#fff' : 'var(--ink-2)',
            fontSize: 13, fontWeight: 600,
            boxShadow: i === 0 ? 'var(--shadow-green)' : 'var(--shadow-sm)',
          }}>
            {bolt && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            )}
            {label}
          </Link>
        ))}
      </div>

      {/* ── Best value right now ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 20px', marginBottom: 12 }}>
        <div>
          <h2 style={{ fontFamily: '"Space Grotesk",system-ui,sans-serif', fontSize: 18, fontWeight: 600, color: 'var(--ink)', margin: 0, letterSpacing: '-0.02em' }}>Best value right now</h2>
          <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, margin: '2px 0 0' }}>Most protein per dollar near you</p>
        </div>
        <Link href="/eat?sort=ppd" style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--green)', fontWeight: 600, fontSize: 13.5, textDecoration: 'none', whiteSpace: 'nowrap' }}>
          See all <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </Link>
      </div>

      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '2px 20px 6px', marginBottom: 28, scrollbarWidth: 'none' }}>
        {bestMeals.map((m, i) => (
          <BestValueCard key={`${m.restaurant.id}-${m.item.id}`} item={m.item} restaurant={m.restaurant} ppd={m.ppd} index={i} />
        ))}
      </div>

      {/* ── Popular meals ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 20px', marginBottom: 4 }}>
        <div>
          <h2 style={{ fontFamily: '"Space Grotesk",system-ui,sans-serif', fontSize: 18, fontWeight: 600, color: 'var(--ink)', margin: 0, letterSpacing: '-0.02em' }}>Popular meals</h2>
          <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, margin: '2px 0 0' }}>Price · calories · protein per dollar</p>
        </div>
        <Link href="/eat" style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--green)', fontWeight: 600, fontSize: 13.5, textDecoration: 'none', whiteSpace: 'nowrap' }}>
          Browse <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </Link>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-card)', boxShadow: 'var(--shadow-md)', padding: '4px 16px' }}>
          {popular.map(({ item, restaurant }, i) => (
            <div key={`${restaurant.id}-${item.id}`}>
              {i > 0 && <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: 0 }} />}
              <PopularMealRow item={item} restaurant={restaurant} />
            </div>
          ))}
        </div>
      </div>

      {/* Extra breathing room at bottom for guests */}
      {!user && <div style={{ height: 8 }} />}
    </div>
  );
}
