import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/db';
import { users, donationRanks, donations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendSubscriptionRenewalEmail, sendRankPurchaseEmail } from '@/lib/email';

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events for subscription lifecycle
 */
export async function POST(request: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    console.error('Stripe not configured');
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const stripe = new Stripe(stripeSecretKey);

  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('Stripe webhook event:', event.type);

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded': {
        // Subscription payment succeeded - extend/activate rank
        const invoice: any = event.data.object;
        const subscriptionId = invoice.subscription;
        
        if (!subscriptionId) {
          console.log('No subscription ID in invoice');
          break;
        }

        // Check if we already processed this invoice (idempotency)
        const invoiceId = invoice.id;
        const [existingReceipt] = await db
          .select()
          .from(donations)
          .where(eq(donations.paymentId, invoiceId))
          .limit(1);

        if (existingReceipt) {
          console.log('Invoice already processed:', invoiceId);
          break; // Already handled, skip
        }

        // Get subscription details
        const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId = subscription.customer as string;
        const metadata = subscription.metadata;

        if (!metadata?.userId || !metadata?.rankId || !metadata?.days) {
          console.error('Missing metadata in subscription');
          break;
        }

        const userId = Number(metadata.userId);
        const rankId = metadata.rankId;
        const days = Number(metadata.days);

        // Get user
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));

        if (!user) {
          console.error('User not found:', userId);
          break;
        }

        // Get rank
        const [rank] = await db
          .select()
          .from(donationRanks)
          .where(eq(donationRanks.id, rankId));

        if (!rank) {
          console.error('Rank not found:', rankId);
          break;
        }

        // Calculate new expiry date
        const now = new Date();
        let expiresAt: Date;

        if (user.rankExpiresAt && new Date(user.rankExpiresAt) > now) {
          // Extend existing rank
          expiresAt = new Date(user.rankExpiresAt);
          expiresAt.setDate(expiresAt.getDate() + days);
        } else {
          // New rank or expired
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + days);
        }

        // Update user's rank and totalDonated
        const amount = invoice.amount_paid / 100; // Convert from cents
        const isFirstPayment = invoice.billing_reason === 'subscription_create';
        
        await db
          .update(users)
          .set({
            donationRankId: rankId,
            rankExpiresAt: expiresAt,
            totalDonated: (user.totalDonated || 0) + amount,
          })
          .where(eq(users.id, userId));

        // Create receipt (webhook is source of truth for subscriptions)
        const receiptNumber = `VN-${Date.now()}-${userId}`;
        await db.insert(donations).values({
          userId,
          amount,
          currency: invoice.currency?.toUpperCase() || 'USD',
          method: 'stripe',
          receiptNumber,
          paymentId: invoiceId, // Use invoice ID for idempotency
          subscriptionId: subscriptionId,
          rankId,
          days,
          paymentType: isFirstPayment ? 'subscription' : 'subscription_renewal',
          status: 'completed',
          message: `${rank.name} Rank - ${days} days ${isFirstPayment ? '(Subscription)' : '(Renewal)'}`,
          displayed: true,
        });

        console.log(`Rank extended for user ${userId} until ${expiresAt}, receipt: ${receiptNumber}`);

        // Send email notification
        try {
          if (user.email) {
            if (isFirstPayment) {
              // First payment - send welcome email
              await sendRankPurchaseEmail(user.email, {
                username: user.username,
                rankName: rank.name,
                rankBadge: rank.badge || rank.name,
                rankColor: rank.color,
                amount,
                days,
                expiresAt: expiresAt.toISOString(),
                isSubscription: true,
                subscriptionInterval: days === 90 ? 'Every 3 Months' : days === 180 ? 'Every 6 Months' : days === 365 ? 'Yearly' : 'Monthly',
                nextBillingDate: expiresAt.toISOString(),
              });
              console.log(`✅ Welcome email sent to ${user.email}`);
            } else {
              // Renewal payment
              await sendSubscriptionRenewalEmail(user.email, {
                username: user.username,
                rankName: rank.name,
                amount,
                nextBillingDate: expiresAt.toISOString(),
              });
              console.log(`✅ Renewal email sent to ${user.email}`);
            }
          }
        } catch (emailError) {
          console.error('❌ Error sending subscription email:', emailError);
          // Don't fail the webhook if email fails
        }
        
        break;
      }

      case 'checkout.session.completed': {
        // Checkout session completed - handle both subscriptions and one-time payments
        const checkoutSession: any = event.data.object;
        console.log('Checkout session completed:', checkoutSession.id);

        const mode = checkoutSession.mode;
        const userId = checkoutSession.client_reference_id || 
                      checkoutSession.subscription?.metadata?.userId ||
                      checkoutSession.payment_intent?.metadata?.userId;

        if (!userId) {
          console.error('No user ID found in checkout session');
          break;
        }

        if (mode === 'subscription') {
          // Subscription created via Checkout - webhook will handle via invoice.payment_succeeded
          console.log('Subscription checkout completed, waiting for first payment event');
        } else if (mode === 'payment') {
          // One-time payment via Checkout
          const paymentIntentId = checkoutSession.payment_intent;
          console.log('One-time payment checkout completed:', paymentIntentId);
          
          // The payment_intent.succeeded webhook will handle rank assignment
        }
        break;
      }

      case 'customer.subscription.created': {
        // New subscription created
        const subscription: any = event.data.object;
        console.log('New subscription created:', subscription.id);
        break;
      }

      case 'customer.subscription.updated': {
        // Subscription updated (status change, etc)
        const subscription: any = event.data.object;
        console.log('Subscription updated:', subscription.id, 'Status:', subscription.status);
        break;
      }

      case 'customer.subscription.deleted': {
        // Subscription cancelled or ended
        const subscription: any = event.data.object;
        console.log('Subscription deleted:', subscription.id);
        
        // Note: We don't remove the rank immediately - let it expire naturally
        // This allows users to keep benefits until the end of their paid period
        break;
      }

      case 'invoice.payment_failed': {
        // Payment failed - subscription might be cancelled
        const invoice: any = event.data.object;
        console.error('Payment failed for subscription:', invoice.subscription);
        
        // TODO: Send email notification to user about failed payment
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
