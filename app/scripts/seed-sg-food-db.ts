/**
 * Seed /restaurants and /meals Firestore collections from sgFoodDb.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads all SG_RESTAURANTS and SG_MACRO_FOODS from the local TypeScript
 * database and batch-writes them to Firestore.
 *
 * Run from the app/ directory:
 *   cd app
 *   npx ts-node -r tsconfig-paths/register --project tsconfig.scripts.json scripts/seed-sg-food-db.ts
 *
 * Required env vars in app/.env.local:
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 *
 * Options:
 *   --dry-run    Print what would be written, don't write to Firestore
 *   --clear      Delete existing /restaurants and /meals docs before seeding
 *
 * Firestore batch limit is 500 writes per commit. This script chunks
 * automatically into batches of 400 to stay under the limit safely.
 */

import { initializeApp, cert, getApps }     from 'firebase-admin/app';
import { getFirestore, Timestamp, WriteBatch } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import { SG_RESTAURANTS, SG_MACRO_FOODS }   from '@/lib/sgFoodDb';
import {
  deriveConfidenceTier,
  deriveMacroSpecificity,
  mapDietFlags,
  buildSearchTokens,
  type FirestoreRestaurant,
  type FirestoreMeal,
  type SetComponent,
} from '@/lib/firestoreFoodDb';

dotenv.config({ path: '.env.local' });

// ─── Init ─────────────────────────────────────────────────────────────────────

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db        = getFirestore();
db.settings({ ignoreUndefinedProperties: true });
const DRY_RUN   = process.argv.includes('--dry-run');
const CLEAR     = process.argv.includes('--clear');
const BATCH_MAX = 400;
const now       = Timestamp.now();

// ─── Batch helper ─────────────────────────────────────────────────────────────

class BatchWriter {
  private batches: WriteBatch[] = [];
  private current: WriteBatch;
  private count   = 0;
  private total   = 0;

  constructor() { this.current = db.batch(); }

  set(ref: FirebaseFirestore.DocumentReference, data: object) {
    if (this.count >= BATCH_MAX) {
      this.batches.push(this.current);
      this.current = db.batch();
      this.count   = 0;
    }
    this.current.set(ref, data);
    this.count++;
    this.total++;
  }

  async commit(dryRun = false) {
    this.batches.push(this.current);
    if (dryRun) {
      console.log(`[dry-run] Would commit ${this.total} writes across ${this.batches.length} batch(es).`);
      return;
    }
    for (let i = 0; i < this.batches.length; i++) {
      await this.batches[i].commit();
      console.log(`  Batch ${i + 1}/${this.batches.length} committed.`);
    }
    console.log(`✅  Total writes: ${this.total}`);
  }
}

// ─── Clear helper ─────────────────────────────────────────────────────────────

async function clearCollection(name: string) {
  const snap = await db.collection(name).get();
  if (snap.empty) return;
  const writer = new BatchWriter();
  snap.docs.forEach(d => writer['current'].delete(d.ref));
  await writer.commit();
  console.log(`🗑   Cleared ${snap.size} docs from /${name}`);
}

// ─── Seed restaurants ─────────────────────────────────────────────────────────

function buildRestaurantDoc(r: (typeof SG_RESTAURANTS)[number]): FirestoreRestaurant {
  const tags: string[] = (r as any).dietTags ?? [];
  return {
    id:               r.id,
    name:             r.name,
    emoji:            r.emoji,
    aliases:          r.aliases ?? [],
    cuisine:          r.cuisine ?? '',
    tier:             r.tier,
    serviceTypes:     r.serviceTypes ?? [],
    priceRange:       r.priceRange ?? '$',
    dietTags:         tags,
    isHalalCertified: tags.includes('halal'),
    isHalalMixed:     false,     // audit separately — default false until verified
    nutritionUrl:     (r as any).nutritionUrl ?? null,
    lastUpdated:      (r as any).lastUpdated  ?? null,
    createdAt:        now,
    updatedAt:        now,
  };
}

// ─── Seed meals (restaurant items) ───────────────────────────────────────────

