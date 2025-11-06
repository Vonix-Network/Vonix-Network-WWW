import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import Stripe from 'stripe';

/**
 * GET /api/stripe/subscription
 * Retrieves user's Stripe subscriptions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ disabled: true, subscriptions: [] });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-10-29.clover',
    });

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({ subscriptions: [] });
    }

    // List subscriptions for customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 100,
    });

    // Transform to match expected format
    const formattedSubs = subscriptions.data.map((sub: any) => ({
      id: sub.id,
      status: sub.status,
      planName: sub.items.data[0]?.price.nickname || 'Subscription',
      amount: (sub.items.data[0]?.price.unit_amount || 0) / 100,
      currency: sub.currency.toUpperCase(),
      interval: sub.items.data[0]?.price.recurring?.interval || 'month',
      nextBillingDate: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : undefined,
      canceledDate: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : undefined,
    }));

    return NextResponse.json({
      subscriptions: formattedSubs,
    });
  } catch (error: any) {
    console.error('Error fetching Stripe subscriptions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/stripe/subscription
 * Cancels a Stripe subscription
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 503 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-10-29.clover',
    });

    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscriptionId');

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID required' },
        { status: 400 }
      );
    }

    // Cancel the subscription at period end
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  } catch (error: any) {
    console.error('Error canceling Stripe subscription:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
