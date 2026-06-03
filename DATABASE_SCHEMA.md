# Stride — Food Database Schema

> **Owner:** Dean (database research & verification)  
> **Last updated:** 2026-05-29  
> **Status:** Decided — pending implementation

---

## Overview

Four tables. `meals` is the core entity. Everything else references it.

```
restaurants  ──(1:N)──▶  meals  ──(1:N)──▶  meal_feedback
                           │                        │
                           └──(1:1)──▶  meal_community_stats
                                        (recomputed on feedback approval)
```

---

## Table: `meals`

The single table for all food items — restaurant menu items AND generic dishes (hawker, HPB estimates, USDA extracts). A nullable `restaurant_id` distinguishes them.

```sql
meals (
  -- Identity
  id                    UUID          PRIMARY KEY,
  restaurant_id         UUID?         FK → restaurants.id,   -- null = generic dish

  -- Naming & deduplication
  canonical_name        VARCHAR       UNIQUE NOT NULL,
  aliases               TEXT[],                              -- alternate names, search terms
  meal_type             ENUM          -- restaurant_item | generic_dish | recipe | ingredient
  status                ENUM          -- active | duplicate | archived
  canonical_meal_id     UUID?         FK → meals.id,         -- self-ref: if duplicate, points to canonical

  -- Serving
  serving_size_g        DECIMAL       NOT NULL,
  serving_note          VARCHAR?,                            -- e.g. "1 plate (350g)", "1 piece"

  -- Macros per serving (store these; derive per-100g on read)
  calories              DECIMAL       NOT NULL,
  protein_g             DECIMAL       NOT NULL,
  carbs_g               DECIMAL       NOT NULL,
  fat_g                 DECIMAL       NOT NULL,
  fibre_g               DECIMAL?,
  sodium_mg             DECIMAL?,
  -- NOTE: per_100g values are COMPUTED: (macro / serving_size_g) × 100
  -- Do not store separately — compute in query or application layer

  -- Price
  price_sgd             DECIMAL?,     -- fixed price for restaurant menu items
  price_min_sgd         DECIMAL?,     -- \
  price_max_sgd         DECIMAL?,     --  > range for generic dishes (hawker/HPB)
  price_typical_sgd     DECIMAL?,     -- /
  -- e.g. Chicken Rice: min=$3.50, max=$8.00, typical=$4.50

  -- Diet tags (boolean columns — indexed for fast filtering)
  is_halal              BOOLEAN,
  is_vegetarian         BOOLEAN,
  is_vegan              BOOLEAN,
  is_keto               BOOLEAN,
  is_gluten_free        BOOLEAN,
  is_high_protein       BOOLEAN,      -- COMPUTED: protein_g >= 25
  diet_tags_extra       TEXT[],       -- non-filterable extras

  -- Allergens (3-state: NULL=unknown · TRUE=contains · FALSE=verified free)
  -- CRITICAL: NULL means we don't know — show nothing to user, not "free from"
  -- Only populate from official_sg or hpb sources
  contains_gluten       BOOLEAN?,
  contains_dairy        BOOLEAN?,
  contains_eggs         BOOLEAN?,
  contains_peanuts      BOOLEAN?,
  contains_tree_nuts    BOOLEAN?,
  contains_shellfish    BOOLEAN?,
  contains_soy          BOOLEAN?,
  contains_sesame       BOOLEAN?,

  -- Ingredients
  ingredients           TEXT[],       -- list of ingredient names, can be empty

  -- Confidence & provenance
  confidence_tier       ENUM,         -- stride_approved | community | stride_estimate
  source                ENUM,         -- official_sg | hpb | usda | community | extracted
  source_url            VARCHAR?,
  verified              BOOLEAN       DEFAULT FALSE,
  verified_at           TIMESTAMP?,
  verified_by           VARCHAR?,
  last_verified         DATE?,

  -- Deduplication search
  search_vector         TSVECTOR,     -- full-text index: canonical_name + aliases

  -- Display
  emoji                 VARCHAR(10),
  image_url             VARCHAR?,
  description           TEXT?,

  -- Timestamps
  created_at            TIMESTAMP     DEFAULT NOW(),
  updated_at            TIMESTAMP     DEFAULT NOW()
)
```

### Key design decisions

**Single table for all meal types.** Restaurant items and generic dishes share 90% of fields. `restaurant_id` being nullable is the only structural difference. Avoids JOIN complexity and duplicate search logic.

**Per serving only — never store per-100g.** Storing both creates a sync problem. If serving size is corrected, per-100g would be stale. Always compute: `protein_per_100g = protein_g / serving_size_g * 100`.

**Boolean diet tag columns (not arrays).** `WHERE is_halal = true AND is_vegan = true` uses indexes and is fast. Array contains queries (`@>`) require special GIN indexes and are slower. Six core filterable tags get columns; anything else goes in `diet_tags_extra[]`.

