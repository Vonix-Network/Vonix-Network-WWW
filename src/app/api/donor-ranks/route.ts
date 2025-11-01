import { NextResponse } from 'next/server';
import { db } from '@/db';
import { donationRanks } from '@/db/schema';

/**
 * GET /api/donor-ranks
 * Public endpoint to fetch donation ranks for display purposes
 */
export async function GET() {
  try {
    const rawRanks = await db.select({
      id: donationRanks.id,
      name: donationRanks.name,
      subtitle: donationRanks.subtitle,
      color: donationRanks.color,
      textColor: donationRanks.textColor,
      icon: donationRanks.icon,
      badge: donationRanks.badge,
      glow: donationRanks.glow,
      minAmount: donationRanks.minAmount,
    }).from(donationRanks);

    // Transform to match subscribe page expectations
    const ranks = rawRanks.map(rank => ({
      id: rank.id,
      name: rank.name,
      description: rank.subtitle || `Get the ${rank.name} rank and unlock exclusive perks!`,
      features: [
        'Custom name color',
        'Special badge',
        'Priority support',
        `Starting at $${rank.minAmount}/month`
      ],
      color: rank.color,
      textColor: rank.textColor,
      backgroundColor: rank.color,
      borderColor: rank.color,
      icon: rank.icon,
      badge: rank.badge,
      glow: rank.glow,
      minDonation: rank.minAmount,
      priority: rank.minAmount, // Use minAmount as priority for sorting
    }));

    return NextResponse.json({ ranks }, {
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
