import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/user/pause-rank
 * Pause user's rank - banks remaining days and deactivates perks
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(session.user.id)));

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has active rank
    if (!user.donationRankId || !user.rankExpiresAt) {
      return NextResponse.json(
        { error: 'No active rank to pause' },
        { status: 400 }
      );
    }

    // Check if already paused
    if (user.rankPaused) {
      return NextResponse.json(
        { error: 'Rank is already paused' },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(user.rankExpiresAt);

    // Check if rank is expired
    if (expiresAt <= now) {
      return NextResponse.json(
        { error: 'Cannot pause expired rank' },
        { status: 400 }
      );
    }

    // Calculate remaining days
    const remainingMs = expiresAt.getTime() - now.getTime();
    const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

    // Pause the rank - bank the days and REMOVE the active rank
    await db
      .update(users)
      .set({
        rankPaused: true,
        pausedRankId: user.donationRankId, // Store the rank ID
        pausedRemainingDays: remainingDays,
        pausedAt: new Date(),
        // REMOVE the active rank (user loses perks while paused)
        donationRankId: null,
        rankExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, Number(session.user.id)));

    console.log(
      `⏸️ User ${session.user.id} paused rank ${user.donationRankId} with ${remainingDays} days banked - rank removed until resume`
    );

    return NextResponse.json({
      success: true,
      message: 'Rank paused successfully',
      pausedDays: remainingDays,
      rankId: user.donationRankId,
    });
  } catch (error: any) {
    console.error('Error pausing rank:', error);
    
    // Check if database columns don't exist yet
    if (error?.message?.includes('no such column') || error?.message?.includes('rank_paused')) {
      return NextResponse.json(
        { error: 'Pause feature not yet available. Database migration required.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to pause rank: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
