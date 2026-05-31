import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyToken } from '@/lib/api-auth';
import { FieldValue } from 'firebase-admin/firestore';

// GET /api/profile
export async function GET(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [userSnap, profileSnap] = await Promise.all([
    adminDb.collection('users').doc(uid).get(),
    adminDb.collection('profiles').doc(uid).get(),
  ]);

  return NextResponse.json({
    id: uid,
    ...userSnap.data(),
    profile: profileSnap.exists ? profileSnap.data() : null,
  });
}

// PUT /api/profile
export async function PUT(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, age, heightCm, weightKg, goalWeightKg, activityLevel, goal,
          calorieGoal, proteinGoal, carbsGoal, fatGoal } = await req.json();

  const profileData = {
    age:          age          ?? null,
    heightCm:     heightCm     ?? null,
    weightKg:     weightKg     ?? null,
    goalWeightKg: goalWeightKg ?? null,
    activityLevel: activityLevel ?? null,
    goal:         goal         ?? null,
    calorieGoal:  calorieGoal  ?? null,
    proteinGoal:  proteinGoal  ?? null,
    carbsGoal:    carbsGoal    ?? null,
    fatGoal:      fatGoal      ?? null,
    updatedAt:    FieldValue.serverTimestamp(),
  };

  const updates: Promise<unknown>[] = [
    adminDb.collection('profiles').doc(uid).set(profileData, { merge: true }),
  ];

  if (name) {
    updates.push(adminDb.collection('users').doc(uid).update({ name }));
  }

  await Promise.all(updates);

  const [userSnap, profileSnap] = await Promise.all([
    adminDb.collection('users').doc(uid).get(),
    adminDb.collection('profiles').doc(uid).get(),
  ]);

  return NextResponse.json({
    id: uid,
    ...userSnap.data(),
    profile: profileSnap.data(),
  });
}
