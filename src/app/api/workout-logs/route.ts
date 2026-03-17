import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyToken } from '@/lib/api-auth';
import { Timestamp } from 'firebase-admin/firestore';

// GET /api/workout-logs?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dateParam = new URL(req.url).searchParams.get('date');
  let query = adminDb.collection('workoutLogs').where('userId', '==', uid);

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

// POST /api/workout-logs
export async function POST(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, durationMin, caloriesBurned, exercises, date } = await req.json();
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const ref  = adminDb.collection('workoutLogs').doc();
  const data = {
    userId:         uid,
    name,
    durationMin:    durationMin    ?? null,
    caloriesBurned: caloriesBurned ?? null,
    exercises:      exercises      ?? [],
    date:           date ? Timestamp.fromDate(new Date(date)) : Timestamp.now(),
    createdAt:      Timestamp.now(),
  };

  await ref.set(data);
  return NextResponse.json({
    id: ref.id, ...data,
    date:      data.date.toDate().toISOString(),
    createdAt: data.createdAt.toDate().toISOString(),
  }, { status: 201 });
}

// DELETE /api/workout-logs?id=xxx
export async function DELETE(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const ref = adminDb.collection('workoutLogs').doc(id);
  const doc = await ref.get();
  if (!doc.exists || doc.data()?.userId !== uid) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await ref.delete();
  return NextResponse.json({ ok: true });
}
