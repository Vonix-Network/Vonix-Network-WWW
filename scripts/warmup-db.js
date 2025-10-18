#!/usr/bin/env node

// Database connection warming script
// Run this before starting the application to warm up connections

const { createClient } = require('@libsql/client');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function warmConnections() {
  console.log('🔥 Warming up database connections...');

  const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  try {
    // Execute lightweight queries to warm up connections
    await Promise.all([
      client.execute('SELECT 1 FROM users LIMIT 1'),
      client.execute('SELECT 1 FROM forum_categories LIMIT 1'),
      client.execute('SELECT 1 FROM social_posts LIMIT 1'),
      client.execute('SELECT 1 FROM forum_posts LIMIT 1'),
      client.execute('SELECT 1 FROM servers LIMIT 1'),
    ]);

    console.log('✅ Database connections warmed up successfully');
    console.log('🚀 Application ready for fast initial loads');
  } catch (error) {
    console.error('❌ Failed to warm up database connections:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

warmConnections();
