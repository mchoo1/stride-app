# Stride mobile UI kit

Interactive iOS-sized recreation of the Stride app's five core tabs: **Home, Scan, Eat, Move, Me** — using the refreshed light palette, Anton display font, and custom icon set.

## Files
- `index.html` — clickable prototype. Tab bar cycles between screens; state persists in localStorage.
- `tokens.js` — exposes `window.S` (colors, type, shadow tokens).
- `ios-frame.jsx` — iOS 26 device frame starter.
- `Icons.jsx` — all Stride icons as React components (nav outline + fill, feature, utility).
- `Components.jsx` — shared: `Screen`, `Header`, `Card`, `PrimaryButton`, `GhostButton`, `QuickActionTile`, `ProgressBar`, `StatusChip`, `BottomNav`, `Avatar`, `SectionLabel`.
- `Home.jsx` — net-calorie hero, macro breakdown, recent food.
- `Scan.jsx` — camera viewfinder + recognised-food bottom sheet.
- `Eat.jsx` — remaining-kcal banner, restaurant + ready-to-eat cards.
- `Move.jsx` — stylised map with category pins, filter chips, place list.
- `Me.jsx` — 30-day weight sparkline, body stats, BMR/TDEE explainer.

## Notes
- No emoji. No streak / XP / water / social widgets. These were intentionally removed from the legacy dark build.
- Hero numerals use **Anton** (Google Fonts) with `font-variant-numeric: tabular-nums`.
- The map on the Move screen is a stylised SVG placeholder — plug in OneMap SG / Mapbox light style for production.
- Photography imagery is stubbed with neutral tiles; feed real hawker / HDB / park photos into the food thumbs and place cards.
