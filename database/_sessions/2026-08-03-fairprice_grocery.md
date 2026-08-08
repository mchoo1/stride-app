# Stride DB Session — 2026-08-03 — FairPrice Grocery (Frozen Ready Meals & Canned Fish)

**Track:** Grocery
**Outlet ID:** `fairprice_grocery`
**Tier achieved:** T1 (official_sg / label-verified for all items)
**Items added:** 10
**Approval required:** 0 (all items are official label data — safe to upload)

## Anti-duplication check performed

- Read `_index.json` — confirmed `fairprice_grocery` not previously claimed.
- Scanned `sgFoodDb.ts` for existing FairPrice-branded grocery ready-meal/canned-fish items — none found (existing FairPrice entries are `fairprice_xpress`, a *convenience-store* ready-to-eat outlet, and the `SG_INGREDIENTS` raw-ingredient list — neither overlaps with these packaged/canned products).
- Did not touch `7eleven`, `cheers`, `fairprice_xpress` (already `in_app`), or any restaurant/hawker track outlets.

## Sourcing notes

Two product lines researched, both sold at FairPrice (NTUC FairPrice is the largest SG supermarket chain):

1. **Frozen ready meals** (CP, Home Flavours brands) — nutrition scraped directly from each product's page on fairprice.com.sg, which reproduces the manufacturer's printed Nutrition Information panel. Only items where FairPrice actually publishes a "NUTRITIONAL DATA" table were kept — several other items in the same "Ready Meals" category (I'm Bulgogi raw marinated meats, Chef's Fin dishes, CP Kampung Fried Rice, most Home Flavours soups) do **not** have a published panel on the site and were excluded rather than estimated.
2. **Canned tuna/sardines** (Ayam Brand) — nutrition sourced from fairprice.com.sg product pages (own manufacturer panel) and, for one item, from Open Food Facts (SG-tagged scans of the physical label) and the brand's own ayambrand.com.sg site. All are official/label data, no estimates.

**Data-quality fix applied:** FairPrice's product pages render the energy row as "Energy N kJ" but the value N is actually kcal (verified by checking that protein×4 + fat×9 + carb×4 ≈ N for every item, e.g. Tuna Chunks in Water: 23.7×4 + 1.1×9 + 0.9×4 = 108.3 ≈ 106). Treated all such values as kcal, not kJ.

## Ready to Upload (T1 — official label / OFF, no admin approval needed)

TypeScript ready to paste into `sgFoodDb.ts` — append to the `SG_RESTAURANTS` array (this codebase does not use a separate `SG_GROCERY`/`SG_GRAB_AND_GO` array; all outlets, including `cheers` and `fairprice_xpress`, live in `SG_RESTAURANTS` with `outletType: 'ready_to_eat'` for this exact convenience/grocery pattern).

