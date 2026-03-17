import type { UserProfile, FoodLogEntry, ActivityLogEntry, Recommendation } from '@/types';
import { uid } from './utils';

/** Rule-based recommendation engine — Phase 1 */
export function generateRecommendations(
  profile:     UserProfile,
  foodLog:     FoodLogEntry[],
  activityLog: ActivityLogEntry[],
): Recommendation[] {
  const recs: Recommendation[] = [];
  const hour = new Date().getHours();

  const totals = foodLog.reduce(
    (a, e) => ({ cal: a.cal + e.calories, pro: a.pro + e.protein, carb: a.carb + e.carbs, fat: a.fat + e.fat }),
    { cal: 0, pro: 0, carb: 0, fat: 0 }
  );
  const burned     = activityLog.reduce((a, e) => a + e.caloriesBurned, 0);
  const remaining  = Math.max(0, profile.targetCalories - totals.cal + burned);
  const proGap     = profile.targetProtein - totals.pro;
  const carbGap    = profile.targetCarbs - totals.carb;
  const noActivity = activityLog.length === 0;

  // ── Protein low ────────────────────────────────────────────────────────────
  if (proGap > 30) {
    recs.push({
      id:       uid(),
      type:     'food',
      priority: 'high',
      emoji:    '💪',
      title:    `You're ${Math.round(proGap)}g of protein short`,
      body:     `Add a high-protein snack like Greek yogurt (17g), a boiled egg (13g), or a protein shake (24g) to hit your goal.`,
      action:   { label: 'Log a snack', href: '/log/food' },
    });
  }

  // ── Calorie budget still available ────────────────────────────────────────
  if (remaining > 400 && hour >= 11 && hour <= 20) {
    recs.push({
      id:       uid(),
      type:     'food',
      priority: 'medium',
      emoji:    '🍽️',
      title:    `${remaining} kcal left in your budget`,
      body:     `${hour < 15 ? 'Lunch' : 'Dinner'} idea: grilled chicken with brown rice and broccoli hits ~450 kcal with 40g of protein.`,
      action:   { label: 'Log a meal', href: '/log/food' },
    });
  }

  // ── Over daily calories ────────────────────────────────────────────────────
  if (totals.cal > profile.targetCalories + 200) {
    const burnNeeded = totals.cal - profile.targetCalories;
    recs.push({
      id:       uid(),
      type:     'activity',
      priority: 'high',
      emoji:    '🏃',
      title:    `You're ${Math.round(totals.cal - profile.targetCalories)} kcal over today`,
      body:     `A ${Math.round(burnNeeded / 8)} minute run or ${Math.round(burnNeeded / 5)} minute brisk walk would bring you back on track.`,
      action:   { label: 'Log activity', href: '/log/activity' },
    });
  }

  // ── No activity yet ────────────────────────────────────────────────────────
  if (noActivity && hour >= 10) {
    recs.push({
      id:       uid(),
      type:     'activity',
      priority: 'medium',
      emoji:    '⚡',
      title:    'No activity logged today',
      body:     `Even a 20-minute walk burns ~100 kcal and improves insulin sensitivity for the rest of the day.`,
      action:   { label: 'Log activity', href: '/log/activity' },
    });
  }

  // ── Carbs low and it's morning ─────────────────────────────────────────────
  if (carbGap > 80 && hour < 11) {
    recs.push({
      id:       uid(),
      type:     'food',
      priority: 'low',
      emoji:    '🥣',
      title:    'Fuel up for the day',
      body:     `Oatmeal with banana gives you ~60g of complex carbs — great for sustained energy through the morning.`,
      action:   { label: 'Log breakfast', href: '/log/food' },
    });
  }

  // ── Vegetarian protein sources ─────────────────────────────────────────────
  if (profile.dietaryFlags.includes('vegetarian') && proGap > 20) {
    recs.push({
      id:       uid(),
      type:     'food',
      priority: 'medium',
      emoji:    '🫘',
      title:    'Plant-based protein boost',
      body:     `Lentils (9g/100g), cottage cheese (11g), or tofu (8g) are great vegetarian options to close your protein gap.`,
      action:   { label: 'Search foods', href: '/log/food' },
    });
  }

  // ── Hydration reminder ─────────────────────────────────────────────────────
  if (hour >= 14 && hour <= 18) {
    recs.push({
      id:       uid(),
      type:     'hydration',
      priority: 'low',
      emoji:    '💧',
      title:    'Mid-afternoon hydration check',
      body:     `Most people are mildly dehydrated by mid-afternoon. Aim for at least 500ml of water before dinner.`,
      action:   { label: 'Log water', href: '/dashboard' },
    });
  }

  // ── Great job streak ───────────────────────────────────────────────────────
  if (totals.cal > 0 && totals.cal < profile.targetCalories && totals.pro >= profile.targetProtein * 0.8) {
    recs.push({
      id:       uid(),
      type:     'habit',
      priority: 'low',
      emoji:    '🌟',
      title:    "You're on track today!",
      body:     `Calories and protein are both looking solid. Keep it up through dinner and you'll nail your daily goals.`,
    });
  }

  // Always return at least one rec
  if (recs.length === 0) {
    recs.push({
      id:       uid(),
      type:     'habit',
      priority: 'low',
      emoji:    '👋',
      title:    'Start logging to get personalised tips',
      body:     'Log your first meal or workout and Stride will start suggesting personalised improvements for you.',
      action:   { label: 'Log a meal', href: '/log/food' },
    });
  }

  return recs.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });
}
