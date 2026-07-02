/**
 * Firestore Food Database — TypeScript types
 * ─────────────────────────────────────────────────────────────────────────────
 * Typed interfaces for documents written to and read from the four
 * food-database Firestore collections:
 *
 *   /restaurants/{restaurantId}
 *   /meals/{mealId}
 *   /meal_feedback/{feedbackId}
 *   /meal_community_stats/{mealId}
 *
 * These are distinct from the sgFoodDb.ts TypeScript interfaces — those are
 * the in-memory client-side search layer. These are the Firestore persistence
 * layer documents.
 *
 * Seeded by: app/scripts/seed-sg-food-db.ts
 * Rules:     app/firestore.rules  (/restaurants, /meals, /meal_feedback, /meal_community_stats)
 */

import type { FieldValue, Timestamp } from 'firebase/firestore';

// ─── Confidence tier ─────────────────────────────────────────────────────────

/**
 * How confident we are in this meal's data.
 *   stride_approved — official SG brand PDF or HPB, verified: true
 *   community       — user-submitted or user-verified data (feedback_count >= 3)
 *   stride_estimate — extracted from USDA or external DB, not SG-specific
 */
export type ConfidenceTier =
  | 'stride_approved'    // independent official source (brand PDF / HPB), verified
  | 'merchant_verified'  // first-party, from a verified restaurant/merchant account
  | 'staff_verified'     // a community/single submission we checked against a source
  | 'community'          // ≥5 users corroborated
  | 'stride_estimate';   // USDA / extracted / uncorroborated

/** Who set/verified the current data (drives badge + audit). */
export type VerifiedByRole = 'staff' | 'merchant' | 'system';

/**
 * Meal type — what kind of food item this is.
 */
export type MealType = 'restaurant_item' | 'generic_dish' | 'recipe' | 'ingredient';

/**
 * Whether a meal's macros are specific to THIS outlet, or a generic estimate
 * merely tagged onto it. Guards the implied-precision trap: a generic HPB
 * average pinned to a named restaurant looks measured but isn't.
 *
 *   stride_approved badge is only honest for 'outlet_specific'.
 *
 *   'outlet_specific' — sourced for this exact restaurantId (brand PDF / HPB
 *                       entry for the named outlet).
 *   'generic'         — a generic_dish; restaurantId is null by design.
 *   'generic_tagged'  — restaurantId IS set, but macros are borrowed from a
 *                       generic reference (see macroSourceMealId). MUST render
 *                       the GENERIC_TAGGED_CAVEAT and MUST NOT be promoted to
 *                       stride_approved on outlet specificity alone.
 */
export type MacroSpecificity = 'outlet_specific' | 'generic' | 'generic_tagged';

/** Caveat to surface beside any generic_tagged meal. */
export const GENERIC_TAGGED_CAVEAT =
  'Estimated - HPB population average, not measured at this outlet.';

/**
 * One component of a set/combo meal, by REFERENCE to another meal id.
 * Lets a set's macros be cross-checked from its parts (see computeSetMacros)
 * instead of being double-entered.
 */
export interface SetComponent {
  /** References FirestoreMeal.id */
  mealId: string;
  /** How many of that component the set includes — default 1 */
  qty: number;
}

// ─── /restaurants/{restaurantId} ─────────────────────────────────────────────

export interface FirestoreRestaurant {
  id:                 string;
  name:               string;
  emoji:              string;
  aliases:            string[];
  cuisine:            string;
  tier:               'full_menu' | 'partial_menu' | 'estimated_menu' | 'place_only';
  serviceTypes:       string[];
  priceRange:         string;
  dietTags:           string[];

  // Halal — distinguish certified vs mixed venue
  isHalalCertified:   boolean;
  isHalalMixed:       boolean;

  nutritionUrl?:      string;
  lastUpdated?:       string;

  createdAt:          Timestamp | FieldValue;
  updatedAt:          Timestamp | FieldValue;
}

// ─── /meals/{mealId} ─────────────────────────────────────────────────────────

