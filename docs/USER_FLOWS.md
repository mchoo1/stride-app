# Stride — Complete User Flows & Backend Logic

> Last updated: 2026-04-18

---

## Firestore Data Model

```
users/{uid}                          ← profile + targets + streak
  ├── name, email
  ├── goalType, gender, age
  ├── currentWeight, targetWeight, heightCm
  ├── activityLevel
  ├── targetCalories, targetProtein, targetCarbs, targetFat, targetWater
  ├── dietaryFlags: string[]
  ├── streak, longestStreak, lastActiveDate
  └── onboardingComplete: boolean

users/{uid}/foodLogs/{id}
  ├── name, emoji, mealType
  ├── calories, protein, carbs, fat, fibre
  ├── quantity (grams), foodItemId?, restaurantId?
  └── loggedAt: Timestamp

users/{uid}/activityLogs/{id}
  ├── name, emoji, durationMins, intensity
  ├── caloriesBurned, activeMins
  ├── source (manual | ai_estimate | apple_health | google_fit)
  ├── metValue?, distanceKm?, steps?, heartRateAvg?, heartRateMax?
  └── loggedAt: Timestamp

users/{uid}/waterLogs/{id}
  ├── amountMl
  └── loggedAt: Timestamp

users/{uid}/weightLogs/{id}
  ├── weightKg, bodyFatPct?, date (YYYY-MM-DD)
  └── loggedAt: Timestamp

users/{uid}/dailySummaries/{YYYY-MM-DD}
  ├── totalCalories, totalProteinG, totalCarbsG, totalFatG, totalFibreG
  ├── totalWaterMl, caloriesBurned, activeMins, netCalories
  ├── targetCalories, targetProteinG, targetCarbsG, targetFatG, targetWaterMl
  └── updatedAt: Timestamp

users/{uid}/recommendations/{YYYY-MM-DD}
  ├── recs: Recommendation[]
  └── generatedAt: Timestamp

foods/{id}                           ← community food library
  ├── name, brand, emoji, barcode?
  ├── caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g
  ├── dietaryFlags, source, isVerified
  └── submittedBy: uid
```

---

## API Routes

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/food-logs?date=YYYY-MM-DD` | ✅ | Today's food log entries |
| POST | `/api/food-logs` | ✅ | Log a food item |
| DELETE | `/api/food-logs?id=xxx` | ✅ | Delete a food entry |
| GET | `/api/activity-logs?date=YYYY-MM-DD` | ✅ | Today's activity entries |
| POST | `/api/activity-logs` | ✅ | Log an activity |
| DELETE | `/api/activity-logs?id=xxx` | ✅ | Delete an activity entry |
| GET | `/api/water-logs?date=YYYY-MM-DD` | ✅ | Today's water intake total |
| POST | `/api/water-logs` | ✅ | Log water intake |
| GET | `/api/weight-logs?days=30` | ✅ | Weight trend |
| POST | `/api/weight-logs` | ✅ | Log weight (upserts per day) |
| DELETE | `/api/weight-logs?id=xxx` | ✅ | Delete a weight entry |
| GET | `/api/profile` | ✅ | Get user profile |
| PUT | `/api/profile` | ✅ | Update profile & targets |
| GET | `/api/daily-summary?date=YYYY-MM-DD` | ✅ | Get daily totals |
| POST | `/api/daily-summary` | ✅ | Recompute today's summary |
| GET | `/api/streak` | ✅ | Get streak data |
| POST | `/api/streak` | ✅ | Mark today active |
| GET | `/api/recommendations` | ✅ | Get personalised recommendations |
| GET | `/api/foods?q=chicken` | ❌ | Search community food library |
| POST | `/api/foods` | ✅ | Submit a community food |
| POST | `/api/scan-food` | ❌ | Vision AI food scan |
| GET | `/api/nearby-places?lat&lng&mode` | ❌ | Nearby restaurants |

---

## Flow 1 — Registration & Onboarding

```
/register (5-step wizard)
│
├── Step 0: Goal Selection
│     User picks: Weight Loss / Muscle Gain / Maintenance
│     → State: goalType
│
├── Step 1: Body Metrics
│     Fields: gender, age, height (cm), current weight (kg),
│             target weight (kg), activity level
│     → State: gender, age, heightCm, currentWeight,
│              targetWeight, activityLevel
│
├── Step 2: Dietary Preferences
│     Multi-select: halal, vegetarian, vegan, gluten-free,
│                   lactose-free, keto, kosher
│     → State: dietaryFlags[]
│
├── Step 3: Account Creation
│     Fields: name, email, password (min 8 chars)
│     → Validates email format, password strength
│
└── Step 4: Submit
      → Firebase: createUserWithEmailAndPassword(email, password)
      → Firebase: updateProfile(user, { displayName: name })
      → Zustand:  completeOnboarding(allData)
                  (calculates BMR → TDEE → macro targets)
      → Firestore: users/{uid} ← profile + targets (background)
      → Redirect: /dashboard

