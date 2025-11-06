import { NextResponse } from 'next/server';

/**
 * GET /api/stripe/config
 * Returns Stripe publishable key for client-side initialization
 */
export async function GET() {
  try {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not found in environment');
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 503 }
      );
    }

    console.log('Stripe config endpoint called, key exists:', !!publishableKey);

    return NextResponse.json({
      publishableKey,
    });
  } catch (error) {
    console.error('Error fetching Stripe config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Stripe configuration' },
      { status: 500 }
    );
  }
}
