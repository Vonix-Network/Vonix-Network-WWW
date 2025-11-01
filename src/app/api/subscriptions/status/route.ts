import { NextResponse } from 'next/server';
import { isSquareEnabled } from '@/lib/square/config';

export const runtime = 'nodejs';

// GET /api/subscriptions/status - Check if rank subscription system is ready
export async function GET() {
  try {
    const squareEnabled = isSquareEnabled();
    
    return NextResponse.json({
      system: 'rank-subscriptions',
      ready: true, // Rank subscription system is always ready
      paymentProcessing: squareEnabled,
      features: {
        timeBasedRanks: true,
        automaticConversion: true,
        upgradeDowngrade: true,
        automaticExpiration: true,
        discounts: true,
      },
      message: squareEnabled 
        ? 'Rank subscription system is fully operational with payment processing'
        : 'Rank subscription system is ready. Enable Square in .env to process payments.',
      squareConfig: {
        enabled: squareEnabled,
        required: true,
        purpose: 'one-time payment processing',
        note: 'Does NOT require Square Subscriptions API',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: error.message || 'Failed to check status',
        system: 'rank-subscriptions',
      },
      { status: 500 }
    );
  }
}
