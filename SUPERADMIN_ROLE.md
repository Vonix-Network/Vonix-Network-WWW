# Superadmin Role System

## Overview

The **superadmin** role is the highest privilege level in Vonix Network. It provides complete system access and can only be assigned via direct database modification to prevent unauthorized elevation.

## Role Hierarchy

```
superadmin (Level 4) - Highest privilege
    ↓
admin (Level 3) - Can manage users/moderators
    ↓
moderator (Level 2) - Can moderate content
    ↓
user (Level 1) - Standard user
```

## Key Features

### 🔒 Security Protections

1. **Database-Only Assignment**
   - Superadmin role **cannot** be assigned through the UI
   - Must be set directly in the database
   - Prevents privilege escalation attacks

2. **Modification Protection**
   - Only superadmins can modify other superadmin accounts
   - Regular admins cannot edit, delete, or change superadmin users
   - API endpoints enforce this protection

3. **Role Assignment Restrictions**
   - Superadmins can assign: user, moderator, admin (but NOT superadmin)
   - Admins can assign: user, moderator (but NOT admin or superadmin)
   - Moderators cannot assign roles

### ✨ UI Features

- **Golden Badge**: Superadmins display with a gradient golden badge
- **Star Icon**: Yellow filled star icon identifies superadmin role
- **Protected Warning**: Edit modal shows warning when non-superadmins view superadmin users
- **Disabled Fields**: Form fields are disabled for protected users

## How to Assign Superadmin Role

### Method 1: Direct Database Update (Turso CLI)

```bash
# Connect to your Turso database
turso db shell vonix-network-vonix-network

# Update user role to superadmin
UPDATE users SET role = 'superadmin' WHERE id = YOUR_USER_ID;

# Or by username
UPDATE users SET role = 'superadmin' WHERE username = 'your_username';

# Verify the change
SELECT id, username, email, role FROM users WHERE role = 'superadmin';
```

### Method 2: Using Drizzle Studio

1. Run Drizzle Studio:
   ```bash
   npx drizzle-kit studio
   ```

2. Navigate to the `users` table
3. Find your user record
4. Edit the `role` field to `superadmin`
5. Save changes

### Method 3: SQL Script

Create a migration file:

```typescript
// migrations/add-superadmin.ts
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function promoteTo

Superadmin(username: string) {
  await db
    .update(users)
    .set({ role: 'superadmin' })
    .where(eq(users.username, username));
  
  console.log(`✅ ${username} promoted to superadmin`);
}

// Run: tsx migrations/add-superadmin.ts
promoteTOSuperadmin('your_username');
```

## Permissions

### Superadmin Can:

✅ Access all admin panel features  
✅ Modify any user account (including other superadmins)  
✅ Delete any user account (including other superadmins)  
✅ Assign user, moderator, and admin roles  
✅ Access all moderation tools  
✅ Manage system settings  
✅ View all reports  
✅ Create/edit events  
✅ Manage donation ranks  
✅ Full database access  

### Superadmin Cannot:

❌ Assign superadmin role through the UI (database only)  
❌ Be modified by regular admins  
❌ Be deleted by regular admins  

### Admin Can:

✅ Modify users and moderators  
✅ Delete users and moderators  
✅ Assign user and moderator roles  
✅ Access admin panel  
✅ Manage most system features  

### Admin Cannot:

❌ Assign admin or superadmin roles  
❌ Modify superadmin accounts  
❌ Delete superadmin accounts  
❌ View superadmin-only features  

## API Protection

### Protected Endpoints

All user modification endpoints check roles:

```typescript
// /api/admin/users/[id] - PATCH
// Prevents non-superadmins from modifying superadmins
if (targetUser.role === 'superadmin' && session.user.role !== 'superadmin') {
  return 403 Forbidden
}

// /api/admin/users/[id] - DELETE  
// Prevents non-superadmins from deleting superadmins
if (targetUser.role === 'superadmin' && session.user.role !== 'superadmin') {
  return 403 Forbidden
}

// Role assignment validation
if (role === 'superadmin') {
  return 403 "Superadmin role can only be assigned via direct database access"
}

if (role === 'admin' && session.user.role !== 'superadmin') {
  return 403 "Only superadmins can assign admin role"
}
```

