# Stride Food Data — Research Task Brief

> **Purpose:** This file defines exactly what a Cowork session must do to research a restaurant and produce a ready-to-merge data file. Follow every step in order. Do not skip or improvise.
>
> **Limit:** Research a maximum of **2 restaurants per run**. Claim both upfront, complete one fully before starting the next.

---

## Before You Start — Claim Up to 2 Restaurants

1. Read `docs/food-data/_index.json`
2. Find the first **1–2** entries where `"status": "todo"` (or `"partial"` if no `todo` entries remain)
3. **Immediately update each claimed entry:**
   - `"status"` → `"in_progress"`
   - `"assignee"` → `"cowork-session-A"` or `"cowork-session-B"` (whichever you are)
4. Save `_index.json` — this prevents another parallel session from picking the same restaurants
5. Complete the first restaurant fully (Steps 1–6) before starting the second

---

## Step 1 — Read the Index Entry

Open `_index.json` and note these fields for your claimed restaurant:

| Field | What to use it for |
|-------|--------------------|
| `id` | Used as the JSON file `id` field and in all item `id` prefixes |
| `name` | Official brand name — use exactly as written |
| `emoji` | Starting emoji — can be changed if a better one exists |
| `cuisine` | Cuisine label — use the value from the index |
| `serviceTypes` | Array of service modes — see Reference Values below |
| `nutritionUrl` | **Start here** for official nutrition data |
| `outputFile` | Path where your JSON must be saved (relative to `docs/food-data/`) |
| `notes` | Read these — they tell you what data is already available and any gotchas |
| `macroCompleteness` | `"high"` means full macros exist; `"low"` means calories only |

---

## Step 2 — Research Nutrition Data

### Primary source — Official brand website

Fetch the URL in `nutritionUrl`. Look for any of:
- Nutrition Calculator
- Nutrition PDF or downloadable menu
- Menu page listing calories and macros per item
- Allergen / Nutrition info page

If the main page has no data, try these variations before giving up:
- `{nutritionUrl}/nutrition`
- `{nutritionUrl}/menu`
- Web search: `site:{domain} nutrition calories protein`

**Record the exact URL where you found the data** — stored as `sourceUrl` in every menu item.

---

### If the official website has NO nutrition data — try ONE alternative source

Go through this fallback list in order and **stop at the first one that has data**:

| # | Source | URL | `source` value | `verified` |
|---|--------|-----|----------------|------------|
| 1 | HPB Healthhub | https://www.healthhub.sg/programmes/nutrition-tools | `"hpb"` | `true` |
| 2 | MyNetDiary SG | https://www.mynetdiary.com/food.do | `"community"` | `false` |
| 3 | Carb Manager | https://www.carbmanager.com | `"community"` | `false` |

**Try only one alternative.** If none have data, still produce the file with item names and prices (set `calories/protein/carbs/fat` to `0` and write `"(No nutrition data found)"` in `description`).

---

### What to collect per item

| Field | Required? | Notes |
|-------|-----------|-------|
| `name` | ✅ | Exact menu spelling |
| `price` | ✅ | SGD — standard menu price |
| `calories` | ✅ | kcal per serving |
| `protein` | ✅ | g — use `0` + note in description if unavailable |
| `carbs` | ✅ | g — use `0` + note if unavailable |
| `fat` | ✅ | g — use `0` + note if unavailable |
| `fibre` | Optional | Only include if officially published |
| `sugar` | Optional | Only include if officially published |
| `sodium` | Optional | Only include if officially published (mg) |
| `category` | ✅ | Menu section: "Mains", "Sides", "Drinks", "Desserts", etc. |
| `sourceUrl` | ✅ | Exact URL where you found this item's nutrition data |

**Skip:** bundle deals, items with no price and no nutrition, condiment sachets.

---

## Step 3 — Determine `tier` and `serviceTypes`

Every restaurant entry needs both fields. Choose from the values below.

### `tier`
| Value | When to use |
|-------|-------------|
| `"full_menu"` | Chain with a defined menu and at least partial nutrition data |
| `"estimated_menu"` | Hawker centre or local stall — items reference `SG_MACRO_FOODS` via `macroDbRef` |
| `"place_only"` | GPS-detected place with no menu data — **do not add to the DB** |

All research-file restaurants will be `"full_menu"` unless explicitly a hawker centre.

### `serviceTypes`
Use an **array** — outlets can support multiple modes:

| Value | When to use |
|-------|-------------|
| `"dine_in"` | Has seating — guests eat on-premise |
| `"grab_go"` | Counter/kiosk service — food taken away |
| `"delivery"` | Confirmed on GrabFood, foodpanda, or Deliveroo |

