import type { FoodItem } from '@/types';

export const MOCK_FOODS: FoodItem[] = [
  { id: 'f001', name: 'Chicken Breast (grilled)', emoji: '🍗', calories: 165, protein: 31, carbs: 0,  fat: 3.6, source: 'own' },
  { id: 'f002', name: 'Brown Rice (cooked)',      emoji: '🍚', calories: 123, protein: 2.7, carbs: 26, fat: 0.9, source: 'own' },
  { id: 'f003', name: 'Egg (whole, large)',        emoji: '🥚', calories: 143, protein: 13, carbs: 1,  fat: 10,  source: 'own' },
  { id: 'f004', name: 'Greek Yogurt (0% fat)',     emoji: '🥛', calories: 59,  protein: 10, carbs: 3.6, fat: 0.4, source: 'own' },
  { id: 'f005', name: 'Banana',                    emoji: '🍌', calories: 89,  protein: 1.1, carbs: 23, fat: 0.3, source: 'own' },
  { id: 'f006', name: 'Almonds (raw)',              emoji: '🥜', calories: 579, protein: 21, carbs: 22, fat: 50,  source: 'own' },
  { id: 'f007', name: 'Salmon (baked)',             emoji: '🐟', calories: 208, protein: 20, carbs: 0,  fat: 13,  source: 'own' },
  { id: 'f008', name: 'Sweet Potato (baked)',       emoji: '🍠', calories: 90,  protein: 2,  carbs: 21, fat: 0.1, source: 'own' },
  { id: 'f009', name: 'Oatmeal (rolled oats)',      emoji: '🥣', calories: 389, protein: 17, carbs: 66, fat: 7,   source: 'own' },
  { id: 'f010', name: 'Avocado',                    emoji: '🥑', calories: 160, protein: 2,  carbs: 9,  fat: 15,  source: 'own' },
  { id: 'f011', name: 'Broccoli (steamed)',         emoji: '🥦', calories: 35,  protein: 2.4, carbs: 7,  fat: 0.4, source: 'own' },
  { id: 'f012', name: 'Whole Wheat Bread (1 slice)',emoji: '🍞', calories: 69,  protein: 3.6, carbs: 12, fat: 1,   source: 'own' },
  { id: 'f013', name: 'Milk (semi-skimmed)',        emoji: '🥛', calories: 50,  protein: 3.4, carbs: 5,  fat: 1.8, source: 'own' },
  { id: 'f014', name: 'Cheddar Cheese',             emoji: '🧀', calories: 403, protein: 25, carbs: 1.3, fat: 33,  source: 'own' },
  { id: 'f015', name: 'Tuna (canned in water)',     emoji: '🐟', calories: 116, protein: 26, carbs: 0,  fat: 1,   source: 'own' },
  { id: 'f016', name: 'Pasta (cooked)',              emoji: '🍝', calories: 131, protein: 5,  carbs: 25, fat: 1.1, source: 'own' },
  { id: 'f017', name: 'Orange',                     emoji: '🍊', calories: 47,  protein: 0.9, carbs: 12, fat: 0.1, source: 'own' },
  { id: 'f018', name: 'Spinach (raw)',               emoji: '🥬', calories: 23,  protein: 2.9, carbs: 3.6, fat: 0.4, source: 'own' },
  { id: 'f019', name: 'Quinoa (cooked)',             emoji: '🌾', calories: 120, protein: 4.4, carbs: 21, fat: 1.9, source: 'own' },
  { id: 'f020', name: 'Peanut Butter (natural)',    emoji: '🥜', calories: 588, protein: 25, carbs: 20, fat: 50,  source: 'own' },
  { id: 'f021', name: 'Blueberries',                emoji: '🫐', calories: 57,  protein: 0.7, carbs: 14, fat: 0.3, source: 'own' },
  { id: 'f022', name: 'Lentils (cooked)',            emoji: '🫘', calories: 116, protein: 9,  carbs: 20, fat: 0.4, source: 'own' },
  { id: 'f023', name: 'Olive Oil',                  emoji: '🫒', calories: 884, protein: 0,  carbs: 0,  fat: 100, source: 'own' },
  { id: 'f024', name: 'Protein Shake (whey)',        emoji: '🧃', calories: 120, protein: 24, carbs: 5,  fat: 2,   source: 'own' },
  { id: 'f025', name: 'Apple',                      emoji: '🍎', calories: 52,  protein: 0.3, carbs: 14, fat: 0.2, source: 'own' },
  { id: 'f026', name: 'Cottage Cheese (low fat)',   emoji: '🥛', calories: 98,  protein: 11, carbs: 3.4, fat: 4.3, source: 'own' },
  { id: 'f027', name: 'Hummus',                     emoji: '🫘', calories: 166, protein: 8,  carbs: 14, fat: 10,  source: 'own' },
  { id: 'f028', name: 'Caesar Salad (no dressing)', emoji: '🥗', calories: 40,  protein: 3,  carbs: 6,  fat: 1,   source: 'own' },
  { id: 'f029', name: 'Steak (sirloin, grilled)',   emoji: '🥩', calories: 207, protein: 30, carbs: 0,  fat: 9,   source: 'own' },
  { id: 'f030', name: 'Sushi Roll (salmon, 6 pcs)', emoji: '🍱', calories: 300, protein: 15, carbs: 42, fat: 7,   source: 'own' },
];

