import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import Stripe from 'stripe';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/stripe/subscription/resume
 * Resume a paused Stripe subscription
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }

    const stripe = new Stripe(stripeSecretKey);

    // Get user's Stripe customer ID and pause info
    const [user] = await db
      .select({ 
        stripeCustomerId: users.stripeCustomerId,
        rankPaused: users.rankPaused,
        pausedAt: users.pausedAt,
        rankExpiresAt: users.rankExpiresAt,
        pausedRankId: users.pausedRankId,
      })
      .from(users)
      .where(eq(users.id, Number(session.user.id)))
      .limit(1);

    if (!user?.stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 });
    }

    // Verify subscription ownership
    const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);
    if (subscription.customer !== user.stripeCustomerId) {
      return NextResponse.json({ error: 'Subscription does not belong to you' }, { status: 403 });
    }

    // SAFETY CHECK: Enforce 24-hour cooldown before allowing resume
    // This prevents day duplication and ensures Stripe billing has fully paused
    if (user.rankPaused && user.pausedAt) {
      const now = new Date();
      const pausedDate = new Date(user.pausedAt);
      const hoursSincePause = (now.getTime() - pausedDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSincePause < 24) {
        const hoursRemaining = Math.ceil(24 - hoursSincePause);
        const canResumeAt = new Date(pausedDate.getTime() + (24 * 60 * 60 * 1000));
        
        console.log(`⚠️ Resume blocked: Only ${hoursSincePause.toFixed(1)} hours since pause`);
        return NextResponse.json({
          error: 'COOLDOWN_ACTIVE',
          message: 'You must wait 24 hours after pausing before resuming.',
          hoursRemaining,
          canResumeAt: canResumeAt.toISOString(),
          reason: 'This prevents day duplication and ensures billing is fully paused.',
        }, { status: 429 }); // 429 = Too Many Requests (rate limited)
      }
    }

    // Calculate days paused to add back to expiration
    let daysToAdd = 0;
    if (user.rankPaused && user.pausedAt) {
      const now = new Date();
      const pausedDate = new Date(user.pausedAt);
      daysToAdd = Math.ceil((now.getTime() - pausedDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Resume the subscription by removing pause_collection
    const updated: any = await stripe.subscriptions.update(subscriptionId, {
      pause_collection: null as any, // Remove pause
    });

    // Update database: clear pause state and add days back to expiration
    // IMPORTANT: Restore rank from pausedRankId (user gets perks back)
    const updateData: any = {
      rankPaused: false,
      pausedAt: null,
      pausedRankId: null,
      pausedRemainingDays: null,
      donationRankId: user.pausedRankId, // Restore rank!
    };

    // Add paused days back to expiration if it exists
    if (user.rankExpiresAt && daysToAdd > 0) {
      const currentExpiration = new Date(user.rankExpiresAt);
      const newExpiration = new Date(currentExpiration.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
      updateData.rankExpiresAt = newExpiration;
      console.log(`Adding ${daysToAdd} days back to rank expiration`);
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, Number(session.user.id)));

    console.log(`✅ Subscription ${subscriptionId} resumed for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      daysAdded: daysToAdd,
      subscription: {
        id: updated.id,
        status: updated.status,
        paused: !!updated.pause_collection,
      },
    });
  } catch (error: any) {
    console.error('Error resuming subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to resume subscription' },
      { status: 500 }
    );
  }
}
