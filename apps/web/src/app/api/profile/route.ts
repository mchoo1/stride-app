import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/profile
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
  const user    = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  return NextResponse.json({ ...user, profile });
}

// PUT /api/profile
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, age, heightCm, weightKg, goalWeightKg, activityLevel, goal,
          calorieGoal, proteinGoal, carbsGoal, fatGoal } = await req.json();

  const [user, profile] = await Promise.all([
    name
      ? prisma.user.update({ where: { id: session.user.id }, data: { name } })
      : prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.profile.upsert({
      where:  { userId: session.user.id },
      update: { age, heightCm, weightKg, goalWeightKg, activityLevel, goal,
                calorieGoal, proteinGoal, carbsGoal, fatGoal },
      create: { userId: session.user.id, age, heightCm, weightKg, goalWeightKg,
                activityLevel, goal, calorieGoal, proteinGoal, carbsGoal, fatGoal },
    }),
  ]);

  return NextResponse.json({ ...user, profile });
}
