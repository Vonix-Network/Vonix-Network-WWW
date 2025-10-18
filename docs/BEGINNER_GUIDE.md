# Vonix Network - Beginner's Development Guide

Welcome to the Vonix Network development guide! This comprehensive guide will help you get started with JavaScript/Node.js development and contribute to our Minecraft community platform.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Understanding the Tech Stack](#understanding-the-tech-stack)
3. [Setting Up Your Development Environment](#setting-up-your-development-environment)
4. [Project Structure Overview](#project-structure-overview)
5. [Getting Started](#getting-started)
6. [Understanding Key Concepts](#understanding-key-concepts)
7. [Making Your First Changes](#making-your-first-changes)
8. [Common Development Tasks](#common-development-tasks)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)
11. [Resources for Learning](#resources-for-learning)

## Prerequisites

Before diving into this project, you should have:

### Required Knowledge
- **Basic JavaScript**: Variables, functions, objects, arrays
- **HTML/CSS**: Basic understanding of web structure and styling
- **Git**: Version control basics (clone, commit, push, pull)

### Recommended Knowledge
- **React Basics**: Components, props, state, hooks
- **Node.js**: Understanding of server-side JavaScript
- **SQL**: Basic database concepts

### Tools You'll Need
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **Code Editor** - VS Code recommended
- **Database Tool** - SQLite Browser or similar

## Understanding the Tech Stack

Vonix Network is built with modern web technologies:

### Frontend
- **Next.js 14**: React framework with server-side rendering
- **TypeScript**: JavaScript with type safety
- **Tailwind CSS**: Utility-first CSS framework
- **React**: Component-based UI library

### Backend
- **Next.js API Routes**: Server-side API endpoints
- **Drizzle ORM**: Database query builder
- **SQLite**: Lightweight database
- **NextAuth.js**: Authentication system

### Additional Tools
- **Docker**: Containerization for deployment
- **Turso**: Cloud database (production)
- **Discord API**: Bot integration

## Setting Up Your Development Environment

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/Vonix-Network-WWW.git
cd Vonix-Network-WWW
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:
```env
# Database
DATABASE_URL="file:./local.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Discord Bot (Optional)
DISCORD_BOT_TOKEN="your-bot-token"
DISCORD_CHANNEL_ID="your-channel-id"
DISCORD_GUILD_ID="your-guild-id"

# Admin Settings
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your-admin-password"
```

### 4. Generate NextAuth Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Copy the output to your `NEXTAUTH_SECRET` in `.env.local`.

### 5. Initialize Database
```bash
npm run db:generate
npm run db:migrate
```

### 6. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see your application!

## Project Structure Overview

```
Vonix-Network-WWW/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   ├── (public)/          # Public pages
│   │   ├── api/               # API routes
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable React components
│   │   ├── ui/               # Basic UI components
│   │   ├── admin/            # Admin-specific components
│   │   └── social/           # Social features
│   ├── lib/                  # Utility functions and configurations
│   │   ├── auth.ts           # Authentication setup
│   │   ├── db.ts             # Database configuration
│   │   └── utils.ts          # Helper functions
│   └── db/                   # Database schema and migrations
├── public/                   # Static assets
├── docs/                     # Documentation
└── docker/                   # Docker configuration
```

### Key Directories Explained

**`src/app/`**: Next.js 14 uses the App Router. Each folder represents a route:
- `(auth)/` - Authentication pages (login, register)
- `(dashboard)/` - Protected user dashboard
- `(public)/` - Public pages (home, servers, forum)
- `api/` - Backend API endpoints

**`src/components/`**: Reusable React components:
- `ui/` - Basic components (buttons, cards, forms)
- `admin/` - Admin panel components
- `social/` - Social features (posts, comments)

**`src/lib/`**: Shared utilities and configurations:
- `auth.ts` - NextAuth configuration
- `db.ts` - Database connection
- `utils.ts` - Helper functions

## Getting Started

### 1. Understanding Next.js App Router

Next.js 14 uses a file-based routing system. Each folder in `src/app/` creates a route:

```
src/app/
├── page.tsx              # Homepage (/)
├── about/page.tsx        # About page (/about)
├── (auth)/
│   ├── login/page.tsx    # Login page (/login)
│   └── register/page.tsx # Register page (/register)
└── api/
    └── users/route.ts    # API endpoint (/api/users)
```

### 2. Component Structure

React components are functions that return JSX:

```typescript
// src/components/Hello.tsx
interface HelloProps {
  name: string;
  age?: number; // Optional prop
}

export function Hello({ name, age }: HelloProps) {
  return (
    <div className="p-4 bg-blue-500 text-white rounded">
      <h1>Hello, {name}!</h1>
      {age && <p>You are {age} years old.</p>}
    </div>
  );
}
```

### 3. Styling with Tailwind CSS

We use Tailwind CSS for styling. Classes are applied directly to elements:

```jsx
<div className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600">
  Styled button
</div>
```

Common Tailwind classes:
- `bg-*` - Background colors
- `text-*` - Text colors
- `p-*` - Padding
- `m-*` - Margins
- `rounded-*` - Border radius
- `hover:*` - Hover effects

## Understanding Key Concepts

### 1. Server Components vs Client Components

**Server Components** (default):
- Run on the server
- Can access databases directly
- Cannot use browser APIs
- Better performance

```typescript
// Server Component - can access database
export default async function ServerPage() {
  const users = await db.query.users.findMany();
  return <div>{users.map(user => <p key={user.id}>{user.name}</p>)}</div>;
}
```

**Client Components** (use "use client"):
- Run in the browser
- Can use hooks and browser APIs
- Cannot access databases directly

```typescript
'use client';
import { useState } from 'react';

export function ClientComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### 2. Database with Drizzle ORM

We use Drizzle ORM for database operations:

```typescript
// Define schema
export const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  username: text('username').notNull(),
  email: text('email'),
});

// Query data
const allUsers = await db.query.users.findMany();

// Insert data
await db.insert(users).values({
  username: 'john',
  email: 'john@example.com'
});
```

### 3. Authentication with NextAuth

NextAuth handles user authentication:

```typescript
// Check authentication
import { getServerSession } from '@/lib/auth';

export default async function ProtectedPage() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }
  
  return <div>Welcome, {session.user.name}!</div>;
}
```

## Making Your First Changes

### 1. Simple Text Change

Let's change the homepage title:

1. Open `src/app/page.tsx`
2. Find the title text
3. Modify it:

```typescript
<h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
  <span className="gradient-text-animated">Welcome to</span>
  <br />
  <span className="text-white">Vonix Network</span> {/* Change this */}
</h1>
```

### 2. Adding a New Component

Create a new component:

1. Create `src/components/MyComponent.tsx`:

```typescript
interface MyComponentProps {
  title: string;
}

export function MyComponent({ title }: MyComponentProps) {
  return (
    <div className="p-4 border border-blue-500/20 rounded-lg">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="text-gray-400">This is my new component!</p>
    </div>
  );
}
```

2. Use it in a page:

```typescript
import { MyComponent } from '@/components/MyComponent';

export default function MyPage() {
  return (
    <div>
      <MyComponent title="Hello World" />
    </div>
  );
}
```

### 3. Adding a New Page

Create a new page:

1. Create `src/app/my-page/page.tsx`:

```typescript
export default function MyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-4">My New Page</h1>
      <p className="text-gray-400">This is a new page!</p>
    </div>
  );
}
```

2. Visit `/my-page` to see your new page!

## Common Development Tasks

### 1. Adding a New Database Table

1. Define schema in `src/db/schema.ts`:

```typescript
export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  authorId: integer('author_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});
```

2. Generate migration:
```bash
npm run db:generate
```

3. Run migration:
```bash
npm run db:migrate
```

### 2. Creating an API Endpoint

Create `src/app/api/posts/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { posts } from '@/db/schema';

export async function GET() {
  try {
    const allPosts = await db.query.posts.findMany();
    return NextResponse.json(allPosts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newPost = await db.insert(posts).values(body).returning();
    return NextResponse.json(newPost[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
```

### 3. Adding Authentication to a Page

```typescript
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';

export default async function ProtectedPage() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }
  
  return (
    <div>
      <h1>Protected Content</h1>
      <p>Welcome, {session.user.name}!</p>
    </div>
  );
}
```

### 4. Using Forms with Client Components

```typescript
'use client';
import { useState } from 'react';

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        alert('Message sent successfully!');
        setFormData({ name: '', email: '', message: '' });
      }
    } catch (error) {
      alert('Error sending message');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        className="w-full p-3 bg-slate-800 border border-blue-500/20 rounded-lg text-white"
      />
      <button type="submit" className="px-6 py-3 bg-blue-500 text-white rounded-lg">
        Send Message
      </button>
    </form>
  );
}
```

## Best Practices

### 1. Code Organization
- Keep components small and focused
- Use TypeScript interfaces for props
- Group related components in folders
- Use descriptive names for files and functions

### 2. Styling Guidelines
- Use Tailwind CSS classes consistently
- Follow the existing color scheme (blue/purple/pink gradients)
- Use semantic HTML elements
- Ensure responsive design

### 3. Database Best Practices
- Always use migrations for schema changes
- Use transactions for multiple operations
- Validate data before inserting
- Use proper indexes for performance

### 4. Security Considerations
- Validate all user inputs
- Use NextAuth for authentication
- Protect API routes with proper authorization
- Never expose sensitive data in client components

### 5. Performance Tips
- Use Server Components when possible
- Optimize images with Next.js Image component
- Use React.memo for expensive components
- Implement proper caching strategies

## Troubleshooting

### Common Issues

**1. Database Connection Errors**
```bash
# Check if database file exists
ls -la local.db

# Reset database
rm local.db
npm run db:migrate
```

**2. Authentication Issues**
- Check `NEXTAUTH_SECRET` in `.env.local`
- Verify `NEXTAUTH_URL` matches your development URL
- Clear browser cookies and local storage

**3. Build Errors**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

**4. TypeScript Errors**
```bash
# Check TypeScript compilation
npx tsc --noEmit
```

### Getting Help

1. **Check the logs**: Look at the terminal output for error messages
2. **Browser DevTools**: Use F12 to inspect network requests and console errors
3. **GitHub Issues**: Search existing issues or create a new one
4. **Documentation**: Refer to Next.js, React, and Tailwind CSS docs

## Resources for Learning

### JavaScript/Node.js
- [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
- [Node.js Official Docs](https://nodejs.org/docs/)
- [JavaScript.info](https://javascript.info/)

### React/Next.js
- [React Official Tutorial](https://react.dev/learn)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Patterns](https://reactpatterns.com/)

### Database/SQL
- [SQLite Tutorial](https://www.sqlitetutorial.net/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)

### Styling
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [CSS Tricks](https://css-tricks.com/)

### Git/Version Control
- [Git Handbook](https://guides.github.com/introduction/git-handbook/)
- [GitHub Docs](https://docs.github.com/)

### Development Tools
- [VS Code Extensions for React](https://code.visualstudio.com/docs/languages/javascript)
- [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools)

## Next Steps

Once you're comfortable with the basics:

1. **Explore the codebase**: Look at existing components and pages
2. **Make small changes**: Try modifying colors, text, or layout
3. **Add features**: Implement new functionality
4. **Contribute**: Submit pull requests with your improvements
5. **Learn advanced concepts**: Server actions, middleware, optimization

## Getting Help

- **Discord**: Join our development Discord server
- **Issues**: Create GitHub issues for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Code Reviews**: Ask for code reviews on your pull requests

Remember: Everyone was a beginner once! Don't hesitate to ask questions and take your time learning. The Vonix Network community is here to help you grow as a developer.

Happy coding! 🚀
