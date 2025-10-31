import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { getLevelFromXP } from '@/lib/xp-utils';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/sync-levels
 * Recalculate all user levels based on current XP
 * Admin only - use after XP formula changes
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        xp: users.xp,
        currentLevel: users.level,
      })
      .from(users);

    let updatedCount = 0;
    const updates: { username: string; oldLevel: number; newLevel: number }[] = [];

    // Recalculate levels
    for (const user of allUsers) {
      const currentXP = user.xp || 0;
      const oldLevel = user.currentLevel || 1;
      const newLevel = getLevelFromXP(currentXP);

      if (newLevel !== oldLevel) {
        await db
          .update(users)
          .set({ level: newLevel })
          .where(sql`${users.id} = ${user.id}`);

        updates.push({
          username: user.username,
          oldLevel,
          newLevel,
        });
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      totalUsers: allUsers.length,
      updatedCount,
      unchangedCount: allUsers.length - updatedCount,
      updates: updates.slice(0, 20), // Return first 20 changes
      message: `Successfully synced ${updatedCount} user levels`,
    });
  } catch (error) {
    console.error('Error syncing levels:', error);
    return NextResponse.json(
      { error: 'Failed to sync user levels' },
      { status: 500 }
    );
  }
}
