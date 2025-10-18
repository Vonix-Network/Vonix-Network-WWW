import 'dotenv/config';
import { db } from './index';
import { sql } from 'drizzle-orm';

/**
 * Migration script for new features:
 * - Forum votes table
 * - User engagement table
 * - Updates to users table (donationRankId, totalDonated)
 */

async function migrate() {
  console.log('🔄 Starting migration for new features...');

  try {
    // Create forum_votes table
    console.log('Creating forum_votes table...');
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS forum_votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER REFERENCES forum_posts(id) ON DELETE CASCADE,
        reply_id INTEGER REFERENCES forum_replies(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        vote_type TEXT NOT NULL CHECK(vote_type IN ('upvote', 'downvote')),
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);
    console.log('✅ forum_votes table created');

    // Create user_engagement table
    console.log('Creating user_engagement table...');
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS user_engagement (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        total_points INTEGER NOT NULL DEFAULT 0,
        posts_created INTEGER NOT NULL DEFAULT 0,
        comments_created INTEGER NOT NULL DEFAULT 0,
        forum_posts_created INTEGER NOT NULL DEFAULT 0,
        forum_replies_created INTEGER NOT NULL DEFAULT 0,
        upvotes_received INTEGER NOT NULL DEFAULT 0,
        downvotes_received INTEGER NOT NULL DEFAULT 0,
        likes_received INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);
    console.log('✅ user_engagement table created');

    // Add columns to users table if they don't exist
    console.log('Checking users table for new columns...');
    
    try {
      await db.run(sql`ALTER TABLE users ADD COLUMN donation_rank_id TEXT`);
      console.log('✅ Added donation_rank_id column to users');
    } catch (error: any) {
      if (error.message?.includes('duplicate column')) {
        console.log('ℹ️  donation_rank_id column already exists');
      } else {
        throw error;
      }
    }

    try {
      await db.run(sql`ALTER TABLE users ADD COLUMN total_donated REAL DEFAULT 0`);
      console.log('✅ Added total_donated column to users');
    } catch (error: any) {
      if (error.message?.includes('duplicate column')) {
        console.log('ℹ️  total_donated column already exists');
      } else {
        throw error;
      }
    }

    // Initialize user_engagement for existing users
    console.log('Initializing user_engagement for existing users...');
    await db.run(sql`
      INSERT INTO user_engagement (user_id, total_points, posts_created, comments_created, forum_posts_created, forum_replies_created, upvotes_received, downvotes_received, likes_received, updated_at)
      SELECT 
        id,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        unixepoch()
      FROM users
      WHERE id NOT IN (SELECT user_id FROM user_engagement)
    `);
    console.log('✅ User engagement initialized');

    // Calculate initial engagement scores from existing data
    console.log('Calculating initial engagement scores...');
    
    // Count social posts
    await db.run(sql`
      UPDATE user_engagement
      SET posts_created = (
        SELECT COUNT(*) FROM social_posts WHERE user_id = user_engagement.user_id
      ),
      total_points = total_points + (
        SELECT COUNT(*) * 5 FROM social_posts WHERE user_id = user_engagement.user_id
      )
    `);
    
    // Count social comments
    await db.run(sql`
      UPDATE user_engagement
      SET comments_created = (
        SELECT COUNT(*) FROM social_comments WHERE user_id = user_engagement.user_id
      ),
      total_points = total_points + (
        SELECT COUNT(*) * 3 FROM social_comments WHERE user_id = user_engagement.user_id
      )
    `);
    
    // Count forum posts
    await db.run(sql`
      UPDATE user_engagement
      SET forum_posts_created = (
        SELECT COUNT(*) FROM forum_posts WHERE author_id = user_engagement.user_id
      ),
      total_points = total_points + (
        SELECT COUNT(*) * 10 FROM forum_posts WHERE author_id = user_engagement.user_id
      )
    `);
    
    // Count forum replies
    await db.run(sql`
      UPDATE user_engagement
      SET forum_replies_created = (
        SELECT COUNT(*) FROM forum_replies WHERE author_id = user_engagement.user_id
      ),
      total_points = total_points + (
        SELECT COUNT(*) * 5 FROM forum_replies WHERE author_id = user_engagement.user_id
      )
    `);
    
    // Count likes received
    await db.run(sql`
      UPDATE user_engagement
      SET likes_received = (
        SELECT COUNT(*) 
        FROM social_likes sl
        JOIN social_posts sp ON sl.post_id = sp.id
        WHERE sp.user_id = user_engagement.user_id
      ),
      total_points = total_points + (
        SELECT COUNT(*) 
        FROM social_likes sl
        JOIN social_posts sp ON sl.post_id = sp.id
        WHERE sp.user_id = user_engagement.user_id
      )
    `);

    console.log('✅ Initial engagement scores calculated');

    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log('  - forum_votes table created');
    console.log('  - user_engagement table created');
    console.log('  - users table updated with donor columns');
    console.log('  - Initial engagement scores calculated');
    console.log('');
    console.log('🎉 All new features are ready to use!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
