import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import Stripe from 'stripe';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/stripe/customer-portal
 * Creates a Stripe Customer Portal session for self-service subscription management
 * 
 * Stripe Best Practice: Let users manage their own subscriptions
 * - Update payment methods
 * - View invoices
 * - Cancel subscriptions
 * - Update billing info
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

    const stripe = new Stripe(stripeSecretKey);

    // Get user's Stripe customer ID
    const [user] = await db
      .select({ stripeCustomerId: users.stripeCustomerId })
      .from(users)
      .where(eq(users.id, Number(session.user.id)))
      .limit(1);

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Subscribe to a rank first.' },
        { status: 404 }
      );
    }

    // Get return URL from request or use default
    const body = await request.json().catch(() => ({}));
    const returnUrl = body.returnUrl || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/settings/subscriptions`;

    // Create customer portal session
    console.log(`Creating customer portal session for user ${session.user.id}`);
    
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
      // Optional: Configure what users can do in the portal
      // flow_data: {
      //   type: 'subscription_cancel',
      //   subscription_cancel: {
      //     subscription: subscriptionId, // If you want to target a specific subscription
      //   },
      // },
    });

    console.log(`Customer portal session created: ${portalSession.id}`);

    return NextResponse.json({
      url: portalSession.url,
      sessionId: portalSession.id,
    });
  } catch (error: any) {
    console.error('Error creating customer portal session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create customer portal session' },
      { status: 500 }
    );
  }
}
