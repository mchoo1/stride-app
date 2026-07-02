# Stride — Developer Handoff Guide

> **Last updated:** 2026-05-31  
> **For:** Any Cowork session or developer picking up this project cold.  
> Read this first. Everything else is detail.

---

## 1. What Is Stride?

Stride is a **light-themed, gamified fitness app** targeting Singapore users. It helps people:
- Track daily calories, macros, and water
- Discover food options at nearby Singapore restaurants with verified macros and Protein/$ ratings
- Log workouts and earn streak badges
- Get personalised recommendations based on their goals

**Stack:** Next.js 14 · Firebase Auth + Firestore · Zustand · TypeScript · Tailwind CSS  
**Hosted on:** Vercel (Root Directory set to `app/`)  
**Auth:** Firebase email/password only (no OAuth yet)  
**Primary user goal phases:** Weight Loss, Muscle Gain, Maintenance  
**Live URL:** https://stride-app-rosy.vercel.app

---

## 2. Quick Start

```bash
cd "Fitness App/app"
npm install
npm run dev          # http://localhost:3000
```

All env vars live in `app/.env.local` (never commit this file):

```env
# Firebase client (public — safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase admin (server-only — keep secret)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=          # include the -----BEGIN/END PRIVATE KEY----- lines

# External APIs
ANTHROPIC_API_KEY=             # Vision AI food scan (claude-3-5-haiku)
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=   # Nearby restaurants/gyms (NEXT_PUBLIC — used client-side)
USDA_API_KEY=                  # Nutrition lookup (DEMO_KEY works for dev)
```

---

## 3. Folder Map

