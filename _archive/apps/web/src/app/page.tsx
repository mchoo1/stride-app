'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const FEATURES = [
  { emoji: '📷', title: 'AI Photo Scan',           desc: 'Snap a meal, get instant calorie and macro estimates from Vision AI.' },
  { emoji: '🍽️', title: 'Smart Food Logging',      desc: 'Search 3M+ foods or enter manually with full macro breakdown.' },
  { emoji: '⌚', title: 'Wearable Sync',           desc: 'Connect Apple Watch, Fitbit, or Garmin to auto-import activity data.' },
  { emoji: '🌐', title: 'Community Feed',          desc: 'Share meals and workouts, discover macro-verified restaurant finds.' },
  { emoji: '🍜', title: 'Meal Recommendations',    desc: 'Get nearby restaurant dishes, delivery options, and grocery picks matched to your remaining macros.' },
  { emoji: '🏢', title: 'Provider Portal',         desc: 'Gyms and restaurants can publish menus, class schedules, and macro data.' },
];

const GOALS = [
  { emoji: '📉', title: 'Lose Weight',  desc: 'Calorie deficit + high-protein suggestions' },
  { emoji: '💪', title: 'Build Muscle', desc: 'Progressive overload logging + macro optimisation' },
  { emoji: '⚖️', title: 'Stay Healthy', desc: 'Balanced nutrition and consistent habits' },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Existing users skip the landing page entirely → go straight to dashboard
  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080810' }}>
        <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#080810' }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl"
        style={{ background: 'rgba(8,8,16,.9)', borderBottom: '1px solid #1C1C2E' }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="text-xl font-black tracking-tight" style={{ color: '#EEEEF8' }}>Stride</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-sm font-semibold px-4 py-2 rounded-xl transition"
              style={{ color: '#8888A8' }}>
              Sign in
            </Link>
            <Link href="/register" className="btn-primary py-2 px-5 text-sm">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-20">
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%,rgba(0,214,143,.15) 0%,transparent 70%)' }}/>
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm backdrop-blur"
            style={{ background: 'rgba(0,214,143,.1)', border: '1px solid rgba(0,214,143,.25)', color: '#00D68F' }}>
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"/>
            Phase 1 MVP — Free to use
          </div>
          <h1 className="mb-6 text-5xl font-black leading-tight tracking-tight sm:text-6xl" style={{ color: '#EEEEF8' }}>
            Move. Eat.<br/>
            <span style={{ color: '#00D68F' }}>Connect.</span>
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-lg" style={{ color: '#8888A8' }}>
            Track calories, log workouts, sync wearables, and get smart meal recommendations — all in one dark, beautiful app.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/register" className="btn-primary px-8 py-4 text-base w-full sm:w-auto">
              Start for Free →
            </Link>
            <Link href="/login"
              className="px-8 py-4 text-base font-semibold w-full sm:w-auto rounded-xl transition-all"
              style={{ background: '#1E1E30', color: '#EEEEF8', border: '1px solid #252538' }}>
              Sign in
            </Link>
          </div>
        </div>

        {/* Mock UI preview */}
        <div className="relative mx-auto mt-16 max-w-sm">
          <div className="rounded-3xl p-1 shadow-2xl" style={{ background: 'rgba(37,37,56,.5)', border: '1px solid #252538' }}>
            <div className="rounded-[22px] p-5" style={{ background: '#111120' }}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs" style={{ color: '#55556A' }}>Good morning 👋</p>
                  <p className="text-base font-bold" style={{ color: '#EEEEF8' }}>Today's Overview</p>
                </div>
                <div className="h-9 w-9 rounded-full flex items-center justify-center text-lg"
                  style={{ background: 'rgba(0,214,143,.15)' }}>⚡</div>
              </div>
              {/* Calorie ring mock */}
              <div className="mb-4 rounded-xl p-3" style={{ background: '#1E1E30' }}>
                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-16">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="26" fill="none" stroke="#252538" strokeWidth="7"/>
                      <circle cx="32" cy="32" r="26" fill="none" stroke="#00D68F" strokeWidth="7"
                        strokeLinecap="round" strokeDasharray="102 163"
                        style={{ filter: 'drop-shadow(0 0 6px #00D68F80)' }}/>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-sm font-black" style={{ color: '#EEEEF8' }}>460</span>
                      <span className="text-[8px]" style={{ color: '#55556A' }}>left</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span style={{ color: '#55556A' }}>Eaten</span>
                      <span className="font-bold" style={{ color: '#4E9BFF' }}>1,240 kcal</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: '#55556A' }}>Burned</span>
                      <span className="font-bold" style={{ color: '#00D68F' }}>+320 kcal</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Macro pills */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { l: 'Protein', v: '92g', c: '#4E9BFF', bg: 'rgba(78,155,255,.12)' },
                  { l: 'Carbs',   v: '148g', c: '#FFD166', bg: 'rgba(255,209,102,.12)' },
                  { l: 'Fat',     v: '38g',  c: '#00D68F', bg: 'rgba(0,214,143,.12)' },
                ].map(m => (
                  <div key={m.l} className="rounded-xl p-2.5 text-center" style={{ background: m.bg }}>
                    <p className="text-sm font-bold" style={{ color: m.c }}>{m.v}</p>
                    <p className="text-xs" style={{ color: '#55556A' }}>{m.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Goals */}
      <section className="px-6 py-20" style={{ borderTop: '1px solid #1C1C2E' }}>
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-3 text-center text-3xl font-black" style={{ color: '#EEEEF8' }}>Built for your goal</h2>
          <p className="mb-12 text-center text-base" style={{ color: '#55556A' }}>Stride adapts to what you want to achieve</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {GOALS.map(g => (
              <div key={g.title} className="card text-center">
                <div className="mb-3 text-4xl">{g.emoji}</div>
                <h3 className="mb-2 text-lg font-bold" style={{ color: '#EEEEF8' }}>{g.title}</h3>
                <p className="text-sm" style={{ color: '#55556A' }}>{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20" style={{ background: '#080810', borderTop: '1px solid #1C1C2E' }}>
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-3 text-center text-3xl font-black" style={{ color: '#EEEEF8' }}>Everything you need</h2>
          <p className="mb-12 text-center" style={{ color: '#55556A' }}>Simple tools that actually get used</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(f => (
              <div key={f.title} className="card">
                <div className="mb-3 text-3xl">{f.emoji}</div>
                <h3 className="mb-2 font-bold" style={{ color: '#EEEEF8' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#55556A' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center" style={{ background: 'linear-gradient(135deg,#080810,#0d1f16)', borderTop: '1px solid #1C1C2E' }}>
        <div className="mx-auto max-w-xl">
          <div className="mb-4 text-5xl">🚀</div>
          <h2 className="mb-4 text-3xl font-black" style={{ color: '#EEEEF8' }}>Ready to start?</h2>
          <p className="mb-8" style={{ color: '#55556A' }}>Set up your profile in under 2 minutes. No payment required.</p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/register" className="btn-primary px-8 py-4 text-base inline-flex">
              Get Started Free →
            </Link>
            <Link href="/login"
              className="px-8 py-4 text-base font-semibold rounded-xl transition-all inline-flex"
              style={{ background: '#1E1E30', color: '#EEEEF8', border: '1px solid #252538' }}>
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-sm" style={{ borderTop: '1px solid #1C1C2E', color: '#55556A' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-xl">⚡</span>
          <span className="font-bold" style={{ color: '#EEEEF8' }}>Stride</span>
        </div>
        <p>© 2026 Stride · Move. Eat. Connect.</p>
      </footer>
    </div>
  );
}
