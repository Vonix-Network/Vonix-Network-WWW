# 🚀 Vonix Network Setup Guide

## Quick Start

### Prerequisites
- **Node.js 18+** (LTS recommended)
- **npm** or **yarn**
- **Turso Database** account (or local SQLite for development)
- **Discord Bot Token** (optional, for chat integration)

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd Vonix-Network-Rewrite
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.production.example .env.local

# Edit .env.local with your values
```

**Required Environment Variables:**
```env
# Database (Turso recommended for production)
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_32_character_secret_key_here

# Discord Bot (optional)
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CHANNEL_ID=your_discord_channel_id
```

### 3. Database Setup
```bash
# Generate database migrations
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Open database studio
npm run db:studio
```

### 4. Start Development
```bash
# Start the application
npm run dev

# Or with Docker
docker-compose up -d
```

Visit **http://localhost:3000** 🎉

---

## 📋 Detailed Setup

### Database Options

#### Option 1: Turso (Recommended for Production)
1. Sign up at [turso.tech](https://turso.tech)
2. Create a new database
3. Get your database URL and auth token
4. Add to `.env.local`

#### Option 2: Local SQLite (Development)
```env
TURSO_DATABASE_URL=file:./local.db
# No auth token needed for local SQLite
```

### Discord Bot Setup (Optional)

1. **Create Discord Application:**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create new application
   - Go to "Bot" section
   - Create bot and copy token

2. **Get Channel ID:**
   - Enable Developer Mode in Discord
   - Right-click your channel → "Copy ID"

3. **Add to Environment:**
   ```env
   DISCORD_BOT_TOKEN=your_bot_token_here
   DISCORD_CHANNEL_ID=your_channel_id_here
   ```

4. **Start Bot:**
   ```bash
   npm run bot
   ```

### Authentication Setup

The system uses **NextAuth.js** with credentials provider (username/password).

**Default Admin Account:**
- Create via registration or database insert
- Update user role to 'admin' in database

### Performance Configuration

#### Cache Settings
```env
# Cache TTL (seconds)
CACHE_TTL_SHORT=60
CACHE_TTL_MEDIUM=300
CACHE_TTL_LONG=900
```

#### Rate Limiting
```env
# Enable rate limiting
RATE_LIMIT_ENABLED=true
```

---

## 🐳 Docker Setup

### Development with Docker
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Production Docker Build
```bash
# Build production image
docker build -t vonix-network .

# Run production container
docker run -p 3000:3000 --env-file .env.production vonix-network
```

---

## 📊 Database Schema

### Key Tables
- **users** - User accounts and profiles
- **social_posts** - Social media posts
- **forum_posts** - Forum discussions
- **chat_messages** - Discord chat integration
- **donations** - Donation tracking
- **servers** - Minecraft server status

### Migrations
```bash
# Create new migration
npm run db:generate

# Apply migrations
npm run db:push

# Reset database (⚠️ DESTRUCTIVE)
npm run db:reset
```

---

## 🔧 Development Commands

```bash
# Development
npm run dev          # Start dev server
npm run dev:all      # Start app + Discord bot
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:generate  # Generate migrations
npm run db:push      # Apply schema changes
npm run db:studio    # Open database studio
npm run db:migrate-all  # Run all migrations

# Discord Bot
npm run bot          # Start Discord bot only

# Utilities
npm run lint         # Run ESLint
npm run type-check   # TypeScript check
```

---

## 🚀 Production Deployment

### Environment Setup
1. Copy `.env.production.example` to `.env.production`
2. Fill in all production values
3. Use strong secrets and passwords

### Database Setup
```bash
# Production database migrations
NODE_ENV=production npm run db:push
```

### Build & Deploy
```bash
# Build application
npm run build

# Start production server
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start npm --name "vonix-network" -- start
```

### Nginx Configuration (Optional)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🛠️ Troubleshooting

### Common Issues

#### "WAL mode error"
**Fixed!** ✅ Turso handles WAL mode automatically.

#### "Cannot connect to database"
- Check `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`
- Verify network connectivity
- Check Turso dashboard for database status

#### "Authentication not working"
- Verify `NEXTAUTH_SECRET` is set (32+ characters)
- Check `NEXTAUTH_URL` matches your domain
- Clear browser cookies and try again

#### "Discord bot not responding"
- Verify `DISCORD_BOT_TOKEN` is correct
- Check `DISCORD_CHANNEL_ID` is valid
- Ensure bot has proper permissions in Discord

#### "Posts not showing"
**Fixed!** ✅ Import paths and rate limiting updated.

### Performance Issues

#### Slow database queries
- Check database indexes
- Use `npm run db:studio` to analyze queries
- Consider upgrading Turso plan

#### High memory usage
- Monitor with built-in performance tools
- Check for memory leaks in custom code
- Restart application periodically

#### Cache not working
- Verify cache configuration
- Check memory limits
- Monitor cache hit rates

---

## 📈 Monitoring & Maintenance

### Health Checks
- **Application**: `GET /api/health`
- **Database**: Built into health endpoint
- **Cache**: Memory usage monitoring

### Performance Monitoring
```javascript
// Built-in performance tracking
import { PerformanceMonitor } from '@/lib/optimizations';

// View metrics
const stats = PerformanceMonitor.getAllStats();
```

### Maintenance Tasks

#### Daily
- Monitor error logs
- Check database performance
- Review cache hit rates

#### Weekly
- Update dependencies: `npm update`
- Review security alerts: `npm audit`
- Database cleanup (automated)

#### Monthly
- Security updates
- Performance review
- Backup verification

---

## 🔐 Security Best Practices

### Environment Variables
- Never commit `.env` files
- Use strong, unique secrets
- Rotate secrets regularly

### Database Security
- Use Turso's built-in security
- Regular backups
- Monitor access logs

### Application Security
- Keep dependencies updated
- Use HTTPS in production
- Implement proper rate limiting

---

## 📞 Support

### Getting Help
1. Check this guide first
2. Review error logs
3. Check GitHub issues
4. Create new issue with:
   - Error message
   - Steps to reproduce
   - Environment details

### Useful Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Turso Documentation](https://docs.turso.tech)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [NextAuth.js Documentation](https://next-auth.js.org)

---

## 🎯 What's Included

✅ **Modern Tech Stack**
- Next.js 14 with App Router
- TypeScript for type safety
- Turso (LibSQL) database
- Tailwind CSS for styling

✅ **Core Features**
- User authentication & profiles
- Social media posts & comments
- Forum system with categories
- Real-time Discord chat integration
- Minecraft server status
- Donation tracking system

✅ **Performance Optimizations**
- LRU caching system
- Database query optimization
- Image optimization
- Response compression
- Memory monitoring

✅ **Security Features**
- Rate limiting (in-memory)
- Input validation
- SQL injection prevention
- XSS protection
- Secure headers

✅ **Developer Experience**
- TypeScript throughout
- Database migrations
- Development tools
- Docker support
- Comprehensive error handling

---

**🎉 You're ready to build an amazing Minecraft community platform!**
