// ============================================================
//  Stride — Firestore Database Types
//  Mirrors fitlife-schema-api.docx + schema.sql
// ============================================================

import { Timestamp } from 'firebase/firestore';

// ─── Enums ───────────────────────────────────────────────────
export type GoalType       = 'weight_loss' | 'muscle_gain' | 'maintenance';
export type ActivityLevel  = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type MealType       = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type IntensityLevel = 'low' | 'medium' | 'high';
export type ActivitySource = 'manual' | 'ai_estimate' | 'apple_health' | 'fitbit' | 'garmin' | 'google_fit';
export type PostType       = 'meal' | 'workout' | 'restaurant' | 'grocery';
export type ProviderType   = 'restaurant' | 'gym' | 'supermarket' | 'delivery_app' | 'nutritionist' | 'pt';
export type BookingStatus  = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type DietaryFlag    = 'vegetarian' | 'vegan' | 'gluten_free' | 'lactose_free' | 'keto' | 'halal' | 'kosher';
export type WearableType   = 'apple_health' | 'fitbit' | 'garmin' | 'google_fit' | 'strava' | 'wahoo';
export type UserType       = 'consumer' | 'professional' | 'provider';
export type FoodSource     = 'usda' | 'open_food_facts' | 'community' | 'provider';
export type LogSource      = 'manual' | 'scan' | 'barcode' | 'community';

// ─── /users/{uid} ────────────────────────────────────────────
export interface DbUser {
  email:            string;
  name:             string;
  avatarUrl?:       string;
  userType:         UserType;
  // Body metrics
  dateOfBirth?:     string;       // ISO date
  gender?:          'male' | 'female' | 'other' | 'prefer_not';
  heightCm?:        number;
  weightKg?:        number;
  // Goals
  goalType:         GoalType;
  targetWeightKg?:  number;
  activityLevel:    ActivityLevel;
  dietaryFlags:     DietaryFlag[];
  // Calculated daily targets
  targetCalories:   number;
  targetProteinG:   number;
  targetCarbsG:     number;
  targetFatG:       number;
  targetWaterMl:    number;
  // Gamification
  streakDays:       number;
  lastLogDate?:     string;       // ISO date YYYY-MM-DD
  totalLogs:        number;
  // Flags
  isVerifiedPro:    boolean;
  onboardingDone:   boolean;
  // Timestamps
  createdAt:        Timestamp;
  updatedAt:        Timestamp;
}

// ─── /users/{uid}/wearables/{id} ─────────────────────────────
export interface DbWearable {
  wearableType:   WearableType;
  accessToken?:   string;
  refreshToken?:  string;
  tokenExpires?:  Timestamp;
  lastSyncedAt?:  Timestamp;
  isActive:       boolean;
  createdAt:      Timestamp;
}

// ─── /users/{uid}/foodLogs/{id} ──────────────────────────────
export interface DbFoodLog {
  foodId?:         string;        // ref to /foods/{id} if from DB
  foodName:        string;
  foodEmoji:       string;
  mealType:        MealType;
  quantityG:       number;
  // Calculated macros (quantity-adjusted)
  calories:        number;
  proteinG:        number;
  carbsG:          number;
  fatG:            number;
  // Scan metadata
  imageUrl?:       string;
  scanConfidence?: number;
  source:          LogSource;
  loggedAt:        Timestamp;
  createdAt:       Timestamp;
}

// ─── /users/{uid}/activityLogs/{id} ──────────────────────────
export interface DbActivityLog {
  name:           string;
  emoji:          string;
  durationMins:   number;
  intensity:      IntensityLevel;
  caloriesBurned: number;
  metValue?:      number;
  distanceKm?:    number;
  steps?:         number;
  heartRateAvg?:  number;
  heartRateMax?:  number;
  source:         ActivitySource;
  wearableId?:    string;
  notes?:         string;
  loggedAt:       Timestamp;
  createdAt:      Timestamp;
}

// ─── /users/{uid}/waterLogs/{id} ─────────────────────────────
export interface DbWaterLog {
  amountMl:  number;
  loggedAt:  Timestamp;
}

// ─── /users/{uid}/dailySummaries/{YYYY-MM-DD} ────────────────
export interface DbDailySummary {
  summaryDate:     string;        // YYYY-MM-DD
  // Intake totals
  totalCalories:   number;
  totalProteinG:   number;
  totalCarbsG:     number;
  totalFatG:       number;
  totalWaterMl:    number;
  // Activity totals
  caloriesBurned:  number;
  activeMins:      number;
  steps?:          number;
  // Goals snapshot
  calorieGoal?:    number;
  proteinGoal?:    number;
  carbsGoal?:      number;
  fatGoal?:        number;
  goalMet?:        boolean;
  createdAt:       Timestamp;
  updatedAt:       Timestamp;
}

// ─── /foods/{id} ─────────────────────────────────────────────
export interface DbFood {
  name:              string;
  brand?:            string;
  emoji:             string;
  // Per 100g macros
  caloriesPer100g:   number;
  proteinPer100g:    number;
  carbsPer100g:      number;
  fatPer100g:        number;
  fibrePer100g?:     number;
  sodiumMgPer100g?:  number;
  // Source
  source:            FoodSource;
  fdcId?:            string;
  barcode?:          string;
  confidenceScore:   number;
  upvoteCount:       number;
  downvoteCount:     number;
  submittedBy?:      string;
  isVerified:        boolean;
  dietaryFlags:      DietaryFlag[];
  createdAt:         Timestamp;
  updatedAt:         Timestamp;
}

