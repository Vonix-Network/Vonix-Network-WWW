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
          // User has time remaining on rank
          const currentExpiry = new Date(user.rankExpiresAt);
          
          // IMPORTANT: For subscription renewals, we want to extend from current expiration
          // This is correct behavior: if user has 60 days left and renews 30 days,
          // they should have 90 days total
          expiresAt = new Date(currentExpiry);
          expiresAt.setDate(expiresAt.getDate() + days);
          
          console.log(`Extending rank from ${currentExpiry.toISOString()} to ${expiresAt.toISOString()}`);
        } else {
          // New rank or expired - start from now
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + days);
          
          console.log(`Starting new rank, expires at ${expiresAt.toISOString()}`);
        }

        // Update user's rank and totalDonated
        const amount = invoice.amount_paid / 100; // Convert from cents
        const isFirstPayment = invoice.billing_reason === 'subscription_create';
        
        // Clear any pause state when subscription payment succeeds
        await db
          .update(users)
          .set({
            donationRankId: rankId,
            rankExpiresAt: expiresAt,
            totalDonated: (user.totalDonated || 0) + amount,
            rankPaused: false,
            pausedAt: null,
            pausedRankId: null,
            pausedRemainingDays: null,
          })
          .where(eq(users.id, userId));

        // Create receipt (webhook is source of truth for subscriptions)
        const receiptNumber = `VN-${Date.now()}-${userId}`;
        await db.insert(donations).values({
          userId,
          minecraftUsername: user.minecraftUsername,
          minecraftUuid: user.minecraftUuid,
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
        // Subscription updated (price change, status change, cancellation scheduled, etc)
        const subscription: any = event.data.object;
        console.log('Subscription updated:', subscription.id, 'Status:', subscription.status);
        
        const metadata = subscription.metadata || {};
        const userId = metadata.userId;

        if (!userId) {
          console.log('No userId in subscription metadata, skipping');
          break;
        }

        // Get user
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, Number(userId)))
          .limit(1);

        if (!user) {
          console.error('User not found:', userId);
          break;
        }

        // Check if subscription was canceled (cancel_at_period_end = true)
        if (subscription.cancel_at_period_end) {
          console.log(`⚠️ Subscription ${subscription.id} scheduled to cancel at period end`);
          // Don't remove rank yet - let it expire naturally at current_period_end
          // The subscription.deleted event will fire when it actually ends
        }

        // Check if subscription status changed to canceled or unpaid
        if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          console.log(`❌ Subscription ${subscription.id} is ${subscription.status}`);
          // User will lose rank when it expires naturally
        }

        // If subscription was upgraded/downgraded, metadata should have new rank info
        // The next invoice.payment_succeeded will assign the new rank
        if (metadata.rankId) {
          console.log(`✅ Subscription updated with new rank: ${metadata.rankName}`);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        // Subscription cancelled or ended - user reached end of billing period
        const subscription: any = event.data.object;
        console.log('❌ Subscription deleted:', subscription.id);
        
        const metadata = subscription.metadata || {};
        const userId = metadata.userId;

        if (!userId) {
          console.log('No userId in subscription metadata, skipping');
          break;
        }

        // Get user
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, Number(userId)))
          .limit(1);

        if (!user) {
          console.error('User not found:', userId);
          break;
        }

        // Check cancellation type
        const canceledAt = subscription.canceled_at;
        const endedAt = subscription.ended_at;
        const currentPeriodEnd = subscription.current_period_end;
        
        // If canceled_at === ended_at, it was IMMEDIATE cancellation (admin action)
        // If ended_at > canceled_at, it was scheduled cancellation (let expire naturally)
        const wasImmediateCancellation = canceledAt && endedAt && (canceledAt === endedAt);
        
        if (wasImmediateCancellation) {
          // IMMEDIATE CANCELLATION (Admin action from Stripe dashboard)
          console.log(`⚠️ IMMEDIATE cancellation for user ${userId} - removing rank now`);
          
          await db
            .update(users)
            .set({
              donationRankId: null,
              rankExpiresAt: null,
              rankPaused: false,
              pausedRankId: null,
              pausedAt: null,
              pausedRemainingDays: null,
            })
            .where(eq(users.id, Number(userId)));
            
          console.log(`✅ Rank immediately removed for user ${userId}`);
        } else {
          // SCHEDULED CANCELLATION (User canceled, let expire at period end)
          console.log(`ℹ️ Subscription ended at period end for user ${userId}`);
          console.log(`   Rank will expire naturally at: ${user.rankExpiresAt}`);
          // Rank stays until rankExpiresAt - user paid for this time
        }
        
        // TODO: Send cancellation email
        // await sendSubscriptionCancelledEmail(user.email, {...});

        break;
      }

      case 'invoice.payment_failed': {
        // Payment failed - implement grace period (Stripe Smart Retry handles retries)
        const invoice: any = event.data.object;
        const subscriptionId = invoice.subscription;
        
        console.error('💳 Payment failed for subscription:', subscriptionId);
        
        if (!subscriptionId) {
          console.log('No subscription ID in failed invoice');
          break;
        }

        // Get subscription details
        const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);
        const metadata = subscription.metadata || {};
        const userId = metadata.userId;

        if (!userId) {
          console.log('No userId in subscription metadata');
          break;
        }

        // Get user
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, Number(userId)))
          .limit(1);

        if (!user) {
          console.error('User not found:', userId);
          break;
        }

        // GRACE PERIOD: Don't remove rank immediately
        // Stripe Smart Retry will attempt payment again
        // Rank stays active until subscription actually cancels or grace period ends
        
        const attemptCount = invoice.attempt_count || 1;
        const nextPaymentAttempt = invoice.next_payment_attempt 
          ? new Date(invoice.next_payment_attempt * 1000) 
          : null;

        console.log(`⚠️ Payment failed (attempt ${attemptCount}) for user ${userId}`);
        console.log(`   Rank remains active. Next retry: ${nextPaymentAttempt?.toISOString() || 'N/A'}`);
        console.log(`   Stripe Smart Retry will handle automatic retries`);
        
        // TODO: Send email to user about failed payment
        // await sendPaymentFailedEmail(user.email, {
        //   username: user.username,
        //   rankName: metadata.rankName,
        //   amount: invoice.amount_due / 100,
        //   nextRetry: nextPaymentAttempt?.toISOString(),
        //   updatePaymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
        // });
        
        // Rank expiration will handle removal if needed
        // User keeps rank until rankExpiresAt date
        
        break;
      }

      case 'customer.subscription.paused': {
        // Subscription paused - track when and how many days remain
        const subscription: any = event.data.object;
        console.log('⏸️ Subscription paused:', subscription.id);
        
        const metadata = subscription.metadata || {};
        const userId = metadata.userId;

        if (!userId) {
          console.log('No userId in subscription metadata, skipping');
          break;
        }

        // Get user and calculate remaining days
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, Number(userId)))
          .limit(1);

        if (!user) {
          console.error('User not found:', userId);
          break;
        }

        const now = new Date();
        let remainingDays = 0;
        
        if (user.rankExpiresAt) {
          const expiresAt = new Date(user.rankExpiresAt);
          if (expiresAt > now) {
            remainingDays = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          }
        }

        // Track pause state
        await db
          .update(users)
          .set({
            rankPaused: true,
            pausedRankId: user.donationRankId,
            pausedRemainingDays: remainingDays,
            pausedAt: now,
            updatedAt: new Date(),
          })
          .where(eq(users.id, Number(userId)));

        console.log(`✅ Tracked subscription pause for user ${userId}: ${remainingDays} days remaining`);
        
        break;
      }

      case 'customer.subscription.resumed': {
        // Subscription resumed - extend expiration by pause duration
        const subscription: any = event.data.object;
        console.log('▶️ Subscription resumed:', subscription.id);
        
        const metadata = subscription.metadata || {};
        const userId = metadata.userId;

        if (!userId) {
          console.log('No userId in subscription metadata, skipping');
          break;
        }

        // Get user with pause information
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, Number(userId)))
          .limit(1);

        if (!user) {
          console.error('User not found:', userId);
          break;
        }

        // Calculate pause duration in days
        let pauseDurationDays = 0;
        if (user.pausedAt && user.rankPaused) {
          const now = new Date();
          const pausedDate = new Date(user.pausedAt);
          pauseDurationDays = Math.ceil((now.getTime() - pausedDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        // Extend rank expiration by pause duration
        let newExpiresAt = user.rankExpiresAt ? new Date(user.rankExpiresAt) : new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + pauseDurationDays);

        // Clear pause state and extend expiration
        await db
          .update(users)
          .set({
            rankPaused: false,
            pausedRankId: null,
            pausedRemainingDays: null,
            pausedAt: null,
            rankExpiresAt: newExpiresAt,
            updatedAt: new Date(),
          })
          .where(eq(users.id, Number(userId)));

        console.log(`✅ Subscription resumed for user ${userId}: Extended expiration by ${pauseDurationDays} days to ${newExpiresAt.toISOString()}`);
        
        break;
      }

      case 'invoice.payment_action_required': {
        // Payment requires additional action (3DS, SCA, etc)
        const invoice: any = event.data.object;
        const subscription: any = invoice.subscription;
        
        console.log('🔐 Payment action required for invoice:', invoice.id);
        
        if (subscription) {
          const sub: any = await stripe.subscriptions.retrieve(subscription);
          const userId = sub.metadata?.userId;
          
          if (userId) {
            const [user] = await db
              .select()
              .from(users)
              .where(eq(users.id, Number(userId)))
              .limit(1);

            if (user && user.email) {
              // TODO: Send email to user
              console.log(`   Sent action required email to user ${userId}`);
              // await sendPaymentActionRequiredEmail(user.email, {
              //   invoiceUrl: invoice.hosted_invoice_url,
              //   amount: invoice.amount_due / 100,
              // });
            }
          }
        }
        
        break;
      }

      case 'payment_method.automatically_updated': {
        // Payment method was automatically updated (card renewed)
        const paymentMethod: any = event.data.object;
        console.log('💳 Payment method automatically updated:', paymentMethod.id);
        
        // This is good - card was automatically renewed
        // No action needed
        break;
      }

      case 'payment_intent.succeeded': {
        // One-time payment succeeded - handle rank assignment
        const paymentIntent: any = event.data.object;
        console.log('💰 Payment Intent succeeded:', paymentIntent.id);

        const metadata = paymentIntent.metadata || {};
        const userId = metadata.userId;
        const rankId = metadata.rankId;
        const days = metadata.days;

        if (!userId || !rankId || !days) {
          console.log('Missing metadata in payment_intent, skipping');
          break;
        }

        // Check idempotency
        const [existingReceipt] = await db
          .select()
          .from(donations)
          .where(eq(donations.paymentId, paymentIntent.id))
          .limit(1);

        if (existingReceipt) {
          console.log('Payment already processed:', paymentIntent.id);
          break;
        }

        // Get user
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, Number(userId)))
          .limit(1);

        if (!user) {
          console.error('User not found:', userId);
          break;
        }

        // Get rank
        const [rank] = await db
          .select()
          .from(donationRanks)
          .where(eq(donationRanks.id, rankId))
          .limit(1);

        if (!rank) {
          console.error('Rank not found:', rankId);
          break;
        }

        // Calculate expiration (one-time payments extend from current expiration)
        const now = new Date();
        const daysNum = Number(days);
        let expiresAt: Date;

        if (user.rankExpiresAt && new Date(user.rankExpiresAt) > now) {
          // Extend from current expiration
          const currentExpiry = new Date(user.rankExpiresAt);
          expiresAt = new Date(currentExpiry);
          expiresAt.setDate(expiresAt.getDate() + daysNum);
          console.log(`Extending rank from ${currentExpiry.toISOString()} to ${expiresAt.toISOString()}`);
        } else {
          // Start from now
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + daysNum);
          console.log(`Starting new rank, expires at ${expiresAt.toISOString()}`);
        }

        // Update user's rank and totalDonated
        const amount = paymentIntent.amount / 100; // Convert from cents
        
        await db
          .update(users)
          .set({
            donationRankId: rankId,
            rankExpiresAt: expiresAt,
            totalDonated: (user.totalDonated || 0) + amount,
          })
          .where(eq(users.id, Number(userId)));

        // Create donation record (without id field - let autoincrement handle it)
        const receiptNumber = `VN-${Date.now()}-${userId}`;
        await db.insert(donations).values({
          userId: Number(userId),
          minecraftUsername: user.minecraftUsername,
          minecraftUuid: user.minecraftUuid,
          amount,
          currency: paymentIntent.currency?.toUpperCase() || 'USD',
          method: 'stripe',
          receiptNumber,
          paymentId: paymentIntent.id,
          rankId,
          days: daysNum,
          paymentType: 'one_time',
          status: 'completed',
          message: `${rank.name} Rank - ${days} days`,
          displayed: true,
        });

        console.log(`✅ One-time payment processed for user ${userId}, rank ${rankId} until ${expiresAt.toISOString()}`);

        // Send email notification
        try {
          if (user.email) {
            await sendRankPurchaseEmail(user.email, {
              username: user.username,
              rankName: rank.name,
              rankBadge: rank.badge || rank.name,
              rankColor: rank.color,
              amount,
              days: daysNum,
              expiresAt: expiresAt.toISOString(),
              isSubscription: false,
            });
            console.log(`✅ Purchase email sent to ${user.email}`);
          }
        } catch (emailError) {
          console.error('❌ Error sending purchase email:', emailError);
        }

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
