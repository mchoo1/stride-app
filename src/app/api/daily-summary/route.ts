import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyToken } from '@/lib/api-auth';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

// GET /api/daily-summary?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const date = new URL(req.url).searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
  const snap = await adminDb.collection(`users/${uid}/dailySummaries`).doc(date).get();

  if (!snap.exists) return NextResponse.json(null);
  return NextResponse.json({ id: snap.id, ...snap.data() });
}

// POST /api/daily-summary  — called after each food/activity log to upsert the day's totals
export async function POST(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const date    = new Date().toISOString().slice(0, 10);
  const userDoc = await adminDb.collection('users').doc(uid).get();
  const user    = userDoc.data();

  // Tally today's food logs
  const todayStart = new Date(date);
  const todayEnd   = new Date(date); todayEnd.setDate(todayEnd.getDate() + 1);

  const [foodSnap, activitySnap, waterSnap] = await Promise.all([
    adminDb.collection(`users/${uid}/foodLogs`)
      .where('loggedAt', '>=', Timestamp.fromDate(todayStart))
      .where('loggedAt', '<',  Timestamp.fromDate(todayEnd))
      .get(),
    adminDb.collection(`users/${uid}/activityLogs`)
      .where('loggedAt', '>=', Timestamp.fromDate(todayStart))
      .where('loggedAt', '<',  Timestamp.fromDate(todayEnd))
      .get(),
    adminDb.collection(`users/${uid}/waterLogs`)
      .where('loggedAt', '>=', Timestamp.fromDate(todayStart))
      .where('loggedAt', '<',  Timestamp.fromDate(todayEnd))
      .get(),
  ]);

  const foodTotals = foodSnap.docs.reduce((acc, d) => {
    const f = d.data();
    return {
      calories: acc.calories + (f.calories ?? 0),
      proteinG: acc.proteinG + (f.proteinG ?? 0),
      carbsG:   acc.carbsG   + (f.carbsG   ?? 0),
      fatG:     acc.fatG     + (f.fatG     ?? 0),
    };
  }, { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 });

  const caloriesBurned = activitySnap.docs.reduce((s, d) => s + (d.data().caloriesBurned ?? 0), 0);
  const activeMins     = activitySnap.docs.reduce((s, d) => s + (d.data().durationMins   ?? 0), 0);
  const totalWaterMl   = waterSnap.docs.reduce((s, d) => s + (d.data().amountMl ?? 0), 0);

  const summary = {
    summaryDate:   date,
    totalCalories: Math.round(foodTotals.calories),
    totalProteinG: Math.round(foodTotals.proteinG * 10) / 10,
    totalCarbsG:   Math.round(foodTotals.carbsG   * 10) / 10,
    totalFatG:     Math.round(foodTotals.fatG     * 10) / 10,
    totalWaterMl,
    caloriesBurned,
    activeMins,
    calorieGoal:  user?.targetCalories  ?? null,
    proteinGoal:  user?.targetProteinG  ?? null,
    carbsGoal:    user?.targetCarbsG    ?? null,
    fatGoal:      user?.targetFatG      ?? null,
    updatedAt:    FieldValue.serverTimestamp(),
  };

  await adminDb.collection(`users/${uid}/dailySummaries`).doc(date).set(summary, { merge: true });
  return NextResponse.json(summary);
}
