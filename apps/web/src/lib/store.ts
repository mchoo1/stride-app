'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateTargetCalories, calculateMacros, uid, todayKey } from './utils';
import type {
  UserProfile, FoodLogEntry, ActivityLogEntry,
  MealType, IntensityLevel, ActivitySource, GoalType,
} from '@/types';

// ── Default profile ───────────────────────────────────────────────────────────
const DEFAULT_PROFILE: UserProfile = {
  name:               '',
  email:              '',
  goalType:           'weight_loss',
  currentWeight:      75,
  targetWeight:       65,
  heightCm:           170,
  age:                27,
  activityLevel:      'moderate',
  targetCalories:     1700,
  targetProtein:      128,
  targetCarbs:        170,
  targetFat:          57,
  targetWater:        2500,
  dietaryFlags:       [],
  onboardingComplete: false,
};

// ── Store ─────────────────────────────────────────────────────────────────────
interface StrideStore {
  // State
  profile:      UserProfile;
  foodLog:      FoodLogEntry[];
  activityLog:  ActivityLogEntry[];
  waterMl:      Record<string, number>; // date → ml

  // Profile actions
  updateProfile:          (updates: Partial<UserProfile>) => void;
  completeOnboarding:     (data: Partial<UserProfile>) => void;

  // Food log actions
  addFoodEntry: (entry: Omit<FoodLogEntry, 'id' | 'timestamp'>) => void;
  removeFoodEntry:        (id: string) => void;

  // Activity log actions
  addActivityEntry: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void;
  removeActivityEntry:    (id: string) => void;

  // Water actions
  addWater:               (ml: number) => void;
  resetWater:             () => void;

  // Computed
  getTodayFoodLog:        () => FoodLogEntry[];
  getTodayActivityLog:    () => ActivityLogEntry[];
  getTodayTotals:         () => { calories: number; protein: number; carbs: number; fat: number };
  getTodayCaloriesBurned: () => number;
  getTodayWater:          () => number;
  getCaloriesRemaining:   () => number;
}

export const useStrideStore = create<StrideStore>()(
  persist(
    (set, get) => ({
      profile:     DEFAULT_PROFILE,
      foodLog:     [],
      activityLog: [],
      waterMl:     {},

      // ── Profile ──────────────────────────────────────────────────────────────
      updateProfile: (updates) =>
        set((s) => ({ profile: { ...s.profile, ...updates } })),

      completeOnboarding: (data) => {
        const merged = { ...DEFAULT_PROFILE, ...data };
        const calories = calculateTargetCalories(merged);
        const macros   = calculateMacros(calories, merged.goalType);
        set({
          profile: {
            ...merged,
            targetCalories:     calories,
            targetProtein:      macros.protein,
            targetCarbs:        macros.carbs,
            targetFat:          macros.fat,
            onboardingComplete: true,
          },
        });
      },

      // ── Food ─────────────────────────────────────────────────────────────────
      addFoodEntry: (entry) =>
        set((s) => ({
          foodLog: [
            ...s.foodLog,
            { ...entry, id: uid(), timestamp: new Date().toISOString() },
          ],
        })),

      removeFoodEntry: (id) =>
        set((s) => ({ foodLog: s.foodLog.filter((e) => e.id !== id) })),

      // ── Activity ──────────────────────────────────────────────────────────────
      addActivityEntry: (entry) =>
        set((s) => ({
          activityLog: [
            ...s.activityLog,
            { ...entry, id: uid(), timestamp: new Date().toISOString() },
          ],
        })),

      removeActivityEntry: (id) =>
        set((s) => ({ activityLog: s.activityLog.filter((e) => e.id !== id) })),

      // ── Water ─────────────────────────────────────────────────────────────────
      addWater: (ml) =>
        set((s) => {
          const key  = todayKey();
          const prev = s.waterMl[key] ?? 0;
          return { waterMl: { ...s.waterMl, [key]: prev + ml } };
        }),

      resetWater: () =>
        set((s) => ({ waterMl: { ...s.waterMl, [todayKey()]: 0 } })),

      // ── Computed ──────────────────────────────────────────────────────────────
      getTodayFoodLog: () => {
        const today = todayKey();
        const log = get().foodLog;
        return (Array.isArray(log) ? log : []).filter(
          (e) => new Date(e.timestamp).toDateString() === today
        );
      },

      getTodayActivityLog: () => {
        const today = todayKey();
        const log = get().activityLog;
        return (Array.isArray(log) ? log : []).filter(
          (e) => new Date(e.timestamp).toDateString() === today
        );
      },

      getTodayTotals: () => {
        return get()
          .getTodayFoodLog()
          .reduce(
            (acc, e) => ({
              calories: acc.calories + e.calories,
              protein:  acc.protein  + e.protein,
              carbs:    acc.carbs    + e.carbs,
              fat:      acc.fat      + e.fat,
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
          );
      },

      getTodayCaloriesBurned: () => {
        return get()
          .getTodayActivityLog()
          .reduce((acc, e) => acc + e.caloriesBurned, 0);
      },

      getTodayWater: () => get().waterMl[todayKey()] ?? 0,

      getCaloriesRemaining: () => {
        const { targetCalories } = get().profile;
        const { calories }       = get().getTodayTotals();
        const burned             = get().getTodayCaloriesBurned();
        return Math.max(0, targetCalories - calories + burned);
      },
    }),
    { name: 'stride-store' }
  )
);
