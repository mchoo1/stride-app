# Stride — Changelog

> Tracks all fixes, additions, and decisions made during collaborative sessions.  
> Format: most recent first. All dates in SGT (YYYY-MM-DD).

---

## 2026-05-29

### 🐛 Bug Fixes

**Food search returning "No results" in Log tab** (`src/app/(dashboard)/log/food/page.tsx`)
- **Root cause:** `log/food/page.tsx` was calling `api.foods.search()`, which queries the Firestore `foods` collection. This collection is unseeded and empty — the food data lives in the local `sgFoodDb.ts` TypeScript file, not Firestore.
- **Fix:** Rewired the search useEffect to query three sources in order:
  1. `searchAll(query)` — searches all restaurant menus in sgFoodDb
  2. `SG_MACRO_FOODS` filter — searches HPB-verified hawker dishes
  3. `api.foods.search()` as a silent fallback (community Firestore DB, for future use)
- Results are deduped by ID and capped at 30.

**Protein/$ sort ranking low-protein items first** (`src/app/(dashboard)/eat/page.tsx`)
- **Root cause:** `proteinPerDollar(protein, price)` has no minimum protein threshold. A $0.50 item with 4g protein scores 8 g/$ and outranked KFC Original Recipe (29g protein, 7.6 g/$).
- **Fix:** Applied `MIN_PPD_PROTEIN = 10` check before scoring in both sort locations:
  - Pooled items sort (individual menu items across all restaurants)
  - Restaurant-level sort (sorting whole outlets by best menu item PPD)
- Items with < 10g protein score 0 and sort to the bottom when Protein/$ is selected.

**McDonald's Vanilla Soft Serve Cone price incorrect** (`src/lib/sgFoodDb.ts`)
- Was: `$0.50`
- Fixed to: `$1.00` (current SG price)
- Updated `lastVerified` to `2026-05-29`

### ✨ UX Improvements

**Post-onboarding routing** (`src/app/register/page.tsx`)
- Changed redirect after registration from `/dashboard` → `/eat`
- Rationale: New users land directly on the Eat tab — the core differentiator — rather than an empty dashboard with no data yet. First impression of value is immediate.

### 📁 Project Housekeeping

- **Confirmed working directory:** All code work now done from `C:\Users\user\OneDrive\Fitness App` (shared collaborative OneDrive folder). The `C:\Users\user\Desktop\Claude\Stribe` folder is a legacy scratch folder (contains schema helpers and research prompts only — not app code) and should not be used.
- **Confirmed food database location:** All recent food research (40+ restaurants, SG_MACRO_FOODS hawker dishes, last entries dated 2026-05-22) is in `C:\Users\user\OneDrive\Fitness App\src\lib\sgFoodDb.ts`. Nothing was left behind in the Desktop scratch folder.
- **Scan feature deferred:** The food scan feature is intentionally delayed. SG food identification accuracy is too low to ship. No "coming soon" UI state added yet — flagged as a future task.

### ⏳ Pending (not yet deployed)

- All three code fixes above are written to the OneDrive codebase but not yet pushed to git/Vercel.
- To deploy: run from local terminal:
  ```bash
  cd "C:\Users\user\OneDrive\Fitness App"
  git add -A
  git commit -m "fix: wire log search to sgFoodDb, protein/$ 10g floor, post-onboarding route to /eat, mcd cone price"
  git push origin main
  ```

---

## 2026-05-21 — 2026-05-22 (Food Database Expansion)

### 🍽️ sgFoodDb.ts — Restaurants Added

Based on dates in `sgFoodDb.ts` (`lastVerified` fields):

| Outlet | Tier | Notes |
|--------|------|-------|
| Wendy's | `full_menu` | Added 2026-05-22 |
| Hawker dishes (teh tarik, wonton mee, etc.) | `estimated_menu` | Added 2026-05-21 via HPB / community sources |

Existing outlets (pre-May 2026): McDonald's, KFC, Burger King, Subway, Old Chang Kee, Ya Kun, BreadTalk, Gong Cha, 7-Eleven, A&W, Jollibee, Popeyes, Nandos, Dominos, Wingstop, GYG, Dunkin, Yoshinoya, Saizeriya, McCafe, Astons, LiHo, KOI, Chagee, Mixue, Dosirak, Makisan, Cheers, FairPrice Xpress, SaladStop, SaladBox, Bonchon, llaollao, Kopitiam, Koufu, Foodfare, Grain, Stuffd, Starbucks, Carl's Jr., and more.

---

## Outstanding Issues / Next Session Priorities

| Priority | Item | Notes |
|----------|------|-------|
| 🔴 High | Push to git & deploy | Run git push from local terminal |
| 🔴 High | Wire dashboard to API on mount | Add `store.loadTodayFromServer()` in dashboard useEffect |
| 🔴 High | Wire profile/me page | Add `store.syncProfileFromServer()` on mount |
| 🟡 Medium | "Open Now" filter | Not backed by real business hours — hide or fix |
| 🟡 Medium | Scan feature "Coming Soon" UI | Add disabled state + tooltip to scan button |
| 🟡 Medium | Dashboard empty state | Better first-run experience for new users |
| 🟡 Medium | Daily summary refresh | Re-fetch after any log action to update progress bars |
| 🟡 Medium | Skeleton loaders | Add across all pages for slow connections |
| 🔵 Low | Push notifications / streak celebrations | Retention features — Phase 2 |
| 🔵 Low | Weekly recap | Not yet built |
