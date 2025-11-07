import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import Stripe from 'stripe';
import { db } from '@/db';
import { users, donations, donationRanks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { assignRankSubscription } from '@/lib/rank-subscription';
import { sendRankPurchaseEmail } from '@/lib/email';

export const runtime = 'nodejs';

/**
 * GET /api/stripe/verify-session
 * Verifies a Stripe Checkout session, assigns rank, and returns receipt
 */
export async function GET(request: NextRequest) {
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
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);

    // Retrieve the checkout session with expanded data
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'payment_intent'],
    });

    console.log('Checkout session retrieved:', {
      id: checkoutSession.id,
      paymentStatus: checkoutSession.payment_status,
      mode: checkoutSession.mode,
    });

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json({
        success: false,
        error: checkoutSession.payment_status === 'unpaid' 
          ? 'Payment has not been completed' 
          : 'Payment is still processing',
        status: checkoutSession.status,
        paymentStatus: checkoutSession.payment_status,
      });
    }

    // Get metadata from subscription or payment intent
    const subscription: any = checkoutSession.subscription;
    const metadata = subscription?.metadata || checkoutSession.metadata || {};
    
    const rankId = metadata.rankId;
    const days = parseInt(metadata.days || '30');

    if (!rankId || !days) {
      console.error('Missing metadata:', { rankId, days, metadata });
      return NextResponse.json({
        success: false,
        error: 'Missing rank information in checkout session',
      }, { status: 400 });
    }

    // Get rank details
    const [rank] = await db
      .select()
      .from(donationRanks)
      .where(eq(donationRanks.id, rankId))
      .limit(1);

    if (!rank) {
      return NextResponse.json({
        success: false,
        error: 'Rank not found',
      }, { status: 404 });
    }

    // Assign the rank
    console.log('Assigning rank:', { userId, rankId, days });
    const result = await assignRankSubscription(userId, rankId, days);

    if (!result.success) {
      console.error('Failed to assign rank:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to assign rank',
      }, { status: 500 });
    }

    console.log('Rank assigned successfully, expiration:', result.expiresAt);

    // For subscriptions, the webhook creates the receipt
    // For one-time payments, we create it here
    let receiptNumber: string | undefined;
    const amount = checkoutSession.amount_total! / 100;
    const paymentId = typeof checkoutSession.payment_intent === 'string' 
      ? checkoutSession.payment_intent 
      : checkoutSession.payment_intent?.id;
    const subscriptionId = typeof subscription === 'string' ? subscription : subscription?.id;

    if (checkoutSession.mode === 'subscription') {
      // Subscription: Webhook will create receipt, just wait for it
      console.log('Subscription payment - webhook will create receipt');
      
      // Give webhook a moment to process, then fetch receipt
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const [webhookReceipt] = await db
        .select()
        .from(donations)
        .where(eq(donations.subscriptionId, subscriptionId || ''))
        .limit(1);
      
      receiptNumber = webhookReceipt?.receiptNumber || undefined;
    } else {
      // One-time payment: Create receipt here
      // Check if receipt already exists (prevent duplicates)
      const [existingReceipt] = await db
        .select()
        .from(donations)
        .where(eq(donations.paymentId, paymentId || ''))
        .limit(1);

      if (existingReceipt) {
        console.log('Receipt already exists:', existingReceipt.receiptNumber);
        receiptNumber = existingReceipt.receiptNumber || `VN-${Date.now()}-${userId}`;
      } else {
        // Create new receipt for one-time payment
        receiptNumber = `VN-${Date.now()}-${userId}`;

        await db.insert(donations).values({
          userId,
          amount,
          currency: checkoutSession.currency?.toUpperCase() || 'USD',
          method: 'stripe',
          receiptNumber,
          paymentId,
          subscriptionId: null,
          rankId,
          days,
          paymentType: 'one_time',
          status: 'completed',
          message: `${rank.name} Rank - ${days} days`,
          displayed: true,
        });

        console.log('One-time payment receipt created:', receiptNumber);
      }
    }

    // Send email (only for one-time payments; webhook handles subscription emails)
    if (checkoutSession.mode !== 'subscription') {
      try {
        const [user] = await db
          .select({ email: users.email, username: users.username })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (user?.email && result.expiresAt) {
          await sendRankPurchaseEmail(user.email, {
            username: user.username,
            rankName: rank.name,
            rankBadge: rank.badge || rank.name,
            rankColor: rank.color,
            amount,
            days,
            expiresAt: result.expiresAt.toISOString(),
            isSubscription: false,
            subscriptionInterval: undefined,
            nextBillingDate: undefined,
          });
          console.log('Confirmation email sent for one-time payment');
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }
    } else {
      console.log('Subscription email will be sent by webhook');
    }

    // Return success with receipt
    return NextResponse.json({
      success: true,
      message: 'Your rank has been activated!',
      receipt: {
        receiptNumber,
        rankName: rank.name,
        amount,
        currency: checkoutSession.currency?.toUpperCase() || 'USD',
        days,
        paymentType: checkoutSession.mode === 'subscription' ? 'subscription' : 'one_time',
        paymentId,
        subscriptionId,
        date: new Date().toISOString(),
        expiresAt: result.expiresAt?.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error verifying session:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to verify session' },
      { status: 500 }
    );
  }
}