```
Fitness App/                    ← repo root
│
├── CLAUDE.md                   ← YOU ARE HERE — read this first
├── .gitignore / .npmrc
│
├── app/                        ← ENTIRE NEXT.JS APP (Vercel root dir)
│   ├── .env.local              ← env vars (never commit)
│   ├── next.config.js
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── firestore.rules         ← deploy with Firebase CLI
│   ├── vercel.json
│   │
│   ├── public/
│   │   ├── manifest.json       ← PWA manifest
│   │   ├── sw.js               ← service worker
│   │   ├── logo.svg / wordmark.svg / logo-android-fg.svg
│   │
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                  ← Landing page (public)
│   │   │   ├── PageClient.tsx            ← Landing page client component
│   │   │   ├── login/                    ← Email/password login
│   │   │   ├── register/                 ← 5-step onboarding wizard
│   │   │   ├── onboarding/               ← Profile setup (post-register)
│   │   │   ├── layout.tsx                ← Root layout: ErrorBoundary + AuthProvider
│   │   │   ├── globals.css
│   │   │   │
│   │   │   ├── (dashboard)/              ← Protected pages (no AuthGuard — auth removed)
│   │   │   │   ├── layout.tsx            ← BottomNav wrapper
│   │   │   │   ├── dashboard/            ← Main home: calorie ring, macros, challenges
│   │   │   │   ├── eat/                  ← Food discovery: meals/restaurants/recipes tabs
│   │   │   │   │   ├── page.tsx          ← ssr:false wrapper ('use client')
│   │   │   │   │   └── EatPageClient.tsx ← Full implementation (client-only)
│   │   │   │   ├── move/                 ← Activity hub: nearby gyms + log list
│   │   │   │   ├── me/                   ← Profile, streak, weight log, sign out
│   │   │   │   ├── profile/              ← Edit profile & macro targets
│   │   │   │   ├── log/food/             ← Manual food entry + search
│   │   │   │   ├── log/activity/         ← Activity log with MET calorie estimate
│   │   │   │   ├── scan/                 ← Camera → Claude Vision → USDA → log
│   │   │   │   ├── recommendations/      ← [STUB] shows recs from API
│   │   │   │   ├── community/            ← [STUB] Phase 2 social feed
│   │   │   │   ├── workouts/             ← [STUB] workout library
│   │   │   │   └── provider/             ← [STUB] restaurant/gym partner portal
│   │   │   │
│   │   │   └── api/
│   │   │       ├── food-logs/route.ts
│   │   │       ├── activity-logs/route.ts
│   │   │       ├── water-logs/route.ts
│   │   │       ├── weight-logs/route.ts
│   │   │       ├── workout-logs/route.ts
│   │   │       ├── profile/route.ts
│   │   │       ├── daily-summary/route.ts
│   │   │       ├── streak/route.ts
│   │   │       ├── recommendations/route.ts
│   │   │       ├── foods/route.ts
│   │   │       ├── scan-food/route.ts
│   │   │       └── nearby-places/route.ts
│   │   │
│   │   ├── components/
│   │   │   ├── AuthGuard.tsx             ← Redirects unauthenticated users (not currently used)
│   │   │   ├── ErrorBoundary.tsx         ← Global React error boundary in root layout
│   │   │   ├── MapView.tsx               ← Leaflet map (loaded ssr:false — requires window)
│   │   │   ├── StrideIcon.tsx / StrideWordmark.tsx
│   │   │   └── layout/BottomNav.tsx      ← 4-tab bottom nav (Home/Eat/Move/Me)
│   │   │
│   │   ├── lib/
│   │   │   ├── store.ts          ← Zustand store (all client state + server sync)
│   │   │   ├── apiClient.ts      ← Typed authenticated wrapper for every API route
│   │   │   ├── sgFoodDb.ts       ← SG food database (30+ restaurants, recipes, helpers)
│   │   │   ├── firebase.ts       ← Client SDK — null-safe: auth/db can be null if unconfigured
│   │   │   ├── firebase-admin.ts ← Admin SDK (API routes only)
│   │   │   ├── api-auth.ts       ← verifyToken() helper for API routes
│   │   │   ├── auth-context.tsx  ← useAuth() hook — guards against null auth
│   │   │   ├── analytics.ts      ← Structured event tracking (console in dev, ready for Mixpanel)
│   │   │   ├── utils.ts          ← BMR/TDEE calc, macro targets, date helpers
│   │   │   └── mockFoods.ts      ← Fallback food search data (no API needed in dev)
│   │   │
│   │   └── types/
│   │       └── index.ts          ← All shared TypeScript types
│
├── planning/                   ← Product docs (non-app)
│   ├── product/                ← Product brief, goals, enhancements
│   ├── strategy/               ← Business plan, marketing, app brief
│   ├── roadmap/                ← Feature map, product spec, Stride_Roadmap.xlsx
│   ├── launch/                 ← Launch kit, partner briefing, work log
│   └── CHANGELOG.md
│
├── design/                     ← Design assets (non-app)
│   ├── system/                 ← Design tokens, component previews, JSX mockups
│   └── icons/                  ← App icons (PNG) + SVG logos
│
├── database/                   ← Food data (non-app)
│   ├── restaurants/            ← 30+ restaurant JSONs (astons, burger_king, etc.)
│   ├── grab-and-go/            ← 6 grab & go JSONs
│   ├── ingredients/
│   ├── seed-foods.ts           ← Run to populate Firestore foods collection
│   ├── _trackers/              ← Research tracker XLSXs (latest version)
│   ├── _archive/               ← Old tracker versions
│   ├── CONTRIBUTING.md
│   ├── RESEARCH_TASK.md
│   └── _index.json / _template.restaurant.json
│
├── docs/                       ← Technical docs (non-app)
│   ├── USER_FLOWS.md           ← All 12 user flows with API calls + error paths
│   ├── schema.sql              ← DB schema reference
│   ├── demos/                  ← HTML demo prototypes
│   └── bugs/                   ← Bug screenshots for reference
│
└── _archive/                   ← Old/duplicate code (safe to ignore)
    └── apps/
        ├── web/                ← OLD Next.js + Prisma + NextAuth version (superseded)
        └── mobile/             ← React Native stub (not in active development)
```

---

## 4. Page Architecture — SSR:false Pattern

