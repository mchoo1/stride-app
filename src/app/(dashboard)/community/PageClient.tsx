'use client';
import { useState } from 'react';
import Link from 'next/link';

const TABS = ['For You', 'Meals', 'Workouts', 'Restaurants', 'Saved'];

const POSTS = [
  {
    id: '1', user: 'Alex Chen', handle: '@alexfits', avatar: '💪', badge: '✅',
    type: 'meal', time: '2h ago', image: '🥗',
    title: 'Post-workout Buddha Bowl',
    macros: { cal: 520, p: 38, c: 54, f: 14 },
    price: '$12.50',
    accuracy: '94% accurate',
    accuracyCount: 187,
    likes: 142, comments: 23, saved: false,
    tags: ['#MealPrep', '#HighProtein', '#CleanEating'],
    tip: 'Add an extra egg for +6g protein 🥚',
    verified: true,
  },
  {
    id: '2', user: 'Sarah Kim', handle: '@sarahrunner', avatar: '🏃', badge: null,
    type: 'workout', time: '4h ago', image: '🏋️',
    title: 'Upper Body Push Day',
    macros: null,
    caloriesBurned: 380,
    duration: '52 min',
    likes: 89, comments: 11, saved: false,
    tags: ['#PushDay', '#ChestDay', '#GymLife'],
    tip: null,
    verified: false,
  },
  {
    id: '3', user: 'Marcus T.', handle: '@marcus_nutrition', avatar: '🥑', badge: '⭐',
    type: 'restaurant', time: '6h ago', image: '🍱',
    title: 'Sushi Tei — Salmon Sashimi Set',
    macros: { cal: 410, p: 46, c: 18, f: 16 },
    price: '$22.00',
    accuracy: '91% accurate',
    accuracyCount: 312,
    rating: 4.8, recommend: 96,
    likes: 203, comments: 34, saved: true,
    tags: ['#SushiTei', '#MacroFriendly', '#HighProtein'],
    tip: 'Ask for less rice to cut 60kcal 🍚',
    verified: true,
  },
  {
    id: '4', user: 'Priya S.', handle: '@priyamealprep', avatar: '🌿', badge: null,
    type: 'meal', time: '8h ago', image: '🥘',
    title: 'Batch Cook: Chicken & Veg Rice',
    macros: { cal: 445, p: 42, c: 48, f: 8 },
    price: '$3.20 / serving',
    accuracy: '88% accurate',
    accuracyCount: 54,
    servings: 6,
    likes: 317, comments: 58, saved: false,
    tags: ['#BatchCook', '#MealPrep', '#BudgetMeals'],
    tip: null,
    verified: false,
  },
  {
    id: '5', user: 'Jordan Lee', handle: '@jordanlifts', avatar: '🏅', badge: '✅',
    type: 'workout', time: '12h ago', image: '🚴',
    title: 'Morning Cycling — 30km Route',
    macros: null,
    caloriesBurned: 650,
    duration: '68 min',
    distance: '30 km',
    likes: 78, comments: 9, saved: false,
    tags: ['#Cycling', '#MorningRide', '#Cardio'],
    tip: null,
    verified: true,
  },
];

