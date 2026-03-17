import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/food-logs?date=YYYY-MM-DD
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

  const logs = await prisma.foodLog.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(logs);
}

// POST /api/food-logs
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, emoji, calories, protein, carbs, fat, weightG, mealType, date } = body;

  if (!name || calories == null) {
    return NextResponse.json({ error: 'name and calories are required' }, { status: 400 });
  }

  const log = await prisma.foodLog.create({
    data: {
      userId: session.user.id,
      name,
      emoji,
      calories: Math.round(calories),
      protein:  protein  ?? 0,
      carbs:    carbs    ?? 0,
      fat:      fat      ?? 0,
      weightG:  weightG  ?? null,
      mealType: mealType ?? null,
      date:     date ? new Date(date) : new Date(),
    },
  });

  return NextResponse.json(log, { status: 201 });
}

// DELETE /api/food-logs?id=xxx
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // ensure the log belongs to this user
  const log = await prisma.foodLog.findFirst({ where: { id, userId: session.user.id } });
  if (!log) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.foodLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
