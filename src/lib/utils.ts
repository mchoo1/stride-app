import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { UserProfile } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Mifflin-St Jeor BMR (kcal/day at complete rest) */
export function calculateBMR(profile: Partial<UserProfile>): number {
  const { currentWeight = 70, heightCm = 170, age = 25 } = profile;
  return Math.round(10 * currentWeight + 6.25 * heightCm - 5 * age + 5);
}

/** Mifflin-St Jeor equation for BMR, then multiply by activity factor */
export function calculateTargetCalories(profile: Partial<UserProfile>): number {
  const { currentWeight = 70, heightCm = 170, age = 25, activityLevel = 'moderate', goalType = 'maintenance' } = profile;

  const bmr = 10 * currentWeight + 6.25 * heightCm - 5 * age + 5; // simplified (male baseline)

  const factors: Record<string, number> = {
    sedentary:   1.2,
    light:       1.375,
    moderate:    1.55,
    active:      1.725,
    very_active: 1.9,
  };

  const tdee = Math.round(bmr * (factors[activityLevel] ?? 1.55));

  const adjustments: Record<string, number> = {
    weight_loss:  -500,
    muscle_gain:  +300,
    maintenance:  0,
  };

  return Math.max(1200, tdee + (adjustments[goalType] ?? 0));
}

/** Calculate macro targets from calories and goal */
export function calculateMacros(calories: number, goalType: string) {
  const ratios: Record<string, [number, number, number]> = {
    weight_loss:  [0.40, 0.30, 0.30], // carbs, protein, fat
    muscle_gain:  [0.40, 0.35, 0.25],
    maintenance:  [0.45, 0.30, 0.25],
  };
  const [carbRatio, proRatio, fatRatio] = ratios[goalType] ?? ratios.maintenance;
  return {
    carbs:   Math.round((calories * carbRatio) / 4),
    protein: Math.round((calories * proRatio)  / 4),
    fat:     Math.round((calories * fatRatio)  / 9),
  };
}

/** Format a timestamp to a friendly time string */
export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Format a date to a friendly string */
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Get today's date string (used as key) */
export function todayKey(): string {
  return new Date().toDateString();
}

/** Clamp a value between min and max */
export function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

/** Get greeting based on time of day */
export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Get a colour for a macro ring (dark-mode neon palette) */
export const MACRO_COLORS = {
  calories: '#FF5A5A',
  protein:  '#4E9BFF',
  carbs:    '#FFD166',
  fat:      '#00D68F',
  water:    '#00C4FF',
};

/** Percentage bar value, clamped 0–100 */
export function pct(value: number, goal: number): number {
  if (!goal) return 0;
  return clamp(Math.round((value / goal) * 100), 0, 100);
}

/** Unique ID generator */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
