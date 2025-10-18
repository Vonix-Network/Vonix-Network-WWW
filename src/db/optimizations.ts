import { db } from './index';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';

// Database optimization utilities
export class DatabaseOptimizer {
  
  // Create performance indexes
  static async createPerformanceIndexes(): Promise<void> {
    logger.info('Creating performance indexes...');
    
    try {
      // User-related indexes
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_users_minecraft_uuid ON users(minecraft_uuid)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_users_minecraft_username ON users(minecraft_username)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_users_donation_rank ON users(donation_rank_id)`);

      // Social posts indexes
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON social_posts(user_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON social_posts(created_at DESC)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_social_posts_user_created ON social_posts(user_id, created_at DESC)`);

      // Social comments indexes
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_social_comments_post_id ON social_comments(post_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_social_comments_user_id ON social_comments(user_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_social_comments_parent ON social_comments(parent_comment_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_social_comments_created ON social_comments(created_at DESC)`);

      // Social likes indexes
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_social_likes_post_user ON social_likes(post_id, user_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_social_likes_user ON social_likes(user_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_social_comment_likes_comment_user ON social_comment_likes(comment_id, user_id)`);

      // Forum indexes
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON forum_posts(category_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON forum_posts(author_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON forum_posts(created_at DESC)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_forum_posts_pinned ON forum_posts(pinned, created_at DESC)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_forum_posts_views ON forum_posts(views DESC)`);

      // Forum replies indexes
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_forum_replies_post ON forum_replies(post_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_forum_replies_author ON forum_replies(author_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_forum_replies_created ON forum_replies(created_at DESC)`);

      // Forum votes indexes
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_forum_votes_post_user ON forum_votes(post_id, user_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_forum_votes_reply_user ON forum_votes(reply_id, user_id)`);

      // Server indexes
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_servers_status ON servers(status)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_servers_order ON servers(order_index)`);

      // Donations indexes
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_donations_user ON donations(user_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_donations_created ON donations(created_at DESC)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_donations_amount ON donations(amount DESC)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_donations_displayed ON donations(displayed, created_at DESC)`);

      // Chat messages indexes
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp DESC)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_discord_id ON chat_messages(discord_message_id)`);

      // Friendships indexes
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status)`);

      // Private messages indexes
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_private_messages_sender ON private_messages(sender_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_private_messages_recipient ON private_messages(recipient_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_private_messages_read ON private_messages(read)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_private_messages_created ON private_messages(created_at DESC)`);

      // User engagement indexes
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_user_engagement_points ON user_engagement(total_points DESC)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_user_engagement_posts ON user_engagement(posts_created DESC)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_user_engagement_upvotes ON user_engagement(upvotes_received DESC)`);

      // Notifications indexes
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)`);

      // Events indexes
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_events_creator ON events(creator_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC)`);

      // Event attendees indexes
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON event_attendees(event_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_event_attendees_user ON event_attendees(user_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_event_attendees_status ON event_attendees(status)`);

      // Stories indexes
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_stories_user ON stories(user_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_stories_expires ON stories(expires_at)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_stories_created ON stories(created_at DESC)`);

      // Story views indexes
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_story_views_story ON story_views(story_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_story_views_user ON story_views(user_id)`);

      // Groups indexes
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_groups_creator ON groups(creator_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_groups_privacy ON groups(privacy)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_groups_created ON groups(created_at DESC)`);

      // Group members indexes
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id)`);
      await db.run(sql`CREATE INDEX IF NOT EXISTS idx_group_members_role ON group_members(role)`);