export interface FirestoreAllergens {
  gluten?:    boolean | null;
  dairy?:     boolean | null;
  eggs?:      boolean | null;
  peanuts?:   boolean | null;
  treeNuts?:  boolean | null;
  shellfish?: boolean | null;
  soy?:       boolean | null;
  sesame?:    boolean | null;
}

export interface FirestoreMeal {
  id:               string;
  mealType:         MealType;
  status:           'active' | 'duplicate' | 'archived';

  // Restaurant link (null for generic dishes)
  restaurantId?:    string | null;
  restaurantName?:  string | null;   // denormalized for display
  restaurantEmoji?: string | null;   // denormalized for display

  // Naming & dedup
  canonicalName:    string;
  aliases:          string[];
  searchTokens:     string[];        // lowercase tokens for array-contains search

  // Serving
  servingSizeG?:    number | null;
  servingNote?:     string;

  // Macros per serving
  calories:         number;
  proteinG:         number;
  carbsG:           number;
  fatG:             number;
  fibreG?:          number | null;
  sodiumMg?:        number | null;

  // Price
  priceSgd?:        number | null;   // fixed — restaurant items
  priceMinSgd?:     number | null;   // range — generic dishes
  priceMaxSgd?:     number | null;
  priceTypicalSgd?: number | null;

  // Diet tags (boolean columns — indexed for fast filtering)
  isHalal:          boolean;
  isVegetarian:     boolean;
  isVegan:          boolean;
  isKeto:           boolean;
  isGlutenFree:     boolean;
  isHighProtein:    boolean;         // computed: proteinG >= 25

  // Allergens — MVP: logged but NOT displayed in app yet
  // See SGAllergens docs in sgFoodDb.ts for three-state rules
  allergens?:       FirestoreAllergens | null;

  // Ingredients
  ingredients?:     string[];

  // Confidence & provenance
  confidenceTier:   ConfidenceTier;
  source:           string;
  sourceUrl?:       string;
  verified:         boolean;
  lastVerified?:    string | null;
  /** Who set/verified the current value — for the badge + audit trail. */
  verifiedByRole?:  VerifiedByRole;

  // Macro specificity — guards generic-data-tagged-onto-an-outlet
  // (optional for back-compat; backfill rule in proposed_schema_changes.ts / seed):
  //   restaurantId != null && source in (official_sg, hpb) → 'outlet_specific'
  //   restaurantId == null                                 → 'generic'
  //   restaurantId != null && macros from a macroSourceMealId → 'generic_tagged'
  macroSpecificity?:  MacroSpecificity;
  /** When 'generic_tagged', the /meals id the macros are borrowed from. Keep
   *  the pointer; NEVER copy the macros onto this doc. */
  macroSourceMealId?: string | null;

  // Set / combo meals (optional — only present on set items)
  isSetMeal?:       boolean;
  /** Structured composition by reference. The set keeps its OWN stored macros
   *  as authoritative; setComponents is an enrichment + cross-check layer. */
  setComponents?:   SetComponent[];
  /** 'component_only' = a set part (e.g. Medium Fries) not sold standalone —
   *  full macros, hidden from the orderable menu. Default behaviour is 'menu'. */
  visibility?:      'menu' | 'component_only';

  // Display
  emoji:            string;
  category?:        string;
  imageUrl?:        string | null;
  description?:     string;

  createdAt:        Timestamp | FieldValue;
  updatedAt:        Timestamp | FieldValue;
}

// ─── /meal_feedback/{feedbackId} ─────────────────────────────────────────────

export type FeedbackType =
  | 'macro_correction'
  | 'price_correction'
  | 'accuracy_rating'
  | 'duplicate_flag'
  | 'new_submission';

export interface FirestoreMealFeedback {
  id:                  string;
  mealId:              string;
  userId:              string;
  feedbackType:        FeedbackType;

  /** Role of the submitter — a merchant's submission is first-party (Method 3). */
  submitterRole?:      'user' | 'merchant' | 'staff';

