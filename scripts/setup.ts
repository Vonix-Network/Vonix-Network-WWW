#!/usr/bin/env tsx
/**
 * First-time setup script for Vonix Network
 * This script initializes the database, creates the admin account, and generates API keys
 */

// Load environment variables FIRST before any other imports
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file from project root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Now import modules that depend on environment variables
import * as readline from 'readline';
import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db, checkDatabaseConnection } from '../src/db';
import { runMigrations, initializeDefaultData } from '../src/db/migrate';
import * as schema from '../src/db/schema';
import * as fs from 'fs';
import { eq } from 'drizzle-orm';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  console.log('\n🎮 Vonix Network - First-Time Setup\n');
  console.log('═══════════════════════════════════════════════════════\n');

  // Step 1: Check environment variables
  console.log('📋 Step 1: Checking environment configuration...\n');
  
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error('❌ Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env file');
    console.log('\n📝 Please create a .env file with your Turso credentials:');
    console.log('   TURSO_DATABASE_URL=libsql://your-database.turso.io');
    console.log('   TURSO_AUTH_TOKEN=your_auth_token\n');
    process.exit(1);
  }

  // Step 2: Check database connection
  console.log('🔌 Step 2: Checking database connection...\n');
  
  const connected = await checkDatabaseConnection();
  if (!connected) {
    console.error('❌ Error: Could not connect to database');
    console.log('   Please check your TURSO_DATABASE_URL and TURSO_AUTH_TOKEN\n');
    process.exit(1);
  }
  console.log('✅ Database connection successful\n');

  // Step 3: Run migrations
  console.log('🔄 Step 3: Running database migrations...\n');
  
  const migrationResult = await runMigrations();
  if (!migrationResult.success) {
    console.error('❌ Error: Database migration failed');
    process.exit(1);
  }

  // Step 4: Initialize default data
  console.log('\n📝 Step 4: Initializing default data...\n');
  await initializeDefaultData();

  // Step 5: Check if setup is already completed
  const setupSetting = await db.query.settings.findFirst({
    where: (settings, { eq }) => eq(settings.key, 'setup_completed'),
  });

  if (setupSetting?.value === 'true') {
    const restart = await question('\n⚠️  Setup has already been completed. Do you want to run setup again? (yes/no): ');
    if (restart.toLowerCase() !== 'yes') {
      console.log('\n✅ Setup cancelled. Your existing configuration is preserved.\n');
      rl.close();
      process.exit(0);
    }
  }

  // Step 6: Create admin account
  console.log('\n👤 Step 5: Creating administrator account\n');
  console.log('═══════════════════════════════════════════════════════\n');

  const adminUsername = await question('Admin username: ');
  const adminEmail = await question('Admin email (optional, press Enter to skip): ');
  
  let adminPassword: string = '';
  let adminPasswordConfirm: string = '';
  
  do {
    adminPassword = await question('Admin password (min 8 characters): ');
    if (adminPassword.length < 8) {
      console.log('❌ Password must be at least 8 characters long\n');
      continue;
    }
    adminPasswordConfirm = await question('Confirm password: ');
    if (adminPassword !== adminPasswordConfirm) {
      console.log('❌ Passwords do not match. Please try again.\n');
    }
  } while (adminPassword !== adminPasswordConfirm || adminPassword.length < 8);

  // Hash password
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Check if admin user already exists
  const existingAdmin = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.username, adminUsername),
  });

  if (existingAdmin) {
    // Update existing admin
    await db.update(schema.users)
      .set({
        password: hashedPassword,
        email: adminEmail || null,
        role: 'admin',
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, existingAdmin.id));
    console.log('\n✅ Admin account updated successfully');
  } else {
    // Create new admin
    await db.insert(schema.users).values({
      username: adminUsername,
      email: adminEmail || null,
      password: hashedPassword,
      role: 'admin',
    });
    console.log('\n✅ Admin account created successfully');
  }

  // Step 7: Generate API keys
  console.log('\n🔑 Step 6: Generating API keys...\n');
  
  const registrationApiKey = crypto.randomBytes(32).toString('base64url');
  
  // Store API key in api_keys table (new system)
  const existingApiKey = await db.query.apiKeys?.findFirst({
    where: (apiKeys, { eq }) => eq(apiKeys.name, 'registration'),
  });

  if (existingApiKey) {
    await db.update(schema.apiKeys)
      .set({ key: registrationApiKey, updatedAt: new Date() })
      .where(eq(schema.apiKeys.name, 'registration'));
    console.log('✅ Registration API Key updated');
  } else {
    await db.insert(schema.apiKeys).values({
      name: 'registration',
      key: registrationApiKey,
    });
    console.log('✅ Registration API Key created');
  }

  console.log(`\n   Key: ${registrationApiKey}\n`);
  console.log('   ⚠️  Save this key! You will need it for the Minecraft plugin configuration.\n');
  console.log('   💡 You can regenerate this key anytime from the Admin → API Keys page.\n');

  // Step 8: Configure NEXTAUTH_SECRET
  console.log('🔐 Step 7: Configuring NextAuth secret...\n');
  
  let nextAuthSecret = process.env.NEXTAUTH_SECRET;
  if (!nextAuthSecret) {
    nextAuthSecret = crypto.randomBytes(32).toString('base64');
    console.log('✅ Generated NEXTAUTH_SECRET (add this to your .env file):\n');
    console.log(`   NEXTAUTH_SECRET=${nextAuthSecret}\n`);
    
    // Update .env file
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('NEXTAUTH_SECRET=')) {
        envContent = envContent.replace(/NEXTAUTH_SECRET=.*/, `NEXTAUTH_SECRET=${nextAuthSecret}`);
      } else {
        envContent += `\nNEXTAUTH_SECRET=${nextAuthSecret}\n`;
      }
      fs.writeFileSync(envPath, envContent);
      console.log('   📝 .env file updated with NEXTAUTH_SECRET\n');
    }
  }

  // Step 9: Mark setup as completed
  const setupCompletedSetting = await db.query.settings.findFirst({
    where: (settings, { eq }) => eq(settings.key, 'setup_completed'),
  });

  if (setupCompletedSetting) {
    await db.update(schema.settings)
      .set({ value: 'true', updatedAt: new Date() })
      .where(eq(schema.settings.key, 'setup_completed'));
  } else {
    await db.insert(schema.settings).values({
      key: 'setup_completed',
      value: 'true',
    });
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('✨ Setup completed successfully!\n');
  console.log('📋 Summary:\n');
  console.log(`   ✅ Admin username: ${adminUsername}`);
  console.log(`   ✅ Database initialized`);
  console.log(`   ✅ API keys generated`);
  console.log(`   ✅ Default data created`);
  console.log('\n🚀 Next steps:\n');
  console.log('   1. Update your Minecraft mod config with the API key above');
  console.log('   2. Run: npm run dev');
  console.log('   3. Visit: http://localhost:3000');
  console.log('   4. Login with your admin credentials\n');
  console.log('═══════════════════════════════════════════════════════\n');

  rl.close();
  process.exit(0);
}

main().catch((error) => {
  console.error('\n❌ Setup failed:', error);
  rl.close();
  process.exit(1);
});
