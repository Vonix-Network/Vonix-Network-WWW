import { NextResponse } from 'next/server';
import { db } from '@/db';
import { donationRanks } from '@/db/schema';
import { asc } from 'drizzle-orm';

/**
 * GET /api/donation-ranks
 * Returns all available donation ranks
 */
export async function GET() {
  try {
    const ranks = await db
      .select()
      .from(donationRanks)
      .orderBy(asc(donationRanks.minAmount));

    return NextResponse.json({ ranks });
  } catch (error: any) {
    console.error('Error getting donation ranks:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get donation ranks' },
      { status: 500 }
    );
  }
}
