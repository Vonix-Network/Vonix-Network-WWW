# CASL Permissions System Implementation Plan

## Executive Summary

**What is CASL?** CASL (pronounced "castle") is an isomorphic authorization JavaScript library which restricts what resources a given user is allowed to access. It implements Attribute-Based Access Control (ABAC), which is more flexible than Role-Based Access Control (RBAC).

**Why CASL for Vonix Network?**
- ✅ **Fine-grained control** - Control access to specific fields, not just resources
- ✅ **Conditional permissions** - "Can edit post if author" or "Can delete if created < 5 min ago"
- ✅ **Isomorphic** - Same rules work on frontend and backend
- ✅ **TypeScript support** - Type-safe permission definitions
- ✅ **Dynamic** - Permissions can change based on context
- ✅ **Scalable** - Handles complex permission hierarchies

## Current vs Proposed System

### Current RBAC System (src/lib/rbac.ts)

```typescript
// Simple role-based checks
RBAC.canAccessAdmin(userRole);           // true if admin/superadmin
RBAC.canModifyUser(modifierRole, targetRole);
RBAC.canCreateEvents(userRole);
```

**Limitations:**
- ❌ Can't check "own content"
- ❌ No time-based permissions
- ❌ No field-level permissions
- ❌ Hard to extend for complex rules

### Proposed CASL System

```typescript
// Flexible attribute-based checks
ability.can('read', 'Post');                    // Can read any post?
ability.can('update', post);                    // Can update this specific post?
ability.can('update', 'Post', 'title');         // Can update post titles?
ability.can('delete', post, 'if authorId = userId');  // Conditional
```

**Advantages:**
- ✅ Check ownership automatically
- ✅ Time-based rules (e.g., can delete within 5 min)
- ✅ Field-level control (can edit title but not slug)
- ✅ Extensible for future features

## Implementation Plan

### Phase 1: Foundation (Week 1)
**Goal:** Install and configure CASL

#### Tasks:
1. **Install CASL**
   ```bash
   npm install @casl/ability @casl/react
   npm install --save-dev @casl/types
   ```

2. **Create ability definition file**
   - File: `src/lib/casl/ability.ts`
   - Define all actions (create, read, update, delete, manage)
   - Define all subjects (User, Post, Comment, Event, etc.)

3. **Create ability factory**
   - File: `src/lib/casl/defineAbilityFor.ts`
   - Function that creates abilities based on user role/data
   - Export type-safe ability builder

4. **Add to session**
   - Update NextAuth to include user abilities
   - Cache abilities in session
   - Refresh on role change

#### Deliverables:
- ✅ CASL installed and configured
- ✅ Basic ability definitions for all roles
- ✅ Type-safe ability builder
- ✅ Session integration

---

### Phase 2: Core Permissions (Week 2)
**Goal:** Implement CASL for main features

#### 2.1 Social Posts

```typescript
// Define abilities
defineAbilityFor(user) {
  can('read', 'Post');  // Everyone can read
  
  if (user) {
    can('create', 'Post');
    can('update', 'Post', { userId: user.id });  // Own posts only
    can('delete', 'Post', { userId: user.id, createdAt: { $gt: Date.now() - 5*60*1000 } });
  }
  
  if (user.role === 'moderator' || user.role === 'admin') {
    can('delete', 'Post');  // Any post
    can('pin', 'Post');
  }
}
```

**Update Components:**
- `src/components/social/post-card.tsx` - Use CASL for edit/delete buttons
- `src/app/api/social/posts/[id]/route.ts` - Validate with CASL

#### 2.2 Forum Posts

```typescript
defineAbilityFor(user) {
  can('read', 'ForumPost', { isLocked: false });
  
  if (user) {
    can('create', 'ForumPost');
    can('update', 'ForumPost', { userId: user.id, isLocked: false });
    can('reply', 'ForumPost', { isLocked: false });
  }
  
  if (user.role === 'moderator' || user.role === 'admin') {
    can('update', 'ForumPost');
    can('delete', 'ForumPost');
    can('lock', 'ForumPost');
    can('pin', 'ForumPost');
  }
}
```

**Update Components:**
- `src/components/forum/post-actions.tsx` - Use CASL
- `src/app/api/forum/posts/[id]/route.ts` - Validate with CASL

#### 2.3 User Management

