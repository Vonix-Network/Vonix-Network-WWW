import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/db';
import { users, donationRanks } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-10-29.clover',
  });

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

        // Update user's rank
        const amount = invoice.amount_paid / 100; // Convert from cents
        await db
          .update(users)
          .set({
            donationRankId: rankId,
            rankExpiresAt: expiresAt,
            totalDonated: (user.totalDonated || 0) + amount,
          })
          .where(eq(users.id, userId));

        console.log(`Rank extended for user ${userId} until ${expiresAt}`);
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
