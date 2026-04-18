# Stride — Developer Handoff Guide

> **Last updated:** 2026-04-18  
> **For:** Any Cowork session or developer picking up this project cold.  
> Read this first. Everything else is detail.

---

## 1. What Is Stride?

Stride is a **dark-themed, gamified fitness app** targeting Singapore users. It helps people:
- Track daily calories, macros, and water
- Discover food options at nearby Singapore restaurants with verified macros and Protein/$ ratings
- Log workouts and earn streak badges
- Get personalised recommendations based on their goals

**Stack:** Next.js 14 · Firebase Auth + Firestore · Zustand · TypeScript · Tailwind CSS  
**Hosted on:** Vercel  
**Auth:** Firebase email/password only (no OAuth yet)  
**Primary user goal phases:** Weight Loss, Muscle Gain, Maintenance

---

## 2. Quick Start

```bash
cd "Fitness App"
npm install
npm run dev          # http://localhost:3000
```

All env vars live in `.env.local` (never commit this file):

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
GOOGLE_PLACES_API_KEY=         # Nearby restaurants/gyms
USDA_API_KEY=                  # Nutrition lookup (DEMO_KEY works for dev)
```

---

## 3. Folder Map

```
Fitness App/
│
├── CLAUDE.md               ← YOU ARE HERE — read this first
├── docs/
│   ├── USER_FLOWS.md       ← All 12 user flows with API calls + error paths
│   ├── planning/           ← Original product brief, ideas, feature map
│   └── bugs/               ← Bug screenshots for reference
│
├── src/
│   ├── app/
│   │   ├── page.tsx                  ← Landing page (public)
│   │   ├── login/page.tsx            ← Email/password login
│   │   ├── register/page.tsx         ← 5-step onboarding wizard
│   │   ├── onboarding/page.tsx       ← Profile setup (post-register)
│   │   │
│   │   ├── (dashboard)/              ← All protected pages (wrapped in AuthGuard)
│   │   │   ├── layout.tsx            ← AuthGuard + BottomNav wrapper
│   │   │   ├── dashboard/page.tsx    ← Main home: calorie ring, macros, challenges
│   │   │   ├── eat/page.tsx          ← 3-tab food discovery (Restaurant/Grab&Go/Store)
│   │   │   ├── move/page.tsx         ← Activity hub: nearby gyms + log list
│   │   │   ├── me/page.tsx           ← Profile, streak, weight log, sign out
│   │   │   ├── profile/page.tsx      ← Edit profile & macro targets
│   │   │   ├── log/
│   │   │   │   ├── page.tsx          ← Log hub (links to food/activity)
│   │   │   │   ├── food/page.tsx     ← Manual food entry + search
│   │   │   │   └── activity/page.tsx ← Activity log with MET calorie estimate
│   │   │   ├── scan/page.tsx         ← Camera → Claude Vision → USDA → log
│   │   │   ├── recommendations/page.tsx  ← [STUB] shows recs from API
│   │   │   ├── community/page.tsx    ← [STUB] Phase 2 social feed
│   │   │   ├── workouts/page.tsx     ← [STUB] workout library
│   │   │   └── provider/page.tsx     ← [STUB] restaurant/gym partner portal
│   │   │
│   │   └── api/
│   │       ├── food-logs/route.ts    ← GET/POST/DELETE users/{uid}/foodLogs
│   │       ├── activity-logs/route.ts← GET/POST/DELETE users/{uid}/activityLogs
│   │       ├── water-logs/route.ts   ← GET/POST users/{uid}/waterLogs
│   │       ├── weight-logs/route.ts  ← GET/POST/DELETE users/{uid}/weightLogs
│   │       ├── workout-logs/route.ts ← GET/POST/DELETE users/{uid}/workoutLogs
│   │       ├── profile/route.ts      ← GET/PUT users/{uid} + profiles/{uid}
│   │       ├── daily-summary/route.ts← GET/POST users/{uid}/dailySummaries
│   │       ├── streak/route.ts       ← GET/POST streak management (SGT-aware)
│   │       ├── recommendations/route.ts ← GET rules-based personalised recs
│   │       ├── foods/route.ts        ← GET search community food DB / POST submit
│   │       ├── scan-food/route.ts    ← POST image → Claude vision + USDA
│   │       └── nearby-places/route.ts← GET Google Places (10-min cache, 1km grid)
│   │
│   ├── components/
│   │   ├── AuthGuard.tsx             ← Redirects unauthenticated users to /login
│   │   └── layout/BottomNav.tsx      ← 4-tab bottom nav (Home/Eat/Move/Me)
│   │
│   ├── lib/
│   │   ├── store.ts          ← Zustand store (all client state + server sync)
│   │   ├── apiClient.ts      ← Typed authenticated wrapper for every API route
│   │   ├── sgFoodDb.ts       ← Singapore food database (restaurants, recipes, helpers)
│   │   ├── firebase.ts       ← Client SDK (auth + Firestore)
│   │   ├── firebase-admin.ts ← Admin SDK (API routes only)
│   │   ├── api-auth.ts       ← verifyToken() helper for API routes
│   │   ├── auth-context.tsx  ← useAuth() hook (AuthProvider wraps the app)
│   │   ├── utils.ts          ← BMR/TDEE calc, macro targets, date helpers
│   │   └── mockFoods.ts      ← Fallback food search data (no API needed in dev)
│   │
│   └── types/
│       └── index.ts          ← All shared TypeScript types (UserProfile, FoodLogEntry, etc.)
│
├── firestore.rules           ← Firestore security rules (deploy with Firebase CLI)
└── docs/
    └── USER_FLOWS.md         ← Full flow reference (read alongside CLAUDE.md)
