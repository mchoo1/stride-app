import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyToken } from '@/lib/api-auth';
import { Timestamp } from 'firebase-admin/firestore';

const col = (uid: string) => adminDb.collection(`users/${uid}/weightLogs`);

// GET /api/weight-logs?days=30
// Returns entries sorted oldest-first for charting
export async function GET(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const days  = parseInt(new URL(req.url).searchParams.get('days') ?? '30');
  const since = new Date();
  since.setDate(since.getDate() - Math.min(days, 365));

  const snap = await col(uid)
    .where('loggedAt', '>=', Timestamp.fromDate(since))
    .orderBy('loggedAt', 'asc')
    .get();

  const logs = snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    loggedAt: d.data().loggedAt?.toDate?.()?.toISOString(),
  }));

  return NextResponse.json(logs);
}

// POST /api/weight-logs
// Body: { weightKg: number, bodyFatPct?: number, loggedAt?: ISO string }
// Upserts — only one entry per calendar day is kept
export async function POST(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { weightKg, bodyFatPct, loggedAt } = await req.json();
  if (weightKg == null || weightKg <= 0) {
    return NextResponse.json({ error: 'weightKg required and must be positive' }, { status: 400 });
  }

  const ts   = loggedAt ? Timestamp.fromDate(new Date(loggedAt)) : Timestamp.now();
  const date = ts.toDate().toISOString().slice(0, 10);

  // Delete any existing entry for this calendar day first (one-per-day rule)
  const existing = await col(uid)
    .where('date', '==', date)
    .get();
  const deletes = existing.docs.map(d => d.ref.delete());
  await Promise.all(deletes);

  const ref  = col(uid).doc();
  const data = {
    weightKg:   Math.round(weightKg * 10) / 10,
    bodyFatPct: bodyFatPct != null ? Math.round(bodyFatPct * 10) / 10 : null,
    date,         // YYYY-MM-DD — used for the one-per-day query above
    loggedAt:  ts,
    createdAt: Timestamp.now(),
  };

  await ref.set(data);

  // Also update currentWeight on the user's profile document
  await adminDb.collection('users').doc(uid).set(
    { currentWeight: data.weightKg },
    { merge: true }
  );

  return NextResponse.json({
    id: ref.id, ...data,
    loggedAt:  data.loggedAt.toDate().toISOString(),
    createdAt: data.createdAt.toDate().toISOString(),
  }, { status: 201 });
}

// DELETE /api/weight-logs?id=xxx
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
