'use client';
import { useState } from 'react';

const TABS = ['All', 'Strength', 'Cardio', 'HIIT', 'Yoga', 'Saved'];

const WORKOUTS = [
  {
    id: 'w1',
    title: 'Push Day Power',
    creator: 'Marcus T.', creatorBadge: '⭐',
    type: 'Strength', difficulty: 'Intermediate',
    duration: '55 min', caloriesBurn: 380, exercises: 8,
    emoji: '🏋️',
    muscles: ['Chest', 'Shoulders', 'Triceps'],
    rating: 4.9, saves: 1240,
    exercises_list: [
      { name: 'Barbell Bench Press', sets: 4, reps: '8-10', rest: '90s' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', rest: '60s' },
      { name: 'Cable Fly', sets: 3, reps: '12-15', rest: '60s' },
      { name: 'Overhead Press', sets: 4, reps: '8-10', rest: '90s' },
      { name: 'Lateral Raises', sets: 3, reps: '15', rest: '45s' },
      { name: 'Tricep Pushdown', sets: 3, reps: '12-15', rest: '45s' },
    ],
    tags: ['#PushDay', '#Hypertrophy', '#GymLife'],
  },
  {
    id: 'w2',
    title: '30-Min HIIT Burner',
    creator: 'Sarah Kim', creatorBadge: null,
    type: 'HIIT', difficulty: 'Advanced',
    duration: '30 min', caloriesBurn: 420, exercises: 6,
    emoji: '🔥',
    muscles: ['Full Body'],
    rating: 4.7, saves: 890,
    exercises_list: [
      { name: 'Burpees', sets: 4, reps: '45s on / 15s off', rest: '—' },
      { name: 'Jump Squats', sets: 4, reps: '45s on / 15s off', rest: '—' },
      { name: 'Mountain Climbers', sets: 4, reps: '45s on / 15s off', rest: '—' },
      { name: 'Box Jumps', sets: 4, reps: '45s on / 15s off', rest: '—' },
    ],
    tags: ['#HIIT', '#FullBody', '#FatBurn'],
  },
  {
    id: 'w3',
    title: 'Morning Run — 5K Intervals',
    creator: 'Jordan Lee', creatorBadge: '✅',
    type: 'Cardio', difficulty: 'Beginner',
    duration: '40 min', caloriesBurn: 310, exercises: 4,
    emoji: '🏃',
    muscles: ['Legs', 'Cardio'],
    rating: 4.6, saves: 654,
    exercises_list: [
      { name: 'Warm-up walk', sets: 1, reps: '5 min', rest: '—' },
      { name: 'Easy jog', sets: 1, reps: '10 min', rest: '—' },
      { name: 'Intervals (fast/slow)', sets: 6, reps: '1 min fast / 1 min easy', rest: '—' },
      { name: 'Cool-down walk', sets: 1, reps: '5 min', rest: '—' },
    ],
    tags: ['#Running', '#5K', '#MorningRun'],
  },
  {
    id: 'w4',
    title: 'Leg Day: Quad Focus',
    creator: 'Alex Chen', creatorBadge: null,
    type: 'Strength', difficulty: 'Intermediate',
    duration: '60 min', caloriesBurn: 450, exercises: 7,
    emoji: '🦵',
    muscles: ['Quads', 'Hamstrings', 'Glutes'],
    rating: 4.8, saves: 1050,
    exercises_list: [
      { name: 'Back Squat', sets: 5, reps: '5', rest: '3 min' },
      { name: 'Romanian Deadlift', sets: 4, reps: '8', rest: '2 min' },
      { name: 'Leg Press', sets: 3, reps: '12-15', rest: '90s' },
      { name: 'Walking Lunges', sets: 3, reps: '12 each', rest: '60s' },
      { name: 'Leg Curl', sets: 3, reps: '12-15', rest: '60s' },
    ],
    tags: ['#LegDay', '#Strength', '#LiftHeavy'],
  },
];

const DIFF_COLORS: Record<string, string> = {
  Beginner:     '#00D68F',
  Intermediate: '#FFD166',
  Advanced:     '#FF5A5A',
};

const TYPE_COLORS: Record<string, string> = {
  Strength: '#4E9BFF',
  HIIT:     '#FF5A5A',
  Cardio:   '#00D68F',
  Yoga:     '#9D7BFF',
};

export default function WorkoutsPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const toggleSave = (id: string) => {
    setSavedIds(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const filtered = WORKOUTS.filter(w =>
    activeTab === 'All' ? true :
    activeTab === 'Saved' ? savedIds.has(w.id) :
    w.type === activeTab
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden px-5 pb-4 pt-14">
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%,rgba(78,155,255,.18) 0%,transparent 70%)' }}/>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black" style={{ color: '#EEEEF8' }}>Workout Library 🏋️</h1>
            <p className="text-sm" style={{ color: '#8888A8' }}>Shareable plans with calorie burn estimates</p>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-full text-xl font-black"
            style={{ background: '#4E9BFF', color: '#fff' }}>+</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`pill-tab ${activeTab === t ? 'active' : ''}`}>{t}</button>
        ))}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 px-4 mb-3">
        {[
          { label: 'Plans', val: '50+', col: '#4E9BFF', bg: 'rgba(78,155,255,.12)' },
          { label: 'Saved', val: savedIds.size.toString(), col: '#FFD166', bg: 'rgba(255,209,102,.12)' },
          { label: 'Completed', val: '0', col: '#00D68F', bg: 'rgba(0,214,143,.12)' },
        ].map(s => (
          <div key={s.label} className="card-raised text-center py-2">
            <p className="text-lg font-black" style={{ color: s.col }}>{s.val}</p>
            <p className="text-[10px]" style={{ color: '#55556A' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Workout cards */}
      <div className="space-y-3 px-4 pb-4">
        {filtered.map(w => (
          <div key={w.id} className="card overflow-hidden">
            {/* Card header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl"
                style={{ background: TYPE_COLORS[w.type] + '22' }}>{w.emoji}</div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-black" style={{ color: '#EEEEF8' }}>{w.title}</p>
                  <button onClick={() => toggleSave(w.id)} className="text-lg ml-2">
                    {savedIds.has(w.id) ? '🔖' : '📌'}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: TYPE_COLORS[w.type] + '22', color: TYPE_COLORS[w.type] }}>{w.type}</span>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: DIFF_COLORS[w.difficulty] + '22', color: DIFF_COLORS[w.difficulty] }}>{w.difficulty}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[11px]" style={{ color: '#55556A' }}>by {w.creator}</span>
                  {w.creatorBadge && <span className="text-xs">{w.creatorBadge}</span>}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex gap-3 mb-3">
              {[
                { e: '⏱️', v: w.duration },
                { e: '🔥', v: `${w.caloriesBurn} kcal` },
                { e: '💪', v: `${w.exercises} exercises` },
              ].map(s => (
                <div key={s.v} className="flex items-center gap-1">
                  <span className="text-xs">{s.e}</span>
                  <span className="text-xs font-semibold" style={{ color: '#8888A8' }}>{s.v}</span>
                </div>
              ))}
            </div>

            {/* Muscle groups */}
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {w.muscles.map(m => (
                <span key={m} className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: '#1E1E30', color: '#8888A8' }}>🎯 {m}</span>
              ))}
            </div>

            {/* Rating */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                <span className="text-xs">⭐</span>
                <span className="text-xs font-bold" style={{ color: '#FFD166' }}>{w.rating}</span>
                <span className="text-[10px]" style={{ color: '#55556A' }}>· {w.saves.toLocaleString()} saves</span>
              </div>
              <button onClick={() => setExpanded(expanded === w.id ? null : w.id)}
                className="text-xs font-bold" style={{ color: '#4E9BFF' }}>
                {expanded === w.id ? '▲ Hide exercises' : '▾ View exercises'}
              </button>
            </div>

            {/* Exercises list */}
            {expanded === w.id && (
              <div className="mb-3 rounded-xl overflow-hidden" style={{ border: '1px solid #252538' }}>
                {w.exercises_list.map((ex, i) => (
                  <div key={ex.name}
                    className="flex items-center justify-between px-3 py-2"
                    style={{ background: i % 2 === 0 ? '#1E1E30' : '#111120' }}>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: '#EEEEF8' }}>{ex.name}</p>
                      <p className="text-[10px]" style={{ color: '#55556A' }}>{ex.sets} sets × {ex.reps}</p>
                    </div>
                    {ex.rest !== '—' && (
                      <span className="text-[10px] font-semibold" style={{ color: '#55556A' }}>Rest: {ex.rest}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {w.tags.map(t => (
                <span key={t} className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                  style={{ background: '#1E1E30', color: '#55556A' }}>{t}</span>
              ))}
            </div>

            {/* CTA */}
            <div className="flex gap-2">
              <button className="btn-primary flex-1 py-2.5 text-xs">▶ Start Workout</button>
              <button className="btn-secondary flex-1 py-2.5 text-xs">📤 Share</button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-16" style={{ color: '#55556A' }}>
            <span className="text-5xl mb-3">🏋️</span>
            <p className="text-sm font-semibold">No saved workouts yet</p>
            <p className="text-xs mt-1">Tap 📌 on any plan to save it here</p>
          </div>
        )}
      </div>
    </div>
  );
}
