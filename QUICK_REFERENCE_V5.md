# NextAuth v5 Quick Reference

## Server Components & API Routes

### ✅ Use `auth()` directly
```typescript
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Access user data
  const userId = session.user.id;
  const role = session.user.role;
  const username = session.user.username;
}
```

### ✅ Helper Functions Available
```typescript
import { requireAuth, requireAdmin, requireModerator } from '@/lib/auth';

// Throws error if not authenticated
const session = await requireAuth();

// Throws error if not admin
const session = await requireAdmin();

// Throws error if not admin or moderator
const session = await requireModerator();
```

## Client Components

### ✅ Hooks (No changes from v4)
```typescript
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

function MyComponent() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'unauthenticated') return <div>Not logged in</div>;
  
  return (
    <div>
      <p>Welcome {session?.user?.username}</p>
      <button onClick={() => signOut()}>Logout</button>
    </div>
  );
}
```

### ✅ Login Form
```typescript
import { signIn } from 'next-auth/react';

const result = await signIn('credentials', {
  username: 'user',
  password: 'pass',
  redirect: false,
});

if (result?.ok) {
  // Success
}
```

## Middleware

### ✅ Auth in Middleware
```typescript
import { auth } from '../auth';

export async function middleware(request: NextRequest) {
  const session = await auth();
  const user = session?.user;
  
  if (!user) {
    // Not authenticated
  }
  
  if (user.role === 'admin') {
    // Is admin
  }
}
```

## Custom User Properties

All custom properties are available on `session.user`:
- `id: string`
- `username?: string`
- `role: string`
- `minecraftUsername?: string`
- `minecraftUuid?: string`
- `avatar?: string`
- `name?: string | null`
- `email?: string | null`

## Common Patterns

### Check Authentication in Server Component
```typescript
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Page() {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }
  
  return <div>Protected content</div>;
}
```

### Check Role in API Route
```typescript
import { auth } from '@/lib/auth';

export async function POST() {
  const session = await auth();
  
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Admin-only logic
}
```

### Rate Limiting (Built-in)
The auth configuration includes built-in rate limiting:
- 5 login attempts per 15 minutes per IP
- Automatically enforced in the authorize callback

## Environment Variables

Required in `.env.local`:
```env
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000  # Auto-detected in development
```

## Testing Commands

```bash
# Type check
npm run type-check

# Build
npm run build

# Development
npm run dev

# Production
npm run start
```

## Important Notes

1. **No Database Changes**: JWT session strategy means no database migration needed
2. **Client Components Unchanged**: All `useSession()` code works as before
3. **SessionProvider**: Still required in `providers.tsx` - no changes needed
4. **Backwards Compatible**: Helper functions in `src/lib/auth.ts` provide compatibility layer

## Troubleshooting

### "Cannot find module '@/auth'"
- Ensure `/auth.ts` exists in project root
- Check TypeScript path aliases in `tsconfig.json`

### Session returns null
- Verify `NEXTAUTH_SECRET` is set
- Check middleware isn't blocking the request
- Ensure cookies are enabled

### Type errors on session.user
- Check `src/types/next-auth.d.ts` is present
- Restart TypeScript server in IDE

## Resources

- [NextAuth.js v5 Docs](https://authjs.dev)
- [Migration Guide](./NEXTAUTH_V5_MIGRATION.md)
- [Completion Report](./NEXTAUTH_V5_COMPLETE.txt)
