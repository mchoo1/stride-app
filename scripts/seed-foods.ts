/**
 * Seed /foods collection with 15 verified USDA baseline items.
 * Run once: npx ts-node --project tsconfig.json scripts/seed-foods.ts
 *
 * Requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY env vars.
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db  = getFirestore();
const now = Timestamp.now();

const FOODS = [
  { name: 'chicken breast grilled',   brand: null, emoji: '🍗', caloriesPer100g: 165, proteinPer100g: 31.0, carbsPer100g:  0.0, fatPer100g:  3.6 },
  { name: 'brown rice cooked',        brand: null, emoji: '🍚', caloriesPer100g: 112, proteinPer100g:  2.6, carbsPer100g: 23.5, fatPer100g:  0.8 },
  { name: 'whole egg boiled',         brand: null, emoji: '🥚', caloriesPer100g: 155, proteinPer100g: 13.0, carbsPer100g:  1.1, fatPer100g: 11.0 },
  { name: 'broccoli steamed',         brand: null, emoji: '🥦', caloriesPer100g:  35, proteinPer100g:  2.4, carbsPer100g:  5.1, fatPer100g:  0.4 },
  { name: 'salmon baked',             brand: null, emoji: '🐟', caloriesPer100g: 208, proteinPer100g: 20.4, carbsPer100g:  0.0, fatPer100g: 13.4 },
  { name: 'greek yogurt 0% fat',      brand: 'Chobani', emoji: '🥛', caloriesPer100g: 59, proteinPer100g: 9.9, carbsPer100g: 3.6, fatPer100g: 0.4 },
  { name: 'oats rolled dry',          brand: null, emoji: '🌾', caloriesPer100g: 389, proteinPer100g: 16.9, carbsPer100g: 66.3, fatPer100g:  6.9 },
  { name: 'avocado',                  brand: null, emoji: '🥑', caloriesPer100g: 160, proteinPer100g:  2.0, carbsPer100g:  8.5, fatPer100g: 14.7 },
  { name: 'sweet potato baked',       brand: null, emoji: '🍠', caloriesPer100g:  90, proteinPer100g:  2.0, carbsPer100g: 20.7, fatPer100g:  0.1 },
  { name: 'banana',                   brand: null, emoji: '🍌', caloriesPer100g:  89, proteinPer100g:  1.1, carbsPer100g: 22.8, fatPer100g:  0.3 },
  { name: 'almonds raw',              brand: null, emoji: '🥜', caloriesPer100g: 579, proteinPer100g: 21.2, carbsPer100g: 21.6, fatPer100g: 49.9 },
  { name: 'cottage cheese low-fat',   brand: null, emoji: '🧀', caloriesPer100g:  98, proteinPer100g: 11.1, carbsPer100g:  3.4, fatPer100g:  4.3 },
  { name: 'beef lean mince 90%',      brand: null, emoji: '🥩', caloriesPer100g: 176, proteinPer100g: 20.0, carbsPer100g:  0.0, fatPer100g: 10.0 },
  { name: 'tuna canned in water',     brand: null, emoji: '🐠', caloriesPer100g: 116, proteinPer100g: 25.5, carbsPer100g:  0.0, fatPer100g:  0.8 },
  { name: 'white rice cooked',        brand: null, emoji: '🍚', caloriesPer100g: 130, proteinPer100g:  2.4, carbsPer100g: 28.6, fatPer100g:  0.3 },
];

async function seed() {
  const batch = db.batch();
  let count = 0;

  for (const food of FOODS) {
    const ref = db.collection('foods').doc();
    batch.set(ref, {
      ...food,
      fibrePer100g:    null,
      sodiumMgPer100g: null,
      source:          'usda',
      fdcId:           null,
      barcode:         null,
      confidenceScore: 1.0,
      upvoteCount:     0,
      downvoteCount:   0,
      submittedBy:     null,
      isVerified:      true,
      dietaryFlags:    [],
      createdAt:       now,
      updatedAt:       now,
    });
    count++;
  }

  await batch.commit();
  console.log(`✅ Seeded ${count} foods to Firestore`);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
