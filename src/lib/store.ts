'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateTargetCalories, calculateMacros, uid, todayKey } from './utils';
import { api } from './apiClient';
import type {
  UserProfile, FoodLogEntry, ActivityLogEntry,
  MealType, IntensityLevel, ActivitySource, GoalType,
} from '@/types';

// ── Fire-and-forget helper — never blocks the UI ──────────────────────────────
function bg(fn: () => Promise<unknown>) {
  fn().catch(() => { /* silently ignore sync errors */ });
}

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

  // Server sync
  loadTodayFromServer:    () => Promise<void>;
  syncProfileFromServer:  () => Promise<void>;

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

      // ── Server sync ───────────────────────────────────────────────────────────
      /**
       * Called on dashboard mount — pulls today's food/activity/water from
       * Firestore and merges into local state so the UI is always current.
       * Falls back gracefully if the user is offline or not logged in.
       */
      loadTodayFromServer: async () => {
        try {
          const today = new Date().toISOString().slice(0, 10);
          const [foodLogs, actLogs, waterData, streakData] = await Promise.all([
            api.food.getByDate(today),
            api.activity.getByDate(today),
            api.water.getByDate(today),
            api.streak.get(),
          ]);

          set((s) => {
            // Merge server food logs — keep local-only entries, replace server ones by id
            const serverFoodIds = new Set(foodLogs.map(f => f.id));
            const localOnly = s.foodLog.filter(e => !serverFoodIds.has(e.id));
            const mergedFood: FoodLogEntry[] = [
              ...localOnly,
              ...foodLogs.map(f => ({
                id:        f.id,
                foodItemId: f.foodItemId ?? f.id,
                name:      f.name,
                emoji:     f.emoji,
                mealType:  (f.mealType ?? 'snack') as MealType,
                quantity:  f.quantity ?? 100,
                calories:  f.calories,
                protein:   f.protein,
                carbs:     f.carbs,
                fat:       f.fat,
                timestamp: f.loggedAt,
              })),
            ];

            // Merge server activity logs
            const serverActIds = new Set(actLogs.map(a => a.id));
            const localActOnly = s.activityLog.filter(e => !serverActIds.has(e.id));
            const mergedAct: ActivityLogEntry[] = [
              ...localActOnly,
              ...actLogs.map(a => ({
                id:             a.id,
                name:           a.name,
                emoji:          a.emoji,
                durationMins:   a.durationMins,
                intensity:      (a.intensity ?? 'medium') as IntensityLevel,
                caloriesBurned: a.caloriesBurned,
                source:         (a.source ?? 'manual') as ActivitySource,
                notes:          a.notes ?? undefined,
                timestamp:      a.loggedAt,
              })),
            ];

            // Merge water
            const key = todayKey();
            return {
              foodLog:     mergedFood,
              activityLog: mergedAct,
              waterMl:     { ...s.waterMl, [key]: waterData.totalMl },
              streak:         streakData.streak,
              lastActiveDate: streakData.lastActiveDate ?? s.lastActiveDate,
            };
          });
        } catch {
          // Offline or unauthenticated — local state is already hydrated from localStorage
        }
      },

      /**
       * Pull profile from Firestore and update local state.
       * Called after login and on the Me/Profile pages.
       */
      syncProfileFromServer: async () => {
        try {
          const serverProfile = await api.profile.get();
          set((s) => ({
            profile: {
              ...s.profile,
              name:               serverProfile.name            ?? s.profile.name,
              email:              serverProfile.email           ?? s.profile.email,
              goalType:           (serverProfile.goalType       ?? s.profile.goalType) as GoalType,
              currentWeight:      serverProfile.currentWeight   ?? s.profile.currentWeight,
              targetWeight:       serverProfile.targetWeight    ?? s.profile.targetWeight,
              heightCm:           serverProfile.heightCm        ?? s.profile.heightCm,
              age:                serverProfile.age             ?? s.profile.age,
              gender:             (serverProfile.gender         ?? s.profile.gender) as UserProfile['gender'],
              activityLevel:      (serverProfile.activityLevel  ?? s.profile.activityLevel) as UserProfile['activityLevel'],
              targetCalories:     serverProfile.targetCalories  ?? s.profile.targetCalories,
              targetProtein:      serverProfile.targetProtein   ?? s.profile.targetProtein,
              targetCarbs:        serverProfile.targetCarbs     ?? s.profile.targetCarbs,
              targetFat:          serverProfile.targetFat       ?? s.profile.targetFat,
              targetWater:        serverProfile.targetWater     ?? s.profile.targetWater,
              dietaryFlags:       (serverProfile.dietaryFlags   ?? s.profile.dietaryFlags) as UserProfile['dietaryFlags'],
              onboardingComplete: serverProfile.onboardingComplete ?? s.profile.onboardingComplete,
            },
            streak:         serverProfile.streak         ?? s.streak,
            lastActiveDate: serverProfile.lastActiveDate ?? s.lastActiveDate,
          }));
        } catch {
          // Ignore — keep local state
        }
      },

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
        const now       = new Date().toISOString();
        const localId   = uid();
        // 1. Optimistic local update
        set((s) => ({
          foodLog: [...s.foodLog, { ...entry, id: localId, timestamp: now }],
        }));
        // 2. Background Firestore sync + streak + summary recompute
        bg(async () => {
          await api.food.log({
            name:      entry.name,
            emoji:     entry.emoji,
            calories:  entry.calories,
            protein:   entry.protein,
            carbs:     entry.carbs,
            fat:       entry.fat,
            quantity:  entry.quantity,
            mealType:  entry.mealType,
            loggedAt:  now,
          });
          await Promise.all([
            api.streak.markActive(),
            api.summary.recompute(),
          ]);
        });
        get().updateStreak();
      },

      removeFoodEntry: (id) => {
        set((s) => ({ foodLog: s.foodLog.filter((e) => e.id !== id) }));
        bg(async () => {
          await api.food.delete(id);
          await api.summary.recompute();
        });
      },

      // ── Activity ──────────────────────────────────────────────────────────────
      addActivityEntry: (entry) => {
        const now     = new Date().toISOString();
        const localId = uid();
        set((s) => ({
          activityLog: [...s.activityLog, { ...entry, id: localId, timestamp: now }],
        }));
        bg(async () => {
          await api.activity.log({
            name:           entry.name,
            emoji:          entry.emoji,
            durationMins:   entry.durationMins,
            intensity:      entry.intensity,
            caloriesBurned: entry.caloriesBurned,
            source:         entry.source,
            notes:          entry.notes,
            loggedAt:       now,
          });
          await Promise.all([
            api.streak.markActive(),
            api.summary.recompute(),
          ]);
        });
        get().updateStreak();
      },

      removeActivityEntry: (id) => {
        set((s) => ({ activityLog: s.activityLog.filter((e) => e.id !== id) }));
        bg(async () => {
          await api.activity.delete(id);
          await api.summary.recompute();
        });
      },

      // ── Water ─────────────────────────────────────────────────────────────────
      addWater: (ml) => {
        set((s) => {
          const key  = todayKey();
          const prev = s.waterMl[key] ?? 0;
          return { waterMl: { ...s.waterMl, [key]: prev + ml } };
        });
        bg(() => api.water.log(ml));
      },

      resetWater: () =>
        set((s) => ({ waterMl: { ...s.waterMl, [todayKey()]: 0 } })),

      // ── Body Metrics ──────────────────────────────────────────────────────────
      addWeightEntry: (weight, bodyFat) => {
        const today = new Date().toISOString().slice(0, 10);
        set((s) => {
          const filtered = s.weightLog.filter((e) => e.date !== today);
          return {
            weightLog: [...filtered, { id: uid(), date: today, weight, bodyFat }],
            profile:   { ...s.profile, currentWeight: weight },
          };
        });
        bg(() => api.weight.log(weight, bodyFat));
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
