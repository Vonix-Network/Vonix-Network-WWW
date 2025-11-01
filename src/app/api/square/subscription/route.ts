export const runtime = 'nodejs';
/**
 * Square Subscription API
 * 
 * Manage user subscriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { 
  createSubscription, 
  getUserSubscriptions,
  cancelSubscription,
  updateSubscription 
} from '@/lib/square/subscriptions';
import { isSquareEnabled } from '@/lib/square/config';

// GET - Retrieve user's subscriptions
export async function GET(request: NextRequest) {
  try {
    if (!isSquareEnabled()) {
      return NextResponse.json({
        subscriptions: [],
        disabled: true,
        message: 'Subscription management is currently unavailable'
      });
    }

    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      );
    }

    const subscriptions = await getUserSubscriptions(customerId);

    return NextResponse.json({
      subscriptions,
      disabled: false,
    });
  } catch (error: any) {
    console.error('Get subscriptions API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new subscription
export async function POST(request: NextRequest) {
  try {
    if (!isSquareEnabled()) {
      return NextResponse.json(
        { 
          error: 'Subscription creation is currently unavailable',
          disabled: true 
        },
        { status: 503 }
      );
    }

    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { customerId, planId, sourceId } = body;

    if (!customerId || !planId || !sourceId) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, planId, sourceId' },
        { status: 400 }
      );
    }

    const result = await createSubscription({
      customerId,
      planId,
      sourceId,
      userId: parseInt(session.user.id),
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        subscriptionId: result.subscriptionId,
      });
    }

    return NextResponse.json(
      { error: result.error || 'Subscription creation failed' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Create subscription API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update subscription
export async function PATCH(request: NextRequest) {
  try {
    if (!isSquareEnabled()) {
      return NextResponse.json(
        { 
          error: 'Subscription updates are currently unavailable',
          disabled: true 
        },
        { status: 503 }
      );
    }

    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscriptionId, priceOverride } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'subscriptionId is required' },
        { status: 400 }
      );
    }

    const result = await updateSubscription(subscriptionId, {
      priceOverride: priceOverride ? parseFloat(priceOverride) : undefined,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        subscriptionId: result.subscriptionId,
      });
    }

    return NextResponse.json(
      { error: result.error || 'Subscription update failed' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Update subscription API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel subscription
export async function DELETE(request: NextRequest) {
  try {
    if (!isSquareEnabled()) {
      return NextResponse.json(
        { 
          error: 'Subscription cancellation is currently unavailable',
          disabled: true 
        },
        { status: 503 }
      );
    }

    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const subscriptionId = searchParams.get('subscriptionId');

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'subscriptionId is required' },
        { status: 400 }
      );
    }

    const result = await cancelSubscription(subscriptionId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Subscription canceled successfully',
      });
    }

    return NextResponse.json(
      { error: result.error || 'Subscription cancellation failed' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Cancel subscription API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
