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
    console.log('=== Stripe Subscription Creation Started ===');
    
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
    
    const { rankId, days, amount } = body;

    if (!rankId || !days || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
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

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      console.log('Creating new Stripe customer...');
      // Create new Stripe customer with email for Stripe notifications
      const customerData: any = {
        name: session.user.username,
        metadata: {
          userId: session.user.id,
          username: session.user.username,
        },
      };
      
      // IMPORTANT: Pass email to Stripe for automated notifications
      if (user.email) {
        customerData.email = user.email;
        console.log('Setting customer email for Stripe notifications:', user.email);
      }
      
      console.log('Customer data:', customerData);
      const customer = await stripe.customers.create(customerData);
      console.log('Stripe customer created:', customer.id);

      customerId = customer.id;

      // Save customer ID to database
      console.log('Saving customer ID to database...');
      await db
        .update(users)
        .set({ stripeCustomerId: customerId })
        .where(eq(users.id, Number(session.user.id)));
      console.log('Customer ID saved');
    } else {
      // Update existing customer's email if it changed
      console.log('Updating existing Stripe customer email...');
      try {
        const customer = await stripe.customers.retrieve(customerId);
        if (!customer.deleted && user.email && customer.email !== user.email) {
          await stripe.customers.update(customerId, {
            email: user.email,
            name: session.user.username,
          });
          console.log('Customer email updated to:', user.email);
        }
      } catch (updateError) {
        console.error('Error updating customer email:', updateError);
        // Don't fail the request if email update fails
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

    console.log('Rank found:', { id: rank.id, name: rank.name, minAmount: rank.minAmount });

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

    console.log('Determined interval:', { interval, intervalCount, days });

    // Create or get price
    console.log('Creating Stripe price...');
    const priceData = {
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
    };
    console.log('Price data:', priceData);

    const price = await stripe.prices.create(priceData);
    console.log('Stripe price created:', price.id);

    // Create subscription with proper payment collection
    console.log('Creating subscription with params:', {
      customerId,
      priceId: price.id,
      rankId,
      days,
      amount: price.unit_amount,
    });

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price: price.id,
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: { 
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card'],
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: session.user.id,
        rankId,
        days: days.toString(),
      },
      // This tells Stripe to create a pending invoice that awaits payment
      collection_method: 'charge_automatically',
      // Description for receipts and invoices
      description: `${rank.name} Rank Subscription - ${days} days`,
    });

    console.log('Subscription created:', {
      subscriptionId: subscription.id,
      status: subscription.status,
      hasInvoice: !!subscription.latest_invoice,
      invoiceType: typeof subscription.latest_invoice,
    });

    // ALWAYS fetch the invoice explicitly since expand doesn't seem to work reliably
    let invoice: any = subscription.latest_invoice;
    let invoiceId: string;
    
    if (typeof invoice === 'string') {
      invoiceId = invoice;
      console.log('Invoice is a string ID:', invoiceId);
    } else if (invoice?.id) {
      invoiceId = invoice.id;
      console.log('Invoice is an object with ID:', invoiceId);
    } else {
      console.error('No invoice found on subscription:', subscription);
      return NextResponse.json(
        { error: 'Subscription created but no invoice found' },
        { status: 500 }
      );
    }

    // Always fetch the full invoice
    console.log('Fetching full invoice:', invoiceId);
    invoice = await stripe.invoices.retrieve(invoiceId);
    console.log('Retrieved invoice:', {
      invoiceId: invoice.id,
      status: invoice.status,
      hasPaymentIntent: !!invoice.payment_intent,
    });

    // Check if invoice has payment intent
    let paymentIntent: any = invoice?.payment_intent;
    
    if (!paymentIntent) {
      console.log('Invoice has no payment intent');
      
      // Check if invoice is already finalized
      if (invoice.status === 'open') {
        console.log('Invoice is open (finalized), but missing payment intent');
        
        // Try to retrieve with expand one more time
        try {
          invoice = await stripe.invoices.retrieve(invoice.id, {
            expand: ['payment_intent'],
          });
          paymentIntent = invoice.payment_intent;
          console.log('After re-retrieve:', {
            hasPaymentIntent: !!paymentIntent,
            paymentIntentId: paymentIntent?.id,
          });
        } catch (retrieveError) {
          console.error('Error retrieving invoice:', retrieveError);
        }
      } else if (invoice.status === 'draft') {
        console.log('Invoice is draft, finalizing...');
        
        // Only try to finalize if it's still a draft
        try {
          invoice = await stripe.invoices.finalizeInvoice(invoice.id, {
            expand: ['payment_intent'],
          });
          paymentIntent = invoice.payment_intent;
          
          console.log('Invoice finalized:', {
            invoiceId: invoice.id,
            status: invoice.status,
            hasPaymentIntent: !!paymentIntent,
            paymentIntentId: paymentIntent?.id,
          });
        } catch (finalizeError: any) {
          console.error('Failed to finalize invoice:', finalizeError);
          
          // If already finalized, retrieve it
          if (finalizeError.code === 'invoice_already_finalized' || 
              finalizeError.code === 'invoice_finalized' ||
              finalizeError.message?.includes('already finalized')) {
            console.log('Invoice was finalized by Stripe, retrieving...');
            invoice = await stripe.invoices.retrieve(invoice.id, {
              expand: ['payment_intent'],
            });
            paymentIntent = invoice.payment_intent;
            console.log('Retrieved after finalize error:', {
              hasPaymentIntent: !!paymentIntent,
            });
          } else {
            // Some other error, rethrow
            throw finalizeError;
          }
        }
      }
    }

    // Last resort: If still no payment intent, try to pay the invoice to create one
    if (!paymentIntent && invoice.status === 'open') {
      console.log('Last resort: attempting to pay invoice to create payment intent');
      try {
        // This will fail without a payment method, but should create the payment intent
        await stripe.invoices.pay(invoice.id, {
          paid_out_of_band: false,
        });
      } catch (payError: any) {
        // Expected to fail - we just want it to create the payment intent
        console.log('Pay error (expected, triggers payment intent creation):', payError.message);
      }
      
      // Retrieve one final time after pay attempt
      invoice = await stripe.invoices.retrieve(invoice.id, {
        expand: ['payment_intent'],
      });
      paymentIntent = invoice.payment_intent;
      console.log('Final retrieve after pay attempt:', {
        hasPaymentIntent: !!paymentIntent,
      });
    }

    console.log('Payment intent details:', {
      invoiceId: invoice?.id,
      hasPaymentIntent: !!paymentIntent,
      paymentIntentType: typeof paymentIntent,
      paymentIntentId: paymentIntent?.id,
      paymentIntentStatus: paymentIntent?.status,
      hasClientSecret: !!paymentIntent?.client_secret,
    });

    // If payment_intent is still a string, fetch it
    if (typeof paymentIntent === 'string') {
      console.log('Payment intent is just an ID, fetching:', paymentIntent);
      const fullPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntent);
      console.log('Retrieved payment intent:', {
        id: fullPaymentIntent.id,
        status: fullPaymentIntent.status,
        hasClientSecret: !!fullPaymentIntent.client_secret,
      });
      
      return NextResponse.json({
        subscriptionId: subscription.id,
        clientSecret: fullPaymentIntent.client_secret,
        customerId,
      });
    }

    if (!paymentIntent?.client_secret) {
      console.error('No client secret found after all attempts:', {
        subscriptionId: subscription.id,
        invoiceId: invoice?.id,
        paymentIntentId: paymentIntent?.id,
      });
      return NextResponse.json(
        { error: 'Subscription created but payment intent is missing. Please try again or contact support.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
      customerId,
    });
  } catch (error: any) {
    console.error('=== Error creating subscription ===');
    console.error('Error type:', typeof error);
    console.error('Error:', error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    // Handle Stripe-specific errors
    if (error?.type) {
      console.error('Stripe error type:', error.type);
      console.error('Stripe error code:', error.code);
      console.error('Stripe error param:', error.param);
      
      return NextResponse.json(
        { 
          error: error.message || 'Stripe API error',
          type: error.type,
          code: error.code,
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error?.message || error?.toString() || 'Failed to create subscription',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
