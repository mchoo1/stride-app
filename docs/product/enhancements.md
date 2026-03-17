# Stride — Enhancement Ideas

*Consolidated from product sessions, user feedback, and design exploration.*

---

## 1. Your Story — Instagram-Style Social Layer

The centrepiece social feature. A visual-first feed where users share real food and fitness moments, all enriched with macro data, prices, and community-verified accuracy. Think Instagram meets MyFitnessPal.

### 1.1 Food Reviews

Every post is structured data, not just a photo. Macro overlay baked into the image. Price always shown. Community can verify or correct data.

#### Home Cooked Food

- Photo upload with macro overlay (auto or manual: cal / P / C / F)
- **Recipe card** — ingredients list with per-ingredient macro contribution, total servings, cost per portion
- Batch cook mode — "I made X portions" splits macros automatically
- Tag: cooking method (grill, air fry, boil, raw), prep time, difficulty
- One-tap "Copy Recipe" for anyone seeing the post → imports ingredients + macros into their own food log/planner
- Hashtags: `#MealPrep` `#HomeCooking` `#CleanEating` `#BudgetMeals`

#### Takeaway / Delivery Apps

- Attach delivery app order (GrabFood, Foodpanda, Deliveroo, DoorDash, Uber Eats)
- Show: restaurant name, item ordered, delivery platform, total price including delivery fee
- Macro entry: manual or AI photo scan on arrival
- Tip field: ordering hacks (e.g. "ask for sauce on side", "swap fried rice for steamed")
- Accuracy rating: community can confirm/dispute macros shown
- Hashtags: `#GrabFood` `#FoodDelivery` `#TakeawayMacros`

#### Grab & Go

- Convenience store / petrol station / airport food finds
- Store name, item name, price, barcode scan option for instant macros
- **Value score** — price per gram of protein, automatically calculated and displayed
- "On the go" badge to distinguish from planned meals
- Hashtags: `#GrabAndGo` `#ConvenienceStore` `#ProteinOnTheGo`

#### Restaurants

- Restaurant name, specific dish ordered, price paid
- Stars (1–5) + % who recommend
- **Pro tips** — ordering modifications to hit macros better (half portion, no sauce, add protein)
- Photo of actual dish received (vs menu photo comparison option)
- Tag: cuisine type, dining occasion (solo/date/work lunch/family)
- Link to Plan screen — "Try this at [restaurant]" button appears in feed
- Hashtags: `#RestaurantReview` `#MacroFriendly` `#HealthyEating`

---

### 1.2 Activity Sharing

#### Gym Routines

- Structured workout log: exercise → sets → reps → weight or time
- Muscles targeted (auto-tagged from exercise names)
- Total volume (kg lifted), estimated calorie burn
- Progress tracking — compare same workout over time, surface PRs
- "Copy Routine" → saves to user's own workout library
- Optional: gym name/location tag
- Hashtags: `#GymLife` `#ProgressiveOverload` `#PushDay` `#LegDay`

#### Classes & Group Activities

- Class name, studio/gym, instructor (optional)
- Duration, calorie burn, intensity (low / moderate / high)
- Recommendation field — "Would you go again?", "Good for beginners?"
- Class finder integration — link to booking if studio has public calendar
- Hashtags: `#YogaLife` `#Pilates` `#HIIT` `#Crossfit` `#SpinClass`

#### Running & Cardio

- Route map thumbnail (from GPS data or manual distance input)
- Stats card: distance, duration, pace (min/km or min/mile), elevation, heart rate zone
- Milestone badges: first 5k, 10k PB, longest run, 30-day streak
- Split breakdown by km/mile
- Shoe tracking — log mileage on each pair, alert when to replace
- Hashtags: `#Running` `#Marathon` `#5k` `#MorningRun` `#Strava`

#### Swimming, Cycling, Walking & Other

- Sport-specific stat cards (swim: laps/distance/stroke; cycle: speed/cadence/power; walk: steps/distance)
- Apple Health / Google Fit / Garmin / Strava import
- Calorie burn auto-estimated from duration + user's weight + activity type

---

## 2. Feed & Discovery Architecture

### Tabs

| Tab | Content |
|-----|---------|
| **For You** | Personalised mix — followed users + algorithmically suggested |
| **Activities** | All workout/movement posts |
| **Restaurants** | Dine-in reviews with macros + tips |
| **Meal Prep** | Batch cooking, recipes, home-cooked posts |
| **Grab Food** | Delivery and takeaway orders |
| **Supermarket Hacks** | Budget grocery finds, value scores |
| **Saved** | User's bookmarked posts |

### Discovery Features

- Trending hashtag chips at top of For You feed (tap to filter)
- Grid view toggle (Instagram-style 3-col grid vs card list)
- Search: users, restaurants, food items, hashtags
- Explore map — pins of restaurant/delivery posts near user's location
- Weekly "Community Picks" curated highlights pushed as notification

### Post Interactions