```

---

## 4. Firestore Schema

Every user's data lives under `users/{uid}` as subcollections. **Never use top-level collections for user data** — this was a bug in older routes (now fixed).

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

  /foodLogs/{id}
    name, emoji, mealType, calories, protein, carbs, fat, fibre?
    quantity (g), foodItemId?, restaurantId?
    loggedAt: Timestamp

  /activityLogs/{id}
    name, emoji, durationMins, intensity, caloriesBurned
    source: 'manual'|'ai_estimate'|'apple_health'|'google_fit'
    metValue?, distanceKm?, steps?, heartRateAvg?, heartRateMax?
    notes?, loggedAt: Timestamp

  /waterLogs/{id}
    amountMl, loggedAt: Timestamp

  /weightLogs/{id}
    weightKg, bodyFatPct?, date (YYYY-MM-DD), loggedAt: Timestamp
    NOTE: one entry per calendar day (POST upserts by deleting same-day entry)

  /workoutLogs/{id}
    name, exercises: [{exercise, sets, reps, weightKg?, durationSecs?}]
    durationMins, caloriesBurned, notes?, loggedAt: Timestamp

  /dailySummaries/{YYYY-MM-DD}
    totalCalories, totalProteinG, totalCarbsG, totalFatG, totalFibreG
    totalWaterMl, caloriesBurned, activeMins, netCalories
    targetCalories, targetProteinG, targetCarbsG, targetFatG, targetWaterMl
    updatedAt: Timestamp

  /recommendations/{YYYY-MM-DD}
    recs: Recommendation[], generatedAt: Timestamp

foods/{id}                           Community food library (global)
  name, brand, emoji, barcode?
  caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g
  dietaryFlags, source, isVerified, submittedBy
```

---

## 5. API Routes

All routes under `/api/` use `verifyToken(req)` to authenticate via Firebase ID token.  
Client sends: `Authorization: Bearer <idToken>` header.  
Use `api.*` from `src/lib/apiClient.ts` — never call fetch directly from pages.

