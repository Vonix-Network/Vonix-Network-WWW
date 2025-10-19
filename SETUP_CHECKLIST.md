# ✅ Vonix Network - Setup Checklist

Quick validation checklist to ensure everything is working correctly.

---

## 📋 Initial Setup

### 1. Environment Setup
- [ ] `.env` file created (copy from `.env.example`)
- [ ] `TURSO_DATABASE_URL` configured
- [ ] `TURSO_AUTH_TOKEN` configured
- [ ] `NEXTAUTH_SECRET` set
- [ ] `NEXTAUTH_URL` set

### 2. Dependencies
```bash
npm install
```
- [ ] All packages installed without errors
- [ ] No peer dependency warnings

### 3. Database Initialization
```bash
npm run db:init
```
- [ ] ✓ Database connection established
- [ ] ✓ Base schema created
- [ ] ✓ Post engagement columns added
- [ ] ✓ Rank expiration added
- [ ] ✓ XP system tables created (5 tables)
- [ ] ✓ 10 Achievements seeded
- [ ] ✓ 6 Level rewards seeded
- [ ] ✓ All tables verified

### 4. Verify Database
```bash
npm run db:studio
```
Open http://localhost:4983
- [ ] Can see all tables
- [ ] `achievements` table has 10 rows
- [ ] `level_rewards` table has 6 rows
- [ ] `users` table has `xp`, `level`, `title` columns

---

## 🧪 Testing

### Code Quality
```bash
npm run validate
```
- [ ] TypeScript compilation passes
- [ ] ESLint checks pass
- [ ] Prettier formatting correct

### Build Test
```bash
npm run build
```
- [ ] Build completes successfully
- [ ] No type errors
- [ ] No build warnings

### Dev Server
```bash
npm run dev
```
- [ ] Server starts on http://localhost:3000
- [ ] Homepage loads
- [ ] No console errors

---

## 🎮 Feature Testing

### XP System
1. **Create an account or login**
   - [ ] Can register/login successfully

2. **Test Social Posts**
   - [ ] Create a post
   - [ ] Check console - should see XP awarded (+15)
   - [ ] Visit `/api/xp` - should show XP increase

3. **Test Comments**
   - [ ] Create a comment
   - [ ] Check console - should see XP awarded (+5)

4. **Test Likes**
   - [ ] Like someone's post
   - [ ] Post author should get XP (+2)

5. **Test Forum**
   - [ ] Create forum post
   - [ ] Should get XP (+20)

6. **Check Achievements**
   - [ ] Visit `/achievements`
   - [ ] Page loads successfully
   - [ ] Shows achievement progress
   - [ ] "First Steps" should unlock after first post

7. **Check Leaderboard**
   - [ ] Visit `/leaderboard`
   - [ ] Shows users ranked by XP
   - [ ] Displays levels and badges

### API Endpoints
- [ ] GET `/api/xp` - Returns user XP data
- [ ] GET `/api/xp/leaderboard` - Returns top users
- [ ] GET `/api/xp/achievements` - Returns achievements

---

## 📊 Database Tables Checklist

### Core Tables
- [ ] `users`
- [ ] `social_posts`
- [ ] `social_comments`
- [ ] `social_likes`
- [ ] `social_comment_likes`
- [ ] `forum_posts`
- [ ] `forum_replies`
- [ ] `forum_categories`
- [ ] `servers`

### XP System Tables
- [ ] `xp_transactions`
- [ ] `achievements`
- [ ] `user_achievements`
- [ ] `level_rewards`
- [ ] `daily_streaks`

### Other Tables
- [ ] `user_engagement`
- [ ] `donation_ranks`
- [ ] `api_keys`
- [ ] `notifications`
- [ ] `friends`
- [ ] `friend_requests`

---

## 🔧 Configuration Files

- [ ] `package.json` - All scripts present
- [ ] `tsconfig.json` - TypeScript config
- [ ] `tailwind.config.ts` - Tailwind setup
- [ ] `next.config.js` - Next.js config
- [ ] `drizzle.config.ts` - Drizzle ORM config

---

## 📚 Documentation

- [ ] `README.md` - Updated with XP system
- [ ] `AI_GUIDE.md` - Complete AI assistant guide
- [ ] `src/db/README.md` - Database documentation
- [ ] `docs/XP_INTEGRATION_GUIDE.md` - XP system guide
- [ ] `CHANGELOG.md` - Version history

---

## 🚀 Production Readiness

### Security
- [ ] Environment variables not in git
- [ ] `.gitignore` properly configured
- [ ] API routes have auth checks
- [ ] Input validation with Zod
- [ ] SQL injection prevention (Drizzle ORM)

### Performance
- [ ] Static pages pre-rendered
- [ ] API routes use `force-dynamic`
- [ ] Database indexes added
- [ ] Images optimized

### Monitoring
- [ ] Error logging in place
- [ ] Console logs for debugging
- [ ] Health check endpoint works

---

## 🐛 Common Issues & Solutions

### Database Connection Issues
```bash
# Check environment variables
cat .env | grep TURSO

# Test connection
npm run db:studio
```

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### XP Not Awarding
```bash
# Check migration ran
npm run db:init

# Check console for errors
# Verify user is logged in
```

### Type Errors
```bash
# Regenerate types
npm run db:generate

# Check TypeScript
npm run type-check
```

---

## 📝 Deployment Checklist

### Pre-Deploy
- [ ] All tests passing
- [ ] Build succeeds
- [ ] Environment variables set on server
- [ ] Database initialized on production

### Deploy
```bash
# On server
git pull
npm install
npm run db:init
npm run build
npm start
```

### Post-Deploy
- [ ] Site accessible
- [ ] Database connected
- [ ] XP system working
- [ ] No errors in logs

---

## ✨ Success Criteria

Your Vonix Network installation is complete when:

✅ All setup checkboxes are checked  
✅ `npm run validate` passes  
✅ `npm run build` succeeds  
✅ Dev server runs without errors  
✅ XP awarded on post creation  
✅ Achievements page loads  
✅ Leaderboard displays users  
✅ API endpoints return data  

**Congratulations! Your Minecraft community platform is ready! 🎉**

---

**Need Help?**
- Check [AI_GUIDE.md](AI_GUIDE.md) for detailed patterns
- See [src/db/README.md](src/db/README.md) for database help
- Review [docs/XP_INTEGRATION_GUIDE.md](docs/XP_INTEGRATION_GUIDE.md) for XP system