  // Submitted values (all optional — depends on feedbackType)
  submittedCalories?:  number | null;
  submittedProteinG?:  number | null;
  submittedCarbsG?:    number | null;
  submittedFatG?:      number | null;
  submittedPriceSgd?:  number | null;
  submittedName?:      string | null;
  accuracyRating?:     number | null;   // 1–5
  comment?:            string | null;

  // For duplicate_flag
  duplicateOfMealId?:  string | null;

  // Moderation
  status:              'pending' | 'approved' | 'rejected';
  reviewedAt?:         Timestamp | null;
  reviewedBy?:         string | null;

  createdAt:           Timestamp | FieldValue;
}

// ─── /meal_community_stats/{mealId} ──────────────────────────────────────────

export interface FirestoreMealCommunityStats {
  mealId:             string;
  feedbackCount:      number;

  // Averages (from approved feedback only)
  avgCalories?:       number | null;
  avgProteinG?:       number | null;
  avgCarbsG?:         number | null;
  avgFatG?:           number | null;
  avgPriceSgd?:       number | null;
  avgAccuracyRating?: number | null;   // 1.0–5.0

  // Reliability signal: high stdDev → show range not average
  stdDevCalories?:    number | null;

  lastUpdated:        Timestamp | FieldValue;
}

// ─── Helper: derive confidence tier from source + verified ───────────────────

export function deriveConfidenceTier(
  source?: string,
  verified?: boolean
): ConfidenceTier {
  if ((source === 'official_sg' || source === 'hpb') && verified) {
    return 'stride_approved';
  }
  if (source === 'community' || source === 'ai_estimate') {
    return 'community';
  }
  return 'stride_estimate';
}

// ─── Helper: derive macro specificity ────────────────────────────────────────

/**
 * Derive how outlet-specific a meal's macros are, from its restaurant link and
 * whether the macros are borrowed from a generic reference.
 *
 *   restaurantId == null                 → 'generic'        (a generic_dish)
 *   restaurantId != null && macroRef set → 'generic_tagged' (HPB avg pinned to
 *                                           a named outlet — show the caveat)
 *   restaurantId != null && no macroRef  → 'outlet_specific'
 *
 * @param restaurantId  the meal's restaurant link (null for generic dishes)
 * @param macroSourceMealId  the macroDbRef pointer, if the macros are borrowed
 */
export function deriveMacroSpecificity(
  restaurantId?: string | null,
  macroSourceMealId?: string | null,
): MacroSpecificity {
  if (!restaurantId) return 'generic';
  if (macroSourceMealId) return 'generic_tagged';
  return 'outlet_specific';
}

// ─── Helper: map DietaryFlag[] → boolean diet fields ─────────────────────────

export function mapDietFlags(flags: string[]): {
  isHalal: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isKeto: boolean;
  isGlutenFree: boolean;
} {
  return {
    isHalal:      flags.includes('halal'),
    isVegetarian: flags.includes('vegetarian') || flags.includes('vegan'),
    isVegan:      flags.includes('vegan'),
    isKeto:       flags.includes('keto'),
    isGlutenFree: flags.includes('gluten_free'),
  };
}

// ─── Helper: generate search tokens from name + aliases ──────────────────────

export function buildSearchTokens(name: string, aliases: string[] = []): string[] {
  const tokens = new Set<string>();
  const addTokens = (str: string) => {
    const lower = str.toLowerCase().trim();
    tokens.add(lower);
    lower.split(/[\s\-\/]+/).forEach(t => { if (t.length > 1) tokens.add(t); });
  };
  addTokens(name);
  aliases.forEach(addTokens);
  return Array.from(tokens);
}

// ─── Helper: cross-check a set meal's macros from its components ──────────────

/**
 * Sum a set meal's component macros. VALIDATION tool, not the source of truth —
 * the set's own stored macros stay authoritative. Unresolved components are
 * REPORTED (never silently dropped), so the caller can fall back to the stored
 * total instead of trusting an undercount.
 *
 * Usage:
 *   - unresolved empty   → compare `macros` to stored totals; warn if they
 *                          diverge beyond tolerance (e.g. ±5%).
 *   - unresolved present → ignore `macros`; keep the set's stored total.
 */