| Method | Route | Body / Params | Notes |
|--------|-------|---------------|-------|
| GET | `/api/food-logs` | `?date=YYYY-MM-DD` | Returns array |
| POST | `/api/food-logs` | `{name, calories, protein, carbs, fat, mealType, ...}` | Returns created entry |
| DELETE | `/api/food-logs` | `?id=xxx` | |
| GET | `/api/activity-logs` | `?date=YYYY-MM-DD` | |
| POST | `/api/activity-logs` | `{name, durationMins, caloriesBurned, intensity, source}` | |
| DELETE | `/api/activity-logs` | `?id=xxx` | |
| GET | `/api/water-logs` | `?date=YYYY-MM-DD` | Returns `{logs, totalMl}` |
| POST | `/api/water-logs` | `{amountMl}` | |
| GET | `/api/weight-logs` | `?days=30` | Returns trend array |
| POST | `/api/weight-logs` | `{weightKg, bodyFatPct?}` | Upserts per day |
| DELETE | `/api/weight-logs` | `?id=xxx` | |
| GET | `/api/workout-logs` | `?date=YYYY-MM-DD` | |
| POST | `/api/workout-logs` | `{name, exercises[], durationMins}` | |
| DELETE | `/api/workout-logs` | `?id=xxx` | |
| GET | `/api/profile` | — | Returns full profile |
| PUT | `/api/profile` | `{name?, age?, weightKg?, ...}` | Merge update |
| GET | `/api/daily-summary` | `?date=YYYY-MM-DD` | Returns summary or null |
| POST | `/api/daily-summary` | — | Recomputes from all logs |
| GET | `/api/streak` | — | `{streak, longestStreak, lastActiveDate}` |
| POST | `/api/streak` | `{date?}` | Idempotent — safe to call on every log |
| GET | `/api/recommendations` | — | Returns top 5 personalised recs |
| GET | `/api/foods` | `?q=chicken&limit=20` | Community food search |
| POST | `/api/foods` | `{name, caloriesPer100g, ...}` | Submit community food |
| POST | `/api/scan-food` | `{image: base64}` | Claude vision → USDA |
| GET | `/api/nearby-places` | `?lat&lng&mode=restaurant` | Cached 10 min |

---

## 6. State Management

**Zustand store** (`src/lib/store.ts`) is the single source of truth on the client.  
It is persisted to `localStorage` as `stride-store`.

**Pattern: Optimistic writes + background sync**
```
User action
  → store.addFoodEntry(entry)     // immediate UI update
  → bg(() => api.food.log(...))   // silent Firestore write
  → bg(() => api.streak.markActive())
  → bg(() => api.summary.recompute())
```

**On dashboard mount, always call:**
```ts
store.loadTodayFromServer()   // pulls food/activity/water/streak from Firestore
```

**On login / profile page mount:**
```ts
store.syncProfileFromServer() // overwrites local profile with Firestore version
```

---

## 7. Singapore Food Database (`src/lib/sgFoodDb.ts`)

The core data file powering the Eat page. **75 KB, growing.**

### Current data (Phase 1)
| Category | Entries |
|----------|---------|
| Restaurant chains | McDonald's, KFC, Burger King, Subway |
| Grab & Go chains | Old Chang Kee, Ya Kun, BreadTalk, Gong Cha, 7-Eleven |
| Grocery ingredients | 15 FairPrice staples |
| Recipes | 6 (Chicken Rice Bowl, Tuna Oat Salad, Egg Fried Rice, Overnight Oats, Tofu Stir Fry, Chickpea Bowl) |

### How to add a restaurant
```ts
// In SG_RESTAURANTS array:
{
  id: 'koi',
  name: 'KOI Thé',
  emoji: '🧋',
  cuisine: 'Bubble Tea',
  tab: 'grab_go',
  aliases: ['koi', 'koi the', 'koi cafe'],  // lowercase — used for GPS matching
  dietTags: ['halal', 'vegetarian'],
  priceRange: '$',
  nutritionUrl: 'https://www.koithe.com/sg',
  lastUpdated: '2026-04-18',
  menu: [
    {
      id: 'koi_milk_tea_m',
      name: 'Milk Tea (M)',
      emoji: '🧋',
      price: 3.50,
      calories: 140, protein: 2, carbs: 28, fat: 2,
      category: 'Milk Tea',
      compatibleWith: ['halal', 'vegetarian'],
      isPopular: true,
      source: 'community',   // or 'official_sg' | 'hpb' | 'usda'
      verified: false,
      lastVerified: '2026-04-18',
    },
  ],
}
```

