# ⚡ Vonix Network - Quick Start Guide

Get up and running in 5 minutes!

---

## 🚀 For Developers

### 1️⃣ Clone & Install
```bash
git clone <your-repo-url>
cd Vonix-Network-WWW-2.0
npm install
```

### 2️⃣ Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

### 3️⃣ Initialize Database
```bash
npm run db:init
```

✅ This creates all tables, runs migrations, and seeds data!

### 4️⃣ Start Development
```bash
npm run dev
```

Visit **http://localhost:3000** 🎉

---

## 🤖 For AI Assistants

### Quick Reference

**Read First:** [AI_GUIDE.md](AI_GUIDE.md)

**Project Type:** Next.js 15 + React 19 + TypeScript + Turso + Drizzle ORM

**Key Files:**
- `src/db/schema.ts` - Database schema
- `src/lib/xp-system.ts` - XP engine
- `src/app/api/` - API routes

**Database:**
```typescript
// Use client for raw SQL
import { client } from '@/db';
await client.execute('SELECT ...');

// Use db for Drizzle queries
import { db } from '@/db';
await db.select().from(table);
```

**XP System:**
```typescript
import { awardXP, XP_REWARDS } from '@/lib/xp-system';
await awardXP(userId, XP_REWARDS.POST_CREATE, 'post_create', postId);
```

**Common Tasks:**
- Adding API endpoint → `src/app/api/[feature]/route.ts`
- Adding page → `src/app/(public)/[page]/page.tsx`
- Adding component → `src/components/[feature]/component.tsx`
- Modifying schema → `src/db/schema.ts` then `npm run db:push`

---

## 📚 Documentation Map

| File | Purpose |
|------|---------|
| **README.md** | Main project overview |
| **AI_GUIDE.md** | Complete guide for AI assistants |
| **SETUP_CHECKLIST.md** | Validation checklist |
| **QUICKSTART.md** | This file - getting started |
| **DONATION_RANK_FIX_SUMMARY.md** | Donation rank/badge system summary |
| **src/db/README.md** | Database management |
| **docs/XP_INTEGRATION_GUIDE.md** | XP system documentation |

---

## 🎯 What's Included

✅ **Real-time Minecraft Server Status**  
✅ **Social Platform** (posts, comments, likes)  
✅ **Forum System** (categories, posts, replies)  
✅ **XP & Leveling** (100+ levels, achievements)  
✅ **Friend System** (requests, friends list)  
✅ **Notifications** (real-time updates)  
✅ **Admin Dashboard** (user management)  
✅ **Discord Bot** (integration ready)  
✅ **Donation System** (rank management)  

---

## ⚙️ Available Commands

### Development
```bash
npm run dev           # Start Next.js dev server
npm run dev:all       # Start web + Discord bot
npm run db:studio     # Visual database browser
```

### Database
```bash
npm run db:init       # Complete database setup
npm run db:push       # Push schema changes
npm run db:generate   # Generate migrations
```

### Code Quality
```bash
npm run type-check    # TypeScript validation
npm run lint          # ESLint
npm run format        # Prettier
npm run validate      # All checks
```

### Production
```bash
npm run build         # Build for production
npm start             # Start production server
```

---

## 🧪 Quick Test

After setup, verify everything works:

```bash
# 1. Type check
npm run type-check

# 2. Start dev server
npm run dev

# 3. Visit these URLs:
# http://localhost:3000              - Homepage
# http://localhost:3000/achievements - Achievements
# http://localhost:3000/leaderboard  - XP Leaderboard
# http://localhost:3000/profile/YourName - User profile (donation rank badge)
# http://localhost:3000/api/xp       - XP API
```

---

## 🔑 Key Concepts

### App Router Structure
```
src/app/
├── (auth)/      → Login, Register
├── (dashboard)/ → Protected user pages
├── (public)/    → Public pages
└── api/         → API endpoints
```

### Database Pattern
- **Drizzle ORM** for type-safe queries
- **LibSQL client** for raw SQL
- **Automatic migrations** on app start
- **Manual init** via `npm run db:init`

### XP System
- Users earn XP for activities
- Automatic level calculation
- 10 achievements (seeded)
- 6 level milestones (seeded)
- Full transaction history

---

## 🆘 Getting Help

### Common Issues

**"Cannot find module" errors:**
```bash
npm install
```

**Database connection failed:**
```bash
# Check .env has correct credentials
npm run db:studio  # Test connection
```

**Type errors:**
```bash
npm run type-check
```

**Build fails:**
```bash
rm -rf .next
npm run build
```

### Resources

- **Main README:** [README.md](README.md)
- **AI Guide:** [AI_GUIDE.md](AI_GUIDE.md)
- **DB Docs:** [src/db/README.md](src/db/README.md)
- **XP Guide:** [docs/XP_INTEGRATION_GUIDE.md](docs/XP_INTEGRATION_GUIDE.md)

---

## 🎓 Next Steps

1. **Explore the code** - Start with `src/app/(public)/page.tsx`
2. **Check the database** - Run `npm run db:studio`
3. **Test XP system** - Create posts and see XP increase
4. **Read AI_GUIDE.md** - Understand patterns and conventions
5. **Build features** - Use existing patterns as templates

---

## 💡 Pro Tips

- Use `npm run db:studio` to explore the database visually
- Check `AI_GUIDE.md` for code patterns before creating new files
- Run `npm run validate` before committing
- XP is awarded automatically - just call `awardXP()`
- Database init is idempotent - safe to run multiple times

---

**Ready to build? Start coding! 🚀**

Questions? Check [AI_GUIDE.md](AI_GUIDE.md) for detailed answers.
