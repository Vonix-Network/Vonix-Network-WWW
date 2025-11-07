import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import Stripe from 'stripe';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/stripe/create-portal-session
 * Creates a Stripe Customer Portal session for subscription management
 * 
 * This redirects users to Stripe's hosted portal where they can:
 * - View subscription details
 * - Update payment methods
 * - Cancel subscriptions
 * - View invoices and payment history
 * - Update billing information
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
        { 
          error: 'No customer ID found',
          message: 'You need to make a purchase before accessing subscription management.',
        },
        { status: 404 }
      );
    }

    // Create Customer Portal session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/settings/billing`,
    });

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
