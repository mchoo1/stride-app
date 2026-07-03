/**
 * useMealOverlay — lazy Firestore overlay for a single menu item
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches /meals/{id} and /meal_community_stats/{id} when shouldFetch = true
 * (i.e. when the card is expanded). Returns null until the fetch completes.
 *
 * Fails silently when offline or when Firestore is not configured, so the
 * static sgFoodDb data always renders — this is purely additive enrichment.
 */

import { useState, useEffect } from 'react';
import { doc, getDoc }         from 'firebase/firestore';
import { db }                  from '@/lib/firebase';
import type { FirestoreMeal, FirestoreMealCommunityStats } from '@/lib/firestoreFoodDb';

export interface MealOverlay {
  meal?:  FirestoreMeal;
  stats?: FirestoreMealCommunityStats;
}

/**
 * @param id          sgFoodDb item id — used as the Firestore /meals doc id
 * @param shouldFetch Gate the fetch; pass `isExpanded` so we only read Firestore
 *                    when the card is open. Prevents N reads for every visible card.
 */
export function useMealOverlay(id: string, shouldFetch: boolean): MealOverlay | null {
  const [overlay, setOverlay] = useState<MealOverlay | null>(null);

  useEffect(() => {
    if (!shouldFetch || !db) return;

    let cancelled = false;

    async function fetchOverlay() {
      try {
        const [mealSnap, statsSnap] = await Promise.all([
          getDoc(doc(db!, 'meals', id)),
          getDoc(doc(db!, 'meal_community_stats', id)),
        ]);

        if (cancelled) return;

        const meal  = mealSnap.exists()  ? (mealSnap.data()  as FirestoreMeal)              : undefined;
        const stats = statsSnap.exists() ? (statsSnap.data() as FirestoreMealCommunityStats) : undefined;

        // Only update state if we got something (avoids overwriting prior data on re-fetch)
        if (meal || stats) setOverlay({ meal, stats });
      } catch {
        // Offline, permission denied, or Firestore not initialised — ignore silently.
        // Static sgFoodDb data remains the source of truth.
      }
    }

    fetchOverlay();
    return () => { cancelled = true; };
  }, [id, shouldFetch]); // eslint-disable-line react-hooks/exhaustive-deps

  return overlay;
}
