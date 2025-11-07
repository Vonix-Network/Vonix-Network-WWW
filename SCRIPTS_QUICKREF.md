# Scripts Quick Reference

## ⚡ Most Used Commands

```bash
# Development
npm run dev              # Start dev server (Turbo mode)
npm run dev:all          # Start web + bot together

# Database
npm run db:init          # Initialize database (run once)
npm run db:studio        # Open database GUI
npm run db:analyze       # Check database performance

# Code Quality
npm run validate         # Run all checks (type + lint + format)
npm run lint:fix         # Auto-fix linting issues
npm run format           # Format code

# Build & Deploy
npm run build            # Build for production
npm run start            # Start production server
```

## 📚 All Commands by Category

### Development
```bash
npm run dev              # Dev server with Turbo
npm run dev:all          # Web + Discord bot
npm run dev:debug        # Dev with debugger
```

### Discord Bot
```bash
npm run bot              # Run bot once
npm run bot:watch        # Run bot with auto-reload
```

### Database
```bash
npm run db:init          # Setup database (tables + indexes)
npm run db:generate      # Generate migrations
npm run db:push          # Push schema changes
npm run db:studio        # Open GUI
npm run db:migrate       # Run migrations
npm run db:seed          # Seed data
npm run db:analyze       # Analyze performance
npm run db:backup        # Create backup
npm run db:restore       # Restore backup
```

### Code Quality
```bash
npm run lint             # Check linting
npm run lint:fix         # Fix linting
npm run format           # Format code
npm run format:check     # Check formatting
npm run type-check       # TypeScript check
npm run validate         # All checks
```

### Testing
```bash
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
npm run test:ci          # CI mode
npm run test:e2e         # E2E tests
npm run test:e2e:ui      # E2E with UI
```

### Performance
```bash
npm run perf:analyze     # Cache statistics
npm run perf:bundle      # Bundle analysis
npm run build:analyze    # Build analysis
```

### Deployment
```bash
npm run build            # Production build
npm run start            # Start production
npm run start:all        # Start web + bot
npm run deploy:production # Full deployment
npm run deploy:vercel    # Deploy to Vercel
npm run deploy:staging   # Staging deploy
```

### Docker
```bash
npm run docker:build     # Build image
npm run docker:up        # Start containers
npm run docker:down      # Stop containers
npm run docker:logs      # View logs
npm run docker:clean     # Clean up
```

### Kubernetes
```bash
npm run k8s:deploy       # Deploy to k8s
npm run k8s:delete       # Remove from k8s
npm run k8s:restart      # Restart deployment
npm run k8s:logs         # View logs
npm run k8s:status       # Check status
```

### Utilities
```bash
npm run clean            # Clean build
npm run clean:all        # Deep clean
npm run clean:reinstall  # Reinstall deps
npm run audit            # Security audit
npm run audit:fix        # Fix security issues
npm run deps:check       # Check updates
npm run deps:update      # Update all deps
```

### Setup
```bash
npm run setup            # First-time setup
npm run setup:production # Production setup
```

### Monitoring
```bash
npm run health           # Health check (local)
npm run health:prod      # Health check (prod)
```

## 🎯 Common Workflows

### First Time Setup
```bash
npm install
npm run setup
npm run dev
```

### Daily Development
```bash
npm run dev:all          # Start everything
# Make changes...
npm run validate         # Before committing
```

### Before Committing
```bash
npm run validate         # Type check + lint + format
npm test                 # Run tests
```

### Database Changes
```bash
# Edit schema
npm run db:generate      # Generate migration
npm run db:push          # Apply changes
npm run db:studio        # Verify in GUI
```

### Performance Check
```bash
npm run perf:analyze     # Check cache
npm run perf:bundle      # Check bundle size
npm run db:analyze       # Check database
```

### Deployment
```bash
npm run validate         # Final checks
npm run build            # Build
npm run start            # Test locally
npm run deploy:production # Deploy
```

### Troubleshooting
```bash
npm run clean:all        # Clean everything
npm run clean:reinstall  # Reinstall deps
npm run db:init          # Reinit database
```

## 💡 Tips

- **Turbo is default**: `npm run dev` now uses Turbo mode (faster)
- **db:init does it all**: No need for multiple migration scripts
- **validate before commit**: Catches issues early
- **perf scripts**: Monitor optimization impact
- **clean:reinstall**: Nuclear option for dep issues

## 🆘 Help

```bash
# List all scripts
npm run

# Check what a script does
cat package.json | grep "script-name"

# Verbose output
npm run script-name --verbose
```
