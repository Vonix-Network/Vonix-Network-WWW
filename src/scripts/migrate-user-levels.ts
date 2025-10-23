/**
 * Migration Script: Recalculate User Levels
 * 
 * This script recalculates all user levels based on the NEW exponential XP formula.
 * Run this once after updating the XP system to sync existing user data.
 * 
 * Usage: npx tsx src/scripts/migrate-user-levels.ts
 */

import { db } from '../db';
import { users } from '../db/schema';
import { getLevelFromXP } from '../lib/xp-utils';
import { sql } from 'drizzle-orm';

async function migrateUserLevels() {
  console.log('🔄 Starting user level migration...\n');

  try {
    // Get all users with XP
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        xp: users.xp,
        currentLevel: users.level,
      })
      .from(users);

    console.log(`Found ${allUsers.length} users to process\n`);

    let updatedCount = 0;
    let unchangedCount = 0;

    for (const user of allUsers) {
      const currentXP = user.xp || 0;
      const oldLevel = user.currentLevel || 1;
      const newLevel = getLevelFromXP(currentXP);

      if (newLevel !== oldLevel) {
        // Update user level
        await db
          .update(users)
          .set({ level: newLevel })
          .where(sql`${users.id} = ${user.id}`);

        console.log(
          `✅ ${user.username}: Level ${oldLevel} → ${newLevel} (${currentXP} XP)`
        );
        updatedCount++;
      } else {
        unchangedCount++;
      }
    }

    console.log('\n🎉 Migration complete!');
    console.log(`✅ Updated: ${updatedCount} users`);
    console.log(`⏭️  Unchanged: ${unchangedCount} users`);
    console.log(`📊 Total: ${allUsers.length} users processed`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateUserLevels()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
