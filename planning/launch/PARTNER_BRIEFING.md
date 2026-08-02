# Stride — Partner Briefing
> **Last updated:** 2026-08-02
> Use this doc to onboard collaborators, developers, or agency partners cold.

---

## What is Stride?

**Stride is Singapore's macro food search engine** — and a comprehensive health tracker built around it.

Users search verified nutrition data across 30+ restaurant chains, hawker centres, and grab-and-go outlets, then find the best meals for their health goals before they order. Stride also tracks calories, weight, water, and activity — all personalised to the user's daily goal. Free.

**Live app:** https://stride-app-rosy.vercel.app
**Contact:** stride.singapore@gmail.com
**Company:** Fix Hero Pte. Ltd.

---

## The Core Angle — Eat Smart

Existing calorie trackers are built on US food databases. A Singapore user searching for "Chicken Rice" or "Zinger Burger" gets generic global approximations that don't reflect what they actually ordered.

Stride solves this by being Singapore-first: every item is a real SG menu item, sourced from official brand nutrition PDFs, with real local prices. Users don't change how they eat — they just eat smarter by knowing the numbers before they order.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Zustand |
| Backend | Next.js API routes, Firebase Admin SDK |
| Database | Firestore + custom SG food database (12,700+ lines) |
| Auth | Firebase Authentication (email/password + verification) |
| AI | Claude Haiku (food scan), USDA FoodData Central |
| Maps | Leaflet + Google Places API |
| Email | Resend API |
| Hosting | Vercel — auto-deploy on push to main |

**Repo:** `C:\stride-app` · **Vercel root dir:** `app/`

---

## What's Built (August 2026)

### Food Search Engine (primary feature)
- 1,000+ SG-verified food items across 30+ restaurant chains, 6 hawker centres, 6 grab-and-go chains
- Filter by calories, protein, price, dietary need simultaneously
- Confidence badges: Stride Approved / Community / Estimated
- Diet fit badges per item based on user's dietary flags

### Tracking
- Calories & macros — daily rings, real-time progress
- AI food scan — camera → Claude Haiku → USDA → one-tap log
- Weight — 30-day trend chart, auto-recalculates macro targets
- Water — quick-add buttons, hydration ring
- Activity — MET-based calorie estimates

### Platform
- 5-step onboarding with TDEE/macro auto-calculation
- PDPA-compliant consent flow
- Firebase Auth with email verification
- Daily streaks (SGT timezone-aware)
- Partner portal — restaurants/gyms can apply to list
- Email notifications via Resend: feedback, partner applications, admin alerts

---

## Key Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Full developer handoff — read this first |
| `planning/README.md` | Planning folder index |
| `planning/strategy/stride-app-brief.md` | Product positioning and full brief |
| `planning/product/goals.md` | Product goals and success metrics |
| `planning/product/enhancements.md` | Future feature ideas |
| `planning/roadmap/stride-product-spec.md` | Screen specs and full roadmap |
| `app/src/lib/sgFoodDb.ts` | SG food database (~12,700 lines) |
| `app/src/lib/store.ts` | Zustand state management |
| `app/src/lib/apiClient.ts` | Typed API client — use this, never raw fetch |

---

## Food Database Rules

When adding food data:
- Source from brand's official SG nutrition PDF → `source: 'official_sg'`, `verified: true`
- HPB Nutrition Information Centre → `source: 'hpb'`, `verified: true`
- Community estimates → `source: 'community'`, `verified: false`
- Always set `lastVerified: 'YYYY-MM-DD'`
- Prices verified against GrabFood or official SG website

---

## Env Vars Required

```env
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY          # include -----BEGIN/END PRIVATE KEY----- lines
ANTHROPIC_API_KEY             # Claude Haiku for food scan
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
USDA_API_KEY                  # DEMO_KEY works for dev
RESEND_API_KEY                # Email notifications
ADMIN_NOTIFY_TOKEN            # Shared secret for /api/admin/notify endpoint
```

---

## Git Workflow

Always run as one block:
```bash
cd "C:\stride-app"
git pull
git add -A
git commit -m "short description"
git push
```

---

## Outstanding Priorities

### High
- Expand hawker centre and restaurant database coverage
- Add barcode scan (Open Food Facts API)
- Community food submission flow with verification

### Medium
- Wearable sync (Apple HealthKit / Google Fit)
- GrabFood / Foodpanda macro lookup integration
- SEO — landing page optimisation for Singapore food calories keywords

### Phase 2
- Social feed, community macro verification, delivery deep-links

---

*Full developer detail: `CLAUDE.md` · Changes log: `CHANGELOG.md`*
