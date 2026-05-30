'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { searchAll, SG_MACRO_FOODS, SG_RESTAURANTS, proteinPerDollar, ppdColor } from '@/lib/sgFoodDb';
import type { SGMenuItem, SGRestaurant } from '@/lib/sgFoodDb';

/* ── Design tokens ─────────────────────────────────────────────── */
const BG     = '#F7F8FB';
const CARD   = '#FFFFFF';
const BORDER = '#E5E9F2';
const FG1    = '#0F1B2D';
const FG2    = '#5B6576';
const FG3    = '#8B95A7';
const GREEN  = '#1E7F5C';
const GREEN_B = '#13A26B';
const SHADOW = '0 1px 2px rgba(15,27,45,0.04), 0 2px 8px rgba(15,27,45,0.06)';

type ResultItem = {
  id: string;
  name: string;
  emoji: string;
  restaurantName: string;
  restaurantEmoji: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  price: number;
  ppd: number;
  ppdCol: string;
  dietTags: string[];
  source: 'menu' | 'macro';
};

const DIET_FILTERS = [
  { key: 'halal',       label: 'Halal',      emoji: '☪️'  },
  { key: 'vegetarian',  label: 'Vegetarian', emoji: '🥦'  },
  { key: 'vegan',       label: 'Vegan',      emoji: '🌱'  },
  { key: 'high_protein',label: 'High Protein',emoji: '💪' },
];

const SORT_OPTS = [
  { key: 'ppd',      label: 'Protein/$' },
  { key: 'protein',  label: 'Most Protein' },
  { key: 'calories', label: 'Lowest Cal' },
  { key: 'price',    label: 'Cheapest' },
];

