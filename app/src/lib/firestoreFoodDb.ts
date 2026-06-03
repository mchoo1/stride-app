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
export type ConfidenceTier = 'stride_approved' | 'community' | 'stride_estimate';

/**
 * Meal type — what kind of food item this is.
 */
export type MealType = 'restaurant_item' | 'generic_dish' | 'recipe' | 'ingredient';

// ─── /restaurants/{restaurantId} ─────────────────────────────────────────────

export interface FirestoreRestaurant {
  id:                 string;
  name:               string;
  emoji:              string;
  aliases:            string[];
  cuisine:            string;
  tier:               'full_menu' | 'estimated_menu' | 'place_only';
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