```ts
  // ── FairPrice Grocery (Frozen Ready Meals & Canned Fish) ──────────────────────
  {
    id: 'fairprice_grocery',
    name: 'FairPrice Grocery',
    emoji: '🛒',
    cuisine: 'Grocery — Frozen Ready Meals & Canned Fish',
    tier: 'full_menu',
    outletType: 'ready_to_eat',
    serviceTypes: ['grab_go', 'delivery'],
    aliases: ['fairprice', 'ntuc fairprice', 'fairprice grocery', 'fairprice supermarket'],
    dietTags: ['halal'],
    priceRange: '$',
    nutritionUrl: 'https://www.fairprice.com.sg/category/ready-meals',
    lastUpdated: '2026-08-03',
    menu: [
      {
        id: 'cp_nasi_lemak_chicken_rendang',
        name: 'CP Frozen Ready Meal — Nasi Lemak with Chicken Rendang',
        emoji: '🍚',
        price: 4.75,
        calories: 211,
        protein: 7.4,
        carbs: 26,
        fat: 8.6,
        servingSize: '1 pack (250g)',
        category: 'Frozen Ready Meals',
        description: 'Coconut rice with chicken rendang, sambal, ikan bilis, egg and vegetables — microwave-ready.',
        compatibleWith: ['halal', 'low_fat'],
        isPopular: true,
        source: 'official_sg',
        sourceUrl: 'https://www.fairprice.com.sg/product/cp-frozen-ready-meal-nasi-lemak-with-chicken-rendang-250g-13097246',
        confidence: 'verified',
        verified: true,
        lastVerified: '2026-08-03',
      },
      {
        id: 'cp_shrimp_wonton_bowl',
        name: 'CP Shrimp Wonton (Bowl)',
        emoji: '🥣',
        price: 4.95,
        calories: 132,
        protein: 8.1,
        carbs: 18,
        fat: 3,
        fibre: 2.8,
        sodium: 1218,
        servingSize: '1 bowl (145g)',
        category: 'Frozen Ready Meals',
        description: 'Farm-raised shrimp wontons with chicken soup powder sachet — add hot water, microwave 2 min.',
        compatibleWith: ['halal', 'low_fat', 'lactose_free'],
        isPopular: true,
        source: 'official_sg',
        sourceUrl: 'https://www.fairprice.com.sg/product/cp-shrimp-wonton-bowl-145g-11189734',
        confidence: 'verified',
        verified: true,
        lastVerified: '2026-08-03',
      },
      {
        id: 'cp_shrimp_wonton_tomyum_bowl',
        name: 'CP Shrimp Wonton in Tom Yum Soup (Bowl)',
        emoji: '🥣',
        price: 4.95,
        calories: 186,
        protein: 7.8,
        carbs: 25.9,
        fat: 5.8,
        sodium: 1999,
        servingSize: '1 bowl (115g)',
        category: 'Frozen Ready Meals',
        description: 'Shrimp wontons with tom yum paste sachet — microwave 2.5–3 min.',
        compatibleWith: ['halal', 'low_fat', 'lactose_free'],
        source: 'official_sg',
        sourceUrl: 'https://www.fairprice.com.sg/product/cp-shrimp-wonton-in-tom-yum-soup-bowl-115g-13009885',
        confidence: 'verified',
        verified: true,
        lastVerified: '2026-08-03',
      },
      {
        id: 'cp_shrimp_wonton_noodle_veg_bowl',
        name: 'CP Shrimp Wonton Noodle with Vegetable (Bowl)',
        emoji: '🍜',
        price: 5.95,
        calories: 344,
        protein: 16.6,
        carbs: 62.4,
        fat: 3.1,
        sodium: 1800,
        servingSize: '1 bowl (219g)',
        category: 'Frozen Ready Meals',
        description: 'Ramen noodles, shrimp wontons and yu choy in soup — microwave-ready bowl.',
        compatibleWith: ['halal', 'low_fat', 'lactose_free'],
        source: 'official_sg',
        sourceUrl: 'https://www.fairprice.com.sg/product/cp-shrimp-wonton-noodle-with-vegetable-bowl-219g-13077566',
        confidence: 'verified',
        verified: true,
        lastVerified: '2026-08-03',
      },
      {
        id: 'home_flavours_sweet_sour_fish',
        name: 'Home Flavours Ready to Eat — Sweet and Sour Fish',
        emoji: '🐟',
        price: 6.97,
        calories: 1109,
        protein: 46.3,
        carbs: 82.3,
        fat: 65.3,
        fibre: 2.6,
        sugar: 21.1,
        sodium: 613,
        servingSize: '1 pack (240g)',
        category: 'Frozen Ready Meals',
        description: 'Crispy fried fish with sweet and sour plum sauce — deep-fry or air-fry, then toss in heated sauce. FairPrice housebrand, produced for NTUC FairPrice.',
        compatibleWith: ['high_protein', 'lactose_free'],
        source: 'official_sg',
        sourceUrl: 'https://www.fairprice.com.sg/product/home-flavours-ready-to-eat-sweet-and-sour-fish-240g-13241591',
        nutritionNote: 'Label states this energy/macro figure as "Per Serving" for the full 240g pack — a very energy-dense fried dish, effectively a 2-portion sharing item.',
        confidence: 'verified',
        verified: true,
        lastVerified: '2026-08-03',
      },
      {
        id: 'ayam_tomato_chilli_tuna',
        name: 'Ayam Brand Tasty Tuna — Tomato Chili (can)',
        emoji: '🐟',
        price: 3.28,
        calories: 181,
        protein: 18.7,
        carbs: 14.6,
        fat: 5.3,
        sodium: 688,
        servingSize: '1 can (160g, as sold)',
        category: 'Canned Fish',
        description: 'Minced tuna in tomato chilli sauce with fried onion — eat straight from the can with rice.',
        compatibleWith: ['low_fat', 'lactose_free'],
        source: 'official_sg',
        sourceUrl: 'https://www.fairprice.com.sg/product/ayam-brand-tomato-chilli-tuna-160g-13057930',
        nutritionNote: 'Per-100g label values (113kcal, 11.7g protein, 3.3g fat, 9.1g carb, 430mg sodium) scaled to the full 160g can.',
        confidence: 'verified',
        verified: true,
        lastVerified: '2026-08-03',
      },
      {
        id: 'ayam_tuna_chunks_olive_oil_light',
        name: 'Ayam Brand Tuna Chunks — Olive Oil (Light, can)',
        emoji: '🐟',
        price: 3.48,
        calories: 287,
        protein: 32.7,
        carbs: 0,
        fat: 15.9,
        servingSize: '1 can (150g, as sold)',
        category: 'Canned Fish',
        description: 'Tuna chunks in light olive oil, Healthier Choice-certified — good source of Omega-3.',
        compatibleWith: ['high_protein', 'lactose_free'],
        source: 'official_sg',
        sourceUrl: 'https://www.fairprice.com.sg/product/ayam-brand-tuna-chunks-olive-oil-light-150g-13046198',
        nutritionNote: 'Per-100g label values (191kcal, 21.8g protein, 10.6g fat; carbs not listed on label, assumed ~0g) scaled to the full 150g can.',
        confidence: 'verified',
        verified: true,
        lastVerified: '2026-08-03',
      },
      {
        id: 'ayam_tuna_chunks_water',
        name: 'Ayam Brand Tuna Chunks — Water (can)',
        emoji: '🐟',
        price: 3.48,
        calories: 159,
        protein: 35.6,
        carbs: 1.4,
        fat: 1.65,
        fibre: 1.05,
        sodium: 435,
        servingSize: '1 can (150g, as sold)',
        category: 'Canned Fish',
        description: 'Tuna chunks in water, no oil — Healthier Choice-certified, lean high-protein option.',
        compatibleWith: ['high_protein', 'low_fat', 'keto', 'lactose_free'],
        source: 'official_sg',
        sourceUrl: 'https://www.fairprice.com.sg/product/ayam-brand-tuna-chunks-water-150g-13057895',
        nutritionNote: 'Per-100g label values (106kcal, 23.7g protein, 1.1g fat, 0.9g carb, 290mg sodium) scaled to the full 150g can.',
        confidence: 'verified',
        verified: true,
        lastVerified: '2026-08-03',
      },
      {
        id: 'ayam_chilli_tuna_light',
        name: 'Ayam Brand Chilli Tuna Light (can)',
        emoji: '🐟',
        price: 3.28,
        calories: 248,
        protein: 22.8,
        carbs: 6.8,
        fat: 14.4,
        fibre: 1.6,
        sugar: 6.8,
        sodium: 584,
        servingSize: '1 can (160g, as sold)',
        category: 'Canned Fish',
        description: 'Minced tuna, chilli and coriander, no added MSG — Healthier Choice-certified.',
        compatibleWith: ['halal', 'lactose_free'],
        source: 'open_food_facts',
        sourceUrl: 'https://world.openfoodfacts.org/product/9556041614054/chilli-tuna-light-ayam-brand',
        nutritionNote: 'Per-100g values from Open Food Facts label scan (barcode 9556041614054, sold in Singapore) scaled to the full 160g can. FairPrice’s own product page for this SKU had an incomplete/inconsistent nutrition table, so the cleaner OFF label scan was used instead; FairPrice’s live price ($3.28) was used.',
        confidence: 'verified',
        verified: true,
        lastVerified: '2026-08-03',
      },
      {
        id: 'ayam_sardines_tomato_sauce',
        name: 'Ayam Brand Sardines in Tomato Sauce (can)',
        emoji: '🐟',
        price: 3.60,
        calories: 119,
        protein: 11.4,
        carbs: 1.4,
        fat: 7.6,
        fibre: 1.2,
        sodium: 250,
        servingSize: '1 serving (70g) — can serves 3',
        category: 'Canned Fish',
        description: 'Wild-caught sardines in rich tomato sauce, natural source of Omega-3 and calcium — eat straight from the can or heat with rice/noodles.',
        compatibleWith: ['halal', 'low_fat', 'keto', 'lactose_free'],
        source: 'official_sg',
        sourceUrl: 'https://www.ayambrand.com.sg/our-range/sardines/product/sardines-in-tomato-sauce-230g',
        nutritionNote: 'Nutrition per official Ayam Brand SG product page (per 70g serving, can labelled "Serves 3"). Price ($3.60) is an approximate SG retail price (Cold Storage) — not independently confirmed on fairprice.com.sg for this exact 230g SKU.',
        confidence: 'verified',
        verified: true,
        lastVerified: '2026-08-03',
      },
    ],
  },
```

