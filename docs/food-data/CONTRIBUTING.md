# Stride Food Data — Contributor Guide

> **Two researchers can work in parallel.** Check `_index.json` first to claim a restaurant and avoid duplication.

---

## Quick Start

1. Open `_index.json` — find a restaurant with `"status": "todo"`
2. Change its `status` to `"in_progress"` and add your name to `"assignee"`
3. Copy `_template.restaurant.json` → the correct folder:
   - Dine-in chains → `restaurants/`
   - Delivery / grab & go chains → `grab-and-go/`
   - Grocery staples → `ingredients/`
4. Fill in the data (see format below)
5. Set `status` to `"done"` in `_index.json` when finished
6. The app will pick up your file automatically once it's merged into `sgFoodDb.ts`

---

## Folder Layout

```
docs/food-data/
├── CONTRIBUTING.md          ← You are here
├── _index.json              ← Claim tracker (edit before starting)
├── _template.restaurant.json ← Copy this as your starting point
│
├── restaurants/             ← Dine-in chains (Grain, SaladStop, etc.)
├── grab-and-go/             ← Quick counters, delivery brands
└── ingredients/             ← Raw grocery items (FairPrice staples, etc.)
```

---

## File Format

Each file must be a **single JSON object** matching this structure (same as `sgFoodDb.ts`):

```jsonc
{
  "id": "brand_slug",          // lowercase, underscores — e.g. "saladstop", "grain"
  "name": "Brand Name",        // official brand display name
  "emoji": "🥗",
  "cuisine": "Healthy Bowls",  // see Cuisine Labels below
  "tab": "grab_go",            // "restaurant" | "grab_go"
  "aliases": [                 // all lowercase — used for GPS name matching
    "brand name",
    "brand"
  ],
  "dietTags": ["halal"],       // see Diet Tags below
  "priceRange": "$$",          // "$" | "$$" | "$$$" | "$$$$"
  "nutritionUrl": "https://...",
  "lastUpdated": "2026-04-19",
  "menu": [
    {
      "id": "brand_item_slug", // format: {restaurantId}_{item_slug}
      "name": "Item Name",
      "emoji": "🥗",
      "price": 12.90,          // SGD — standard menu price
      "calories": 450,         // kcal
      "protein": 35,           // g
      "carbs": 42,             // g
      "fat": 12,               // g
      "fibre": 5,              // g — optional, omit if unknown
      "sugar": 8,              // g — optional, omit if unknown
      "sodium": 620,           // mg — optional, omit if unknown
      "category": "Mains",     // menu section
      "compatibleWith": ["halal"],
      "isPopular": true,
      "description": "Short one-line description of the dish",
      "source": "official_sg", // see Source Values below
      "verified": true,
      "lastVerified": "2026-04-19"
    }
  ]
}
```

---

## Reference Values

### `tab`
| Value | When to use |
|-------|-------------|
| `"restaurant"` | Dine-in chains (McDonald's, KFC, Subway, sit-down restaurants) |
| `"grab_go"` | Delivery-first, grab-and-go counters, online ordering brands |

### Cuisine Labels (use one of these)
`"Fast Food"` · `"Healthy Bowls"` · `"Healthy Salads"` · `"Local & Hawker"` · `"Japanese"` · `"Korean"` · `"Western"` · `"Kebabs & Wraps"` · `"Bakery"` · `"Bubble Tea"` · `"Cafe"` · `"Desserts"` · `"Pizza"` · `"Seafood"`

### Diet Tags
`"halal"` · `"vegetarian"` · `"vegan"` · `"gluten_free"` · `"dairy_free"` · `"nut_free"` · `"low_carb"` · `"high_protein"`

Apply a tag to the **restaurant** only if the entire brand is certified (e.g. fully halal).  
Apply tags to individual `menu` items via `compatibleWith` for item-level flags.

### Source Values (for `source` field)
| Value | Meaning |
|-------|---------|
| `"official_sg"` | Brand's own Singapore nutrition page / PDF — **preferred** |
| `"hpb"` | Health Promotion Board Singapore |
| `"usda"` | USDA FoodData Central (packaged goods) |
| `"open_food_facts"` | Open Food Facts (barcode-verified) |
| `"community"` | Community estimate — less reliable, `"verified": false` |
| `"ai_estimate"` | AI-generated — must be replaced before shipping |

### Price Range
| Value | Typical spend per meal |
|-------|----------------------|
| `"$"` | < $10 |
| `"$$"` | $10–20 |
| `"$$$"` | $20–40 |
| `"$$$$"` | > $40 |

---

## Data Quality Rules

1. **Macros must be per full standard serving** — not per 100g unless the item is a liquid or ingredient.
2. **If only calories are published** — set `protein`, `carbs`, `fat` to `0` and add a note in `description`: `"(Macros not published)"`. Don't invent numbers.
3. **If item has no nutrition data** — omit the item entirely, or set `"nutrition_available": false` and skip the macro fields.
4. **Price** — use standard menu price in SGD. For ranged prices (e.g. from $12.90), use the starting price.
5. **Verified flag** — set `"verified": true` only for `official_sg` or `hpb` sources. All others: `false`.
6. **ID format** — use `{restaurantId}_{item_name_slug}`. Slugify: lowercase, replace spaces/special chars with `_`. Example: `grain_grilled_farm_chicken`.

---

## Nutrition Sources (SG)

- **Brand website first** — most chains publish a nutrition calculator or PDF
- **HPB Healthhub** — https://www.healthhub.sg/programmes/nutrition-tools
- **MyNetDiary SG** — community data (mark as `community`, `verified: false`)
- **Carb Manager** — community data (same)

---

## Restaurants to Research (see `_index.json` for current status)

### Priority 1 — Healthy Chains
- [ ] SaladStop — full macros (partial data in reference/)
- [ ] Grain — macros partially available (data in reference/)
- [ ] Stuffd — ingredient-level macros available (data in reference/)
- [ ] Nourish Bowl
- [ ] Eatwell

### Priority 2 — Mainstream Chains
- [ ] A&W
- [ ] Jollibee
- [ ] Popeyes
- [ ] Toast Box
- [ ] LiHo Tea

### Priority 3 — Convenience
- [ ] Cheers
- [ ] FairPrice Xpress
- [ ] Starbucks SG (food items)
- [ ] Ya Kun (expand existing)
