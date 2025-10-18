import { db } from './index';
import { sql } from 'drizzle-orm';

/**
 * Migration: Ensure social_comments table has all required columns
 * This fixes the parent_comment_id column issue
 */
export async function migrateSocialComments() {
  console.log('Checking social_comments table structure...');
  
  try {
    // Check if parent_comment_id column exists
    const tableInfo = await db.run(sql`PRAGMA table_info(social_comments)`);
    console.log('Current table structure:', tableInfo);
    
    // Try to add parent_comment_id if it doesn't exist
    try {
      await db.run(sql`
        ALTER TABLE social_comments 
        ADD COLUMN parent_comment_id INTEGER
      `);
      console.log('✅ Successfully added parent_comment_id column');
    } catch (error: any) {
      if (error.message?.includes('duplicate column name')) {
        console.log('ℹ️  parent_comment_id column already exists');
      } else {
        throw error;
      }
    }
    
    // Verify the column exists now
    const updatedTableInfo = await db.run(sql`PRAGMA table_info(social_comments)`);
    console.log('Updated table structure:', updatedTableInfo);
    
  } catch (error) {
    console.error('❌ Error migrating social_comments table:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  migrateSocialComments()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
