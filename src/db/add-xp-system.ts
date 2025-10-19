/**
 * Migration: Add XP and Leveling System
 * 
 * Adds XP, levels, achievements, and rewards system to the database
 */

import { db, client } from './index';

async function addXPSystem() {
  console.log('Starting migration: Add XP and Leveling System...');

  try {
    // Check if columns already exist
    const tableInfo = await client.execute('PRAGMA table_info(users)');
    const hasXP = tableInfo.rows.some((col: any) => col.name === 'xp');
    const hasLevel = tableInfo.rows.some((col: any) => col.name === 'level');
    const hasTitle = tableInfo.rows.some((col: any) => col.name === 'title');

    // Add XP field
    if (!hasXP) {
      await client.execute('ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0 NOT NULL');
      console.log('✓ Added xp column to users');
    } else {
      console.log('⊙ xp column already exists, skipping');
    }

    // Add level field
    if (!hasLevel) {
      await client.execute('ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1 NOT NULL');
      console.log('✓ Added level column to users');
    } else {
      console.log('⊙ level column already exists, skipping');
    }

    // Add title field
    if (!hasTitle) {
      await client.execute('ALTER TABLE users ADD COLUMN title TEXT');
      console.log('✓ Added title column to users');
    } else {
      console.log('⊙ title column already exists, skipping');
    }

    // Create xp_transactions table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS xp_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        source TEXT NOT NULL,
        source_id INTEGER,
        description TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);
    console.log('✓ Created xp_transactions table');

    // Create achievements table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT,
        category TEXT NOT NULL CHECK(category IN ('social', 'forum', 'leveling', 'special')),
        xp_reward INTEGER DEFAULT 0 NOT NULL,
        requirement TEXT NOT NULL,
        hidden INTEGER DEFAULT 0 NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);
    console.log('✓ Created achievements table');

    // Create user_achievements table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
        progress INTEGER DEFAULT 0 NOT NULL,
        completed INTEGER DEFAULT 0 NOT NULL,
        completed_at INTEGER,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);
    console.log('✓ Created user_achievements table');

    // Create level_rewards table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS level_rewards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level INTEGER NOT NULL UNIQUE,
        title TEXT,
        badge TEXT,
        description TEXT,
        reward_type TEXT CHECK(reward_type IN ('title', 'badge', 'feature', 'currency')),
        reward_value TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);
    console.log('✓ Created level_rewards table');

    // Create daily_streaks table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS daily_streaks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        current_streak INTEGER DEFAULT 0 NOT NULL,
        longest_streak INTEGER DEFAULT 0 NOT NULL,
        last_login_date INTEGER,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);
    console.log('✓ Created daily_streaks table');

    // Seed initial achievements
    await seedAchievements();

    // Seed level rewards
    await seedLevelRewards();

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function seedAchievements() {
  console.log('Seeding achievements...');

  const achievementsData = [
    // Social Achievements
    {
      id: 'first_post',
      name: 'First Steps',
      description: 'Create your first post',
      icon: '📝',
      category: 'social',
      xpReward: 50,
      requirement: JSON.stringify({ type: 'count', value: 1 }),
      hidden: false,
    },
    {
      id: 'social_butterfly',
      name: 'Social Butterfly',
      description: 'Create 50 posts',
      icon: '🦋',
      category: 'social',
      xpReward: 200,
      requirement: JSON.stringify({ type: 'count', value: 50 }),
      hidden: false,
    },
    {
      id: 'first_friend',
      name: 'Making Friends',
      description: 'Add your first friend',
      icon: '🤝',
      category: 'social',
      xpReward: 30,
      requirement: JSON.stringify({ type: 'count', value: 1 }),
      hidden: false,
    },
    // Leveling Achievements
    {
      id: 'level_5',
      name: 'Getting Started',
      description: 'Reach level 5',
      icon: '⚡',
      category: 'leveling',
      xpReward: 100,
      requirement: JSON.stringify({ type: 'count', value: 5 }),
      hidden: false,
    },
    {
      id: 'level_10',
      name: 'Rising Star',
      description: 'Reach level 10',
      icon: '🔥',
      category: 'leveling',
      xpReward: 200,
      requirement: JSON.stringify({ type: 'count', value: 10 }),
      hidden: false,
    },
    {
      id: 'level_25',
      name: 'Veteran',
      description: 'Reach level 25',
      icon: '💎',
      category: 'leveling',
      xpReward: 500,
      requirement: JSON.stringify({ type: 'count', value: 25 }),
      hidden: false,
    },
    {
      id: 'level_50',
      name: 'Expert',
      description: 'Reach level 50',
      icon: '⭐',
      category: 'leveling',
      xpReward: 1000,
      requirement: JSON.stringify({ type: 'count', value: 50 }),
      hidden: false,
    },
    {
      id: 'level_100',
      name: 'Legendary',
      description: 'Reach level 100',
      icon: '🌟',
      category: 'leveling',
      xpReward: 5000,
      requirement: JSON.stringify({ type: 'count', value: 100 }),
      hidden: false,
    },
    // Streak Achievements
    {
      id: 'streak_7',
      name: 'Week Warrior',
      description: 'Login for 7 days in a row',
      icon: '🔥',
      category: 'special',
      xpReward: 100,
      requirement: JSON.stringify({ type: 'count', value: 7 }),
      hidden: false,
    },
    {
      id: 'streak_30',
      name: 'Dedicated',
      description: 'Login for 30 days in a row',
      icon: '💪',
      category: 'special',
      xpReward: 500,
      requirement: JSON.stringify({ type: 'count', value: 30 }),
      hidden: false,
    },
  ];

  for (const achievement of achievementsData) {
    try {
      await client.execute({
        sql: 'INSERT OR IGNORE INTO achievements (id, name, description, icon, category, xp_reward, requirement, hidden, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, unixepoch())',
        args: [
          achievement.id,
          achievement.name,
          achievement.description,
          achievement.icon,
          achievement.category,
          achievement.xpReward,
          achievement.requirement,
          achievement.hidden ? 1 : 0
        ]
      });
    } catch (error) {
      console.error(`Error inserting achievement ${achievement.id}:`, error);
    }
  }

  console.log('✓ Seeded achievements');
}

async function seedLevelRewards() {
  console.log('Seeding level rewards...');

  const rewards = [
    { level: 5, title: '⚡ Member', description: 'Welcome to the community!' },
    { level: 10, title: '🔥 Regular', description: 'A familiar face around here' },
    { level: 25, title: '💎 Veteran', description: 'A true veteran of the network' },
    { level: 50, title: '⭐ Expert', description: 'An expert in the community' },
    { level: 75, title: '👑 Master', description: 'A master of the craft' },
    { level: 100, title: '🌟 Legendary', description: 'Legendary status achieved!' },
  ];

  for (const reward of rewards) {
    try {
      await client.execute({
        sql: 'INSERT OR IGNORE INTO level_rewards (level, title, description, reward_type, created_at) VALUES (?, ?, ?, ?, unixepoch())',
        args: [reward.level, reward.title, reward.description, 'title']
      });
    } catch (error) {
      console.error(`Error inserting level reward ${reward.level}:`, error);
    }
  }

  console.log('✓ Seeded level rewards');
}

// Run migration if called directly
if (require.main === module) {
  addXPSystem()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { addXPSystem };
