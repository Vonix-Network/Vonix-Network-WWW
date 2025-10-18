import { migrate } from 'drizzle-orm/libsql/migrator';
import { db, client } from './index';
import * as schema from './schema';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Run database migrations
 * This function applies all pending migrations and handles schema upgrades
 */
export async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  try {
    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    
    // Check if any tables exist in the database
    const tablesExist = await checkIfTablesExist();
    
    // Check if migrations folder exists
    if (!fs.existsSync(migrationsFolder) || !fs.existsSync(path.join(migrationsFolder, 'meta', '_journal.json'))) {
      console.log('⚠️  No migration files found. Creating tables directly from schema...');
      await createTablesFromSchema();
    } else if (!tablesExist) {
      // Only run migrations if tables don't exist yet
      console.log('📝 Running migration files...');
      await migrate(db, { migrationsFolder: './drizzle' });
    } else {
      console.log('ℹ️  Database tables already exist. Skipping migrations...');
    }
    
    console.log('✅ Migrations completed successfully');
    
    // Perform additional schema checks and upgrades
    await ensureSchemaUpgrades();
    
    return { success: true };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return { success: false, error };
  }
}

/**
 * Check if database tables already exist
 */
async function checkIfTablesExist(): Promise<boolean> {
  try {
    const tables = await client.execute(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    return tables.rows.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Create tables directly from schema (used when no migrations exist)
 */
async function createTablesFromSchema() {
  try {
    // Create all tables using raw SQL based on the schema
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user' NOT NULL,
        minecraft_username TEXT UNIQUE,
        minecraft_uuid TEXT UNIQUE,
        avatar TEXT,
        bio TEXT,
        donation_rank_id TEXT,
        total_donated REAL DEFAULT 0,
        created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
        updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS registration_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        minecraft_username TEXT NOT NULL,
        minecraft_uuid TEXT NOT NULL,
        used INTEGER DEFAULT 0 NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
        used_at INTEGER
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS servers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        ip_address TEXT NOT NULL,
        port INTEGER DEFAULT 25565 NOT NULL,
        modpack_name TEXT,
        bluemap_url TEXT,
        curseforge_url TEXT,
        status TEXT DEFAULT 'offline' NOT NULL,
        players_online INTEGER DEFAULT 0 NOT NULL,
        players_max INTEGER DEFAULT 0 NOT NULL,
        version TEXT,
        order_index INTEGER DEFAULT 0 NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
        updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        excerpt TEXT,
        content TEXT NOT NULL,
        author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        published INTEGER DEFAULT 0 NOT NULL,
        featured_image TEXT,
        created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
        updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS forum_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        slug TEXT UNIQUE NOT NULL,
        icon TEXT,
        order_index INTEGER DEFAULT 0 NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()) NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS forum_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        pinned INTEGER DEFAULT 0 NOT NULL,
        locked INTEGER DEFAULT 0 NOT NULL,
        views INTEGER DEFAULT 0 NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
        updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS forum_replies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
        author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
        updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS social_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        image_url TEXT,
        created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
        updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS social_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()) NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS social_likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id INTEGER NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
        created_at INTEGER DEFAULT (unixepoch()) NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS friendships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'pending' NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
        updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS private_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        read INTEGER DEFAULT 0 NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()) NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS donations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        minecraft_username TEXT,
        minecraft_uuid TEXT,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'USD' NOT NULL,
        method TEXT,
        message TEXT,
        displayed INTEGER DEFAULT 1 NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()) NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS donation_ranks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        min_amount REAL NOT NULL,
        color TEXT NOT NULL,
        text_color TEXT NOT NULL,
        icon TEXT,
        badge TEXT,
        glow INTEGER DEFAULT 0 NOT NULL,
        duration INTEGER DEFAULT 30 NOT NULL,
        subtitle TEXT,
        created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
        updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_message_id TEXT UNIQUE,
        server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE,
        author_name TEXT NOT NULL,
        author_avatar TEXT,
        content TEXT,
        embeds TEXT,
        attachments TEXT,
        timestamp INTEGER DEFAULT (unixepoch()) NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS stories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        image_url TEXT,
        background_color TEXT DEFAULT '#000000' NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()) NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS story_views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        viewed_at INTEGER DEFAULT (unixepoch()) NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        cover_image TEXT,
        creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        privacy TEXT DEFAULT 'public' NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()) NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS group_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'member' NOT NULL,
        joined_at INTEGER DEFAULT (unixepoch()) NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        location TEXT,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        cover_image TEXT,
        created_at INTEGER DEFAULT (unixepoch()) NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS event_attendees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'going' NOT NULL,
        responded_at INTEGER DEFAULT (unixepoch()) NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        link TEXT,
        read INTEGER DEFAULT 0 NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()) NOT NULL
      );
    `);

    // Create indexes
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_private_messages_sender ON private_messages(sender_id);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_private_messages_recipient ON private_messages(recipient_id);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_private_messages_created_at ON private_messages(created_at);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_posts_user_id ON social_posts(user_id);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_posts_created_at ON social_posts(created_at DESC);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_comments_post_id ON social_comments(post_id);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_comments_user_id ON social_comments(user_id);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_likes_post_id ON social_likes(post_id);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_likes_user_id ON social_likes(user_id);`);

    console.log('✅ Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

/**
 * Ensure schema upgrades for existing databases
 * This mimics the original SQLite approach of adding missing columns/tables
 */
async function ensureSchemaUpgrades() {
  console.log('🔍 Checking for schema upgrades...');
  
  try {
    // Get all tables
    const tables = await client.execute(`
      SELECT name FROM sqlite_master WHERE type='table'
    `);
    
    const tableNames = tables.rows.map((row: any) => row.name);
    
    // Check if essential tables exist
    const requiredTables = [
      'users',
      'settings',
      'registration_codes',
      'servers',
      'blog_posts',
      'forum_categories',
      'forum_posts',
      'forum_replies',
      'social_posts',
      'social_comments',
      'social_likes',
      'friendships',
      'private_messages',
      'donations',
      'donation_ranks',
      'api_keys',
    ];
    
    for (const tableName of requiredTables) {
      if (!tableNames.includes(tableName)) {
        console.log(`📝 Creating missing table: ${tableName}`);
        // Special handling for api_keys table
        if (tableName === 'api_keys') {
          await client.execute(`
            CREATE TABLE IF NOT EXISTS api_keys (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL UNIQUE,
              key TEXT NOT NULL,
              created_at INTEGER NOT NULL DEFAULT (unixepoch()),
              updated_at INTEGER NOT NULL DEFAULT (unixepoch())
            )
          `);
          console.log('✅ api_keys table created');
        }
      }
    }
    
    // Check for missing columns in existing tables
    await addMissingColumns();
    
    console.log('✅ Schema upgrades completed');
  } catch (error) {
    console.error('⚠️ Schema upgrade check failed:', error);
    // Don't throw - allow the app to continue
  }
}

/**
 * Add missing columns to existing tables
 * This ensures backward compatibility with existing databases
 */
async function addMissingColumns() {
  const columnChecks = [
    {
      table: 'users',
      columns: [
        { name: 'bio', type: 'TEXT', default: null },
        { name: 'avatar', type: 'TEXT', default: null },
        { name: 'donation_rank_id', type: 'TEXT', default: null },
        { name: 'total_donated', type: 'REAL', default: 0 },
      ],
    },
    {
      table: 'servers',
      columns: [
        { name: 'bluemap_url', type: 'TEXT', default: null },
        { name: 'curseforge_url', type: 'TEXT', default: null },
      ],
    },
    {
      table: 'forum_posts',
      columns: [
        { name: 'pinned', type: 'INTEGER', default: 0 },
        { name: 'locked', type: 'INTEGER', default: 0 },
      ],
    },
  ];
  
  for (const check of columnChecks) {
    try {
      // Get existing columns
      const result = await client.execute(`PRAGMA table_info(${check.table})`);
      const existingColumns = result.rows.map((row: any) => row.name);
      
      // Add missing columns
      for (const column of check.columns) {
        if (!existingColumns.includes(column.name)) {
          console.log(`  📝 Adding column ${check.table}.${column.name}`);
          
          const defaultValue = column.default !== null ? `DEFAULT ${column.default}` : '';
          await client.execute(
            `ALTER TABLE ${check.table} ADD COLUMN ${column.name} ${column.type} ${defaultValue}`
          );
        }
      }
    } catch (error) {
      console.log(`  ⚠️ Could not check/add columns for ${check.table}:`, error);
      // Continue with other tables
    }
  }
}

/**
 * Initialize the database with default data
 */
export async function initializeDefaultData() {
  console.log('🔄 Initializing default data...');
  
  try {
    // Check if we already have data
    const existingSettings = await db.query.settings.findFirst();
    
    if (existingSettings) {
      console.log('ℹ️ Database already initialized');
      return;
    }
    
    // Insert default settings
    await db.insert(schema.settings).values([
      { key: 'site_name', value: 'Vonix Network' },
      { key: 'site_description', value: 'A Minecraft Community Platform' },
      { key: 'setup_completed', value: 'false' },
      { key: 'discord_enabled', value: 'false' },
      { key: 'forum_enabled', value: 'true' },
      { key: 'social_enabled', value: 'true' },
      { key: 'donations_enabled', value: 'true' },
    ]);
    
    // Insert default forum categories
    await db.insert(schema.forumCategories).values([
      {
        name: 'General Discussion',
        description: 'General topics and community discussion',
        slug: 'general',
        icon: '💬',
        orderIndex: 1,
      },
      {
        name: 'Announcements',
        description: 'Official server announcements and news',
        slug: 'announcements',
        icon: '📢',
        orderIndex: 0,
      },
      {
        name: 'Support',
        description: 'Get help with server-related issues',
        slug: 'support',
        icon: '🛠️',
        orderIndex: 2,
      },
    ]);
    
    // Insert default donation ranks
    await db.insert(schema.donationRanks).values([
      {
        id: 'vip',
        name: 'VIP',
        minAmount: 5.0,
        color: '#FFD700',
        textColor: '#000000',
        badge: '⭐',
        glow: false,
        duration: 30,
        subtitle: 'Support the server!',
      },
      {
        id: 'vip_plus',
        name: 'VIP+',
        minAmount: 15.0,
        color: '#00FF00',
        textColor: '#000000',
        badge: '🌟',
        glow: true,
        duration: 30,
        subtitle: 'Premium benefits!',
      },
      {
        id: 'mvp',
        name: 'MVP',
        minAmount: 30.0,
        color: '#00FFFF',
        textColor: '#000000',
        badge: '💎',
        glow: true,
        duration: 30,
        subtitle: 'Most Valuable Player!',
      },
    ]);
    
    console.log('✅ Default data initialized');
  } catch (error) {
    console.error('❌ Failed to initialize default data:', error);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => initializeDefaultData())
    .then(() => {
      console.log('✅ Database setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database setup failed:', error);
      process.exit(1);
    });
}
