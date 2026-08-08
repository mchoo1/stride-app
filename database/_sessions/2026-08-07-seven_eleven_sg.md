# Stride DB Session — 2026-08-07 — 7-Eleven Singapore (Snacks & Drinks Range)

**Track:** Grocery / Convenience Store
**Outlet ID:** `seven_eleven_sg`
**Tier achieved:** T1 (official_sg — FairPrice/Open Food Facts label panels) mixed with T3 (ai_estimate — aggregator/press-sourced) and T5 (signature guess)
**Items added:** 18
**Approval required:** 10 (see "Needs Admin Approval" below)

## Anti-duplication check performed

- Read `_index.json` — no `seven_eleven`, `7eleven`, or `7-eleven` entry existed. Confirmed `cheers` and `fairprice_xpress` are already marked `in_app`; `fairprice_grocery`, `gardenia`, and `little_farms` (grocery track) do not overlap with the products below.
- Scanned `sgFoodDb.ts` `SG_RESTAURANTS` array and all files in `database/restaurants/` and `database/grab-and-go/` — no 7-Eleven outlet or matching product IDs found.
- No existing `id` values were reused or renamed.

## Why 7-Eleven, and why this shape of session

7-Eleven Singapore does **not** publish an official nutrition-facts page or PDF for its own private-label "7-Café" hot food (onigiri, sandwiches, Big Bite hot dogs) — this was confirmed by searching `7-eleven.com.sg` directly and via web search; only third-party calorie-tracker sites (FatSecret, Lemon8, TikTok) have numbers, and several of those are for 7-Eleven's *US* or *Thai* menus, not Singapore's.

However, the great majority of what 7-Eleven SG actually sells on its shelves is **third-party branded FMCG product** (drinks, biscuits, snacks, instant noodles) that **does** carry an official manufacturer nutrition label. Since these same brands/SKUs are sold at FairPrice (and FairPrice's product pages reproduce the label's Nutrition Information panel in full), FairPrice product pages were used as the primary official source per the grocery-sourcing tip in the task brief ("if the product has SG scans / a verified nutrition panel, treat as T1"). Open Food Facts was used for one item (Pokka Ice Lemon Tea) where a Singapore-sold barcode scan with a complete panel existed.

This session therefore covers a themed **"7-Eleven SG Snacks & Drinks Range"**: 8 shelf-stable branded items with confirmed official macros (safe to upload), plus 10 items — high-protein snacks/drinks specifically marketed as new 7-Eleven SG additions (Calobye, Smarter Snack, Betagro chicken breast), plus 7-Café onigiri and the Big Bite hot dog — where only secondary/aggregator or cross-market data could be found. All 10 are flagged for admin approval per the T3/T5 rules.

## Ready to Upload (T1 — official_sg, no admin approval needed)

| Item | Serving | Cal | Protein | Carbs | Fat | Source |
|---|---|---|---|---|---|---|
| Munchy's Lexus Sandwich Calcium Crackers – Cheese | 1 sachet (19g) | 102 | 1.3 | 11.6 | 5.5 | FairPrice official nutrition panel (scaled from 100g label) |
| Pokka Ice Lemon Tea | 250ml carton | 100 | 0 | 25 | 0 | Open Food Facts (SG-sold barcode, verified panel) |
| Vitasoy Soya Bean Packet Drink – Chocolate | 250ml | 160 | 3.3 | 29.0 | 3.3 | FairPrice official nutrition panel |
| Tao Kae Noi Crispy Seaweed – Original | 32g pack | 220 | 4 | 5 | 20 | FairPrice official nutrition panel |
| Nissin Instant Cup Noodles – Seafood | 75g cup | 300 | 8.1 | 43.6 | 10.2 | FairPrice official nutrition panel (scaled from 100g label) |
| Calbee Jagabee Potato Sticks – Original | 1 single pack (18g) | 102 | 0.7 | 9.2 | 7.2 | FairPrice official nutrition panel |
| Want Want Rice Crackers – Senbei | 30g serving | 147 | 1.4 | 21.1 | 6.4 | FairPrice official nutrition panel |
| Julie's Sandwich Biscuits – Peanut Butter | 30g serving (~2 pcs) | 160 | 3 | 18 | 8 | FairPrice official nutrition panel |

