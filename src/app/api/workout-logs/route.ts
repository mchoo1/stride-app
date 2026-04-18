import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyToken } from '@/lib/api-auth';
import { Timestamp } from 'firebase-admin/firestore';

// Subcollection — consistent with all other log routes
const col = (uid: string) => adminDb.collection(`users/${uid}/workoutLogs`);

// GET /api/workout-logs?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dateParam = new URL(req.url).searchParams.get('date');
  let query = col(uid).orderBy('loggedAt', 'desc') as FirebaseFirestore.Query;

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
    id: d.id, ...d.data(),
    loggedAt:  d.data().loggedAt?.toDate?.()?.toISOString(),
    createdAt: d.data().createdAt?.toDate?.()?.toISOString(),
  }));
  return NextResponse.json(logs);
}

// POST /api/workout-logs
// Body: { name, exercises: ExerciseSet[], durationMins, caloriesBurned?, notes?, loggedAt? }
export async function POST(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, exercises = [], durationMins, caloriesBurned = 0, notes, loggedAt } = await req.json();
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const ref  = col(uid).doc();
  const data = {
    name,
    exercises,           // [{ exercise, sets, reps, weightKg?, durationSecs? }]
    durationMins:    durationMins    ?? null,
    caloriesBurned:  Math.round(caloriesBurned),
    notes:           notes           ?? null,
    loggedAt:        loggedAt ? Timestamp.fromDate(new Date(loggedAt)) : Timestamp.now(),
    createdAt:       Timestamp.now(),
  };

  await ref.set(data);
  return NextResponse.json({
    id: ref.id, ...data,
    loggedAt:  data.loggedAt.toDate().toISOString(),
    createdAt: data.createdAt.toDate().toISOString(),
  }, { status: 201 });
}

// DELETE /api/workout-logs?id=xxx
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