      logger.info('✅ Performance indexes created successfully');
    } catch (error) {
      logger.error('Failed to create performance indexes', error as Error);
      throw error;
    }
  }

  // Analyze query performance
  static async analyzeQuery(query: string): Promise<any> {
    try {
      const result = await db.run(sql`EXPLAIN QUERY PLAN ${sql.raw(query)}`);
      return result;
    } catch (error) {
      logger.error('Query analysis failed', error as Error, { query });
      throw error;
    }
  }

  // Get database statistics
  static async getDatabaseStats(): Promise<any> {
    try {
      const stats = await db.run(sql`
        SELECT 
          name as table_name,
          (SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND tbl_name=m.name) as index_count
        FROM sqlite_master m 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);

      // Get table sizes
      const tableSizes = await db.run(sql`
        SELECT 
          name,
          (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%') as row_count
        FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);

      return {
        tables: stats,
        sizes: tableSizes,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to get database stats', error as Error);
      throw error;
    }
  }

  // Vacuum database (maintenance)
  static async vacuumDatabase(): Promise<void> {
    logger.info('Starting database vacuum...');
    
    try {
      await db.run(sql`VACUUM`);
      logger.info('✅ Database vacuum completed');
    } catch (error) {
      logger.error('Database vacuum failed', error as Error);
      throw error;
    }
  }

  // Analyze database (update statistics)
  static async analyzeDatabase(): Promise<void> {
    logger.info('Starting database analysis...');
    
    try {
      await db.run(sql`ANALYZE`);
      logger.info('✅ Database analysis completed');
    } catch (error) {
      logger.error('Database analysis failed', error as Error);
      throw error;
    }
  }

  // Clean up old data
  static async cleanupOldData(): Promise<void> {
    logger.info('Starting data cleanup...');
    
    try {
      const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
      const sevenDaysAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);

      // Clean up expired stories
      const expiredStories = await db.run(sql`
        DELETE FROM stories 
        WHERE expires_at < ${Date.now()}
      `);

      // Clean up old chat messages (keep last 1000)
      await db.run(sql`
        DELETE FROM chat_messages 
        WHERE id NOT IN (
          SELECT id FROM chat_messages 
          ORDER BY timestamp DESC 
          LIMIT 1000
        )
      `);

      // Clean up old notifications (older than 30 days)
      const oldNotifications = await db.run(sql`
        DELETE FROM notifications 
        WHERE created_at < ${thirtyDaysAgo}
      `);

      // Clean up old story views (older than 7 days)
      const oldStoryViews = await db.run(sql`
        DELETE FROM story_views 
        WHERE viewed_at < ${sevenDaysAgo}
      `);

      logger.info('✅ Data cleanup completed');
    } catch (error) {
      logger.error('Data cleanup failed', error as Error);
      throw error;
    }
  }

  // Get optimized leaderboard (without caching)
  static async getOptimizedLeaderboard(limit: number = 50): Promise<any[]> {
    return await db.all(sql`
      SELECT 
        u.id,
        u.username,
        u.avatar,
        u.donation_rank_id,
        ue.total_points,
        ue.posts_created,
        ue.comments_created,
        ue.upvotes_received,
        dr.name as rank_name,
        dr.color as rank_color
      FROM user_engagement ue
      JOIN users u ON ue.user_id = u.id
      LEFT JOIN donation_ranks dr ON u.donation_rank_id = dr.id
      ORDER BY ue.total_points DESC
      LIMIT ${limit}
    `);
  }

  // Get popular content (without caching)
  static async getPopularContent(type: 'posts' | 'forum', limit: number = 20): Promise<any[]> {
    if (type === 'posts') {
      return await db.all(sql`
        SELECT 
          sp.id,
          sp.content,
          sp.image_url,
          sp.created_at,
          u.username,
          u.avatar,
          COUNT(sl.id) as like_count,
          COUNT(sc.id) as comment_count
        FROM social_posts sp
        JOIN users u ON sp.user_id = u.id
        LEFT JOIN social_likes sl ON sp.id = sl.post_id
        LEFT JOIN social_comments sc ON sp.id = sc.post_id
        WHERE sp.created_at > ${Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000)}
        GROUP BY sp.id
        ORDER BY (COUNT(sl.id) * 2 + COUNT(sc.id)) DESC
        LIMIT ${limit}
      `);
    } else {
      return await db.all(sql`
        SELECT 
          fp.id,
          fp.title,
          fp.views,
          fp.created_at,
          u.username,
          u.avatar,
          fc.name as category_name,
          COUNT(fr.id) as reply_count
        FROM forum_posts fp
        JOIN users u ON fp.author_id = u.id
        JOIN forum_categories fc ON fp.category_id = fc.id
        LEFT JOIN forum_replies fr ON fp.id = fr.post_id
        WHERE fp.created_at > ${Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000)}
        GROUP BY fp.id
        ORDER BY (fp.views + COUNT(fr.id) * 5) DESC
        LIMIT ${limit}
      `);
    }
  }

  // Connection pool monitoring
  static async monitorConnections(): Promise<any> {
    try {
      // This would be implemented based on your database driver's capabilities
      // For Turso/LibSQL, we can monitor through custom metrics
      
      const connectionStats = {
        activeConnections: 1, // Turso uses HTTP connections
        maxConnections: 1000, // Turso's limit
        timestamp: Date.now(),
        healthy: true,
      };

      await logger.recordMetric('db.connections.active', connectionStats.activeConnections);
      
      return connectionStats;
    } catch (error) {
      logger.error('Connection monitoring failed', error as Error);
      return {
        activeConnections: 0,
        maxConnections: 0,
        timestamp: Date.now(),
        healthy: false,
        error: (error as Error).message,
      };
    }
  }

  // Performance monitoring (simplified without Redis)
  static async monitorPerformance(): Promise<void> {
    try {
      // Monitor database size
      const stats = await this.getDatabaseStats();
      const totalRows = stats.sizes.reduce((sum: number, table: any) => sum + table.row_count, 0);
      
      logger.recordMetric('db.total_rows', totalRows);
      logger.recordMetric('db.table_count', stats.tables.length);

      logger.debug('Database performance monitored', {
        totalRows,
        tableCount: stats.tables.length,
      });
    } catch (error) {
      logger.error('Performance monitoring failed', error as Error);
    }
  }
}

