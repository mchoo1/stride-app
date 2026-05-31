import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyToken } from '@/lib/api-auth';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

// GET /api/daily-summary?date=YYYY-MM-DD  (defaults to today)
export async function GET(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const date = new URL(req.url).searchParams.get('date') ?? todayStr();
  const snap = await adminDb
    .collection(`users/${uid}/dailySummaries`)
    .doc(date)
    .get();

  if (!snap.exists) return NextResponse.json(null);
  return NextResponse.json({ date, ...snap.data() });
}

// POST /api/daily-summary  — recompute and upsert today's summary from logs
export async function POST(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const date  = todayStr();
  const start = Timestamp.fromDate(new Date(date));
  const end   = Timestamp.fromDate(new Date(
    new Date(date).setDate(new Date(date).getDate() + 1)
  ));

  // Fetch all three sub-collections in parallel
  const [foodSnap, actSnap, waterSnap] = await Promise.all([
    adminDb.collection(`users/${uid}/foodLogs`)
      .where('loggedAt', '>=', start)
      .where('loggedAt', '<',  end)
      .get(),
    adminDb.collection(`users/${uid}/activityLogs`)
      .where('loggedAt', '>=', start)
      .where('loggedAt', '<',  end)
      .get(),
    adminDb.collection(`users/${uid}/waterLogs`)
      .where('loggedAt', '>=', start)
      .where('loggedAt', '<',  end)
      .get(),
  ]);

  // Food totals
  const food = foodSnap.docs.reduce(
    (acc, d) => {
      const f = d.data();
      return {
        calories: acc.calories + (f.calories ?? 0),
        protein:  acc.protein  + (f.protein  ?? 0),
        carbs:    acc.carbs    + (f.carbs    ?? 0),
        fat:      acc.fat      + (f.fat      ?? 0),
        fibre:    acc.fibre    + (f.fibre    ?? 0),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 }
  );

  const caloriesBurned = actSnap.docs.reduce((s, d) => s + (d.data().caloriesBurned ?? 0), 0);
  const activeMins     = actSnap.docs.reduce((s, d) => s + (d.data().durationMins   ?? 0), 0);
  const totalWaterMl   = waterSnap.docs.reduce((s, d) => s + (d.data().amountMl ?? 0), 0);

  // Pull user targets from the users document
  const userDoc    = await adminDb.collection('users').doc(uid).get();
  const targets    = userDoc.data() ?? {};

  const summary = {
    date,
    totalCalories:   Math.round(food.calories),
    totalProteinG:   round1(food.protein),
    totalCarbsG:     round1(food.carbs),
    totalFatG:       round1(food.fat),
    totalFibreG:     round1(food.fibre),
    totalWaterMl,
    caloriesBurned:  Math.round(caloriesBurned),
    activeMins,
    netCalories:     Math.round(Math.max(0, food.calories - caloriesBurned)),
    // Targets (for client-side progress bars)
    targetCalories:  targets.targetCalories  ?? null,
    targetProteinG:  targets.targetProtein   ?? null,
    targetCarbsG:    targets.targetCarbs     ?? null,
    targetFatG:      targets.targetFat       ?? null,
    targetWaterMl:   targets.targetWater     ?? null,
    updatedAt:       FieldValue.serverTimestamp(),
  };

  await adminDb
    .collection(`users/${uid}/dailySummaries`)
    .doc(date)
    .set(summary, { merge: true });

  return NextResponse.json(summary);
}

// ── helpers ─────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function round1(n: number) {
  return Math.round(n * 10) / 10;
}
