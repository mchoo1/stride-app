import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyToken } from '@/lib/api-auth';
import { Timestamp } from 'firebase-admin/firestore';

// ── Types ─────────────────────────────────────────────────────────────────────
type RecommendationType = 'food' | 'activity' | 'hydration' | 'habit';
type Priority           = 'high' | 'medium' | 'low';

interface Recommendation {
  id:      string;
  type:    RecommendationType;
  emoji:   string;
  title:   string;
  body:    string;
  priority: Priority;
  action?: { label: string; href: string };
}

// GET /api/recommendations
// Returns 3-5 personalised recommendations based on today's progress vs targets.
// No external AI call needed — pure rules engine is fast, deterministic, and free.
export async function GET(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today  = todaySGT();
  const hour   = new Date().toLocaleString('en-SG', { timeZone: 'Asia/Singapore', hour: 'numeric', hour12: false });
  const hourN  = parseInt(hour);

  // Fetch user targets + today's summary in parallel
  const [userSnap, summarySnap] = await Promise.all([
    adminDb.collection('users').doc(uid).get(),
    adminDb.collection(`users/${uid}/dailySummaries`).doc(today).get(),
  ]);

  const user    = userSnap.data()    ?? {};
  const summary = summarySnap.data() ?? {};

  // ── Targets (fallback to sensible defaults) ─────────────────────────────
  const targetCal     = user.targetCalories ?? 2000;
  const targetProtein = user.targetProtein  ?? 120;
  const targetCarbs   = user.targetCarbs    ?? 200;
  const targetFat     = user.targetFat      ?? 60;
  const targetWater   = user.targetWater    ?? 2500;
  const goalType      = user.goalType       ?? 'maintenance';
  const streak        = user.streak         ?? 0;
  const dietaryFlags  = (user.dietaryFlags  ?? []) as string[];

  // ── Today's actuals ──────────────────────────────────────────────────────
  const cal     = summary.totalCalories   ?? 0;
  const protein = summary.totalProteinG   ?? 0;
  const carbs   = summary.totalCarbsG     ?? 0;
  const fat     = summary.totalFatG       ?? 0;
  const water   = summary.totalWaterMl    ?? 0;
  const burned  = summary.caloriesBurned  ?? 0;
  const active  = summary.activeMins      ?? 0;

  const calPct     = cal     / targetCal;
  const proteinPct = protein / targetProtein;
  const waterPct   = water   / targetWater;

  const recs: Recommendation[] = [];
  const id = () => Math.random().toString(36).slice(2, 9);

  // ── Rule 1: Hydration ──────────────────────────────────────────────────
  if (waterPct < 0.5 && hourN >= 12) {
    recs.push({
      id: id(), type: 'hydration', emoji: '💧', priority: 'high',
      title: 'You\'re behind on water',
      body:  `Only ${Math.round(water)}ml of your ${targetWater}ml goal. Try to drink ${Math.round(targetWater - water)}ml more before bed.`,
      action: { label: 'Log water', href: '/dashboard' },
    });
  } else if (waterPct < 0.3 && hourN >= 9) {
    recs.push({
      id: id(), type: 'hydration', emoji: '💧', priority: 'medium',
      title: 'Start your water intake',
      body:  `You've logged ${Math.round(water)}ml. Aim for ${Math.round(targetWater / 4)}ml before lunch.`,
      action: { label: 'Log water', href: '/dashboard' },
    });
  }

  // ── Rule 2: Protein gap ────────────────────────────────────────────────
  if (proteinPct < 0.6 && hourN >= 14) {
    const gap = Math.round(targetProtein - protein);
    recs.push({
      id: id(), type: 'food', emoji: '🥩', priority: 'high',
      title: `${gap}g protein still to go`,
      body: proteinTip(gap, goalType, dietaryFlags),
      action: { label: 'Find high-protein options', href: '/eat' },
    });
  } else if (proteinPct < 0.4 && hourN >= 11) {
    recs.push({
      id: id(), type: 'food', emoji: '🥩', priority: 'medium',
      title: 'Protein looking low for the day',
      body: `${Math.round(protein)}g logged so far. Add a protein-rich lunch to get on track.`,
      action: { label: 'Explore options', href: '/eat' },
    });
  }

  // ── Rule 3: Calorie guidance ──────────────────────────────────────────
  if (calPct < 0.3 && hourN >= 13) {
    recs.push({
      id: id(), type: 'food', emoji: '🍽️', priority: 'medium',
      title: 'You haven\'t eaten much today',
      body:  `Only ${cal} kcal logged. Skipping meals can slow your metabolism and make hitting protein harder.`,
      action: { label: 'Log a meal', href: '/log/food' },
    });
  } else if (calPct > 1.15 && goalType === 'weight_loss') {
    recs.push({
      id: id(), type: 'food', emoji: '⚠️', priority: 'high',
      title: 'Over your calorie goal',
      body:  `You're at ${cal} kcal — ${Math.round(cal - targetCal)} over target. A light dinner or walk can help balance things out.`,
      action: { label: 'Log activity', href: '/log/activity' },
    });
  }

  // ── Rule 4: Activity nudge ─────────────────────────────────────────────
  if (active === 0 && hourN >= 16) {
    recs.push({
      id: id(), type: 'activity', emoji: '🏃', priority: 'medium',
      title: 'No movement logged today',
      body:  `Even a 20-minute walk burns ~${estimateWalkCalories(user.currentWeight ?? 70)} kcal and keeps your streak alive.`,
      action: { label: 'Log activity', href: '/log/activity' },
    });
  } else if (active > 0 && burned < 200 && hourN >= 18) {
    recs.push({
      id: id(), type: 'activity', emoji: '🔥', priority: 'low',
      title: 'Boost your calorie burn',
      body:  `${burned} kcal burned so far. A 15-min jog or cycling session could push you past 200.`,
      action: { label: 'Log activity', href: '/log/activity' },
    });
  }

  // ── Rule 5: Macro balance ──────────────────────────────────────────────
  const carbPct = carbs / targetCarbs;
  if (carbPct > 1.3 && goalType !== 'muscle_gain') {
    recs.push({
      id: id(), type: 'food', emoji: '🌾', priority: 'low',
      title: 'Carb intake is high today',
      body:  `${Math.round(carbs)}g carbs logged vs ${targetCarbs}g target. Swap a snack for nuts, eggs or Greek yogurt.`,
      action: { label: 'Find lower-carb options', href: '/eat' },
    });
  }

  // ── Rule 6: Fat balance ───────────────────────────────────────────────
  if (fat / targetFat > 1.3) {
    recs.push({
      id: id(), type: 'food', emoji: '🥑', priority: 'low',
      title: 'Fat intake running high',
      body:  `${Math.round(fat)}g fat today (target ${targetFat}g). Keep dinner light on oils and fried items.`,
    });
  }

  // ── Rule 7: Streak milestone ──────────────────────────────────────────
  if ([3, 7, 14, 30, 60, 100].includes(streak)) {
    recs.push({
      id: id(), type: 'habit', emoji: '🏆', priority: 'medium',
      title: `${streak}-day streak! 🎉`,
      body:  streak >= 30
        ? `${streak} days of consistent tracking. You're building a powerful habit.`
        : `Keep it up! Log something today to push to ${streak + 1} days.`,
    });
  }

  // ── Rule 8: Morning kickstart ─────────────────────────────────────────
  if (cal === 0 && hourN >= 7 && hourN < 11) {
    recs.push({
      id: id(), type: 'food', emoji: '🌅', priority: 'low',
      title: 'Start your day right',
      body:  breakfastTip(goalType, dietaryFlags),
      action: { label: 'Log breakfast', href: '/log/food' },
    });
  }

  // Deduplicate, cap at 5, sort by priority
  const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
  const top5 = recs
    .slice(0, 8)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 5);

  // Cache in Firestore so the client can re-read without recomputing
  await adminDb
    .collection(`users/${uid}/recommendations`)
    .doc(today)
    .set({ recs: top5, generatedAt: Timestamp.now() }, { merge: true });

  return NextResponse.json(top5);
}

