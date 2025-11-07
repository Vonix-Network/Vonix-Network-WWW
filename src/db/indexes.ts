/**
 * Database Index Definitions
 * Optimizes common query patterns for better performance
 */

import { sql } from 'drizzle-orm';
import { db } from './index';

/**
 * Helper to create index safely (skips if column doesn't exist)
 */
async function createIndexSafely(indexSql: string, description: string) {
  try {
    await db.run(sql.raw(indexSql));
    console.log(`  ✓ ${description}`);
  } catch (error: any) {
    if (error.message?.includes('no such column') || error.message?.includes('no such table')) {
      console.log(`  ⊘ Skipped: ${description} (table/column not found)`);
    } else {
      console.warn(`  ⚠ Warning creating ${description}:`, error.message);
    }
  }
}

/**
 * Create all performance indexes
 */
export async function createPerformanceIndexes() {
  console.log('📊 Creating performance indexes...');

  let created = 0;
  let skipped = 0;

  // Users table indexes
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)', 'users.username');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_users_minecraft_username ON users(minecraft_username)', 'users.minecraft_username');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_users_donation_rank ON users(donation_rank_id)', 'users.donation_rank_id');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_users_level ON users(level DESC)', 'users.level');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_users_xp ON users(xp DESC)', 'users.xp');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)', 'users.role');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC)', 'users.created_at');

  // Forum posts indexes
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON forum_posts(category_id)', 'forum_posts.category_id');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON forum_posts(author_id)', 'forum_posts.author_id');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON forum_posts(created_at DESC)', 'forum_posts.created_at');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_forum_posts_pinned ON forum_posts(pinned DESC, created_at DESC)', 'forum_posts.pinned');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_forum_posts_views ON forum_posts(views DESC)', 'forum_posts.views');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_forum_posts_category_created ON forum_posts(category_id, created_at DESC)', 'forum_posts.category+created');

  // Forum replies indexes
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_forum_replies_post ON forum_replies(post_id)', 'forum_replies.post_id');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_forum_replies_author ON forum_replies(author_id)', 'forum_replies.author_id');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_forum_replies_created ON forum_replies(created_at DESC)', 'forum_replies.created_at');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_forum_replies_post_created ON forum_replies(post_id, created_at ASC)', 'forum_replies.post+created');

  // Social posts indexes
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_social_posts_user ON social_posts(user_id)', 'social_posts.user_id');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_social_posts_created ON social_posts(created_at DESC)', 'social_posts.created_at');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_social_posts_likes ON social_posts(likes_count DESC)', 'social_posts.likes_count');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_social_posts_trending ON social_posts(likes_count DESC, comments_count DESC, created_at DESC)', 'social_posts.trending');

  // Social comments indexes
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_social_comments_post ON social_comments(post_id)', 'social_comments.post_id');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_social_comments_user ON social_comments(user_id)', 'social_comments.user_id');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_social_comments_created ON social_comments(created_at DESC)', 'social_comments.created_at');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_social_comments_parent ON social_comments(parent_comment_id)', 'social_comments.parent_comment_id');

  // Social likes indexes
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_social_likes_post ON social_likes(post_id)', 'social_likes.post_id');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_social_likes_user ON social_likes(user_id)', 'social_likes.user_id');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_social_likes_user_post ON social_likes(user_id, post_id)', 'social_likes.user+post');

  // Forum votes indexes
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_forum_votes_post ON forum_votes(post_id)', 'forum_votes.post_id');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_forum_votes_reply ON forum_votes(reply_id)', 'forum_votes.reply_id');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_forum_votes_user ON forum_votes(user_id)', 'forum_votes.user_id');

  // User engagement indexes
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_user_engagement_points ON user_engagement(total_points DESC)', 'user_engagement.total_points');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_user_engagement_updated ON user_engagement(updated_at DESC)', 'user_engagement.updated_at');

  // Friendships indexes
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id)', 'friendships.user_id');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id)', 'friendships.friend_id');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status)', 'friendships.status');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_friendships_user_status ON friendships(user_id, status)', 'friendships.user+status');

  // Notifications indexes
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id) WHERE read = 0', 'notifications.user_id[unread]');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC)', 'notifications.created_at');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read, created_at DESC)', 'notifications.user+read');

  // Groups indexes
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_groups_created ON groups(created_at DESC)', 'groups.created_at');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_groups_members ON groups(member_count DESC)', 'groups.member_count');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id)', 'group_members.group_id');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id)', 'group_members.user_id');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_group_posts_group ON group_posts(group_id, created_at DESC)', 'group_posts.group+created');

  // XP transactions indexes
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id, created_at DESC)', 'xp_transactions.user+created');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_xp_transactions_type ON xp_transactions(transaction_type)', 'xp_transactions.type');

  // Donation ranks indexes
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_donation_ranks_order ON donation_ranks(order_index ASC)', 'donation_ranks.order_index');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_donation_ranks_min_amount ON donation_ranks(min_amount ASC)', 'donation_ranks.min_amount');

  // Servers indexes
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_servers_status ON servers(status)', 'servers.status');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_servers_order ON servers(order_index ASC)', 'servers.order_index');

  // Blog posts indexes
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published, created_at DESC)', 'blog_posts.published+created');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id)', 'blog_posts.author_id');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug)', 'blog_posts.slug');

  // Forum categories indexes
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_forum_categories_order ON forum_categories(order_index ASC)', 'forum_categories.order_index');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_forum_categories_slug ON forum_categories(slug)', 'forum_categories.slug');

  // Events indexes
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time ASC)', 'events.start_time');
  await createIndexSafely('CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC)', 'events.created_at');

  console.log('\n✅ Performance indexes created successfully');
}

/**
 * Analyze database performance
 */
export async function analyzeDatabase() {
  console.log('📊 Analyzing database performance...');

  try {
    // Get table sizes
    const tables = await db.all(sql`
      SELECT name, 
             (SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND tbl_name=m.name) as index_count
      FROM sqlite_master m 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);

    console.log('\n📊 Database Tables:');
    for (const table of tables as any[]) {
      console.log(`  ${table.name}: ${table.index_count} indexes`);
    }

    // Get all indexes
    const indexes = await db.all(sql`
      SELECT name, tbl_name, sql 
      FROM sqlite_master 
      WHERE type='index' 
      AND name NOT LIKE 'sqlite_%'
      ORDER BY tbl_name, name
    `);

    console.log('\n📊 Database Indexes:');
    for (const index of indexes as any[]) {
      console.log(`  ${index.name} on ${index.tbl_name}`);
    }

    return { tables, indexes };
  } catch (error) {
    console.error('❌ Error analyzing database:', error);
    return null;
  }
}

/**
 * Drop all custom indexes (for testing/rebuilding)
 */
export async function dropCustomIndexes() {
  console.log('🗑️ Dropping custom indexes...');

  try {
    const indexes = await db.all(sql`
      SELECT name 
      FROM sqlite_master 
      WHERE type='index' 
      AND name LIKE 'idx_%'
    `);

    for (const index of indexes as any[]) {
      await db.run(sql`DROP INDEX IF EXISTS ${sql.identifier(index.name)}`);
      console.log(`  Dropped: ${index.name}`);
    }

    console.log('✅ Custom indexes dropped');
  } catch (error) {
    console.error('❌ Error dropping indexes:', error);
  }
}
