import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyToken } from '@/lib/api-auth';
import { Timestamp } from 'firebase-admin/firestore';

// Collection helper — every user's food logs live under users/{uid}/foodLogs
const col = (uid: string) => adminDb.collection(`users/${uid}/foodLogs`);

// GET /api/food-logs?date=YYYY-MM-DD  (omit date → return all)
export async function GET(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dateParam = new URL(req.url).searchParams.get('date');
  let query = col(uid).orderBy('loggedAt', 'asc') as FirebaseFirestore.Query;

  if (dateParam) {
    const start = new Date(dateParam);
    const end   = new Date(dateParam);
    end.setDate(end.getDate() + 1);
    query = query
      .where('loggedAt', '>=', Timestamp.fromDate(start))
      .where('loggedAt', '<',  Timestamp.fromDate(end));
  }

  const snap = await query.get();
  const logs = snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    loggedAt:  d.data().loggedAt?.toDate?.()?.toISOString(),
    createdAt: d.data().createdAt?.toDate?.()?.toISOString(),
  }));
  return NextResponse.json(logs);
}

// POST /api/food-logs
export async function POST(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const {
    name, emoji = '🍽️', calories, protein = 0, carbs = 0, fat = 0,
    fibre, quantity, mealType, foodItemId, restaurantId, loggedAt,
  } = await req.json();

  if (!name || calories == null) {
    return NextResponse.json({ error: 'name and calories required' }, { status: 400 });
  }

  const ref  = col(uid).doc();
  const data = {
    name,
    emoji,
    calories:     Math.round(calories),
    protein:      Math.round((protein  ?? 0) * 10) / 10,
    carbs:        Math.round((carbs    ?? 0) * 10) / 10,
    fat:          Math.round((fat      ?? 0) * 10) / 10,
    fibre:        fibre      != null ? Math.round(fibre * 10) / 10 : null,
    quantity:     quantity   ?? null,   // grams
    mealType:     mealType   ?? null,   // breakfast | lunch | dinner | snack
    foodItemId:   foodItemId ?? null,
    restaurantId: restaurantId ?? null,
    loggedAt:     loggedAt ? Timestamp.fromDate(new Date(loggedAt)) : Timestamp.now(),
    createdAt:    Timestamp.now(),
  };

  await ref.set(data);
  return NextResponse.json({
    id: ref.id, ...data,
    loggedAt:  data.loggedAt.toDate().toISOString(),
    createdAt: data.createdAt.toDate().toISOString(),
  }, { status: 201 });
}

// DELETE /api/food-logs?id=xxx
export async function DELETE(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const ref = col(uid).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await ref.delete();
  return NextResponse.json({ ok: true });
}