**Three-state allergens (`BOOLEAN?` — nullable).** 
- `NULL` = unknown — show nothing to user
- `TRUE` = item contains this allergen — show warning  
- `FALSE` = verified free — show only with disclaimer  

Never show allergen claims unless source is `official_sg` or `hpb`. Add disclaimer: *"Always verify allergen information directly with the restaurant."*

**Self-referencing `canonical_meal_id`.** When a duplicate entry is detected and merged, the duplicate row gets `status = 'duplicate'` and `canonical_meal_id` pointing to the winner. The row is never deleted — existing user food logs reference it and must still resolve correctly.

---

## Table: `restaurants`

```sql
restaurants (
  id                    UUID          PRIMARY KEY,
  name                  VARCHAR       NOT NULL,
  aliases               TEXT[],                    -- for GPS fuzzy matching
  cuisine               VARCHAR,
  tier                  ENUM,         -- full_menu | estimated_menu | place_only
  service_types         TEXT[],       -- ['dine_in', 'grab_go', 'delivery']
  price_range           VARCHAR,      -- '$' | '$$' | '$$$'

  -- Halal (distinguish certified vs mixed venue)
  is_halal_certified    BOOLEAN,      -- entire outlet is halal certified
  is_halal_mixed        BOOLEAN,      -- halal counter exists within non-halal venue

  -- Data provenance
  nutrition_url         VARCHAR?,     -- official SG nutrition PDF
  logo_url              VARCHAR?,

  -- Timestamps
  created_at            TIMESTAMP     DEFAULT NOW(),
  updated_at            TIMESTAMP     DEFAULT NOW()
)
```

### Halal tagging rule

