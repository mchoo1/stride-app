import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyToken } from '@/lib/api-auth';
import { FieldValue } from 'firebase-admin/firestore';

// GET /api/streak  — returns { streak, lastActiveDate, longestStreak }
export async function GET(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const snap = await adminDb.collection('users').doc(uid).get();
  const data = snap.data() ?? {};

  return NextResponse.json({
    streak:         data.streak         ?? 0,
    lastActiveDate: data.lastActiveDate ?? null,
    longestStreak:  data.longestStreak  ?? 0,
  });
}

// POST /api/streak  — call once per day after any log action
// Increments streak if yesterday was the lastActiveDate, resets to 1 otherwise.
// Body: { date?: 'YYYY-MM-DD' }  (defaults to today in SGT)
export async function POST(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body    = await req.json().catch(() => ({}));
  const today   = body.date ?? todaySGT();
  const userRef = adminDb.collection('users').doc(uid);
  const snap    = await userRef.get();
  const current = snap.data() ?? {};

  const lastActive    = current.lastActiveDate ?? null;
  const currentStreak = current.streak         ?? 0;
  const longest       = current.longestStreak  ?? 0;

  // Already marked active today — nothing to do
  if (lastActive === today) {
    return NextResponse.json({
      streak:         currentStreak,
      lastActiveDate: lastActive,
      longestStreak:  longest,
      updated:        false,
    });
  }

  const yesterday = prevDay(today);
  const newStreak = lastActive === yesterday ? currentStreak + 1 : 1;
  const newLongest = Math.max(longest, newStreak);

  await userRef.set(
    {
      streak:         newStreak,
      lastActiveDate: today,
      longestStreak:  newLongest,
      streakUpdatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return NextResponse.json({
    streak:         newStreak,
    lastActiveDate: today,
    longestStreak:  newLongest,
    updated:        true,
  });
}

// ── helpers ──────────────────────────────────────────────────────────────────
/** Today's date in Asia/Singapore timezone */
function todaySGT(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Singapore' });
}

/** Previous calendar day */
function prevDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