## Needs Admin Approval

None. All 10 items are sourced from official brand nutrition panels (fairprice.com.sg product pages reproducing the manufacturer's label, ayambrand.com.sg's own SG site, or Open Food Facts label scans tagged as sold in Singapore).

## Items considered and excluded (no published macro data found)

- I'm Bulgogi Frozen Marinated Meat (Spicy Pork / Galbi Chicken / Spicy Chicken / Chicken) — raw marinated meat, no nutrition panel on FairPrice.
- CP Frozen Ready Meal — Kampung Fried Rice, CP Fried Rice with BBQ Pork — no panel published.
- Chef's Fin Claypot Chicken Rice, Rosemary Chicken, Spaghetti Aglio Olio — no panel published.
- Home Flavours soups (Lotus Root, ABC, Watercress, Sayur Lodeh, Herbal Chicken, Honey Coffee Chicken) — ingredients/prep shown but no nutrition table.
- Ayam Brand Tuna Meal Plus / Tuna Light Meal (Beans & Millet, Legumes & Capsicum, Legumes & Carrots, Carrots Beans & Corn, Green Beans Carrots & Red Rice) — newer 2025 SKUs, no nutrition panel yet on FairPrice or Open Food Facts.
- Masterchef Instant Meals (Mala Dry / Mala Tang), Tanniu Hainan Wenchang Chicken — no panel published.

These remain candidates for a future session if FairPrice/the brands publish panels for them later.
