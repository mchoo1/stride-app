# Session Report — Little Farms (Grocery track)

**Date:** 2026-08-04
**Track:** Grocery
**Outlet:** Little Farms (littlefarms.com) — premium organic grocer/deli, SG-wide delivery + 8 stores
**Tier achieved:** T1 (official_sg)
**Items added:** 6
**Approval required:** 0 (all items T1, ready to upload)

## Source

Little Farms publishes a full Singapore Nutrition Information Panel (calories, protein, fat, saturated fat, trans fat, cholesterol, carbs, sugar, fibre, sodium) directly on individual product pages for its "Little Farms Ready-Made Meals" range (Ready-to-Heat Homestyle line), made in Singapore. URL pattern: `https://littlefarms.com/shop-groceries/little-farms/little-farms-ready-made-meals/[slug]`.

Note: nutrition panels are published inconsistently across the range — of 14 product pages checked (9 Ready-to-Heat mains, 4 Ready-to-Eat salads, 1 curry, 2 soups), only 6 had a published Nutritional Information table. Lamb Rogan Josh, the 6 Ready-to-Eat salads, Chicken Laksa Soup and Chicken Vegetable Soup had no macro data on their product pages and were skipped this session (no T3 estimate substituted — left for a future session or a different data source).

Each label states "Servings per pack: 2." Figures below are the **whole pack as sold** (label per-serving value × 2), since `priceSgd` reflects the whole pack and that's the unit most users would log in one sitting.

## Ready to Upload (T1 — official_sg, no admin approval needed)

| Item | Pack | Price | Calories | Protein | Carbs | Fat | Tags |
|---|---|---|---|---|---|---|---|
| Beef Lasagne | 350g | $16.48 | 636 | 45.2g | 46.0g | 30.4g | high_protein |
| Fish Pie | 350g | $16.48 | 586 | 28.4g | 67.0g | 23.2g | high_protein |
| Mac & Cheese | 350g | $10.98 | 888 | 32.0g | 88.0g | 46.0g | high_protein, vegetarian |
| Shepherd's Pie | 350g | $16.48 | 429 | 22.0g | 45.0g | 19.0g | — |
| Vegetable Korma | 300g | $12.98 | 350 | 10.6g | 21.0g | 16.6g | vegetarian |
| Spinach Paneer | 300g | $16.48 | 526 | 15.0g | 19.6g | 45.0g | vegetarian |

Source URLs (per item):
- Beef Lasagne: https://littlefarms.com/lf-beef-lasagne-350g-400806
- Fish Pie: https://littlefarms.com/lf-fish-pie-350g-400808
- Mac & Cheese: https://littlefarms.com/lf-mac-cheese-350g-400809
- Shepherd's Pie: https://littlefarms.com/lf-shepherd-s-pie-350g-400810
- Vegetable Korma: https://littlefarms.com/lf-vegetable-korma-400g-400756 (currently out of stock online but a live catalog SKU)
- Spinach Paneer: https://littlefarms.com/lf-spinach-paneer-300g-400811

## Needs Admin Approval

None this session.

## Skipped (no macro data found — candidates for a future session via a different sourcing method, e.g. barcode/Open Food Facts lookup if available)

- Ready-to-Heat Homestyle - Lamb Rogan Josh (300g, $16.48)
- Ready-to-Heat Homestyle - Spaghetti Bolognese (350g, $16.48)
- Ready-to-Heat Homestyle - Vegetarian Lasagne (350g, $13.48, currently out of stock)
- Salad - Chicken Shawarma (280g, $12.98)
- Salad - Classic Tuna Nicoise (280g, $12.98)
- Salad - Italian Chicken Pasta Bowl, Moroccan Spiced Chicken Couscous, Basil Pesto Pasta, Greek Salad w/ Chicken Kebab, Yakisoba Tofu Bowl (all 250-280g, $10.98-$12.98)
- Ready-to-Heat Homestyle Soup - Chicken Laksa (500g, $14.48)
- Ready-to-Heat Homestyle Soup - Chicken Vegetable (500g, $14.48)
- Frozen pizzas (11" Margherita/Prosciutto Funghi/Hawaiian/Pepperoni/Veggie Supreme, $20.98-$21.98) — no nutrition panel checked yet
- Hummus range (Herby, Sweet Chilli, Dukkah — $9.98 each) — no nutrition panel checked yet

## TypeScript snippet — append to `SG_GROCERY` array in `app/src/lib/sgFoodDb.ts`

```ts
{
  id: 'little_farms',
  name: 'Little Farms',
  type: 'grocery',
  outletType: 'grocery',
  serviceTypes: ['takeaway', 'delivery'],
  aliases: ['little farms', 'littlefarms', 'little farms grocer', 'little farms sg'],
  dietTags: [],
  nutritionUrl: 'https://littlefarms.com/shop-groceries/little-farms/little-farms-ready-made-meals',
  menu: [
    {
      id: 'beef-lasagne',
      name: 'Ready-to-Heat Homestyle Beef Lasagne',
      category: 'Ready Meals',
      emoji: '🍝',
      priceSgd: 16.48,
      calories: 636,
      protein: 45.2,
      carbs: 46.0,
      fat: 30.4,
      source: 'official_sg',
      confidence: 'high',
      compatibleWith: ['high_protein'],
      lastVerified: '2026-08-04',
    },
    {
      id: 'fish-pie',
      name: 'Ready-to-Heat Homestyle Fish Pie',
      category: 'Ready Meals',
      emoji: '🥧',
      priceSgd: 16.48,
      calories: 586,
      protein: 28.4,
      carbs: 67.0,
      fat: 23.2,
      source: 'official_sg',
      confidence: 'high',
      compatibleWith: ['high_protein'],
      lastVerified: '2026-08-04',
    },
    {
      id: 'mac-cheese',
      name: 'Homestyle Mac & Cheese',
      category: 'Ready Meals',
      emoji: '🧀',
      priceSgd: 10.98,
      calories: 888,
      protein: 32.0,
      carbs: 88.0,
      fat: 46.0,
      source: 'official_sg',
      confidence: 'high',
      compatibleWith: ['high_protein', 'vegetarian'],
      lastVerified: '2026-08-04',
    },
    {
      id: 'shepherds-pie',
      name: "Ready-to-Heat Homestyle Shepherd's Pie",
      category: 'Ready Meals',
      emoji: '🥧',
      priceSgd: 16.48,
      calories: 429,
      protein: 22.0,
      carbs: 45.0,
      fat: 19.0,
      source: 'official_sg',
      confidence: 'high',
      compatibleWith: [],
      lastVerified: '2026-08-04',
    },
    {
      id: 'vegetable-korma',
      name: 'Ready-to-Heat Homestyle Vegetable Korma',
      category: 'Ready Meals',
      emoji: '🍛',
      priceSgd: 12.98,
      calories: 350,
      protein: 10.6,
      carbs: 21.0,
      fat: 16.6,
      source: 'official_sg',
      confidence: 'high',
      compatibleWith: ['vegetarian'],
      lastVerified: '2026-08-04',
    },
    {
      id: 'spinach-paneer',
      name: 'Ready-to-Heat Homestyle Spinach Paneer',
      category: 'Ready Meals',
      emoji: '🍛',
      priceSgd: 16.48,
      calories: 526,
      protein: 15.0,
      carbs: 19.6,
      fat: 45.0,
      source: 'official_sg',
      confidence: 'high',
      compatibleWith: ['vegetarian'],
      lastVerified: '2026-08-04',
    },
  ],
},
```
