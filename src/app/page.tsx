'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import StrideWordmark from '@/components/StrideWordmark';

const FEATURES = [
  { emoji: '📷', title: 'AI Photo Scan',             desc: 'Snap a meal and get instant calorie and macro estimates powered by Claude Vision AI.' },
  { emoji: '🍜', title: 'Singapore Food Database',   desc: 'Browse verified macros for McDonald\'s, KFC, Ya Kun, Old Chang Kee and more — with Protein/$ ratings.' },
  { emoji: '✍️', title: 'Manual Food Logging',       desc: 'Search our food library or enter meals manually with full macro breakdown.' },
  { emoji: '🏃', title: 'Activity & Streak Tracking',desc: 'Log runs, gym sessions, and workouts. Build daily streaks and track calories burned.' },
  { emoji: '📍', title: 'GPS Nearby Places',         desc: 'Find gyms and restaurants near you with macro data matched from our Singapore database.' },
  { emoji: '🎯', title: 'Personalised Targets',      desc: 'Set your goal — lose weight, build muscle, or maintain — and get auto-calculated calorie and macro targets.' },
];

const GOALS = [
  { emoji: '📉', title: 'Lose Weight',  desc: 'Calorie deficit + high-protein suggestions' },
  { emoji: '💪', title: 'Build Muscle', desc: 'Progressive overload logging + macro optimisation' },
  { emoji: '⚖️', title: 'Stay Healthy', desc: 'Balanced nutrition and consistent habits' },
];

