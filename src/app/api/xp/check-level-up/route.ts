import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { users, levelRewards } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Check if user has a pending level-up notification
 * This endpoint is called by the client after XP-worthy actions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Get user's current level and XP
    const [user] = await db
      .select({
        level: users.level,
        xp: users.xp,
        title: users.title,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if there's a level reward for this level
    const [reward] = await db
      .select()
      .from(levelRewards)
      .where(eq(levelRewards.level, user.level))
      .limit(1);

    // Check if this is a "new" level (you can implement session-based tracking)
    // For now, we'll use a query parameter to indicate when to show notification
    const showNotification = request.nextUrl.searchParams.get('show') === 'true';

    if (showNotification && user.level > 1) {
      return NextResponse.json({
        leveledUp: true,
        newLevel: user.level,
        title: user.title,
        xp: user.xp,
        reward: reward ? {
          title: reward.title || `Level ${user.level} Reward`,
          description: reward.description || `You've reached level ${user.level}!`,
        } : undefined,
      });
    }

    return NextResponse.json({
      leveledUp: false,
      currentLevel: user.level,
      currentXP: user.xp,
    });
  } catch (error) {
    console.error('Error checking level up:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
