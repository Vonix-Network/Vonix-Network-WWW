import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { users, donationRanks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { convertRankDays } from '@/lib/rank-subscription';

/**
 * POST /api/user/rank-conversion-preview
 * Preview rank change with day conversion
 * Shows what happens when upgrading/downgrading/extending
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { newRankId, purchaseDays } = await request.json();

    if (!newRankId || !purchaseDays) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get current user with rank info
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(session.user.id)))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get new rank details
    const [newRank] = await db
      .select()
      .from(donationRanks)
      .where(eq(donationRanks.id, newRankId))
      .limit(1);

    if (!newRank) {
      return NextResponse.json({ error: 'Rank not found' }, { status: 404 });
    }

    const now = new Date();
    let scenario: 'new' | 'extend' | 'upgrade' | 'downgrade' = 'new';
    let bonusDays = 0;
    let totalDays = purchaseDays;
    let currentRank: any = null;
    let remainingDays = 0;

    // Check if user has existing rank
    if (user.donationRankId && user.rankExpiresAt) {
      const expiry = new Date(user.rankExpiresAt);
      
      if (expiry > now) {
        // User has active rank
        remainingDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Get current rank details
        const [currentRankData] = await db
          .select()
          .from(donationRanks)
          .where(eq(donationRanks.id, user.donationRankId))
          .limit(1);

        currentRank = currentRankData;

        if (user.donationRankId === newRankId) {
          // Same rank - EXTEND
          scenario = 'extend';
          bonusDays = remainingDays;
          totalDays = purchaseDays + remainingDays;
        } else if (currentRank && newRank.minAmount > currentRank.minAmount) {
          // Higher tier - UPGRADE
          scenario = 'upgrade';
          bonusDays = convertRankDays(user.donationRankId, newRankId, remainingDays);
          totalDays = purchaseDays + bonusDays;
        } else if (currentRank && newRank.minAmount < currentRank.minAmount) {
          // Lower tier - DOWNGRADE
          scenario = 'downgrade';
          bonusDays = convertRankDays(user.donationRankId, newRankId, remainingDays);
          totalDays = purchaseDays + bonusDays;
        }
      }
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(now.getDate() + totalDays);

    // Generate user-friendly message
    let message = '';
    let messageType: 'info' | 'success' | 'warning' = 'info';

    switch (scenario) {
      case 'new':
        message = `You'll receive the ${newRank.name} rank for ${purchaseDays} days.`;
        messageType = 'info';
        break;
      case 'extend':
        message = `Your ${newRank.name} rank will be extended by ${purchaseDays} days. You currently have ${remainingDays} days remaining, for a total of ${totalDays} days.`;
        messageType = 'success';
        break;
      case 'upgrade':
        message = `Upgrading from ${currentRank?.name} to ${newRank.name}! Your remaining ${remainingDays} days will be converted to ${bonusDays} days at the higher tier, plus ${purchaseDays} new days = ${totalDays} days total.`;
        messageType = 'success';
        break;
      case 'downgrade':
        message = `Switching from ${currentRank?.name} to ${newRank.name}. Your remaining ${remainingDays} days will be converted to ${bonusDays} days at the lower tier (you get MORE days because it costs less!), plus ${purchaseDays} new days = ${totalDays} days total.`;
        messageType = 'info';
        break;
    }

    return NextResponse.json({
      scenario,
      currentRank: currentRank ? {
        id: currentRank.id,
        name: currentRank.name,
        color: currentRank.color,
        daysRemaining: remainingDays,
      } : null,
      newRank: {
        id: newRank.id,
        name: newRank.name,
        color: newRank.color,
      },
      conversion: {
        purchaseDays,
        bonusDays,
        totalDays,
        expiresAt: expiresAt.toISOString(),
      },
      message,
      messageType,
    });
  } catch (error: any) {
    console.error('Error previewing rank conversion:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to preview rank conversion' },
      { status: 500 }
    );
  }
}
