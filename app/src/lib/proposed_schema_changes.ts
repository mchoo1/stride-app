/**
 * proposed_schema_changes.ts  —  DRAFT, not yet wired in
 * ----------------------------------------------------------------------------
 * Re-based onto the REAL schema (firestoreFoodDb.ts + sgFoodDb.ts +
 * DATABASE_SCHEMA.md), after the MVP roadmap review (Opus, 3-Jun-26).
 *
 * What the real schema ALREADY has (do NOT re-add):
 *   - One unified /meals collection; trust is a stored field (confidenceTier).
 *   - Feedback as a signal: /meal_feedback + /meal_community_stats, with
 *     pending/approved/rejected moderation and feedback_count thresholds.
 *   - Three-state allergens, never community-promoted (per DATABASE_SCHEMA.md).
 *
 * What is GENUINELY still missing — the three pieces drafted below:
 *   1. macroSpecificity — guards the "generic data tagged onto a named outlet"
 *      implied-precision trap. Currently inexpressible: restaurant_id is either
 *      set (looks measured) or null (generic), with no middle state.
 *   2. setComponents — structured set-meal composition. Today: free-text
 *      setIncludes on SGMenuItem; nothing at all on FirestoreMeal.
 *   3. evaluateCommunityCorroboration — median ±10% promotion gating, an
 *      enhancement over the current mean + stdDev display rule. Lands before
 *      the (not-yet-built) community-stats Cloud Function.
 *
 * Once reviewed, fold the commented interface blocks into firestoreFoodDb.ts /
 * sgFoodDb.ts and move the helpers where they belong. Per project convention,
 * this is paste-ready code only — no live file is modified.
 * ----------------------------------------------------------------------------
 */

// ===========================================================================
// PIECE 1 — macroSpecificity (the generic-tagged guard)
// ===========================================================================

/**
 * Whether a meal's macros are specific to THIS outlet, or a generic estimate
 * merely tagged onto it.
 *
 *   'outlet_specific' — sourced for this exact restaurantId (brand PDF / HPB
 *                       entry for the named outlet). Safe to present as the
 *                       outlet's real numbers.
 *   'generic'         — a generic_dish; restaurantId is null by design
 *                       (plain "Chicken Rice", a population reference).
 *   'generic_tagged'  — restaurantId IS set, but the macros are borrowed from a
 *                       generic reference (see macroSourceMealId). The dangerous
 *                       case: it LOOKS measured for that outlet but is an HPB
 *                       average. MUST render the estimate caveat and MUST NOT be
 *                       promoted to stride_approved on outlet specificity alone.
 */
export type MacroSpecificity = 'outlet_specific' | 'generic' | 'generic_tagged';

/**
 * --- Fields to ADD to FirestoreMeal (firestoreFoodDb.ts) ---
 *
 * interface FirestoreMeal {
 *   ... existing fields ...
 *
 *   macroSpecificity:    MacroSpecificity;   // NEW — required; backfill rule below
 *   macroSourceMealId?:  string | null;      // NEW — when 'generic_tagged', the
 *                                            //   /meals id the macros are borrowed
 *                                            //   from. Keep the pointer; NEVER copy
 *                                            //   the macros onto this doc. Mirrors
 *                                            //   the existing canonical_meal_id /
 *                                            //   macroDbRef self-reference pattern.
 * }
 *
 * Backfill rule for existing rows:
 *   restaurantId != null  &&  source in (official_sg, hpb)  → 'outlet_specific'
 *   restaurantId == null                                    → 'generic'
 *   restaurantId != null  &&  macros came from a macroDbRef  → 'generic_tagged'
 *
 * --- Mirror on SGMenuItem (sgFoodDb.ts) ---
 * SGMenuItem already has macroDbRef (the pointer). Add only the flag:
 *
 *   macroSpecificity?: MacroSpecificity;   // default 'outlet_specific'
 */

/** Caveat to surface beside any generic_tagged item. */
export const GENERIC_TAGGED_CAVEAT =
  'Estimated - HPB population average, not measured at this outlet.';

// ===========================================================================
// PIECE 2 — setComponents (structured set meals)
// ===========================================================================

/**
 * One component of a set/combo meal, BY REFERENCE to another meal/item id.
 * Replaces the free-text setIncludes: string[] on SGMenuItem.
 */
export interface SetComponent {
  /** References SGMenuItem.id (client) / FirestoreMeal.id (persistence) */
  mealId: string;
  /** How many of that component the set includes — default 1 */
  qty: number;
}

/**
 * --- Fields to ADD ---
 *
 * SGMenuItem (sgFoodDb.ts) already has isSetMeal + setIncludes. Add:
 *   setComponents?: SetComponent[];   // structured replacement for setIncludes
 *   // setIncludes?: string[];        // DEPRECATED — keep until migrated, then remove
 *   visibility?: 'menu' | 'component_only';  // 'component_only' = a set part
 *                                            //   (Medium Fries, Regular Coke) that
 *                                            //   isn't sold standalone; entered once,
 *                                            //   hidden from the orderable menu.
 *
 * FirestoreMeal (firestoreFoodDb.ts) has NO set concept today. Add:
 *   isSetMeal?:      boolean;
 *   setComponents?:  SetComponent[];
 *   visibility?:     'menu' | 'component_only';
 *
 * IMPORTANT — the set keeps its OWN stored macros (calories/proteinG/...) as
 * authoritative, so it works even when a brand only publishes a combined figure
 * and the parts can't be decomposed. setComponents is an enrichment + cross-check
 * layer (see computeSetMacros), NEVER a hard dependency.
 */

