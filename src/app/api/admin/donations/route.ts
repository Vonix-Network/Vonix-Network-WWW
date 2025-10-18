import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db';
import { donations, users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/donations
 * Get all donations for admin management
 */
export async function GET() {
  try {
    await requireAdmin();

    const allDonations = await db
      .select({
        id: donations.id,
        userId: donations.userId,
        username: users.username,
        minecraftUsername: donations.minecraftUsername,
        minecraftUuid: donations.minecraftUuid,
        amount: donations.amount,
        currency: donations.currency,
        method: donations.method,
        message: donations.message,
        displayed: donations.displayed,
        createdAt: donations.createdAt,
      })
      .from(donations)
      .leftJoin(users, eq(donations.userId, users.id))
      .orderBy(desc(donations.createdAt));

    return NextResponse.json({ donations: allDonations });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching donations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/donations
 * Create a new donation manually
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { minecraftUsername, amount, currency, method, message, displayed } = body;

    if (!minecraftUsername || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Minecraft username and valid amount are required' },
        { status: 400 }
      );
    }

    // Try to find user by minecraft username
    const [user] = await db
      .select({ id: users.id, minecraftUuid: users.minecraftUuid })
      .from(users)
      .where(eq(users.minecraftUsername, minecraftUsername))
      .limit(1);

    // Create donation
    const [newDonation] = await db
      .insert(donations)
      .values({
        userId: user?.id || null,
        minecraftUsername,
        minecraftUuid: user?.minecraftUuid || null,
        amount: parseFloat(amount),
        currency: currency || 'USD',
        method: method || null,
        message: message || null,
        displayed: displayed !== undefined ? displayed : true,
      })
      .returning();

    // Update user's total donated if user exists
    if (user) {
      const [currentUser] = await db
        .select({ totalDonated: users.totalDonated })
        .from(users)
        .where(eq(users.id, user.id));
      
      await db
        .update(users)
        .set({
          totalDonated: (currentUser.totalDonated || 0) + parseFloat(amount),
        })
        .where(eq(users.id, user.id));
    }

    return NextResponse.json({ donation: newDonation }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error creating donation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
