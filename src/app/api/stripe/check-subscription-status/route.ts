import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import Stripe from 'stripe';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/stripe/check-subscription-status
 * Checks if user has active Stripe subscription and returns recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ hasActiveSubscription: false });
    }

    const stripe = new Stripe(stripeSecretKey);

    // Get user's Stripe customer ID and rank info
    const [user] = await db
      .select({ 
        stripeCustomerId: users.stripeCustomerId,
        donationRankId: users.donationRankId,
        rankExpiresAt: users.rankExpiresAt,
        rankPaused: users.rankPaused,
        pausedAt: users.pausedAt,
        pausedRemainingDays: users.pausedRemainingDays,
      })
      .from(users)
      .where(eq(users.id, Number(session.user.id)))
      .limit(1);

    if (!user?.stripeCustomerId) {
      return NextResponse.json({ 
        hasActiveSubscription: false,
        rankExpiresAt: user?.rankExpiresAt || null,
      });
    }

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'active',
      limit: 10,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ hasActiveSubscription: false });
    }

    // Get the first active subscription
    const activeSub: any = subscriptions.data[0];
    const metadata = activeSub.metadata || {};
    
    // Check if subscription is paused in Stripe (should match DB, but this is a safety check)
    const stripePaused = !!activeSub.pause_collection;

    // Calculate if rank expires before next billing (user might have extended)
    const nextBilling = typeof activeSub.current_period_end === 'number'
      ? new Date(activeSub.current_period_end * 1000)
      : null;
    const rankExpires = user.rankExpiresAt ? new Date(user.rankExpiresAt) : null;
    
    const hasExtendedRank = Boolean(rankExpires && nextBilling && rankExpires > nextBilling);

    // Use both Stripe and DB pause state, preferring Stripe as source of truth
    const paused = stripePaused || user.rankPaused;

    // Calculate pause duration and resume availability
    let pauseDurationDays = 0;
    let canResumeAt = null;
    let hoursUntilResume = 0;
    
    if (paused && user.pausedAt) {
      const now = new Date();
      const pausedDate = new Date(user.pausedAt);
      const hoursSincePause = (now.getTime() - pausedDate.getTime()) / (1000 * 60 * 60);
      pauseDurationDays = Math.ceil(hoursSincePause / 24);
      
      // 24-hour cooldown before resume is allowed
      if (hoursSincePause < 24) {
        hoursUntilResume = Math.ceil(24 - hoursSincePause);
        canResumeAt = new Date(pausedDate.getTime() + (24 * 60 * 60 * 1000));
      }
    }

    return NextResponse.json({
      hasActiveSubscription: true,
      subscription: {
        id: activeSub.id,
        rankId: metadata.rankId,
        rankName: metadata.rankName,
        days: Number.parseInt(metadata.days || '30'),
        amount: (activeSub.items.data[0]?.price.unit_amount || 0) / 100,
        currency: (activeSub.currency || 'usd').toUpperCase(),
        interval: activeSub.items.data[0]?.price.recurring?.interval || 'month',
        nextBillingDate: nextBilling ? nextBilling.toISOString() : null,
        cancelAtPeriodEnd: activeSub.cancel_at_period_end,
        paused: paused,
        pausedAt: user.pausedAt ? new Date(user.pausedAt).toISOString() : null,
        pauseDurationDays,
        canResumeAt: canResumeAt ? canResumeAt.toISOString() : null,
        hoursUntilResume,
      },
      rankInfo: {
        expiresAt: rankExpires ? rankExpires.toISOString() : null,
        hasExtended: hasExtendedRank,
        explanation: paused
          ? `Your subscription is paused. When resumed, ${pauseDurationDays} days will be added to your expiration.`
          : nextBilling
          ? (hasExtendedRank 
              ? `Your rank expires on ${rankExpires?.toLocaleDateString()}, but your subscription will renew on ${nextBilling.toLocaleDateString()} and add more days.`
              : `Your subscription will renew on ${nextBilling.toLocaleDateString()} and extend your rank.`)
          : (rankExpires
              ? `Your rank expires on ${rankExpires.toLocaleDateString()}.`
              : 'Active subscription detected.'),
      },
    });
  } catch (error: any) {
    console.error('Error checking subscription status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check subscription status' },
      { status: 500 }
    );
  }
}
