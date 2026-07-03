/**
 * resolveDisplay — pure function to merge static + Firestore overlay data
 * ─────────────────────────────────────────────────────────────────────────────
 * Given an sgFoodDb item and an optional Firestore overlay, returns the values
 * that should actually be rendered (badge tier, community note).
 *
 * Static data always wins for stride_approved items (we trust the official SG
 * source). Overlay enriches community/estimated items and provides the
 * five-tier confidence classification.
 */

import type { SGMenuItem }      from '@/lib/sgFoodDb';
import type { MealOverlay }     from '@/lib/useMealOverlay';
import type { ConfidenceTier }  from '@/lib/firestoreFoodDb';

/** Minimum number of corroborated user reports before showing a community note. */
const COMMUNITY_NOTE_THRESHOLD = 5;

export interface DisplayResolution {
  /** Five-tier confidence tier. null = derive from static item fields as before. */
  confidenceTier: ConfidenceTier | null;
  /** e.g. "👥 12 users report ~450 cal · 28g protein". null = don't show. */
  communityNote:  string | null;
}

export function resolveDisplay(
  item:    SGMenuItem,
  overlay: MealOverlay | null | undefined,
): DisplayResolution {
  const meal  = overlay?.meal;
  const stats = overlay?.stats;

  // ── Confidence tier ───────────────────────────────────────────────────────
  // Prefer the Firestore-stored tier (set by admin/aggregation) if available;
  // otherwise return null so ConfidenceBadge falls back to static source/verified.
  const confidenceTier: ConfidenceTier | null = meal?.confidenceTier ?? null;

  // ── Community note ────────────────────────────────────────────────────────
  // Show only when ≥COMMUNITY_NOTE_THRESHOLD users have submitted approved feedback.
  // Intentionally does NOT overwrite official macros — displayed as "users report"
  // so the distinction is clear.
  let communityNote: string | null = null;

  if (stats && stats.feedbackCount >= COMMUNITY_NOTE_THRESHOLD) {
    const parts: string[] = [];
    if (stats.avgCalories != null)  parts.push(`~${Math.round(stats.avgCalories)} cal`);
    if (stats.avgProteinG != null)  parts.push(`${Math.round(stats.avgProteinG)}g protein`);
    if (parts.length > 0) {
      communityNote = `👥 ${stats.feedbackCount} users report ${parts.join(' · ')}`;
    }
  }

  return { confidenceTier, communityNote };
}
