# Multi-Database Support Guide

## Overview

Vonix Network now supports multiple database types, providing flexibility in your deployment options:

- **Turso** (LibSQL) - Default, edge-optimized SQLite database
- **PostgreSQL** - Production-grade relational database
- **MySQL** - Popular open-source database
- **MariaDB** - MySQL-compatible database with enhanced features

This guide will help you configure and use alternative database backends without breaking existing functionality.

## Quick Start

### 1. Install Dependencies

First, install the required dependencies for your chosen database:

```bash
# Install all database drivers
npm install

# Or install specific drivers only
npm install postgres       # For PostgreSQL
npm install mysql2         # For MySQL/MariaDB
```

### 2. Configure Environment

Set the `DATABASE_TYPE` environment variable and configure connection details:

#### For Turso (Default)

```env
DATABASE_TYPE=turso
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
```

#### For PostgreSQL

```env
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://user:password@host:port/database
```

Or use individual settings:

```env
DATABASE_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vonix
DB_USER=postgres
DB_PASSWORD=your-password
DB_SSL=false
DB_POOL_MIN=2
DB_POOL_MAX=10
```

#### For MySQL/MariaDB

```env
DATABASE_TYPE=mysql
DATABASE_URL=mysql://user:password@host:port/database
```

Or use individual settings:

```env
DATABASE_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=vonix
DB_USER=root
DB_PASSWORD=your-password
DB_SSL=false
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### 3. Update Database Import

You have two options for using multi-database support:

#### Option A: Use the multi-database module (Recommended for new deployments)

Replace imports in your code:

```typescript
// Old import (Turso only)
import { db } from '@/db';

// New import (multi-database support)
import { db } from '@/db/index-multi';
```

#### Option B: Keep existing code (Backward compatible)

The existing `@/db/index` will continue to work with Turso. No code changes needed if you're staying with Turso.

## Database-Specific Setup

### PostgreSQL Setup

1. **Create Database**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE vonix;

# Create user (optional)
CREATE USER vonix_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE vonix TO vonix_user;
```

2. **Generate Migrations**

```bash
npm run db:generate:postgres
```

3. **Run Migrations**

```bash
npm run db:migrate:multi
```

4. **Push Schema (Alternative)**

```bash
npm run db:push:postgres
```

### MySQL/MariaDB Setup

1. **Create Database**

```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE vonix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create user (optional)
CREATE USER 'vonix_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON vonix.* TO 'vonix_user'@'localhost';
FLUSH PRIVILEGES;
```

2. **Generate Migrations**

```bash
npm run db:generate:mysql
```

3. **Run Migrations**

```bash
npm run db:migrate:multi
```

4. **Push Schema (Alternative)**

```bash
npm run db:push:mysql
```

## Database Scripts Reference

### Generation Commands

```bash
npm run db:generate          # Generate for default (Turso)
npm run db:generate:postgres # Generate PostgreSQL migrations
npm run db:generate:mysql    # Generate MySQL migrations
```

### Migration Commands

```bash
npm run db:migrate           # Run Turso migrations
npm run db:migrate:multi     # Run migrations for configured DB type
```

### Push Commands (Direct Schema Sync)

```bash
npm run db:push              # Push to Turso
npm run db:push:postgres     # Push to PostgreSQL
npm run db:push:mysql        # Push to MySQL
```

### Studio Command

```bash
npm run db:studio            # Open Drizzle Studio (supports all DB types)
```

## Architecture

### File Structure

```
src/db/
├── adapter.ts              # Database adapter abstraction
├── config.ts               # Configuration management
├── index.ts                # Original Turso-only connection
├── index-multi.ts          # Multi-database connection
├── migrate-multi.ts        # Universal migration runner
├── schema.ts               # SQLite schema (for Turso)
└── schema-universal.ts     # Universal schema definitions

drizzle.config.ts           # Turso configuration
drizzle.config.postgres.ts  # PostgreSQL configuration
drizzle.config.mysql.ts     # MySQL configuration
```

### Database Adapter

The adapter (`src/db/adapter.ts`) provides a unified interface for all database types:

```typescript
import { createDatabaseClient, testConnection } from '@/db/adapter';
import { getDatabaseConfig } from '@/db/config';

// Get configuration from environment
const config = getDatabaseConfig();

// Create database client
const db = await createDatabaseClient(config);

// Test connection
const isConnected = await testConnection(db, config);
```

### Configuration Management

The configuration module (`src/db/config.ts`) handles environment variables:

```typescript
import { getDatabaseConfig, validateDatabaseConfig } from '@/db/config';

const config = getDatabaseConfig();
validateDatabaseConfig(config);
```

## Migration Strategy

### Schema Compatibility

The existing SQLite schema is designed for Turso. When migrating to PostgreSQL or MySQL:

1. **Data Types**: Automatically converted by Drizzle ORM
   - SQLite `INTEGER` → PostgreSQL `INTEGER` / MySQL `INT`
   - SQLite `TEXT` → PostgreSQL `TEXT` / MySQL `TEXT`
   - SQLite `REAL` → PostgreSQL `DOUBLE PRECISION` / MySQL `DOUBLE`

