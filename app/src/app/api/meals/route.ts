/**
 * POST /api/meals
 * ─────────────────────────────────────────────────────────────────────────────
 * Accept a user-submitted restaurant meal and write to /meals Firestore
 * collection with:
 *   status         = 'pending'   (requires admin approval before going live)
 *   confidenceTier = 'community'
 *
 * Required fields: name, calories
 * Optional:        restaurantName, price, protein, carbs, fat, servingNote, dietTags
 *
 * Auth required — guests cannot submit meals.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb }                   from '@/lib/firebase-admin';
import { verifyToken }               from '@/lib/api-auth';
import { FieldValue }                from 'firebase-admin/firestore';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toPositive(v: unknown): number | null {
  if (typeof v !== 'number' && typeof v !== 'string') return null;
  const n = parseFloat(String(v));
  return isFinite(n) && n >= 0 ? n : null;
}

function toNonNegative(v: unknown): number | null {
  if (typeof v !== 'number' && typeof v !== 'string') return null;
  const n = parseFloat(String(v));
  return isFinite(n) && n >= 0 ? n : null;
}

const VALID_DIET_TAGS = new Set([
  'halal', 'vegetarian', 'vegan', 'gluten_free', 'high_protein',
  'keto', 'no_pork', 'dairy_free', 'nut_free', 'low_carb',
  'lactose_free', 'kosher', 'pescatarian',
]);

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth required
  const uid = await verifyToken(req);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const {
    name, restaurantName, price,
    calories, protein, carbs, fat,
    servingNote, dietTags,
  } = body;

  // Validate required fields
  if (typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json({ error: 'name must be at least 2 characters' }, { status: 400 });
  }

  const parsedCalories = toPositive(calories);
  if (parsedCalories === null || parsedCalories === 0) {
    return NextResponse.json({ error: 'calories must be a positive number' }, { status: 400 });
  }

  // Sanitise optional macro/price fields
  const parsedProtein     = toNonNegative(protein)     ?? 0;
  const parsedCarbs       = toNonNegative(carbs)       ?? 0;
  const parsedFat         = toNonNegative(fat)         ?? 0;
  const parsedPrice       = toPositive(price)          ?? null;
  const parsedServingNote = typeof servingNote === 'string' ? servingNote.trim().slice(0, 100) : null;
  const parsedRestaurant  = typeof restaurantName === 'string' ? restaurantName.trim().slice(0, 100) : null;

  // Sanitise diet tags — only allow known values
  const parsedDietTags: string[] = Array.isArray(dietTags)
    ? (dietTags as unknown[]).filter((t): t is string => typeof t === 'string' && VALID_DIET_TAGS.has(t))
    : [];

  // Derive computed fields
  const isHighProtein = parsedProtein >= 25;
  const isHalal       = parsedDietTags.includes('halal');
  const isVegetarian  = parsedDietTags.includes('vegetarian') || parsedDietTags.includes('vegan');
  const isVegan       = parsedDietTags.includes('vegan');
  const isKeto        = parsedDietTags.includes('keto');
  const isGlutenFree  = parsedDietTags.includes('gluten_free');

  // Build Firestore document
  const docRef = adminDb.collection('meals').doc();
  const meal = {
    id:               docRef.id,
    canonicalName:    name.trim(),
    restaurantName:   parsedRestaurant,
    aliases:          [],

    // Macros per serving
    calories:         parsedCalories,
    proteinG:         parsedProtein,
    carbsG:           parsedCarbs,
    fatG:             parsedFat,
    fibreG:           null,
    sodiumMg:         null,
    servingNote:      parsedServingNote,

    // Price
    priceSgd:         parsedPrice,

    // Diet flags (boolean — Firestore can index these)
    isHalal,
    isVegetarian,
    isVegan,
    isKeto,
    isGlutenFree,
    isHighProtein,
    dietTagsExtra:    parsedDietTags,

    // Community metadata
    confidenceTier:   'community',   // stride_approved | community | stride_estimate
    status:           'pending',     // pending | active | duplicate | archived
    source:           'community',
    verified:         false,
    submittedBy:      uid,

    // Moderation
    reviewedAt:       null,
    reviewedBy:       null,

    createdAt:        FieldValue.serverTimestamp(),
    updatedAt:        FieldValue.serverTimestamp(),
  };

  await docRef.set(meal);

  return NextResponse.json(
    { id: docRef.id, status: 'pending', message: 'Meal submitted for review' },
    { status: 201 }
  );
}
