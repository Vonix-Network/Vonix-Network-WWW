import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { users, donationRanks } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/user/rank-status
 * Returns user's current donation rank and remaining days
 */
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(session.user.id)));

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has a paused rank
    if (user.rankPaused && user.pausedRankId) {
      // Get paused rank details
      const [rank] = await db
        .select()
        .from(donationRanks)
        .where(eq(donationRanks.id, user.pausedRankId));

      if (rank) {
        return NextResponse.json({
          hasActiveRank: true, // They technically have a rank, just paused
          currentRank: {
            id: rank.id,
            name: rank.name,
            badge: rank.badge,
            textColor: rank.textColor,
            minDonation: rank.minAmount,
          },
          remainingDays: user.pausedRemainingDays || 0,
          expiresAt: null, // No expiration while paused
          remainingValue: Math.round((rank.minAmount / 30) * (user.pausedRemainingDays || 0) * 100) / 100,
          isPaused: true,
          pausedDays: user.pausedRemainingDays,
        });
      }
    }

    // Check if user has an active rank
    if (!user.donationRankId || !user.rankExpiresAt) {
      return NextResponse.json({
        hasActiveRank: false,
        currentRank: null,
        remainingDays: 0,
        expiresAt: null,
        isPaused: false,
        pausedDays: 0,
      });
    }

    const now = new Date();
    const expiresAt = new Date(user.rankExpiresAt);
    const remainingMs = expiresAt.getTime() - now.getTime();
    const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

    // If expired, return no active rank
    if (remainingDays <= 0) {
      return NextResponse.json({
        hasActiveRank: false,
        currentRank: null,
        remainingDays: 0,
        expiresAt: null,
        isPaused: false,
        pausedDays: 0,
      });
    }

    // Get rank details
    const [rank] = await db
      .select()
      .from(donationRanks)
      .where(eq(donationRanks.id, user.donationRankId));

    if (!rank) {
      return NextResponse.json({
        hasActiveRank: false,
        currentRank: null,
        remainingDays: 0,
        expiresAt: null,
        isPaused: false,
        pausedDays: 0,
      });
    }

    return NextResponse.json({
      hasActiveRank: true,
      currentRank: {
        id: rank.id,
        name: rank.name,
        badge: rank.badge,
        textColor: rank.textColor,
        minDonation: rank.minAmount,
      },
      remainingDays: remainingDays,
      expiresAt: expiresAt.toISOString(),
      remainingValue: Math.round((rank.minAmount / 30) * remainingDays * 100) / 100,
      isPaused: false,
      pausedDays: 0,
    });
  } catch (error) {
    console.error('Error fetching rank status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rank status' },
      { status: 500 }
    );
  }
}
