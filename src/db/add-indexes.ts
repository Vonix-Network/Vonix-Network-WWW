/**
 * Add database indexes for production performance
 * Run this migration to optimize query performance
 */

import { db } from './index';
import { sql } from 'drizzle-orm';

export async function addIndexes() {
  console.log('Adding database indexes for production performance...');

  try {
    // Users table indexes
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_users_minecraft_uuid ON users(minecraft_uuid)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_users_donation_rank_id ON users(donation_rank_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
    console.log('✅ Users indexes created');

    // Forum posts indexes
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_forum_posts_category_id ON forum_posts(category_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_forum_posts_author_id ON forum_posts(author_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at DESC)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_forum_posts_pinned ON forum_posts(pinned, created_at DESC)`);
    console.log('✅ Forum posts indexes created');

    // Forum replies indexes
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_forum_replies_post_id ON forum_replies(post_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_forum_replies_author_id ON forum_replies(author_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_forum_replies_created_at ON forum_replies(created_at ASC)`);
    console.log('✅ Forum replies indexes created');

    // Social posts indexes
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON social_posts(user_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON social_posts(created_at DESC)`);
    console.log('✅ Social posts indexes created');

    // Social comments indexes
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_social_comments_post_id ON social_comments(post_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_social_comments_user_id ON social_comments(user_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_social_comments_created_at ON social_comments(created_at ASC)`);
    console.log('✅ Social comments indexes created');

    // Donations indexes
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_donations_minecraft_uuid ON donations(minecraft_uuid)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_donations_displayed ON donations(displayed)`);
    console.log('✅ Donations indexes created');

    // User engagement indexes
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_user_engagement_total_points ON user_engagement(total_points DESC)`);
    console.log('✅ User engagement indexes created');

    // Chat messages indexes
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp DESC)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_discord_id ON chat_messages(discord_message_id)`);
    console.log('✅ Chat messages indexes created');

    // Registration codes indexes
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_registration_codes_code ON registration_codes(code)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_registration_codes_uuid ON registration_codes(minecraft_uuid)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_registration_codes_used ON registration_codes(used)`);
    console.log('✅ Registration codes indexes created');

    // Private messages indexes
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_private_messages_sender ON private_messages(sender_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_private_messages_recipient ON private_messages(recipient_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_private_messages_created_at ON private_messages(created_at DESC)`);
    console.log('✅ Private messages indexes created');

    // Notifications indexes
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)`);
    console.log('✅ Notifications indexes created');

    console.log('\n🎉 All indexes created successfully!');
    console.log('Database is now optimized for production performance.');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  addIndexes()
    .then(() => {
      console.log('Index migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Index migration failed:', error);
      process.exit(1);
    });
}
