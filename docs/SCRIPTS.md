# Package.json Scripts Reference

Complete guide to all available npm scripts in Vonix Network.

---

## 📦 Development

### `npm run dev`
Start the Next.js development server with hot reload.
```bash
npm run dev
```
- Runs on: `http://localhost:3000`
- Use for: Local development

### `npm run dev:turbo`
Start development server with Turbo mode (experimental, faster).
```bash
npm run dev:turbo
```
- **Faster** than regular dev mode
- May have stability issues

### `npm run dev:all`
Start both web app AND Discord bot in development mode.
```bash
npm run dev:all
```
- Runs both services concurrently
- Color-coded console output

### `npm run dev:debug`
Start development server with Node.js debugger enabled.
```bash
npm run dev:debug
```
- Connect Chrome DevTools to: `chrome://inspect`
- Use for: Debugging server-side code

---

## 🚀 Production

### `npm run build`
Build the application for production.
```bash
npm run build
```
- Creates optimized production build
- Required before deployment

### `npm run build:analyze`
Build with bundle analyzer to visualize package sizes.
```bash
npm run build:analyze
```
- Opens interactive bundle size visualization
- Use for: Optimizing bundle size

### `npm start`
Start the production server (web app only).
```bash
npm start
```
- **Must run** `npm run build` first
- Production-optimized

### `npm run start:all`
Start both web app AND Discord bot in production.
```bash
npm run start:all
```
- Runs both services concurrently
- Recommended for production

### `npm run start:production`
Start all services with NODE_ENV=production.
```bash
npm run start:production
```
- Sets production environment variables
- Full production setup

---

## 🤖 Discord Bot

### `npm run bot`
Run the Discord bot.
```bash
npm run bot
```
- Standalone bot process

### `npm run bot:dev`
Run Discord bot in watch mode (auto-restart on changes).
```bash
npm run bot:dev
```
- Auto-reloads on file changes
- Use for: Bot development

---

## ✅ Code Quality

### `npm run lint`
Check code for linting errors.
```bash
npm run lint
```
- Runs ESLint on the codebase

### `npm run lint:fix`
Auto-fix linting errors.
```bash
npm run lint:fix
```
- Fixes auto-fixable issues

### `npm run format`
Format all code with Prettier.
```bash
npm run format
```
- Formats TypeScript, JavaScript, JSON, Markdown

### `npm run format:check`
Check if code is formatted correctly.
```bash
npm run format:check
```
- Fails if any files need formatting
- Use in CI/CD

### `npm run type-check`
Check TypeScript types without building.
```bash
npm run type-check
```
- Catches type errors
- Fast type validation

### `npm run validate`
Run all code quality checks (type-check + lint + format).
```bash
npm run validate
```
- Comprehensive pre-commit check
- Recommended before pushing

---

## 🗄️ Database

### `npm run db:generate`
Generate Drizzle migration files from schema changes.
```bash
npm run db:generate
```
- Compares schema to database
- Creates migration SQL files

### `npm run db:push`
Push schema changes directly to database (no migrations).
```bash
npm run db:push
```
- ⚠️ **Use carefully in production**
- Good for development

### `npm run db:studio`
Open Drizzle Studio (database GUI).
```bash
npm run db:studio
```
- Visual database management
- Runs on: `http://localhost:4983`

### `npm run db:migrate`
Run pending migrations.
```bash
npm run db:migrate
```
- Applies migration files
- Safe for production

### `npm run db:reset`
**⚠️ DANGER**: Drop all tables and recreate from schema.
```bash
npm run db:reset
```
- Deletes ALL data
- Use only in development

### `npm run db:seed`
Seed database with initial data.
```bash
npm run db:seed
```
- Populates test data
- Development/staging use

### `npm run db:migrate-all`
Run all custom migration scripts.
```bash
npm run db:migrate-all
```
- API keys migration
- Social comments migration
- Ranks migration

### `npm run db:backup`
Create database backup.
```bash
npm run db:backup
```
- Saves to `backups/` folder
- Timestamped filename

### `npm run db:restore`
Restore database from backup.
```bash
npm run db:restore
```
- Requires `backup.sql` file in root

---

## 🧪 Testing

### `npm test`
Run all tests.
```bash
npm test
```
- Unit + integration tests

### `npm run test:watch`
Run tests in watch mode.
```bash
npm run test:watch
```
- Re-runs on file changes

### `npm run test:coverage`
Run tests with coverage report.
```bash
npm run test:coverage
```
- Shows code coverage %

### `npm run test:ci`
Run tests optimized for CI/CD.
```bash
npm run test:ci
```
- Limited workers for CI environments
- Generates coverage

### `npm run test:e2e`
Run end-to-end tests with Playwright.
```bash
npm run test:e2e
```
- Browser automation tests

### `npm run test:e2e:ui`
Run E2E tests with UI mode.
```bash
npm run test:e2e:ui
```
- Interactive test runner

---

## 🐳 Docker

### `npm run docker:build`
Build production Docker image.
```bash
npm run docker:build
```
- Creates `vonix-network:latest`

