-- Create donation_ranks table
CREATE TABLE IF NOT EXISTS donation_ranks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  min_amount REAL NOT NULL,
  color TEXT NOT NULL,
  text_color TEXT NOT NULL DEFAULT '#FFFFFF',
  badge TEXT,
  duration INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Add foreign key constraint to users table if it doesn't exist
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- Check if the column exists before adding it
SELECT CASE 
  WHEN NOT EXISTS (SELECT * FROM pragma_table_info('users') WHERE name = 'donation_rank_id')
  THEN 'ALTER TABLE users ADD COLUMN donation_rank_id TEXT REFERENCES donation_ranks(id) ON DELETE SET NULL;'
  ELSE 'SELECT "Column already exists";'
END;

-- Check if the column exists before adding it
SELECT CASE 
  WHEN NOT EXISTS (SELECT * FROM pragma_table_info('users') WHERE name = 'rank_expires_at')
  THEN 'ALTER TABLE users ADD COLUMN rank_expires_at INTEGER;'
  ELSE 'SELECT "Column already exists";'
END;

-- Check if the column exists before adding it
SELECT CASE 
  WHEN NOT EXISTS (SELECT * FROM pragma_table_info('users') WHERE name = 'total_donated')
  THEN 'ALTER TABLE users ADD COLUMN total_donated REAL DEFAULT 0;'
  ELSE 'SELECT "Column already exists";'
END;

COMMIT;
PRAGMA foreign_keys = on;