### Key helper functions
```ts
matchRestaurant(placeName)      // fuzzy GPS match → SGRestaurant | null
searchAll(query, tab?)          // unified search across all tabs
macroMatchScore(item, remaining)// 0–1 score (protein 55%, cal 30%, carbs 15%)
proteinPerDollar(protein, price)// g/$ rounded to 1 decimal
ppdColor(value)                 // green ≥6, yellow 3–6, red <3
filterItemsByDiet(items, flags) // filter menu items by user dietary flags
```

---

## 8. Auth Flow

```
Register → Firebase createUserWithEmailAndPassword
         → updateProfile(displayName)
         → store.completeOnboarding()  (calculates BMR/TDEE/macros)
         → Firestore users/{uid} (background write)
         → /dashboard

Login    → Firebase signInWithEmailAndPassword
         → store.syncProfileFromServer()
         → store.loadTodayFromServer()
         → /dashboard

Sign Out → Firebase signOut(auth)
         → /login
         (store data stays in localStorage until Reset App)

Reset    → store.resetAll() clears localStorage
         → Firebase signOut(auth)
         → /login
```

**AuthGuard** wraps all `/(dashboard)` routes. Uses `useAuth()` from `auth-context.tsx`.  
If `user === null && !loading` → redirect to `/login`.

---

## 9. BMR / Macro Calculation (`src/lib/utils.ts`)

```
BMR (Mifflin-St Jeor):
  male:   (10 × weight) + (6.25 × height) − (5 × age) + 5
  female: (10 × weight) + (6.25 × height) − (5 × age) − 161
  other:  (10 × weight) + (6.25 × height) − (5 × age) − 78

TDEE = BMR × activity multiplier
  sedentary    × 1.2
  light        × 1.375
  moderate     × 1.55
  active       × 1.725
  very_active  × 1.9

Target calories:
  weight_loss:  TDEE − 500
  muscle_gain:  TDEE + 300
  maintenance:  TDEE

Macro split (% of target kcal):
  protein: 35% if muscle_gain, else 30%  (4 kcal/g)
  fat:     15%                            (9 kcal/g)
  carbs:   remainder                     (4 kcal/g)
```

---

## 10. Completed Features ✅

- [x] Dark-themed gamified UI with bottom nav
- [x] Firebase auth (register + login + sign out)
- [x] 5-step onboarding with BMR/TDEE/macro calculation
- [x] Dashboard: calorie ring, macro bars, water ring, streak, daily challenges
- [x] Food log (manual entry + search mockFoods DB)
- [x] Food scan (camera → Claude Haiku vision → USDA → log)
- [x] Activity log with MET-based calorie estimate
- [x] Water tracking with quick-add buttons
- [x] Weight log with 30-day trend
- [x] Eat page: 3 tabs (Restaurant / Grab & Go / Store/Recipes)
- [x] GPS nearby restaurants → DB match with full inline menus
- [x] Protein/$ metric + colour coding
- [x] Diet fit badges (great/check/warn) based on user dietary flags
- [x] Sort by Protein/$ or calories across all tabs
- [x] SG food database: 4 restaurant chains, 5 grab&go chains, 15 ingredients, 6 recipes
- [x] Move page: nearby gyms/parks above activity log, scrollable list
- [x] All API routes with Firestore subcollections (standardised)
- [x] Background Firestore sync on every write (optimistic UI, never blocks)
- [x] Streak system with SGT timezone, longestStreak tracking
- [x] Rules-based recommendations engine (8 rules, SGT-aware)
- [x] Typed API client (`src/lib/apiClient.ts`)
- [x] Google Places API cache (10-min TTL, 1km grid buckets)
- [x] Profile page with sign out + reset app

