# Database Migration Guide

## Overview

This guide explains how to migrate your Vonix Network application from one database type to another (e.g., from Turso to PostgreSQL).

## Prerequisites

- Backup of your current database
- Target database server installed and running
- Node.js and npm installed
- Database client tools (psql, mysql, etc.)

## Migration Scenarios

### Turso → PostgreSQL

#### Step 1: Prepare PostgreSQL Database

```bash
# Create database
createdb vonix

# Or using psql
psql -U postgres
CREATE DATABASE vonix;
\q
```

#### Step 2: Configure Environment

Create a `.env.postgres` file:

```env
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://postgres:password@localhost:5432/vonix
```

#### Step 3: Generate Schema

```bash
# Generate PostgreSQL schema
npm run db:generate:postgres

# Or push directly
npm run db:push:postgres
```

#### Step 4: Export Data from Turso

Create `scripts/export-turso.ts`:

```typescript
import { db } from '@/db';
import * as schema from '@/db/schema';
import { writeFileSync } from 'fs';

async function exportData() {
  const data = {
    users: await db.select().from(schema.users),
    servers: await db.select().from(schema.servers),
    forumCategories: await db.select().from(schema.forumCategories),
    forumPosts: await db.select().from(schema.forumPosts),
    // ... export all tables
  };

  writeFileSync('data-export.json', JSON.stringify(data, null, 2));
  console.log('Data exported to data-export.json');
}

exportData();
```

Run the export:

```bash
tsx scripts/export-turso.ts
```

#### Step 5: Import Data to PostgreSQL

Create `scripts/import-postgres.ts`:

```typescript
import { db } from '@/db/index-multi';
import * as schema from '@/db/schema';
import { readFileSync } from 'fs';

async function importData() {
  const data = JSON.parse(readFileSync('data-export.json', 'utf-8'));

  // Import in order to respect foreign keys
  await db.insert(schema.users).values(data.users);
  await db.insert(schema.servers).values(data.servers);
  await db.insert(schema.forumCategories).values(data.forumCategories);
  await db.insert(schema.forumPosts).values(data.forumPosts);
  // ... import all tables

  console.log('Data imported successfully');
}

importData();
```

Run the import:

```bash
DATABASE_TYPE=postgres tsx scripts/import-postgres.ts
```

#### Step 6: Verify Migration

```bash
# Connect to PostgreSQL
psql vonix

# Check row counts
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM servers;
SELECT COUNT(*) FROM forum_posts;
```

#### Step 7: Update Production Environment

```env
DATABASE_TYPE=postgres
DATABASE_URL=your-production-postgres-url
```

### Turso → MySQL/MariaDB

Follow similar steps as PostgreSQL migration, but use MySQL-specific commands:

```bash
# Create database
mysql -u root -p
CREATE DATABASE vonix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Generate schema
npm run db:generate:mysql
npm run db:push:mysql

# Import data
DATABASE_TYPE=mysql tsx scripts/import-mysql.ts
```

### PostgreSQL → MySQL

#### Step 1: Export PostgreSQL Data

```bash
pg_dump vonix > vonix-backup.sql
```

#### Step 2: Convert SQL Syntax

PostgreSQL and MySQL have different SQL dialects. You may need to:

- Convert `SERIAL` to `AUTO_INCREMENT`
- Convert `BOOLEAN` to `TINYINT(1)`
- Convert `TEXT` length specifications
- Update timestamp functions

Use a conversion tool or manual editing.

#### Step 3: Import to MySQL

```bash
mysql -u root -p vonix < converted-backup.sql
```

## Data Type Mapping

### SQLite (Turso) ↔ PostgreSQL

| SQLite | PostgreSQL |
|--------|------------|
| INTEGER | INTEGER / SERIAL |
| TEXT | TEXT / VARCHAR |
| REAL | DOUBLE PRECISION |
| BLOB | BYTEA |
| NULL | NULL |

### SQLite (Turso) ↔ MySQL

| SQLite | MySQL |
|--------|-------|
| INTEGER | INT / AUTO_INCREMENT |
| TEXT | TEXT / VARCHAR |
| REAL | DOUBLE |
| BLOB | BLOB |
| NULL | NULL |

### PostgreSQL ↔ MySQL

| PostgreSQL | MySQL |
|------------|-------|
| SERIAL | AUTO_INCREMENT |
| BOOLEAN | TINYINT(1) |
| TEXT | TEXT |
| TIMESTAMP | DATETIME |
| JSONB | JSON |

## Common Issues

### Issue: Foreign Key Constraints

**Problem**: Import fails due to foreign key constraints

**Solution**: Disable foreign key checks temporarily

