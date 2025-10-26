/**
 * Migration: Add Group Posts and Content Reporting Tables
 */

import { db, client } from './index';
import chalk from 'chalk';

export async function addGroupPostsAndReporting() {
  console.log(chalk.cyan('Starting migration: Add Group Posts and Content Reporting...'));

  try {
    // Create group_posts table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS group_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT,
        likes_count INTEGER DEFAULT 0 NOT NULL,
        comments_count INTEGER DEFAULT 0 NOT NULL,
        pinned INTEGER DEFAULT 0 NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log(chalk.green('✓ Created group_posts table'));

    // Create group_post_comments table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS group_post_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        likes_count INTEGER DEFAULT 0 NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
        FOREIGN KEY (post_id) REFERENCES group_posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log(chalk.green('✓ Created group_post_comments table'));

    // Create group_post_likes table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS group_post_likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES group_posts(id) ON DELETE CASCADE
      )
    `);
    console.log(chalk.green('✓ Created group_post_likes table'));

    // Create reported_content table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS reported_content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_type TEXT NOT NULL CHECK(content_type IN ('social_post', 'forum_post', 'forum_reply', 'group_post', 'group_comment', 'social_comment')),
        content_id INTEGER NOT NULL,
        reporter_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending' NOT NULL CHECK(status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
        reviewed_by INTEGER,
        reviewed_at INTEGER,
        review_notes TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log(chalk.green('✓ Created reported_content table'));

    console.log(chalk.green('✅ Migration completed successfully!'));
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log(chalk.yellow('⊙ Tables already exist, skipping'));
    } else {
      console.error(chalk.red('❌ Migration failed:'), error);
      throw error;
    }
  }
}

// Run if called directly
if (require.main === module) {
  addGroupPostsAndReporting()
    .then(() => {
      console.log(chalk.green('\n✅ Done!'));
      process.exit(0);
    })
    .catch((error) => {
      console.error(chalk.red('\n❌ Error:'), error);
      process.exit(1);
    });
}
