import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { assignRankSubscription } from '@/lib/rank-subscription';
import { db } from '@/db';
import { users, donations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

// POST /api/subscriptions/purchase - Process subscription purchase
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { rankId, days, amount, paymentId } = body;

    // Validation
    if (!rankId || !days || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (days < 1 || amount < 1) {
      return NextResponse.json(
        { error: 'Invalid subscription parameters' },
        { status: 400 }
      );
    }

    // Assign rank subscription
    const result = await assignRankSubscription(userId, rankId, days);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to assign subscription' },
        { status: 500 }
      );
    }

    // Record the donation
    try {
      await db.insert(donations).values({
        userId,
        amount,
        currency: 'USD',
        method: 'Square',
        message: `Rank subscription: ${rankId} for ${days} days`,
        displayed: true,
        createdAt: new Date(),
      });
    } catch (dbError) {
      console.error('Error recording donation:', dbError);
      // Don't fail the request if donation recording fails
    }

    // Update user's total donated
    try {
      const [user] = await db
        .select({ totalDonated: users.totalDonated })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user) {
        await db
          .update(users)
          .set({
            totalDonated: (user.totalDonated || 0) + amount,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      }
    } catch (updateError) {
      console.error('Error updating total donated:', updateError);
    }

    return NextResponse.json({
      success: true,
      expiresAt: result.expiresAt,
      message: `Successfully subscribed to ${rankId} for ${days} days`,
    });
  } catch (error: any) {
    console.error('Subscription purchase error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/subscriptions/purchase - Get current subscription info
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    const [user] = await db
      .select({
        donationRankId: users.donationRankId,
        rankExpiresAt: users.rankExpiresAt,
        totalDonated: users.totalDonated,
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

    const now = new Date();
    const expiresAt = user.rankExpiresAt ? new Date(user.rankExpiresAt) : null;
    const isActive = expiresAt ? expiresAt > now : false;
    const daysRemaining = isActive && expiresAt
      ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return NextResponse.json({
      rankId: user.donationRankId,
      expiresAt: expiresAt?.toISOString(),
      isActive,
      daysRemaining,
      totalDonated: user.totalDonated || 0,
    });
  } catch (error: any) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
