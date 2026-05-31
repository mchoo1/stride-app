import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyToken } from '@/lib/api-auth';
import { Timestamp } from 'firebase-admin/firestore';

// GET /api/activity-logs?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dateParam = new URL(req.url).searchParams.get('date');
  let query = adminDb.collection(`users/${uid}/activityLogs`).orderBy('loggedAt', 'desc');

  if (dateParam) {
    const start = new Date(dateParam);
    const end   = new Date(dateParam);
    end.setDate(end.getDate() + 1);
    query = query
      .where('loggedAt', '>=', Timestamp.fromDate(start))
      .where('loggedAt', '<',  Timestamp.fromDate(end)) as typeof query;
  }

  const snap = await query.get();
  const logs = snap.docs.map(d => ({
    id: d.id, ...d.data(),
    loggedAt:  d.data().loggedAt?.toDate?.()?.toISOString(),
    createdAt: d.data().createdAt?.toDate?.()?.toISOString(),
  }));
  return NextResponse.json(logs);
}

// POST /api/activity-logs
export async function POST(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const {
    name, emoji = '🏃', durationMins, intensity = 'medium',
    caloriesBurned = 0, metValue, distanceKm, steps,
    heartRateAvg, heartRateMax, source = 'manual',
    wearableId, notes, loggedAt,
  } = await req.json();

  if (!name || !durationMins) return NextResponse.json({ error: 'name and durationMins required' }, { status: 400 });

  const ref  = adminDb.collection(`users/${uid}/activityLogs`).doc();
  const data = {
    name, emoji, durationMins, intensity, caloriesBurned,
    metValue:     metValue     ?? null,
    distanceKm:   distanceKm   ?? null,
    steps:        steps        ?? null,
    heartRateAvg: heartRateAvg ?? null,
    heartRateMax: heartRateMax ?? null,
    source, wearableId: wearableId ?? null,
    notes: notes ?? null,
    loggedAt:  loggedAt ? Timestamp.fromDate(new Date(loggedAt)) : Timestamp.now(),
    createdAt: Timestamp.now(),
  };

  await ref.set(data);
  return NextResponse.json({
    id: ref.id, ...data,
    loggedAt:  data.loggedAt.toDate().toISOString(),
    createdAt: data.createdAt.toDate().toISOString(),
  }, { status: 201 });
}

// DELETE /api/activity-logs?id=xxx
export async function DELETE(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await adminDb.collection(`users/${uid}/activityLogs`).doc(id).delete();
  return NextResponse.json({ ok: true });
}
