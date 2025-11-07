import { NextResponse } from 'next/server';
import { isSubscriptionsEnabled } from '@/lib/subscription-config';

/**
 * GET /api/subscriptions/config
 * Returns subscription feature configuration
 * Public endpoint - no authentication required
 */
export async function GET() {
  return NextResponse.json({
    enabled: isSubscriptionsEnabled(),
    message: isSubscriptionsEnabled() 
      ? 'Recurring subscriptions are available' 
      : 'Recurring subscriptions are temporarily unavailable',
  });
}