// Query wrapper for performance monitoring (simplified without Redis)
export class QueryMonitor {
  static async executeWithMonitoring<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    slowThreshold: number = 1000
  ): Promise<T> {
    const start = Date.now();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - start;
      
      // Record metrics
      logger.recordMetric(`db.query.${queryName}.duration`, duration);
      logger.recordMetric(`db.query.${queryName}.success`, 1);
      
      // Log slow queries
      if (duration > slowThreshold) {
        logger.warn('Slow query detected', {
          queryName,
          duration: `${duration}ms`,
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      logger.recordMetric(`db.query.${queryName}.duration`, duration);
      logger.recordMetric(`db.query.${queryName}.error`, 1);
      
      logger.error(`Query failed: ${queryName}`, error as Error, {
        duration: `${duration}ms`,
      });
      
      throw error;
    }
  }
}

// Scheduled maintenance tasks
export class DatabaseMaintenance {
  // Run daily maintenance
  static async runDailyMaintenance(): Promise<void> {
    logger.info('Starting daily database maintenance...');
    
    try {
      await DatabaseOptimizer.cleanupOldData();
      await DatabaseOptimizer.analyzeDatabase();
      await DatabaseOptimizer.monitorPerformance();
      
      logger.info('✅ Daily maintenance completed');
    } catch (error) {
      logger.error('Daily maintenance failed', error as Error);
      throw error;
    }
  }

  // Run weekly maintenance
  static async runWeeklyMaintenance(): Promise<void> {
    logger.info('Starting weekly database maintenance...');
    
    try {
      await DatabaseOptimizer.vacuumDatabase();
      await DatabaseOptimizer.createPerformanceIndexes(); // Ensure all indexes exist
      
      // Generate performance report
      const stats = await DatabaseOptimizer.getDatabaseStats();
      logger.info('Weekly database report', stats);
      
      logger.info('✅ Weekly maintenance completed');
    } catch (error) {
      logger.error('Weekly maintenance failed', error as Error);
      throw error;
    }
  }
}