export const MOCK_SCAN_RESULTS = [
  { name: 'Grilled Chicken & Vegetables', calories: 320, protein: 38, carbs: 14, fat: 9,  confidence: 0.91, emoji: '🍗' },
  { name: 'Caesar Salad with Croutons',   calories: 280, protein: 8,  carbs: 18, fat: 20, confidence: 0.85, emoji: '🥗' },
  { name: 'Pasta Bolognese',              calories: 520, protein: 24, carbs: 62, fat: 18, confidence: 0.88, emoji: '🍝' },
  { name: 'Avocado Toast',                calories: 340, protein: 9,  carbs: 32, fat: 20, confidence: 0.93, emoji: '🥑' },
  { name: 'Smoothie Bowl',                calories: 410, protein: 12, carbs: 68, fat: 10, confidence: 0.87, emoji: '🥣' },
  { name: 'Burger & Fries',               calories: 880, protein: 32, carbs: 90, fat: 44, confidence: 0.90, emoji: '🍔' },
  { name: 'Sushi Platter (12 pieces)',    calories: 480, protein: 26, carbs: 66, fat: 10, confidence: 0.89, emoji: '🍱' },
  { name: 'Açaí Bowl',                    calories: 360, protein: 8,  carbs: 58, fat: 12, confidence: 0.84, emoji: '🫐' },
];

export const ACTIVITY_PRESETS = [
  { name: 'Running',          emoji: '🏃', met: 8.0,  intensity: 'high'   as const },
  { name: 'Brisk Walking',    emoji: '🚶', met: 3.5,  intensity: 'low'    as const },
  { name: 'Cycling',          emoji: '🚴', met: 6.0,  intensity: 'medium' as const },
  { name: 'Swimming',         emoji: '🏊', met: 7.0,  intensity: 'high'   as const },
  { name: 'Weight Training',  emoji: '🏋️', met: 5.0,  intensity: 'medium' as const },
  { name: 'Yoga',             emoji: '🧘', met: 2.5,  intensity: 'low'    as const },
  { name: 'HIIT',             emoji: '⚡', met: 9.0,  intensity: 'high'   as const },
  { name: 'Pilates',          emoji: '🤸', met: 3.0,  intensity: 'low'    as const },
  { name: 'Football',         emoji: '⚽', met: 7.0,  intensity: 'high'   as const },
  { name: 'Basketball',       emoji: '🏀', met: 6.5,  intensity: 'high'   as const },
  { name: 'Tennis',           emoji: '🎾', met: 7.3,  intensity: 'high'   as const },
  { name: 'Dancing',          emoji: '💃', met: 4.5,  intensity: 'medium' as const },
  { name: 'Hiking',           emoji: '🥾', met: 5.3,  intensity: 'medium' as const },
  { name: 'Stretching',       emoji: '🤾', met: 2.3,  intensity: 'low'    as const },
  { name: 'Jump Rope',        emoji: '🪢', met: 10.0, intensity: 'high'   as const },
];

/** Estimate calories burned: MET × weight(kg) × hours */
export function estimateCaloriesBurned(
  met: number,
  durationMins: number,
  weightKg = 70
): number {
  return Math.round(met * weightKg * (durationMins / 60));
}
