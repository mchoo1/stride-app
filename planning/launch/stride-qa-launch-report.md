# Stride — Launch Readiness QA Report

**Date:** 2026-06-01  
**Tested against:** https://stride-app-rosy.vercel.app  
**Tester:** Claude (automated browser testing)  
**Scope:** MVP — food discovery (no auth), profile creation, calorie tracking

---

## Executive Summary

The app has a strong core but **is not launch-ready** in its current state. Two blockers must be fixed before shipping:

1. **Search crashes** on any input — the primary discovery feature for unauthenticated users is broken.
2. **The /me (Profile) page fails to load** — users cannot access their profile after registration due to a missing Vercel deployment chunk.

Recipe data is also broken (all macros show as `undefined`). Everything else — food browsing, filters, registration, food logging, and the Move page — works well.

---

## Test Results by Area

### 1. Public Access / Home Page ✅ PASS

| Test | Result |
|------|--------|
| App loads without login | ✅ Loads to Home (food discovery) |
| Home shows personalised greeting | ✅ "Hello, [Name]" |
| Recommended spots section renders | ✅ McDonald's, KFC, Burger King etc. |
| Popular meals section renders | ✅ With price, cal, protein, Protein/$ badge |
| Category filter pills visible | ✅ Halal, High Protein, Best Value, Vegetarian, Bubble Tea |
| Bottom nav renders (logged-out) | ✅ Home / Search / Log / Profile (4 tabs) |
| Bottom nav renders (logged-in) | ✅ Home / Log / Eat / Move / Me (5 tabs) |

---

### 2. Food Search & Discovery (Eat Page)

#### 2a. Meals Tab ✅ PASS (browsing) / 🔴 FAIL (search)

| Test | Result |
|------|--------|
| Meals tab loads | ✅ 556 meals visible, no auth required |
| Meal cards show price, calories, Protein/$ | ✅ e.g. Big Mac: $8.30 · 550 cal · 3g/$ |
| Protein/$ badges colour-coded | ✅ Green (high), orange (mid), red (low) |
| Meal card macro expansion (▼) | ✅ Shows protein/carbs/fat/calories + Stride Approved badge + Grab/Panda/Maps delivery links |
| **Search bar** | 🔴 **CRASH** — typing any query throws `(0, s.searchAll)(...).map is not a function`. The ErrorBoundary catches it but the whole Eat page becomes blank. |
| List / Grid view toggle | ✅ Both views work |

**Root cause of search crash:** `searchAll()` in `sgFoodDb.ts` returns a non-array value (likely `undefined` or an object) when called with search input. Fix: guard with `Array.isArray()` or check return type of `searchAll`.

#### 2b. Restaurants Tab ✅ PASS

| Test | Result |
|------|--------|
| Restaurants tab loads | ✅ 53 restaurants with menu data |
| Restaurant cards show cuisine type, price tier, diet badges, item count | ✅ e.g. McDonald's · Fast Food · $ · Halal · 15 items |
| Click restaurant to filter meals | ✅ Filters to restaurant's meals with "X meals from [Restaurant]" label and removable chip |
| Restaurant search bar | ⚠️ Not tested (same search crash risk) |

#### 2c. Recipes Tab 🔴 FAIL (data broken)

| Test | Result |
|------|--------|
| Recipes tab loads | ✅ 6 recipes listed |
| Recipe card calorie count | 🔴 **BLANK** — all recipes show "cal · N servings" with no calorie value |
| Recipe macro expansion (▼) | 🔴 **BROKEN** — shows `undefinedg Protein`, `undefinedg Carbs`, `undefinedg Fat` |
| Ingredient display | 🔴 **BROKEN** — shows raw IDs (`ing_chicken_breast`, `ing_brown_rice`) and blank quantities |

**Root cause:** Recipe objects in `sgFoodDb.ts` store macros as references to resolved ingredients, but `calcCostPerServing` / `resolveIngredients` is not being called before rendering. The raw recipe objects have `undefined` macro fields at the top level.

#### 2d. Filter & Sort ✅ PASS

| Test | Result |
|------|--------|
| Filter & Sort panel opens | ✅ Bottom sheet slides up |
| Sort options | ✅ Best Match, Protein per $, Price: Low→High, Lowest Calories |
| Stride Approved data only toggle | ✅ Present |
| Price range filter ($, $$, $$$) | ✅ Present |
| Dining option filter (Dine-in / Takeaway / Delivery) | ✅ Present |
| Diet type filter | ✅ Halal, Vegetarian, Vegan, Gluten-Free, No Pork, High Protein, Keto, Low-Carb, Pescatarian |
| Macro sliders (Min Protein, Max Calories) | ✅ Present |
| Apply filter | ✅ High Protein filter: 556 → 19 meals, shows "Filters (1)" indicator |
| Clear all | ✅ Present |

---

### 3. Registration & Onboarding ✅ PASS

