import { db } from '@/db';
import { readFileSync } from 'fs';
import { join } from 'path';
import { sql } from 'drizzle-orm';

async function runMigration() {
  try {
    const migrationPath = join(process.cwd(), 'src/db/migrations/0001_create_donation_ranks.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('Running migration...');
    await db.run(sql.raw(migrationSQL));
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    process.exit(0);
  }
}

runMigration();
