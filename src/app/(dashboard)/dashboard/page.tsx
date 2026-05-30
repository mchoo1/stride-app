'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  SG_RESTAURANTS, proteinPerDollar, ppdColor,
  type SGRestaurant, type SGMenuItem,
} from '@/lib/sgFoodDb';

// ── Design tokens ──────────────────────────────────────────────────────────
const T = {
  canvas:  '#F7F8FB',
  card:    '#FFFFFF',
  border:  '#E5E9F2',
  shadow:  '0 1px 2px rgba(15,27,45,0.04), 0 4px 12px rgba(15,27,45,0.06)',
  green:   '#1E7F5C',
  text1:   '#0F1B2D',
  text2:   '#5B6576',
  text3:   '#8B95A7',
  amber:   '#F2A93B',
  blue:    '#2E6FB8',
} as const;

// ── Helpers ────────────────────────────────────────────────────────────────
function getMealGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 11) return { label: 'Good morning', sub: 'What are you eating today?', emoji: '🌅' };
  if (h >= 11 && h < 15) return { label: 'Good afternoon', sub: 'Time to fuel up for the day', emoji: '☀️' };
  if (h >= 15 && h < 18) return { label: 'Good afternoon', sub: 'How about a healthy snack?', emoji: '🍵' };
  if (h >= 18 && h < 22) return { label: 'Good evening', sub: 'Find your perfect dinner spot', emoji: '🌙' };
  return { label: 'Hey there', sub: 'Discover food near you in Singapore', emoji: '🍽️' };
}

function getAllPopularMeals(): Array<{ item: SGMenuItem; restaurant: SGRestaurant }> {
  const out: Array<{ item: SGMenuItem; restaurant: SGRestaurant }> = [];
  // Collect 2 popular items from each restaurant for variety
  for (const r of SG_RESTAURANTS) {
    const picks = r.menu.filter(m => m.isPopular).slice(0, 2);
    if (picks.length === 0) picks.push(...r.menu.slice(0, 1)); // fallback
    for (const item of picks) out.push({ item, restaurant: r });
  }
  return out;
}

// ── Restaurant slider card ─────────────────────────────────────────────────
function RestaurantCard({ restaurant }: { restaurant: SGRestaurant }) {
  const popularItem = restaurant.menu.find(m => m.isPopular) ?? restaurant.menu[0];
  const dietColors: Record<string, { bg: string; color: string }> = {
    halal:       { bg: 'rgba(30,127,92,0.08)',  color: T.green  },
    vegetarian:  { bg: 'rgba(46,111,184,0.08)', color: T.blue   },
    vegan:       { bg: 'rgba(46,111,184,0.08)', color: T.blue   },
  };

  return (
    <Link
      href={`/eat?r=${restaurant.id}`}
      style={{
        display: 'flex', flexDirection: 'column',
        minWidth: 188, maxWidth: 188,
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 18,
        padding: 16,
        textDecoration: 'none',
        flexShrink: 0,
        boxShadow: T.shadow,
      }}
    >
      {/* Emoji + price range */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ fontSize: 38, lineHeight: 1 }}>{restaurant.emoji}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.text3, marginTop: 4 }}>{restaurant.priceRange}</span>
      </div>
      {/* Name */}
      <div style={{ fontSize: 15, fontWeight: 700, color: T.text1, marginBottom: 2 }}>{restaurant.name}</div>
      {/* Cuisine */}
      <div style={{ fontSize: 12, color: T.text2, marginBottom: 10 }}>{restaurant.cuisine}</div>
      {/* Diet tags */}
      {restaurant.dietTags && restaurant.dietTags.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
          {restaurant.dietTags.slice(0, 2).map(tag => {
            const dc = dietColors[tag] ?? { bg: 'rgba(139,149,167,0.10)', color: T.text3 };
            return (
              <span key={tag} style={{
                fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                background: dc.bg, color: dc.color,
              }}>
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </span>
            );
          })}
        </div>
      )}
      {/* Popular item preview */}
      {popularItem && (
        <div style={{
          marginTop: 'auto',
          fontSize: 11, color: T.text3,
          borderTop: `1px solid ${T.border}`,
          paddingTop: 8,
          lineHeight: 1.5,
        }}>
          ⭐ {popularItem.name}<br />
          <span style={{ color: T.text2, fontWeight: 600 }}>
            {popularItem.calories} cal{popularItem.price ? ` · $${popularItem.price.toFixed(2)}` : ''}
          </span>
        </div>
      )}
    </Link>
  );
}

