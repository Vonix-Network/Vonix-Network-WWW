import { NextResponse } from 'next/server';
import { isPaymentEnabled, getPaymentProvider } from '@/lib/payments/config';

/**
 * GET /api/payments/status
 * Returns the current payment provider configuration status
 */
export async function GET() {
  try {
    const enabled = isPaymentEnabled();
    const provider = getPaymentProvider();

    return NextResponse.json({
      enabled,
      provider,
      configured: enabled && provider !== null,
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return NextResponse.json(
      { enabled: false, provider: null, configured: false },
      { status: 500 }
    );
  }
}
