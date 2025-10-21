# Multi-Database Support - Implementation Checklist

## ✅ Installation & Setup

### Step 1: Install Dependencies
```bash
npm install
```

**What this does:**
- Installs `postgres` driver for PostgreSQL support
- Installs `mysql2` driver for MySQL/MariaDB support
- Updates all package dependencies

**Expected outcome:** No errors during installation

---

### Step 2: Choose Your Database

#### Option A: Keep Using Turso (Default)
✅ **No changes needed!**
- Your existing setup continues to work
- No code modifications required
- All existing environment variables remain the same

#### Option B: Switch to PostgreSQL
1. Create PostgreSQL database:
   ```bash
   createdb vonix
   ```

2. Update `.env`:
   ```env
   DATABASE_TYPE=postgres
   DATABASE_URL=postgresql://user:password@localhost:5432/vonix
   ```

3. Push schema:
   ```bash
   npm run db:push:postgres
   ```

4. Update imports in your code:
   ```typescript
   // Replace this:
   import { db } from '@/db';
   
   // With this:
   import { db } from '@/db/index-multi';
   ```

#### Option C: Switch to MySQL/MariaDB
1. Create MySQL database:
   ```bash
   mysql -u root -p -e "CREATE DATABASE vonix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

2. Update `.env`:
   ```env
   DATABASE_TYPE=mysql
   DATABASE_URL=mysql://user:password@localhost:3306/vonix
   ```

3. Push schema:
   ```bash
   npm run db:push:mysql
   ```

4. Update imports in your code:
   ```typescript
   // Replace this:
   import { db } from '@/db';
   
   // With this:
   import { db } from '@/db/index-multi';
   ```

---

## 🧪 Testing Checklist

### Basic Tests

- [ ] Dependencies installed without errors
- [ ] Application starts: `npm run dev`
- [ ] Home page loads at `http://localhost:3000`
- [ ] No console errors in browser
- [ ] Database connection successful

### Database Operations

- [ ] User authentication works
- [ ] Forum posts display correctly
- [ ] Social posts can be created
- [ ] Server status updates
- [ ] Admin dashboard accessible

### Database Commands

- [ ] `npm run db:studio` opens successfully
- [ ] Schema generation works for your database type
- [ ] Migrations run without errors

---

## 📋 Verification Steps

### 1. Check Environment Configuration

```bash
# Verify your .env file has the correct DATABASE_TYPE
cat .env | grep DATABASE_TYPE
```

Expected output:
```
DATABASE_TYPE=turso  # or postgres, mysql, mariadb
```

### 2. Test Database Connection

Create `scripts/verify-db.ts`:
```typescript
import { getDatabaseConfig } from '@/db/config';

const config = getDatabaseConfig();
console.log('Database Type:', config.type);
console.log('Connection configured:', !!config.url || !!(config.host && config.database));
```

Run:
```bash
tsx scripts/verify-db.ts
```

### 3. Check Application Health

```bash
# Start the application
npm run dev

# In another terminal, check health
curl http://localhost:3000/api/health
```

Expected: HTTP 200 response

---

## 🐛 Troubleshooting

### Issue: TypeScript Errors

**Error**: `Cannot find module 'postgres'` or similar

**Solution**:
1. Run `npm install` again
2. Restart your code editor
3. Clear TypeScript cache: `rm -rf node_modules/.cache`

### Issue: Database Connection Failed

**Error**: `Database connection failed: ECONNREFUSED`

**Solution**:
1. Verify database server is running
2. Check connection credentials in `.env`
3. Test database connection manually:
   ```bash
   # PostgreSQL
   psql -U user -d vonix
   
   # MySQL
   mysql -u user -p vonix
   ```

### Issue: Migration Errors

**Error**: `Relation already exists`

**Solution**:
```bash
# Drop and recreate database (DEVELOPMENT ONLY!)
# PostgreSQL:
dropdb vonix && createdb vonix && npm run db:push:postgres

# MySQL:
mysql -u root -p -e "DROP DATABASE vonix; CREATE DATABASE vonix;" && npm run db:push:mysql
```

---

## 📚 Quick Reference

### Environment Variables

```env
# Database Type Selection
DATABASE_TYPE=turso|postgres|mysql|mariadb

# Turso (Default)
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...

# PostgreSQL
DATABASE_URL=postgresql://user:pass@host:port/db
# OR
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vonix
DB_USER=postgres
DB_PASSWORD=...

# MySQL/MariaDB
DATABASE_URL=mysql://user:pass@host:port/db
# OR
DB_HOST=localhost
DB_PORT=3306
DB_NAME=vonix
DB_USER=root
DB_PASSWORD=...
```

### NPM Scripts

```bash
# Schema Generation
npm run db:generate             # Turso
npm run db:generate:postgres    # PostgreSQL
npm run db:generate:mysql       # MySQL

# Schema Push (Direct)
npm run db:push                 # Turso
npm run db:push:postgres        # PostgreSQL
npm run db:push:mysql           # MySQL

# Migrations
npm run db:migrate              # Turso
npm run db:migrate:multi        # Any configured database

# Studio (All databases)
npm run db:studio
```

### Import Paths

```typescript
// Turso only (default)
import { db } from '@/db';

// Multi-database support
import { db } from '@/db/index-multi';

// Configuration utilities
import { getDatabaseConfig, validateDatabaseConfig } from '@/db/config';

// Adapter utilities
import { createDatabaseClient, testConnection } from '@/db/adapter';
```

---

## 📖 Documentation

- **[Setup Guide](docs/MULTI_DATABASE_GUIDE.md)** - Complete setup instructions
- **[Migration Guide](docs/DATABASE_MIGRATION.md)** - Data migration procedures
- **[Implementation Summary](MULTI_DATABASE_IMPLEMENTATION.md)** - Technical details
- **[Database Docs](docs/DATABASE.md)** - Schema documentation

---

## ✅ Success Criteria

Your implementation is successful when:

1. ✅ Dependencies installed without errors
2. ✅ Application runs: `npm run dev`
3. ✅ Database connection works
4. ✅ All pages load correctly
5. ✅ Database operations function normally
6. ✅ No console errors
7. ✅ Tests pass (if applicable)

---

## 🎉 You're Done!

If all checklist items are complete, your multi-database support is ready to use!

**Need Help?**
- Review the [Multi-Database Guide](docs/MULTI_DATABASE_GUIDE.md)
- Check [Troubleshooting Section](#-troubleshooting)
- Open an issue on GitHub

---

**Implementation Status**: ✅ Complete
**Last Updated**: $(date)
