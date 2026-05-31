import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/workout-logs?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get('date');

  const where: { userId: string; date?: { gte: Date; lt: Date } } = { userId: session.user.id };

  if (dateParam) {
    const start = new Date(dateParam);
    const end   = new Date(dateParam);
    end.setDate(end.getDate() + 1);
    where.date = { gte: start, lt: end };
  }

  const logs = await prisma.workoutLog.findMany({
    where,
    include: { exercises: true },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(logs);
}

// POST /api/workout-logs
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, durationMin, caloriesBurned, exercises, date } = await req.json();

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const log = await prisma.workoutLog.create({
    data: {
      userId: session.user.id,
      name,
      durationMin:    durationMin    ?? null,
      caloriesBurned: caloriesBurned ?? null,
      date:           date ? new Date(date) : new Date(),
      exercises: exercises?.length
        ? { create: exercises.map((e: { name: string; sets?: number; reps?: number; weightKg?: number; durationSec?: number }) => ({
            name:        e.name,
            sets:        e.sets        ?? null,
            reps:        e.reps        ?? null,
            weightKg:    e.weightKg    ?? null,
            durationSec: e.durationSec ?? null,
          })) }
        : undefined,
    },
    include: { exercises: true },
  });

  return NextResponse.json(log, { status: 201 });
}

// DELETE /api/workout-logs?id=xxx
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const log = await prisma.workoutLog.findFirst({ where: { id, userId: session.user.id } });
  if (!log) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.workoutLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
