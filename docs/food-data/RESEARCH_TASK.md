# Stride Food Data — Research Task Brief

> **Purpose:** This file defines exactly what a Cowork session must do to research a restaurant and produce a ready-to-merge data file. Follow every step in order. Do not skip or improvise.

---

## Before You Start — Claim a Restaurant

1. Read `/sessions/pensive-laughing-hopper/mnt/Fitness App/docs/food-data/_index.json`
2. Find the first entry where `"status": "todo"` (or `"partial"` if no `todo` entries remain)
3. **Immediately update that entry:**
   - `"status"` → `"in_progress"`
   - `"assignee"` → `"cowork-session-A"` or `"cowork-session-B"` (whichever you are)
4. Save `_index.json` — this prevents the other parallel session from picking the same restaurant

---

## Step 1 — Read the Index Entry

Open `_index.json` and note these fields for your claimed restaurant:

| Field | What to use it for |
|-------|--------------------|
| `id` | Used as the JSON file `id` field and in all item `id` prefixes |
| `name` | Official brand name — use exactly as written |
| `emoji` | Start emoji — can be changed if a better one exists |
| `cuisine` | Cuisine label — use the value from the index |
| `tab` | `"restaurant"` or `"grab_go"` — copy exactly |
| `nutritionUrl` | **Start here** for official nutrition data |
| `outputFile` | Path where your JSON must be saved (relative to `docs/food-data/`) |
| `notes` | Read these — they tell you what data is already available and any gotchas |
| `macroCompleteness` | `"high"` means full macros exist; `"low"` means calories only |

---

## Step 2 — Research Nutrition Data

### Primary sources (in order of preference):

1. **Brand's official Singapore website** — use the URL in `nutritionUrl`
   - Look for: Nutrition Calculator, Nutrition PDF, Menu with Calories, Allergen Info page
   - Use WebFetch to retrieve the page. If blocked, try searching `site:brand.com.sg nutrition`

2. **HPB Healthhub** — https://www.healthhub.sg/programmes/nutrition-tools
   - Search for the brand name

3. **MyNetDiary SG** — https://www.mynetdiary.com/food.do (community data — mark `verified: false`)

4. **Carb Manager** — community submissions (mark `verified: false`)

### What data to collect per item:

| Field | Required? | Notes |
|-------|-----------|-------|
| `name` | ✅ Yes | Exact menu name |
| `price` | ✅ Yes | SGD — standard menu price |
| `calories` | ✅ Yes | kcal per serving |
| `protein` | ✅ Yes | grams — use `0` if unavailable, add note in description |
| `carbs` | ✅ Yes | grams — use `0` if unavailable |
| `fat` | ✅ Yes | grams — use `0` if unavailable |
| `fibre` | Optional | Only include if published |
| `sugar` | Optional | Only include if published |
| `sodium` | Optional | Only include if published (mg) |
| `category` | ✅ Yes | Menu section (e.g. "Mains", "Sides", "Drinks") |

### Items to skip:
- Bundle deals / meal combos (nutrition varies by selection)
- Sauces with no published data
- Items with no price listed and no nutrition data at all

---

## Step 3 — Build the JSON File

### File format (must match `sgFoodDb.ts` schema exactly):

```json
{
  "id": "brand_slug",
  "name": "Official Brand Name",
  "emoji": "🍽️",
  "cuisine": "Cuisine Label",
  "tab": "grab_go",
  "aliases": [
    "brand name lowercase",
    "common short name",
    "any alternate spelling"
  ],
  "dietTags": [],
  "priceRange": "$$",
  "nutritionUrl": "https://brand.com.sg/nutrition",
  "lastUpdated": "2026-04-19",
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
      "fibre": 5,
      "category": "Mains",
      "compatibleWith": [],
      "isPopular": false,
      "description": "Brief one-line description of the item",
      "source": "official_sg",
      "verified": true,
      "lastVerified": "2026-04-19"
    }
  ]
}
```

### ID format rules:
- Restaurant `id`: lowercase brand slug, e.g. `"starbucks"`, `"toast_box"`, `"liho"`
- Menu item `id`: `{restaurantId}_{item_name_slugified}`, e.g. `"starbucks_caffe_latte_tall"`
- Slugify = lowercase, spaces and special chars → underscores, strip leading/trailing underscores

### Valid `tab` values:
- `"restaurant"` — dine-in chains (A&W, Jollibee, Popeyes)
- `"grab_go"` — delivery, quick counters, online order brands (Starbucks, Toast Box, LiHo, KOI)

### Valid `source` values:
- `"official_sg"` — brand's own SG website or PDF
- `"hpb"` — Health Promotion Board Singapore
- `"community"` — MyNetDiary, Carb Manager user submissions
- `"ai_estimate"` — only if estimating from USDA ingredient data

### `verified` flag:
- `true` — only for `official_sg` or `hpb` sources
- `false` — for `community` or `ai_estimate` sources

### `compatibleWith` — valid values:
`"halal"`, `"vegetarian"`, `"vegan"`, `"gluten_free"`, `"dairy_free"`, `"nut_free"`, `"low_carb"`, `"high_protein"`

Apply only if the item genuinely meets the criteria for that diet flag.

### `dietTags` on the restaurant object:
Only apply a tag here if the **entire brand** is certified (e.g. a fully halal-certified chain).

### `priceRange`:
- `"$"` — under $10/meal
- `"$$"` — $10–20
- `"$$$"` — $20–40
- `"$$$$"` — over $40

---

## Step 4 — Save the File

Save the completed JSON to the exact path listed in `outputFile` from `_index.json`.

Full path format:
```
/sessions/pensive-laughing-hopper/mnt/Fitness App/docs/food-data/{outputFile}
```

Example for Starbucks:
```
/sessions/pensive-laughing-hopper/mnt/Fitness App/docs/food-data/grab-and-go/starbucks_sg.json
```

---

## Step 5 — Update `_index.json`

Update the restaurant's entry in `_index.json`:

```json
{
  "status": "ready",
  "assignee": null,
  "itemCount": 24,
  "macroCompleteness": "high",
  "priceAvailable": true,
  "lastChecked": "2026-04-19"
}
```

Set `macroCompleteness`:
- `"high"` — protein/carbs/fat all populated from official source
- `"medium"` — macros populated from community source OR some items missing macros
- `"low"` — calories only, no macros

---

## Step 6 — Verify Before Finishing

Run these checks on your output file before marking `status: ready`:

- [ ] Every menu item has a unique `id`
- [ ] No `price` is `0.00` unless the item genuinely has no price (note it in `description`)
- [ ] No `calories` of `0` unless the item is genuinely zero-calorie
- [ ] `protein + carbs + fat` total ≈ `calories / 4` (rough sanity check — within 20% is fine)
- [ ] All `id` values follow the `brandslug_item_slug` format
- [ ] `tab` is either `"restaurant"` or `"grab_go"` (not `"grab & go"` or `"takeaway"`)
- [ ] `source` and `verified` are consistent with each other
- [ ] File is valid JSON (no trailing commas, no comments)

---

## Example: Completed Entry

See `docs/food-data/grab-and-go/grain_sg.json` for a real example with full macros from an official source.
See `docs/food-data/grab-and-go/saladbox_sg.json` for an example with calories-only data.

---

## What Happens Next

Once a file is marked `status: "ready"` in `_index.json`, it will be manually merged into `src/lib/sgFoodDb.ts` in the next sprint. The JSON format is identical to the data structure in that file, so merging is a direct copy of the menu array into the `SG_RESTAURANTS` export.