2. **Timestamps**: Converted appropriately
   - SQLite `unixepoch()` → PostgreSQL `NOW()` / MySQL `NOW()`

3. **Auto-increment**: Handled per database
   - SQLite: `AUTOINCREMENT`
   - PostgreSQL: `SERIAL`
   - MySQL: `AUTO_INCREMENT`

### Migration Workflow

1. **Development**: Use `db:push` for rapid iteration
2. **Production**: Use `db:generate` and `db:migrate:multi` for tracked changes

```bash
# Development workflow
npm run db:push:postgres

# Production workflow
npm run db:generate:postgres
npm run db:migrate:multi
```

## Best Practices

### 1. Environment Variables

Always use environment variables for sensitive data:

```env
# ✅ Good
DATABASE_URL=postgresql://user:password@host/db

# ❌ Bad (hardcoded credentials)
```

### 2. Connection Pooling

Configure appropriate pool sizes:

```env
DB_POOL_MIN=2    # Minimum connections
DB_POOL_MAX=10   # Maximum connections
```

For high-traffic applications:
- PostgreSQL: 20-50 connections
- MySQL: 10-20 connections
- Turso: No pooling needed (serverless)

### 3. SSL Configuration

Enable SSL for production:

```env
DB_SSL=true
```

### 4. Database-Specific Optimizations

#### PostgreSQL

- Use connection pooling (PgBouncer)
- Enable query caching
- Configure `shared_buffers` appropriately

#### MySQL

- Use InnoDB engine (default)
- Enable query cache
- Configure `innodb_buffer_pool_size`

#### Turso

- Leverage edge caching
- Use replicas for read operations
- Enable auto-scaling

## Troubleshooting

### Connection Errors

**Issue**: Cannot connect to database

```
✗ Database connection failed: Error: connect ECONNREFUSED
```

**Solution**:
1. Verify database is running
2. Check firewall rules
3. Validate connection credentials
4. Ensure correct host and port

### Migration Errors

**Issue**: Migration fails with schema conflicts

```
Error: Relation already exists
```

**Solution**:
1. Check existing database schema
2. Drop and recreate database (development only)
3. Generate fresh migrations

```bash
# PostgreSQL
DROP DATABASE vonix;
CREATE DATABASE vonix;
npm run db:push:postgres

# MySQL
DROP DATABASE vonix;
CREATE DATABASE vonix;
npm run db:push:mysql
```

### Type Errors

**Issue**: TypeScript errors after switching databases

**Solution**:
1. Run `npm install` to ensure all dependencies are installed
2. Restart TypeScript server in your editor
3. Check that you're importing from the correct module

## Performance Considerations

### Turso (Default)

- **Pros**: Edge-optimized, low latency, serverless
- **Cons**: Limited to SQLite features
- **Best for**: Global applications, read-heavy workloads

### PostgreSQL

- **Pros**: Advanced features, ACID compliance, excellent performance
- **Cons**: Requires server management
- **Best for**: Complex queries, data integrity, analytics

### MySQL/MariaDB

- **Pros**: Wide adoption, good performance, replication
- **Cons**: Less advanced features than PostgreSQL
- **Best for**: Traditional web applications, WordPress-like workloads

## Switching Databases

To switch from one database to another:

1. **Backup existing data**

```bash
# Export from current database
npm run db:backup
```

2. **Update environment variables**

```env
DATABASE_TYPE=postgres  # Change to desired type
```

3. **Set up new database**

```bash
# Create database and run migrations
npm run db:migrate:multi
```

4. **Migrate data** (custom script needed)

You'll need to write a custom migration script to transfer data between databases.

## Docker Support

### PostgreSQL with Docker

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: vonix
      POSTGRES_USER: vonix_user
      POSTGRES_PASSWORD: secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### MySQL with Docker

```yaml
# docker-compose.yml
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: vonix
      MYSQL_USER: vonix_user
      MYSQL_PASSWORD: secure_password
      MYSQL_ROOT_PASSWORD: root_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

## FAQ

### Q: Will this break my existing Turso setup?

**A**: No! The original `src/db/index.ts` remains unchanged. Turso continues to work as before. Multi-database support is opt-in via `src/db/index-multi.ts`.

### Q: Can I use multiple databases simultaneously?

**A**: Not directly. The application is designed to use one database type at a time. However, you can create multiple instances with different configurations.

### Q: Which database should I choose?

**A**: 
- **Turso**: Best for most users, excellent performance, easy setup
- **PostgreSQL**: Advanced features, complex queries, data integrity critical
- **MySQL/MariaDB**: Familiar stack, shared hosting, legacy systems

### Q: Are all features supported on all databases?

**A**: Yes! The schema and queries are designed to work consistently across all supported databases.

### Q: How do I migrate data between databases?

**A**: You'll need to export data from the current database and import into the new one. Create a custom migration script using Drizzle ORM to read from one database and write to another.

## Support

For issues or questions:

1. Check this guide first
2. Review the [Database Documentation](./DATABASE.md)
3. Open an issue on GitHub
4. Join our Discord community

---

**Note**: Always test database changes in a development environment before deploying to production.
