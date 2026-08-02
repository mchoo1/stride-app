# Stride — App Brief
> **Last updated:** 2026-08-02 | **Version:** 3.0
> **Live:** https://stride-app-rosy.vercel.app · **Company:** Fix Hero Pte. Ltd.

---

## What is Stride?

Stride is **Singapore's macro food search engine** — and a comprehensive health tracker built around it.

The core product is a searchable database of verified Singapore nutrition data: real menu items from real SG restaurants, hawker centres, and grab-and-go chains, with verified local pricing and macros. Users search by calories, protein, carbs, fat, price, or dietary need — and find exactly what to eat before they order.

On top of the food search engine, Stride lets users track calories, weight, water, and activity in one free app — all personalised to their goal.

---

## Core Mission

Help Singapore residents make smarter food choices by giving them the nutrition data they need, before they eat — and making it effortless to track the rest.

---

## The Problem We Solve

Existing calorie trackers are built on US food databases. A Singapore user searching for "Chicken Rice" or "Zinger Burger" gets generic global approximations that don't reflect what they actually ordered at their local hawker or KFC outlet.

Stride solves this by being **Singapore-first**: every item is a real SG menu item, sourced from official brand nutrition PDFs or verified SG nutrition sources, with real local prices.

---

## Product Pillars

| Pillar | Description |
|--------|-------------|
| **Eat Smart** | Search verified macros at 30+ SG restaurants, hawker centres, and grab-and-go chains. Find the best meals for your goals before you order. |
| **Track** | Log calories, macros, and meals. Daily macro rings and calorie progress update in real time. |
| **Monitor** | Track weight, water, and activity. 30-day trend charts. Targets auto-recalculate as you progress. |
| **Move** | Discover nearby gyms, parks, and fitness venues. Log workouts with MET-based calorie estimates. |
| **Connect** *(Phase 2)* | Share meals, workouts, and restaurant finds. Community macro verification. |
| **Marketplace** *(Phase 3)* | Book fitness classes, PT sessions, and nutritionist consultations in-app. |

---

## Target Users

Singapore residents aged 18–35 who are health-conscious but eat out regularly. The core user goes to the gym or watches their diet, but finds existing apps useless because they don't know what their actual SG hawker dish or fast food order contains.

**Primary segments:**
- Gym-goers and fitness enthusiasts tracking protein intake
- Weight management users counting calories without a strict diet plan
- Health-conscious young professionals eating out daily at hawker centres and fast food chains
- Anyone frustrated that existing apps don't have real Singapore food data

---

## What's Built (August 2026)

### Food Search Engine
- 1,000+ SG-verified food items across 30+ restaurant chains, 6 hawker centres, 6 grab-and-go chains
- Search by name, macro targets, price, and dietary filters simultaneously
- Every item sourced from official SG nutrition PDFs or verified local sources

### Eat Smart
- Restaurant discovery with Leaflet map and Google Places API
- Full menus with SG pricing, calories, protein, carbs, fat per item
- Diet fit badges (great/check/warn) and confidence badges (Stride Approved / Community / Estimated)
- Filter and sort by calories, protein, price, and dietary need
- One-tap meal logging from search results

### Tracker
- **Calories & Macros** — daily rings, macro bars, real-time progress
- **AI Food Scan** — camera → Claude Haiku vision → USDA lookup → log in one tap
- **Weight** — 30-day trend chart, auto-recalculates macro targets on update
- **Water** — quick-add ml buttons, daily hydration ring
- **Activity** — MET-based calorie estimates, 50+ activity types

### Personalisation
- 5-step onboarding: goal → body stats → activity level → dietary flags → macro targets
- TDEE calculated via Mifflin-St Jeor
- Goals: Weight Loss (TDEE −500 kcal), Muscle Gain (TDEE +300 kcal), Maintenance
- Daily calorie and macro targets recalculate when weight is updated

### Engagement
- Daily streak system (SGT timezone-aware)
- Daily challenge cards on dashboard
- Personalised meal recommendations based on remaining macros

### Platform
- Firebase Authentication (email/password + email verification)
- PDPA-compliant consent flow at registration
- Real account deletion (Firebase Auth + Firestore)
- Partner portal — restaurants and gyms can apply to list

---

## Roadmap

### Phase 2 — Growth
- Barcode scan (Open Food Facts API)
- Community food submissions with macro verification and confidence scoring
- Social feed — share meals, workouts, restaurant finds with macros attached
- Wearable sync — Apple HealthKit and Google Fit
- GrabFood and Foodpanda macro lookup before you order
- Hawker centre data expansion — more stalls, more dishes

### Phase 3 — Monetisation
- Stride Pro — unlimited AI scans, advanced analytics, custom meal plans
- Promoted restaurant partner listings (clearly labelled)
- PT and nutritionist booking in-app
- Affiliate commissions on GrabFood / Deliveroo deep-links

### Long-term — Activities & Movement
- Fitness class discovery and booking (yoga, HIIT, Pilates, spin, boxing)
- Sports and group activity logging (running, swimming, cycling, 50+ types)
- Gym finder with amenities, peak hours, and direct membership sign-up
- Structured workout library (filter by goal, equipment, duration)
- Personal trainer and nutritionist marketplace
- Wearable sync for automatic activity import
- Community activity feed

---

## Key Differentiators

1. **Singapore-first data** — real SG menu items, real local prices, official nutrition sources
2. **Search by nutrition** — filter by macro targets, not just food name
3. **One app** — food search + calorie tracker + weight + water + activity, all free
4. **Personalised** — every result ranked against your remaining macros for the day
5. **Built for how SG people eat** — hawker centres, fast food, grab-and-go

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Zustand |
| Backend | Next.js API routes, Firebase Admin SDK |
| Database | Firestore (user data), custom SG food database (12,700+ lines) |
| Auth | Firebase Authentication — email/password |
| AI | Claude Haiku (food scan vision), USDA FoodData Central |
| Maps | Leaflet + Google Places API |
| Email | Resend API |
| Hosting | Vercel (auto-deploy on push to main) |

---

*Full developer reference: `CLAUDE.md` · Session changes: `CHANGELOG.md`*
