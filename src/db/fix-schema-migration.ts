import 'dotenv/config';
import { db } from './index';
import { sql } from 'drizzle-orm';

/**
 * Safe migration to add missing columns to users table
 * Run with: tsx src/db/fix-schema-migration.ts
 */
async function migrateUserSchema() {
  console.log('🔄 Starting safe schema migration...');

  try {
    // Add missing columns one by one if they don't exist
    const columnsToAdd = [
      {
        name: 'square_customer_id',
        sql: 'ALTER TABLE users ADD COLUMN square_customer_id TEXT'
      },
      {
        name: 'donor_rank',
        sql: 'ALTER TABLE users ADD COLUMN donor_rank TEXT'
      },
      {
        name: 'xp',
        sql: 'ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0 NOT NULL'
      },
      {
        name: 'level',
        sql: 'ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1 NOT NULL'
      },
      {
        name: 'title',
        sql: 'ALTER TABLE users ADD COLUMN title TEXT'
      },
    ];

    for (const column of columnsToAdd) {
      try {
        console.log(`Adding column: ${column.name}...`);
        await db.run(sql.raw(column.sql));
        console.log(`✅ Added column: ${column.name}`);
      } catch (error: any) {
        if (error.message.includes('duplicate column name')) {
          console.log(`⏭️  Column ${column.name} already exists, skipping`);
        } else {
          console.error(`❌ Error adding ${column.name}:`, error.message);
        }
      }
    }

    // Create unique index for square_customer_id (allows NULL values)
    try {
      console.log('Creating unique index for square_customer_id...');
      await db.run(sql.raw(
        'CREATE UNIQUE INDEX IF NOT EXISTS users_square_customer_id_unique ON users(square_customer_id) WHERE square_customer_id IS NOT NULL'
      ));
      console.log('✅ Created unique index for square_customer_id');
    } catch (error: any) {
      console.error('❌ Error creating index:', error.message);
    }

    console.log('✅ Schema migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateUserSchema();