```typescript
defineAbilityFor(user) {
  if (user.role === 'admin') {
    can('read', 'User');
    can('update', 'User', { role: { $in: ['user', 'moderator'] } });
    can('delete', 'User', { role: { $in: ['user', 'moderator'] } });
  }
  
  if (user.role === 'superadmin') {
    can('manage', 'User');  // All operations
  }
  
  // Everyone can update their own profile
  can('update', 'User', { id: user.id }, ['bio', 'avatar', 'email']);
}
```

#### Deliverables:
- ✅ Social posts use CASL
- ✅ Forum posts use CASL
- ✅ User management uses CASL
- ✅ All API routes validate with CASL

---

### Phase 3: Advanced Features (Week 3)
**Goal:** Implement complex permission scenarios

#### 3.1 Time-Based Permissions

```typescript
// Can delete own post within 5 minutes
can('delete', 'Post', {
  userId: user.id,
  createdAt: { $gt: Date.now() - 5*60*1000 }
});

// Can edit comment within 15 minutes
can('update', 'Comment', {
  userId: user.id,
  createdAt: { $gt: Date.now() - 15*60*1000 }
});
```

#### 3.2 Field-Level Permissions

```typescript
// Users can update bio and avatar, but not role
can('update', 'User', { id: user.id }, ['bio', 'avatar', 'email']);

// Moderators can update post content but not author
can('update', 'Post', ['content', 'title'], { reported: true });
```

#### 3.3 Conditional Rules

```typescript
// Can approve event if moderator and event is pending
can('approve', 'Event', {
  status: 'pending',
  $and: [
    { $expr: { $eq: ['$userId', user.id] } },  // Not own event
    { role: { $in: ['moderator', 'admin'] } }
  ]
});
```

#### 3.4 Donation Rank Permissions

```typescript
// Donation rank determines what they can access
if (user.donationRank) {
  const rank = donationRanks.find(r => r.id === user.donationRankId);
  
  if (rank.level >= 3) {  // VIP+
    can('access', 'VIPChat');
    can('use', 'ColoredNames');
  }
  
  if (rank.level >= 5) {  // MVP
    can('access', 'MVPLounge');
    can('use', 'CustomPrefix');
  }
}
```

#### Deliverables:
- ✅ Time-based permissions implemented
- ✅ Field-level permissions working
- ✅ Donation rank permissions integrated
- ✅ Complex conditional rules functional

---

### Phase 4: UI Integration (Week 4)
**Goal:** Create React components for permission checking

#### 4.1 React Hooks

```typescript
// src/hooks/useAbility.ts
export function useAbility() {
  const { data: session } = useSession();
  return defineAbilityFor(session?.user);
}

// src/hooks/useCan.ts
export function useCan(action: string, subject: any) {
  const ability = useAbility();
  return ability.can(action, subject);
}
```

#### 4.2 React Components

```typescript
// src/components/permissions/Can.tsx
export function Can({ I, a, this: subject, children }) {
  const ability = useAbility();
  
  if (!ability.can(I, subject, a)) {
    return null;
  }
  
  return <>{children}</>;
}

// Usage in components:
<Can I="update" this={post}>
  <button onClick={handleEdit}>Edit</button>
</Can>

<Can I="delete" a="Post">
  <button onClick={handleDelete}>Delete</button>
</Can>
```

#### 4.3 Form Field Permissions

```typescript
// src/components/permissions/FieldPermission.tsx
export function FieldPermission({ field, subject, children }) {
  const ability = useAbility();
  
  if (!ability.can('update', subject, field)) {
    return null;  // or return disabled input
  }
  
  return <>{children}</>;
}

// Usage:
<FieldPermission field="role" subject={user}>
  <Select value={user.role} onChange={handleRoleChange} />
</FieldPermission>
```

#### Deliverables:
- ✅ React hooks for ability checking
- ✅ `<Can>` component for conditional rendering
- ✅ Field-level permission components
- ✅ All UI uses CASL for permissions

---

### Phase 5: API Validation (Week 5)
**Goal:** Server-side permission validation

#### 5.1 API Middleware

```typescript
// src/lib/casl/api-validation.ts
export function requireAbility(
  req: NextRequest,
  action: string,
  subject: any
) {
  const session = await getServerSession();
  const ability = defineAbilityFor(session?.user);
  
  if (!ability.can(action, subject)) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  return null;  // Permission granted
}

// Usage in API routes:
export async function PATCH(req: NextRequest) {
  const post = await getPost(id);
  
  const forbidden = await requireAbility(req, 'update', post);
  if (forbidden) return forbidden;
  
  // Continue with update...
}
```

