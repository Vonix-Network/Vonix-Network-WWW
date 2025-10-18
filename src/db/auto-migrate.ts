import { db } from './index';
import { sql } from 'drizzle-orm';

// Cache to prevent multiple migrations
let migrationChecked = false;
let migrationPromise: Promise<void> | null = null;

/**
 * Automatic database migration on app start
 * Only runs migrations when needed by checking existing schema
 */
export async function autoMigrate() {
  // Return existing promise if migration is already running
  if (migrationPromise) {
    return migrationPromise;
  }

  // Return immediately if already checked
  if (migrationChecked) {
    return;
  }

  // Create and cache the migration promise
  migrationPromise = performMigration();
  return migrationPromise;
}

async function performMigration() {
  console.log('🔄 Checking database schema...');

  try {
    // Check if migrations are needed by querying table info
    const checkColumn = async (table: string, column: string): Promise<boolean> => {
      try {
        const result = await db.all(sql`PRAGMA table_info(${sql.raw(table)})`);
        return (result as any[]).some((col: any) => col.name === column);
      } catch {
        return false;
      }
    };

    const checkTable = async (table: string): Promise<boolean> => {
      try {
        await db.all(sql`SELECT 1 FROM ${sql.raw(table)} LIMIT 1`);
        return true;
      } catch {
        return false;
      }
    };

    let migrationsRun = 0;

    // Add createdAt to chat_messages if missing
    if (await checkTable('chat_messages') && !(await checkColumn('chat_messages', 'created_at'))) {
      try {
        await db.run(sql`ALTER TABLE chat_messages ADD COLUMN created_at INTEGER NOT NULL DEFAULT (unixepoch())`);
        console.log('✅ Added created_at to chat_messages');
        migrationsRun++;
      } catch (error: any) {
        console.log('⚠️  Could not add created_at to chat_messages:', error.message);
      }
    }

    // Create forum_votes if missing
    if (!(await checkTable('forum_votes'))) {
      try {
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
        console.log('✅ Created forum_votes table');
        migrationsRun++;
      } catch (error: any) {
        console.log('⚠️  Could not create forum_votes:', error.message);
      }
    }

    // Create user_engagement if missing
    if (!(await checkTable('user_engagement'))) {
      try {
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
        console.log('✅ Created user_engagement table');
        migrationsRun++;
      } catch (error: any) {
        console.log('⚠️  Could not create user_engagement:', error.message);
      }
    }

    // Add donation columns to users if missing
    if (await checkTable('users') && !(await checkColumn('users', 'donation_rank_id'))) {
      try {
        await db.run(sql`ALTER TABLE users ADD COLUMN donation_rank_id TEXT`);
        console.log('✅ Added donation_rank_id to users');
        migrationsRun++;
      } catch (error: any) {
        console.log('⚠️  Could not add donation_rank_id:', error.message);
      }
    }

    if (await checkTable('users') && !(await checkColumn('users', 'total_donated'))) {
      try {
        await db.run(sql`ALTER TABLE users ADD COLUMN total_donated REAL DEFAULT 0`);
        console.log('✅ Added total_donated to users');
        migrationsRun++;
      } catch (error: any) {
        console.log('⚠️  Could not add total_donated:', error.message);
      }
    }

    // Create site_settings table if missing
    if (!(await checkTable('site_settings'))) {
      try {
        await db.run(sql`
          CREATE TABLE IF NOT EXISTS site_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT NOT NULL UNIQUE,
            value TEXT,
            created_at INTEGER NOT NULL DEFAULT (unixepoch()),
            updated_at INTEGER NOT NULL DEFAULT (unixepoch())
          )
        `);
        console.log('✅ Created site_settings table');
        migrationsRun++;
      } catch (error: any) {
        console.log('⚠️  Could not create site_settings:', error.message);
      }
    }

    if (migrationsRun === 0) {
      console.log('✅ Database schema is up to date');
    } else {
      console.log(`✅ Completed ${migrationsRun} migration(s)`);
    }

    // Mark migration as completed
    migrationChecked = true;
  } catch (error) {
    console.error('❌ Migration error:', error);
    // Don't throw - allow app to start even if migrations fail
    migrationChecked = true; // Mark as completed even on error to prevent retries
  }
}