Distinguish three states for SG halal context:
- `is_halal_certified = true, is_halal_mixed = false` → whole outlet is halal (KFC, McDonald's SG)
- `is_halal_certified = false, is_halal_mixed = true` → halal stall within non-halal food court
- `is_halal_certified = false, is_halal_mixed = false` → not halal

Item-level `is_halal` on `meals` is the source of truth for filtering. Restaurant-level halal flags are for display context only.

---

## Table: `meal_feedback`

Stores every raw user submission. Never queried at search time — aggregated into `meal_community_stats`.

```sql
meal_feedback (
  id                    UUID          PRIMARY KEY,
  meal_id               UUID          FK → meals.id,
  user_id               UUID          FK → users.id,

  feedback_type         ENUM,
  -- macro_correction: user submits corrected macros
  -- price_correction: user submits corrected price
  -- accuracy_rating: user rates how accurate the data is (1–5)
  -- duplicate_flag: user flags this as a duplicate of another meal
  -- new_submission: user submits an entirely new meal

  -- Submitted values (all nullable — depends on feedback_type)
  submitted_calories    DECIMAL?,
  submitted_protein_g   DECIMAL?,
  submitted_carbs_g     DECIMAL?,
  submitted_fat_g       DECIMAL?,
  submitted_price_sgd   DECIMAL?,
  submitted_name        VARCHAR?,     -- for new_submission or rename suggestion
  accuracy_rating       INT?,         -- 1–5 stars
  comment               TEXT?,

  -- Moderation
  status                ENUM          DEFAULT 'pending',
  -- pending | approved | rejected
  reviewed_at           TIMESTAMP?,
  reviewed_by           VARCHAR?,

  created_at            TIMESTAMP     DEFAULT NOW()
)
```

---

## Table: `meal_community_stats`

Pre-aggregated stats per meal. Recomputed every time a `meal_feedback` row is approved — never at query time.

```sql
meal_community_stats (
  meal_id               UUID          PRIMARY KEY FK → meals.id,

  -- Volume
  feedback_count        INT           DEFAULT 0,

  -- Averages (computed from approved feedback only)
  avg_calories          DECIMAL,
  avg_protein_g         DECIMAL,
  avg_carbs_g           DECIMAL,
  avg_fat_g             DECIMAL,
  avg_price_sgd         DECIMAL,

  -- Reliability signal
  std_dev_calories      DECIMAL,
  -- HIGH std_dev (>20% of avg_calories) = inconsistent data
  -- → show range in UI instead of single average

  avg_accuracy_rating   DECIMAL,      -- 1.0–5.0

  last_updated          TIMESTAMP
)
```

### Display rules for community data

| Condition | What to show |
|-----------|-------------|
| `feedback_count < 3` | Do not show community stats |
| `feedback_count 3–4` | Show with "Based on X reports — may not be accurate" |
| `feedback_count >= 5` | Show averages as the displayed macro values |
| `std_dev_calories > 20% of avg` | Show as range: "~480–620 kcal" instead of "550 kcal" |
| Any community meal | Show 👥 Community badge, never show allergen data |

---

## Confidence Tier — Display Rules

| Tier | Badge | Condition | Allergens shown? |
|------|-------|-----------|-----------------|
| `stride_approved` | ✅ Stride Approved | source = official_sg or hpb, verified = true | Yes — with disclaimer |
| `community` | 👥 Community | source = community, feedback_count ≥ 3 | Never |
| `stride_estimate` | ~ Stride Estimate | source = usda or extracted | Never |

---

## Deduplication Flow

```
User submits meal name
        ↓
Normalize: lowercase, strip punctuation, trim
        ↓
Fuzzy match against existing canonical_names + aliases
        ↓
Similarity > 80%?  →  Block: "Did you mean [X]?"
Similarity 60–80%? →  Warn: "Similar meal exists" + require reason
Similarity < 60%?  →  Allow creation
        ↓
Admin dedup queue (periodic)
        ↓
Merge: losing row gets status='duplicate', canonical_meal_id=winner
       All aliases absorbed by winner
       All feedback rows re-pointed to winner
       Losing row stays in DB (protects existing user logs)
```

---

## Price Logic Summary

| Meal type | Price fields used | Example |
|-----------|------------------|---------|
| Restaurant menu item | `price_sgd` (fixed) | McSpicy = $7.10 always |
| Generic hawker dish | `price_min/max/typical` | Chicken Rice: $3.50–$8, typical $4.50 |
| Recipe | `price_typical_sgd` (estimated) | Home-cooked bowl ~$4 |

---

## Current sgFoodDb.ts → Schema Mapping

The existing TypeScript file (`src/lib/sgFoodDb.ts`) maps to this schema as follows:

| sgFoodDb field | Schema column |
|---------------|--------------|
| `item.id` | `meals.id` |
| `item.name` | `meals.canonical_name` |
| `restaurant.id` | `meals.restaurant_id` |
| `item.compatibleWith[]` | `meals.is_halal`, `is_vegan`, etc. |
| `item.source` | `meals.source` |
| `item.verified` | `meals.verified` |
| `item.lastVerified` | `meals.last_verified` |
| `item.price` | `meals.price_sgd` |
| `f.typicalPriceSgd` | `meals.price_typical_sgd` |
| `macroDbRef` | `meals.id` (self-reference via SG_MACRO_FOODS) |

**Not yet in sgFoodDb.ts** (to be added):
- `allergens` fields
- `ingredients[]`
- `confidence_tier` (currently inferred from `source + verified`)
- `price_min_sgd / price_max_sgd`
- `std_dev` / community stats

---

## Implementation Platform — Firebase / Firestore

**Decision (2026-05-29):** Stay on Firebase. Do not migrate to Supabase.

### Collection structure

```
/restaurants/{restaurantId}       ← maps to restaurants table
/meals/{mealId}                   ← maps to meals table
/meal_feedback/{feedbackId}       ← maps to meal_feedback table
/meal_community_stats/{mealId}    ← maps to meal_community_stats (keyed by meal ID)
```

### Firestore-specific adaptations

**Denormalise restaurant fields onto meals.**
Firestore has no JOINs. Store `restaurantName` and `restaurantEmoji` directly on each meal document so restaurant display data requires no secondary fetch.

**Search stays in sgFoodDb.ts (client-side).**
Firestore cannot do substring text search (`LIKE '%chicken%'`). The existing `searchAll()` function in `sgFoodDb.ts` provides fast, offline, client-side search across all meals. Firestore is used for persistence and user feedback — not search. `array-contains` queries work for exact alias matching. Algolia can be added later if search scale demands it.

**Computed fields stored on write.**
Firestore has no computed columns. `is_high_protein` (`protein_g >= 25`) and `confidence_tier` are computed and stored explicitly on every meal write or update.

**Community stats via Cloud Function.**
Firestore has no native aggregation. `meal_community_stats` documents are updated by a Cloud Function that triggers whenever a `meal_feedback` document's `status` field changes to `'approved'`. Never aggregate at query time.

**Deduplication enforced at application layer.**
No UNIQUE constraint in Firestore. Before writing a new meal, query for an exact `canonical_name` match. Fuzzy deduplication (80% similarity check) runs in application code before the Firestore write.

**Three-state allergens stored as `boolean | null`.**
Firestore supports null values. A missing/null allergen field means unknown — the app shows nothing. `true` = contains. `false` = verified free.

### Firestore security rules (planned)

```javascript
// /meals — public read, authenticated write
match /meals/{mealId} {
  allow read: if true;
  allow write: if request.auth != null;
}

// /meal_feedback — authenticated read/write, own documents only
match /meal_feedback/{feedbackId} {
  allow read: if request.auth != null;
  allow create: if request.auth.uid == request.resource.data.user_id;
  allow update: if false; // Cloud Function only
}

// /meal_community_stats — public read, Cloud Function write only
match /meal_community_stats/{mealId} {
  allow read: if true;
  allow write: if false; // Cloud Function only
}
```

---

*For session history and decisions: see `Stride_Work_Log.xlsx` Decision Log tab.*  
*For app developer guide: see `CLAUDE.md`.*
