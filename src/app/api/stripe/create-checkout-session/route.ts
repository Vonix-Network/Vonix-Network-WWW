import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import Stripe from 'stripe';
import { db } from '@/db';
import { users, donationRanks } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

/**
 * POST /api/stripe/create-checkout-session
 * Creates a Stripe Checkout session for subscription or one-time payment
 */
export async function POST(request: NextRequest) {
  try {
    console.log('=== Stripe Checkout Session Creation Started ===');
    
    const session = await getServerSession();
    if (!session || !session.user) {
      console.error('Unauthorized: No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authenticated:', session.user.id);

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error('Stripe secret key not configured');
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 503 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    console.log('Stripe client initialized');

    const body = await request.json();
    console.log('Request body:', body);
    
    const { rankId, days, amount, isRecurring } = body;

    if (!rankId || !days || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user
    console.log('Fetching user from database...');
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(session.user.id)));

    if (!user) {
      console.error('User not found in database:', session.user.id);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('User found:', { id: user.id, hasStripeCustomerId: !!user.stripeCustomerId });

    // Get rank details
    console.log('Fetching rank from database:', rankId);
    const [rank] = await db
      .select()
      .from(donationRanks)
      .where(eq(donationRanks.id, rankId));

    if (!rank) {
      console.error('Rank not found:', rankId);
      return NextResponse.json(
        { error: 'Rank not found' },
        { status: 404 }
      );
    }

    console.log('Rank found:', { id: rank.id, name: rank.name });

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      console.log('Creating new Stripe customer...');
      const customerData: any = {
        name: session.user.username,
        metadata: {
          userId: session.user.id,
          username: session.user.username,
        },
      };
      
      if (user.email) {
        customerData.email = user.email;
        console.log('Setting customer email:', user.email);
      }
      
      const customer = await stripe.customers.create(customerData);
      console.log('Stripe customer created:', customer.id);

      customerId = customer.id;

      // Save customer ID to database
      await db
        .update(users)
        .set({ stripeCustomerId: customerId })
        .where(eq(users.id, Number(session.user.id)));
      console.log('Customer ID saved');
    } else {
      // Update existing customer email if changed
      try {
        const customer = await stripe.customers.retrieve(customerId);
        if (!customer.deleted && user.email && customer.email !== user.email) {
          await stripe.customers.update(customerId, {
            email: user.email,
            name: session.user.username,
          });
          console.log('Customer email updated');
        }
      } catch (updateError) {
        console.error('Error updating customer:', updateError);
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/donations/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/donations/subscribe`;

    let checkoutSession;

    if (isRecurring) {
      // SUBSCRIPTION MODE - Stripe handles everything!
      console.log('Creating subscription checkout session...');
      
      // Calculate Stripe price based on interval
      const interval = days === 90 ? 'month' as const : days === 180 ? 'month' as const : days === 365 ? 'year' as const : 'month' as const;
      const intervalCount = days === 90 ? 3 : days === 180 ? 6 : days === 365 ? 1 : 1;
      
      // Create display name for interval
      const intervalName = days === 90 ? 'Every 3 Months' : days === 180 ? 'Every 6 Months' : days === 365 ? 'Yearly' : 'Monthly';
      
      // Create price with metadata
      const price = await stripe.prices.create({
        currency: 'usd',
        unit_amount: Math.round(amount * 100),
        recurring: { interval, interval_count: intervalCount },
        product_data: {
          name: `${rank.name} Rank - ${intervalName}`,
          metadata: {
            rankId,
            rankName: rank.name,
            days: days.toString(),
            interval: intervalName,
          },
        },
      });

      console.log('Price created:', price.id);

      checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        subscription_data: {
          metadata: {
            userId: session.user.id,
            rankId,
            rankName: rank.name,
            days: days.toString(),
          },
          description: `${rank.name} Rank - ${days} days - ${intervalName}`,
        },
        metadata: {
          userId: session.user.id,
          rankId,
          rankName: rank.name,
          days: days.toString(),
        },
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
      });

      console.log('Subscription checkout session created:', checkoutSession.id);
    } else {
      // ONE-TIME PAYMENT MODE
      console.log('Creating one-time payment checkout session...');

      checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: Math.round(amount * 100),
              product_data: {
                name: `${rank.name} Rank`,
                description: `${days} days`,
              },
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        payment_intent_data: {
          metadata: {
            userId: session.user.id,
            rankId,
            days: days.toString(),
          },
        },
        metadata: {
          userId: session.user.id,
          rankId,
          days: days.toString(),
        },
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
      });

      console.log('One-time checkout session created:', checkoutSession.id);
    }

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error: any) {
    console.error('=== Error creating checkout session ===');
    console.error('Error:', error);
    console.error('Error message:', error?.message);
    
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to create checkout session',
      },
      { status: 500 }
    );
  }
}