---

## 11. Outstanding Tasks 🔲

> **Full roadmap:** `docs/planning/stride-product-spec.md` (v2.0 simplification plan with phase-by-phase task list)

### 🚨 Critical — Deployment Blockers

- [ ] **Add all env vars to Vercel** — `ANTHROPIC_API_KEY`, all 6 Firebase keys (`NEXT_PUBLIC_*` + admin vars). Without these, live site cannot call Claude or Firebase.
- [ ] **Redeploy on Vercel** — trigger redeploy from Vercel dashboard after vars saved
- [ ] **Push food scan model fix** — `claude-3-5-haiku` model name fix (`git add -A && git commit && git push`)
- [ ] **Deploy Firestore security rules** — copy `firestore.rules` → Firebase Console → Rules tab → Publish

### 🔴 High Priority — Core App Wiring

- [ ] **Wire dashboard to API on mount** — add `store.loadTodayFromServer()` in `dashboard/page.tsx` useEffect
- [ ] **Wire profile/me page** — add `store.syncProfileFromServer()` on mount
- [ ] **Profile edit page** — `/profile/page.tsx` exists but doesn't call `PUT /api/profile`
- [ ] **Recommendations page** — connect to `GET /api/recommendations` (`recommendations/page.tsx` is a stub)
- [ ] **Food search** — connect `log/food/page.tsx` to `GET /api/foods` for community DB search
- [ ] **Weight trend chart** — add Recharts line chart to `/me` page using `api.weight.getTrend()`
- [ ] **Run seed script** — `npx ts-node --project tsconfig.json scripts/seed-foods.ts` to populate foods collection

### 🟡 Testing Checklist (run before any release)

- [ ] **Full registration flow** — Goal → Body → Diet → Account → Done → dashboard
- [ ] **Sign-in with existing account** — confirm redirect to dashboard (not landing page)
- [ ] **Food logging — manual entry** — enter name, weight, macros; confirm saves to Firestore
- [ ] **Food logging — AI photo scan** — upload banana photo; verify correct food identified
- [ ] **Food logging — database search** — search "chicken"; verify results from seeded foods
- [ ] **Workout logging** — log a workout; verify it appears in history
- [ ] **Water tracking** — add water log; verify daily total updates
- [ ] **Sign out → sign back in → data persistence** — confirm all logs persist across sessions
- [ ] **Mobile browser** — open Vercel URL on iOS Safari + Android Chrome; check layout & touch targets
- [ ] **Add-to-home-screen PWA** — Share → Add to Home Screen on iOS and Android

### 🟡 Food AI Improvements

- [ ] **Verify claude-3-5-haiku fix** — confirm banana → sushi misidentification is resolved
- [ ] **Edge case test suite** — 20 images: mixed plates, packaged food, drinks, restaurant meals
- [ ] **Confidence threshold UI** — if confidence < 0.6, show "Is this correct?" prompt before saving
- [ ] **Editable food name** — allow user to edit AI-identified food name before saving
- [ ] **Log AI accuracy** — store confidence score + user corrections in Firestore for monitoring

### 🟡 Food Database Expansion

- [ ] **Expand foods to 100+** — add proteins, carbs, fats, fruits, vegetables, snacks (USDA verified)
- [ ] **Consolidate macro sources** — `source` field: `USDA` / `AI estimate` / `custom` on every food log
- [ ] **Prefix search** — fast Firestore query: `foods where name starts with searchTerm`
- [ ] **User-submitted foods** — `POST /api/foods` with community review flag
- [ ] **Expand SG restaurant database** — A&W, Jollibee, Popeyes, Toast Box, LiHo, Cheers, FairPrice Xpress

### 🔵 Dashboard & UI Polish