export function computeSetMacros(
  components: SetComponent[],
  lookup: (mealId: string) => {
    calories: number; proteinG: number; carbsG: number; fatG: number;
  } | null,
): {
  macros: { calories: number; proteinG: number; carbsG: number; fatG: number };
  unresolved: string[];
} {
  const unresolved: string[] = [];
  const macros = components.reduce(
    (acc, c) => {
      const m = lookup(c.mealId);
      if (!m) { unresolved.push(c.mealId); return acc; }
      const q = c.qty ?? 1;
      acc.calories += m.calories * q;
      acc.proteinG += m.proteinG * q;
      acc.carbsG  += m.carbsG  * q;
      acc.fatG    += m.fatG    * q;
      return acc;
    },
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
  return { macros, unresolved };
}

// ─── Helper: community corroboration (median ±10% promotion gating) ───────────
// Enhances the DATABASE_SCHEMA.md display rules (hide <3, caveat 3-4,
// average >=5, range when stdDev >20% of avg) by using the MEDIAN (robust to
// outliers) and requiring genuine AGREEMENT, not just a count. Never promotes
// allergen/safety fields. Intended for the (Phase 2) community-stats Cloud Fn.

/** A field a user can correct via meal_feedback. */
export type CorrectableField =
  | 'calories' | 'proteinG' | 'carbsG' | 'fatG' | 'priceSgd';

export const CORROBORATION_MIN_REPORTS     = 3;    // show with caveat at/above
export const CORROBORATION_DISPLAY_REPORTS = 5;    // averages become displayed value
export const CORROBORATION_TOLERANCE       = 0.10; // ±10% of median = "agrees"
export const CORROBORATION_AGREEMENT       = 0.8;  // share that must agree
export const CORROBORATION_RANGE_STDDEV    = 0.20; // stdDev/median above → range

/** Fields that must NEVER be community-promoted (DATABASE_SCHEMA.md). */
export const NON_COMMUNITY_PROMOTABLE: ReadonlySet<string> = new Set([
  'allergens', 'isHalal',
  'contains_gluten', 'contains_dairy', 'contains_eggs', 'contains_peanuts',
  'contains_tree_nuts', 'contains_shellfish', 'contains_soy', 'contains_sesame',
]);

export type DisplayRecommendation = 'hide' | 'caveat' | 'average' | 'range';

export interface CorroborationResult {
  promote: boolean;             // value is corroborated enough to display
  median: number | null;
  agreement: number;            // share within ±10% of median (0..1)
  stdDev: number | null;
  recommendDisplay: DisplayRecommendation;
}

export function evaluateCommunityCorroboration(
  values: number[],
  field: CorrectableField | string,
): CorroborationResult {
  if (NON_COMMUNITY_PROMOTABLE.has(field)) {
    return { promote: false, median: null, agreement: 0, stdDev: null, recommendDisplay: 'hide' };
  }
  const n = values.length;
  if (n < CORROBORATION_MIN_REPORTS) {
    return { promote: false, median: null, agreement: 0, stdDev: null, recommendDisplay: 'hide' };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;

  const band = Math.abs(CORROBORATION_TOLERANCE * median);
  const within = values.filter((v) => Math.abs(v - median) <= band).length;
  const agreement = within / n;

  const mean = values.reduce((s, v) => s + v, 0) / n;
  const variance = n > 1 ? values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1) : 0;
  const stdDev = Math.sqrt(variance);

  const corroborated   = agreement >= CORROBORATION_AGREEMENT;
  const enoughToDisplay = n >= CORROBORATION_DISPLAY_REPORTS;
  const noisy = median !== 0 && stdDev / Math.abs(median) > CORROBORATION_RANGE_STDDEV;

  let recommendDisplay: DisplayRecommendation;
  if (!enoughToDisplay)            recommendDisplay = 'caveat';
  else if (noisy || !corroborated) recommendDisplay = 'range';
  else                             recommendDisplay = 'average';

  return {
    promote: enoughToDisplay && corroborated && !noisy,
    median, agreement, stdDev, recommendDisplay,
  };
}
