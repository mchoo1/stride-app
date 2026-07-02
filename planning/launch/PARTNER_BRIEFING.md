# Stride — Partner Briefing & Handoff Prompt

> **Copy and paste the section below into any new chat to give a collaborator full context.**  
> Updated: 2026-05-29

---

## 🔁 PASTE THIS INTO A NEW CHAT

---

We are building **Stride** — a dark-themed, gamified fitness and nutrition tracking app for Singapore users. The core differentiator is GPS-based nearby restaurant discovery with verified Singapore macros and a Protein/$ (protein per dollar) value score.

**Live app:** https://stride-app-rosy.vercel.app  
**Stack:** Next.js 14 · Firebase Auth + Firestore · Zustand · TypeScript · Tailwind CSS · Vercel  
**Working directory:** `C:\Users\user\OneDrive\Fitness App` — this is a shared collaborative OneDrive folder. ALL code work must happen here. Never use the Desktop Stribe folder.

---

### What's Already Built ✅

The app is ~MVP-ready. All core features work on mobile:

- Firebase auth (register, login, sign out) with 4-step onboarding (goal → diet → body → done)
- Dashboard: calorie ring, macro bars, water ring, streak badges, daily challenges
- **Eat tab** (hero feature): GPS nearby restaurants → matched to Singapore food database → shows full menus with Protein/$ scores, diet fit badges, calorie/protein filters
- Food log: manual entry + search (wired to local sgFoodDb, not empty Firestore)
- Activity log with MET-based calorie estimates
- Water tracking, weight log with 30-day trend
- Move tab: nearby gyms + parks above activity log
- Singapore food database (`src/lib/sgFoodDb.ts`): 40+ outlets, 520+ menu items, SG_MACRO_FOODS (HPB hawker dishes), SG_INGREDIENTS, SG_RECIPES
- All API routes with Firestore subcollections
- Rules-based recommendations engine (8 rules, SGT timezone-aware)
- Google Places API cache (10-min TTL, 1km grid)

---

### Recent Fixes Applied (2026-05-29) — NOT YET PUSHED TO GIT

Three code fixes are written to the OneDrive codebase but need to be committed and pushed:

```bash
cd "C:\Users\user\OneDrive\Fitness App"
git add -A
git commit -m "fix: wire log search to sgFoodDb, protein/$ 10g floor, post-onboarding route to /eat, mcd cone price $1"
git push origin main
```

**Fix 1 — Food search was returning "No results"** (`src/app/(dashboard)/log/food/page.tsx`)  
Was calling `api.foods.search()` which queries an empty Firestore collection. Fixed to search `searchAll()` (restaurant menus) + `SG_MACRO_FOODS` (hawker dishes) directly from the local sgFoodDb TypeScript file, with Firestore as a silent fallback.

**Fix 2 — Protein/$ sort was ranking Vanilla Soft Serve #1** (`src/app/(dashboard)/eat/page.tsx`)  
Applied a `MIN_PPD_PROTEIN = 10g` floor — items under 10g protein score 0 in Protein/$ ranking. Fixed in both the individual item sort and the restaurant-level sort.

**Fix 3 — Post-onboarding sent users to empty dashboard** (`src/app/register/page.tsx`)  
Changed redirect from `/dashboard` → `/eat`. New users now land on the Eat tab immediately — first impression of value is the GPS food discovery feature, not an empty ring chart.

**Fix 4 — McDonald's Vanilla Soft Serve Cone price** (`src/lib/sgFoodDb.ts`)  
Was $0.50 (old price). Corrected to $1.00. `lastVerified` updated to 2026-05-29.

---

### Outstanding Work 🔲

#### 🔴 Must Do Before Sharing With Users

| Task | File | Notes |
|------|------|-------|
| **Push code fixes to git** | Terminal | Run the git command above |
| **Wire dashboard to API on mount** | `src/app/(dashboard)/dashboard/page.tsx` | Add `store.loadTodayFromServer()` in useEffect |
| **Wire Me/profile page** | `src/app/(dashboard)/me/page.tsx` | Add `store.syncProfileFromServer()` on mount |
| **"Open Now" filter** | `src/app/(dashboard)/eat/page.tsx` | Not backed by real business hours — hide the toggle or remove it |
| **Scan feature — add "Coming Soon" state** | `src/app/(dashboard)/scan/page.tsx` | Disable the button, add tooltip. Scan accuracy for SG food is too low to ship. |

#### 🟡 High Value, Soon

| Task | Notes |
|------|-------|
| **Price audit** | A spreadsheet `Stride_Price_Audit.xlsx` has been generated with all 522 menu items. Verify prices against GrabFood outlet by outlet, then send back for Claude to apply corrections to sgFoodDb.ts in one pass. |
| **Dashboard empty state** | First-time users see an empty ring chart. Improve with onboarding tips or a prompt to log their first meal. |
| **Daily summary refresh** | After any log action, re-fetch the daily summary so progress bars update immediately. |
| **Skeleton loaders** | Add across all pages to prevent blank screens on slow connections. |
| **Profile edit page** | `src/app/(dashboard)/profile/page.tsx` exists but doesn't call `PUT /api/profile`. Wire it up. |

#### 🔵 Later (Phase 2)

- Push notifications, streak celebrations, weekly recap (retention)
- Barcode scan using Open Food Facts API
- Community feed (`/community` is a stub)
- Workout library (`/workouts` is a stub)
- Service provider portal (`/provider` is a stub)
- Wearable sync (Apple Health, Google Fit)

---

### Deliberately Deferred

**Scan feature:** The AI food scan (camera → Claude Haiku vision → USDA) is too inaccurate for Singapore food identification. It exists in the codebase but should be shown as "Coming Soon" until we can get SG-specific accuracy right.

---

### Key Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Full developer handoff guide — read this first |
| `CHANGELOG.md` | Log of all fixes and decisions made across sessions |
| `PARTNER_BRIEFING.md` | This file — paste into new chats for context |
| `src/lib/sgFoodDb.ts` | Singapore food database (~13,000 lines, 40+ outlets) |
| `src/app/(dashboard)/eat/page.tsx` | Eat tab — GPS food discovery, Protein/$ sort |
| `src/app/(dashboard)/log/food/page.tsx` | Food log search — wired to sgFoodDb |
| `src/lib/store.ts` | Zustand store — all client state + server sync |
| `src/lib/apiClient.ts` | Typed API wrapper — use this, never raw fetch |

---

### Food Database Rules

When adding food data to `sgFoodDb.ts`:
- Source from brand's official Singapore nutrition PDF first → `source: 'official_sg'`, `verified: true`
- HPB Nutrition Information Centre (folio.hpb.gov.sg) → `source: 'hpb'`
- Community estimates → `source: 'community'`, `verified: false`
- Always set `lastVerified: 'YYYY-MM-DD'`
- Minimum protein floor for Protein/$ ranking is 10g (enforced in eat/page.tsx sort logic)
- Prices should be verified against GrabFood or official SG website — not assumed

---

### Price Verification Process

We discovered pricing data in sgFoodDb can go stale. The agreed process:
1. Use `Stride_Price_Audit.xlsx` (generated 2026-05-29) — 522 items from all outlets
2. Check prices outlet by outlet on GrabFood (fastest) or official SG websites
3. Mark corrections in the spreadsheet
4. Share back — Claude applies all corrections to sgFoodDb.ts in one pass
5. Cadence: quarterly for fast-food chains, every 6 months for hawker/grab-go

---

*For full developer detail: read `CLAUDE.md`. For session-by-session changes: read `CHANGELOG.md`.*
