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

    // Check if subscriptions are enabled (controlled by ENABLE_SUBSCRIPTIONS env var)
    if (isRecurring) {
      const { isSubscriptionsEnabled, getSubscriptionsDisabledMessage } = await import('@/lib/subscription-config');
      
      if (!isSubscriptionsEnabled()) {
        console.log('⚠️ Subscription attempt blocked: ENABLE_SUBSCRIPTIONS is disabled');
        return NextResponse.json(
          { 
            error: 'SUBSCRIPTIONS_DISABLED',
            message: getSubscriptionsDisabledMessage(),
            suggestion: 'Please use one-time payment option instead.',
          },
          { status: 503 }
        );
      }
    }

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

    // CRITICAL: Check for existing active subscriptions
    if (user.stripeCustomerId && isRecurring) {
      console.log('Checking for existing subscriptions...');
      const existingSubs = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        limit: 10,
      });

      if (existingSubs.data.length > 0) {
        const activeSub: any = existingSubs.data[0];
        const currentRankId = activeSub.metadata?.rankId;
        
        console.log('Found active subscription:', activeSub.id, 'for rank:', currentRankId);

        // If trying to create recurring subscription for SAME rank - BLOCK (would be duplicate)
        if (currentRankId === rankId) {
          return NextResponse.json({
            error: 'DUPLICATE_SUBSCRIPTION',
            message: 'You already have an active subscription for this rank.',
            suggestion: 'Your subscription will automatically renew. No need to purchase again!',
            existingSubscription: {
              id: activeSub.id,
              rankName: activeSub.metadata?.rankName || 'Unknown',
              nextBilling: new Date(activeSub.current_period_end * 1000).toISOString(),
            },
          }, { status: 409 });
        }

        // If trying to create recurring subscription for DIFFERENT rank - suggest upgrade
        return NextResponse.json({
          error: 'SUBSCRIPTION_EXISTS',
          message: 'You already have an active subscription for a different rank.',
          suggestion: 'Would you like to upgrade/change your subscription instead?',
          action: 'UPDATE_SUBSCRIPTION',
          currentSubscription: {
            id: activeSub.id,
            rankId: currentRankId,
            rankName: activeSub.metadata?.rankName || 'Unknown',
          },
          targetRank: {
            rankId,
            amount,
            days,
          },
        }, { status: 409 });
      }
    }

    // If user has active subscription and trying to extend (one-time) - WARNING but allow
    if (user.stripeCustomerId && !isRecurring) {
      const existingSubs = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        limit: 1,
      });

      if (existingSubs.data.length > 0) {
        console.log('User has active subscription but purchasing one-time extension - allowing');
        // This is OK - just adds days, doesn't affect subscription billing
      }
    }

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

    // AUTO-SYNC: Check if rank needs Stripe products/prices configured
    if (isRecurring) {
      const { rankNeedsSync, syncRankProducts } = await import('@/lib/stripe-product-sync');
      
      if (rankNeedsSync(rank)) {
        console.log(`⚠️ Rank ${rank.name} missing Stripe products/prices, auto-syncing...`);
        
        try {
          const syncResult = await syncRankProducts(stripe, rank.id);
          
          if (!syncResult.success) {
            console.error('Failed to auto-sync Stripe products:', syncResult.error);
            return NextResponse.json(
              { 
                error: 'STRIPE_SETUP_FAILED',
                message: `Could not configure subscription for ${rank.name}.`,
                details: syncResult.error || 'Unable to create Stripe products',
                suggestion: 'Please try a one-time payment instead, or contact an administrator.',
              },
              { status: 503 }
            );
          }
          
          console.log(`✅ Auto-sync successful for ${rank.name}`);
          
          // Refresh rank data with new product IDs
          const [updatedRank] = await db
            .select()
            .from(donationRanks)
            .where(eq(donationRanks.id, rankId));
          
          if (updatedRank) {
            Object.assign(rank, updatedRank);
          }
        } catch (syncError: any) {
          console.error('Exception during auto-sync:', syncError);
          return NextResponse.json(
            { 
              error: 'STRIPE_SETUP_FAILED',
              message: `Could not configure subscription for ${rank.name}.`,
              details: syncError.message || 'An unexpected error occurred',
              suggestion: 'Please try a one-time payment instead, or contact an administrator.',
            },
            { status: 503 }
          );
        }
      }
    }

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
      // SUBSCRIPTION MODE - Use catalog prices (Stripe best practice)
      console.log('Creating subscription checkout session...');
      
      // Get price ID from product catalog based on interval
      let priceId: string | null | undefined;
      let intervalName: string;
      let fieldName: 'stripePriceMonthly' | 'stripePriceQuarterly' | 'stripePriceSemiannual' | 'stripePriceYearly';
      
      if (days === 30) {
        priceId = rank.stripePriceMonthly;
        intervalName = 'Monthly';
        fieldName = 'stripePriceMonthly';
      } else if (days === 90) {
        priceId = rank.stripePriceQuarterly;
        intervalName = 'Every 3 Months';
        fieldName = 'stripePriceQuarterly';
      } else if (days === 180) {
        priceId = rank.stripePriceSemiannual;
        intervalName = 'Every 6 Months';
        fieldName = 'stripePriceSemiannual';
      } else if (days === 365) {
        priceId = rank.stripePriceYearly;
        intervalName = 'Yearly';
        fieldName = 'stripePriceYearly';
      } else {
        priceId = rank.stripePriceMonthly;
        intervalName = 'Monthly';
        fieldName = 'stripePriceMonthly';
      }

      // Validate priceId exists and looks like a real Stripe price (price_*)
      if (!priceId || typeof priceId !== 'string' || !priceId.startsWith('price_')) {
        const provided = priceId || '(empty)';
        const msg = `Missing or invalid Stripe price ID in donation_ranks.${fieldName} for rank '${rank.name}' (id=${rank.id}). Found: '${provided}'.`;
        console.error(msg, 'Requested days:', days);
        return NextResponse.json(
          {
            error: 'CATALOG_PRICE_NOT_CONFIGURED',
            message: msg,
            hint: "Populate the donation_ranks catalog fields with real Stripe price IDs or run your product setup script.",
            fields: {
              productId: rank.stripeProductId || null,
              monthly: rank.stripePriceMonthly || null,
              quarterly: rank.stripePriceQuarterly || null,
              semiannual: rank.stripePriceSemiannual || null,
              yearly: rank.stripePriceYearly || null,
            },
          },
          { status: 400 }
        );
      }

      console.log('Using catalog price:', priceId, 'for', intervalName);

      // Generate idempotency key to prevent double-charges
      const idempotencyKey = `checkout_sub_${session.user.id}_${rankId}_${days}_${Date.now()}`;

      checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [
          {
            price: priceId,
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
        automatic_tax: { enabled: true },
        customer_update: {
          address: 'auto', // Automatically save address for tax calculation
        },
      }, {
        idempotencyKey, // Prevent duplicate charges on retry
      });

      console.log('Subscription checkout session created:', checkoutSession.id);
    } else {
      // ONE-TIME PAYMENT MODE
      console.log('Creating one-time payment checkout session...');

      // Generate idempotency key for one-time payment
      const idempotencyKey = `checkout_pay_${session.user.id}_${rankId}_${days}_${Date.now()}`;

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
        automatic_tax: { enabled: true },
        customer_update: {
          address: 'auto', // Automatically save address for tax calculation
        },
      }, {
        idempotencyKey, // Prevent duplicate charges
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
