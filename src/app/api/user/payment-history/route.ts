import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { users, donations } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /api/user/payment-history
 * Returns user's payment history and total spent
 */
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's total donated
    const [user] = await db
      .select({ totalDonated: users.totalDonated })
      .from(users)
      .where(eq(users.id, Number(session.user.id)))
      .limit(1);

    // Get payment history
    const payments = await db
      .select({
        id: donations.id,
        amount: donations.amount,
        currency: donations.currency,
        date: donations.createdAt,
        status: donations.status,
        receiptNumber: donations.receiptNumber,
        stripeInvoiceUrl: donations.stripeInvoiceUrl,
        message: donations.message,
        paymentType: donations.paymentType,
      })
      .from(donations)
      .where(eq(donations.userId, Number(session.user.id)))
      .orderBy(desc(donations.createdAt))
      .limit(50); // Last 50 payments

    return NextResponse.json({
      totalSpent: user?.totalDonated || 0,
      payments: payments.map(p => ({
        ...p,
        date: p.date?.toISOString() || new Date().toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Error getting payment history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get payment history' },
      { status: 500 }
    );
  }
}
