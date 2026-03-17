# Stride 🏃 — Web Frontend

A Next.js 14 fitness tracking web app. Tracks calories, macros, water, and activity — fully local (no backend required).

---

## Quick Start

### Prerequisites

- **Node.js 18+** — check with `node -v`. Download from [nodejs.org](https://nodejs.org) if needed.

### 1. Install dependencies

```bash
cd "Fitness App/stride-web"
npm install
```

This takes ~1–2 minutes the first time.

### 2. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## What you'll see

| Route | Screen |
|---|---|
| `/` | Landing page (marketing) |
| `/onboarding` | 4-step setup wizard |
| `/dashboard` | Calorie ring, macros, water, quick actions |
| `/log/food` | Log meals by category (breakfast / lunch / dinner / snack) |
| `/log/activity` | Log workouts — browse presets, AI estimate, or manual |
| `/scan` | Mock AI food photo scan |
| `/recommendations` | Personalised daily tips |
| `/profile` | Edit goals, dietary prefs, and targets |

All data is saved to **localStorage** in your browser — no account or internet connection needed.

---

## Project Structure

```
stride-web/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── layout.tsx                  # Root layout + fonts
│   │   ├── globals.css                 # Design tokens + component classes
│   │   ├── onboarding/page.tsx         # 4-step onboarding
│   │   └── (dashboard)/
│   │       ├── layout.tsx              # Auth guard + bottom nav
│   │       ├── dashboard/page.tsx      # Home dashboard
│   │       ├── log/food/page.tsx       # Food log
│   │       ├── log/activity/page.tsx   # Activity log
│   │       ├── scan/page.tsx           # AI food scan (mock)
│   │       ├── recommendations/page.tsx# Daily tips
│   │       └── profile/page.tsx        # Profile & settings
│   ├── components/
│   │   └── layout/BottomNav.tsx        # Bottom navigation bar
│   ├── lib/
│   │   ├── store.ts                    # Zustand state (persisted)
│   │   ├── utils.ts                    # Calorie calc, helpers
│   │   ├── mockFoods.ts                # 30 foods + activity presets
│   │   └── recommendations.ts          # Rule-based tip engine
│   └── types/index.ts                  # TypeScript types
├── tailwind.config.ts                  # Brand colours + animations
├── next.config.js
├── tsconfig.json
└── package.json
```

---

## Build for production

```bash
npm run build
npm start
```

Or deploy to Vercel in one command:

```bash
npx vercel
```

---

## Next steps (Phase 2)

- [ ] Connect **Supabase** for cloud sync and auth (replace localStorage store)
- [ ] Swap mock food data for **Open Food Facts API**
- [ ] Replace mock scan with real **OpenAI GPT-4o vision** call
- [ ] Add **barcode scanner** (QuaggaJS or ZXing)
- [ ] Convert to **React Native** with Expo for iOS/Android
- [ ] Add **Apple Health / Google Fit** integration