#### 5.2 Database Query Helpers

```typescript
// src/lib/casl/query-helpers.ts
export function accessibleBy(ability: Ability, action: string, subject: string) {
  const rules = ability.rulesFor(action, subject);
  return rules.map(rule => rule.conditions);  // Convert to SQL WHERE
}

// Usage:
const posts = await db.query.posts.findMany({
  where: accessibleBy(ability, 'read', 'Post')
});
```

#### Deliverables:
- ✅ API middleware for permission checking
- ✅ Database query helpers
- ✅ All API routes use CASL validation
- ✅ Type-safe API permissions

---

## Technical Architecture

### Directory Structure

```
src/
├── lib/
│   ├── casl/
│   │   ├── ability.ts           # Ability definitions and types
│   │   ├── defineAbilityFor.ts  # Factory function
│   │   ├── api-validation.ts    # Server-side validation
│   │   ├── query-helpers.ts     # Database query integration
│   │   └── subjects/            # Subject type definitions
│   │       ├── post.ts
│   │       ├── user.ts
│   │       ├── comment.ts
│   │       └── event.ts
│   └── rbac.ts                  # Legacy RBAC (deprecated)
├── hooks/
│   ├── useAbility.ts
│   ├── useCan.ts
│   └── usePermissions.ts
├── components/
│   └── permissions/
│       ├── Can.tsx
│       ├── FieldPermission.tsx
│       └── PermissionGate.tsx
```

### Type Definitions

```typescript
// src/lib/casl/ability.ts
import { Ability, AbilityBuilder } from '@casl/ability';

export type Actions = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage'  // All actions
  | 'pin'
  | 'lock'
  | 'approve'
  | 'reject';

export type Subjects = 
  | 'User'
  | 'Post'
  | 'Comment'
  | 'ForumPost'
  | 'ForumReply'
  | 'Event'
  | 'Group'
  | 'Message'
  | 'Report'
  | 'Settings'
  | 'all';  // All subjects

export type AppAbility = Ability<[Actions, Subjects]>;

export function createAppAbility() {
  return new AbilityBuilder<AppAbility>(Ability);
}
```

### Ability Factory

```typescript
// src/lib/casl/defineAbilityFor.ts
import { AppAbility, createAppAbility } from './ability';
import { UserRole } from '@/types/next-auth';

interface User {
  id: number;
  role: UserRole;
  donationRankId?: string | null;
  // ... other fields
}

export function defineAbilityFor(user?: User | null): AppAbility {
  const { can, cannot, build } = createAppAbility();

  if (!user) {
    // Guest permissions
    can('read', 'Post');
    can('read', 'ForumPost');
    return build();
  }

  // Authenticated user permissions
  can('create', ['Post', 'Comment', 'ForumPost', 'ForumReply']);
  can('update', 'Post', { userId: user.id });
  can('delete', 'Post', { userId: user.id });
  can('update', 'User', { id: user.id }, ['bio', 'avatar', 'email']);

  // Moderator permissions
  if (user.role === 'moderator' || user.role === 'admin' || user.role === 'superadmin') {
    can('manage', ['Post', 'Comment', 'ForumPost', 'ForumReply']);
    can('read', 'Report');
    can('pin', ['Post', 'ForumPost']);
    can('lock', 'ForumPost');
  }

  // Admin permissions
  if (user.role === 'admin' || user.role === 'superadmin') {
    can('manage', 'User');
    can('manage', 'Event');
    can('manage', 'Settings');
    cannot('update', 'User', { role: 'superadmin' });
    cannot('delete', 'User', { role: 'superadmin' });
  }

  // Superadmin permissions
  if (user.role === 'superadmin') {
    can('manage', 'all');  // Full access
  }

  return build();
}
```

## Migration Strategy

### Option 1: Gradual Migration (Recommended)

1. **Week 1-2:** Install CASL, keep RBAC
2. **Week 3-4:** Migrate social features to CASL
3. **Week 5-6:** Migrate forum features to CASL
4. **Week 7-8:** Migrate admin features to CASL
5. **Week 9:** Remove RBAC, use CASL everywhere

