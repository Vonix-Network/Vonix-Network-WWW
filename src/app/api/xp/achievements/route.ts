import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { achievements, userAchievements } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/xp/achievements - Get achievements and user progress
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

    // Get all achievements
    const allAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievements.hidden, false))
      .orderBy(achievements.category, achievements.xpReward);

    // Get user's achievement progress
    const userProgress = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));

    // Merge data
    const achievementsWithProgress = allAchievements.map(achievement => {
      const progress = userProgress.find(
        p => p.achievementId === achievement.id
      );

      return {
        ...achievement,
        unlocked: progress?.completed || false,
        progress: progress?.progress || 0,
        unlockedAt: progress?.completedAt,
      };
    });

    // Group by category
    const grouped = {
      social: achievementsWithProgress.filter(a => a.category === 'social'),
      forum: achievementsWithProgress.filter(a => a.category === 'forum'),
      leveling: achievementsWithProgress.filter(a => a.category === 'leveling'),
      special: achievementsWithProgress.filter(a => a.category === 'special'),
    };

    // Calculate stats
    const totalAchievements = allAchievements.length;
    const unlockedCount = userProgress.filter(p => p.completed).length;
    const totalXPEarned = allAchievements
      .filter(a => userProgress.some(p => p.achievementId === a.id && p.completed))
      .reduce((sum, a) => sum + a.xpReward, 0);

    return NextResponse.json({
      achievements: achievementsWithProgress,
      grouped,
      stats: {
        total: totalAchievements,
        unlocked: unlockedCount,
        locked: totalAchievements - unlockedCount,
        percentage: Math.round((unlockedCount / totalAchievements) * 100),
        totalXPEarned,
      },
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
