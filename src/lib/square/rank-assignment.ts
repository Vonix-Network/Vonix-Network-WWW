/**
 * Automatic Donor Rank Assignment
 * 
 * Maps donation amounts to donor ranks and automatically assigns them
 */

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface RankTier {
  name: string;
  minAmount: number;
  color?: string;
}

// Define your rank tiers (adjust these to match your server's ranks)
export const RANK_TIERS: RankTier[] = [
  { name: 'VIP', minAmount: 5, color: 'green' },
  { name: 'VIP+', minAmount: 10, color: 'blue' },
  { name: 'MVP', minAmount: 25, color: 'cyan' },
  { name: 'MVP+', minAmount: 50, color: 'purple' },
  { name: 'MVP++', minAmount: 100, color: 'gold' },
  { name: 'LEGEND', minAmount: 250, color: 'red' },
];

/**
 * Get appropriate rank based on donation amount
 */
export function getRankForAmount(amount: number): RankTier | null {
  // Find the highest rank the user qualifies for
  const qualifyingRanks = RANK_TIERS.filter(rank => amount >= rank.minAmount);
  
  if (qualifyingRanks.length === 0) {
    return null;
  }

  // Return the highest tier
  return qualifyingRanks[qualifyingRanks.length - 1];
}

/**
 * Assign donor rank to user after successful donation
 */
export async function assignDonorRank(userId: number, amount: number): Promise<boolean> {
  try {
    const rank = getRankForAmount(amount);
    
    if (!rank) {
      console.log(`No rank assignment for donation amount $${amount}`);
      return false;
    }

    // Get current user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      console.error(`User ${userId} not found`);
      return false;
    }

    // Check if user already has this rank or higher
    const currentRankIndex = user.donorRank ? RANK_TIERS.findIndex(r => r.name === user.donorRank) : -1;
    const newRankIndex = RANK_TIERS.findIndex(r => r.name === rank.name);

    if (currentRankIndex >= newRankIndex && currentRankIndex !== -1) {
      console.log(`User ${userId} already has rank ${user.donorRank}, not downgrading`);
      return false;
    }

    // Update user's donor rank
    await db
      .update(users)
      .set({ 
        donorRank: rank.name,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    console.log(`✅ Assigned rank ${rank.name} to user ${userId} for $${amount} donation`);
    return true;
  } catch (error) {
    console.error('Error assigning donor rank:', error);
    return false;
  }
}

/**
 * Calculate total donations for a user and assign appropriate rank
 */
export async function recalculateUserRank(userId: number, totalDonated: number): Promise<boolean> {
  return assignDonorRank(userId, totalDonated);
}

/**
 * Get rank upgrade information for a donation amount
 */
export function getRankUpgradeInfo(currentAmount: number): {
  currentRank: RankTier | null;
  nextRank: RankTier | null;
  amountNeeded: number;
} {
  const currentRank = getRankForAmount(currentAmount);
  
  if (!currentRank) {
    return {
      currentRank: null,
      nextRank: RANK_TIERS[0] || null,
      amountNeeded: RANK_TIERS[0]?.minAmount || 0,
    };
  }

  const currentIndex = RANK_TIERS.findIndex(r => r.name === currentRank.name);
  const nextRank = RANK_TIERS[currentIndex + 1] || null;
  const amountNeeded = nextRank ? nextRank.minAmount - currentAmount : 0;

  return {
    currentRank,
    nextRank,
    amountNeeded,
  };
}
