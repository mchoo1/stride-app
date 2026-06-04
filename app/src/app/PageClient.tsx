'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import BottomNav from '@/components/layout/BottomNav';
import {
  SG_RESTAURANTS, proteinPerDollar, ppdColor,
  type SGRestaurant, type SGMenuItem,
} from '@/lib/sgFoodDb';

/* ── Design tokens ─────────────────────────────────────────────── */
const T = {
  canvas:  '#F7F8FB',
  card:    '#FFFFFF',
  border:  '#E5E9F2',
  shadow:  '0 1px 2px rgba(15,27,45,0.04), 0 4px 12px rgba(15,27,45,0.06)',
  green:   '#1E7F5C',
  text1:   '#0F1B2D',
  text2:   '#5B6576',
  text3:   '#8B95A7',
  amber:   '#C98A2E',
  blue:    '#2E6FB8',
  divider: '#EEF0F5',
} as const;

/* ── Helpers ────────────────────────────────────────────────────── */
const AVATAR_HUES = [215, 160, 280, 30, 190, 340, 120, 260, 80, 320];

function Initial({ name, size = 44, radius = 12 }: { name: string; size?: number; radius?: number }) {
  const hue = AVATAR_HUES[name.charCodeAt(0) % AVATAR_HUES.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: `hsl(${hue},28%,92%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.4), fontWeight: 700,
      color: `hsl(${hue},35%,42%)`,
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function getMealGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 11) return { label: 'Good morning',   sub: 'What are you eating today?'          };
  if (h >= 11 && h < 15) return { label: 'Good afternoon', sub: 'Time to fuel up for the day'         };
  if (h >= 15 && h < 18) return { label: 'Good afternoon', sub: 'How about something light?'          };
  if (h >= 18 && h < 22) return { label: 'Good evening',   sub: 'Find your perfect dinner spot'       };
  return                         { label: 'Hello',          sub: 'Discover food near you in Singapore' };
}

function getAllPopularMeals(): Array<{ item: SGMenuItem; restaurant: SGRestaurant }> {
  const out: Array<{ item: SGMenuItem; restaurant: SGRestaurant }> = [];
  for (const r of SG_RESTAURANTS) {
    const picks = r.menu.filter(m => m.isPopular).slice(0, 2);
    if (picks.length === 0) picks.push(...r.menu.slice(0, 1));
    for (const item of picks) out.push({ item, restaurant: r });
  }
  return out;
}

/* ── Sub-components ─────────────────────────────────────────────── */
function RestaurantCard({ restaurant }: { restaurant: SGRestaurant }) {
  const popularItem = restaurant.menu.find(m => m.isPopular) ?? restaurant.menu[0];
  return (
    <Link href={`/eat?r=${restaurant.id}`} style={{
      display: 'flex', flexDirection: 'column',
      minWidth: 180, maxWidth: 180,
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 16, padding: 16,
      textDecoration: 'none', flexShrink: 0,
      boxShadow: T.shadow,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <Initial name={restaurant.name} size={40} radius={10} />
        {restaurant.priceRange && (
          <span style={{ fontSize: 11, fontWeight: 600, color: T.text3, marginTop: 2 }}>{restaurant.priceRange}</span>
        )}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: T.text1, marginBottom: 2 }}>{restaurant.name}</div>
      <div style={{ fontSize: 12, color: T.text2, marginBottom: 10 }}>{restaurant.cuisine}</div>
      {restaurant.dietTags && restaurant.dietTags.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
          {restaurant.dietTags.slice(0, 2).map(tag => (
            <span key={tag} style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: 'rgba(30,127,92,0.07)', color: T.green }}>
              {tag.charAt(0).toUpperCase() + tag.slice(1).replace('_', '-')}
            </span>
          ))}
        </div>
      )}
      {popularItem && (
        <div style={{ marginTop: 'auto', fontSize: 11, color: T.text3, borderTop: `1px solid ${T.divider}`, paddingTop: 8, lineHeight: 1.5 }}>
          {popularItem.name}
          <span style={{ display: 'block', color: T.text2, fontWeight: 600 }}>
            {popularItem.calories} cal{popularItem.price ? ` · $${popularItem.price.toFixed(2)}` : ''}
          </span>
        </div>
      )}
    </Link>
  );
}

function MealRow({ item, restaurant }: { item: SGMenuItem; restaurant: SGRestaurant }) {
  const ppd  = item.price ? proteinPerDollar(item.protein, item.price) : 0;
  const ppdC = ppdColor(ppd);
  return (
    <Link href="/eat" style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0',
      borderBottom: `1px solid ${T.divider}`, textDecoration: 'none',
    }}>
      <Initial name={item.name} size={42} radius={10} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text1, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
        <div style={{ fontSize: 12, color: T.text2, marginBottom: 4 }}>{restaurant.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {item.price != null && <span style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>${item.price.toFixed(2)}</span>}
          <span style={{ fontSize: 11, color: T.text3 }}>{item.calories} cal · {item.protein}g protein</span>
          {item.price && ppd > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: `${ppdC}14`, color: ppdC }}>{ppd}g/$</span>
          )}
        </div>
      </div>
      <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: T.divider, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, fontSize: 12, fontWeight: 700 }}>→</span>
    </Link>
  );
}

/* ── Main page ──────────────────────────────────────────────────── */
export default function HomePage() {
  const { user }  = useAuth();
  const router    = useRouter();
  const greeting  = getMealGreeting();
  const firstName = user?.displayName?.split(' ')[0];

  // Redirect logged-in users straight to the redesigned dashboard
  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  // Show nothing while redirecting
  if (user) return null;

  const featuredRestaurants = SG_RESTAURANTS.filter(r => r.tab !== 'store');
  const nearbyMeals         = getAllPopularMeals().slice(0, 14);

  const quickCategories = [
    { label: 'Halal',        href: '/eat?diet=halal'      },
    { label: 'High Protein', href: '/eat?sort=protein'    },
    { label: 'Best Value',   href: '/eat?sort=ppd'        },
    { label: 'Vegetarian',   href: '/eat?diet=vegetarian' },
    { label: 'Bubble Tea',   href: '/eat?q=tea'           },
    { label: 'Recipes',      href: '/eat?view=recipes'    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: T.canvas, paddingBottom: 100, maxWidth: 500, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ padding: '52px 20px 20px' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: T.text1, letterSpacing: '-0.02em', marginBottom: 2 }}>
          {firstName ? `Hello, ${firstName}` : greeting.label}
        </div>
        <div style={{ fontSize: 14, color: T.text2 }}>{greeting.sub}</div>

        {/* Search bar — taps through to /eat */}
        <Link href="/eat" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginTop: 18, padding: '13px 16px',
          background: T.card, borderRadius: 14, border: `1px solid ${T.border}`,
          boxShadow: T.shadow, textDecoration: 'none',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.text3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/>
          </svg>
          <span style={{ fontSize: 14, color: T.text3 }}>Search meals, restaurants, recipes…</span>
        </Link>
      </div>

      {/* Quick category pills */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
          {quickCategories.map(cat => (
            <Link key={cat.label} href={cat.href} style={{
              display: 'inline-block', padding: '7px 14px', borderRadius: 20,
              background: T.card, border: `1px solid ${T.border}`,
              textDecoration: 'none', flexShrink: 0,
              fontSize: 13, fontWeight: 600, color: T.text1,
            }}>
              {cat.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Restaurant slider */}
      <div style={{ margin: '0 20px 20px', background: T.card, borderRadius: 20, border: `1px solid ${T.border}`, boxShadow: T.shadow, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 18px 14px', borderBottom: `1px solid ${T.divider}` }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text1 }}>Recommended spots</div>
            <div style={{ fontSize: 12, color: T.text2, marginTop: 2 }}>Popular in Singapore</div>
          </div>
          <Link href="/eat?view=restaurants" style={{ fontSize: 12, fontWeight: 600, color: T.green, textDecoration: 'none', padding: '5px 12px', borderRadius: 20, background: 'rgba(30,127,92,0.07)' }}>
            See all
          </Link>
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '16px 18px 18px', scrollbarWidth: 'none' }}>
          {featuredRestaurants.map(r => <RestaurantCard key={r.id} restaurant={r} />)}
        </div>
      </div>

      {/* Popular meals */}
      <div style={{ margin: '0 20px 20px', background: T.card, borderRadius: 20, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 18px 0' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text1 }}>Popular meals</div>
            <div style={{ fontSize: 12, color: T.text2, marginTop: 2 }}>Price · calories · protein per dollar</div>
          </div>
          <Link href="/eat" style={{ fontSize: 12, fontWeight: 600, color: T.green, textDecoration: 'none', padding: '5px 12px', borderRadius: 20, background: 'rgba(30,127,92,0.07)' }}>
            Browse all
          </Link>
        </div>
        <div style={{ padding: '0 18px' }}>
          {nearbyMeals.map(({ item, restaurant }) => (
            <MealRow key={`${restaurant.id}__${item.id}`} item={item} restaurant={restaurant} />
          ))}
        </div>
        <div style={{ padding: '8px 18px 18px' }}>
          <Link href="/eat" style={{
            display: 'block', textAlign: 'center', padding: '13px',
            borderRadius: 12, background: T.text1, color: '#fff',
            fontSize: 14, fontWeight: 700, textDecoration: 'none',
          }}>
            Explore all food options
          </Link>
        </div>
      </div>

      {/* Guest sign-in CTA */}
      {!user && (
        <div style={{ margin: '0 20px 40px', borderRadius: 20, padding: '24px 20px', background: T.card, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text1, marginBottom: 6 }}>Track what you eat</div>
          <div style={{ fontSize: 13, color: T.text2, marginBottom: 20, lineHeight: 1.6 }}>
            Sign in to log meals, track macros and calories, and monitor progress towards your goals.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/login" style={{ flex: 1, textAlign: 'center', padding: '12px', borderRadius: 12, border: `1.5px solid ${T.border}`, color: T.text1, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              Sign in
            </Link>
            <Link href="/register" style={{ flex: 1, textAlign: 'center', padding: '12px', borderRadius: 12, background: T.green, color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              Get started
            </Link>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
