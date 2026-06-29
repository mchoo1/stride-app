/**
 * POST /api/meal-feedback
 * ─────────────────────────────────────────────────────────────────────────────
 * Accept user feedback on a meal item and write to /meal_feedback collection.
 *
 * Feedback types:
 *   macro_correction  — user submits corrected macro values
 *   price_correction  — user submits corrected price
 *   accuracy_rating   — user rates how accurate the current data is (1–5)
 *   duplicate_flag    — user flags this meal as a duplicate of another
 *   new_submission    — user submits a new meal entirely
 *
 * All feedback starts with status='pending'. Moderation (approve/reject)
 * is handled separately (admin dashboard — Phase 2).
 *
 * When feedback is approved, a Cloud Function updates /meal_community_stats.
 * (Cloud Function — Phase 2)
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb }                   from '@/lib/firebase-admin';
import { verifyToken }               from '@/lib/api-auth';
import { FieldValue, Timestamp }     from 'firebase-admin/firestore';
import type {
  FirestoreMealFeedback,
  FeedbackType,
} from '@/lib/firestoreFoodDb';

// ─── Validation ───────────────────────────────────────────────────────────────

const VALID_TYPES: FeedbackType[] = [
  'macro_correction',
  'price_correction',
  'accuracy_rating',
  'duplicate_flag',
  'new_submission',
];

function isValidRating(r: unknown): r is number {
  return typeof r === 'number' && r >= 1 && r <= 5 && Number.isInteger(r);
}

function isPositiveNumber(v: unknown): v is number {
  return typeof v === 'number' && v > 0 && isFinite(v);
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth required
  const uid = await verifyToken(req);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { mealId, feedbackType, ...rest } = body;

  // Validate required fields
  if (typeof mealId !== 'string' || !mealId.trim()) {
    return NextResponse.json({ error: 'mealId is required' }, { status: 400 });
  }
  if (!VALID_TYPES.includes(feedbackType as FeedbackType)) {
    return NextResponse.json(
      { error: `feedbackType must be one of: ${VALID_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  // Verify meal exists
  const mealRef  = adminDb.collection('meals').doc(mealId as string);
  const mealSnap = await mealRef.get();
  if (!mealSnap.exists) {
    return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
  }

  // Build feedback document
  const feedback: Omit<FirestoreMealFeedback, 'id'> = {
    mealId:              mealId as string,
    userId:              uid,
    feedbackType:        feedbackType as FeedbackType,

    // Macro correction fields
    submittedCalories:   isPositiveNumber(rest.submittedCalories)  ? rest.submittedCalories  : null,
    submittedProteinG:   isPositiveNumber(rest.submittedProteinG)  ? rest.submittedProteinG  : null,
    submittedCarbsG:     isPositiveNumber(rest.submittedCarbsG)    ? rest.submittedCarbsG    : null,
    submittedFatG:       isPositiveNumber(rest.submittedFatG)      ? rest.submittedFatG      : null,

    // Price correction
    submittedPriceSgd:   isPositiveNumber(rest.submittedPriceSgd)  ? rest.submittedPriceSgd  : null,

    // Accuracy rating (1–5)
    accuracyRating:      isValidRating(rest.accuracyRating)        ? rest.accuracyRating     : null,

    // Text fields
    submittedName:       typeof rest.submittedName === 'string'    ? rest.submittedName      : null,
    comment:             typeof rest.comment      === 'string'     ? rest.comment.slice(0, 500) : null,

    // Duplicate flag
    duplicateOfMealId:   typeof rest.duplicateOfMealId === 'string' ? rest.duplicateOfMealId : null,

    // Moderation — always starts pending
    status:              'pending',
    reviewedAt:          null,
    reviewedBy:          null,

    createdAt:           FieldValue.serverTimestamp() as unknown as Timestamp,
  };

  // Write to Firestore
  const docRef = adminDb.collection('meal_feedback').doc();
  await docRef.set({ id: docRef.id, ...feedback });

  return NextResponse.json({ id: docRef.id, status: 'pending' }, { status: 201 });
}

// ─── GET handler — fetch user's own feedback for a meal ───────────────────────

export async function GET(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const mealId = req.nextUrl.searchParams.get('mealId');
  if (!mealId) {
    return NextResponse.json({ error: 'mealId param required' }, { status: 400 });
  }

  const snap = await adminDb
    .collection('meal_feedback')
    .where('mealId', '==', mealId)
    .where('userId', '==', uid)
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();

  const items = snap.docs.map(d => d.data());
  return NextResponse.json({ items });
}
