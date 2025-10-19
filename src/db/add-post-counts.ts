/**
 * Migration: Add likesCount and commentsCount to social_posts
 * 
 * This migration adds engagement metrics to social posts for better sorting and trending algorithms.
 */

import { db } from './index';
import { sql } from 'drizzle-orm';

async function addPostCounts() {
  console.log('Starting migration: Add likesCount and commentsCount to social_posts...');

  try {
    // Check if columns already exist
    const tableInfo = await db.all(sql`PRAGMA table_info(social_posts)`);
    const hasLikesCount = tableInfo.some((col: any) => col.name === 'likes_count');
    const hasCommentsCount = tableInfo.some((col: any) => col.name === 'comments_count');

    // Add likesCount column if it doesn't exist
    if (!hasLikesCount) {
      await db.run(sql`
        ALTER TABLE social_posts 
        ADD COLUMN likes_count INTEGER DEFAULT 0 NOT NULL
      `);
      console.log('✓ Added likes_count column');
    } else {
      console.log('⊙ likes_count column already exists, skipping');
    }

    // Add commentsCount column if it doesn't exist
    if (!hasCommentsCount) {
      await db.run(sql`
        ALTER TABLE social_posts 
        ADD COLUMN comments_count INTEGER DEFAULT 0 NOT NULL
      `);
      console.log('✓ Added comments_count column');
    } else {
      console.log('⊙ comments_count column already exists, skipping');
    }

    // Update existing posts with current like counts
    await db.run(sql`
      UPDATE social_posts 
      SET likes_count = (
        SELECT COUNT(*) 
        FROM social_likes 
        WHERE social_likes.post_id = social_posts.id
      )
    `);
    console.log('✓ Updated likes_count for existing posts');

    // Update existing posts with current comment counts
    await db.run(sql`
      UPDATE social_posts 
      SET comments_count = (
        SELECT COUNT(*) 
        FROM social_comments 
        WHERE social_comments.post_id = social_posts.id
      )
    `);
    console.log('✓ Updated comments_count for existing posts');

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  addPostCounts()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { addPostCounts };
