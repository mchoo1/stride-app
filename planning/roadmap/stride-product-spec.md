# Stride — Product Spec
> **Last updated:** 2026-08-02 | **Version:** 3.0

---

## Positioning

**Stride is Singapore's macro food search engine.**

Primary use case: search nutrition data at SG restaurants and hawker centres before you order. Secondary use case: track calories, weight, water, and activity. Everything is personalised to your daily goal.

The "Eat Smart" angle is the core differentiator — Stride helps users make smarter food choices at the point of decision, not just log what they already ate.

---

## Navigation

4-tab bottom nav:

| Tab | Purpose |
|-----|---------|
| **Home** | Daily summary — calorie ring, macro bars, water, streaks, shortcuts |
| **Eat** | Macro food search engine — restaurants, hawker, grab-and-go, recipes |
| **Move** | Nearby gyms and parks + activity log |
| **Me** | Profile, weight log, goals, settings |

---

## Screen Specs

### Home (Dashboard)
> "How am I doing today?"

- Calorie ring (consumed vs target) with macro bars (protein / carbs / fat)
- Water ring with quick-add buttons
- Streak counter and daily challenge card
- Recent meals (last 3 logged, tap to log again)
- Personalised shortcuts: High Protein Nearby · Under $8 · Quick Meals
- Near Me section: top-ranked nearby restaurants by nutrition score

**Log actions:** Log Food → Log Activity → Log Water → Log Weight (via Body tab)

### Eat (Food Search Engine)
> "What should I eat that fits my goals?"

**Meals tab**
- Search bar — filters 1,000+ SG-verified items by name, restaurant, or macro
- Results ranked by best macro match to remaining daily targets
- Each result: name, restaurant, calories, protein, price, diet fit badge
- One-tap confirm sheet: serving size → log to today

**Restaurants tab**
- Leaflet map with GPS-based nearby restaurant pins
- Filter strip: Best Match · Calories · Protein · Price · Nearest
- Max price filter chip
- Full inline menus per restaurant
- Diet fit badges (great / check / warn) and confidence badges (Stride Approved / Community / Estimated)
- Active filter chip shown when arriving from dashboard shortcut

**Recipes tab**
- 6 home-cook recipes with full macro breakdown
- Filter by dietary preference

**Remaining macros banner** — shows calories / protein / carbs / fat left for the day

### Move
> "Where can I go to be active? What did I do today?"

- Map view: nearby gyms, parks, fitness studios (Google Places API)
- Activity log: type, duration, intensity → MET-based calorie burn estimate
- Past activity list

### Me
> "My stats, my goal, my progress."

- Profile: name, goal type, activity level, dietary flags
- Weight log: quick entry + 30-day trend chart (auto-recalculates macro targets)
- Goals: custom calorie and macro targets
- Settings: email, password, notifications, account deletion

---

## Data Model — SG Food Database

**Source hierarchy (trust order):**
1. Official brand SG nutrition PDF → `source: 'official_sg'`, `verified: true`
2. HPB Nutrition Information Centre → `source: 'hpb'`, `verified: true`
3. Community estimates → `source: 'community'`, `verified: false`

**Current coverage:**
- 30+ restaurant chains (McDonald's, KFC, Subway, Burger King, Jollibee, Shake Shack, Nando's, Astons, Daily Cut, and more)
- 6 hawker centres (Amoy Street, Maxwell, Chinatown, Lau Pa Sat, Old Airport Road, Tiong Bahru)
- 6 grab-and-go chains (Grain, SaladStop, Saladbox, Starbucks, Stuffd, Toast Box)
- Grocery ingredients (FairPrice staples)
- 6 recipes (Chicken Rice Bowl, Tuna Oat Salad, Egg Fried Rice, Overnight Oats, Tofu Stir Fry, Chickpea Bowl)

---

## Personalisation Engine

**Onboarding (5 steps):**
1. Goal: Weight Loss / Muscle Gain / Maintenance
2. Body stats: gender, age, height, current weight, target weight
3. Activity level: sedentary / light / moderate / active / very active
4. Dietary flags: halal, vegetarian, vegan, gluten-free, dairy-free
5. Review — macro targets set automatically

**TDEE calculation (Mifflin-St Jeor):**
- Weight Loss: TDEE − 500 kcal
- Muscle Gain: TDEE + 300 kcal
- Maintenance: TDEE

**Macro split:**
- Protein: 30% (35% for muscle gain)
- Fat: 15%
- Carbs: remainder

**Auto-update:** Macro targets recalculate when user logs new weight.

---

## AI Features

**Food Scan (live)**
Camera → Claude Haiku vision → USDA FoodData Central lookup → pre-filled macro entry → log

**Recommendations engine (rules-based)**
8 rules considering: time of day, remaining macros, goal type, dietary flags, recent meals

---

## Roadmap

### Now — Data Expansion
- Expand hawker centre coverage to all major SG hawker centres
- Add more grab-and-go items (7-Eleven, Cheers, FairPrice Xpress)
- Barcode scan using Open Food Facts API

### Phase 2 — Community & Growth (6–12 months)
- Community food submissions + macro verification flow
- Social feed: share meals, workouts, restaurant finds with macros
- Wearable sync: Apple HealthKit, Google Fit
- GrabFood / Foodpanda macro lookup integration
- Delivery deep-links (pre-filtered to goal-matching dishes)
- Confidence threshold UI: flag low-confidence AI scans before saving

### Phase 3 — Monetisation (12–24 months)
- Stride Pro subscription: unlimited AI scans, advanced analytics, custom plans
- Promoted restaurant partner listings (clearly labelled)
- PT and nutritionist booking in-app
- Affiliate commissions on delivery deep-links

### Long-term — Activities & Movement
- Fitness class discovery and booking (yoga, HIIT, Pilates, spin, boxing, functional training)
- Sports and group activity logging: running, swimming, cycling, team sports (50+ activity types)
- Gym finder: amenities, peak hours, membership sign-up via partner portal
- Structured workout library: filter by goal, equipment, duration, certified trainers
- Wearable sync: automatic activity import from Garmin, Fitbit, Apple Watch
- Personal trainer and nutritionist marketplace
- Community activity feed: structured workout posts with macros and calorie data

---

## Technical Reference

See `CLAUDE.md` in the repo root for full developer spec including:
- File structure and folder map
- Firestore schema
- API routes
- State management patterns
- SSR:false page architecture
- Deployment instructions
