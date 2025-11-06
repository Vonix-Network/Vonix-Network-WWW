import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { users, donationRanks } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/user/switch-rank
 * Switch user's rank without payment - converts remaining days to new rank
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { newRankId } = await request.json();

    if (!newRankId) {
      return NextResponse.json(
        { error: 'New rank ID is required' },
        { status: 400 }
      );
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
        { error: 'No active rank to switch from' },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(user.rankExpiresAt);

    // Check if rank is expired
    if (expiresAt <= now) {
      return NextResponse.json(
        { error: 'Current rank has expired' },
        { status: 400 }
      );
    }

    // Check if trying to switch to same rank
    if (user.donationRankId === newRankId) {
      return NextResponse.json(
        { error: 'Already on this rank' },
        { status: 400 }
      );
    }

    // Get both ranks
    const [currentRank] = await db
      .select()
      .from(donationRanks)
      .where(eq(donationRanks.id, user.donationRankId));

    const [newRank] = await db
      .select()
      .from(donationRanks)
      .where(eq(donationRanks.id, newRankId));

    if (!currentRank || !newRank) {
      return NextResponse.json(
        { error: 'Rank not found' },
        { status: 404 }
      );
    }

    // Calculate remaining days
    const remainingMs = expiresAt.getTime() - now.getTime();
    const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

    // Calculate remaining value
    const currentPricePerDay = currentRank.minAmount / 30;
    const remainingValue = currentPricePerDay * remainingDays;

    // Convert to days at new rank price
    const newPricePerDay = newRank.minAmount / 30;
    const convertedDays = Math.floor(remainingValue / newPricePerDay);

    // Calculate new expiration
    const newExpiresAt = new Date();
    newExpiresAt.setDate(now.getDate() + convertedDays);

    // Update user
    await db
      .update(users)
      .set({
        donationRankId: newRankId,
        rankExpiresAt: newExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, Number(session.user.id)));

    console.log(
      `✅ User ${session.user.id} switched from ${currentRank.name} (${remainingDays}d) to ${newRank.name} (${convertedDays}d)`
    );

    return NextResponse.json({
      success: true,
      oldRank: {
        id: currentRank.id,
        name: currentRank.name,
        remainingDays,
        remainingValue,
      },
      newRank: {
        id: newRank.id,
        name: newRank.name,
        convertedDays,
        expiresAt: newExpiresAt.toISOString(),
      },
      message: `Switched to ${newRank.name} rank. Your remaining time has been converted.`,
    });
  } catch (error) {
    console.error('Error switching rank:', error);
    return NextResponse.json(
      { error: 'Failed to switch rank' },
      { status: 500 }
    );
  }
}
