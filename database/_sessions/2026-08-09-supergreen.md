# Session Report — Supergreen (Grab & Go / Healthy Bowls track)

**Date:** 2026-08-09
**Track:** Grab & Go — Healthy Quick-Service Salad/Grain Bowls
**Outlet:** Supergreen (supergreen.sg) — build-your-own & signature salad bowl chain, 20+ outlets islandwide (The Star Vista, Marina One, Frasers Tower, Raffles Place, SMU Connexion, Suntec City, etc.)
**Tier achieved:** T1 (official_sg)
**Items added:** 14
**Approval required:** 0 (all items T1, ready to upload)

## Anti-duplication check

- Checked `database/_index.json`: no existing entry for `supergreen`.
- Checked all `id:` values in `app/src/lib/sgFoodDb.ts`: no existing `supergreen` outlet or `supergreen_*` items.
- Checked `database/restaurants/` and `database/grab-and-go/`: no existing Supergreen JSON file.
- Note: while researching this session I discovered that two outlets I initially considered as candidates — **Don Don Donki** (`don_don_donki`) and **Sheng Siong** (`sheng_siong`) — already have menu items live in `sgFoodDb.ts` (added 2026-08-07, 7 and 3 items respectively) despite having no corresponding `_index.json` entries. Flagging this gap: `_index.json` should be updated to reflect those two outlets as `in_app` so future sessions don't re-attempt them. No changes made to either outlet this session.

## Source

Supergreen publishes an official **"Nutritional & Allergen Information"** PDF (Signature Bowls + Build Your Own components), linked directly from the site nav (Menu → Nutrition and Allergen Info) and from the FAQ page. The version fetched this session is dated **Jul 2026** (most current) and its Signature Bowl figures match the calorie/protein numbers published live on supergreen.sg/menu, cross-confirming accuracy:

- PDF: `https://www.supergreen.sg/_files/ugd/8c8601_522a18ba53d449058d2536eafbd76ba2.pdf` (Jul 2026 — used for this session)
- Live menu page: `https://www.supergreen.sg/menu`
- FAQ (halal/allergen policy): `https://www.supergreen.sg/faq`

Per Supergreen's FAQ: **not halal-certified** (meat sourced from halal-certified suppliers, no pork/lard/alcohol used in-store) — outlet-level halal tag NOT applied per task rules (certification required, not just supplier sourcing). Per-item allergen checkboxes in the PDF table did not extract cleanly as structured booleans (columns present but tick-marks not machine-readable from this fetch), so `vegetarian`/`vegan`/`lactose_free` tags were only applied where clearly supported by the dish name + ingredient list (e.g. "Vegan Power Bowl"), consistent with the conservative-tagging rule for anything not 100% confirmed.

## Ready to Upload (T1 — official_sg, no admin approval needed)

### Signature Bowls (7)

| Item | Price | Calories | Protein | Carbs | Fat | Tags |
|---|---|---|---|---|---|---|
| Grilled Salmon Bowl | $15.30 | 484 | 39g | 19g | 28g | high_protein |
| Yakiniku Beef Bowl | $13.80 | 833 | 48g | 50g | 49g | high_protein |
| Teriyaki Chicken Bowl | $12.30 | 482 | 31g | 31g | 26g | high_protein |
| Lean Chicken Bowl | $12.30 | 397 | 47g | 14g | 17g | high_protein |
| Mala Prawn Bowl | $13.80 | 322 | 22g | 36g | 10g | low_fat |
| Smoked Duck Bowl | $12.30 | 437 | 32g | 21g | 25g | high_protein |
| Vegan Power Bowl | $12.30 | 356 | 17g | 54g | 8g | low_fat, vegan, vegetarian |

### Build Your Own — Add-on Proteins (7)

Listed separately since users frequently customise bowls; each priced at the menu's stated add-on premium (or "included" if no upcharge is listed for a first protein choice).

