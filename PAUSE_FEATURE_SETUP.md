# Rank Pause Feature - Database Setup

The pause/resume feature requires adding new columns to your database.

## Option 1: Run Safe Migration (Recommended)

This will add all necessary columns automatically:

```bash
npm run db:migrate
```

This runs `src/db/safe-migrate.ts` which includes the `ensurePauseColumns()` function.

## Option 2: Manual SQL (If migration fails)

Run these SQL commands directly on your database:

```sql
-- Add pause columns
ALTER TABLE users ADD COLUMN rank_paused INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN paused_rank_id TEXT;
ALTER TABLE users ADD COLUMN paused_remaining_days INTEGER;
ALTER TABLE users ADD COLUMN paused_at INTEGER;
```

### For Turso (Remote Database):

```bash
# Using Turso CLI
turso db shell your-database-name

# Then run the ALTER TABLE commands above
```

### For Local SQLite:

```bash
sqlite3 data/vonix.db

# Then run the ALTER TABLE commands above
```

## Verify Installation

After running the migration, you can test:

1. Go to `/donations/extend`
2. You should see a "Pause Rank" button
3. Click it to pause your rank
4. The button should change to "Resume Rank"
5. Click to resume

## Troubleshooting

### Error: "no such column: rank_paused"

This means the migration hasn't run yet. Try:

```bash
# Generate new migration
npm run db:generate

# Apply migration
npm run db:migrate
```

### Error: "Pause feature not yet available"

The API is detecting that the columns don't exist. Follow Option 1 or 2 above.

### Columns Already Exist

If you get "column already exists" errors, that's fine! The columns are already there and you can use the feature.

## What Gets Added

**Four new columns in the `users` table:**

1. `rank_paused` (INTEGER) - Boolean flag (0 or 1)
2. `paused_rank_id` (TEXT) - Stores the rank ID while paused
3. `paused_remaining_days` (INTEGER) - Days banked when paused
4. `paused_at` (INTEGER) - Unix timestamp when paused

## Feature Usage

Once installed, users can:

- **Pause** their rank to bank remaining days
  - Rank is **completely removed** (set to none) while paused
  - All perks and features are inactive
  - Days are safely banked in the database
- **Resume** anytime to restore banked days
  - Rank is restored with banked days
  - All perks reactivate immediately
- No value is lost during pause/resume

Perfect for:
- Vacations (don't waste days while away)
- Server breaks (pause when not playing)
- Budget management (pause when needed)
- Flexible gaming schedules
