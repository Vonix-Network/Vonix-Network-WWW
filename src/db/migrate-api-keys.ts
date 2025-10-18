import { db } from './index';
import { sql } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export async function migrateApiKeys() {
  try {
    console.log('Creating api_keys table...');
    
    // Create the api_keys table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        key TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);
    
    console.log('✓ api_keys table created');
    
    // Generate and insert the initial registration API key
    const apiKey = randomBytes(32).toString('base64url');
    
    await db.run(sql`
      INSERT OR IGNORE INTO api_keys (name, key)
      VALUES ('registration', ${apiKey})
    `);
    
    console.log('✓ Registration API key generated');
    console.log('\nMigration completed successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateApiKeys()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
