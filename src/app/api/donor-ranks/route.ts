import { NextResponse } from 'next/server';
import { db } from '@/db';
import { donationRanks } from '@/db/schema';

/**
 * GET /api/donor-ranks
 * Public endpoint to fetch donation ranks for display purposes
 */
export async function GET() {
  try {
    const ranks = await db.select({
      id: donationRanks.id,
      name: donationRanks.name,
      color: donationRanks.color,
      textColor: donationRanks.textColor,
      icon: donationRanks.icon,
      badge: donationRanks.badge,
      glow: donationRanks.glow,
      subtitle: donationRanks.subtitle,
    }).from(donationRanks);

    return NextResponse.json(ranks, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    });
  } catch (error) {
    console.error('Error fetching donor ranks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch donor ranks' },
      { status: 500 }
    );
  }
}
