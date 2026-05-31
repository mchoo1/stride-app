import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyToken } from '@/lib/api-auth';
import { Timestamp } from 'firebase-admin/firestore';

// GET /api/water-logs?date=YYYY-MM-DD  → returns total ml for the day
export async function GET(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dateParam = new URL(req.url).searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
  const start = new Date(dateParam);
  const end   = new Date(dateParam);
  end.setDate(end.getDate() + 1);

  const snap = await adminDb.collection(`users/${uid}/waterLogs`)
    .where('loggedAt', '>=', Timestamp.fromDate(start))
    .where('loggedAt', '<',  Timestamp.fromDate(end))
    .get();

  const logs     = snap.docs.map(d => ({ id: d.id, ...d.data(), loggedAt: d.data().loggedAt?.toDate?.()?.toISOString() }));
  const totalMl  = logs.reduce((sum, l) => sum + ((l as { amountMl?: number }).amountMl ?? 0), 0);
  return NextResponse.json({ logs, totalMl });
}

// POST /api/water-logs
export async function POST(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { amountMl, loggedAt } = await req.json();
  if (!amountMl) return NextResponse.json({ error: 'amountMl required' }, { status: 400 });

  const ref  = adminDb.collection(`users/${uid}/waterLogs`).doc();
  const data = {
    amountMl,
    loggedAt: loggedAt ? Timestamp.fromDate(new Date(loggedAt)) : Timestamp.now(),
  };

  await ref.set(data);
  return NextResponse.json({ id: ref.id, ...data, loggedAt: data.loggedAt.toDate().toISOString() }, { status: 201 });
}
