import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyToken } from '@/lib/api-auth';
import { Timestamp } from 'firebase-admin/firestore';

// GET /api/foods?q=chicken&limit=20
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q     = searchParams.get('q')?.toLowerCase() ?? '';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);

  if (!q) return NextResponse.json({ foods: [] });

  // Simple prefix search — for full-text, upgrade to Algolia/Typesense later
  const snap = await adminDb.collection('foods')
    .orderBy('name')
    .startAt(q)
    .endAt(q + '\uf8ff')
    .limit(limit)
    .get();

  const foods = snap.docs.map(d => ({
    id: d.id, ...d.data(),
    createdAt: d.data().createdAt?.toDate?.()?.toISOString(),
    updatedAt: d.data().updatedAt?.toDate?.()?.toISOString(),
  }));

  return NextResponse.json({ foods });
}

// POST /api/foods  (submit a community food)
export async function POST(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const {
    name, brand, emoji = '🍽️',
    caloriesPer100g, proteinPer100g = 0, carbsPer100g = 0, fatPer100g = 0,
    fibrePer100g, sodiumMgPer100g, barcode, dietaryFlags = [],
  } = await req.json();

  if (!name || caloriesPer100g == null) {
    return NextResponse.json({ error: 'name and caloriesPer100g required' }, { status: 400 });
  }

  const ref  = adminDb.collection('foods').doc();
  const now  = Timestamp.now();
  const data = {
    name: name.toLowerCase(), brand: brand ?? null, emoji,
    caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g,
    fibrePer100g:    fibrePer100g    ?? null,
    sodiumMgPer100g: sodiumMgPer100g ?? null,
    source: 'community',
    fdcId:  null, barcode: barcode ?? null,
    confidenceScore: 0.5,
    upvoteCount: 0, downvoteCount: 0,
    submittedBy: uid,
    isVerified:  false,
    dietaryFlags,
    createdAt: now, updatedAt: now,
  };

  await ref.set(data);
  return NextResponse.json({ id: ref.id, ...data }, { status: 201 });
}
