/**
 * Admin moderation API for community feedback (Method 3 / review queue).
 *
 *   GET   /api/admin/meal-feedback              → list pending feedback (admin only)
 *   PATCH /api/admin/meal-feedback              → approve / reject / hold (admin only)
 *
 * Approving with `applyToMeal: true` writes the submitted value onto the meal and
 * marks it staff_verified — this is how a SINGLE log gets released after we verify it.
 */
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAdmin } from '@/lib/admin-auth';
import { FieldValue } from 'firebase-admin/firestore';

const feedbackCol = () => adminDb.collection('meal_feedback');
const mealsCol = () => adminDb.collection('meals');

// ─── GET: pending queue ───────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const snap = await feedbackCol()
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();

  const items = await Promise.all(
    snap.docs.map(async (d) => {
      const f = d.data();
      let mealName: string = f.mealId;
      let current: Record<string, unknown> | null = null;
      try {
        const m = await mealsCol().doc(String(f.mealId)).get();
        if (m.exists) {
          const md = m.data()!;
          mealName = md.canonicalName ?? f.mealId;
          current = {
            calories: md.calories, proteinG: md.proteinG, carbsG: md.carbsG,
            fatG: md.fatG, priceSgd: md.priceSgd, confidenceTier: md.confidenceTier,
          };
        }
      } catch { /* meal may not be seeded yet */ }
      return {
        id: d.id,
        mealId: f.mealId,
        mealName,
        feedbackType: f.feedbackType,
        submitterRole: f.submitterRole ?? 'user',
        submitted: {
          calories: f.submittedCalories ?? null,
          proteinG: f.submittedProteinG ?? null,
          carbsG: f.submittedCarbsG ?? null,
          fatG: f.submittedFatG ?? null,
          priceSgd: f.submittedPriceSgd ?? null,
          name: f.submittedName ?? null,
        },
        accuracyRating: f.accuracyRating ?? null,
        comment: f.comment ?? null,
        userId: f.userId ?? null,
        createdAt: f.createdAt?.toDate?.()?.toISOString?.() ?? null,
        current,
      };
    }),
  );

  return NextResponse.json({ items });
}

// ─── PATCH: approve / reject / hold ───────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const feedbackId = typeof body.feedbackId === 'string' ? body.feedbackId : '';
  const action = typeof body.action === 'string' ? body.action : '';
  const applyToMeal = body.applyToMeal === true;

  if (!feedbackId || !['approve', 'reject', 'hold'].includes(action)) {
    return NextResponse.json({ error: 'feedbackId and a valid action are required' }, { status: 400 });
  }

  const fbRef = feedbackCol().doc(feedbackId);
  const fbSnap = await fbRef.get();
  if (!fbSnap.exists) return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
  const fb = fbSnap.data()!;

  const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending';
  await fbRef.update({
    status,
    reviewedBy: admin.email,
    reviewedAt: FieldValue.serverTimestamp(),
  });

  // Release a verified correction onto the meal (this is the single-log path).
  if (action === 'approve' && applyToMeal && fb.mealId) {
    const upd: Record<string, unknown> = {
      confidenceTier: 'staff_verified',
      verified: true,
      verifiedByRole: 'staff',
      lastVerified: new Date().toISOString().slice(0, 10),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (typeof fb.submittedCalories === 'number') upd.calories = fb.submittedCalories;
    if (typeof fb.submittedProteinG === 'number') upd.proteinG = fb.submittedProteinG;
    if (typeof fb.submittedCarbsG === 'number') upd.carbsG = fb.submittedCarbsG;
    if (typeof fb.submittedFatG === 'number') upd.fatG = fb.submittedFatG;
    if (typeof fb.submittedPriceSgd === 'number') upd.priceSgd = fb.submittedPriceSgd;
    await mealsCol().doc(String(fb.mealId)).set(upd, { merge: true });
  }

  return NextResponse.json({ ok: true, status });
}
