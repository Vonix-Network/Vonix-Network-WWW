# Database Initialization Fix

## Problem
The `npm run db:init` command was failing because environment variables weren't loaded before the database modules were imported.

## Solution
Changed from static imports to dynamic imports, ensuring `.env` is loaded first:

```typescript
// Load .env file FIRST
config({ path: resolve(process.cwd(), '.env') });

// Verify environment variables
if (!process.env.DATABASE_URL && !process.env.TURSO_DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL or TURSO_DATABASE_URL not found');
  process.exit(1);
}

// Use dynamic imports AFTER env vars are loaded
const { db, client, checkDatabaseConnection } = await import('./index');
```

## Testing

1. Make sure you have a `.env` file with database credentials:
```env
DATABASE_URL=libsql://your-database-url
TURSO_AUTH_TOKEN=your-auth-token
```

OR

```env
TURSO_DATABASE_URL=libsql://your-database-url
TURSO_AUTH_TOKEN=your-auth-token
```

2. Run the initialization:
```bash
npm run db:init
```

## Expected Output

You should see:
```
🚀 Initializing Vonix Network Database...

📡 Step 1: Checking database connection...
✓ Database connection established

📋 Step 2: Creating base schema...
✓ Base schema created

... (all 10 steps)

✅ Database initialization complete!
```

## If It Still Fails

1. **Check .env file exists** in project root
2. **Verify DATABASE_URL format**: Should start with `libsql://` or `file:`
3. **Check for typos** in environment variable names
4. **Ensure TURSO_AUTH_TOKEN** is set if using Turso

## What Gets Created

- ✅ 60+ performance indexes
- ✅ All database tables
- ✅ XP and leveling system
- ✅ Group posts and reporting
- ✅ Stripe integration columns
- ✅ User preferences
- ✅ And more...
