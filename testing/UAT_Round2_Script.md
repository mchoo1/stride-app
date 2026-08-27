# Stride — UAT Round 2 Script

> Covers DEAN_NEXT.md item #3. Run against the live app:
> **https://stride-app-rosy.vercel.app**
>
> Log every defect (even small/cosmetic ones) in `UAT_Tracker.xlsx` in this
> folder, using the ID scheme below (e.g. `REG-3`, `ONB-1`). Take a screenshot
> for anything visual — attach the filename in the tracker's Notes column.
>
> This script follows `docs/USER_FLOWS.md`, but that doc was last updated
> 2026-04-18 and the app has moved since (e.g. nearby-places switched from
> Google Places to Foursquare, hawker/venue filtering was added). Where the
> live app disagrees with what's written here, that mismatch is itself worth
> logging — either the doc is stale or the flow regressed.

---

## Before you start

- [ ] Use 5 **fresh** email addresses (not previously registered) — Gmail "+"
      aliases work fine, e.g. `you+stride1@gmail.com` through `+stride5@gmail.com`
- [ ] Test on at least 2 different devices/browsers if possible (e.g. phone
      Safari + desktop Chrome) — split the 5 runs across them rather than
      running all 5 the same way
- [ ] Have location services enabled on at least one run, disabled on another
      (tests both the happy path and the GPS-denied fallback)
- [ ] Clear cookies/local storage between runs on the same browser, or use
      an incognito/private window each time, so nothing carries over

---

## REG — Registration & Onboarding (run all 5 times, one per email)

| # | Step | Expected | Pass/Fail |
|---|------|----------|-----------|
| REG-1 | Go to `/register`, start the wizard | Goal selection step loads (Weight Loss / Muscle Gain / Maintenance) | |
| REG-2 | Pick a goal, continue | Body metrics step: gender, age, height, current weight, target weight, activity level | |
| REG-3 | Fill metrics with realistic values, continue | Dietary preferences step: multi-select (halal, vegetarian, vegan, gluten-free, lactose-free, keto, kosher) | |
| REG-4 | Select 0, then 1, then multiple diet flags | Selection UI responds correctly to none/one/many | |
| REG-5 | Continue to account creation | Fields for name, email, password | |
| REG-6 | Enter password under 8 characters | Inline error: "Use at least 8 characters" (or similar) — does NOT silently accept | |
| REG-7 | Enter a valid password (8+ chars), submit | Account creates, redirects to `/dashboard` (or `/onboarding` if that's a separate post-register step — note which happens) | |
| REG-8 | Re-register with the SAME email just used | Error: "Account already exists" or equivalent — does NOT create a duplicate or silently succeed | |
| REG-9 | On dashboard after fresh registration | Calorie ring, macro bars, and water ring show targets calculated from your inputs (not zeros, not defaults) — spot-check target calories roughly matches BMR/TDEE math for the numbers you entered | |
| REG-10 | Force a network error mid-registration (e.g. airplane mode right after submit) | Graceful error message, not a blank screen or crash | |

**Repeat REG-1 through REG-7 for all 5 emails.** Vary the inputs each time
(different goal, different diet flags, different activity level) so you're
covering different BMR/TDEE branches, not the same path 5 times.

---

## ONB — Onboarding / Profile completeness

- [ ] **ONB-1** — After registration, check whether `/onboarding` is a separate
  page you're routed through, or whether registration alone completes the
  profile. CLAUDE.md describes these as separate steps; confirm what the live
  app actually does and note it.
- [ ] **ONB-2** — Go to `/me` or `/profile` and confirm all the data entered
  during registration appears correctly (weight, height, goal, diet flags).
- [ ] **ONB-3** — Edit a profile field (e.g. change target weight) and save.
  Confirm it persists after a page reload (i.e. actually wrote to Firestore,
  not just local state).

---

## REC — Recommendations

- [ ] **REC-1** — Visit `/recommendations` (or the dashboard section showing
  recommendations). CLAUDE.md flags this as possibly still a stub — confirm
  whether real, personalised cards render or whether it's placeholder content.
- [ ] **REC-2** — If real: check that at least one recommendation references
  your actual data (e.g. a hydration nudge if you haven't logged water, a
  protein tip if your protein is low) rather than generic filler text.
- [ ] **REC-3** — Tap a recommendation's action button (if present) — confirm
  it navigates to the right place (`/eat`, `/log/food`, or `/log/activity`).

---

## MEAL — Add-Meal Flow

Test all three entry points — they may share code but can fail independently.

**Manual entry:**
- [ ] **MEAL-1** — `/log/food` → search for a common food (e.g. "chicken rice")
  → results appear
- [ ] **MEAL-2** — Select a result → quantity/serving screen → macros scale
  when you change the quantity
- [ ] **MEAL-3** — Choose a meal type (breakfast/lunch/dinner/snack) → [Log It]
  → confirm it appears on the dashboard's food log immediately (optimistic
  update) and survives a page reload (confirms the background POST succeeded)

