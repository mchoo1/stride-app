import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyToken } from '@/lib/api-auth';
import { Timestamp } from 'firebase-admin/firestore';

// GET /api/food-logs?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dateParam = new URL(req.url).searchParams.get('date');
  let query = adminDb.collection('foodLogs').where('userId', '==', uid);

  if (dateParam) {
    const start = new Date(dateParam);
    const end   = new Date(dateParam);
    end.setDate(end.getDate() + 1);
    query = query
      .where('date', '>=', Timestamp.fromDate(start))
      .where('date', '<',  Timestamp.fromDate(end)) as typeof query;
  }

  const snap = await query.orderBy('date', 'asc').get();
  const logs = snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    date:      d.data().date?.toDate?.()?.toISOString(),
    createdAt: d.data().createdAt?.toDate?.()?.toISOString(),
  }));
  return NextResponse.json(logs);
}

// POST /api/food-logs
export async function POST(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, emoji, calories, protein, carbs, fat, weightG, mealType, date } = await req.json();
  if (!name || calories == null) return NextResponse.json({ error: 'name and calories required' }, { status: 400 });

  const ref  = adminDb.collection('foodLogs').doc();
  const data = {
    userId:    uid,
    name,
    emoji:     emoji    ?? null,
    calories:  Math.round(calories),
    protein:   protein  ?? 0,
    carbs:     carbs    ?? 0,
    fat:       fat      ?? 0,
    weightG:   weightG  ?? null,
    mealType:  mealType ?? null,
    date:      date ? Timestamp.fromDate(new Date(date)) : Timestamp.now(),
    createdAt: Timestamp.now(),
  };

  await ref.set(data);
  return NextResponse.json({
    id: ref.id, ...data,
    date:      data.date.toDate().toISOString(),
    createdAt: data.createdAt.toDate().toISOString(),
  }, { status: 201 });
}

// DELETE /api/food-logs?id=xxx
export async function DELETE(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const ref = adminDb.collection('foodLogs').doc(id);
  const doc = await ref.get();
  if (!doc.exists || doc.data()?.userId !== uid) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await ref.delete();
  return NextResponse.json({ ok: true });
}
