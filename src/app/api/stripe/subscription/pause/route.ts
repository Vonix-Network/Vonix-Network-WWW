import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import Stripe from 'stripe';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/stripe/subscription/pause
 * Pause a Stripe subscription using pause_collection
 * Stripe best practice for temporarily pausing subscriptions
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

    // Get user's Stripe customer ID and rank info
    const [user] = await db
      .select({ 
        stripeCustomerId: users.stripeCustomerId,
        donationRankId: users.donationRankId,
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

    // Pause the subscription using pause_collection
    // Stripe best practice: pause_collection keeps subscription active but doesn't charge
    const updated: any = await stripe.subscriptions.update(subscriptionId, {
      pause_collection: {
        behavior: 'keep_as_draft', // Keeps invoices as drafts
      },
    });

    // Update database to track pause state
    // IMPORTANT: Remove rank during pause (user loses perks until resumed)
    await db
      .update(users)
      .set({
        rankPaused: true,
        pausedAt: new Date(),
        pausedRankId: user.donationRankId || null, // Save current rank
        donationRankId: null, // Remove rank (no perks during pause)
      })
      .where(eq(users.id, Number(session.user.id)));

    console.log(`✅ Subscription ${subscriptionId} paused for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      subscription: {
        id: updated.id,
        status: updated.status,
        paused: !!updated.pause_collection,
      },
    });
  } catch (error: any) {
    console.error('Error pausing subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to pause subscription' },
      { status: 500 }
    );
  }
}