**Advantages:**
- ✅ Low risk
- ✅ Can test CASL alongside RBAC
- ✅ Easy rollback if issues
- ✅ Team can learn gradually

### Option 2: Big Bang Migration

1. **Week 1:** Install and configure CASL
2. **Week 2:** Migrate all features at once
3. **Week 3:** Remove RBAC

**Advantages:**
- ✅ Faster implementation
- ✅ No dual system complexity

**Disadvantages:**
- ❌ Higher risk
- ❌ Harder to test
- ❌ All-or-nothing

**Recommendation:** Use Option 1 (Gradual Migration)

## Performance Considerations

### Caching Strategies

```typescript
// Cache abilities per session
const abilityCache = new Map<string, AppAbility>();

export function getCachedAbility(userId: string, user: User) {
  if (abilityCache.has(userId)) {
    return abilityCache.get(userId)!;
  }
  
  const ability = defineAbilityFor(user);
  abilityCache.set(userId, ability);
  return ability;
}

// Clear cache on role change
export function clearAbilityCache(userId: string) {
  abilityCache.delete(userId);
}
```

### Database Query Optimization

```typescript
// Convert CASL rules to SQL WHERE clauses
import { accessibleBy } from '@casl/ability/extra';

const ability = defineAbilityFor(user);
const posts = await db.query.posts.findMany({
  where: and(
    accessibleBy(ability, 'read').Post,  // CASL conditions
    eq(posts.status, 'published')         // Additional filters
  )
});
```

### Bundle Size

- CASL core: ~6KB gzipped
- @casl/react: ~2KB gzipped
- Total impact: ~8KB (minimal)

## Benefits vs Current System

| Feature | RBAC | CASL |
|---------|------|------|
| Role-based | ✅ | ✅ |
| Own content checks | ❌ | ✅ |
| Time-based rules | ❌ | ✅ |
| Field-level permissions | ❌ | ✅ |
| Conditional logic | Limited | ✅ |
| Frontend/Backend sync | Manual | ✅ |
| Type safety | Partial | ✅ |
| Extensibility | Low | High |
| Learning curve | Easy | Moderate |
| Bundle size | 0KB | 8KB |

## Recommendations

### Short Term (Next 2 Months)
**Decision:** Stick with RBAC for now

**Reasons:**
1. RBAC is working well for current needs
2. Team is familiar with it
3. No immediate complex permission requirements

**When to reconsider:**
- Need field-level permissions
- Need time-based rules
- Need complex conditional logic
- Team size grows and needs more structure

### Long Term (6+ Months)
**Decision:** Plan CASL migration

**Reasons:**
1. Scalability as features grow
2. More granular control needed
3. Better developer experience
4. Industry best practice

**Prerequisites:**
1. Document all current permissions
2. Identify complex permission scenarios
3. Team training on CASL
4. Plan gradual migration

## Cost-Benefit Analysis

### Costs
- **Development Time:** 4-6 weeks full migration
- **Learning Curve:** 1-2 weeks for team
- **Testing:** 2-3 weeks comprehensive testing
- **Documentation:** 1 week
- **Total:** ~8-12 weeks

### Benefits
- **Flexibility:** 10x more flexible than RBAC
- **Maintainability:** Easier to add new permissions
- **Security:** Fine-grained control reduces bugs
- **Developer Experience:** Type-safe, intuitive API
- **Future-proof:** Scales with app complexity

### ROI Timeline
- **Month 1-3:** Negative (development cost)
- **Month 4-6:** Break-even (reduced bugs, faster features)
- **Month 7+:** Positive (faster development, fewer permission bugs)

## Conclusion

**Should you implement CASL now?** 

**For Vonix Network:** **Not immediately, but plan for future**

**Why wait:**
- Current RBAC handles 90% of needs
- Focus on features, not infrastructure
- Team capacity may be limited
- No urgent complex permission requirements

**When to implement:**
- When you need field-level permissions
- When you need time-based rules
- When admin tools become more complex
- When you have 2+ developers working on permissions

**Action Items:**
1. ✅ **Now:** Document current RBAC limitations
2. ✅ **Month 3:** Evaluate if CASL is needed
3. ✅ **Month 6:** Create detailed migration plan
4. ✅ **Month 9:** Begin gradual CASL migration if justified

---

**Created:** November 1, 2025  
**Author:** Vonix Network Development Team  
**Status:** Planning Phase  
**Priority:** Medium (Future Enhancement)