- [ ] **Daily summary refresh** — after any log action, re-fetch summary to update progress bars
- [ ] **Skeleton loaders** — add across all pages to prevent blank screens on slow connections
- [ ] **Barcode scan** — add barcode mode to `/scan` page using Open Food Facts API
- [ ] **Wearable sync** — Apple HealthKit (iOS), Google Fit (Android) — see `src/types/index.ts` ActivitySource

### Phase 2 (Community — See `docs/planning/`)

- [ ] **Community feed** — Instagram-style food/workout posts (`/community` is a stub)
- [ ] **Workout library** — structured workout plans with sets/reps (`/workouts` is a stub)
- [ ] **Service provider portal** — restaurant/gym partner dashboard (`/provider` is a stub)
- [ ] **Post: copy recipe** — one-tap import community meal into food log
- [ ] **Social graph** — follow/unfollow, home feed vs explore
- [ ] **GrabFood/Deliveroo integration** — deep-link with macro pre-fill

### Phase 3 (Monetisation)

- [ ] **Stride Pro subscription** — Stripe integration, gated AI features
- [ ] **PT/nutritionist booking** — in-app booking and payments
- [ ] **Sponsored listings** — clearly labelled partner placements in Eat

---

## 12. Known Bugs 🐛

| Bug | Location | Status |
|-----|----------|--------|
| Sign in option not shown on landing page | `/page.tsx` | Screenshots in `docs/bugs/` |
| App "not configured" error on fresh deploy | Firebase env vars | Check `.env.local` has all 6 NEXT_PUBLIC vars |
| Register account fails intermittently | `/register/page.tsx` | Likely race condition in onboarding state |
| Old app top bar appears after nav | `/(dashboard)/layout.tsx` | CSS conflict — check z-index |
| Activity list in Move page doesn't scroll | `/move/page.tsx` | Fixed — maxHeight 320px + overflow-y |
| Nearby places not showing | `/api/nearby-places` | Check GOOGLE_PLACES_API_KEY in env |

---

## 13. Stub Pages (Phase 2)

These pages exist but show placeholder UI only:

| Page | File | What it needs |
|------|------|---------------|
| `/recommendations` | `recommendations/page.tsx` | Wire to `GET /api/recommendations` |
| `/community` | `community/page.tsx` | Full Phase 2 social feed build |
| `/workouts` | `workouts/page.tsx` | Workout library + structured logging |
| `/provider` | `provider/page.tsx` | Partner portal — separate auth role |

---

## 14. Key Patterns to Follow

**Adding a new API route:**
```ts
// 1. Always use subcollections
const col = (uid: string) => adminDb.collection(`users/${uid}/yourCollection`);

// 2. Always verify token first
const uid = await verifyToken(req);
if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// 3. Return ISO strings for timestamps (not Firestore Timestamp objects)
loggedAt: d.data().loggedAt?.toDate?.()?.toISOString()
```

**Adding a new page action:**
```ts
// Optimistic update + background sync (never await the API call)
store.addSomething(data);                    // instant UI
bg(() => api.something.post(data));          // silent sync
bg(() => api.summary.recompute());           // keep daily totals fresh
```

**Adding food data:**
- Source from brand's official Singapore nutrition PDF first
- Mark `source: 'official_sg'` and `verified: true`
- Community estimates: `source: 'community'`, `verified: false`
- Always set `lastVerified: 'YYYY-MM-DD'`

---

## 15. Deployment

**Vercel (auto-deploy on push to `main`):**
```bash
git push origin main
```

Check Vercel dashboard for build errors. All env vars must be set in Vercel project settings (Settings → Environment Variables). The `FIREBASE_PRIVATE_KEY` must have literal `\n` characters, not actual newlines.

**Firestore rules:**
```bash
firebase deploy --only firestore:rules
```
Current `firestore.rules` at repo root — needs proper user-scoped rules before production.

---

*Detailed user flows, API call sequences, and error paths: see `docs/USER_FLOWS.md`*
