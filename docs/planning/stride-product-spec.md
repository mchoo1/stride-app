# Stride — Simplified Product Spec
**April 2026 | v2.0 Simplification Plan**

> Move. Eat. Connect.

---

## The 4 Pillars

| # | Pillar | Description |
|---|--------|-------------|
| 1 | **Track** | Calories in & out — simple, fun logging at a glance |
| 2 | **Monitor** | Weight, body fat %, BMR and TDEE — track what matters |
| 3 | **Eat Smart** | Restaurant & ready-to-eat suggestions tailored to remaining calories |
| 4 | **Move Nearby** | Discover gyms, parks, trails and fitness activities close to you |

---

## 1. The Simplified Vision

Stride's goal is to be the simplest, most enjoyable fitness companion for everyday people — not elite athletes. The app should feel effortless to use, rewarding to come back to, and genuinely helpful in daily life.

The v2.0 redesign strips away complexity and doubles down on four things users actually care about:

1. How many calories am I eating vs. burning today?
2. Is my weight and body composition moving in the right direction?
3. What should I eat right now that fits my goals?
4. Where can I go to be active nearby?

Everything else — streak counters, community forums, detailed macro breakdowns, water logging — is secondary and should not clutter the core experience.

---

## 2. Feature Audit — Keep / Simplify / Remove

| Feature / Screen | Action | Reason |
|------------------|--------|--------|
| AI Photo Scan (food recognition) | **Keep** | Most fun feature |
| Daily calorie goal & progress bar | **Keep** | Core to pillar 1 |
| Activity calorie burn | **Keep** | Core to pillar 1 |
| Food search & manual log | **Keep** | Essential entry method |
| Onboarding (goal, diet, TDEE) | **Keep** | Sets user baseline |
| Macro rings (protein/carbs/fat) | **Simplify** | Move behind a tap |
| Profile / body stats | **Simplify** | Add weight & body fat tracking |
| Recommendations screen | **Simplify** | Replace with restaurant suggestions |
| Water tracker | **Remove** | Clutter, low engagement |
| Community / social tab | **Remove** | Not in 4 pillars |
| Workouts library | **Remove** | Replace with Move Nearby |
| Streak counter display | **Remove** | Gamification clutter |
| Weight trend chart | **Add New** | Pillar 2: body monitoring |
| Body fat % tracking | **Add New** | Pillar 2: body monitoring |
| BMR & TDEE display on dashboard | **Add New** | Pillar 2: visible baselines |
| Restaurant suggestions (Google Places) | **Add New** | Pillar 3: Eat Smart |
| Ready-to-eat food cards | **Add New** | Pillar 3: Eat Smart |
| Nearby activities map (Google Places) | **Add New** | Pillar 4: Move Nearby |
| Net calorie balance (in minus burned) | **Add New** | Pillar 1: single clear number |

---

## 3. Navigation Redesign

5-tab bottom nav aligned to the 4 pillars:

| Tab | Icon | Contents |
|-----|------|----------|
| **Home** | House | Net calories, today's food log, quick-add buttons |
| **Scan** | Camera | AI photo scan + food search + barcode |
| **Eat** | Fork & knife | Restaurant suggestions + ready-to-eat options near user |
| **Move** | Lightning bolt | Nearby gyms, parks, trails, fitness studios |
| **Me** | Person | Weight log, body fat %, BMR/TDEE, settings |

---

## 4. Screen-by-Screen Spec

### 4.1 Home Screen (Pillar 1 — Calories)
> Answers one question instantly: "How am I doing today?"

**Hero Card — Net Calories**
- Large number: Consumed − Burned
- Single horizontal bar: green when in deficit, orange when over
- Tap to expand macro details (protein / carbs / fat)
- Two sub-labels: "Eaten: X kcal" and "Burned: X kcal"

**Quick Actions (3 big buttons)**
- Log Food → opens search / recent list
- Scan Food → opens camera directly
- Log Activity → opens activity picker with calorie burn estimates

**Today's Food Log**
- Scrollable card list: food name, calories, time of day
- Swipe left to delete
- "See all" link to full log

*Removed from Home: water tracker, streak counter, macro rings (moved behind tap).*

### 4.2 Scan Screen (Pillar 1 — Calories)
- AI photo scan with claude-3-5-haiku model
- Manual food search below camera viewfinder
- Recent foods quick-add strip
- Barcode scan option (future)

### 4.3 Eat Screen (Pillar 3 — Eat Smart) [NEW]
> Tells users what to eat based on their remaining calorie budget.

**Remaining Budget Banner**
- Shows remaining calories: "You have ~620 kcal left today"

