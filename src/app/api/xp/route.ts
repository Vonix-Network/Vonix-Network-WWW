import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users, xpTransactions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getXPProgress, getTitleForLevel, getColorForLevel } from '@/lib/xp-system';

export const dynamic = 'force-dynamic';

// GET /api/xp - Get current user's XP data
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // Get user XP data
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        xp: users.xp,
        level: users.level,
        title: users.title,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate progress
    const progress = getXPProgress(user.xp);
    
    // Get recent XP transactions
    const recentTransactions = await db
      .select()
      .from(xpTransactions)
      .where(eq(xpTransactions.userId, userId))
      .orderBy(desc(xpTransactions.createdAt))
      .limit(10);

    return NextResponse.json({
      user: {
        ...user,
        title: user.title || getTitleForLevel(user.level),
        levelColor: getColorForLevel(user.level),
      },
      progress,
      recentTransactions,
    });
  } catch (error) {
    console.error('Error fetching XP data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