function MacroBadge({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg px-2 py-1" style={{ background: color + '18' }}>
      <span className="text-xs font-black" style={{ color }}>{val}g</span>
      <span className="text-[9px]" style={{ color: '#8B95A7' }}>{label}</span>
    </div>
  );
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState('For You');
  const [posts, setPosts] = useState(POSTS);
  const [newPost, setNewPost] = useState(false);

  const toggleSave = (id: string) => {
    setPosts(ps => ps.map(p => p.id === id ? { ...p, saved: !p.saved } : p));
  };
  const toggleLike = (id: string) => {
    setPosts(ps => ps.map(p => p.id === id ? { ...p, likes: p.likes + (p.saved ? -1 : 1) } : p));
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden px-5 pb-4 pt-14">
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black" style={{ color: '#0F1B2D', fontFamily: "'Anton', Impact, sans-serif" }}>COMMUNITY</h1>
            <p className="text-sm" style={{ color: '#8B95A7' }}>Meals, workouts & restaurant finds</p>
          </div>
          <button
            onClick={() => setNewPost(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-xl font-black"
            style={{ background: '#1E7F5C', color: '#fff' }}>+</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`pill-tab ${activeTab === t ? 'active' : ''}`}>{t}</button>
        ))}
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <input className="stride-input" placeholder="🔍  Search meals, workouts, restaurants…"/>
      </div>

      {/* New post prompt */}
      {newPost && (
        <div className="mx-4 mb-3 card" style={{ borderColor: '#1E7F5C' }}>
          <p className="text-sm font-bold mb-2" style={{ color: '#1E7F5C' }}>Share something 📤</p>
          <div className="flex gap-2">
            {['🍽️ Meal', '🏋️ Workout', '🍜 Restaurant', '📦 Grocery'].map(t => (
              <button key={t} onClick={() => setNewPost(false)}
                className="flex-1 rounded-xl py-2 text-[11px] font-bold"
                style={{ background: '#F7F8FB', color: '#5B6576', border: '1px solid #E5E9F2' }}>{t}</button>
            ))}
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-3 px-4 pb-4">
        {posts.map(post => (
          <div key={post.id} className="card overflow-hidden">
            {/* Post header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full text-2xl"
                style={{ background: '#F7F8FB', border: '1px solid #E5E9F2' }}>{post.avatar}</div>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold" style={{ color: '#0F1B2D' }}>{post.user}</span>
                  {post.badge && <span className="text-xs">{post.badge}</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px]" style={{ color: '#8B95A7' }}>{post.handle}</span>
                  <span className="text-[9px]" style={{ color: '#8B95A7' }}>·</span>
                  <span className="text-[11px]" style={{ color: '#8B95A7' }}>{post.time}</span>
                </div>
              </div>
              <div className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{
                  background: post.type === 'workout' ? 'rgba(157,123,255,.15)' : post.type === 'restaurant' ? 'rgba(255,140,66,.15)' : 'rgba(0,214,143,.15)',
                  color: post.type === 'workout' ? '#7A4BC2' : post.type === 'restaurant' ? '#C98A2E' : '#1E7F5C',
                }}>
                {post.type === 'workout' ? '🏋️ Workout' : post.type === 'restaurant' ? '🍜 Restaurant' : '🍽️ Meal'}
              </div>
            </div>

            {/* Image / emoji banner */}
            <div className="mb-3 flex h-32 items-center justify-center rounded-xl text-7xl"
              style={{ background: '#F7F8FB', border: '1px solid #E5E9F2' }}>
              {post.image}
            </div>

            {/* Title + price */}
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-bold flex-1" style={{ color: '#0F1B2D' }}>{post.title}</p>
              {post.price && <span className="text-xs font-bold ml-2" style={{ color: '#C98A2E' }}>{post.price}</span>}
            </div>

            {/* Macros */}
            {post.macros && (
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-black" style={{ color: '#D04E36' }}>{post.macros.cal} kcal</span>
                  {post.accuracy && (
                    <span className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                      style={{ background: 'rgba(0,214,143,.12)', color: '#1E7F5C' }}>
                      ✓ {post.accuracy} ({post.accuracyCount})
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <MacroBadge label="Protein" val={post.macros.p} color="#2E6FB8"/>
                  <MacroBadge label="Carbs"   val={post.macros.c} color="#C98A2E"/>
                  <MacroBadge label="Fat"     val={post.macros.f} color="#1E7F5C"/>
                </div>
              </div>
            )}

            {/* Workout stats */}
            {post.type === 'workout' && (
              <div className="flex gap-3 mb-2">
                {post.caloriesBurned && (
                  <div className="rounded-xl px-3 py-1.5 text-center" style={{ background: 'rgba(30,127,92,0.08)' }}>
                    <p className="text-sm font-black" style={{ color: '#1E7F5C' }}>{post.caloriesBurned}</p>
                    <p className="text-[9px]" style={{ color: '#8B95A7' }}>kcal burned</p>
                  </div>
                )}
                {post.duration && (
                  <div className="rounded-xl px-3 py-1.5 text-center" style={{ background: 'rgba(30,127,92,0.08)' }}>
                    <p className="text-sm font-black" style={{ color: '#1E7F5C' }}>{post.duration}</p>
                    <p className="text-[9px]" style={{ color: '#8B95A7' }}>duration</p>
                  </div>
                )}
                {post.distance && (
                  <div className="rounded-xl px-3 py-1.5 text-center" style={{ background: 'rgba(30,127,92,0.08)' }}>
                    <p className="text-sm font-black" style={{ color: '#1E7F5C' }}>{post.distance}</p>
                    <p className="text-[9px]" style={{ color: '#8B95A7' }}>distance</p>
                  </div>
                )}
              </div>
            )}

            {/* Tip */}
            {post.tip && (
              <div className="mb-2 rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(255,209,102,.08)', color: '#C98A2E' }}>
                💡 Pro tip: {post.tip}
              </div>
            )}

            {/* Tags */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {post.tags.map(tag => (
                <span key={tag} className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                  style={{ background: '#F7F8FB', color: '#8B95A7', border: '1px solid #E5E9F2' }}>{tag}</span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid #E5E9F2' }}>
              <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1.5 text-xs font-bold transition"
                style={{ color: '#8B95A7' }}>
                <span>❤️</span> {post.likes}
              </button>
              <button className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#8B95A7' }}>
                <span>💬</span> {post.comments}
              </button>
              <button onClick={() => toggleSave(post.id)} className="flex items-center gap-1.5 text-xs font-bold transition"
                style={{ color: post.saved ? '#C98A2E' : '#8B95A7' }}>
                <span>{post.saved ? '🔖' : '📌'}</span> {post.saved ? 'Saved' : 'Save'}
              </button>
              <div className="flex-1"/>
              {post.macros && (
                <button className="rounded-xl px-3 py-1.5 text-xs font-bold"
                  style={{ background: 'rgba(0,214,143,.15)', color: '#1E7F5C' }}>
                  📋 Log This
                </button>
              )}
              {post.type === 'workout' && (
                <button className="rounded-xl px-3 py-1.5 text-xs font-bold"
                  style={{ background: 'rgba(30,127,92,0.10)', color: '#1E7F5C' }}>
                  📋 Copy Plan
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
