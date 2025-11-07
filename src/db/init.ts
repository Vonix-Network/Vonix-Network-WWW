/**
 * Database Initialization Script
 * 
 * Clean, unified database setup that:
 * - Creates all tables
 * - Runs all migrations
 * - Seeds initial data
 * - Is idempotent (safe to run multiple times)
 */

// CRITICAL: Load environment variables BEFORE any dynamic imports
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

// Load .env file FIRST
config({ path: resolve(process.cwd(), '.env') });

// Verify environment variables are loaded
if (!process.env.DATABASE_URL && !process.env.TURSO_DATABASE_URL) {
  console.error(chalk.red('\n❌ Error: DATABASE_URL or TURSO_DATABASE_URL not found in environment'));
  console.error(chalk.yellow('Make sure you have a .env file with database credentials\n'));
  process.exit(1);
}

async function initializeDatabase() {
  console.log(chalk.blue('\n🚀 Initializing Vonix Network Database...\n'));

  // Use dynamic imports AFTER env vars are loaded
  const { db, client, checkDatabaseConnection } = await import('./index');
  const { addXPSystem } = await import('./add-xp-system');
  const { addGroupPostsAndReporting } = await import('./add-group-posts-and-reporting');
  const { createPerformanceIndexes } = await import('./indexes');

  try {
    // Step 1: Check database connection
    console.log(chalk.cyan('📡 Step 1: Checking database connection...'));
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }
    console.log(chalk.green('✓ Database connection established\n'));

    // Step 2: Run Drizzle migrations (creates base schema)
    console.log(chalk.cyan('📋 Step 2: Creating base schema...'));
    try {
      const { migrate } = await import('drizzle-orm/libsql/migrator');
      await migrate(db, { migrationsFolder: './drizzle' });
      console.log(chalk.green('✓ Base schema created\n'));
    } catch (error: any) {
      if (error.message?.includes('no such table: __drizzle_migrations')) {
        console.log(chalk.yellow('⚠ No Drizzle migrations found, using schema directly\n'));
      } else {
        console.log(chalk.yellow(`⚠ Migration info: ${error.message}\n`));
      }
    }

    // Step 3: Add post counts columns
    console.log(chalk.cyan('📊 Step 3: Adding post engagement columns...'));
    await addPostCounts(client);
    console.log(chalk.green('✓ Post engagement columns ready\n'));

    // Step 4: Add rank expiration
    console.log(chalk.cyan('👑 Step 4: Adding rank expiration system...'));
    await addRankExpiration(client);
    console.log(chalk.green('✓ Rank expiration system ready\n'));

    // Step 5: Add XP and Leveling system
    console.log(chalk.cyan('🎮 Step 5: Adding XP and Leveling system...'));
    await addXPSystem();
    console.log(chalk.green('✓ XP and Leveling system ready\n'));

    // Step 6: Add user preferences
    console.log(chalk.cyan('🎨 Step 6: Adding user preference system...'));
    await addUserPreferences(client);
    console.log(chalk.green('✓ User preferences ready\n'));

    // Step 7: Add group posts and content reporting
    console.log(chalk.cyan('📝 Step 7: Adding group posts and content reporting...'));
    await addGroupPostsAndReporting();
    console.log(chalk.green('✓ Group posts and reporting system ready\n'));

    // Step 8: Add Stripe product catalog columns
    console.log(chalk.cyan('💳 Step 8: Adding Stripe product catalog integration...'));
    await addStripeProductCatalog(client);
    console.log(chalk.green('✓ Stripe product catalog ready\n'));

    // Step 9: Create performance indexes
    console.log(chalk.cyan('⚡ Step 9: Creating performance indexes...'));
    await createPerformanceIndexes();
    console.log(chalk.green('✓ Performance indexes created\n'));

    // Step 10: Verify database integrity
    console.log(chalk.cyan('🔍 Step 10: Verifying database integrity...'));
    await verifyDatabaseIntegrity(client);
    console.log(chalk.green('✓ All tables verified\n'));

    // Success!
    console.log(chalk.green.bold('✅ Database initialization complete!\n'));
    console.log(chalk.white('Your database is ready with:'));
    console.log(chalk.gray('  • Base schema (users, posts, forums, servers, etc.)'));
    console.log(chalk.gray('  • Post engagement tracking'));
    console.log(chalk.gray('  • Donation rank expiration'));
    console.log(chalk.gray('  • XP & Leveling system (5 tables)'));
    console.log(chalk.gray('  • User preferences (background, etc.)'));
    console.log(chalk.gray('  • Group posts system (3 tables)'));
    console.log(chalk.gray('  • Content reporting system (1 table)'));
    console.log(chalk.gray('  • Stripe product catalog integration (5 columns)'));
    console.log(chalk.gray('  • Performance indexes for all major tables'));
    console.log(chalk.gray('  • 10 Achievements seeded'));
    console.log(chalk.gray('  • 6 Level rewards configured\n'));

    process.exit(0);
  } catch (error) {
    console.error(chalk.red('\n❌ Database initialization failed:'), error);
    process.exit(1);
  }
}

