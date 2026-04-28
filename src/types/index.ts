// ── Profile ───────────────────────────────────────────────────────────────────
export type GoalType = 'weight_loss' | 'muscle_gain' | 'maintenance';
export type DietaryFlag =
  | 'vegetarian' | 'vegan' | 'gluten_free'
  | 'lactose_free' | 'keto' | 'halal' | 'kosher'
  | 'dairy_free' | 'nut_free' | 'low_carb' | 'high_protein'
  | 'pescatarian' | 'no_pork';

export interface UserProfile {
  name:               string;
  email:              string;
  avatarUrl?:         string;
  gender?:            'male' | 'female' | 'other';
  goalType:           GoalType;
  currentWeight:      number;   // kg
  targetWeight:       number;   // kg
  heightCm:           number;
  age:                number;
  activityLevel:      'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  targetCalories:     number;
  targetProtein:      number;   // g
  targetCarbs:        number;   // g
  targetFat:          number;   // g
  targetWater:        number;   // ml
  dietaryFlags:       DietaryFlag[];
  onboardingComplete: boolean;
}

// ── Food ─────────────────────────────────────────────────────────────────────
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
  id:       string;
  name:     string;
  brand?:   string;
  emoji:    string;
  calories: number;   // per 100g
  protein:  number;
  carbs:    number;
  fat:      number;
  fibre?:   number;
  source:   'open_food_facts' | 'own' | 'user';
}

export interface FoodLogEntry {
  id:         string;
  foodItemId: string;
  name:       string;
  emoji:      string;
  mealType:   MealType;
  quantity:   number;   // grams
  calories:   number;
  protein:    number;
  carbs:      number;
  fat:        number;
  imageUri?:  string;
  timestamp:  string;   // ISO
}

// ── Activity ─────────────────────────────────────────────────────────────────
export type IntensityLevel = 'low' | 'medium' | 'high';
export type ActivitySource = 'manual' | 'ai_estimate' | 'apple_health' | 'google_fit';

export interface ActivityLogEntry {
  id:             string;
  name:           string;
  emoji:          string;
  durationMins:   number;
  intensity:      IntensityLevel;
  caloriesBurned: number;
  source:         ActivitySource;
  notes?:         string;
  timestamp:      string;
}

// ── Recommendation ────────────────────────────────────────────────────────────
export interface Recommendation {
  id:       string;
  type:     'food' | 'activity' | 'hydration' | 'habit';
  title:    string;
  body:     string;
  emoji:    string;
  priority: 'high' | 'medium' | 'low';
  action?:  { label: string; href: string };
}

// ── Daily Summary ─────────────────────────────────────────────────────────────
export interface DailySummary {
  date:           string;
  calories:       number;
  protein:        number;
  carbs:          number;
  fat:            number;
  water:          number;   // ml
  caloriesBurned: number;
}
