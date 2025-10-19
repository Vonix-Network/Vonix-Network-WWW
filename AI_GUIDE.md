# 🤖 AI Assistant Guide - Vonix Network

**For AI Assistants working with this codebase**

This guide helps AI assistants (like Claude, GPT, etc.) quickly understand the Vonix Network project architecture, patterns, and conventions to provide effective assistance.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack & Architecture](#tech-stack--architecture)
3. [Code Patterns & Conventions](#code-patterns--conventions)
4. [Database Architecture](#database-architecture)
5. [Common Tasks](#common-tasks)
6. [File Structure Guide](#file-structure-guide)
7. [API Patterns](#api-patterns)
8. [Testing & Validation](#testing--validation)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## 📖 Project Overview

**Project Name:** Vonix Network  
**Type:** Full-stack Minecraft Community Platform  
**Framework:** Next.js 14 (App Router)  
**Language:** TypeScript  
**Database:** Turso (LibSQL - SQLite edge database)  
**ORM:** Drizzle ORM  
**Styling:** Tailwind CSS  
**State:** React hooks, Zustand (minimal)  
**Auth:** NextAuth.js  

### Key Features
- Real-time Minecraft server status monitoring
- Integrated forums with categories and moderation
- Social platform (posts, comments, likes)
- **XP & Leveling System** (100+ levels, achievements, rewards)
- Friend system with real-time updates
- Notifications system
- Blog and Events
- Admin dashboard
- Discord bot integration
- Donation system with rank management

---

## 🏗️ Tech Stack & Architecture

### Frontend
```typescript
Next.js 14           // React framework with App Router
TypeScript           // Type safety
Tailwind CSS         // Utility-first CSS
Lucide React         // Icon library
shadcn/ui           // UI component patterns
```

### Backend
```typescript
Next.js API Routes   // Serverless functions
NextAuth.js         // Authentication
Drizzle ORM         // Database queries
Turso (LibSQL)      // Edge SQLite database
Discord.js          // Discord bot
```

### Database Client
```typescript
// IMPORTANT: Use LibSQL client methods, NOT standard SQLite
import { client } from '@/db';

// ✅ Correct
await client.execute('SELECT * FROM users');
await client.execute({ sql: 'INSERT INTO ...', args: [...] });

// ❌ Wrong (will fail)
await db.run(sql`...`);  // db.run doesn't exist
await db.all(sql`...`);  // db.all doesn't exist
```

---

## 🎯 Code Patterns & Conventions

### File Naming
```
PascalCase: Components (MyComponent.tsx)
kebab-case: Routes, utilities (my-route/page.tsx, my-util.ts)
camelCase: Functions, variables (myFunction, myVariable)
SCREAMING_SNAKE: Constants (API_BASE_URL)
```

### Import Order
```typescript
// 1. External packages
import { useState } from 'react';
import { NextRequest } from 'next/server';

// 2. Internal absolute imports (@/)
import { db } from '@/db';
import { Button } from '@/components/ui/button';

// 3. Relative imports
import { helper } from './helpers';
```

### Component Pattern
```typescript
'use client'; // Only if needed (interactivity, hooks)

import { useState } from 'react';
import { ComponentProps } from '@/types';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export default function MyComponent({ title, onAction }: MyComponentProps) {
  const [state, setState] = useState<string>('');

  return (
    <div className="container mx-auto px-4">
      {/* Component JSX */}
    </div>
  );
}
```

### API Route Pattern
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const schema = z.object({
  field: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate
    const body = await request.json();
    const validationResult = schema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // 3. Database operation
    const result = await db.insert(table).values({...}).returning();

    // 4. Success response
    return NextResponse.json({ success: true, data: result }, { status: 201 });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Avatar Usage Pattern

**IMPORTANT:** Always use Minecraft heads from mc-heads.net for user avatars.

```typescript
// Helper function to get user avatar (use this pattern everywhere)
function getUserAvatar(minecraftUsername?: string | null, avatar?: string | null, size: number = 64): string {
  if (minecraftUsername) {
    return `https://mc-heads.net/head/${minecraftUsername}/${size}`;
  }
  if (avatar) {
    return avatar;
  }
  return `https://mc-heads.net/head/steve/${size}`; // Default Steve head
}

// Usage in components
<img
  src={getUserAvatar(user.minecraftUsername, user.avatar, 64)}
  alt={user.username}
  className="w-16 h-16 rounded-lg pixelated" // Use pixelated class for crisp rendering
/>
```

**Avatar Sizes:**
- **32**: Small icons, inline mentions
- **64**: Standard avatars, lists, comments
- **128**: Large avatars, profiles, podiums
- **256**: Hero sections, profile headers

**CSS Class:**
- Always use `pixelated` class for Minecraft heads for crisp rendering
- Use `rounded-lg` (not `rounded-full`) for Minecraft aesthetic
- Border styles should match level/rank colors when applicable

**Database Fields:**
- `users.minecraftUsername`: Primary source (use this first)
- `users.avatar`: Fallback URL
- Always select `minecraftUsername` in queries when displaying avatars

---

## 🗄️ Database Architecture

### Connection
```typescript
// Import from index for Drizzle queries
import { db } from '@/db';
import { users } from '@/db/schema';

// Import client for raw SQL
import { client } from '@/db';
```

### Drizzle Query Patterns
```typescript
// SELECT with joins
const posts = await db
  .select({
    id: socialPosts.id,
    title: socialPosts.title,
    author: {
      id: users.id,
      username: users.username,
    },
  })
  .from(socialPosts)
  .leftJoin(users, eq(socialPosts.userId, users.id))
  .where(eq(socialPosts.published, true))
  .orderBy(desc(socialPosts.createdAt))
  .limit(10);

// INSERT with returning
const [newPost] = await db
  .insert(socialPosts)
  .values({
    title: 'My Post',
    content: 'Content',
    userId: parseInt(session.user.id),
  })
  .returning();

// UPDATE
await db
  .update(users)
  .set({ xp: users.xp + 10 })
  .where(eq(users.id, userId));

// DELETE
await db
  .delete(socialPosts)
  .where(eq(socialPosts.id, postId));
```

### Raw SQL (when needed)
```typescript
// Simple query
const result = await client.execute('SELECT * FROM users WHERE id = ?', [userId]);

// With parameters
await client.execute({
  sql: 'INSERT INTO table (col1, col2) VALUES (?, ?)',
  args: [value1, value2]
});

// Result handling
const rows = result.rows;
const count = rows.length;
```

### Schema Location
- **Main schema:** `src/db/schema.ts`
- **All table definitions** use Drizzle's schema builder
- **Relationships** defined with relations()

### Key Tables
```typescript
// Core
users, servers, api_keys

// Social
social_posts, social_comments, social_likes, social_comment_likes

// Forum
forum_posts, forum_replies, forum_categories

// XP System (NEW!)
xp_transactions        // XP history
achievements          // Achievement definitions (10 seeded)
user_achievements     // User progress
level_rewards         // Level milestones (6 seeded)
daily_streaks         // Login streaks

// Other
user_engagement, donation_ranks, notifications, friends, friend_requests
```

---

## 🛠️ Common Tasks

### 1. Adding a New Database Table

```typescript
// 1. Update src/db/schema.ts
export const myTable = sqliteTable('my_table', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// 2. Generate migration
// npm run db:generate

// 3. Push to database
// npm run db:push

// 4. Update db:init if needed for data seeding
```

### 2. Creating a New API Endpoint

```bash
# Location: src/app/api/[feature]/route.ts
src/app/api/
├── social/
│   ├── posts/
│   │   ├── route.ts          # GET, POST
│   │   └── [id]/
│   │       ├── route.ts      # GET, PATCH, DELETE
│   │       └── like/
│   │           └── route.ts  # POST (toggle)
```

**Pattern:**
- GET for fetching
- POST for creating/actions
- PATCH for updating
- DELETE for removing
- Use route params: `{ params }: { params: { id: string } }`

### 3. Adding XP Rewards

```typescript
import { awardXP, XP_REWARDS, checkAchievements } from '@/lib/xp-system';

// Award XP
const result = await awardXP(
  userId,
  XP_REWARDS.POST_CREATE,  // or custom amount
  'post_create',           // source type
  postId,                  // source ID (optional)
  'Created a post'         // description (optional)
);

// Check if leveled up
if (result.leveledUp) {
  console.log(`Leveled up to ${result.newLevel}!`);
  // TODO: Show notification
}

// Check achievements
const unlocked = await checkAchievements(userId, 'post', postCount);
```

### 4. Adding a New Page

```typescript
// src/app/(public)/my-page/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Page - Vonix Network',
  description: 'Page description',
};

export default function MyPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <section className="container mx-auto px-4 py-20">
        {/* Content */}
      </section>
    </div>
  );
}
```

### 5. Creating a New Component

```typescript
// src/components/feature/my-component.tsx
'use client'; // Only if using hooks/interactivity

import { ComponentProps } from '@/types';

interface MyComponentProps {
  data: string;
  onAction?: () => void;
}

export function MyComponent({ data, onAction }: MyComponentProps) {
  return (
    <div className="glass border border-purple-500/20 rounded-xl p-6">
      {/* Component content */}
    </div>
  );
}
```

---

## 📁 File Structure Guide

### Critical Files
```
src/
├── app/
│   ├── (auth)/              # Login, register (unprotected)
│   ├── (dashboard)/         # User dashboard (protected)
│   ├── (public)/            # Public pages
│   ├── api/                 # API routes
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
│
├── components/
│   ├── ui/                  # Reusable UI (buttons, cards, etc.)
│   ├── xp/                  # XP system components ⭐ NEW
│   ├── admin/               # Admin-only components
│   ├── forum/               # Forum-specific
│   └── social/              # Social platform
│
├── db/
│   ├── index.ts             # Database client export
│   ├── schema.ts            # Table definitions ⭐ IMPORTANT
│   ├── init.ts              # Database initialization ⭐ NEW
│   ├── add-xp-system.ts     # XP migration
│   └── README.md            # Database documentation
│
├── lib/
│   ├── auth.ts              # NextAuth config
│   ├── xp-system.ts         # XP engine ⭐ NEW (520 lines)
│   ├── utils.ts             # Helper functions
│   └── validation.ts        # Zod schemas
│
└── types/
    └── index.ts             # TypeScript types
```

### Route Groups
```
(auth)      → /login, /register
(dashboard) → /dashboard/*
(public)    → /*, /about, /leaderboard, /achievements
api/        → /api/*
```

---

## 🔌 API Patterns

### Authentication
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const userId = parseInt(session.user.id);
```

### Validation
```typescript
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  published: z.boolean().optional(),
});

const result = schema.safeParse(body);
if (!result.success) {
  return NextResponse.json(
    { error: 'Validation failed', details: result.error.errors },
    { status: 400 }
  );
}

const { title, content } = result.data;
```

### Error Handling
```typescript
try {
  // Operation
} catch (error) {
  console.error('Error context:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

### Response Format
```typescript
// Success
return NextResponse.json({
  success: true,
  data: result,
  message: 'Operation completed', // optional
}, { status: 200 });

// Error
return NextResponse.json({
  error: 'Error message',
  details: [...],  // optional validation errors
}, { status: 400 });
```

---

## 🧪 Testing & Validation

### Before Committing
```bash
# Type check
npm run type-check

# Lint
npm run lint

# Format check
npm run format:check

# All checks
npm run validate
```

### Database Testing
```bash
# Test initialization
npm run db:init

# Open visual browser
npm run db:studio

# Check XP system
# Visit: /api/xp
# Visit: /achievements
```

### Manual Testing Checklist
- [ ] Create a post → Check XP awarded (+15)
- [ ] Create a comment → Check XP awarded (+5)
- [ ] Like a post → Check author gets XP (+2)
- [ ] Create forum post → Check XP awarded (+20)
- [ ] Check `/achievements` page loads
- [ ] Check `/leaderboard` shows XP rankings
- [ ] Verify API responses at `/api/xp`

---

## 🚀 Deployment

### Environment Variables
```env
# Required
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://your-domain.com

# Optional
DISCORD_BOT_TOKEN=your-bot-token
DISCORD_CLIENT_ID=your-client-id
DISCORD_CLIENT_SECRET=your-client-secret
```

### Build Process
```bash
# Type check
npm run type-check

# Build
npm run build

# Start
npm start
```

### First Deployment
```bash
# 1. Set environment variables
# 2. Initialize database
npm run db:init

# 3. Build and start
npm run build
npm start
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "Cannot find module" errors
```bash
npm install
```

#### 2. Database connection errors
```bash
# Check .env has:
TURSO_DATABASE_URL=...
TURSO_AUTH_TOKEN=...

# Test connection
npm run db:studio
```

#### 3. Type errors with database
```typescript
// ✅ Use client for raw SQL
import { client } from '@/db';
await client.execute('SELECT ...');

// ✅ Use db for Drizzle queries
import { db } from '@/db';
await db.select().from(table);
```

#### 4. Migration fails
```bash
# Check if tables already exist (it's OK!)
npm run db:init  # Idempotent - safe to re-run
```

#### 5. XP not awarding
```typescript
// Check imports
import { awardXP, XP_REWARDS } from '@/lib/xp-system';

// Verify userId is a number
const userId = parseInt(session.user.id);

// Check console for errors
console.log('XP result:', result);
```

---

## 📚 Key Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Main project overview and setup |
| `AI_GUIDE.md` | This file - AI assistant guide |
| `src/db/README.md` | Database management guide |
| `docs/XP_INTEGRATION_GUIDE.md` | Complete XP system docs |
| `docs/API.md` | API endpoint reference |
| `docs/DATABASE.md` | Schema documentation |

---

## 🎯 Quick Reference

### Start Development
```bash
npm install
npm run db:init
npm run dev
```

### Common Commands
```bash
npm run dev              # Start Next.js dev server
npm run dev:all          # Start web + Discord bot
npm run db:init          # Initialize database
npm run db:studio        # Visual DB browser
npm run type-check       # TypeScript validation
npm run lint             # Code linting
npm run build            # Production build
```

### XP System Quick Ref

**⚠️ IMPORTANT: Uses Minecraft XP Formula**

The XP system uses **Minecraft's exact leveling formula** for seamless integration with:
- FTB Quests
- Minecraft achievements  
- In-game player levels
- Custom progression mods

**Formula:**
- Levels 1-15: `2n + 7` XP per level
- Levels 16-30: `5n - 38` XP per level
- Levels 31+: `9n - 158` XP per level

**Example XP Requirements:**
- Level 1 → 2: 9 XP
- Level 10 → 11: 27 XP
- Level 20 → 21: 62 XP
- Level 30 → 31: 112 XP
- Level 50 → 51: 292 XP
- Level 100 → 101: 742 XP

```typescript
// Award XP
import { awardXP, XP_REWARDS } from '@/lib/xp-system';
await awardXP(userId, XP_REWARDS.POST_CREATE, 'post_create', postId);

// Check achievements
import { checkAchievements } from '@/lib/xp-system';
await checkAchievements(userId, 'post', postCount);

// Get user XP data
const xpData = await fetch('/api/xp').then(r => r.json());

// Calculate levels (from xp-utils.ts)
import { getLevelFromXP, getTotalXPForLevel } from '@/lib/xp-utils';
const level = getLevelFromXP(1000); // Returns level from total XP
const xpNeeded = getTotalXPForLevel(30); // Returns total XP for level 30
```

### UI Components
```typescript
// XP Badge
import { XPBadge } from '@/components/xp/xp-badge';
<XPBadge level={user.level} xp={user.xp} levelColor="#8338EC" />

// Progress Bar
import { XPProgressBar } from '@/components/xp/xp-progress-bar';
<XPProgressBar currentXP={100} nextLevelXP={150} level={5} />

// Complete Card
import { XPCard } from '@/components/xp/xp-card';
<XPCard />
```

---

## 🤝 Contributing as an AI

### When Making Changes

1. **Always read the schema first** (`src/db/schema.ts`)
2. **Check existing patterns** before creating new ones
3. **Use TypeScript** - never use `any` unless absolutely necessary
4. **Follow naming conventions** - see Code Patterns section
5. **Update documentation** - especially if adding features
6. **Test database changes** - run `npm run db:init` after schema updates
7. **Validate before committing** - run `npm run validate`

### Code Quality Standards

- ✅ Type everything with TypeScript
- ✅ Use Zod for runtime validation
- ✅ Add proper error handling
- ✅ Include JSDoc comments for complex functions
- ✅ Use existing UI patterns (glass, border effects)
- ✅ Keep components small and focused
- ✅ Use Tailwind utility classes (avoid custom CSS)

### Safety Checks

- ⚠️ Never use `db.run()` or `db.all()` - use `client.execute()`
- ⚠️ Always parse `session.user.id` to int for database queries
- ⚠️ Check for null/undefined before accessing nested properties
- ⚠️ Use `safeParse()` for validation, not `parse()`
- ⚠️ Wrap database operations in try-catch

---

## 🎓 Learning Resources

### Understanding This Project

1. **Start here:** Main `README.md`
2. **Database:** `src/db/README.md`
3. **XP System:** `docs/XP_INTEGRATION_GUIDE.md`
4. **API:** `docs/API.md`

### Tech Stack Docs

- [Next.js App Router](https://nextjs.org/docs/app)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)
- [Turso](https://docs.turso.tech/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [NextAuth.js](https://next-auth.js.org/)

---

## 📝 Notes for AI Assistants

### Project Maturity
- **Phase:** Production-ready with active development
- **Database:** Fully migrated with XP system (90% complete)
- **Code Quality:** High - TypeScript, validation, error handling
- **Documentation:** Comprehensive - README, guides, API docs

### Recent Major Updates
- ✅ XP & Leveling System (5 tables, 520-line engine)
- ✅ Achievements (10 seeded, tracking system)
- ✅ Database initialization script (clean setup)
- ✅ LibSQL client migration (from SQLite)

### Known Patterns
- **Styling:** `glass` effect with `border border-color/20`
- **Layout:** `max-w-7xl mx-auto` with `container mx-auto px-4`
- **Colors:** Purple (#8338EC), Blue (#06FFA5), Orange (#FB5607)
- **Icons:** Lucide React exclusively
- **State:** Minimal - prefer server components

### When in Doubt
1. Check existing similar files
2. Read the schema (`src/db/schema.ts`)
3. Look at API patterns in `src/app/api/`
4. Reference this guide
5. Ask the user for clarification

---

**Last Updated:** 2025-01-19  
**Version:** 2.0 (with XP System)  
**Maintainer:** Vonix Network Team

---

## ✨ You're Ready!

You now have everything needed to effectively assist with the Vonix Network project. This guide covers 90% of common tasks. For edge cases, examine existing code patterns and ask the user for context.

**Happy coding! 🚀**
