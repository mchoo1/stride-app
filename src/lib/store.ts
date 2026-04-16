'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateTargetCalories, calculateMacros, uid, todayKey } from './utils';
import type {
  UserProfile, FoodLogEntry, ActivityLogEntry,
  MealType, IntensityLevel, ActivitySource, GoalType,
} from '@/types';

export interface WeightEntry {
  id: string;
  date: string;       // YYYY-MM-DD
  weight: number;     // kg
  bodyFat?: number;   // %
}

export interface DailyChallenge {
  id:       string;
  label:    string;
  emoji:    string;
  target:   number;
  current:  number;
  done:     boolean;
  xp:       number;
}

// ── Default profile ───────────────────────────────────────────────────────────
const DEFAULT_PROFILE: UserProfile = {
  name:               '',
  email:              '',
  gender:             'male',
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
  weightLog:    WeightEntry[];
  streak:       number;
  lastActiveDate: string; // YYYY-MM-DD

  // Profile actions
  updateProfile:          (updates: Partial<UserProfile>) => void;
  completeOnboarding:     (data: Partial<UserProfile>) => void;
  resetAll:               () => void;

  // Food log actions
  addFoodEntry: (entry: Omit<FoodLogEntry, 'id' | 'timestamp'>) => void;
  removeFoodEntry:        (id: string) => void;

  // Activity log actions
  addActivityEntry: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void;
  removeActivityEntry:    (id: string) => void;

  // Water actions
  addWater:               (ml: number) => void;
  resetWater:             () => void;

  // Body metrics actions
  addWeightEntry:         (weight: number, bodyFat?: number) => void;
  getWeightTrend:         (days?: number) => WeightEntry[];

  // Gamification
  updateStreak:           () => void;
  getDailyChallenges:     () => DailyChallenge[];

  // Computed
  getTodayFoodLog:        () => FoodLogEntry[];
  getTodayActivityLog:    () => ActivityLogEntry[];
  getTodayTotals:         () => { calories: number; protein: number; carbs: number; fat: number };
  getTodayCaloriesBurned: () => number;
  getTodayWater:          () => number;
  getCaloriesRemaining:   () => number;
  getNetCalories:         () => number;
}

export const useStrideStore = create<StrideStore>()(
  persist(
    (set, get) => ({
      profile:        DEFAULT_PROFILE,
      foodLog:        [],
      activityLog:    [],
      waterMl:        {},
      weightLog:      [],
      streak:         0,
      lastActiveDate: '',

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

      resetAll: () => {
        set({
          profile:        DEFAULT_PROFILE,
          foodLog:        [],
          activityLog:    [],
          waterMl:        {},
          weightLog:      [],
          streak:         0,
          lastActiveDate: '',
        });
      },

      // ── Food ─────────────────────────────────────────────────────────────────
      addFoodEntry: (entry) => {
        set((s) => ({
          foodLog: [...s.foodLog, { ...entry, id: uid(), timestamp: new Date().toISOString() }],
        }));
        get().updateStreak();
      },

      removeFoodEntry: (id) =>
        set((s) => ({ foodLog: s.foodLog.filter((e) => e.id !== id) })),

      // ── Activity ──────────────────────────────────────────────────────────────
      addActivityEntry: (entry) => {
        set((s) => ({
          activityLog: [...s.activityLog, { ...entry, id: uid(), timestamp: new Date().toISOString() }],
        }));
        get().updateStreak();
      },

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

      // ── Body Metrics ──────────────────────────────────────────────────────────
      addWeightEntry: (weight, bodyFat) => {
        const today = new Date().toISOString().slice(0, 10);
        set((s) => {
          // replace today's entry if it exists
          const filtered = s.weightLog.filter((e) => e.date !== today);
          return {
            weightLog: [...filtered, { id: uid(), date: today, weight, bodyFat }],
            profile: { ...s.profile, currentWeight: weight },
          };
        });
      },

      getWeightTrend: (days = 30) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return get().weightLog
          .filter((e) => new Date(e.date) >= cutoff)
          .sort((a, b) => a.date.localeCompare(b.date));
      },

      // ── Gamification ──────────────────────────────────────────────────────────
      updateStreak: () => {
        const today = new Date().toISOString().slice(0, 10);
        const { lastActiveDate, streak } = get();
        if (lastActiveDate === today) return; // already updated today
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().slice(0, 10);
        const newStreak = lastActiveDate === yStr ? streak + 1 : 1;
        set({ streak: newStreak, lastActiveDate: today });
      },

      getDailyChallenges: (): DailyChallenge[] => {
        const foodLog   = get().getTodayFoodLog();
        const burned    = get().getTodayCaloriesBurned();
        const net       = get().getNetCalories();
        const target    = get().profile.targetCalories;
        const onTarget  = net >= target * 0.85 && net <= target * 1.05;
        return [
          {
            id: 'log3meals', label: 'Log 3 meals today', emoji: '🍽️',
            target: 3, current: Math.min(foodLog.length, 3),
            done: foodLog.length >= 3, xp: 30,
          },
          {
            id: 'burn200', label: 'Burn 200 kcal', emoji: '🔥',
            target: 200, current: Math.min(burned, 200),
            done: burned >= 200, xp: 40,
          },
          {
            id: 'hitgoal', label: 'Hit your calorie goal', emoji: '🎯',
            target: 1, current: onTarget ? 1 : 0,
            done: onTarget, xp: 50,
          },
        ];
      },

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

      getNetCalories: () => {
        const { calories } = get().getTodayTotals();
        const burned       = get().getTodayCaloriesBurned();
        return Math.max(0, calories - burned);
      },
    }),
    { name: 'stride-store' }
  )
);