**Restaurant Suggestions**
- Nearby restaurants from Google Places API
- Each card: name, cuisine type, distance, estimated calorie range per meal
- Tap → opens in Google Maps or Apple Maps

**Ready-to-Eat Options**
- Curated convenience foods (supermarket, fast food) with accurate macros
- Filter by: Under 400 kcal, High Protein, Low Carb
- Tap to log directly to today's food log

*API needed: Google Places API for restaurant location + category data.*

### 4.4 Move Screen (Pillar 4 — Nearby Activities) [NEW]
> Helps users find somewhere to be active.

**Calorie Burn Goal**
- "Burn 300 more kcal to hit your goal"

**Activity Suggestions Map**
- Map with pins for nearby gyms, parks, trails, fitness studios, pools
- Google Places: 'gym', 'park', 'sports' categories
- Each card: name, type, distance, opening hours

**Activity Picker**
- Log manually: type + duration
- Calorie burn auto-estimated from activity type + user weight
- Examples: Running (8 kcal/min), Cycling (7 kcal/min), Walking (4 kcal/min), Gym (5 kcal/min)

### 4.5 Me Screen (Pillar 2 — Body Monitoring)
> Replaces Profile screen with body metrics tracker.

**Body Stats Card**
- Current weight, body fat %, BMI
- BMR (calories burned at rest)
- TDEE (calories burned with activity)
- Goal: Weight loss / maintenance / gain

**Weight Trend Chart**
- Line chart: last 30 days
- Green if trending toward goal, orange if not
- "Add today's weight" → quick numpad entry

**Body Fat % Tracker**
- Optional log from scale or measuring tape
- Same trend chart as weight

**BMR / TDEE Explainer**
- Plain-English: "Your body burns ~1,680 kcal just existing. With your activity level, your total is ~2,108 kcal/day."
- Recalculate button if weight or activity level changes

---

## 5. Implementation Task List

### Phase 1 — Simplify What Exists

| Task | Priority | Effort | Screen |
|------|----------|--------|--------|
| Replace macro rings with net calorie hero card | Critical | Medium | Home |
| Add "Burned: X kcal" to dashboard calorie display | Critical | Small | Home |
| Remove water tracker widget | High | Small | Home |
| Remove streak counter | High | Small | Home |
| Macro details behind tap on calorie bar | High | Small | Home |
| Swipe-to-delete on food log items | High | Small | Home |
| Rebuild bottom nav: Home/Scan/Eat/Move/Me | High | Medium | Global |
| Remove Community tab and routes | Medium | Small | Global |
| Remove Workouts tab and routes | Medium | Small | Global |
| Simplify onboarding to 3 screens max | Medium | Medium | Onboarding |

### Phase 2 — Body Monitoring (Pillar 2)

| Task | Priority | Effort | Screen |
|------|----------|--------|--------|
| Create Me screen with body stats card | Critical | Medium | Me |
| Daily weight entry (quick numpad input) | Critical | Small | Me |
| Weight trend line chart (last 30 days) | High | Medium | Me |
| BMR / TDEE calculation and display | High | Small | Me |
| Body fat % optional entry and trend chart | Medium | Medium | Me |
| Firestore schema: userMetrics collection | High | Small | Backend |
| Recalculate TDEE when weight changes | Medium | Small | Backend |

### Phase 3 — Eat Smart Screen (Pillar 3)

| Task | Priority | Effort | Screen |
|------|----------|--------|--------|
| Create Eat screen scaffold with remaining kcal banner | Critical | Small | Eat |
| Set up Google Places API or Yelp Fusion API | Critical | Medium | Backend |
| Restaurant cards: name, distance, kcal estimate | High | Medium | Eat |
| "Open in Maps" deep link for each restaurant | High | Small | Eat |
| Ready-to-eat cards from foods database | High | Small | Eat |
| Filter chips: Under 400 kcal, High Protein, Low Carb | Medium | Medium | Eat |
| One-tap log from Eat screen to food diary | Medium | Small | Eat |
| Request location permission (iOS + web) | High | Small | Eat |

### Phase 4 — Move Nearby Screen (Pillar 4)

| Task | Priority | Effort | Screen |
|------|----------|--------|--------|
| Nearby gyms/parks via Google Places API | Critical | Medium | Move |
| Map view with category pins | High | Large | Move |
| Activity log with calorie burn estimate | High | Medium | Move |
| Location cards: name, type, distance, hours | Medium | Small | Move |

---

*See `CLAUDE.md` for the full technical reference and outstanding tasks list.*