**Critical:** Every page uses a two-file split to avoid Turbopack TDZ crashes in production.

```
page.tsx          — 'use client' + next/dynamic wrapper (ssr:false, ~8 lines)
PageClient.tsx    — full component implementation, browser-only
```

**Never put module-level `const` tokens inside function declarations in page files.** Turbopack's production build hoists function declarations before const initialisations, causing `Cannot access 'X' before initialization` crashes.

**Hook ordering rule:** Always declare `useState`/`useCallback` hooks **before** any `useEffect` or `useCallback` that references them in a dependency array. Dependency arrays are evaluated immediately — not lazily.

```ts
// ✅ Correct — showToast declared before it appears in a dep array
const showToast = useCallback((msg) => { ... }, []);
const searchByLocation = useCallback(async (place) => {
  showToast('...');
}, [fetchNearby, showToast]);   // showToast already defined ✓

// ❌ Wrong — showToast in dep array before it's declared → TDZ crash in prod
const searchByLocation = useCallback(..., [fetchNearby, showToast]); // TDZ!
const showToast = useCallback(..., []);
```

---

## 5. Firestore Schema

Every user's data lives under `users/{uid}` as subcollections. **Never use top-level collections for user data.**

```
users/{uid}                          Document — profile + targets + streak
  name, email, avatarUrl?
  gender, age, heightCm, currentWeight, targetWeight
  goalType: 'weight_loss' | 'muscle_gain' | 'maintenance'
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  dietaryFlags: string[]
  targetCalories, targetProtein, targetCarbs, targetFat, targetWater
  streak, longestStreak, lastActiveDate
  onboardingComplete: boolean

  /foodLogs/{id}       name, emoji, mealType, calories, protein, carbs, fat, loggedAt
  /activityLogs/{id}   name, emoji, durationMins, intensity, caloriesBurned, loggedAt
  /waterLogs/{id}      amountMl, loggedAt
  /weightLogs/{id}     weightKg, bodyFatPct?, date (YYYY-MM-DD), loggedAt
  /workoutLogs/{id}    name, exercises[], durationMins, caloriesBurned, loggedAt
  /dailySummaries/{YYYY-MM-DD}
  /recommendations/{YYYY-MM-DD}

foods/{id}             Community food library (global collection)
```

---

## 6. API Routes

All routes use `verifyToken(req)` — client sends `Authorization: Bearer <idToken>`.  
Use `api.*` from `app/src/lib/apiClient.ts` — never call fetch directly from pages.

| Method | Route | Notes |
|--------|-------|-------|
| GET/POST/DELETE | `/api/food-logs` | `?date=YYYY-MM-DD` / `?id=xxx` |
| GET/POST/DELETE | `/api/activity-logs` | same pattern |
| GET/POST | `/api/water-logs` | GET returns `{logs, totalMl}` |
| GET/POST/DELETE | `/api/weight-logs` | POST upserts per day |
| GET/POST/DELETE | `/api/workout-logs` | |
| GET/PUT | `/api/profile` | PUT is merge update |
| GET/POST | `/api/daily-summary` | POST recomputes from all logs |
| GET/POST | `/api/streak` | SGT-aware, idempotent POST |
| GET | `/api/recommendations` | Returns top 5 personalised recs |
| GET/POST | `/api/foods` | Community food search/submit |
| POST | `/api/scan-food` | `{image: base64}` → Claude vision + USDA |
| GET | `/api/nearby-places` | `?lat&lng&mode=restaurant`, 10-min cache |

---

## 7. State Management

**Zustand store** (`app/src/lib/store.ts`) — persisted to `localStorage` as `stride-store`.

```ts
// Pattern: optimistic write + background sync (never blocks UI)
store.addFoodEntry(entry);
bg(() => api.food.log(...));
bg(() => api.streak.markActive());
bg(() => api.summary.recompute());

// On dashboard mount:
store.loadTodayFromServer();

// On login / profile page mount:
store.syncProfileFromServer();
```

