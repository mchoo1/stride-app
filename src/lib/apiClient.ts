/**
 * Stride API Client
 * ─────────────────────────────────────────────────────────────────────────────
 * Typed, authenticated wrapper around every Stride API route.
 * All functions:
 *   1. Obtain the current Firebase ID token (refreshes automatically)
 *   2. Send an authenticated request to the Next.js API route
 *   3. Return typed data or throw on network / auth errors
 *
 * Usage:
 *   import { api } from '@/lib/apiClient';
 *   const logs = await api.food.getToday();
 *   const entry = await api.food.log({ name: 'Banana', calories: 105, ... });
 */

import { auth } from './firebase';

// ── Auth helper ───────────────────────────────────────────────────────────────
async function getToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const token = await getToken();
  const res   = await fetch(path, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Shared types ──────────────────────────────────────────────────────────────
export interface FoodLogEntry {
  id:           string;
  name:         string;
  emoji:        string;
  calories:     number;
  protein:      number;
  carbs:        number;
  fat:          number;
  fibre?:       number | null;
  quantity?:    number | null;   // grams
  mealType?:    string | null;   // breakfast | lunch | dinner | snack
  foodItemId?:  string | null;
  restaurantId?: string | null;
  loggedAt:     string;          // ISO string
}

export interface ActivityLogEntry {
  id:             string;
  name:           string;
  emoji:          string;
  durationMins:   number;
  intensity:      string;        // low | medium | high
  caloriesBurned: number;
  source:         string;        // manual | ai_estimate | apple_health | google_fit
  notes?:         string | null;
  metValue?:      number | null;
  distanceKm?:    number | null;
  steps?:         number | null;
  heartRateAvg?:  number | null;
  heartRateMax?:  number | null;
  loggedAt:       string;        // ISO string
}

export interface WaterLog {
  id:       string;
  amountMl: number;
  loggedAt: string;
}

export interface WeightLog {
  id:          string;
  weightKg:    number;
  bodyFatPct?: number | null;
  date:        string;           // YYYY-MM-DD
  loggedAt:    string;
}

export interface DailySummary {
  date:            string;
  totalCalories:   number;
  totalProteinG:   number;
  totalCarbsG:     number;
  totalFatG:       number;
  totalFibreG:     number;
  totalWaterMl:    number;
  caloriesBurned:  number;
  activeMins:      number;
  netCalories:     number;
  targetCalories?: number | null;
  targetProteinG?: number | null;
  targetCarbsG?:   number | null;
  targetFatG?:     number | null;
  targetWaterMl?:  number | null;
}

export interface UserProfile {
  id:               string;
  name?:            string;
  email?:           string;
  goalType?:        string;
  currentWeight?:   number;
  targetWeight?:    number;
  heightCm?:        number;
  age?:             number;
  gender?:          string;
  activityLevel?:   string;
  targetCalories?:  number;
  targetProtein?:   number;
  targetCarbs?:     number;
  targetFat?:       number;
  targetWater?:     number;
  dietaryFlags?:    string[];
  streak?:          number;
  longestStreak?:   number;
  lastActiveDate?:  string | null;
  onboardingComplete?: boolean;
}

export interface StreakData {
  streak:         number;
  lastActiveDate: string | null;
  longestStreak:  number;
  updated?:       boolean;
}

export interface Recommendation {
  id:      string;
  type:    'food' | 'activity' | 'hydration' | 'habit';
  emoji:   string;
  title:   string;
  body:    string;
  priority: 'high' | 'medium' | 'low';
  action?: { label: string; href: string };
}

// ── Food logs ─────────────────────────────────────────────────────────────────
const food = {
  /** Get all food logs for a date (YYYY-MM-DD). Omit date → all logs. */
  getByDate: (date: string) =>
    request<FoodLogEntry[]>('GET', `/api/food-logs?date=${date}`),

  /** Get today's food logs */
  getToday: () => {
    const today = new Date().toISOString().slice(0, 10);
    return request<FoodLogEntry[]>('GET', `/api/food-logs?date=${today}`);
  },

  /** Log a food item */
  log: (entry: {
    name: string;
    emoji?: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fibre?: number;
    quantity?: number;
    mealType?: string;
    foodItemId?: string;
    restaurantId?: string;
    loggedAt?: string;
  }) => request<FoodLogEntry>('POST', '/api/food-logs', entry),

  /** Delete a food log entry */
  delete: (id: string) =>
    request<{ ok: boolean }>('DELETE', `/api/food-logs?id=${id}`),
};

// ── Activity logs ─────────────────────────────────────────────────────────────
const activity = {
  /** Get activity logs for a date */
  getByDate: (date: string) =>
    request<ActivityLogEntry[]>('GET', `/api/activity-logs?date=${date}`),

  /** Get today's activity logs */
  getToday: () => {
    const today = new Date().toISOString().slice(0, 10);
    return request<ActivityLogEntry[]>('GET', `/api/activity-logs?date=${today}`);
  },

  /** Log an activity */
  log: (entry: {
    name: string;
    emoji?: string;
    durationMins: number;
    intensity?: string;
    caloriesBurned?: number;
    metValue?: number;
    distanceKm?: number;
    steps?: number;
    heartRateAvg?: number;
    heartRateMax?: number;
    source?: string;
    notes?: string;
    loggedAt?: string;
  }) => request<ActivityLogEntry>('POST', '/api/activity-logs', entry),

  /** Delete an activity log entry */
  delete: (id: string) =>
    request<{ ok: boolean }>('DELETE', `/api/activity-logs?id=${id}`),
};

// ── Water logs ────────────────────────────────────────────────────────────────
const water = {
  /** Get total water + individual logs for a date */
  getByDate: (date: string) =>
    request<{ logs: WaterLog[]; totalMl: number }>('GET', `/api/water-logs?date=${date}`),

  /** Get today's water intake */
  getToday: () => {
    const today = new Date().toISOString().slice(0, 10);
    return request<{ logs: WaterLog[]; totalMl: number }>('GET', `/api/water-logs?date=${today}`);
  },

  /** Log a water intake */
  log: (amountMl: number, loggedAt?: string) =>
    request<WaterLog>('POST', '/api/water-logs', { amountMl, loggedAt }),
};

// ── Weight logs ───────────────────────────────────────────────────────────────
const weight = {
  /** Get weight entries for the last N days (default 30) */
  getTrend: (days = 30) =>
    request<WeightLog[]>('GET', `/api/weight-logs?days=${days}`),

  /** Log a weight measurement */
  log: (weightKg: number, bodyFatPct?: number, loggedAt?: string) =>
    request<WeightLog>('POST', '/api/weight-logs', { weightKg, bodyFatPct, loggedAt }),

  /** Delete a weight entry */
  delete: (id: string) =>
    request<{ ok: boolean }>('DELETE', `/api/weight-logs?id=${id}`),
};

// ── Profile ───────────────────────────────────────────────────────────────────
const profile = {
  /** Get the current user's profile */
  get: () => request<UserProfile>('GET', '/api/profile'),

  /** Update profile fields */
  update: (data: Partial<Omit<UserProfile, 'id'>>) =>
    request<UserProfile>('PUT', '/api/profile', data),
};

// ── Daily summary ─────────────────────────────────────────────────────────────
const summary = {
  /** Get today's summary (null if not yet generated) */
  getToday: () => {
    const today = new Date().toISOString().slice(0, 10);
    return request<DailySummary | null>('GET', `/api/daily-summary?date=${today}`);
  },

  /** Get summary for a specific date */
  getByDate: (date: string) =>
    request<DailySummary | null>('GET', `/api/daily-summary?date=${date}`),

  /** Recompute and persist today's summary from all logs */
  recompute: () => request<DailySummary>('POST', '/api/daily-summary'),
};

// ── Streak ────────────────────────────────────────────────────────────────────
const streak = {
  /** Get current streak data */
  get: () => request<StreakData>('GET', '/api/streak'),

  /** Mark today as active (call after any log action) */
  markActive: (date?: string) =>
    request<StreakData>('POST', '/api/streak', date ? { date } : {}),
};

// ── Recommendations ───────────────────────────────────────────────────────────
const recommendations = {
  /** Get personalised recommendations for today */
  get: () => request<Recommendation[]>('GET', '/api/recommendations'),
};

// ── Scan ──────────────────────────────────────────────────────────────────────
export interface ScanResult {
  name:           string;
  emoji:          string;
  calories:       number;
  protein:        number;
  carbs:          number;
  fat:            number;
  confidence:     number;
  estimatedGrams: number;
}

const scan = {
  /** Identify food from a base64 image string */
  fromImage: (base64Image: string) =>
    request<ScanResult>('POST', '/api/scan-food', { image: base64Image }),
};

// ── Nearby places ─────────────────────────────────────────────────────────────
export interface NearbyPlace {
  id:          string;
  name:        string;
  type:        string;
  distance?:   string;
  rating?:     number;
  priceLevel?: number;
  location?:   { lat: number; lng: number };
}

const places = {
  /** Search for nearby food venues */
  getNearby: (lat: number, lng: number, mode: 'restaurant' | 'convenience_store' = 'restaurant') =>
    fetch(`/api/nearby-places?lat=${lat}&lng=${lng}&mode=${mode}`)
      .then(r => r.json()) as Promise<NearbyPlace[]>,
};

// ── Named export ─────────────────────────────────────────────────────────────
export const api = {
  food,
  activity,
  water,
  weight,
  profile,
  summary,
  streak,
  recommendations,
  scan,
  places,
};