| Test | Result |
|------|--------|
| /register page loads | ✅ |
| Step 1/5 — Goal selection | ✅ Lose Weight / Build Muscle / Stay Healthy |
| Step 2/5 — Body stats | ✅ Sex, age, height, current weight, target weight, activity level |
| Step 3/5 — Dietary preferences | ✅ Optional, skippable (Vegetarian, Vegan, Halal, Keto etc.) |
| Step 4/5 — Account creation | ✅ Name, email, password (smart placement — value shown before commitment) |
| Step 5/5 — Success screen | ✅ "You're all set, [Name]!" with goal + activity summary |
| Redirect to dashboard after registration | ✅ Navigates to /dashboard |
| BMR/TDEE calculation accuracy | ✅ 28yo male, 175cm, 75kg, moderate activity, weight loss → **2149 kcal** (correct Mifflin-St Jeor result) |
| "Already have an account? Sign in" link | ✅ Present on step 4 |

---

### 4. Authenticated Features

#### 4a. Food Logging ✅ PASS

| Test | Result |
|------|--------|
| /log/food page loads | ✅ |
| Calorie progress bar shows target | ✅ 0 / 2149 kcal |
| Macro progress bars (P / C / F) | ✅ 0g shown initially |
| Meal type tabs | ✅ Breakfast / Lunch / Dinner / Snack |
| Manual Entry form | ✅ Opens inline panel with food name, weight, cal, protein, carbs, fat |
| Submit manual entry | ✅ Updates progress bar immediately (optimistic UI): 450 / 2149 kcal |
| Entry appears in Today's Log | ✅ With meal type, timestamp, macros, delete button |
| Search DB button | ⚠️ Not tested (same search crash risk) |
| AI Scan button | ⚠️ Requires camera — not testable in browser automation |

#### 4b. Move Page ✅ PASS

| Test | Result |
|------|--------|
| /move page loads | ✅ |
| GPS location lookup triggers | ✅ "Getting your location..." spinner |
| "Log an Activity" card present | ✅ "Running, gym, yoga and 31 more" |
| Activity types count | ✅ 34 activity types available |

#### 4c. Me / Profile Page 🔴 FAIL

| Test | Result |
|------|--------|
| /me page loads | 🔴 **CRASH** — `ChunkLoadError: Failed to load chunk /_next/static/chunks/2e34be29bc1a160b.js` |
| Page renders | 🔴 Blank white screen with "Application error" message |
| Retry / reload | 🔴 Consistently fails — chunk is missing from Vercel deployment |

**Root cause:** A required JavaScript chunk is missing from the Vercel deployment. Fix: **redeploy** from the `main` branch. Run `git push origin main` to trigger a fresh Vercel build.

#### 4d. Login Page ✅ PASS

| Test | Result |
|------|--------|
| /login page loads | ✅ Clean form with Stride branding |
| Email + password fields | ✅ |
| "Sign in" button | ✅ Present |
| "Don't have an account? Create one" link | ✅ |

---

## Bug Summary

### 🔴 Blockers (must fix before launch)

| # | Page | Bug | Impact |
|---|------|-----|--------|
| B1 | /eat (all tabs) | **Search bar crashes the page** — `searchAll(...).map is not a function` | Any user who types in the search bar loses the entire Eat page |
| B2 | /me | **Profile page fails to load** — missing Vercel chunk `2e34be29bc1a160b.js` | All registered users cannot access their profile |

### 🟡 High (fix before or shortly after launch)

| # | Page | Bug | Impact |
|---|------|-----|--------|
| H1 | /eat → Recipes | Recipe cards show no calorie value ("cal · N servings") | Useless to users making calorie-aware choices |
| H2 | /eat → Recipes | Expanded recipe shows `undefinedg` for all macros and raw ingredient IDs | Recipes are effectively non-functional for nutrition tracking |

### 🟢 Observations / Minor

| # | Note |
|---|------|
| O1 | Clicking the "+" button on meal cards in the Search page can cause a brief browser renderer freeze. Likely a heavy synchronous re-render. Consider debouncing or deferring the add-to-log side effect. |
| O2 | Unauthenticated users see the "+" add button on meal cards but there's no feedback when they click it (no toast, no redirect to login). Either disable the button or redirect with context. |
| O3 | The /dashboard route shows food discovery content (same as the Home tab), not a calorie tracking dashboard with a ring + macros as described in the product spec. This may be intentional but is a spec divergence. |
| O4 | The login page pre-fills with the browser's saved email/password — make sure autofill doesn't expose another user's credentials on shared devices. |

---

## Fix Priority Order

1. **Redeploy to Vercel** — fixes B2 (/me ChunkLoadError) with zero code changes
2. **Fix `searchAll` return type** — `sgFoodDb.ts`: wrap return in `Array.isArray()` guard or fix the function to always return an array
3. **Fix recipe macro rendering** — call `resolveIngredients()` before displaying recipe cards, or pre-compute and store `totalCalories`, `totalProtein`, `totalCarbs`, `totalFat` on each recipe object
4. **Add auth gate or toast to "+" button** — guide logged-out users who try to log a food item

---

## Launch Verdict

| Area | Status |
|------|--------|
| Food browsing (no auth) | ✅ Ready |
| Restaurant discovery | ✅ Ready |
| Filter & Sort | ✅ Ready |
| Registration / Onboarding | ✅ Ready |
| Food logging | ✅ Ready |
| Move page | ✅ Ready |
| Login | ✅ Ready |
| **Search** | 🔴 **Blocker** |
| **Recipe data** | 🔴 **Blocker** |
| **Profile page (/me)** | 🔴 **Blocker** |

**Overall: NOT READY — fix 3 blockers, then re-test search + /me before shipping.**
