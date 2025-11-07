import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { users, donationRanks } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/user/current-rank
 * Returns user's current donation rank status
 */
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [user] = await db
      .select({
        donationRankId: users.donationRankId,
        rankExpiresAt: users.rankExpiresAt,
      })
      .from(users)
      .where(eq(users.id, Number(session.user.id)))
      .limit(1);

    if (!user || !user.donationRankId) {
      return NextResponse.json({ currentRank: null });
    }

    // Get rank details
    const [rank] = await db
      .select()
      .from(donationRanks)
      .where(eq(donationRanks.id, user.donationRankId))
      .limit(1);

    if (!rank) {
      return NextResponse.json({ currentRank: null });
    }

    const now = new Date();
    const expiresAt = user.rankExpiresAt ? new Date(user.rankExpiresAt) : null;
    const isExpired = expiresAt ? expiresAt < now : true;
    const daysRemaining = expiresAt 
      ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return NextResponse.json({
      id: rank.id,
      name: rank.name,
      color: rank.color,
      badge: rank.badge,
      expiresAt: expiresAt?.toISOString() || null,
      daysRemaining,
      isExpired,
      hasSubscription: false, // This will be populated by subscription status check
    });
  } catch (error: any) {
    console.error('Error getting current rank:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get current rank' },
      { status: 500 }
    );
  }
}