Error paths:
  - Email already in use → "Account already exists. Sign in?"
  - Weak password        → "Use at least 8 characters"
  - Network error        → "Could not create account. Try again."
```

**BMR / TDEE calculation** (`src/lib/utils.ts`):
```
BMR (Mifflin-St Jeor):
  male:   10×weight + 6.25×height − 5×age + 5
  female: 10×weight + 6.25×height − 5×age − 161
  other:  10×weight + 6.25×height − 5×age − 78

TDEE = BMR × activity multiplier
  sedentary: ×1.2 | light: ×1.375 | moderate: ×1.55
  active: ×1.725 | very_active: ×1.9

Target calories:
  weight_loss:   TDEE − 500
  muscle_gain:   TDEE + 300
  maintenance:   TDEE

Macros (% of target calories):
  protein: goalType=muscle_gain → 35%, else 30%  (4 kcal/g)
  fat:     15%                                   (9 kcal/g)
  carbs:   remainder                             (4 kcal/g)
```

---

## Flow 2 — Login

```
/login
│
├── User enters email + password
├── → Firebase: signInWithEmailAndPassword(auth, email, password)
├── → AuthContext: onAuthStateChanged fires with user
├── → Zustand: syncProfileFromServer() ← pulls Firestore profile
├── → Zustand: loadTodayFromServer()   ← hydrates today's logs
└── → Redirect: /dashboard

Error paths:
  - Wrong password       → "Incorrect email or password"
  - User not found       → "Incorrect email or password" (intentionally vague)
  - Too many attempts    → "Too many attempts. Try again later."
  - Network error        → "Connection error. Check your internet."
```

---

## Flow 3 — Dashboard

```
/dashboard (loads on mount)
│
├── [mount] store.loadTodayFromServer()
│     → GET /api/food-logs?date=today
│     → GET /api/activity-logs?date=today
│     → GET /api/water-logs?date=today
│     → GET /api/streak
│     → Merges server data into Zustand (preserves any local-only entries)
│
├── Displays:
│     • Calorie ring: netCalories / targetCalories
│     • Macro bars: protein, carbs, fat (g remaining)
│     • Water ring: waterMl / targetWater
│     • Streak badge: streak days
│     • Daily challenges (3): Log 3 meals / Burn 200 kcal / Hit goal
│     • Today's food log (grouped by meal type)
│     • Today's activity log
│     • Quick-add water buttons (200ml / 350ml / 500ml)
│
└── Quick actions:
      [Log Food] → /log/food
      [Scan]     → /scan
      [Activity] → /log/activity
      [Eat]      → /eat
```

---

## Flow 4 — Food Logging (Manual)

```
/log/food
│
├── Search bar → queries Zustand mockFoods + GET /api/foods?q={query}
│
├── User selects item or types custom
│
├── Quantity screen:
│     • Serving size slider / text input (grams)
│     • Macros auto-scale with quantity
│     • Meal type selector (breakfast / lunch / dinner / snack)
│
└── [Log It] button:
      → Zustand: addFoodEntry(entry)          ← optimistic
      → Background: POST /api/food-logs
      → Background: POST /api/streak
      → Background: POST /api/daily-summary   ← recomputes totals
      → Navigate back to dashboard