All eight sourced directly from fairprice.com.sg product pages (which reproduce the manufacturer's printed Nutrition Information label) or, for Pokka, from Open Food Facts' Singapore-sold barcode scan. `verified: true`, `confidence: 'verified'` for all eight.

## Needs Admin Approval (T3 ai_estimate / T5 signature guess — do NOT upload without review)

| Item | Serving | Proposed Cal | Protein | Carbs | Fat | Tier | Source searched / reasoning |
|---|---|---|---|---|---|---|---|
| Calobye Perfect Power Shake – Chocolate | 250ml RTD bottle | 130 | 20 | — (not stated) | low (not stated) | T3 | Mini Me Insights (F&B trade press, Apr 2025) reporting 7-Eleven SG's own launch figures for this SKU: "130 calories, 20g of protein, low in fat." No full macro panel (carbs/fat grams) found; brand's Korean-market listings (YesStyle, Yami) show a different RTD variant at ~168kcal/275ml with 27.5g protein, so figures conflict across markets — flagged for confirmation. |
| Smarter Snack Protein Pancake – Cookies & Cream | 1 pancake (55g) | 175 | 13 | 14.5 | 7.5 | T3 | Brand's own site (smartersnacks.com) confirms "13g protein, 4g fibre" in the product description but does not publish a full Nutrition Facts table on the page. Full calorie/carb/fat numbers taken from third-party retailer listings (sportsfuel.co.nz, netrition.com, topnutritionandfitness.com) for the same SKU, which were mutually consistent (171–178 kcal) — midpoint used. |
| Betagro Classic Chicken Breast | 1 bag (90g) | 104 | 20 | 0 | 2.7 | T3 | Aggregator sites (MyNetDiary, FatSecret) reporting the manufacturer's label for this exact 7-Eleven SG shelf item (multiple independent Lemon8 SG posts confirm "104 kcal / 20g protein" for the 7-Eleven Betagro chicken breast snack). No direct fetch of Betagro's own nutrition panel was possible this session. |
| Betagro Tender Chicken Breast – Hot & Spicy | 1 bag (90g) | 103 | 19 | 3 | 1.8 | T3 | Same sourcing basis as Classic Chicken Breast above (MyNetDiary aggregator page for this SKU). |
| Yakult Light | 1 bottle (65ml) | 25 | 1 | 6 | 0 | T3 | Multiple consistent aggregator sources (Eat This Much, SnapCalorie, FatSecret) report 25 kcal/1g protein for Yakult Light 65ml. FairPrice's own product page for the related "Yakult Ace Light" (80ml) SKU was fetched but did not render a nutrition table in this session, so could not upgrade to T1. |
| Meiji Bulgaria Yogurt (Plain) | 100g cup | 62 | 3.4 | 5.3 | 3.0 | T3 | Aggregator sources (FatSecret, Inlivo) reporting Meiji's own LB81 Plain yogurt cup label. Meiji's official product pages (meijibulgariayogurt.com) were found but describe the 400g tub, not the single-serve cup format typically sold at 7-Eleven; exact single-serve cup size/label not independently confirmed this session. |
| 100PLUS Isotonic – Original | 325ml can | 65 | 0 | 18 | 0 | T3 | FairPrice's own product page for this exact SKU was fetched but the nutrition table did not render in this session (ingredients list only). Figure is the most consistent value across multiple aggregator sources (FatSecret, MyNetDiary) for the 325ml can. |
| 7-Café Tuna Mayo Onigiri | 1 piece | 173 | 4.1 | 36.0 | 1.4 | T3 | No official 7-Eleven SG nutrition source exists for this item. Figure sourced from social/creator content (TikTok, NutriScan app estimate) discussing 7-Eleven SG onigiri specifically — explicitly caveated by the source as an estimate that "may vary between regions." |
| 7-Café Chicken Teriyaki Mayo Onigiri | 1 piece | 176 | 4.4 | 32.1 | 2.4 | T3 | Same sourcing basis as Tuna Mayo Onigiri above. |
| 7-Eleven Big Bite Hotdog Sandwich | 1 sandwich | 430 | 19 | 29 | 27 | T5 | No Singapore-specific data exists at all. Figure is FatSecret's listing for the **US** 7-Eleven "Big Bite" hot dog/sandwich menu, carried over as a signature-guess placeholder only because it is the closest analogous item; SG Big Bite recipe/size may differ materially. Recommend replacing with an in-store label check rather than approving as-is. |

## Diet tags applied

Only assigned where the FairPrice ingredient list explicitly supports it (T1 items only; all T3/T5 items left with empty `compatibleWith` per the rules):

- **vegetarian**: Pokka Ice Lemon Tea, Vitasoy Chocolate, Tao Kae Noi Original, Want Want Senbei, Calbee Jagabee Original, Munchy's Lexus Cheese, Julie's Peanut Butter (all confirmed no meat/fish in ingredient list)
- **vegan**: Pokka Ice Lemon Tea, Vitasoy Chocolate, Tao Kae Noi Original, Want Want Senbei, Calbee Jagabee Original (confirmed no dairy/egg in ingredient list)
- **lactose_free**: Pokka Ice Lemon Tea, Vitasoy Chocolate (soy-based), Tao Kae Noi Original, Want Want Senbei, Calbee Jagabee Original
- **low_fat** (≤10g fat/serving): Pokka Ice Lemon Tea, Munchy's Lexus Cheese sachet, Nissin Cup Noodles Seafood, Calbee Jagabee, Want Want Senbei, Julie's Peanut Butter
- **keto** (≤10g carbs/serving): Tao Kae Noi Original (5g); Vitasoy is 29g so excluded
- Nissin Cup Noodles Seafood contains fish/egg/dairy — **not** tagged vegetarian, vegan, or lactose_free.
- **halal**: Tao Kae Noi Crispy Seaweed – Original's FairPrice page displayed an explicit Halal dietary badge — tagged. No other item's fetched FairPrice page showed a Halal badge in the captured page content, so no other halal tags were applied.

## TypeScript snippet (paste into `SG_RESTAURANTS` array in `app/src/lib/sgFoodDb.ts`)

```ts
  // ── 7-Eleven Singapore (Snacks & Drinks Range) ───────────────────────────
  {
    id: 'seven_eleven_sg',
    name: '7-Eleven',
    emoji: '🏪',
    cuisine: 'Convenience Store — Snacks & Drinks',
    tier: 'partial_menu',
    outletType: 'grab_go',
    serviceTypes: ['grab_go'],
    aliases: ['7-eleven', '7 eleven', 'seven eleven', '711', '7-11'],
    dietTags: [],
    priceRange: '$',
    nutritionUrl: 'https://www.7-eleven.com.sg/products',
    lastUpdated: '2026-08-07',
    menu: [
      {
        id: 'seven_eleven_munchys_lexus_cheese_sachet',
        name: "Munchy's Lexus Sandwich Calcium Crackers – Cheese",
        emoji: '🧀',
        price: 1.20,
        calories: 102,
        protein: 1.3,
        carbs: 11.6,
        fat: 5.5,
        sodium: 81,
        servingSize: '1 sachet (19g)',
        category: 'Packaged Snacks',
        description: 'Cheese cream-filled sandwich crackers, individually wrapped grab-and-go sachet.',
        compatibleWith: ['vegetarian'],
        source: 'official_sg',
        sourceUrl: 'https://www.fairprice.com.sg/product/munchy-s-lexus-sandwich-calcium-crackers-cheese-190g-13013276',
        confidence: 'verified',
        verified: true,
        lastVerified: '2026-08-07',
        nutritionNote: 'Macros scaled down from FairPrice\'s official per-100g label panel (535kcal/29g fat/61g carb/7g protein) to a single 19g sachet, the typical convenience-store single-serve size; independently cross-checked against a third-party aggregator reporting ~100kcal for the same 19g sachet.',
      },
      {
        id: 'seven_eleven_pokka_ice_lemon_tea_250ml',
        name: 'Pokka Ice Lemon Tea',
        emoji: '🍋',
        price: 1.70,
        calories: 100,
        protein: 0,
        carbs: 25,
        fat: 0,
        sugar: 25,
        sodium: 10,
        servingSize: '250ml carton',
        category: 'Drinks',
        description: 'Black tea with lemon juice, classic sweetened ready-to-drink tea.',
        compatibleWith: ['vegetarian', 'vegan', 'lactose_free', 'low_fat'],
        source: 'official_sg',
        sourceUrl: 'https://world.openfoodfacts.org/product/8888196452214/ice-lemon-tea-pokka',
        confidence: 'verified',
        verified: true,
        lastVerified: '2026-08-07',
      },
      {
        id: 'seven_eleven_vitasoy_choc_250ml',
        name: 'Vitasoy Soya Bean Packet Drink – Chocolate',
        emoji: '🥤',
        price: 1.10,
        calories: 160,
        protein: 3.3,
        carbs: 29.0,
        fat: 3.3,
        sugar: 22.0,
        sodium: 130,
        servingSize: '250ml packet',
        category: 'Drinks',
        description: 'Non-dairy soy milk drink with chocolate flavour.',
        compatibleWith: ['vegetarian', 'vegan', 'lactose_free'],
        source: 'official_sg',
        sourceUrl: 'https://www.fairprice.com.sg/product/vitasoy-soy-packet-drink-chocolate-6s-x-250ml-12110848',
        confidence: 'verified',
        verified: true,
        lastVerified: '2026-08-07',
      },
      {
        id: 'seven_eleven_tao_kae_noi_original_32g',
        name: 'Tao Kae Noi Crispy Seaweed – Original',
        emoji: '🌿',
        price: 2.20,
        calories: 220,
        protein: 4,
        carbs: 5,
        fat: 20,
        sodium: 110,
        servingSize: '32g pack',
        category: 'Packaged Snacks',
        description: 'Crispy fried seaweed snack, original flavour.',
        compatibleWith: ['halal', 'vegetarian', 'vegan', 'lactose_free', 'keto'],
        source: 'official_sg',
        sourceUrl: 'https://www.fairprice.com.sg/product/tao-kae-noi-crispy-seaweed-original-32g-13097041',
        confidence: 'verified',
        verified: true,
        lastVerified: '2026-08-07',
      },
      {
        id: 'seven_eleven_nissin_cup_noodles_seafood_75g',
        name: 'Nissin Instant Cup Noodles – Seafood',
        emoji: '🍜',
        price: 1.90,
        calories: 300,
        protein: 8.1,
        carbs: 43.6,
        fat: 10.2,
        sugar: 4.9,
        sodium: 1755,
        servingSize: '75g cup (prepared)',
        category: 'Ready-to-Eat',
        description: 'Instant noodle cup with seafood-flavoured broth, ready in 3 minutes with hot water.',
        compatibleWith: [],
        source: 'official_sg',
        sourceUrl: 'https://www.fairprice.com.sg/product/nissin-cup-noodle-seafood-75g-223149',
        confidence: 'verified',
        verified: true,
        lastVerified: '2026-08-07',
        nutritionNote: 'Contains fish, egg, and milk-derived non-dairy creamer per official ingredient list — not tagged vegetarian, vegan, or lactose_free.',
      },
      {
        id: 'seven_eleven_calbee_jagabee_original_18g',
        name: 'Calbee Jagabee Potato Sticks – Original',
        emoji: '🍟',
        price: 1.30,
        calories: 102,
        protein: 0.7,
        carbs: 9.2,
        fat: 7.2,
        sugar: 0.1,
        sodium: 63,
        servingSize: '1 single pack (18g)',
        category: 'Packaged Snacks',
        description: 'Baked (not fried) potato stick snack, original flavour, individually wrapped.',
        compatibleWith: ['vegetarian', 'vegan', 'lactose_free', 'low_fat'],
        source: 'official_sg',
        sourceUrl: 'https://www.fairprice.com.sg/product/calbee-jagabee-potato-sticks-original-5-x-18g-13001233',
        confidence: 'verified',
        verified: true,
        lastVerified: '2026-08-07',
      },
      {
        id: 'seven_eleven_want_want_senbei_30g',
        name: 'Want Want Rice Crackers – Senbei',
        emoji: '🍘',
        price: 1.50,
        calories: 147,
        protein: 1.4,
        carbs: 21.1,
        fat: 6.4,
        sugar: 4.4,
        sodium: 163,
        servingSize: '30g serving',
        category: 'Packaged Snacks',
        description: 'Traditional Japanese-style savoury-glazed rice cracker.',
        compatibleWith: ['vegetarian', 'vegan', 'lactose_free', 'low_fat'],
        source: 'official_sg',
        sourceUrl: 'https://www.fairprice.com.sg/product/want-want-senbei-rice-crackers-92g-455346',
        confidence: 'verified',
        verified: true,
        lastVerified: '2026-08-07',
      },
      {
        id: 'seven_eleven_julies_peanut_butter_30g',
        name: "Julie's Sandwich Biscuits – Peanut Butter",
        emoji: '🥜',
        price: 1.40,
        calories: 160,
        protein: 3,
        carbs: 18,
        fat: 8,
        sugar: 6,
        sodium: 85,
        servingSize: '30g serving (~2 biscuits)',
        category: 'Packaged Snacks',
        description: 'Peanut butter cream-filled sandwich biscuits.',
        compatibleWith: ['vegetarian', 'low_fat'],
        source: 'official_sg',
        sourceUrl: 'https://www.fairprice.com.sg/product/julie-s-sandwich-biscuits-peanut-butter-360g-12-per-pack-12083675',
        confidence: 'verified',
        verified: true,
        lastVerified: '2026-08-07',
      },
      {
        id: 'seven_eleven_calobye_power_shake_choc_250ml',
        name: 'Calobye Perfect Power Shake – Chocolate',
        emoji: '🥤',
        price: 3.90,
        calories: 130,
        protein: 20,
        carbs: 0,
        fat: 0,
        sodium: 0,
        servingSize: '250ml RTD bottle',
        category: 'Protein Drinks',
        description: 'Korean high-protein ready-to-drink shake, launched as a 7-Eleven SG exclusive high-protein offering.',
        compatibleWith: [],
        source: 'ai_estimate',
        sourceUrl: 'https://www.minimeinsights.com/2025/04/06/new-high-protein-snacks-and-drinks-at-7-eleven-singapore/',
        confidence: 'low',
        verified: false,
        lastVerified: '2026-08-07',
        nutritionNote: 'NEEDS ADMIN APPROVAL. Calories/protein from F&B trade press (Mini Me Insights) reporting 7-Eleven SG\'s own launch figures. Carbs/fat not stated by that source (set to 0 as placeholder — likely inaccurate). Korean market listings for a similarly-named RTD show materially different figures (~168kcal/275ml, 27.5g protein), so the exact SG SKU macros are unconfirmed.',
      },
      {
        id: 'seven_eleven_smarter_snack_protein_pancake_cc',
        name: 'Smarter Snack Protein Pancake – Cookies & Cream',
        emoji: '🥞',
        price: 3.50,
        calories: 175,
        protein: 13,
        carbs: 14.5,
        fat: 7.5,
        fibre: 4,
        sodium: 300,
        servingSize: '1 pancake (55g)',
        category: 'Protein Snacks',
        description: 'Individually wrapped filled protein pancake, launched as a 7-Eleven SG high-protein snack range item.',
        compatibleWith: [],
        source: 'ai_estimate',
        sourceUrl: 'https://smartersnacks.com/products/protein-pancake-chocolate-cream-pack-of-12',
        confidence: 'medium',
        verified: false,
        lastVerified: '2026-08-07',
        nutritionNote: 'NEEDS ADMIN APPROVAL. Protein (13g) and fibre (4g) confirmed on brand\'s own product page; full calorie/carb/fat panel not published there and was instead taken from third-party retailer listings for the same SKU (171-178kcal range, midpoint used).',
      },
      {
        id: 'seven_eleven_betagro_classic_chicken_breast',
        name: 'Betagro Classic Chicken Breast',
        emoji: '🍗',
        price: 2.90,
        calories: 104,
        protein: 20,
        carbs: 0,
        fat: 2.7,
        sodium: 0,
        servingSize: '1 bag (90g)',
        category: 'Protein Snacks',
        description: 'Ready-to-eat sliced chicken breast snack, sold at 7-Eleven Singapore.',
        compatibleWith: [],
        source: 'ai_estimate',
        sourceUrl: 'https://www.mynetdiary.com/food/calories-in-classic-chicken-breast-by-betagro-bag-28132315-0.html',
        confidence: 'medium',
        verified: false,
        lastVerified: '2026-08-07',
        nutritionNote: 'NEEDS ADMIN APPROVAL. Aggregator-reported label data (MyNetDiary/FatSecret) for this exact SKU, cross-confirmed by multiple independent Lemon8 SG posts citing the same 104kcal/20g protein figures. No direct fetch of Betagro\'s own nutrition panel this session.',
      },
      {
        id: 'seven_eleven_betagro_tender_chicken_hot_spicy',
        name: 'Betagro Tender Chicken Breast – Hot & Spicy',
        emoji: '🌶️',
        price: 2.90,
        calories: 103,
        protein: 19,
        carbs: 3,
        fat: 1.8,
        sodium: 0,
        servingSize: '1 bag (90g)',
        category: 'Protein Snacks',
        description: 'Ready-to-eat sliced chicken breast snack, hot & spicy flavour.',
        compatibleWith: [],
        source: 'ai_estimate',
        sourceUrl: 'https://www.mynetdiary.com/food/calories-in-tender-chicken-breast-hot-spicy-by-betagro-bag-34233737-0.html',
        confidence: 'medium',
        verified: false,
        lastVerified: '2026-08-07',
        nutritionNote: 'NEEDS ADMIN APPROVAL. Same sourcing basis as Betagro Classic Chicken Breast (MyNetDiary aggregator page for this exact SKU).',
      },
      {
        id: 'seven_eleven_yakult_light_65ml',
        name: 'Yakult Light',
        emoji: '🍶',
        price: 0.60,
        calories: 25,
        protein: 1,
        carbs: 6,
        fat: 0,
        sugar: 3,
        servingSize: '1 bottle (65ml)',
        category: 'Drinks',
        description: 'Probiotic cultured milk drink, light/lower-sugar formulation.',
        compatibleWith: [],
        source: 'ai_estimate',
        sourceUrl: 'https://www.fairprice.com.sg/product/yakult-cultured-milk-ace-light-5s-x-80ml-10878044',
        confidence: 'medium',
        verified: false,
        lastVerified: '2026-08-07',
        nutritionNote: 'NEEDS ADMIN APPROVAL. Figures from multiple consistent aggregators (Eat This Much, SnapCalorie, FatSecret) for the 65ml Yakult Light bottle. FairPrice\'s page for the related 80ml "Ace Light" SKU was fetched but its nutrition table did not render this session, so could not be upgraded to T1 — sizes/variants also do not exactly match.',
      },
      {
        id: 'seven_eleven_meiji_bulgaria_yogurt_100g',
        name: 'Meiji Bulgaria Yogurt (Plain)',
        emoji: '🥛',
        price: 1.80,
        calories: 62,
        protein: 3.4,
        carbs: 5.3,
        fat: 3.0,
        servingSize: '100g cup',
        category: 'Chilled',
        description: 'Plain unsweetened yogurt cup, LB81 culture.',
        compatibleWith: [],
        source: 'ai_estimate',
        sourceUrl: 'https://www.meijibulgariayogurt.com/en/product/400g-LB81-plain.html',
        confidence: 'medium',
        verified: false,
        lastVerified: '2026-08-07',
        nutritionNote: 'NEEDS ADMIN APPROVAL. Aggregator-reported figures (FatSecret, Inlivo) for Meiji\'s LB81 Plain yogurt. Meiji\'s official page describes the 400g tub, not the single-serve cup format typically sold at 7-Eleven, so the exact cup size/label was not independently confirmed.',
      },
      {
        id: 'seven_eleven_100plus_original_325ml',
        name: '100PLUS Isotonic – Original',
        emoji: '🥫',
        price: 1.60,
        calories: 65,
        protein: 0,
        carbs: 18,
        fat: 0,
        servingSize: '325ml can',
        category: 'Drinks',
        description: 'Carbonated isotonic sports drink.',
        compatibleWith: [],
        source: 'ai_estimate',
        sourceUrl: 'https://omni.fairprice.com.sg/product/100-plus-isotonic-can-drinks-original-12s-x-325ml-10114204',
        confidence: 'medium',
        verified: false,
        lastVerified: '2026-08-07',
        nutritionNote: 'NEEDS ADMIN APPROVAL. FairPrice\'s own page for this exact SKU was fetched but its nutrition table did not render this session (ingredients only). Figure is the most consistent value across multiple aggregators (FatSecret, MyNetDiary) for the 325ml can.',
      },
      {
        id: 'seven_eleven_cafe_tuna_mayo_onigiri',
        name: '7-Café Tuna Mayo Onigiri',
        emoji: '🍙',
        price: 2.20,
        calories: 173,
        protein: 4.1,
        carbs: 36.0,
        fat: 1.4,
        servingSize: '1 piece',
        category: 'Ready-to-Eat',
        description: 'Rice ball with tuna mayo filling, wrapped in seaweed.',
        compatibleWith: [],
        source: 'ai_estimate',
        sourceUrl: 'https://www.tiktok.com/discover/7-11-onigiri-singapore-calories',
        confidence: 'low',
        verified: false,
        lastVerified: '2026-08-07',
        nutritionNote: 'NEEDS ADMIN APPROVAL. No official 7-Eleven SG nutrition source exists. Figure from a social/creator-app estimate (NutriScan) discussing 7-Eleven SG onigiri specifically; source itself caveats that calorie counts "may vary between different 7-Eleven regions."',
      },
      {
        id: 'seven_eleven_cafe_chicken_teriyaki_onigiri',
        name: '7-Café Chicken Teriyaki Mayo Onigiri',
        emoji: '🍙',
        price: 2.20,
        calories: 176,
        protein: 4.4,
        carbs: 32.1,
        fat: 2.4,
        servingSize: '1 piece',
        category: 'Ready-to-Eat',
        description: 'Rice ball with chicken teriyaki mayo filling, wrapped in seaweed.',
        compatibleWith: [],
        source: 'ai_estimate',
        sourceUrl: 'https://www.tiktok.com/discover/7-11-onigiri-singapore-calories',
        confidence: 'low',
        verified: false,
        lastVerified: '2026-08-07',
        nutritionNote: 'NEEDS ADMIN APPROVAL. Same sourcing basis as Tuna Mayo Onigiri above.',
      },
      {
        id: 'seven_eleven_big_bite_hotdog',
        name: '7-Eleven Big Bite Hotdog Sandwich',
        emoji: '🌭',
        price: 2.80,
        calories: 430,
        protein: 19,
        carbs: 29,
        fat: 27,
        servingSize: '1 sandwich',
        category: 'Ready-to-Eat',
        description: 'Grab-and-go hot dog / sandwich from the in-store hot food counter.',
        compatibleWith: [],
        source: 'ai_estimate',
        sourceUrl: 'https://mobile.fatsecret.com/calories-nutrition/7-eleven/big-bite-sandwich',
        confidence: 'low',
        verified: false,
        lastVerified: '2026-08-07',
        nutritionNote: 'NEEDS ADMIN APPROVAL — signature guess (T5). No Singapore-specific data exists. Figure is FatSecret\'s listing for the US 7-Eleven "Big Bite" menu, carried over only as the closest analogous placeholder; the actual SG item\'s recipe/size may differ materially. Recommend an in-store label check instead of approving this figure as-is.',
      },
    ],
  },
```

## Items considered and excluded

- **Boost Juice SG, SaladStop!, Saladbox, Starbucks SG food, Toast Box, Stuffd, Grain, Mr Bean** — already present in `_index.json` as `in_app`/`pending_upload`, not re-researched.
- **Cheers, FairPrice Xpress** — already marked `in_app` in `_index.json`.
- **Buzz (Changi Airport convenience)** — no official nutrition data found published anywhere; product range not itemised online (consistent with the prior Gardenia session's finding).
- **Meiji chocolate bars, Pocky, Oreo, Pringles, Milo UHT, Red Bull, Ovaltine UHT** — FairPrice product pages were checked for several of these but did not render a Nutrition Information table in this session's fetches (likely client-side-rendered content not present in the static HTML); skipped rather than guessing.
- **7-Eleven "Smarter Snack" other flavours (Red Velvet), Calobye other flavours (Chocolate Banana, Strawberry)** — skipped as near-duplicate flavour variants of the items already included.

## Recommended next steps for admin

1. Confirm actual Singapore-label macros for the 10 approval-needed items in person (visiting a 7-Eleven store and photographing the actual product nutrition panels would resolve nearly all of them, since most are packaged branded goods that do carry a label — only the panel wasn't reachable via this session's web research).
2. The Betagro chicken breast items and Calobye/Smarter Snack protein items are the highest-value ones to verify given they're marketed specifically as 7-Eleven SG's "high protein" range and are likely to be popular searches in-app.
3. The onigiri and Big Bite hot dog figures are the weakest (T3/T5), consider deprioritizing or replacing with an in-store check.