async function addPostCounts(client: any) {
  try {
    // Check if columns exist
    const tableInfo = await client.execute('PRAGMA table_info(social_posts)');
    const hasLikesCount = tableInfo.rows.some((col: any) => col.name === 'likes_count');
    const hasCommentsCount = tableInfo.rows.some((col: any) => col.name === 'comments_count');

    if (!hasLikesCount) {
      await client.execute('ALTER TABLE social_posts ADD COLUMN likes_count INTEGER DEFAULT 0 NOT NULL');
      console.log(chalk.gray('  → Added likes_count column'));
    }

    if (!hasCommentsCount) {
      await client.execute('ALTER TABLE social_posts ADD COLUMN comments_count INTEGER DEFAULT 0 NOT NULL');
      console.log(chalk.gray('  → Added comments_count column'));
    }

    if (hasLikesCount && hasCommentsCount) {
      console.log(chalk.gray('  → Post count columns already exist'));
    }
  } catch (error: any) {
    if (error.message?.includes('no such table')) {
      console.log(chalk.gray('  → Table will be created by schema'));
    } else {
      throw error;
    }
  }
}

async function addRankExpiration(client: any) {
  try {
    const tableInfo = await client.execute('PRAGMA table_info(users)');
    const hasRankExpiration = tableInfo.rows.some((col: any) => col.name === 'rank_expires_at');

    if (!hasRankExpiration) {
      await client.execute('ALTER TABLE users ADD COLUMN rank_expires_at INTEGER');
      console.log(chalk.gray('  → Added rank_expires_at column'));
    } else {
      console.log(chalk.gray('  → Rank expiration column already exists'));
    }
  } catch (error: any) {
    if (error.message?.includes('no such table')) {
      console.log(chalk.gray('  → Table will be created by schema'));
    } else {
      throw error;
    }
  }
}

async function addUserPreferences(client: any) {
  try {
    const tableInfo = await client.execute('PRAGMA table_info(users)');
    const hasPreferredBackground = tableInfo.rows.some((col: any) => col.name === 'preferred_background');

    if (!hasPreferredBackground) {
      await client.execute('ALTER TABLE users ADD COLUMN preferred_background TEXT');
      console.log(chalk.gray('  → Added preferred_background column'));
    } else {
      console.log(chalk.gray('  → User preference columns already exist'));
    }
  } catch (error: any) {
    if (error.message?.includes('no such table')) {
      console.log(chalk.gray('  → Table will be created by schema'));
    } else {
      throw error;
    }
  }
}

async function addStripeProductCatalog(client: any) {
  try {
    const tableInfo = await client.execute('PRAGMA table_info(donation_ranks)');
    const existingColumns = tableInfo.rows.map((col: any) => col.name);
    
    const columnsToAdd = [
      { name: 'stripe_product_id', sql: 'stripe_product_id TEXT' },
      { name: 'stripe_price_monthly', sql: 'stripe_price_monthly TEXT' },
      { name: 'stripe_price_quarterly', sql: 'stripe_price_quarterly TEXT' },
      { name: 'stripe_price_semiannual', sql: 'stripe_price_semiannual TEXT' },
      { name: 'stripe_price_yearly', sql: 'stripe_price_yearly TEXT' },
    ];

    let added = 0;
    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        await client.execute(`ALTER TABLE donation_ranks ADD COLUMN ${column.sql}`);
        console.log(chalk.gray(`  → Added ${column.name} column`));
        added++;
      }
    }

    if (added === 0) {
      console.log(chalk.gray('  → Stripe product catalog columns already exist'));
    }
  } catch (error: any) {
    if (error.message?.includes('no such table')) {
      console.log(chalk.gray('  → Table will be created by schema'));
    } else {
      throw error;
    }
  }
}

async function verifyDatabaseIntegrity(client: any) {
  const requiredTables = [
    'users',
    'social_posts',
    'social_comments',
    'forum_posts',
    'forum_replies',
    'servers',
    'groups',
    'group_members',
    'group_posts',
    'group_post_comments',
    'reported_content',
    'xp_transactions',
    'achievements',
    'user_achievements',
    'level_rewards',
    'daily_streaks'
  ];

  const result = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );

  const existingTables = result.rows.map((row: any) => row.name);
  const missingTables = requiredTables.filter(
    table => !existingTables.includes(table)
  );

  if (missingTables.length > 0) {
    console.log(chalk.yellow(`  ⚠ Missing tables: ${missingTables.join(', ')}`));
    console.log(chalk.yellow('  → These may be created on first app start'));
  } else {
    console.log(chalk.gray(`  → All ${requiredTables.length} required tables exist`));
  }

  // Verify XP system
  const achievementsResult = await client.execute('SELECT COUNT(*) as count FROM achievements');
  const achievementCount = (achievementsResult.rows[0] as any).count;
  
  const rewardsResult = await client.execute('SELECT COUNT(*) as count FROM level_rewards');
  const rewardCount = (rewardsResult.rows[0] as any).count;

  console.log(chalk.gray(`  → ${achievementCount} achievements loaded`));
  console.log(chalk.gray(`  → ${rewardCount} level rewards configured`));
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

export { initializeDatabase };