- ❤️ Like, 💬 Comment, 🔖 Save, 📤 Share (copy link / WhatsApp / IG story)
- 📋 Copy — import macros / recipe / workout directly into the user's own app data
- 🗺 Try This — for restaurant posts, jumps to Plan screen pre-filtered to that restaurant
- ⚠️ Flag inaccurate macros — triggers community verification flow

---

## 3. Community Data & Macro Verification

- Any food/meal post can be flagged as "macro verified" by other users
- Threshold (e.g. 50+ verifications) triggers a **Verified badge** on the post
- Corrections accumulate into the shared food database — crowd-sourced accuracy improvement
- Leaderboard of top verifiers (gamification)
- "Accuracy score" visible on each post: ✅ 94% accurate (312 users)

---

## 4. User Profiles & Social Graph

- Profile: avatar, bio, goal badge (Weight Loss / Muscle Gain / Maintenance), streak counter
- Stats: posts, followers, following, total workouts logged, total meals logged
- Follow system — following feed vs global explore
- Verified badge for trainers, nutritionists (manual approval process)
- Privacy controls: public / followers only / private per-post

---

## 5. Plan Screen Enhancements

### Restaurant Recommendations (current: basic, to enhance)

- Live proximity using device GPS — "Within 2 km" filter
- Open now filter (requires opening hours API)
- Delivery integration — if restaurant is on GrabFood/Deliveroo, show estimated delivery time + fee
- Geofencing trigger — notification when user is near a recommended restaurant
- Price range filter ($ / $$ / $$$)
- Dietary filter inheritance from user profile (vegan, gluten-free, halal, etc.)

### Grab & Go / Supermarket Section

- Barcode scan to add any product from a supermarket directly to the plan
- Price comparison across nearby stores (Fairprice vs Cold Storage vs 7-Eleven)
- "Best value protein" auto-ranking — sorts by protein per dollar
- Offline cache — works without internet for previously viewed products

### Meal Suggestions

- Recipe mode — suggests home-cook options from a recipe database
- Budget mode — filters suggestions to stay within a weekly spend target
- Leftover mode — user inputs what's in their fridge, app suggests meals
- Macro gap fill — if user is low on protein at 8pm, suggest a high-protein evening snack

---

## 6. AI & Smart Features

### Food Logging

- Photo scan → macro estimate (on-device ML or server API)
- Barcode scan → instant product lookup (Open Food Facts / USDA)
- Voice log — "I just ate 2 eggs and a slice of toast"
- Plate size estimation — AI adjusts portion weight based on plate/hand scale reference
- Restaurant menu photo scan — extract dish names and auto-look up macros

### Personalisation

- Adaptive calorie targets — adjusts daily goal based on actual logged activity
- Meal timing recommendations — when to eat around workouts
- Weekly macro report with trend charts and plain-language commentary
- Goal milestone projections — "At this rate, you'll hit your goal in ~8 weeks"

---

## 7. Integrations

| Integration | Use Case |
|-------------|---------|
| Apple Health / Google Fit | Sync steps, heart rate, workouts, weight |
| Strava / Garmin / Wahoo | Import runs, rides with full GPS data |
| GrabFood / Foodpanda / Deliveroo | Pull order history for auto-logging |
| Supermarket loyalty apps | Import receipt data for macro logging |
| Cronometer / MyFitnessPal | Migration import |
| Barcode databases (Open Food Facts, USDA) | Product lookup |
| Google Maps / Apple Maps | Restaurant proximity, directions |

---

## 8. Gamification & Retention

- **Streaks** — daily log streak, workout streak, hydration streak
- **Badges** — First 5k, 30-day protein goal, Macro Master (hit all macros within 5% for a week), Community Top Contributor
- **Weekly challenges** — community-wide (e.g. "1,000 steps after every meal this week")
- **Progress photos** — private photo timeline linked to weight/measurement data
- **Friends leaderboard** — step count, workout frequency, macro consistency vs friends

---

## 9. Monetisation Ideas

- **Freemium** — basic logging free, AI features / advanced analytics behind paywall
- **Stride Pro** — unlimited AI food scans, full nutrition reports, recipe library, priority support
- **Creator programme** — verified fitness creators can monetise recipes/workout plans
- **Restaurant partnerships** — promoted placement in Plan recommendations (clearly labelled)
- **Supermarket partnerships** — sponsored products in Grab & Go section (clearly labelled)

---

## 10. Technical Architecture Considerations

- Move from single-file HTML demo to a proper frontend framework (React Native for mobile, Next.js for web)
- Backend: Node.js / Python API, PostgreSQL for user data, Redis for feed caching
- Food database: hybrid of USDA FoodData Central + Open Food Facts + community corrections
- Image hosting: CDN (Cloudflare R2 or AWS S3) for post photos
- Real-time feed: WebSockets or Server-Sent Events for live like/comment counts
- Offline-first: service worker caches food log and plan for offline access
- Privacy: GDPR/PDPA compliant, all location data opt-in, data export/delete on request
