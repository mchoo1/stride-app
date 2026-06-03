# Stride — Changelog

> Most recent changes first. For full decision history see `Stride_Work_Log.xlsx`.  
> Last updated: 2026-06-02

---

## 2026-06-02 — Firestore Layer + Feedback UI

### 🏗️ Firestore Food Database Layer

**`app/src/lib/firestoreFoodDb.ts`** — New TypeScript types for all four Firestore collections (`FirestoreRestaurant`, `FirestoreMeal`, `FirestoreMealFeedback`, `FirestoreMealCommunityStats`). Includes helper functions `deriveConfidenceTier()`, `mapDietFlags()`, `buildSearchTokens()`.

**`app/scripts/seed-sg-food-db.ts`** — Seed script that reads all `SG_RESTAURANTS` and `SG_MACRO_FOODS` from `sgFoodDb.ts` and batch-writes to Firestore `/restaurants` and `/meals` collections. Handles 500-write batch limit automatically. Supports `--dry-run` and `--clear` flags.

Run command:
```bash
cd app
npm install
npx ts-node -r tsconfig-paths/register --project tsconfig.json scripts/seed-sg-food-db.ts --dry-run
npx ts-node -r tsconfig-paths/register --project tsconfig.json scripts/seed-sg-food-db.ts
```

**`app/firestore.rules`** — Added rules for four new collections:
- `/restaurants` — public read, seed-script-only write
- `/meals` — public read, seed-script-only write
- `/meal_feedback` — authenticated create, server-only update
- `/meal_community_stats` — public read, Cloud Function only write

**`app/src/app/api/meal-feedback/route.ts`** — New POST + GET API route for user feedback submissions. Validates input, verifies meal exists, writes to `/meal_feedback` with `status: 'pending'`. Feedback types: `macro_correction`, `price_correction`, `accuracy_rating`, `duplicate_flag`, `new_submission`.

**`app/package.json`** — Added `ts-node` and `tsconfig-paths` to devDependencies (required to run seed script).

### ⭐ Meal Feedback UI

**`app/src/components/MealFeedbackSheet.tsx`** — New reusable bottom sheet component for rating meal accuracy. Two-step flow: star rating (1–5) → issue details (price wrong, macros wrong, comment). Auth-gated: unauthenticated users see sign-in prompt. Calls `POST /api/meal-feedback`.

**`app/src/app/(dashboard)/eat/EatPageClient.tsx`** — "Was this accurate? Rate it" button added to expanded `MenuItemCard` view. Triggers `MealFeedbackSheet`.

**`app/src/app/(dashboard)/log/food/PageClient.tsx`** — ⭐ flag button added to each search result row. Triggers `MealFeedbackSheet`.

---

## 2026-05-29 — MVP Fixes, Schema Design, Open Discovery

### 🐛 Bug Fixes

- Food search in Log tab returned "No results" — rewired to `searchAll()` + `SG_MACRO_FOODS` (was querying empty Firestore)
- Protein/$ sort ranked Vanilla Soft Serve #1 — added 10g minimum protein floor in both sort locations in Eat tab
- McDonald's Vanilla Soft Serve Cone price corrected $0.50 → $1.00

### ✨ Features & UX

- **Open discovery landing page** — transformed `app/page.tsx` from marketing brochure to live food search. `searchAll()` powered, no auth required. Sign-up prompted only on "Log this meal" action.
- **Post-onboarding routing** — redirect changed from `/dashboard` → `/eat`
- **Eat tab moved to first position** in bottom nav (Eat · Log · Home · Move · Me)
- **Open Now filter hidden** — not backed by real business hours data
- **Scan tab** — replaced upload button with "Coming Soon" card + redirect hint
- **Me page** — `syncProfileFromServer()` added on mount

### 🗄️ Database Schema

- `SGAllergens` interface added to `sgFoodDb.ts` — three-state allergen system (`true`/`false`/`null`)
- `allergens?: SGAllergens` field added to `SGMenuItem`
- McDonald's 11 core items populated with allergen data from official SG source
- Allergen data is **secondary/MVP** — logged in schema, not yet displayed in app UI
- `DATABASE_SCHEMA.md` created — full schema design for Firestore collections
- Firebase/Firestore chosen as database platform (not Supabase)

### 📋 Documentation

- `PARTNER_BRIEFING.md` created — paste into any new chat for full project context
- `Stride_Work_Log.xlsx` created — compressed log, decision log, detailed log, summary
- `Stride_Price_Audit.xlsx` generated — 522 items for GrabFood price verification

---

## Pending Deployment

All changes above are written to OneDrive but **not yet pushed to Vercel**. Run from local terminal:

```bash
cd "C:\Users\user\OneDrive\Fitness App\app"
npm install
cd ..
git add -A
git commit -m "feat: Firestore food DB layer, feedback UI, open discovery, allergen schema"
git push origin main
firebase deploy --only firestore:rules
```
