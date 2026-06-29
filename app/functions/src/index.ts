/**
 * Stride Cloud Functions — closes the community-feedback loop.
 * ─────────────────────────────────────────────────────────────────────────────
 * Trigger : any write to /meal_feedback/{feedbackId}
 * Action  : recompute /meal_community_stats/{mealId} from that meal's feedback,
 *           using MEDIAN-based aggregation (robust to outliers).
 *
 * This is the runtime counterpart to evaluateCommunityCorroboration() in
 * app/src/lib/firestoreFoodDb.ts — keep the thresholds in sync.
 *
 * Deploy:  cd app/functions && npm install && npm run deploy
 * (Requires the Firebase project on the Blaze plan + `firebase login`.)
 */

import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp();
const db = getFirestore();

/**
 * Which feedback counts toward stats.
 * No moderation UI exists yet, so we count 'pending' + 'approved' and rely on
 * the corroboration thresholds (below) as the safety gate. Once a moderation
 * step exists, narrow this to just ['approved', 'accepted'].
 */
const COUNTABLE = new Set(['pending', 'approved', 'counted', 'accepted']);

// Display thresholds — mirror DATABASE_SCHEMA.md community display rules.
const MIN_REPORTS = 3;      // < this  → hide community stats entirely
const DISPLAY_REPORTS = 5;  // >= this → averages may become the shown value
const RANGE_STDDEV = 0.20;  // stdDev/median above this → show a range, not a point

// ─── math helpers ─────────────────────────────────────────────────────────────

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function stddev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (xs.length - 1));
}
function nums(rows: FirebaseFirestore.DocumentData[], field: string): number[] {
  return rows.map((r) => r[field]).filter((v) => typeof v === 'number' && isFinite(v));
}

/** How the app should present the community calories (mirrors the helper). */
function recommendDisplay(count: number, med: number | null, sd: number | null):
  'hide' | 'caveat' | 'average' | 'range' {
  if (count < MIN_REPORTS) return 'hide';
  if (count < DISPLAY_REPORTS) return 'caveat';
  if (med && sd && med !== 0 && sd / Math.abs(med) > RANGE_STDDEV) return 'range';
  return 'average';
}

// ─── trigger ────────────────────────────────────────────────────────────────

export const aggregateMealFeedback = onDocumentWritten(
  'meal_feedback/{feedbackId}',
  async (event) => {
    const after = event.data?.after?.data();
    const before = event.data?.before?.data();
    const mealId = (after?.mealId ?? before?.mealId) as string | undefined;
    if (!mealId) {
      logger.warn('meal_feedback write had no mealId — skipping');
      return;
    }

    // Pull every piece of feedback for this meal and keep the countable ones.
    const snap = await db.collection('meal_feedback').where('mealId', '==', mealId).get();
    const rows = snap.docs
      .map((d) => d.data())
      .filter((r) => COUNTABLE.has(String(r.status ?? 'pending')));

    const cal = nums(rows, 'submittedCalories');
    const pro = nums(rows, 'submittedProteinG');
    const car = nums(rows, 'submittedCarbsG');
    const fat = nums(rows, 'submittedFatG');
    const price = nums(rows, 'submittedPriceSgd');
    const ratings = nums(rows, 'accuracyRating');

    // feedbackCount = macro/price corrections that actually contribute a value.
    const feedbackCount = rows.filter(
      (r) => r.feedbackType === 'macro_correction' || r.feedbackType === 'price_correction',
    ).length;

    const medCal = cal.length ? median(cal) : null;
    const sdCal = cal.length > 1 ? stddev(cal) : null;

    const stats = {
      mealId,
      feedbackCount,
      // medians (robust) stored in the avg* fields per the existing schema
      avgCalories: medCal !== null ? Math.round(medCal) : null,
      avgProteinG: pro.length ? Math.round(median(pro) * 10) / 10 : null,
      avgCarbsG: car.length ? Math.round(median(car) * 10) / 10 : null,
      avgFatG: fat.length ? Math.round(median(fat) * 10) / 10 : null,
      avgPriceSgd: price.length ? Math.round(median(price) * 100) / 100 : null,
      avgAccuracyRating: ratings.length
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null,
      stdDevCalories: sdCal !== null ? Math.round(sdCal) : null,
      // extra hint for the display layer (step 4) — safe to ignore if unused
      caloriesDisplay: recommendDisplay(feedbackCount, medCal, sdCal),
      lastUpdated: FieldValue.serverTimestamp(),
    };

    await db.collection('meal_community_stats').doc(mealId).set(stats, { merge: true });
    logger.info(`community_stats updated: ${mealId} (${feedbackCount} reports)`);
  },
);
