# 🚀 Quick Reference Guide - Vonix Network

Fast command reference for the most common tasks.

---

## 🏃 Quick Start

### First Time Setup
```bash
npm install
npm run setup
npm run dev:all
```

### Daily Development
```bash
npm run dev:all    # Start web + bot
```

### Check Your Code
```bash
npm run validate   # Type-check + lint + format
```

### Deploy to Production
```bash
npm run deploy:production
```

---

## 📋 Command Cheat Sheet

| Task | Command |
|------|---------|
| **Start development** | `npm run dev:all` |
| **Start web only** | `npm run dev` |
| **Start bot only** | `npm run bot` |
| **Build for production** | `npm run build` |
| **Start production** | `npm run start:all` |
| **Check code quality** | `npm run validate` |
| **Fix linting** | `npm run lint:fix` |
| **Format code** | `npm run format` |
| **View database** | `npm run db:studio` |
| **Backup database** | `npm run db:backup` |
| **Run tests** | `npm test` |
| **Clean cache** | `npm run clean` |
| **Docker dev** | `npm run docker:up:dev` |
| **Docker prod** | `npm run docker:up` |

---

## 🎯 Common Workflows

### Local Development
```bash
# 1. Pull latest changes
git pull

# 2. Install dependencies
npm install

# 3. Start development
npm run dev:all
```

### Before Committing
```bash
# 1. Check code quality
npm run validate

# 2. Run tests
npm test

# 3. Stage and commit
git add .
git commit -m "Your message"
git push
```

### Database Changes
```bash
# 1. Edit schema
# Edit src/db/schema.ts

# 2. Generate migration
npm run db:generate

# 3. Apply migration
npm run db:migrate

# 4. View changes
npm run db:studio
```

### Production Deployment
```bash
# 1. Validate code
npm run validate

# 2. Run tests
npm test

# 3. Build
npm run build

# 4. Deploy
npm run start:production
```

### Docker Workflow
```bash
# Development
npm run docker:up:dev
npm run docker:logs

# Production
npm run docker:build
npm run docker:up
```

### Fix Issues
```bash
# Clean everything and start fresh
npm run clean:all
npm run clean:modules

# Fix security issues
npm run audit:fix

# Update dependencies
npm run update
```

---

## 🐛 Troubleshooting

### Build fails?
```bash
npm run clean:all
npm run clean:modules
npm run build
```

### Database issues?
```bash
# Check schema
npm run db:studio

# Regenerate migrations
npm run db:generate
npm run db:migrate
```

### Type errors?
```bash
npm run type-check
```

### Lint errors?
```bash
npm run lint:fix
npm run format
```

### Docker issues?
```bash
npm run docker:down
npm run docker:clean
npm run docker:up
```

---

## 🔑 Environment Variables

Create `.env.local`:
```bash
# Database
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Discord
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=

# Minecraft
MINECRAFT_API_KEY=

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

---

## 📊 Health Checks

```bash
# Local
npm run health

# Production
npm run health:prod
```

---

## 🎨 Code Style

```bash
# Auto-format everything
npm run format

# Check formatting
npm run format:check
```

---

## 🗄️ Database

```bash
# Visual GUI
npm run db:studio

# Backup
npm run db:backup

# Restore
npm run db:restore

# Reset (⚠️ DANGER)
npm run db:reset
```

---

## 🐳 Docker Quick Ref

```bash
# Build
npm run docker:build

# Run development
npm run docker:up:dev

# Run production
npm run docker:up

# Stop
npm run docker:down

# View logs
npm run docker:logs

# Clean everything
npm run docker:clean
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

---

## 📚 More Help

- **Full scripts list**: See `docs/SCRIPTS.md`
- **Deployment guide**: See `docs/DEPLOYMENT.md`
- **Database guide**: See `docs/DATABASE.md`
- **API docs**: See `docs/API.md`
- **Contributing**: See `CONTRIBUTING.md`

---

## ⚡ Pro Tips

1. **Use `validate` before every commit**
2. **Run `dev:all` to start web + bot together**
3. **Use `db:studio` for visual database management**
4. **Run `clean:all` when things break**
5. **Check `health` endpoint before deploying**

---

**Happy coding! 🎉**


