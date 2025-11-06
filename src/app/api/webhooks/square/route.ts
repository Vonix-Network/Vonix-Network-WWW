import { NextRequest, NextResponse } from 'next/server';
import { handleSubscriptionRenewal, handleSubscriptionPaymentFailure } from '@/lib/square/recurring-subscriptions';
import crypto from 'crypto';

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
 * 5. Add NEXT_PUBLIC_APP_URL to .env for signature verification
 */
export async function POST(request: NextRequest) {
  try {
    // Get signature and raw body
    const signature = request.headers.get('x-square-hmacsha256-signature');
    const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    
    // Get raw body for signature verification
    const rawBody = await request.text();
    
    // SECURITY: Verify webhook signature in production
    if (process.env.NODE_ENV === 'production') {
      if (!webhookSignatureKey) {
        console.error('❌ CRITICAL: SQUARE_WEBHOOK_SIGNATURE_KEY not configured');
        return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
      }
      
      if (!signature) {
        console.error('❌ SECURITY: Missing webhook signature');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      // Verify signature using HMAC-SHA256
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://yoursite.com'}/api/webhooks/square`;
      const payload = webhookUrl + rawBody;
      const hmac = crypto.createHmac('sha256', webhookSignatureKey);
      hmac.update(payload);
      const expectedSignature = hmac.digest('base64');
      
      if (signature !== expectedSignature) {
        console.error('❌ SECURITY: Invalid webhook signature');
        console.error('Expected:', expectedSignature);
        console.error('Received:', signature);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      console.log('✅ Webhook signature verified');
    } else {
      console.warn('⚠️  DEVELOPMENT: Skipping webhook signature verification');
    }
    
    // Parse body after verification
    const body = JSON.parse(rawBody);
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
