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

    const stripe = new Stripe(stripeSecretKey);

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

    // Transform to match expected format with metadata
    const formattedSubs = subscriptions.data.map((sub: any) => {
      const metadata = sub.metadata || {};
      const item = sub.items.data[0];
      const recurring = item?.price.recurring || {};
      
      // Build display name from metadata
      const rankName = metadata.rankName || 'Subscription';
      const days = metadata.days || '30';
      const intervalDisplay = metadata.interval || 
        (recurring.interval_count === 3 && recurring.interval === 'month' ? 'Every 3 Months' :
         recurring.interval_count === 6 && recurring.interval === 'month' ? 'Every 6 Months' :
         recurring.interval === 'year' ? 'Yearly' : 'Monthly');
      
      return {
        id: sub.id,
        status: sub.status,
        planName: rankName,
        description: `${days} days - ${intervalDisplay}`,
        amount: (item?.price.unit_amount || 0) / 100,
        currency: sub.currency.toUpperCase(),
        interval: recurring.interval || 'month',
        intervalCount: recurring.interval_count || 1,
        rankId: metadata.rankId,
        days: parseInt(days),
        nextBillingDate: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : undefined,
        canceledDate: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : undefined,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        currentPeriodStart: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : undefined,
        currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : undefined,
        paused: sub.pause_collection !== null,
      };
    });

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

    const stripe = new Stripe(stripeSecretKey);

    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscriptionId');
    const immediate = searchParams.get('immediate') === 'true';

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID required' },
        { status: 400 }
      );
    }

    let subscription;
    
    if (immediate) {
      // Cancel immediately
      subscription = await stripe.subscriptions.cancel(subscriptionId);
      console.log(`Subscription ${subscriptionId} canceled immediately`);
    } else {
      // Cancel at period end (keeps benefits until end of billing period)
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      console.log(`Subscription ${subscriptionId} scheduled to cancel at period end`);
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at,
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

/**
 * PATCH /api/stripe/subscription
 * Resume or modify a Stripe subscription
 */
export async function PATCH(request: NextRequest) {
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

    const stripe = new Stripe(stripeSecretKey);

    const { subscriptionId, action } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID required' },
        { status: 400 }
      );
    }

    let subscription;

    switch (action) {
      case 'resume':
        // Resume a subscription that was set to cancel at period end
        subscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: false,
        });
        console.log(`Subscription ${subscriptionId} resumed`);
        break;

      case 'pause':
        // Pause subscription (requires Stripe to have pause collection enabled)
        subscription = await stripe.subscriptions.update(subscriptionId, {
          pause_collection: {
            behavior: 'keep_as_draft',
          },
        });
        console.log(`Subscription ${subscriptionId} paused`);
        break;

      case 'unpause':
        // Unpause subscription
        subscription = await stripe.subscriptions.update(subscriptionId, {
          pause_collection: null as any,
        });
        console.log(`Subscription ${subscriptionId} unpaused`);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  } catch (error: any) {
    console.error('Error updating Stripe subscription:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