---

## 8. Singapore Food Database (`app/src/lib/sgFoodDb.ts`)

~12,700 lines. Powers the Eat page entirely client-side.

| Category | Entries |
|----------|---------|
| Restaurant chains | 30+ (McDonald's, KFC, Burger King, Jollibee, Shake Shack, Nando's, Subway, Astons, Daily Cut, and many more) |
| Grab & Go chains | Grain, SaladStop, Saladbox, Starbucks, Stuffd, Toast Box |
| Grocery ingredients | FairPrice staples |
| Recipes | 6 (Chicken Rice Bowl, Tuna Oat Salad, Egg Fried Rice, Overnight Oats, Tofu Stir Fry, Chickpea Bowl) |

Raw JSON files live in `database/restaurants/` and `database/grab-and-go/` — these are the source of truth for data entry. Import into `sgFoodDb.ts` after verification.

Key helpers: `matchRestaurant`, `searchAll`, `searchRecipes`, `macroMatchScore`, `proteinPerDollar`, `ppdColor`, `filterItemsByDiet`, `resolveIngredients`, `calcCostPerServing`

---

## 9. Auth Flow

```
Register → Firebase createUserWithEmailAndPassword
         → updateProfile(displayName)
         → store.completeOnboarding()
         → Firestore users/{uid}
         → /dashboard

Login    → Firebase signInWithEmailAndPassword
         → store.syncProfileFromServer()
         → store.loadTodayFromServer()
         → /dashboard

Sign Out → Firebase signOut(auth)  → /login
Reset    → store.resetAll() + Firebase signOut → /login
```

`firebase.ts` exports `auth` and `db` as **nullable** (`Auth | null`). Both are `null` when env vars are missing. Always guard: `if (!auth) return;` before calling Firebase Auth methods.

---

## 10. BMR / Macro Calculation (`app/src/lib/utils.ts`)

```
BMR (Mifflin-St Jeor):
  male:   (10 × weight) + (6.25 × height) − (5 × age) + 5
  female: (10 × weight) + (6.25 × height) − (5 × age) − 161

TDEE = BMR × activity multiplier (1.2 → 1.9)

Target calories: weight_loss TDEE−500 / muscle_gain TDEE+300 / maintenance TDEE

Macro split: protein 30% (35% muscle_gain) · fat 15% · carbs remainder
```

---

## 11. Completed Features ✅

- [x] Light-themed UI with bottom nav (Home/Eat/Move/Me)
- [x] Firebase auth (register + login + sign out), null-safe init
- [x] Global ErrorBoundary — shows friendly error instead of blank screen
- [x] All pages split into ssr:false wrapper + PageClient (TDZ-safe)
- [x] 5-step onboarding with BMR/TDEE/macro calculation
- [x] Dashboard: calorie ring, macro bars, water ring, streak, daily challenges
- [x] Food log (manual entry + search)
- [x] Food scan (camera → Claude Haiku vision → USDA → log)
- [x] Activity log with MET-based calorie estimate
- [x] Water tracking with quick-add buttons
- [x] Weight log with 30-day trend
- [x] Eat page: Meals / Restaurants / Recipes tabs
- [x] Map view (Leaflet) with restaurant pins and tier legend
- [x] Sort strip above map (Best Match, Protein/$, Price, Calories, Nearest)
- [x] GPS nearby restaurants → DB match with full inline menus
- [x] Protein/$ metric + colour coding (green/yellow/red)
- [x] Diet fit badges (great/check/warn) + Confidence badges (Stride Approved / Community / Estimated)
- [x] Filter & Sort bottom sheet with swipe-to-dismiss
- [x] SG food database: 30+ restaurant chains, grab & go, ingredients, recipes
- [x] Move page: nearby gyms/parks + activity log
- [x] All API routes with Firestore subcollections
- [x] Background Firestore sync on every write (optimistic UI)
- [x] Streak system with SGT timezone
- [x] Rules-based recommendations engine
- [x] Typed API client + analytics module
- [x] Google Places API cache (10-min TTL, 1km grid)

