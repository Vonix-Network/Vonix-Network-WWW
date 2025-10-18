import { db } from './index';

export async function migratePermissions() {
  try {
    console.log('Adding permission columns to forum_categories table...');
    
    // Add permission columns if they don't exist
    await db.run(`
      ALTER TABLE forum_categories 
      ADD COLUMN create_permission TEXT DEFAULT 'user' NOT NULL
    `).catch(() => {
      console.log('create_permission column already exists');
    });

    await db.run(`
      ALTER TABLE forum_categories 
      ADD COLUMN reply_permission TEXT DEFAULT 'user' NOT NULL
    `).catch(() => {
      console.log('reply_permission column already exists');
    });

    await db.run(`
      ALTER TABLE forum_categories 
      ADD COLUMN view_permission TEXT DEFAULT 'user' NOT NULL
    `).catch(() => {
      console.log('view_permission column already exists');
    });

    console.log('Permission columns migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migratePermissions()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