// ── Tip helpers ───────────────────────────────────────────────────────────────
function proteinTip(gapG: number, goal: string, flags: string[]): string {
  const isVeg = flags.includes('vegetarian') || flags.includes('vegan');
  if (isVeg) {
    return `${gapG}g remaining. Try Greek yogurt (10g/100g), tofu stir-fry, or a chickpea bowl from the Store tab.`;
  }
  if (goal === 'muscle_gain') {
    return `${gapG}g remaining — critical for muscle repair. A chicken breast, canned tuna, or protein shake will close the gap fast.`;
  }
  return `${gapG}g remaining. Tuna (30g/can), chicken breast (31g/100g), or eggs (6g each) are cheap, fast options.`;
}

function breakfastTip(goal: string, flags: string[]): string {
  const isVeg = flags.includes('vegetarian') || flags.includes('vegan');
  if (isVeg) {
    return 'Overnight oats with banana (14g protein, ~330 kcal) is a fast, filling start — find it in Store tab.';
  }
  if (goal === 'weight_loss') {
    return 'Ya Kun\'s half-boiled eggs + kaya toast set is ~455 kcal with 17g protein — solid start for a deficit day.';
  }
  return 'A high-protein breakfast (eggs, Greek yogurt, or chicken) sets your metabolism up for the day.';
}

function estimateWalkCalories(weightKg: number): number {
  // MET 3.5 for brisk walk, 20 min
  return Math.round(3.5 * weightKg * 20 / 60);
}

function todaySGT(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Singapore' });
}