| Item | Serving | Calories | Protein | Carbs | Fat | Tags |
|---|---|---|---|---|---|---|
| Teriyaki Chicken (Add-on) | 100g | 208 | 18g | 7g | 12g | keto |
| Roasted Smoked Duck (Add-on) | 80g | 158 | 15g | 2g | 10g | keto, low_fat |
| Rosemary Sous Vide Chicken (Add-on) | 80g | 109 | 22g | 3g | 1g | keto, low_fat |
| Yakiniku Beef (Add-on, +$1.50) | 80g | 284 | 17g | 9g | 20g | keto |
| Oven-Baked Salmon (Add-on, +$3.00) | 100g | 209 | 23g | 0g | 13g | keto |
| Sichuan Mala Prawn (Add-on, +$1.50) | 65g | 113 | 15g | 2g | 5g | keto, low_fat |
| Black Pepper Chicken (Add-on) | 100g | 232 | 18g | 13g | 12g | — |

## Needs Admin Approval

None this session — all 14 items sourced directly from Supergreen's official nutrition PDF.

## Skipped (left for a future session)

- Salad Dressings (7 dressings, e.g. Japanese Roasted Sesame, Honey Lime, Spicy Mayo) — full macros are published in the same PDF but were left out this session to avoid diluting the outlet with low-differentiation condiment entries; a future session could add these under a `Dressings` category if desired.
- Bases (Romaine Lettuce, Brown Rice, Fusilli Pasta, Soba Noodle) and Cold/Hot Toppings — also fully macro'd in the PDF, same reasoning as above (component ingredients rather than standalone purchasable items).

## TypeScript snippet — append to `SG_GRAB_AND_GO` array in `app/src/lib/sgFoodDb.ts`