/* ─── Design tokens (matches globals.css) ─────────────────────────── */
const BG      = '#F7F8FB';
const CARD    = '#FFFFFF';
const BORDER  = '#E5E9F2';
const NAV_BG  = 'rgba(247,248,251,0.92)';
const FG1     = '#0F1B2D';
const FG2     = '#5B6576';
const FG3     = '#8B95A7';
const GREEN   = '#1E7F5C';
const GREEN_B = '#13A26B';
const SHADOW  = '0 1px 2px rgba(15,27,45,0.04), 0 1px 3px rgba(15,27,45,0.03)';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: GREEN_B, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: BG }}>

      {/* ── Nav ── */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{ background: NAV_BG, borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <StrideWordmark height={34} />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold px-4 py-2 rounded-xl transition"
              style={{ color: FG2 }}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold px-5 py-2 rounded-xl text-white transition"
              style={{ background: GREEN, boxShadow: '0 4px 14px rgba(30,127,92,0.25)' }}
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-6 pb-24 pt-20">
        {/* Soft green glow backdrop */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 45% at 50% 0%, rgba(19,162,107,.07) 0%, transparent 70%)' }}
        />

        <div className="relative mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm"
            style={{ background: 'rgba(30,127,92,.08)', border: `1px solid rgba(30,127,92,.2)`, color: GREEN }}
          >
            <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: GREEN_B }} />
            Phase 1 MVP — Free to use
          </div>

          <h1
            className="mb-6 text-5xl font-black leading-tight tracking-tight sm:text-6xl"
            style={{ color: FG1, fontFamily: "'Anton', Impact, sans-serif", letterSpacing: '-0.5px' }}
          >
            MOVE. EAT.<br />
            <span style={{ color: GREEN }}>CONNECT.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg" style={{ color: FG2 }}>
            Track calories, log workouts, sync wearables, and get smart meal recommendations — all in one clean, focused app.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="px-8 py-4 text-base font-bold w-full sm:w-auto rounded-xl text-white text-center transition"
              style={{ background: GREEN, boxShadow: '0 6px 20px rgba(30,127,92,0.28)' }}
            >
              Start for Free →
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 text-base font-semibold w-full sm:w-auto rounded-xl transition text-center"
              style={{ background: CARD, color: FG1, border: `1px solid ${BORDER}`, boxShadow: SHADOW }}
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* ── Mock UI Preview ── */}
        <div className="relative mx-auto mt-16 max-w-sm">
          <div
            className="rounded-3xl p-1 shadow-xl"
            style={{ background: 'rgba(229,233,242,.5)', border: `1px solid ${BORDER}` }}
          >
            <div className="rounded-[22px] p-5" style={{ background: CARD }}>
              {/* Header */}
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs" style={{ color: FG3 }}>Good morning 👋</p>
                  <p className="text-base font-bold" style={{ color: FG1 }}>Today&apos;s Overview</p>
                </div>
                <div
                  className="h-9 w-9 rounded-xl flex items-center justify-center overflow-hidden"
                  style={{ background: 'rgba(30,127,92,.1)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="26" height="26">
                    <path
                      d="M266 758 C 266 580, 388 460, 552 410 C 716 360, 796 300, 778 200 C 676 300, 532 320, 408 360 C 222 440, 138 600, 220 800 Z"
                      fill={GREEN_B}
                    />
                  </svg>
                </div>
              </div>

              {/* Hero numeral */}
              <div
                className="mb-4 rounded-xl p-4"
                style={{ background: BG, border: `1px solid ${BORDER}` }}
              >
                <div className="flex items-baseline gap-1 mb-1">
                  <span
                    style={{ fontSize: 40, fontFamily: "'Anton', Impact, sans-serif", color: FG1, lineHeight: 1 }}
                  >
                    460
                  </span>
                  <span className="text-sm" style={{ color: FG3 }}>kcal left</span>
                </div>
                {/* Progress bar */}
                <div className="relative h-2 rounded-full overflow-hidden mt-2" style={{ background: '#E5E9F2' }}>
                  <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: '63%', background: GREEN }} />
                </div>
                <div className="flex justify-between text-xs mt-1.5">
                  <span style={{ color: FG3 }}>1,240 eaten</span>
                  <span style={{ color: FG3 }}>320 burned</span>
                </div>
              </div>

              {/* Macro pills */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { l: 'Protein', v: '92g',  bg: 'rgba(46,111,184,.08)',  c: '#2E6FB8' },
                  { l: 'Carbs',   v: '148g', bg: 'rgba(201,138,46,.08)',  c: '#C98A2E' },
                  { l: 'Fat',     v: '38g',  bg: 'rgba(30,127,92,.08)',   c: GREEN     },
                ].map(m => (
                  <div key={m.l} className="rounded-xl p-2.5 text-center" style={{ background: m.bg }}>
                    <p className="text-sm font-bold" style={{ color: m.c }}>{m.v}</p>
                    <p className="text-xs" style={{ color: FG3 }}>{m.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Goals ── */}
      <section className="px-6 py-20" style={{ borderTop: `1px solid ${BORDER}` }}>
        <div className="mx-auto max-w-4xl">
          <h2
            className="mb-3 text-center text-3xl font-black"
            style={{ color: FG1, fontFamily: "'Anton', Impact, sans-serif" }}
          >
            BUILT FOR YOUR GOAL
          </h2>
          <p className="mb-12 text-center text-base" style={{ color: FG2 }}>
            Stride adapts to what you want to achieve
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {GOALS.map(g => (
              <div
                key={g.title}
                className="rounded-2xl p-6 text-center"
                style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: SHADOW }}
              >
                <div className="mb-3 text-4xl">{g.emoji}</div>
                <h3 className="mb-2 text-lg font-bold" style={{ color: FG1 }}>{g.title}</h3>
                <p className="text-sm" style={{ color: FG2 }}>{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 py-20" style={{ background: CARD, borderTop: `1px solid ${BORDER}` }}>
        <div className="mx-auto max-w-4xl">
          <h2
            className="mb-3 text-center text-3xl font-black"
            style={{ color: FG1, fontFamily: "'Anton', Impact, sans-serif" }}
          >
            EVERYTHING YOU NEED
          </h2>
          <p className="mb-12 text-center" style={{ color: FG2 }}>Simple tools that actually get used</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="rounded-2xl p-5"
                style={{ background: BG, border: `1px solid ${BORDER}` }}
              >
                <div className="mb-3 text-3xl">{f.emoji}</div>
                <h3 className="mb-2 font-bold" style={{ color: FG1 }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: FG2 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        className="px-6 py-20 text-center"
        style={{ background: FG1, borderTop: `1px solid ${BORDER}` }}
      >
        <div className="mx-auto max-w-xl">
          <div className="mb-5 flex justify-center">
            <StrideWordmark height={40} dark />
          </div>
          <h2
            className="mb-4 text-3xl font-black text-white"
            style={{ fontFamily: "'Anton', Impact, sans-serif" }}
          >
            READY TO START?
          </h2>
          <p className="mb-8" style={{ color: '#8B95A7' }}>
            Set up your profile in under 2 minutes. No payment required.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="px-8 py-4 text-base font-bold w-full sm:w-auto rounded-xl text-white text-center inline-flex justify-center transition"
              style={{ background: GREEN, boxShadow: '0 6px 20px rgba(30,127,92,0.35)' }}
            >
              Get Started Free →
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 text-base font-semibold w-full sm:w-auto rounded-xl transition text-center inline-flex justify-center"
              style={{ background: 'rgba(255,255,255,.08)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,.15)' }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="px-6 py-8 text-center text-sm"
        style={{ background: FG1, borderTop: '1px solid rgba(255,255,255,.06)', color: FG3 }}
      >
        <div className="flex items-center justify-center mb-2">
          <StrideWordmark height={28} dark />
        </div>
        <p style={{ color: '#5B6576' }}>© 2026 Stride · Move. Eat. Connect.</p>
      </footer>
    </div>
  );
}
