import { NextRequest, NextResponse } from 'next/server';
import { handleSubscriptionRenewal, handleSubscriptionPaymentFailure } from '@/lib/square/recurring-subscriptions';

export const runtime = 'nodejs';

/**
 * Square Webhook Endpoint
 * Handles subscription renewal events from Square
 * 
 * Setup in Square Dashboard:
 * 1. Go to Applications → Webhooks
 * 2. Add endpoint: https://yoursite.com/api/webhooks/square
 * 3. Subscribe to events:
 *    - subscription.updated
 *    - subscription.created
 *    - payment.updated
 * 4. Copy signature key to .env as SQUARE_WEBHOOK_SIGNATURE_KEY
 */
export async function POST(request: NextRequest) {
  try {
    // Verify Square webhook signature (recommended for production)
    const signature = request.headers.get('x-square-signature');
    const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    
    // TODO: Implement signature verification
    // For now, we'll trust the webhook (only do this in development!)
    
    const body = await request.json();
    const { type, data } = body;

    console.log(`📨 Square webhook received: ${type}`);

    // Handle subscription renewal
    if (type === 'subscription.updated') {
      const subscription = data.object.subscription;
      
      // Check if this is a renewal (status changed to ACTIVE after billing)
      if (subscription.status === 'ACTIVE') {
        // Extract user info from subscription metadata
        // You'll need to store userId in subscription metadata when creating it
        const userId = parseInt(subscription.metadata?.userId || '0');
        const rankId = subscription.metadata?.rankId || '';
        
        if (userId && rankId) {
          await handleSubscriptionRenewal(subscription.id, rankId, userId);
        }
      }
    }

    // Handle payment failures
    if (type === 'payment.updated') {
      const payment = data.object.payment;
      
      if (payment.status === 'FAILED' && payment.subscriptionId) {
        const userId = parseInt(payment.metadata?.userId || '0');
        
        if (userId) {
          await handleSubscriptionPaymentFailure(payment.subscriptionId, userId);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Verify webhook is accessible
export async function GET() {
  return NextResponse.json({
    message: 'Square webhook endpoint is active',
    events: ['subscription.updated', 'subscription.created', 'payment.updated'],
  });
}
