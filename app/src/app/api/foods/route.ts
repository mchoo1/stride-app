import { NextRequest, NextResponse } from 'next/server';
import { adminDb }    from '@/lib/firebase-admin';
import { verifyToken } from '@/lib/api-auth';
import { Timestamp }  from 'firebase-admin/firestore';
import { sendEmail }  from '@/lib/email';

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

  void sendEmail({
    subject: `[Stride] New community food submission — ${name}`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#F7F8FB;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #E5E9F2">
    <div style="font-size:20px;font-weight:800;color:#0F1B2D;margin-bottom:4px">🍽️ New community food submission</div>
    <div style="font-size:13px;color:#8B95A7;margin-bottom:20px">${new Date().toUTCString()}</div>
    <table style="border-collapse:collapse;width:100%">
      <tbody>
        <tr><td style="padding:6px 12px;color:#5B6576">Food name</td><td style="padding:6px 12px;font-weight:600;color:#0F1B2D">${name}</td></tr>
        ${brand ? `<tr><td style="padding:6px 12px;color:#5B6576">Brand</td><td style="padding:6px 12px;font-weight:600;color:#0F1B2D">${brand}</td></tr>` : ''}
        <tr><td style="padding:6px 12px;color:#5B6576">Calories</td><td style="padding:6px 12px;font-weight:600;color:#0F1B2D">${caloriesPer100g} kcal/100g</td></tr>
        <tr><td style="padding:6px 12px;color:#5B6576">Protein</td><td style="padding:6px 12px;font-weight:600;color:#0F1B2D">${proteinPer100g}g</td></tr>
        <tr><td style="padding:6px 12px;color:#5B6576">Carbs</td><td style="padding:6px 12px;font-weight:600;color:#0F1B2D">${carbsPer100g}g</td></tr>
        <tr><td style="padding:6px 12px;color:#5B6576">Fat</td><td style="padding:6px 12px;font-weight:600;color:#0F1B2D">${fatPer100g}g</td></tr>
        <tr><td style="padding:6px 12px;color:#5B6576">Submitted by</td><td style="padding:6px 12px;font-weight:600;color:#0F1B2D">${uid}</td></tr>
        <tr><td style="padding:6px 12px;color:#5B6576">Food ID</td><td style="padding:6px 12px;font-weight:600;color:#0F1B2D">${ref.id}</td></tr>
      </tbody>
    </table>
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid #E5E9F2;font-size:12px;color:#8B95A7">
      Review and verify in the Stride admin dashboard or Firestore foods collection.
    </div>
  </div>
</body>
</html>`,
  });

  return NextResponse.json({ id: ref.id, ...data }, { status: 201 });
}