// ─── /providers/{id} ─────────────────────────────────────────
export interface DbProvider {
  userId?:           string;
  name:              string;
  type:              ProviderType;
  description?:      string;
  logoUrl?:          string;
  coverUrl?:         string;
  address?:          string;
  city?:             string;
  countryCode?:      string;
  latitude?:         number;
  longitude?:        number;
  website?:          string;
  phone?:            string;
  email?:            string;
  grabStoreId?:      string;
  deliverooStoreId?: string;
  uberEatsStoreId?:  string;
  isVerified:        boolean;
  isActive:          boolean;
  profileViews:      number;
  macroLogs:         number;
  createdAt:         Timestamp;
  updatedAt:         Timestamp;
}

// ─── /providers/{id}/menuItems/{id} ──────────────────────────
export interface DbMenuItem {
  providerId:       string;
  name:             string;
  description?:     string;
  imageUrl?:        string;
  price?:           number;
  currency:         string;
  calories?:        number;
  proteinG?:        number;
  carbsG?:          number;
  fatG?:            number;
  confidenceScore:  number;
  dietaryFlags:     DietaryFlag[];
  isAvailable:      boolean;
  grabLink?:        string;
  deliverooLink?:   string;
  uberEatsLink?:    string;
  upvoteCount:      number;
  logCount:         number;
  createdAt:        Timestamp;
  updatedAt:        Timestamp;
}

// ─── /providers/{id}/classes/{id} ────────────────────────────
export interface DbProviderClass {
  providerId:        string;
  name:              string;
  instructor?:       string;
  description?:      string;
  durationMins:      number;
  caloriesBurnEst?:  number;
  maxSpots:          number;
  spotsBooked:       number;
  scheduleDays?:     string[];
  scheduleTime?:     string;
  price?:            number;
  currency:          string;
  bookingUrl?:       string;
  isActive:          boolean;
  createdAt:         Timestamp;
  updatedAt:         Timestamp;
}

// ─── /communityPosts/{id} ────────────────────────────────────
export interface DbCommunityPost {
  userId:              string;
  postType:            PostType;
  title:               string;
  content?:            string;
  imageUrl?:           string;
  foodId?:             string;
  providerId?:         string;
  menuItemId?:         string;
  price?:              number;
  // Macros (food/restaurant posts)
  calories?:           number;
  proteinG?:           number;
  carbsG?:             number;
  fatG?:               number;
  macroAccuracyScore:  number;
  macroVerifiedCount:  number;
  // Workout metadata
  caloriesBurned?:     number;
  durationMins?:       number;
  distanceKm?:         number;
  // Social counts
  likeCount:           number;
  commentCount:        number;
  saveCount:           number;
  shareCount:          number;
  tags:                string[];
  isFlagged:           boolean;
  isVisible:           boolean;
  createdAt:           Timestamp;
  updatedAt:           Timestamp;
}

// ─── /communityPosts/{id}/comments/{id} ──────────────────────
export interface DbPostComment {
  postId:    string;
  userId:    string;
  content:   string;
  likeCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── /workoutPlans/{id} ──────────────────────────────────────
export interface DbWorkoutExercise {
  name:         string;
  sets?:        number;
  reps?:        string;   // e.g. '8-10', '45s'
  restSeconds?: number;
  notes?:       string;
  orderIndex:   number;
}

export interface DbWorkoutPlan {
  creatorId:        string;
  title:            string;
  description?:     string;
  workoutType:      string;   // 'strength' | 'hiit' | 'cardio' | 'yoga' etc.
  difficulty:       'beginner' | 'intermediate' | 'advanced';
  durationMins?:    number;
  caloriesBurnEst?: number;
  muscleGroups:     string[];
  exercises:        DbWorkoutExercise[];
  tags:             string[];
  saveCount:        number;
  ratingAvg:        number;
  ratingCount:      number;
  isPublic:         boolean;
  createdAt:        Timestamp;
  updatedAt:        Timestamp;
}

// ─── /bookings/{id} ──────────────────────────────────────────
export interface DbBooking {
  userId:        string;
  providerId:    string;
  classId?:      string;
  bookingType:   'class' | '1on1' | 'plan';
  scheduledAt:   Timestamp;
  durationMins?: number;
  price?:        number;
  currency:      string;
  notes?:        string;
  status:        BookingStatus;
  confirmedAt?:  Timestamp;
  cancelledAt?:  Timestamp;
  cancelReason?: string;
  createdAt:     Timestamp;
  updatedAt:     Timestamp;
}

// ─── /notifications/{id} (subcollection under users) ─────────
export interface DbNotification {
  type:      string;  // 'like' | 'comment' | 'follow' | 'macro_nudge' | 'streak' | 'booking'
  title:     string;
  body?:     string;
  data:      Record<string, unknown>;
  isRead:    boolean;
  createdAt: Timestamp;
}

// ─── /macroVerifications/{id} ────────────────────────────────
export interface DbMacroVerification {
  foodId?:    string;
  postId?:    string;
  userId:     string;
  isAccurate: boolean;
  notes?:     string;
  createdAt:  Timestamp;
}

// ─── With ID (returned from API) ─────────────────────────────
export type WithId<T> = T & { id: string };