/* ── Popular defaults (shown when no search query) ────────────── */
function getPopularItems(): ResultItem[] {
  const items: ResultItem[] = [];
  for (const r of SG_RESTAURANTS) {
    for (const item of r.menu) {
      if (item.isPopular && item.price > 0) {
        const ppd = item.protein >= 10 ? proteinPerDollar(item.protein, item.price) : 0;
        items.push({
          id: item.id,
          name: item.name,
          emoji: item.emoji,
          restaurantName: r.name,
          restaurantEmoji: r.emoji,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          price: item.price,
          ppd,
          ppdCol: ppdColor(ppd),
          dietTags: item.compatibleWith ?? [],
          source: 'menu',
        });
      }
    }
  }
  // Sort by ppd descending, pick top 24
  return items.sort((a, b) => b.ppd - a.ppd).slice(0, 24);
}

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [query,       setQuery      ] = useState('');
  const [results,     setResults    ] = useState<ResultItem[]>([]);
  const [dietFilter,  setDietFilter ] = useState<string | null>(null);
  const [sortBy,      setSortBy     ] = useState<'ppd' | 'protein' | 'calories' | 'price'>('ppd');
  const [showSignUp,  setShowSignUp ] = useState(false);

  // Redirect logged-in users straight to /eat
  useEffect(() => {
    if (!loading && user) router.replace('/eat');
  }, [user, loading, router]);

  // Popular items for empty state
  const popularItems = useMemo(() => getPopularItems(), []);

  // Live search
  useEffect(() => {
    if (!query.trim()) {
      setResults(popularItems);
      return;
    }
    const q = query.trim().toLowerCase();

    // 1. Restaurant menu items
    const menuItems: ResultItem[] = searchAll(q).map(({ item, restaurant }) => {
      const ppd = item.protein >= 10 ? proteinPerDollar(item.protein, item.price) : 0;
      return {
        id: item.id,
        name: item.name,
        emoji: item.emoji,
        restaurantName: restaurant.name,
        restaurantEmoji: restaurant.emoji,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        price: item.price,
        ppd,
        ppdCol: ppdColor(ppd),
        dietTags: item.compatibleWith ?? [],
        source: 'menu' as const,
      };
    });

    // 2. Hawker / macro dishes
    const macroItems: ResultItem[] = SG_MACRO_FOODS
      .filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.aliases.some(a => a.includes(q))
      )
      .map(f => {
        const price = f.typicalPriceSgd ?? 5;
        const ppd = f.protein >= 10 ? proteinPerDollar(f.protein, price) : 0;
        return {
          id: f.id,
          name: f.name,
          emoji: f.emoji,
          restaurantName: 'Hawker / HPB Data',
          restaurantEmoji: '🏪',
          calories: f.calories,
          protein: f.protein,
          carbs: f.carbs,
          fat: f.fat,
          price,
          ppd,
          ppdCol: ppdColor(ppd),
          dietTags: f.dietTags ?? [],
          source: 'macro' as const,
        };
      });

    // Merge, dedup
    const seen = new Set<string>();
    const merged: ResultItem[] = [];
    for (const item of [...menuItems, ...macroItems]) {
      if (!seen.has(item.id)) { seen.add(item.id); merged.push(item); }
    }
    setResults(merged.slice(0, 40));
  }, [query, popularItems]);

  // Filter + sort
  const displayed = useMemo(() => {
    let list = [...results];
    if (dietFilter === 'high_protein') {
      list = list.filter(i => i.protein >= 25);
    } else if (dietFilter) {
      list = list.filter(i => i.dietTags.includes(dietFilter));
    }
    switch (sortBy) {
      case 'ppd':      list.sort((a, b) => b.ppd - a.ppd); break;
      case 'protein':  list.sort((a, b) => b.protein - a.protein); break;
      case 'calories': list.sort((a, b) => a.calories - b.calories); break;
      case 'price':    list.sort((a, b) => a.price - b.price); break;
    }
    return list.slice(0, 30);
  }, [results, dietFilter, sortBy]);

  if (loading || user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG }}>
        <div style={{ width: 32, height: 32, border: `2px solid ${GREEN_B}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}>

      {/* ── Sign-up prompt overlay ── */}
      {showSignUp && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,27,45,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setShowSignUp(false)}
        >
          <div
            style={{ background: CARD, borderRadius: 24, padding: '32px 28px', maxWidth: 360, width: '100%', boxShadow: '0 20px 60px rgba(15,27,45,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>🍜</div>
            <h3 style={{ color: FG1, fontWeight: 800, fontSize: 20, textAlign: 'center', margin: '0 0 8px' }}>Log this meal</h3>
            <p style={{ color: FG2, fontSize: 14, textAlign: 'center', lineHeight: 1.6, margin: '0 0 24px' }}>
              Create a free account to track your macros, log meals, and get personalised calorie targets.
            </p>
            <Link
              href="/register"
              style={{ display: 'block', textAlign: 'center', background: GREEN, color: '#fff', fontWeight: 700, fontSize: 15, borderRadius: 14, padding: '14px 0', textDecoration: 'none', marginBottom: 10 }}
            >
              Get Started Free →
            </Link>
            <Link
              href="/login"
              style={{ display: 'block', textAlign: 'center', color: FG2, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      )}

      {/* ── Nav ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(247,248,251,0.92)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: 22, color: GREEN, letterSpacing: '-0.5px' }}>STRIDE</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: FG3, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>Singapore</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link href="/login" style={{ fontSize: 13, fontWeight: 600, color: FG2, textDecoration: 'none', padding: '8px 14px' }}>Sign in</Link>
            <Link href="/register" style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: GREEN, borderRadius: 12, padding: '9px 18px', textDecoration: 'none' }}>
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero + Search ── */}
      <section style={{ padding: '40px 20px 0', maxWidth: 700, margin: '0 auto' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: GREEN, textTransform: 'uppercase', margin: '0 0 10px', textAlign: 'center' }}>
          Singapore Food Database · {SG_RESTAURANTS.length}+ outlets
        </p>
        <h1 style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: 42, color: FG1, textAlign: 'center', lineHeight: 1.05, margin: '0 0 10px', letterSpacing: '-0.5px' }}>
          FIND FOOD THAT FITS<br />
          <span style={{ color: GREEN }}>YOUR MACROS & BUDGET</span>
        </h1>
        <p style={{ color: FG2, fontSize: 15, textAlign: 'center', margin: '0 0 28px', lineHeight: 1.6 }}>
          Search any dish or restaurant. See calories, protein, and Protein/$ instantly. No sign-up needed.
        </p>

        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18, pointerEvents: 'none' }}>🔍</span>
          <input
            type="text"
            placeholder='Try "chicken rice", "KFC", "subway wrap"…'
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '16px 16px 16px 48px',
              fontSize: 15, borderRadius: 16,
              border: `1.5px solid ${BORDER}`,
              background: CARD, color: FG1,
              outline: 'none', boxShadow: SHADOW,
              fontFamily: 'inherit',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = GREEN; }}
            onBlur={e => { e.currentTarget.style.borderColor = BORDER; }}
          />
        </div>

        {/* Filters row */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 10 }}>
          {DIET_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setDietFilter(dietFilter === f.key ? null : f.key)}
              style={{
                flexShrink: 0, padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                border: `1.5px solid ${dietFilter === f.key ? GREEN : BORDER}`,
                background: dietFilter === f.key ? 'rgba(30,127,92,0.1)' : CARD,
                color: dietFilter === f.key ? GREEN : FG2,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {f.emoji} {f.label}
            </button>
          ))}
          <div style={{ width: 1, background: BORDER, flexShrink: 0, margin: '4px 2px' }} />
          {SORT_OPTS.map(s => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key as typeof sortBy)}
              style={{
                flexShrink: 0, padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                border: `1.5px solid ${sortBy === s.key ? '#7C3AED' : BORDER}`,
                background: sortBy === s.key ? 'rgba(124,58,237,0.1)' : CARD,
                color: sortBy === s.key ? '#7C3AED' : FG2,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {s.key === 'ppd' ? '⚡ ' : ''}{s.label}
            </button>
          ))}
        </div>

        {/* Result count */}
        <p style={{ fontSize: 12, color: FG3, margin: '0 0 12px' }}>
          {query.trim() ? `${displayed.length} results for "${query}"` : `${displayed.length} popular meals`}
        </p>
      </section>

      {/* ── Results grid ── */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {displayed.map(item => (
            <div
              key={item.id}
              style={{ background: CARD, borderRadius: 18, border: `1px solid ${BORDER}`, boxShadow: SHADOW, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 36, flexShrink: 0 }}>{item.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: FG1, margin: 0, lineHeight: 1.3 }}>{item.name}</p>
                  <p style={{ fontSize: 12, color: FG3, margin: '2px 0 0' }}>{item.restaurantEmoji} {item.restaurantName}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontWeight: 800, fontSize: 15, color: FG1, margin: 0 }}>${item.price.toFixed(2)}</p>
                  {item.ppd > 0 && (
                    <p style={{ fontSize: 11, fontWeight: 700, color: item.ppdCol, margin: '2px 0 0' }}>{item.ppd} g/$</p>
                  )}
                </div>
              </div>

              {/* Macro pills */}
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { l: 'Cal',     v: item.calories, bg: 'rgba(15,27,45,0.05)',   c: FG2   },
                  { l: 'Protein', v: `${item.protein}g`, bg: 'rgba(46,111,184,0.08)', c: '#2E6FB8' },
                  { l: 'Carbs',   v: `${item.carbs}g`,   bg: 'rgba(201,138,46,0.08)', c: '#C98A2E' },
                  { l: 'Fat',     v: `${item.fat}g`,     bg: 'rgba(30,127,92,0.08)',  c: GREEN     },
                ].map(m => (
                  <div key={m.l} style={{ flex: 1, textAlign: 'center', background: m.bg, borderRadius: 10, padding: '5px 4px' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: m.c, margin: 0 }}>{m.v}</p>
                    <p style={{ fontSize: 10, color: FG3, margin: 0 }}>{m.l}</p>
                  </div>
                ))}
              </div>

              {/* Diet tags */}
              {item.dietTags.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {item.dietTags.slice(0, 3).map(tag => (
                    <span key={tag} style={{ fontSize: 10, fontWeight: 600, color: GREEN, background: 'rgba(30,127,92,0.08)', borderRadius: 6, padding: '2px 7px' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Log CTA */}
              <button
                onClick={() => setShowSignUp(true)}
                style={{ width: '100%', padding: '10px', borderRadius: 12, background: 'rgba(30,127,92,0.08)', border: `1px solid rgba(30,127,92,0.15)`, color: GREEN, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                + Log this meal
              </button>
            </div>
          ))}
        </div>

        {/* GPS nudge */}
        <div
          onClick={() => setShowSignUp(true)}
          style={{ marginTop: 24, background: FG1, borderRadius: 20, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 16 }}
        >
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, margin: '0 0 4px' }}>📍 Find meals near you</p>
            <p style={{ color: FG3, fontSize: 13, margin: 0 }}>Enable GPS to see the best macro meals within walking distance</p>
          </div>
          <span style={{ color: GREEN, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', background: 'rgba(30,127,92,0.15)', padding: '8px 14px', borderRadius: 12 }}>Sign up free →</span>
        </div>
      </section>

      {/* ── Social proof strip ── */}
      <section style={{ borderTop: `1px solid ${BORDER}`, background: CARD, padding: '28px 20px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
          {[
            { v: `${SG_RESTAURANTS.length}+`, l: 'SG Outlets' },
            { v: '520+',  l: 'Menu Items' },
            { v: '100%',  l: 'Free to Search' },
            { v: 'HPB',   l: 'Verified Data' },
          ].map(s => (
            <div key={s.l} style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: 26, color: GREEN, margin: 0 }}>{s.v}</p>
              <p style={{ fontSize: 12, color: FG3, margin: '2px 0 0', fontWeight: 600 }}>{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: FG1, padding: '24px 20px', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: 20, color: GREEN, margin: '0 0 4px' }}>STRIDE</p>
        <p style={{ color: FG3, fontSize: 12, margin: 0 }}>© 2026 Stride · Move. Eat. Connect.</p>
      </footer>
    </div>
  );
}
