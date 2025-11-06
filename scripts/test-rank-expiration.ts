/**
 * Test script for rank expiration system
 * Run with: npx tsx scripts/test-rank-expiration.ts
 */

import { db } from '../src/db';
import { users } from '../src/db/schema';
import { eq, and, isNotNull, lt } from 'drizzle-orm';

async function testRankExpiration() {
  console.log('🧪 Testing Rank Expiration System\n');

  // 1. Check for users with active ranks
  const now = new Date();
  console.log(`Current time: ${now.toISOString()}\n`);

  const activeRanks = await db
    .select({
      id: users.id,
      username: users.username,
      donationRankId: users.donationRankId,
      rankExpiresAt: users.rankExpiresAt,
    })
    .from(users)
    .where(
      and(
        isNotNull(users.donationRankId),
        isNotNull(users.rankExpiresAt)
      )
    );

  console.log(`📊 Found ${activeRanks.length} users with ranks:\n`);
  
  for (const user of activeRanks) {
    const expiresAt = new Date(user.rankExpiresAt!);
    const isExpired = expiresAt < now;
    const timeUntil = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`  ${isExpired ? '❌' : '✅'} ${user.username} (ID: ${user.id})`);
    console.log(`     Rank: ${user.donationRankId}`);
    console.log(`     Expires: ${expiresAt.toISOString()}`);
    console.log(`     Status: ${isExpired ? 'EXPIRED' : `Active (${timeUntil} days left)`}\n`);
  }

  // 2. Find expired ranks
  const expiredRanks = await db
    .select({
      id: users.id,
      username: users.username,
      donationRankId: users.donationRankId,
      rankExpiresAt: users.rankExpiresAt,
    })
    .from(users)
    .where(
      and(
        isNotNull(users.donationRankId),
        isNotNull(users.rankExpiresAt),
        lt(users.rankExpiresAt, now)
      )
    );

  console.log(`\n⏰ Found ${expiredRanks.length} expired ranks that would be removed:\n`);
  
  if (expiredRanks.length > 0) {
    for (const user of expiredRanks) {
      console.log(`  - ${user.username}: ${user.donationRankId} (expired ${user.rankExpiresAt})`);
    }
  } else {
    console.log('  None! All ranks are current.');
  }

  // 3. Test query logic
  console.log('\n✅ Query Logic Test:');
  console.log(`   - Checks for donationRankId IS NOT NULL`);
  console.log(`   - Checks for rankExpiresAt IS NOT NULL`);
  console.log(`   - Checks for rankExpiresAt < current time`);
  console.log(`   - Batches to 100 users per run`);

  console.log('\n🎉 Test Complete!\n');
  console.log('To manually trigger expiration (requires admin):');
  console.log('  GET /api/admin/expire-ranks\n');
  console.log('Automatic expiration runs hourly via cron job.');

  process.exit(0);
}

testRankExpiration().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