Log from Eat page (restaurant menu item):
      → Same addFoodEntry flow
      → foodItemId = menuItem.id
      → restaurantId = restaurant.id
```

---

## Flow 5 — Food Scan

```
/scan
│
├── Camera view (device camera API)
├── User frames food item and taps [Scan]
│
├── → Base64 encode frame
├── → POST /api/scan-food { image: base64 }
│
│   Backend:
│   ├── Claude Haiku (vision): identify food name + estimate serving
│   ├── USDA FoodData Central lookup by food name
│   └── Return: { name, emoji, calories, protein, carbs, fat,
│                 confidence, estimatedGrams }
│
├── Result card shown:
│     • Food name + emoji
│     • Macro breakdown
│     • Confidence %
│     • Serving size estimate
│
├── User can adjust quantity
│
└── [Log It] → same as manual log flow

Error paths:
  - No food detected    → "Point the camera at a food item"
  - Low confidence (<70%) → yellow warning "May not be accurate"
  - Network error       → "Scan failed — try logging manually"
```

---

## Flow 6 — Eat / Discover

```
/eat  (3 tabs)
│
├── TAB: Restaurant
│     ├── [Location] button → browser geolocation API
│     ├── → GET /api/nearby-places?lat&lng&mode=restaurant
│     │     (cached 10 min, ~1km grid buckets)
│     ├── Each place: matchRestaurant(place.name) against SG_RESTAURANTS
│     │     ✓ Full DB match → expandable inline menu with macros + Protein/$
│     │     ✗ No match      → cuisine-type fallback estimate
│     ├── Search: searches DB restaurants + menu items
│     ├── Sort: Protein/$ ↓ | Calories ↑ | Default
│     ├── Diet filter: auto-applied from user.dietaryFlags
│     └── [Log] on any menu item → addFoodEntry()
│
├── TAB: Grab & Go
│     ├── Shows SG_RESTAURANTS where tab='grab_go'
│     ├── Same search / sort / diet filter
│     ├── Expandable per-restaurant menu with inline macros
│     ├── DietBadge: great (✓✓) | check (✓) | warn (⚠)
│     ├── PpdBadge: green ≥6g/$ | yellow 3-6 | red <3
│     └── [Log] → addFoodEntry()
│
└── TAB: Store (Recipes)
      ├── Shows SG_RECIPES (filterable by diet, category)
      ├── Recipe card: name, emoji, time, servings, cost/serving
      ├── Expanded: ingredient list with prices, step-by-step instructions
      ├── Macros per serving prominently displayed
      └── [Log This Meal] → addFoodEntry() with recipe macros
```

---

## Flow 7 — Activity Logging

```
/log/activity
│
├── Search preset activities:
│     Running, Cycling, Swimming, Weight Training, HIIT,
│     Yoga, Walking, Basketball, Soccer, …
│
├── Each activity shows:
│     • MET value (used for calorie estimate)
│     • Duration input (minutes)
│     • Intensity selector (low / medium / high)
│
├── Calorie estimate:
│     calories = MET × weight(kg) × duration(h)
│
├── [Log Activity] button:
│     → Zustand: addActivityEntry(entry)     ← optimistic
│     → Background: POST /api/activity-logs
│     → Background: POST /api/streak
│     → Background: POST /api/daily-summary
│     → Navigate: /move
│
└── Custom activity:
      User types name, duration, manual calorie estimate
      → Same log flow with source='manual'
```

---

## Flow 8 — Water Tracking

```
Dashboard water section
│
├── Quick buttons: +200ml / +350ml / +500ml
│
└── [+] tap:
      → Zustand: addWater(ml)         ← optimistic update
      → Background: POST /api/water-logs { amountMl }
      → Water ring animates to new fill level

Progress:
  • Ring fills from 0 → targetWater
  • Colour: blue (0-50%) → teal (50-90%) → green (≥90%)
  • Recommendation fires if <50% by noon (from /api/recommendations)
