/**
 * Safe Migration: Add Stripe Product Catalog Columns
 * 
 * Adds missing Stripe columns to donation_ranks table.
 * Safe to run multiple times - checks if columns exist first.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST
config({ path: resolve(process.cwd(), '.env') });

import { createClient } from '@libsql/client';
import chalk from 'chalk';

async function migrateStripeColumns() {
  console.log(chalk.blue('\n🔧 Migrating Stripe Product Catalog Columns...\n'));

  try {
    // Get database configuration from environment
    const databaseUrl = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;
    const authToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL or TURSO_DATABASE_URL must be set in .env file');
    }

    console.log(chalk.cyan('📡 Connecting to database...'));
    console.log(chalk.gray(`   URL: ${databaseUrl.substring(0, 30)}...`));

    // Determine if remote or local
    const isRemote = databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('https://');

    // Create client
    const client = createClient(
      isRemote
        ? {
            url: databaseUrl,
            authToken: authToken || '',
          }
        : {
            url: databaseUrl,
          }
    );

    // Test connection
    await client.execute('SELECT 1');
    console.log(chalk.green('✓ Database connected\n'));

    // Check if donation_ranks table exists
    console.log(chalk.cyan('🔍 Checking donation_ranks table...'));
    const tableCheck = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='donation_ranks'"
    );

    if (tableCheck.rows.length === 0) {
      console.log(chalk.yellow('⚠ donation_ranks table does not exist yet'));
      console.log(chalk.gray('  → Table will be created when app starts'));
      console.log(chalk.gray('  → Run this migration again after first app start\n'));
      process.exit(0);
    }

    console.log(chalk.green('✓ donation_ranks table exists\n'));

    // Get current columns
    console.log(chalk.cyan('📋 Checking existing columns...'));
    const tableInfo = await client.execute('PRAGMA table_info(donation_ranks)');
    const existingColumns = tableInfo.rows.map((col: any) => col.name);
    
    console.log(chalk.gray(`   Found ${existingColumns.length} existing columns`));

    // Columns to add
    const columnsToAdd = [
      { name: 'stripe_product_id', sql: 'stripe_product_id TEXT', description: 'Stripe Product ID' },
      { name: 'stripe_price_monthly', sql: 'stripe_price_monthly TEXT', description: '30 days price' },
      { name: 'stripe_price_quarterly', sql: 'stripe_price_quarterly TEXT', description: '90 days price' },
      { name: 'stripe_price_semiannual', sql: 'stripe_price_semiannual TEXT', description: '180 days price' },
      { name: 'stripe_price_yearly', sql: 'stripe_price_yearly TEXT', description: '365 days price' },
    ];

    console.log(chalk.cyan('\n💳 Adding Stripe product catalog columns...\n'));

    let added = 0;
    let skipped = 0;

    for (const column of columnsToAdd) {
      if (existingColumns.includes(column.name)) {
        console.log(chalk.gray(`  ⊘ ${column.name} - already exists`));
        skipped++;
      } else {
        try {
          await client.execute(`ALTER TABLE donation_ranks ADD COLUMN ${column.sql}`);
          console.log(chalk.green(`  ✓ ${column.name} - added (${column.description})`));
          added++;
        } catch (error: any) {
          if (error.message?.includes('duplicate column')) {
            console.log(chalk.gray(`  ⊘ ${column.name} - already exists`));
            skipped++;
          } else {
            throw error;
          }
        }
      }
    }

    // Summary
    console.log(chalk.green.bold('\n✅ Migration Complete!\n'));
    console.log(chalk.white('Summary:'));
    console.log(chalk.gray(`  • ${added} column(s) added`));
    console.log(chalk.gray(`  • ${skipped} column(s) already existed`));
    console.log(chalk.gray(`  • 0 errors\n`));

    if (added > 0) {
      console.log(chalk.cyan('🚀 Next Steps:'));
      console.log(chalk.gray('  1. Restart your development server'));
      console.log(chalk.gray('  2. Try subscribing to a rank'));
      console.log(chalk.gray('  3. Auto-sync will create Stripe products automatically\n'));
    } else {
      console.log(chalk.cyan('ℹ All Stripe columns already exist - no changes needed\n'));
    }

    client.close();
    process.exit(0);
  } catch (error: any) {
    console.error(chalk.red('\n❌ Migration failed:\n'));
    console.error(chalk.red(error.message));
    
    if (error.message?.includes('DATABASE_URL')) {
      console.log(chalk.yellow('\n💡 Tip: Make sure your .env file contains:'));
      console.log(chalk.gray('   DATABASE_URL=libsql://your-database.turso.io'));
      console.log(chalk.gray('   DATABASE_AUTH_TOKEN=your_token'));
      console.log(chalk.gray('   OR'));
      console.log(chalk.gray('   TURSO_DATABASE_URL=libsql://your-database.turso.io'));
      console.log(chalk.gray('   TURSO_AUTH_TOKEN=your_token\n'));
    }
    
    process.exit(1);
  }
}

// Run migration
migrateStripeColumns();
