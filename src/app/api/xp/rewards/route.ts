import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { levelRewards } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/xp/rewards
 * Get all level rewards
 */
export async function GET(request: NextRequest) {
  try {
    const rewards = await db
      .select()
      .from(levelRewards)
      .orderBy(asc(levelRewards.level));

    return NextResponse.json(rewards);
  } catch (error) {
    console.error('Error fetching level rewards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch level rewards' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/xp/rewards
 * Create a new level reward (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { level, title, badge, description, rewardType, rewardValue } = body;

    if (!level || level < 1) {
      return NextResponse.json(
        { error: 'Valid level is required' },
        { status: 400 }
      );
    }

    // Check if reward already exists for this level
    const [existing] = await db
      .select()
      .from(levelRewards)
      .where(eq(levelRewards.level, level))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: 'Reward already exists for this level' },
        { status: 400 }
      );
    }

    const [reward] = await db
      .insert(levelRewards)
      .values({
        level,
        title: title || null,
        badge: badge || null,
        description: description || null,
        rewardType: rewardType || null,
        rewardValue: rewardValue || null,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json(reward, { status: 201 });
  } catch (error) {
    console.error('Error creating level reward:', error);
    return NextResponse.json(
      { error: 'Failed to create level reward' },
      { status: 500 }
    );
  }
}