Common patterns:
- Restaurant chains (McDonald's, KFC, Jollibee): `["dine_in", "grab_go"]`
- Kiosks / bubble tea / bakeries (Gong Cha, BreadTalk): `["grab_go"]`
- Online-first meal delivery (Grain): `["grab_go", "delivery"]`
- Add `"delivery"` only when confirmed on a delivery platform

---

## Step 4 — Build the JSON File

Save as a single JSON object matching the `sgFoodDb.ts` schema exactly:

```jsonc
{
  "id": "brand_slug",
  "name": "Official Brand Name",
  "emoji": "🍽️",
  "cuisine": "Cuisine Label",
  "tier": "full_menu",
  "serviceTypes": ["dine_in", "grab_go"],
  "aliases": ["brand name", "short name", "alternate spelling"],
  "dietTags": [],
  "priceRange": "$$",
  "nutritionUrl": "https://brand.com.sg/nutrition",
  "lastUpdated": "YYYY-MM-DD",
  "menu": [
    {
      "id": "brandslug_item_name_slug",
      "name": "Item Name",
      "emoji": "🍗",
      "price": 12.90,
      "calories": 450,
      "protein": 35,
      "carbs": 42,
      "fat": 12,
      "fibre": 5,           // optional — omit if not published
      "sugar": 3,           // optional — omit if not published
      "sodium": 620,        // optional — omit if not published (mg)
      "category": "Mains",
      "compatibleWith": [],
      "isPopular": false,
      "description": "One-line description of the item",
      "source": "official_sg",
      "sourceUrl": "https://brand.com.sg/exact/page/where/data/was/found",
      "verified": true,
      "lastVerified": "YYYY-MM-DD"
    }
  ]
}
```

---

## Step 5 — Save the File

The workspace is mounted at `/sessions/<session-id>/mnt/Fitness App/`. Find your session path with:

```bash
ls /sessions/
```

Then save to:
```
/sessions/<session-id>/mnt/Fitness App/docs/food-data/{outputFile}
```

Example — if `outputFile` is `"grab-and-go/starbucks_sg.json"`:
```
/sessions/<session-id>/mnt/Fitness App/docs/food-data/grab-and-go/starbucks_sg.json
```

---

## Step 6 — Update `_index.json`

Update the restaurant's entry:

```jsonc
{
  "status": "ready",
  "assignee": null,
  "tier": "full_menu",
  "serviceTypes": ["dine_in", "grab_go"],
  "itemCount": 24,              // actual count of menu items in your file
  "macroCompleteness": "high",  // "high" | "medium" | "low" | "none"
  "priceAvailable": true,
  "dataSource": "official_sg",  // primary source used: "official_sg" | "hpb" | "community"
  "sourceUrl": "https://...",   // exact URL where data was found (or null)
  "lastChecked": "YYYY-MM-DD"
}
```

`macroCompleteness`:
- `"high"` — protein/carbs/fat all populated from official or HPB source
- `"medium"` — macros from community source, or some items missing macros
- `"low"` — calories only, no macros
- `"none"` — no nutrition data found at all

---

## Step 7 — Self-Verify

- [ ] Every menu item has a unique `id`
- [ ] Every menu item has a `sourceUrl` field (or explicitly `null`)
- [ ] `source` matches what `sourceUrl` points to
- [ ] `verified` is `true` only for `official_sg` / `hpb` sources
- [ ] No `price` is `0.00` unless genuinely free (note it in description)
- [ ] `tier` is `"full_menu"` (or `"estimated_menu"` for hawker centres)
- [ ] `serviceTypes` is an **array** — never a bare string
- [ ] File is valid JSON (no trailing commas, no comments)
- [ ] `_index.json` updated with `"status": "ready"` and all metadata filled

---

## Reference Values

### `source` + `sourceUrl`
| `source` | When to use | `verified` | `sourceUrl` example |
|----------|-------------|------------|---------------------|
| `"official_sg"` | Brand's own SG website or PDF | `true` | `https://starbucks.com.sg/en/nutrition` |
| `"hpb"` | Health Promotion Board Singapore | `true` | `https://www.healthhub.sg/...` |
| `"community"` | MyNetDiary, Carb Manager, other user submissions | `false` | `https://www.mynetdiary.com/food/...` |

`sourceUrl` must be the **exact page URL** where data was found — not the brand homepage. If all items came from the same page, all items share the same `sourceUrl`. If from a PDF, use the PDF's direct download URL.

### `priceRange`
- `"$"` — under $10/meal  ·  `"$$"` — $10–20  ·  `"$$$"` — $20–40  ·  `"$$$$"` — over $40

### `compatibleWith` (item-level dietary flags)
`"halal"` · `"vegetarian"` · `"vegan"` · `"gluten_free"` · `"dairy_free"` · `"nut_free"` · `"low_carb"` · `"high_protein"` · `"no_pork"` · `"pescatarian"` · `"keto"` · `"lactose_free"`

### `dietTags` (restaurant-level)
Only apply if the **entire brand** is certified (e.g. fully halal-certified chain). Item-level flags go in `compatibleWith`.

### ID slugs
- Restaurant: `"starbucks"`, `"toast_box"`, `"liho"`
- Menu item: `{restaurantId}_{item_slug}` — e.g. `"starbucks_caffe_latte_tall"`
- Slugify: lowercase, spaces/special chars → underscores, strip leading/trailing underscores

### When macros are missing
- **Calories only:** set `protein`, `carbs`, `fat` to `0`. Add `"(Macros not published — calories only)"` in `description`.
- **Nothing at all:** set all four to `0`. Add `"(No nutrition data found)"` in `description`. Set `source: "community"`, `verified: false`, `sourceUrl: null`.

---

## Examples

| File | What it shows |
|------|---------------|
| `grab-and-go/grain_sg.json` | Full macros from official source (`source: "official_sg"`) |
| `grab-and-go/saladbox_sg.json` | Calories only — macros set to `0` with note in description |
| `grab-and-go/saladstop_sg.json` | Community macros (`source: "community"`, `verified: false`) |
| `restaurants/aw_sg.json` | Community macros sourced from international nutrition PDF |
| `_template.restaurant.json` | Blank template — copy this as your starting point |

---

## What Happens Next

Files marked `status: "ready"` in `_index.json` are merged into `src/lib/sgFoodDb.ts` in the next sprint. The JSON format mirrors the `SG_RESTAURANTS` entries in that file — merging is a direct copy of the `menu` array into the corresponding restaurant block.