/**
 * Cross-check a set meal's stored macros by summing its component items.
 * VALIDATION tool, not the source of truth. Any component that can't be
 * resolved is reported in `unresolved` rather than silently dropped, so the
 * caller falls back to the set's stored total instead of trusting an undercount.
 *
 * Usage:
 *   - unresolved empty  → compare `macros` to the set's stored totals; warn if
 *                         they diverge beyond tolerance (e.g. ±5%).
 *   - unresolved present → ignore `macros`; keep the stored total.
 */
export function computeSetMacros(
  components: SetComponent[],
  lookup: (mealId: string) => {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  } | null,
): {
  macros: { calories: number; proteinG: number; carbsG: number; fatG: number };
  unresolved: string[];
} {
  const unresolved: string[] = [];
  const macros = components.reduce(
    (acc, c) => {
      const m = lookup(c.mealId);
      if (!m) {
        unresolved.push(c.mealId); // surface it — never silently undercount
        return acc;
      }
      const q = c.qty ?? 1;
      acc.calories += m.calories * q;
      acc.proteinG += m.proteinG * q;
      acc.carbsG += m.carbsG * q;
      acc.fatG += m.fatG * q;
      return acc;
    },
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
  return { macros, unresolved };
}

// ===========================================================================
// PIECE 3 — community corroboration (median ±10% promotion gating)
// ===========================================================================
// Enhances the DATABASE_SCHEMA.md display rules (hide <3, caveat 3-4,
// average >=5, range when stdDev >20% of avg) by:
//   - using the MEDIAN, robust to a few wild outliers (vs the current mean),
//   - requiring genuine AGREEMENT (share within ±10% of median), not just count,
//   - never promoting allergen/safety fields on community signal.
// Intended to run inside the (Phase 2) community-stats Cloud Function.

/** A field a user can correct via meal_feedback. */
export type CorrectableField = 'calories' | 'proteinG' | 'carbsG' | 'fatG' | 'priceSgd';

/** Min approved submissions before community data may be shown at all. */
export const CORROBORATION_MIN_REPORTS = 3;
/** Min submissions before averages become the DISPLAYED value. */
export const CORROBORATION_DISPLAY_REPORTS = 5;
/** A submission "agrees" if within ±10% of the median. */
export const CORROBORATION_TOLERANCE = 0.10;
/** Share of submissions that must agree to treat the value as corroborated. */
export const CORROBORATION_AGREEMENT = 0.8;
/** stdDev above this share of the median → show a range, not a point value. */
export const CORROBORATION_RANGE_STDDEV = 0.20;

/**
 * Fields that must NEVER be community-promoted — only staff/official may set
 * them (matches DATABASE_SCHEMA.md: "Any community meal — never show allergens").
 */
export const NON_COMMUNITY_PROMOTABLE: ReadonlySet<string> = new Set([
  'allergens',
  'isHalal',
  'contains_gluten',
  'contains_dairy',
  'contains_eggs',
  'contains_peanuts',
  'contains_tree_nuts',
  'contains_shellfish',
  'contains_soy',
  'contains_sesame',
]);

/** What the app should display for this field given the community evidence. */
export type DisplayRecommendation = 'hide' | 'caveat' | 'average' | 'range';

export interface CorroborationResult {
  /** True if the value is corroborated enough to become the displayed macro. */
  promote: boolean;
  /** Median of submitted values — the robust central estimate. */
  median: number | null;
  /** Share of submissions within ±10% of the median (0..1). */
  agreement: number;
  /** Sample standard deviation of the submissions. */
  stdDev: number | null;
  /** How the app should present it (mirrors DATABASE_SCHEMA.md display rules). */
  recommendDisplay: DisplayRecommendation;
}

/**
 * Decide whether community submissions for one (mealId, field) corroborate,
 * and how the value should be displayed.
 *
 * @param values  every APPROVED submittedValue for this field
 * @param field   which field — used to enforce the allergen/safety guard
 */
export function evaluateCommunityCorroboration(
  values: number[],
  field: CorrectableField | string,
): CorroborationResult {
  // Safety/allergen fields are never community-driven.
  if (NON_COMMUNITY_PROMOTABLE.has(field)) {
    return { promote: false, median: null, agreement: 0, stdDev: null, recommendDisplay: 'hide' };
  }

  const n = values.length;
  if (n < CORROBORATION_MIN_REPORTS) {
    return { promote: false, median: null, agreement: 0, stdDev: null, recommendDisplay: 'hide' };
  }

  // Median (robust to outliers).
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  // Agreement: share within ±10% of the median.
  const band = Math.abs(CORROBORATION_TOLERANCE * median);
  const within = values.filter((v) => Math.abs(v - median) <= band).length;
  const agreement = within / n;

  // Sample standard deviation (for the range-vs-point display decision).
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const variance =
    n > 1 ? values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1) : 0;
  const stdDev = Math.sqrt(variance);

  const corroborated = agreement >= CORROBORATION_AGREEMENT;
  const enoughToDisplay = n >= CORROBORATION_DISPLAY_REPORTS;
  const noisy = median !== 0 && stdDev / Math.abs(median) > CORROBORATION_RANGE_STDDEV;

  let recommendDisplay: DisplayRecommendation;
  if (!enoughToDisplay) {
    recommendDisplay = 'caveat'; // 3-4 reports — show with "may not be accurate"
  } else if (noisy || !corroborated) {
    recommendDisplay = 'range'; // disagreement → show a range, not a point
  } else {
    recommendDisplay = 'average'; // >=5 reports, tight agreement → use the value
  }

  // Promote to the displayed value only when both volume AND agreement hold.
  const promote = enoughToDisplay && corroborated && !noisy;

  return { promote, median, agreement, stdDev, recommendDisplay };
}
