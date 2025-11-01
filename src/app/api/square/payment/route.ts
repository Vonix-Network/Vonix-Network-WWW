export const runtime = 'nodejs';
/**
 * Square Payment API
 * 
 * Process one-time payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { createPayment } from '@/lib/square/payments';
import { isSquareEnabled } from '@/lib/square/config';

export async function POST(request: NextRequest) {
  try {
    // Check if Square is enabled
    if (!isSquareEnabled()) {
      return NextResponse.json(
        { 
          error: 'Payment processing is currently unavailable',
          disabled: true 
        },
        { status: 503 }
      );
    }

    const session = await getServerSession();
    const body = await request.json();

    const { sourceId, amount, message, email, minecraftUsername } = body;

    // Validation
    if (!sourceId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: sourceId and amount' },
        { status: 400 }
      );
    }

    if (amount < 1) {
      return NextResponse.json(
        { error: 'Minimum donation amount is $1' },
        { status: 400 }
      );
    }

    // Process payment
    const result = await createPayment({
      sourceId,
      amount: parseFloat(amount),
      userId: session?.user ? parseInt(session.user.id) : undefined,
      username: session?.user?.username,
      minecraftUsername: minecraftUsername || session?.user?.minecraftUsername,
      email: email || session?.user?.email,
      message,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        paymentId: result.paymentId,
      });
    }

    // Log detailed error information for debugging
    console.error('Square payment failed:', {
      error: result.error,
      userId: session?.user?.id,
      amount,
      sourceId: sourceId ? 'present' : 'missing',
      hasEmail: !!email,
      hasSession: !!session,
    });

    return NextResponse.json(
      { error: result.error || 'Payment failed' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Payment API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
