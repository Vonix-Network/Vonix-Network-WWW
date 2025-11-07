import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import Stripe from 'stripe';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/stripe/subscription/cancel
 * Cancel a Stripe subscription at period end (recommended)
 * or immediately (if immediate=true)
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscriptionId, immediate = false } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }

    const stripe = new Stripe(stripeSecretKey);

    // Get user's Stripe customer ID
    const [user] = await db
      .select({ stripeCustomerId: users.stripeCustomerId })
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

    if (immediate) {
      // Cancel immediately
      const canceled = await stripe.subscriptions.cancel(subscriptionId);
      console.log(`✅ Subscription ${subscriptionId} canceled immediately for user ${session.user.id}`);
      
      return NextResponse.json({
        success: true,
        subscription: {
          id: canceled.id,
          status: canceled.status,
          canceled: true,
        },
      });
    } else {
      // Cancel at period end (Stripe best practice)
      const updated: any = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      console.log(`✅ Subscription ${subscriptionId} will cancel at period end for user ${session.user.id}`);

      return NextResponse.json({
        success: true,
        subscription: {
          id: updated.id,
          status: updated.status,
          cancelAtPeriodEnd: updated.cancel_at_period_end,
          currentPeriodEnd: new Date(updated.current_period_end * 1000).toISOString(),
        },
      });
    }
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
