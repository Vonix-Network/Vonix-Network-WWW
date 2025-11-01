# Migration Guide: Middleware to Layout Guards

**Date:** October 31, 2025  
**Affected:** Authentication & Authorization Flow  
**Impact:** None (backward compatible)

## What Changed?

### Before (Deprecated)
```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const session = await auth();
  // Auth checks for all routes
}
```

### After (Current)
```typescript
// src/app/(dashboard)/layout.tsx
export default async function DashboardLayout() {
  const session = await getServerSession();
  if (!session) redirect('/login');
  return children;
}
```

## Why This Change?

1. **Next.js 16**: Middleware pattern deprecated in favor of layout guards
2. **Performance**: Fewer edge function executions
3. **Clarity**: Auth logic closer to protected routes
4. **Maintainability**: Easier to test and debug

## Migration Steps

### ✅ Already Done
1. Created layout guards in:
   - `(auth)/layout.tsx` - Redirects logged-in users
   - `(dashboard)/layout.tsx` - Requires authentication
   - `(dashboard)/admin/layout.tsx` - Requires admin role
   - `(dashboard)/moderation/layout.tsx` - Requires moderator role

2. Disabled old middleware:
   - Renamed to `src/middleware.ts.backup`

3. Updated event creation:
   - Server-side role check in page component
   - API enforcement maintained

### No Action Required

All routes continue to work as before. No changes to:
- User experience
- API endpoints
- Database schema
- Component logic

## Verification

Test these flows to confirm everything works:

### 1. Guest Access
```bash
# Should redirect to login
curl -I http://localhost:3000/dashboard
# Expected: 307 to /login
```

### 2. User Access
```bash
# Login as regular user, try admin
curl -I http://localhost:3000/admin
# Expected: 307 to /dashboard
```

### 3. Admin Access
```bash
# Login as admin
curl http://localhost:3000/admin
# Expected: 200 OK
```

### 4. Logged-in Login Access
```bash
# Already logged in, visit /login
curl -I http://localhost:3000/login
# Expected: 307 to /dashboard
```

## Rollback Plan

If issues arise:
1. Rename `src/middleware.ts.backup` to `src/middleware.ts`
2. Remove layout guards (keep layouts but remove redirect logic)
3. Restart server

## New RBAC System

Added centralized permission checking:

```typescript
import { RBAC } from '@/lib/rbac';

// Check permissions
const canEdit = RBAC.hasPermission(userRole, 'post', 'update');
const canModerate = RBAC.canAccessModeration(userRole);

// API helpers
const { authorized, error } = requireAdmin(userRole);
if (!authorized) {
  return NextResponse.json({ error }, { status: 403 });
}
```

## Troubleshooting

### Issue: Infinite Redirect Loop
**Solution:** Check if layout is calling itself recursively

### Issue: 401 on Protected Routes
**Solution:** Verify session is valid, check `NEXTAUTH_SECRET`

### Issue: Admin Can't Access Panel
**Solution:** Check `session.user.role` is set correctly

### Issue: Users Can Still Access Admin
**Solution:** Clear browser cache and cookies

## Support

See full documentation:
- `docs/ENTERPRISE_IMPROVEMENTS.md`
- `docs/SESSION_SECURITY.md`
- `src/lib/rbac.ts`

## Questions?

Check the implementation in these files:
- Layout guards: `src/app/(dashboard)/*/layout.tsx`
- RBAC system: `src/lib/rbac.ts`
- Old middleware: `src/middleware.ts.backup`