**From the Eat page:**
- [ ] **MEAL-4** — `/eat` → find a restaurant or hawker item with a real menu
  → log an item directly from there → same reload-persistence check as MEAL-3
- [ ] **MEAL-5** — Check the item's macros shown before logging match what
  actually gets logged to the dashboard (no rounding/unit mismatch)

**Food scan:**
- [ ] **MEAL-6** — `/scan` → point camera at real food → confirm a result
  card appears with name, macros, and a confidence percentage
- [ ] **MEAL-7** — Deliberately scan something unclear (e.g. a blank wall) →
  confirm the "No food detected" or low-confidence warning path works rather
  than logging garbage data
- [ ] **MEAL-8** — Log a scanned item → same persistence check as MEAL-3

**Cross-cutting:**
- [ ] **MEAL-9** — After logging 2-3 meals across the above methods, confirm
  the dashboard's daily totals (calories, protein, carbs, fat) add up
  correctly — this exercises the `/api/daily-summary` recompute step
- [ ] **MEAL-10** — Delete a logged meal → confirm totals recompute downward
  correctly, not just visually removed with stale totals underneath

---

## NEARBY — Foursquare Migration Check

DEAN_NEXT.md flags this as unverified since the nearby-places backend
switched providers.

- [ ] **NEARBY-1** — `/eat`, grant location permission → nearby restaurants
  actually populate (not empty, not stuck loading)
- [ ] **NEARBY-2** — Deny location permission → confirm a sensible fallback
  (default location, or a clear "enable location" prompt) rather than a
  broken/blank state
- [ ] **NEARBY-3** — Check a few nearby results against what you know is
  actually near that location — Foursquare's data/naming may differ from
  Google Places, which could cause `matchRestaurant()` to miss matches it
  used to catch. Note any restaurant you'd expect to match the DB but doesn't.
- [ ] **NEARBY-4** — Confirm the Venue type filter (restaurant / hawker /
  food court / supermarket / convenience) actually filters results, not just
  visually toggles.

---

## Severity guide (for the tracker)

| Severity | Meaning |
|----------|---------|
| **P0 — Blocker** | Breaks registration, login, or logging entirely. Must fix before soft launch. |
| **P1 — Major** | Feature works but produces wrong data, or a core flow has a dead end. |
| **P2 — Minor** | Cosmetic, confusing copy, or an edge case unlikely to hit most users. |
| **P3 — Nice-to-have** | Polish item, not a real defect. |

---

## When you're done

- [ ] Every REG/ONB/REC/MEAL/NEARBY item above is either ✅ pass or logged as
      a defect in `UAT_Tracker.xlsx`
- [ ] Count of P0s is zero before considering the soft-launch group (see
      `planning/launch/Soft_Launch_Invite_Kit.md`)
- [ ] Share the completed tracker with Ming Hao for anything code-side
