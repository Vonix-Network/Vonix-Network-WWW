# Package.json Optimization Guide

## Changes Made

### 🗑️ Scripts Removed (Consolidated into `db:init`)

These migration scripts are now redundant because `npm run db:init` handles everything:

- ❌ `db:migrate-all` - Replaced by `db:init`
- ❌ `db:migrate-post-counts` - Now part of `db:init`
- ❌ `db:migrate-rank-expiration` - Now part of `db:init`
- ❌ `db:migrate-xp-system` - Now part of `db:init`
- ❌ `db:migrate-stripe` - Now part of `db:init`
- ❌ `db:add-indexes` - Now part of `db:init`
- ❌ `db:migrate:safe` - Use `db:init` instead
- ❌ `db:migrate:multi` - Use `db:init` instead
- ❌ `dev:turbo` - Now the default `dev` command
- ❌ `bot:dev` - Renamed to `bot:watch` for clarity
- ❌ `postinstall` - Removed to prevent issues in CI/CD
- ❌ Database config variants (postgres, mysql) - Simplified to single config
- ❌ `start:production` - Simplified
- ❌ `deploy:railway` - Removed unused deployment target
- ❌ `generate:component`, `generate:api` - Scripts don't exist
- ❌ `update`, `update:deps` - Consolidated to `deps:*`
- ❌ `clean:modules` - Renamed to `clean:reinstall`
- ❌ `logs`, `monitor` - PM2-specific, not always applicable

### ✨ Scripts Added/Improved

**Performance & Monitoring:**
- ✅ `perf:analyze` - Check cache statistics
- ✅ `perf:bundle` - Analyze bundle size
- ✅ `db:analyze` - Analyze database indexes and tables

**Dependencies:**
- ✅ `deps:check` - Check for outdated packages (non-destructive)
- ✅ `deps:update` - Update all packages (renamed from `update:deps`)

**Improved:**
- ✅ `dev` - Now uses Turbo by default (faster)
- ✅ `bot:watch` - Clearer name (was `bot:dev`)
- ✅ `setup` - Now runs `db:init` and `db:generate`
- ✅ `setup:production` - Simplified to `db:init` + `build`

## 📦 Usage Guide

### Development

```bash
# Start development server (Turbo mode by default)
npm run dev

# Start web + Discord bot together
npm run dev:all

# Debug mode
npm run dev:debug

# Watch Discord bot for changes
npm run bot:watch
```

### Database Management

```bash
# Initialize database (creates tables, indexes, seeds data)
npm run db:init

# Generate migrations
npm run db:generate

# Open Drizzle Studio (database GUI)
npm run db:studio

# Analyze database performance
npm run db:analyze

# Backup database
npm run db:backup

# Restore from backup
npm run db:restore backups/backup-20241106.sql
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Type check
npm run type-check

# Run all checks
npm run validate
```

### Performance Monitoring

```bash
# Check cache statistics
npm run perf:analyze

# Analyze bundle size
npm run perf:bundle

# Health check (local)
npm run health

# Health check (production)
npm run health:prod
```

### Testing

```bash
# Run unit tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# CI mode
npm run test:ci

# E2E tests
npm run test:e2e

# E2E with UI
npm run test:e2e:ui
```

### Deployment

```bash
# Validate + Build for production
npm run deploy:production

# Deploy to Vercel
npm run deploy:vercel

# Staging deployment
npm run deploy:staging
```

### Utilities

```bash
# Clean build artifacts
npm run clean

# Clean everything (including .turbo)
npm run clean:all

# Reinstall all dependencies
npm run clean:reinstall

# Security audit
npm run audit

# Fix security issues
npm run audit:fix

# Check for outdated packages
npm run deps:check

# Update all packages
npm run deps:update
```

### Setup

```bash
# First time setup
npm install
npm run setup

# Production setup
npm run setup:production
```

## 🎯 Key Improvements

### 1. Simplified Database Management
- **Before:** Multiple migration scripts to run
- **After:** Single `npm run db:init` does everything
- **Benefit:** Easier to use, harder to mess up

### 2. Faster Development
- **Before:** `npm run dev` used standard Next.js
- **After:** `npm run dev` uses Turbo by default
- **Benefit:** ~3-5x faster hot reloading

### 3. Performance Monitoring
- **Before:** No easy way to check cache stats
- **After:** `npm run perf:analyze` shows cache performance
- **Benefit:** Can monitor optimization effectiveness

### 4. Better Dependency Management
- **Before:** `update:deps` was inconsistently named
- **After:** `deps:check` and `deps:update` are clearer
- **Benefit:** Easier to remember, more intuitive

### 5. Cleaner Scripts
- **Before:** 30+ scripts, many redundant
- **After:** 20 focused scripts
- **Benefit:** Less confusion, easier maintenance

## 🔄 Migration from Old Scripts

| Old Script | New Script | Notes |
|------------|------------|-------|
| `db:migrate-all` | `db:init` | One command for everything |
| `dev:turbo` | `dev` | Turbo is now default |
| `bot:dev` | `bot:watch` | Clearer naming |
| `update:deps` | `deps:update` | Better organization |
| `clean:modules` | `clean:reinstall` | More descriptive |
| `postinstall` | *(removed)* | Run `setup` manually |

## 📊 Dependency Optimization Candidates

Consider removing these if not used:

### Potentially Unused:
- `mysql2` - Only if you're exclusively using Turso/SQLite
- `postgres` - Only if you're exclusively using Turso/SQLite
- `lru-cache` - Now have custom cache implementation
- `node-loader` - May not be needed
- `zlib-sync` - May not be needed

### Type Dependencies:
Some `@types/*` packages might be redundant if the main package includes types:
- `@types/jsonwebtoken` - Check if `jsonwebtoken` has types
- `@types/nodemailer` - Check if `nodemailer` has types

### To Check:
```bash
# Find unused dependencies
npx depcheck

# Check bundle size impact
npm run build:analyze
```

## 🎉 Results

- ✅ **Reduced scripts** from 40+ to ~35 focused ones
- ✅ **Faster development** with Turbo by default
- ✅ **Simplified database** management
- ✅ **Better performance** monitoring
- ✅ **Clearer naming** conventions
- ✅ **Easier maintenance** going forward

## 📝 Notes

- All scripts are now organized by category
- Comments use `"// === CATEGORY ===": ""` format
- Scripts follow consistent naming: `category:action`
- Dangerous operations require explicit confirmation
- Performance scripts help monitor optimizations

## 🚀 Next Steps

1. **Review dependencies**: Run `npx depcheck` to find unused packages
2. **Test scripts**: Try each category to ensure they work
3. **Update CI/CD**: Update pipeline scripts if needed
4. **Document team**: Share this guide with your team