## RBAC Implementation

### File Locations

- **Schema**: `src/db/schema.ts` - Role enum definition
- **Types**: `src/types/next-auth.d.ts` - TypeScript types
- **RBAC**: `src/lib/rbac.ts` - Permission system
- **API Protection**: `src/app/api/admin/users/[id]/route.ts`
- **UI**: `src/app/(dashboard)/admin/users/page.tsx`

### Key Functions

```typescript
// Check if user is superadmin
RBAC.isSuperAdmin(userRole) // Returns boolean

// Check if user can modify another user
RBAC.canModifyUser(modifierRole, targetRole) // Returns boolean

// Check if role can be assigned
RBAC.canAssignRole(assignerRole, roleToAssign) // Returns boolean

// Helper for API routes
requireSuperAdmin(userRole) // Returns { authorized, error? }
```

## Best Practices

### Security

1. **Limit Superadmins**: Only assign to trusted individuals
2. **Monitor Changes**: Log all superadmin actions
3. **Regular Audits**: Review superadmin list quarterly
4. **Backup Before Changes**: Always backup before modifying roles

### Usage

1. **Initial Setup**: Assign yourself as first superadmin
2. **Team Members**: Add superadmins as needed for system maintenance
3. **Separation**: Use regular admin accounts for day-to-day tasks
4. **Emergency Access**: Keep at least 2 superadmin accounts

### Migration

If upgrading from an existing system:

```sql
-- Find all current admins
SELECT id, username, email, role FROM users WHERE role = 'admin';

-- Promote specific admins to superadmin
UPDATE users SET role = 'superadmin' 
WHERE username IN ('founder', 'lead_dev', 'system_admin');

-- Verify
SELECT COUNT(*) FROM users WHERE role = 'superadmin';
```

## Troubleshooting

### Issue: Can't edit superadmin user

**Cause**: You're logged in as a regular admin  
**Solution**: Only superadmins can edit superadmin accounts

### Issue: Can't assign admin role

**Cause**: You're logged in as a regular admin  
**Solution**: Only superadmins can assign admin role

### Issue: Superadmin not showing in UI

**Cause**: UI protection is working correctly  
**Solution**: This is intentional - superadmin role is hidden from non-superadmins

### Issue: Need to revoke superadmin

```sql
-- Demote to regular admin
UPDATE users SET role = 'admin' WHERE id = USER_ID;

-- Verify
SELECT username, role FROM users WHERE id = USER_ID;
```

## Database Schema

```typescript
// src/db/schema.ts
export const users = sqliteTable('users', {
  // ...other fields
  role: text('role', { 
    enum: ['user', 'moderator', 'admin', 'superadmin'] 
  }).default('user').notNull(),
});
```

## Example Queries

### List All Superadmins

```sql
SELECT 
  id,
  username,
  email,
  minecraftUsername,
  createdAt
FROM users 
WHERE role = 'superadmin'
ORDER BY createdAt ASC;
```

### Audit Trail

```sql
-- Check recent role changes (requires audit log table)
SELECT 
  u.username,
  al.action,
  al.changedBy,
  al.timestamp
FROM audit_log al
JOIN users u ON u.id = al.userId
WHERE al.field = 'role' 
  AND al.newValue = 'superadmin'
ORDER BY al.timestamp DESC;
```

### User Counts by Role

```sql
SELECT 
  role,
  COUNT(*) as count
FROM users
GROUP BY role
ORDER BY 
  CASE role
    WHEN 'superadmin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'moderator' THEN 3
    WHEN 'user' THEN 4
  END;
```

## Support

If you have questions about the superadmin system:

1. Check this documentation
2. Review `src/lib/rbac.ts` for permission logic
3. Test in development environment first
4. Contact system administrator for database access

---

**Last Updated**: November 1, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