function buildMenuItemDoc(
  item:     (typeof SG_RESTAURANTS)[number]['menu'][number],
  r:        (typeof SG_RESTAURANTS)[number],
): FirestoreMeal {
  const flags    = item.compatibleWith ?? [];
  const diet     = mapDietFlags(flags);
  const tier     = deriveConfidenceTier(item.source, item.verified);
  const tokens   = buildSearchTokens(item.name, [r.name, ...(r.aliases ?? [])]);

  // Macro specificity: an item whose macros are borrowed from SG_MACRO_FOODS
  // (via macroDbRef) is generic data tagged onto this outlet, not measured here.
  const macroSourceMealId = (item as any).macroDbRef ?? null;
  const macroSpecificity  = deriveMacroSpecificity(r.id, macroSourceMealId);

  // Set meal composition: convert client {itemId,qty} → Firestore {mealId,qty}
  const rawComponents = (item as any).setComponents as
    | { itemId: string; qty: number }[]
    | undefined;
  const setComponents: SetComponent[] | undefined = rawComponents?.map(c => ({
    mealId: c.itemId,
    qty:    c.qty ?? 1,
  }));

  return {
    id:               item.id,
    mealType:         'restaurant_item',
    status:           'active',

    restaurantId:     r.id,
    restaurantName:   r.name,
    restaurantEmoji:  r.emoji,

    canonicalName:    item.name,
    aliases:          [],
    searchTokens:     tokens,

    servingSizeG:     null,
    servingNote:      (item as any).servingNote ?? undefined,

    calories:         item.calories,
    proteinG:         item.protein,
    carbsG:           item.carbs,
    fatG:             item.fat,
    fibreG:           (item as any).fibre   ?? null,
    sodiumMg:         (item as any).sodium  ?? null,

    priceSgd:         item.price,
    priceMinSgd:      null,
    priceMaxSgd:      null,
    priceTypicalSgd:  null,

    ...diet,
    isHighProtein:    item.protein >= 25,

    allergens:        (item as any).allergens ?? null,
    ingredients:      [],

    confidenceTier:   tier,
    source:           item.source ?? 'community',
    sourceUrl:        undefined,
    verified:         item.verified ?? false,
    lastVerified:     item.lastVerified ?? null,

    emoji:            item.emoji,
    category:         item.category,
    description:      (item as any).description ?? undefined,
    imageUrl:         null,

    // Macro specificity + set composition
    macroSpecificity,
    macroSourceMealId,
    isSetMeal:        (item as any).isSetMeal ?? undefined,
    setComponents,
    visibility:       (item as any).visibility ?? undefined,

    createdAt:        now,
    updatedAt:        now,
  };
}

// ─── Seed meals (SG_MACRO_FOODS — generic dishes) ────────────────────────────

function buildMacroFoodDoc(f: (typeof SG_MACRO_FOODS)[number]): FirestoreMeal {
  const flags  = (f as any).dietTags ?? [];
  const diet   = mapDietFlags(flags);
  const tier   = deriveConfidenceTier(f.source, f.verified);
  const tokens = buildSearchTokens(f.name, f.aliases ?? []);

  return {
    id:               f.id,
    mealType:         'generic_dish',
    status:           'active',

    restaurantId:     null,
    restaurantName:   null,
    restaurantEmoji:  null,

    canonicalName:    f.name,
    aliases:          f.aliases ?? [],
    searchTokens:     tokens,

    servingSizeG:     (f as any).servingG ?? null,
    servingNote:      (f as any).servingNote ?? undefined,

    calories:         f.calories,
    proteinG:         f.protein,
    carbsG:           f.carbs,
    fatG:             f.fat,
    fibreG:           (f as any).fibre   ?? null,
    sodiumMg:         null,

    priceSgd:         null,
    priceMinSgd:      null,
    priceMaxSgd:      null,
    priceTypicalSgd:  (f as any).typicalPriceSgd ?? null,

    ...diet,
    isHighProtein:    f.protein >= 25,

    allergens:        null,   // generic dishes: no allergen data yet
    ingredients:      [],

    confidenceTier:   tier,
    source:           f.source ?? 'hpb',
    sourceUrl:        undefined,
    verified:         f.verified ?? false,
    lastVerified:     f.lastVerified ?? null,

    emoji:            f.emoji,
    category:         'Hawker / Local Dish',
    description:      undefined,
    imageUrl:         null,

    // Generic dishes are not tied to any outlet
    macroSpecificity: deriveMacroSpecificity(null, null),  // → 'generic'

    createdAt:        now,
    updatedAt:        now,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log(`\n🌱  Stride SG Food DB Seed`);
  console.log(`    Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);

  if (CLEAR && !DRY_RUN) {
    console.log('Clearing existing collections...');
    await clearCollection('restaurants');
    await clearCollection('meals');
  }

  const writer = new BatchWriter();

  // ── Restaurants + their menu items ──
  let restaurantCount = 0;
  let menuItemCount   = 0;

  for (const r of SG_RESTAURANTS) {
    if ((r as any).tier === 'place_only') continue; // no data to write for GPS-only entries

    const rRef = db.collection('restaurants').doc(r.id);
    writer.set(rRef, buildRestaurantDoc(r));
    restaurantCount++;

    for (const item of r.menu) {
      const mRef = db.collection('meals').doc(item.id);
      writer.set(mRef, buildMenuItemDoc(item, r));
      menuItemCount++;
    }
  }

  // ── Generic dishes (SG_MACRO_FOODS) ──
  let macroFoodCount = 0;

  for (const f of SG_MACRO_FOODS) {
    const mRef = db.collection('meals').doc(f.id);
    writer.set(mRef, buildMacroFoodDoc(f));
    macroFoodCount++;
  }

  console.log(`  Restaurants:       ${restaurantCount}`);
  console.log(`  Restaurant items:  ${menuItemCount}`);
  console.log(`  Generic dishes:    ${macroFoodCount}`);
  console.log(`  Total meal docs:   ${menuItemCount + macroFoodCount}\n`);

  await writer.commit(DRY_RUN);
}

seed().catch(err => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
