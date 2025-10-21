/**
 * Multi-Database Migration Runner
 * Runs migrations for the configured database type
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { migrate as migrateLibsql } from 'drizzle-orm/libsql/migrator';
import { migrate as migratePostgres } from 'drizzle-orm/postgres-js/migrator';
import { migrate as migrateMysql } from 'drizzle-orm/mysql2/migrator';
import { getDatabaseConfig, validateDatabaseConfig } from './config';
import { createDatabaseClient } from './adapter';

config({ path: resolve(process.cwd(), '.env') });

async function runMigrations() {
  console.log('Starting database migrations...');

  try {
    // Get database configuration
    const dbConfig = getDatabaseConfig();
    validateDatabaseConfig(dbConfig);

    console.log(`Database type: ${dbConfig.type}`);

    // Create database client
    const db = await createDatabaseClient(dbConfig);

    // Determine migration folder based on database type
    let migrationFolder: string;

    switch (dbConfig.type) {
      case 'turso':
        migrationFolder = './drizzle';
        await migrateLibsql(db as any, { migrationsFolder: migrationFolder });
        break;

      case 'postgres':
        migrationFolder = './drizzle/postgres';
        await migratePostgres(db as any, { migrationsFolder: migrationFolder });
        break;

      case 'mysql':
      case 'mariadb':
        migrationFolder = './drizzle/mysql';
        await migrateMysql(db as any, { migrationsFolder: migrationFolder });
        break;

      default:
        throw new Error(`Unsupported database type: ${dbConfig.type}`);
    }

    console.log('✓ Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