```

---

## Flow 9 — Profile & Settings

```
/me  (personal dashboard)
│
├── [mount] store.syncProfileFromServer()
│
├── Shows:
│     • Avatar, name, email
│     • Current stats: weight, height, BMI, goal
│     • Target breakdown: calories, macros, water
│     • Streak badge + longest streak
│     • Weight trend chart (30 days)
│
├── [Edit Profile] → /profile
│     Fields: name, age, gender, height, weight, activity level,
│             goal type, dietary flags
│     → [Save]: PUT /api/profile { ...updatedFields }
│               Zustand: updateProfile(updates)
│               Recalculate targets via completeOnboarding()
│
├── [Log Weight] modal:
│     Input: weight (kg), optional body fat %
│     → Zustand: addWeightEntry(weight, bodyFat)
│     → Background: POST /api/weight-logs
│
├── [Sign Out]:
│     → Firebase: signOut(auth)
│     → Redirect: /login
│
└── [Reset App] (danger zone):
      → Confirm dialog
      → Zustand: resetAll()
      → Firebase: signOut(auth)
      → Redirect: /login
```

---

## Flow 10 — Recommendations

```
/recommendations  (also shown on dashboard)
│
├── GET /api/recommendations
│
│   Rules engine checks (in priority order):
│   1. Water < 50% of target by noon      → Hydration alert
│   2. Protein < 60% of target by 2pm     → Protein tip with food suggestions
│   3. Calories < 30% of target by 1pm    → Under-eating warning
│   4. Calories > 115% of target          → Over-target warning (weight_loss only)
│   5. No activity logged by 4pm          → Movement nudge
│   6. Carbs > 130% of target             → Balance suggestion
│   7. Streak milestone (3/7/14/30/60/100)→ Achievement celebration
│   8. No food logged by 9-11am           → Breakfast tip (personalised by diet)
│
│   Returns top 5 sorted: high → medium → low priority
│   Cached in Firestore for the day
│
└── Each card:
      • Emoji + title + body text
      • Optional [action button] → links to /eat, /log/food, /log/activity
```

---

## Flow 11 — Move (Activity Hub)

```
/move
│
├── [mount] loads today's activity log from store
│
├── Section 1 — Nearby Fitness Places (GPS):
│     → GET /api/nearby-places?lat&lng&mode=restaurant
│     Shows gyms, pools, parks nearby
│     Each card: name, distance, rating
│
├── Section 2 — Log an Activity:
│     Scrollable preset list (capped height 320px, purple scrollbar)
│     Search + filter by category
│
└── Section 3 — Today's Activity Log:
      Lists logged activities with duration, calories, intensity
      [Delete] → removeActivityEntry(id) + DELETE /api/activity-logs?id
```

---

## Flow 12 — Streak & Gamification

```
Streak increments when:
  → Any food is logged (addFoodEntry)
  → Any activity is logged (addActivityEntry)
  → POST /api/streak { date: todaySGT() } called

Streak rules (server-side, /api/streak POST):
  • lastActiveDate === today      → no change (idempotent)
  • lastActiveDate === yesterday  → streak + 1
  • anything else                 → reset to 1

Milestone rewards (shown in recommendations):
  3, 7, 14, 30, 60, 100 days → celebration card

Daily challenges (client-side, no API):
  1. Log 3 meals       → +30 XP
  2. Burn 200 kcal     → +40 XP
  3. Hit calorie goal  → +50 XP
```

---

## Offline / Error Handling

All write actions use optimistic updates:
1. Local state (Zustand + localStorage) updates immediately
2. API call fires in background (`bg()` helper)
3. If API fails → local state remains correct, server will be out of sync
4. On next `loadTodayFromServer()` (next dashboard visit) → server state wins

Recommendation: add a Firestore offline persistence flag for true offline-first support.

---

## Environment Variables Required

```bash
# Firebase client (public)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase admin (server-only)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# External APIs
ANTHROPIC_API_KEY=          # Vision AI food scanning
GOOGLE_PLACES_API_KEY=      # Nearby restaurants
USDA_API_KEY=               # Nutrition data (optional — DEMO_KEY works)
```