```ts
{
  id: 'supergreen',
  name: 'Supergreen',
  emoji: '🥗',
  cuisine: 'Healthy Salads & Grain Bowls',
  outletType: 'grab_go',
  serviceTypes: ['dine_in', 'grab_go', 'delivery'],
  tier: 'full_menu',
  priceRange: '$$',
  aliases: ['supergreen', 'super green', 'supergreen sg', 'supergreen salad'],
  dietTags: [],
  nutritionUrl: 'https://www.supergreen.sg/_files/ugd/8c8601_522a18ba53d449058d2536eafbd76ba2.pdf',
  lastUpdated: '2026-08-09',
  menu: [
    { id: 'supergreen_grilled_salmon_bowl',   name: 'Grilled Salmon Bowl',              emoji: '🐟', price: 15.30, calories: 484, protein: 39, carbs: 19, fat: 28, category: 'Signature Bowls', source: 'official_sg', confidence: 'verified', verified: true, compatibleWith: ['high_protein'], isPopular: true,  lastVerified: '2026-08-09' },
    { id: 'supergreen_yakiniku_beef_bowl',    name: 'Yakiniku Beef Bowl',               emoji: '🥩', price: 13.80, calories: 833, protein: 48, carbs: 50, fat: 49, category: 'Signature Bowls', source: 'official_sg', confidence: 'verified', verified: true, compatibleWith: ['high_protein'], isPopular: true,  lastVerified: '2026-08-09' },
    { id: 'supergreen_teriyaki_chicken_bowl', name: 'Teriyaki Chicken Bowl',            emoji: '🍗', price: 12.30, calories: 482, protein: 31, carbs: 31, fat: 26, category: 'Signature Bowls', source: 'official_sg', confidence: 'verified', verified: true, compatibleWith: ['high_protein'], isPopular: true,  lastVerified: '2026-08-09' },
    { id: 'supergreen_lean_chicken_bowl',     name: 'Lean Chicken Bowl',                emoji: '🍗', price: 12.30, calories: 397, protein: 47, carbs: 14, fat: 17, category: 'Signature Bowls', source: 'official_sg', confidence: 'verified', verified: true, compatibleWith: ['high_protein'], isPopular: true,  lastVerified: '2026-08-09' },
    { id: 'supergreen_mala_prawn_bowl',       name: 'Mala Prawn Bowl',                  emoji: '🦐', price: 13.80, calories: 322, protein: 22, carbs: 36, fat: 10, category: 'Signature Bowls', source: 'official_sg', confidence: 'verified', verified: true, compatibleWith: ['low_fat'], isPopular: false, lastVerified: '2026-08-09' },
    { id: 'supergreen_smoked_duck_bowl',      name: 'Smoked Duck Bowl',                 emoji: '🦆', price: 12.30, calories: 437, protein: 32, carbs: 21, fat: 25, category: 'Signature Bowls', source: 'official_sg', confidence: 'verified', verified: true, compatibleWith: ['high_protein'], isPopular: false, lastVerified: '2026-08-09' },
    { id: 'supergreen_vegan_power_bowl',      name: 'Vegan Power Bowl',                 emoji: '🌱', price: 12.30, calories: 356, protein: 17, carbs: 54, fat: 8,  category: 'Signature Bowls', source: 'official_sg', confidence: 'verified', verified: true, compatibleWith: ['low_fat', 'vegan', 'vegetarian'], isPopular: false, lastVerified: '2026-08-09' },
    { id: 'supergreen_add_teriyaki_chicken',  name: 'Teriyaki Chicken (Add-on)',        emoji: '🍗', price: 0.00, calories: 208, protein: 18, carbs: 7,  fat: 12, category: 'Build Your Own — Proteins', source: 'official_sg', confidence: 'verified', verified: true, compatibleWith: ['keto'], isPopular: false, lastVerified: '2026-08-09' },
    { id: 'supergreen_add_smoked_duck',       name: 'Roasted Smoked Duck (Add-on)',     emoji: '🦆', price: 0.00, calories: 158, protein: 15, carbs: 2,  fat: 10, category: 'Build Your Own — Proteins', source: 'official_sg', confidence: 'verified', verified: true, compatibleWith: ['keto', 'low_fat'], isPopular: false, lastVerified: '2026-08-09' },
    { id: 'supergreen_add_rosemary_chicken',  name: 'Rosemary Sous Vide Chicken (Add-on)', emoji: '🍗', price: 0.00, calories: 109, protein: 22, carbs: 3, fat: 1,  category: 'Build Your Own — Proteins', source: 'official_sg', confidence: 'verified', verified: true, compatibleWith: ['keto', 'low_fat'], isPopular: false, lastVerified: '2026-08-09' },
    { id: 'supergreen_add_yakiniku_beef',     name: 'Yakiniku Beef (Add-on)',           emoji: '🥩', price: 1.50, calories: 284, protein: 17, carbs: 9,  fat: 20, category: 'Build Your Own — Proteins', source: 'official_sg', confidence: 'verified', verified: true, compatibleWith: ['keto'], isPopular: false, lastVerified: '2026-08-09' },
    { id: 'supergreen_add_salmon',            name: 'Oven-Baked Salmon (Add-on)',       emoji: '🐟', price: 3.00, calories: 209, protein: 23, carbs: 0,  fat: 13, category: 'Build Your Own — Proteins', source: 'official_sg', confidence: 'verified', verified: true, compatibleWith: ['keto'], isPopular: false, lastVerified: '2026-08-09' },
    { id: 'supergreen_add_mala_prawn',        name: 'Sichuan Mala Prawn (Add-on)',      emoji: '🦐', price: 1.50, calories: 113, protein: 15, carbs: 2,  fat: 5,  category: 'Build Your Own — Proteins', source: 'official_sg', confidence: 'verified', verified: true, compatibleWith: ['keto', 'low_fat'], isPopular: false, lastVerified: '2026-08-09' },
    { id: 'supergreen_add_black_pepper_chicken', name: 'Black Pepper Chicken (Add-on)', emoji: '🍗', price: 0.00, calories: 232, protein: 18, carbs: 13, fat: 12, category: 'Build Your Own — Proteins', source: 'official_sg', confidence: 'verified', verified: true, compatibleWith: [], isPopular: false, lastVerified: '2026-08-09' },
  ],
},
```