---

## 12. Outstanding Tasks 🔲

> Full roadmap: `planning/roadmap/stride-product-spec.md`

### 🔴 High Priority

- [ ] **Vercel root directory** — set to `app` in Vercel Project → Settings → General → Root Directory
- [ ] **Deploy Firestore rules** — `cd app && firebase deploy --only firestore:rules`
- [ ] **Run seed script** — `cd app && npx ts-node --project tsconfig.json ../database/seed-foods.ts`
- [ ] **Wire dashboard to API** — add `store.loadTodayFromServer()` in dashboard `useEffect`
- [ ] **Wire profile/me page** — add `store.syncProfileFromServer()` on mount
- [ ] **Profile edit page** — `/profile/page.tsx` exists but doesn't call `PUT /api/profile`
- [ ] **Recommendations page** — connect stub to `GET /api/recommendations`
- [ ] **Food search** — connect `log/food/page.tsx` to `GET /api/foods`
- [ ] **Weight trend chart** — Recharts line chart on `/me` page

### 🟡 Food & AI

- [ ] Confidence threshold UI — if < 0.6, show "Is this correct?" before saving
- [ ] Editable food name after AI scan
- [ ] Barcode scan mode using Open Food Facts API
- [ ] Expand foods to 100+ (USDA verified)
- [ ] User-submitted foods with community review flag

### 🟡 UI Polish

- [ ] Daily summary refresh after any log action
- [ ] Skeleton loaders across all pages
- [ ] Wearable sync (Apple HealthKit / Google Fit)

### Phase 2 (Community)
Community feed, workout library, service provider portal, social graph, GrabFood integration

### Phase 3 (Monetisation)
Stride Pro subscription, PT booking, sponsored listings

---

## 13. Known Issues 🐛

| Issue | Location | Status |
|-------|----------|--------|
| Register fails intermittently | `/register/PageClient.tsx` | Likely race condition in onboarding state |
| Nearby places not showing | `/api/nearby-places` | Check `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` in env |
| Map shows wrong area (MacRitchie) | `/eat/EatPageClient.tsx` | Default lat/lng used when GPS not granted — expected |

---

## 14. Stub Pages (Phase 2)

| Page | File | Needs |
|------|------|-------|
| `/recommendations` | `recommendations/PageClient.tsx` | Wire to `GET /api/recommendations` |
| `/community` | `community/PageClient.tsx` | Full Phase 2 social feed |
| `/workouts` | `workouts/PageClient.tsx` | Workout library + structured logging |
| `/provider` | `provider/PageClient.tsx` | Partner portal — separate auth role |

---

## 15. Key Patterns

**New API route:**
```ts
const col = (uid: string) => adminDb.collection(`users/${uid}/yourCollection`);
const uid = await verifyToken(req);
if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
// Return ISO strings: d.data().loggedAt?.toDate?.()?.toISOString()
```

**New page action:**
```ts
store.addSomething(data);           // instant UI
bg(() => api.something.post(data)); // silent sync
bg(() => api.summary.recompute());  // keep daily totals fresh
```

**Adding food data:**
- Add JSON to `database/restaurants/` or `database/grab-and-go/`
- Source: brand's official SG nutrition PDF → mark `source: 'official_sg', verified: true`
- Community estimates: `source: 'community', verified: false`
- Import into `app/src/lib/sgFoodDb.ts` `SG_RESTAURANTS` array after review

---

## 16. Deployment

**Vercel** — auto-deploys on push to `main`. Root Directory must be set to `app` in project settings.

```bash
git push origin main
```

All env vars must be in Vercel → Settings → Environment Variables. `FIREBASE_PRIVATE_KEY` must use literal `\n`, not real newlines.

**Firestore rules** (run from `app/` folder):
```bash
firebase deploy --only firestore:rules
```

---

*Detailed user flows, API sequences, error paths: see `docs/USER_FLOWS.md`*
