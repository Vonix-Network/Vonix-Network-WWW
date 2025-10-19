# 🗄️ Database Management

Clean, unified database initialization and management for Vonix Network.

## Quick Start

### First-Time Setup

```bash
# Initialize the entire database (recommended)
npm run db:init
```

This single command:
- ✅ Connects to your database
- ✅ Creates all base tables (users, posts, forums, etc.)
- ✅ Runs all migrations
- ✅ Adds XP & Leveling system (5 tables)
- ✅ Seeds 10 achievements
- ✅ Seeds 6 level rewards
- ✅ Verifies integrity

**That's it! Your database is ready.** 🎉

---

## Database Commands

### Main Commands

| Command | Purpose |
|---------|---------|
| `npm run db:init` | **🌟 Complete setup** - Run this first! |
| `npm run db:studio` | Open Drizzle Studio (visual DB browser) |
| `npm run db:generate` | Generate migrations from schema changes |
| `npm run db:push` | Push schema changes directly to DB |

### Migration Commands

| Command | Purpose |
|---------|---------|
| `npm run db:migrate-all` | Run all individual migrations |
| `npm run db:migrate-xp-system` | Add XP system only |
| `npm run db:migrate-post-counts` | Add post engagement only |
| `npm run db:migrate-rank-expiration` | Add rank expiration only |

### Advanced Commands

| Command | Purpose |
|---------|---------|
| `npm run db:seed` | Seed test data (users, posts, etc.) |
| `npm run db:add-indexes` | Add database indexes for performance |
| `npm run db:reset` | ⚠️ **DANGER**: Drop all tables and recreate |
| `npm run db:backup` | Create database backup |
| `npm run db:restore` | Restore from backup |

---

## Database Structure

### Core Tables (Base Schema)
- `users` - User accounts and profiles
- `social_posts` - Social media posts
- `social_comments` - Comments on posts
- `social_likes` - Post likes
- `social_comment_likes` - Comment likes
- `forum_posts` - Forum posts
- `forum_replies` - Forum replies
- `forum_categories` - Forum categories
- `servers` - Minecraft server data
- `user_engagement` - User activity metrics
- `donation_ranks` - Donation tiers
- `api_keys` - API authentication keys

### XP System Tables (Added by `db:init`)
- `xp_transactions` - XP gain/loss history
- `achievements` - Achievement definitions (10 seeded)
- `user_achievements` - User achievement progress
- `level_rewards` - Level milestone rewards (6 seeded)
- `daily_streaks` - Login streak tracking

---

## Development Workflow

### 1. First Time Setup
```bash
# Clone repo, install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your TURSO_DATABASE_URL and TURSO_AUTH_TOKEN

# Initialize database
npm run db:init
```

### 2. Making Schema Changes
```bash
# Edit src/db/schema.ts

# Generate migration
npm run db:generate

# Apply changes
npm run db:push
```

### 3. Adding New Features
```bash
# If feature needs tables/columns, update schema first
# Then run db:init (it's idempotent - safe to re-run)
npm run db:init
```

---

## Architecture

### Database Files

```
src/db/
├── README.md              ← You are here
├── init.ts               ← Main initialization script
├── index.ts              ← Database client & exports
├── schema.ts             ← Table definitions (Drizzle ORM)
├── auto-migrate.ts       ← Automatic migration runner
├── add-xp-system.ts      ← XP system migration
├── add-post-counts.ts    ← Post engagement migration
└── add-rank-expiration.ts ← Rank expiration migration
```

### Initialization Flow

```
npm run db:init
      ↓
1. Check connection ✓
      ↓
2. Create base schema (Drizzle)
      ↓
3. Add post counts columns
      ↓
4. Add rank expiration
      ↓
5. Add XP system (5 tables + seeds)
      ↓
6. Verify integrity ✓
      ↓
   COMPLETE! 🎉
```

---

## Troubleshooting

### "Cannot find module" errors
```bash
# Make sure dependencies are installed
npm install

# If using tsx, ensure it's available
npx tsx --version
```

### "Database connection failed"
```bash
# Check your .env file has:
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# Test connection manually
npm run db:studio
```

### "Table already exists" errors
This is normal! The init script is **idempotent** - it checks for existing tables and skips them. You'll see messages like:
- ✓ Table already exists
- ✓ Column already exists

This means everything is working correctly.

### Starting fresh
```bash
# ⚠️ WARNING: This deletes ALL data
npm run db:reset

# Then reinitialize
npm run db:init
```

---

## Best Practices

### ✅ DO
- Run `db:init` for first-time setup
- Use `db:studio` to inspect your database
- Run `db:init` after pulling changes (it's safe)
- Back up before major changes

### ❌ DON'T
- Don't use `db:reset` in production
- Don't modify tables directly without updating schema
- Don't skip migrations when deploying

---

## FAQ

**Q: What's the difference between `db:init` and `db:migrate-all`?**
- `db:init` - Complete setup with verification and colored output
- `db:migrate-all` - Just runs the migration scripts

**Q: Can I run `db:init` multiple times?**
- Yes! It's idempotent (safe to re-run). It checks for existing tables/columns.

**Q: How do I add a new table?**
1. Update `src/db/schema.ts`
2. Run `npm run db:generate`
3. Run `npm run db:push`

**Q: Where are my achievements?**
- They're seeded automatically by `db:init`
- Check: `SELECT * FROM achievements` in db:studio

**Q: How do I see the XP tables?**
```bash
npm run db:studio
# Opens at http://localhost:4983
```

---

## Environment Variables

Required in `.env`:

```env
# Database (Turso)
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# Or local SQLite for development
# TURSO_DATABASE_URL=file:./local.db
# TURSO_AUTH_TOKEN=
```

---

## Production Deployment

### Initial Deploy
```bash
# On your server
npm run db:init
```

### Updating Schema
```bash
# Local development
npm run db:generate  # Create migration
git commit -m "Add new table"
git push

# On server (after pull)
npm run db:init      # Apply changes
```

---

## Contributing

When adding database features:

1. **Update schema** - Edit `src/db/schema.ts`
2. **Create migration** - If needed, create `src/db/add-feature.ts`
3. **Update init.ts** - Add your migration to the init flow
4. **Update this README** - Document your changes
5. **Test** - Run `db:init` on a fresh database

---

**Need help?** Check the main project README or create an issue.