### `npm run docker:build:dev`
Build development Docker image.
```bash
npm run docker:build:dev
```
- Uses `Dockerfile.dev`

### `npm run docker:build:bot`
Build Discord bot Docker image.
```bash
npm run docker:build:bot
```
- Standalone bot container

### `npm run docker:run`
Run Docker container locally.
```bash
npm run docker:run
```
- Starts production container
- Uses `.env.local`

### `npm run docker:up`
Start all services with Docker Compose (production).
```bash
npm run docker:up
```
- Web app + Redis + Bot

### `npm run docker:up:dev`
Start all services with Docker Compose (development).
```bash
npm run docker:up:dev
```
- Hot reload enabled

### `npm run docker:down`
Stop Docker Compose services.
```bash
npm run docker:down
```

### `npm run docker:logs`
View Docker Compose logs.
```bash
npm run docker:logs
```
- Follow mode (streaming)

### `npm run docker:clean`
Remove all containers and volumes.
```bash
npm run docker:clean
```
- ⚠️ Deletes volumes (Redis data)

---

## ☸️ Kubernetes

### `npm run k8s:deploy`
Deploy to Kubernetes.
```bash
npm run k8s:deploy
```
- Applies all manifests in `k8s/`

### `npm run k8s:delete`
Remove from Kubernetes.
```bash
npm run k8s:delete
```
- Deletes all resources

### `npm run k8s:restart`
Restart Kubernetes deployment.
```bash
npm run k8s:restart
```
- Rolling restart

### `npm run k8s:logs`
View Kubernetes logs.
```bash
npm run k8s:logs
```
- Follows logs

### `npm run k8s:status`
Check Kubernetes status.
```bash
npm run k8s:status
```
- Shows pods, services, deployments

---

## 🛠️ Setup & Maintenance

### `npm run setup`
Run initial project setup.
```bash
npm run setup
```
- First-time configuration

### `npm run setup:production`
Production setup (migrations + build).
```bash
npm run setup:production
```
- Run on first deploy

### `postinstall`
**Auto-runs** after `npm install`.
- Generates Drizzle types
- No manual execution needed

---

## 🧹 Utilities

### `npm run clean`
Clean build cache.
```bash
npm run clean
```
- Removes `.next/` and cache

### `npm run clean:all`
Deep clean (includes Turbo cache).
```bash
npm run clean:all
```
- More thorough than `clean`

### `npm run clean:modules`
Reinstall all dependencies.
```bash
npm run clean:modules
```
- Fixes dependency issues

### `npm run audit`
Check for security vulnerabilities.
```bash
npm run audit
```
- Shows moderate+ severity

### `npm run audit:fix`
Auto-fix security vulnerabilities.
```bash
npm run audit:fix
```

### `npm run update`
Update dependencies and show outdated.
```bash
npm run update
```

### `npm run update:deps`
Interactive dependency updates.
```bash
npm run update:deps
```
- Uses `npm-check-updates`

---

## 📊 Monitoring

### `npm run health`
Check local health endpoint.
```bash
npm run health
```
- Tests `http://localhost:3000/api/health`

### `npm run health:prod`
Check production health endpoint.
```bash
npm run health:prod
```
- Update URL in script

### `npm run logs`
View PM2 logs.
```bash
npm run logs
```
- Requires PM2 setup

### `npm run monitor`
Open PM2 monitoring dashboard.
```bash
npm run monitor
```
- Requires PM2 setup

---

## 🚢 Deployment

### `npm run deploy:vercel`
Deploy to Vercel.
```bash
npm run deploy:vercel
```

### `npm run deploy:railway`
Deploy to Railway.
```bash
npm run deploy:railway
```

### `npm run deploy:staging`
Deploy to staging environment.
```bash
npm run deploy:staging
```

### `npm run deploy:production`
Full production deployment (validate + build + start).
```bash
npm run deploy:production
```
- Runs all quality checks
- Production-ready

---

## 🎨 Generators

### `npm run generate:component`
Generate new React component.
```bash
npm run generate:component
```
- Interactive scaffolding

### `npm run generate:api`
Generate new API route.
```bash
npm run generate:api
```
- API endpoint template

### `npm run generate:key`
Generate new API key.
```bash
npm run generate:key
```
- Creates secure API key

---

## 🔥 Most Common Workflows

### Local Development
```bash
npm install
npm run dev:all
```

### Production Deployment
```bash
npm run validate
npm run build
npm run start:production
```

### Database Changes
```bash
# Edit schema in src/db/schema.ts
npm run db:generate
npm run db:migrate
```

### Docker Development
```bash
npm run docker:up:dev
npm run docker:logs
```

### Pre-commit Checks
```bash
npm run validate
npm test
```

---

## 📝 Notes

- **Always run** `npm run build` before `npm start`
- **Never use** `db:reset` in production
- **Use** `dev:all` or `start:all` to run web + bot together
- **Check** `health` endpoint before deploying
- **Run** `validate` before committing code

---

For more information, see:
- [Deployment Guide](./DEPLOYMENT.md)
- [Database Guide](./DATABASE.md)
- [Contributing Guide](../CONTRIBUTING.md)


