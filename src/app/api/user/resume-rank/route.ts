import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/user/resume-rank
 * Resume paused rank - restores banked days with optional rank change
 * Body: { newRankId?: string } - Optional: choose different rank to resume with
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body for optional new rank ID
    const body = await request.json().catch(() => ({}));
    const { newRankId } = body;

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(session.user.id)));

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if rank is paused
    if (!user.rankPaused) {
      return NextResponse.json(
        { error: 'Rank is not paused' },
        { status: 400 }
      );
    }

    // Check if we have banked days
    if (!user.pausedRemainingDays || user.pausedRemainingDays <= 0) {
      return NextResponse.json(
        { error: 'No banked days to restore' },
        { status: 400 }
      );
    }

    // Check if we have a paused rank ID
    if (!user.pausedRankId) {
      return NextResponse.json(
        { error: 'No rank to resume' },
        { status: 400 }
      );
    }

    // Use provided rank or default to paused rank
    const targetRankId = newRankId || user.pausedRankId;
    let daysToRestore = user.pausedRemainingDays;

    // If switching to a different rank, convert days based on value
    if (newRankId && newRankId !== user.pausedRankId) {
      const { donationRanks } = await import('@/db/schema');
      
      // Get both ranks
      const [oldRank] = await db
        .select()
        .from(donationRanks)
        .where(eq(donationRanks.id, user.pausedRankId));
      
      const [newRank] = await db
        .select()
        .from(donationRanks)
        .where(eq(donationRanks.id, newRankId));

      if (!oldRank || !newRank) {
        return NextResponse.json(
          { error: 'Invalid rank' },
          { status: 400 }
        );
      }

      // Convert days: (old price per day * days) / new price per day
      const oldPricePerDay = oldRank.minAmount / 30;
      const newPricePerDay = newRank.minAmount / 30;
      const value = oldPricePerDay * user.pausedRemainingDays;
      daysToRestore = Math.floor(value / newPricePerDay);

      console.log(
        `🔄 Converting ${user.pausedRemainingDays} days from ${oldRank.name} to ${daysToRestore} days at ${newRank.name}`
      );
    }

    // Calculate new expiration date from converted days
    const now = new Date();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(now.getDate() + daysToRestore);

    // Resume the rank - RESTORE with selected rank
    await db
      .update(users)
      .set({
        rankPaused: false,
        donationRankId: targetRankId, // Restore with selected rank
        rankExpiresAt: newExpiresAt,
        pausedRankId: null, // Clear paused data
        pausedRemainingDays: null,
        pausedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, Number(session.user.id)));

    console.log(
      `▶️ User ${session.user.id} resumed rank ${targetRankId} with ${daysToRestore} days - rank restored`
    );

    return NextResponse.json({
      success: true,
      message: 'Rank resumed successfully',
      rankId: targetRankId,
      daysRestored: daysToRestore,
      expiresAt: newExpiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error resuming rank:', error);
    
    // Check if database columns don't exist yet
    if (error?.message?.includes('no such column') || error?.message?.includes('rank_paused')) {
      return NextResponse.json(
        { error: 'Pause feature not yet available. Database migration required.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to resume rank: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
