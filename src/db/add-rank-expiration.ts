import { db } from './index';
import { sql } from 'drizzle-orm';

/**
 * Migration: Add rank_expires_at column to users table
 * This allows tracking when donation ranks expire
 */
export async function addRankExpiration() {
  console.log('Adding rank_expires_at column to users table...');
  
  try {
    // Add the rank_expires_at column
    await db.run(sql`
      ALTER TABLE users 
      ADD COLUMN rank_expires_at INTEGER
    `);
    
    console.log('✅ Successfully added rank_expires_at column');
  } catch (error: any) {
    // Column might already exist
    if (error.message?.includes('duplicate column name')) {
      console.log('ℹ️  rank_expires_at column already exists');
    } else {
      console.error('❌ Error adding rank_expires_at column:', error);
      throw error;
    }
  }
}

// Run if executed directly
if (require.main === module) {
  addRankExpiration()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