PostgreSQL:
```sql
SET session_replication_role = 'replica';
-- Import data
SET session_replication_role = 'origin';
```

MySQL:
```sql
SET FOREIGN_KEY_CHECKS=0;
-- Import data
SET FOREIGN_KEY_CHECKS=1;
```

### Issue: Auto-increment ID Conflicts

**Problem**: Duplicate key errors during import

**Solution**: Reset auto-increment sequences

PostgreSQL:
```sql
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
```

MySQL:
```sql
ALTER TABLE users AUTO_INCREMENT = 1000;
```

### Issue: Character Encoding

**Problem**: Special characters corrupted

**Solution**: Ensure UTF-8 encoding

PostgreSQL:
```sql
CREATE DATABASE vonix ENCODING 'UTF8';
```

MySQL:
```sql
CREATE DATABASE vonix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Complete Migration Script

Here's a complete migration script template:

```typescript
// scripts/migrate-database.ts
import { config } from 'dotenv';
import { createDatabaseClient } from '@/db/adapter';
import { getDatabaseConfig } from '@/db/config';
import * as schema from '@/db/schema';

interface MigrationConfig {
  source: {
    type: 'turso' | 'postgres' | 'mysql';
    url: string;
    authToken?: string;
  };
  target: {
    type: 'postgres' | 'mysql';
    url: string;
  };
}

async function migrate(config: MigrationConfig) {
  console.log(`Migrating from ${config.source.type} to ${config.target.type}`);

  // Connect to source database
  const sourceDb = await createDatabaseClient(config.source);
  
  // Connect to target database
  const targetDb = await createDatabaseClient(config.target);

  // Export all tables
  const tables = [
    'users',
    'servers',
    'forumCategories',
    'forumPosts',
    'forumReplies',
    // ... add all tables
  ];

  for (const table of tables) {
    console.log(`Migrating table: ${table}`);
    
    // Read from source
    const data = await sourceDb.select().from(schema[table]);
    
    // Write to target
    if (data.length > 0) {
      await targetDb.insert(schema[table]).values(data);
    }
    
    console.log(`✓ Migrated ${data.length} rows from ${table}`);
  }

  console.log('Migration completed successfully');
}

// Usage
const migrationConfig: MigrationConfig = {
  source: {
    type: 'turso',
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
  target: {
    type: 'postgres',
    url: process.env.DATABASE_URL!,
  },
};

migrate(migrationConfig);
```

## Testing Migration

Before running in production:

1. **Test with Sample Data**
   ```bash
   # Create test database
   createdb vonix_test
   
   # Run migration
   DATABASE_URL=postgresql://localhost/vonix_test tsx scripts/migrate-database.ts
   ```

2. **Verify Data Integrity**
   ```sql
   -- Count rows in all tables
   SELECT 'users' as table_name, COUNT(*) as row_count FROM users
   UNION ALL
   SELECT 'servers', COUNT(*) FROM servers
   UNION ALL
   SELECT 'forum_posts', COUNT(*) FROM forum_posts;
   ```

3. **Test Application Functionality**
   ```bash
   DATABASE_TYPE=postgres npm run dev
   ```

4. **Run Integration Tests**
   ```bash
   DATABASE_TYPE=postgres npm run test
   ```

## Rollback Plan

Always have a rollback plan:

1. **Keep Old Database Running**
   - Don't delete the old database immediately
   - Keep it running for at least 24-48 hours

2. **Document Configuration**
   - Save old `.env` settings
   - Document any custom queries or procedures

3. **Quick Rollback**
   ```bash
   # Revert environment variables
   cp .env.backup .env
   
   # Restart application
   npm run start
   ```

## Performance Optimization

After migration:

1. **Rebuild Indexes**
   ```sql
   -- PostgreSQL
   REINDEX DATABASE vonix;
   
   -- MySQL
   OPTIMIZE TABLE users, servers, forum_posts;
   ```

2. **Update Statistics**
   ```sql
   -- PostgreSQL
   ANALYZE;
   
   -- MySQL
   ANALYZE TABLE users, servers, forum_posts;
   ```

3. **Vacuum Database** (PostgreSQL only)
   ```sql
   VACUUM ANALYZE;
   ```

## Support

If you encounter issues during migration:

1. Check error logs carefully
2. Verify database permissions
3. Ensure network connectivity
4. Review the [Multi-Database Guide](./MULTI_DATABASE_GUIDE.md)
5. Open an issue on GitHub with:
   - Source database type and version
   - Target database type and version
   - Error messages
   - Steps to reproduce

---

**Important**: Always backup your data before attempting any migration!