// ── Meal row card ──────────────────────────────────────────────────────────
function MealRow({ item, restaurant }: { item: SGMenuItem; restaurant: SGRestaurant }) {
  const ppd   = item.price ? proteinPerDollar(item.protein, item.price) : 0;
  const ppdC  = ppdColor(ppd);
  const highProtein = item.protein >= 20;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '13px 0',
      borderBottom: `1px solid ${T.border}`,
    }}>
      {/* Emoji */}
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: '#F0F4F8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, flexShrink: 0,
      }}>
        {item.emoji}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text1, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.name}
        </div>
        <div style={{ fontSize: 12, color: T.text2, marginBottom: 5 }}>{restaurant.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {/* Price */}
          {item.price != null && (
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>
              ${item.price.toFixed(2)}
            </span>
          )}
          {/* Calories */}
          <span style={{ fontSize: 11, color: T.text3 }}>{item.calories} cal</span>
          {/* Protein */}
          {highProtein && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: 'rgba(46,111,184,0.08)', color: T.blue }}>
              {item.protein}g protein
            </span>
          )}
          {/* Protein/$ badge */}
          {item.price && ppd > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: `${ppdC}14`, color: ppdC }}>
              {ppd}g/$
            </span>
          )}
        </div>
      </div>

      {/* View arrow */}
      <Link href="/eat" style={{
        flexShrink: 0,
        width: 32, height: 32,
        borderRadius: 16,
        background: 'rgba(30,127,92,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: T.green,
        textDecoration: 'none',
        fontSize: 16,
      }}>
        →
      </Link>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const greeting  = getMealGreeting();
  const firstName = user?.displayName?.split(' ')[0];

  // Curated data — restaurant chains only (not store/ingredient tab)
  const featuredRestaurants = SG_RESTAURANTS.filter(r => r.tab !== 'store');
  const nearbyMeals = getAllPopularMeals().slice(0, 14);

  // ── Quick search categories (tap → opens eat page with preset)
  const quickCategories = [
    { label: 'Halal',       emoji: '☪️',  href: '/eat?diet=halal'       },
    { label: 'High Protein',emoji: '💪',  href: '/eat?sort=protein'     },
    { label: 'Value picks', emoji: '💰',  href: '/eat?sort=ppd'         },
    { label: 'Vegetarian',  emoji: '🥦',  href: '/eat?diet=vegetarian'  },
    { label: 'Bubble Tea',  emoji: '🧋',  href: '/eat?q=tea'            },
    { label: 'Recipes',     emoji: '🍳',  href: '/eat?view=recipes'     },
  ];

  return (
    <div style={{ minHeight: '100vh', background: T.canvas }}>

      {/* ── Header ── */}
      <div style={{ padding: '52px 20px 20px' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: T.text1, marginBottom: 2 }}>
          {greeting.emoji} {firstName ? `Hey ${firstName}` : greeting.label}
        </div>
        <div style={{ fontSize: 14, color: T.text2 }}>{greeting.sub}</div>

        {/* Quick search bar — taps through to /eat */}
        <Link href="/eat" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginTop: 18, padding: '13px 16px',
          background: T.card, borderRadius: 16, border: `1px solid ${T.border}`,
          boxShadow: T.shadow, textDecoration: 'none',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.text3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/>
          </svg>
          <span style={{ fontSize: 15, color: T.text3 }}>Search meals, restaurants, recipes…</span>
        </Link>
      </div>

      {/* ── Quick categories ── */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
          {quickCategories.map(cat => (
            <Link key={cat.label} href={cat.href} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '7px 13px', borderRadius: 20,
              background: T.card, border: `1px solid ${T.border}`,
              textDecoration: 'none', flexShrink: 0,
              fontSize: 13, fontWeight: 600, color: T.text1,
            }}>
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Card 1: Restaurant recommendation slider ── */}
      <div style={{
        margin: '0 20px 20px',
        background: T.card,
        borderRadius: 24,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadow,
        overflow: 'hidden',
      }}>
        {/* Card header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 18px 14px',
          borderBottom: `1px solid ${T.border}`,
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.text1 }}>Recommended spots</div>
            <div style={{ fontSize: 12, color: T.text2, marginTop: 2 }}>Popular restaurants in Singapore</div>
          </div>
          <Link href="/eat?view=restaurants" style={{
            fontSize: 13, fontWeight: 600, color: T.green, textDecoration: 'none',
            padding: '6px 12px', borderRadius: 20, background: 'rgba(30,127,92,0.08)',
          }}>
            See all
          </Link>
        </div>

        {/* Horizontal scroll */}
        <div style={{
          display: 'flex', gap: 12, overflowX: 'auto',
          padding: '16px 18px 18px',
          scrollbarWidth: 'none',
        }}>
          {featuredRestaurants.map(r => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      </div>

      {/* ── Card 2: Nearby meals ── */}
      <div style={{
        margin: '0 20px 32px',
        background: T.card,
        borderRadius: 24,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadow,
      }}>
        {/* Card header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 18px 4px',
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.text1 }}>Popular meals</div>
            <div style={{ fontSize: 12, color: T.text2, marginTop: 2 }}>Price · calories · protein</div>
          </div>
          <Link href="/eat" style={{
            fontSize: 13, fontWeight: 600, color: T.green, textDecoration: 'none',
            padding: '6px 12px', borderRadius: 20, background: 'rgba(30,127,92,0.08)',
          }}>
            Browse all
          </Link>
        </div>

        {/* Meal rows */}
        <div style={{ padding: '0 18px' }}>
          {nearbyMeals.map(({ item, restaurant }) => (
            <MealRow key={`${restaurant.id}__${item.id}`} item={item} restaurant={restaurant} />
          ))}
        </div>

        {/* CTA */}
        <div style={{ padding: '4px 18px 18px' }}>
          <Link href="/eat" style={{
            display: 'block', textAlign: 'center',
            padding: '14px', borderRadius: 14,
            background: T.green, color: '#fff',
            fontSize: 15, fontWeight: 700, textDecoration: 'none',
            marginTop: 8,
          }}>
            Explore all food options →
          </Link>
        </div>
      </div>

      {/* ── Guest sign-in nudge ── */}
      {!user && (
        <div style={{
          margin: '0 20px 32px',
          background: 'linear-gradient(135deg, rgba(30,127,92,0.06) 0%, rgba(46,111,184,0.06) 100%)',
          border: `1px solid rgba(30,127,92,0.15)`,
          borderRadius: 20,
          padding: '20px 20px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text1, marginBottom: 6 }}>
            Track what you eat
          </div>
          <div style={{ fontSize: 13, color: T.text2, marginBottom: 16, lineHeight: 1.5 }}>
            Sign in to log meals, track macros and calories, and hit your goals.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/login" style={{
              flex: 1, textAlign: 'center', padding: '12px',
              borderRadius: 12, border: `1.5px solid ${T.green}`,
              color: T.green, fontWeight: 700, fontSize: 14, textDecoration: 'none',
            }}>
              Sign in
            </Link>
            <Link href="/register" style={{
              flex: 1, textAlign: 'center', padding: '12px',
              borderRadius: 12, background: T.green,
              color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none',
            }}>
              Get started
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
