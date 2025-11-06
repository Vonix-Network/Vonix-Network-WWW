import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import Stripe from 'stripe';
import { db } from '@/db';
import { users, donationRanks } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/stripe/create-subscription
 * Creates a recurring Stripe subscription for a donation rank
 */
export async function POST(request: NextRequest) {
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

    const { rankId, days, amount } = await request.json();

    if (!rankId || !days || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(session.user.id)));

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      // Create new Stripe customer
      const customerData: any = {
        metadata: {
          userId: session.user.id,
          username: session.user.username,
        },
      };
      
      if (session.user.email) {
        customerData.email = session.user.email;
      }
      
      const customer = await stripe.customers.create(customerData);

      customerId = customer.id;

      // Save customer ID to database
      await db
        .update(users)
        .set({ stripeCustomerId: customerId })
        .where(eq(users.id, Number(session.user.id)));
    }

    // Get rank details
    const [rank] = await db
      .select()
      .from(donationRanks)
      .where(eq(donationRanks.id, rankId));

    if (!rank) {
      return NextResponse.json(
        { error: 'Rank not found' },
        { status: 404 }
      );
    }

    // Determine interval based on days
    let interval: 'month' | 'year' = 'month';
    let intervalCount = 1;

    if (days === 365) {
      interval = 'year';
      intervalCount = 1;
    } else if (days === 180) {
      interval = 'month';
      intervalCount = 6;
    } else if (days === 90) {
      interval = 'month';
      intervalCount = 3;
    } else {
      interval = 'month';
      intervalCount = 1;
    }

    // Create or get price
    const price = await stripe.prices.create({
      unit_amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      recurring: {
        interval,
        interval_count: intervalCount,
      },
      product_data: {
        name: `${rank.name} Rank Subscription`,
        metadata: {
          rankId,
          days: days.toString(),
        },
      },
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price: price.id,
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: session.user.id,
        rankId,
        days: days.toString(),
      },
    });

    const invoice: any = subscription.latest_invoice;
    const paymentIntent: any = invoice?.payment_intent;

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent?.client_secret,
      customerId,
    });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
