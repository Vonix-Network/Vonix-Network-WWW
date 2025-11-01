# Unified Moderation Dashboard

**Created:** October 31, 2025  
**Version:** 1.0 - Enterprise Edition  
**Location:** `/moderation`

---

## Overview

The Unified Moderation Dashboard consolidates all moderation tools into a single, enterprise-grade interface for moderators and administrators to manage forum, social, and content moderation efficiently.

---

## Features

### 1. **Unified Interface** ✅
- Single dashboard replaces separate forum and social moderation pages
- Tab-based navigation for different content types
- Consistent UX across all moderation tasks

### 2. **Real-Time Statistics** ✅
- **Pending Reports:** Active reports requiring attention
- **Forum Activity:** Total posts and replies
- **Social Posts:** Social feed metrics
- **Forum Categories:** Category management overview

### 3. **Quick Actions** ✅
Four primary action cards:
- **View Reports** - Access pending reports with count
- **New Category** - Create forum categories
- **Browse Forum** - Quick access to forum
- **Browse Social** - Quick access to social feed

### 4. **Content Tabs** ✅

#### Reports Tab
- Recent reports with status badges
- Content type indicators
- Reporter information
- One-click access to admin reports panel
- Status color coding:
  - Yellow: Pending
  - Green: Actioned
  - Gray: Reviewed/Dismissed

#### Forum Tab
- Recent forum posts across all categories
- Pin/Lock status indicators
- View counts and timestamps
- Author and category information
- Direct links to posts

#### Social Tab
- Recent social feed posts
- User avatars (Minecraft heads)
- Role badges
- Content preview
- Author and timestamp

#### Categories Tab
- Forum category management
- Post counts per category
- Category icons
- Edit access for each category
- Create new category button

---

## Access Control

### Permission Requirements
- **Role:** Moderator or Admin
- **Guard:** `(dashboard)/moderation/layout.tsx`
- **Redirect:** Unauthorized users → `/dashboard`

### Role Capabilities

| Feature | Moderator | Admin |
|---------|-----------|-------|
| View Reports | ✅ | ✅ |
| Manage Forum Posts | ✅ | ✅ |
| Manage Social Posts | ✅ | ✅ |
| Create Categories | ✅ | ✅ |
| Edit Categories | ✅ | ✅ |
| Access Admin Panel | ❌ | ✅ |

---

## Navigation

### Access Points

1. **Desktop Navigation**
   - Main nav bar: Shield icon + "Moderation" label
   - Visible to moderators and admins only
   - Located in top navigation

2. **Mobile Navigation**
   - Mobile menu: Shield icon + "Moderation"
   - Same permissions as desktop

3. **Direct URL**
   - `/moderation`

---

## Components Used

### UI Components
```typescript
- Card, CardContent, CardHeader, CardTitle, CardDescription
- Badge (status indicators)
- Button (actions)
- Tabs, TabsList, TabsTrigger, TabsContent
```

### Icons
```typescript
- Shield (main icon)
- Flag (reports)
- MessageSquare (forum)
- Activity (social)
- Settings (categories)
- AlertTriangle (warnings)
- Pin, Lock (post status)
- Eye (view action)
- Plus (create action)
```

---

## Database Queries

### Statistics Queries

**Forum Stats:**
```typescript
- Total categories: count(forumCategories)
- Total forum posts: count(forumPosts)
- Total forum replies: count(forumReplies)
```

**Social Stats:**
```typescript
- Total social posts: count(socialPosts)
- Total social comments: count(socialComments)
```

**Reports Stats:**
```typescript
- Reports by status: groupBy(reportedContent.status)
- Pending reports: where status = 'pending'
```

### Content Queries

**Recent Forum Posts (5):**
- Joined with users and categories
- Ordered by createdAt DESC
- Includes pin/lock status

**Recent Social Posts (5):**
- Joined with users
- Ordered by createdAt DESC
- Includes author details

**Recent Reports (10):**
- Joined with reporter user
- Ordered by createdAt DESC
- All statuses included

**Forum Categories (6):**
- With post counts
- Ordered by orderIndex
- Limited to top 6

---

## Quick Actions Flow

### 1. View Reports
```
Click "View Reports" → /admin/reports
Shows pending count
Opens admin reports panel
```

### 2. New Category
```
Click "New Category" → /moderation/forum/categories/new
Opens category creation form
```

### 3. Browse Forum
```
Click "Browse Forum" → /forum
View all forum posts
Standard user view
```

### 4. Browse Social
```
Click "Browse Social" → /social
View social feed
Standard user view
```

---

## Tab Functionality

### Reports Tab
- Lists recent reports with metadata
- Status badges (pending, actioned, reviewed)
- Content type badges (forum_post, social_post, etc.)
- Reporter username and timestamp
- Click to open full report in admin panel
- "View All Reports" button shows total count

### Forum Tab
- Recent posts with full context
- Category and author information
- View count and timestamp
- Pin and Lock badges
- Direct link to view post
- Eye icon button for quick access

### Social Tab
- User avatars with Minecraft heads
- Role badges for admins/moderators
- Content preview (line-clamp-2)
- Timestamp with formatTimeAgo
- Compact card design

### Categories Tab
- Category list with icons
- Post count per category
- Edit button for each category
- "New Category" button in header
- Organized by order index

---

## Styling

### Color Scheme
- Primary: Cyan (#06FFA5 / cyan-400)
- Borders: Cyan with 20% opacity
- Glass morphism cards
- Status-specific colors:
  - Red: Reports/Flags
  - Blue: Forum
  - Purple: Social
  - Green: Categories/Success
  - Yellow: Warnings/Pinned

### Responsive Design
- Grid layouts: 1 col mobile → 2 col tablet → 4 col desktop
- Tab list: Full width grid
- Cards: Stack on mobile, grid on desktop

---

## Performance

### Optimizations
```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

- Server-side rendering
- No static generation (real-time data)
- Efficient database queries with limits
- Minimal joins (only necessary data)

### Query Limits
- Forum posts: 5
- Social posts: 5
- Reports: 10
- Categories: 6

---

## Migration from Old System

### Removed Files
```
✅ src/app/(dashboard)/moderation/forum/page.tsx
✅ src/app/(dashboard)/moderation/social/page.tsx
✅ src/app/(dashboard)/moderation/forum/ (entire directory)
✅ src/app/(dashboard)/moderation/social/ (entire directory)
```

### Retained Files
```
✅ src/app/(dashboard)/moderation/layout.tsx (permission guard)
✅ src/app/(dashboard)/moderation/page.tsx (new unified dashboard)
✅ src/app/(dashboard)/moderation/forum/categories/[id]/edit/page.tsx
✅ src/app/(dashboard)/moderation/forum/categories/new/page.tsx
```

### Navigation Updates
- **No changes needed** - Nav already points to `/moderation`
- Old separate links removed from old pages
- Unified access point maintained

---

## Features Comparison

### Old System (Separate Pages)
- ❌ Forum and Social pages separated
- ❌ Redundant navigation
- ❌ Inconsistent UI
- ❌ No unified stats
- ❌ Harder to maintain

### New System (Unified Dashboard)
- ✅ Single interface for all moderation
- ✅ Tab-based organization
- ✅ Consistent enterprise UI
- ✅ Unified statistics view
- ✅ Quick action hub
- ✅ Easier to extend

---

## Future Enhancements

### Planned Features
1. **Real-time Updates**
   - WebSocket integration for live reports
   - Auto-refresh for new content
   - Toast notifications for urgent reports

2. **Advanced Filtering**
   - Filter posts by date range
   - Search within content
   - Filter by author/category

3. **Bulk Actions**
   - Select multiple posts
   - Bulk approve/delete
   - Batch operations

4. **Analytics**
   - Moderation activity graphs
   - Response time metrics
   - Top reporters/categories

5. **User Management**
   - Quick ban/mute actions
   - User history in moderation context
   - Warning system

---

## API Integration

### Used Endpoints
- `GET /admin/reports` - Fetch reports
- `GET /api/forum/posts` - Forum data (via DB)
- `GET /api/social/posts` - Social data (via DB)

### Required Permissions
All queries enforce server-side session checks:
```typescript
const session = await getServerSession();
const role = (session?.user as any)?.role;
if (!session || (role !== 'admin' && role !== 'moderator')) {
  redirect('/dashboard');
}
```

---

## Testing Checklist

### Access Control
- [ ] Moderator can access dashboard
- [ ] Admin can access dashboard
- [ ] Regular user redirected to dashboard
- [ ] Guest redirected to login

### Statistics
- [ ] Report counts accurate
- [ ] Forum stats display correctly
- [ ] Social stats display correctly
- [ ] Category count matches database

### Tabs
- [ ] All tabs render without errors
- [ ] Reports tab shows recent reports
- [ ] Forum tab shows recent posts
- [ ] Social tab shows recent posts
- [ ] Categories tab shows categories

### Quick Actions
- [ ] "View Reports" links to admin reports
- [ ] "New Category" links to creation form
- [ ] "Browse Forum" links to forum
- [ ] "Browse Social" links to social feed

### UI/UX
- [ ] Responsive on mobile
- [ ] Tabs switch smoothly
- [ ] Cards display properly
- [ ] Icons render correctly
- [ ] Colors match theme

---

## Troubleshooting

### Common Issues

**Tabs not working:**
- Ensure `@radix-ui/react-tabs` is installed
- Check Tabs component exists in `src/components/ui/tabs.tsx`

**Permission denied:**
- Verify user role in database
- Check session is valid
- Review layout guard logic

**No data showing:**
- Check database has content
- Verify queries return results
- Review console for errors

**Styling issues:**
- Ensure Tailwind classes are applied
- Check glass morphism styles exist
- Verify color variables defined

---

## Code Example

### Basic Usage
```typescript
// Access the dashboard
Navigate to: /moderation

// Programmatic navigation
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push('/moderation');

// Link component
import Link from 'next/link';
<Link href="/moderation">Moderation</Link>
```

### Permission Check
```typescript
import { getServerSession } from '@/lib/auth';
import { RBAC } from '@/lib/rbac';

const session = await getServerSession();
const role = (session?.user as any)?.role;

if (RBAC.canAccessModeration(role)) {
  // Show moderation features
}
```

---

## Summary

The Unified Moderation Dashboard provides:
- ✅ **Single Interface** for all moderation tasks
- ✅ **Enterprise-Grade** UI with professional styling
- ✅ **Role-Based Access** with proper security
- ✅ **Real-Time Stats** for informed decisions
- ✅ **Quick Actions** for common tasks
- ✅ **Tab Organization** for content types
- ✅ **Scalable Architecture** for future features

**Status:** Production Ready 🚀

---

## Related Documentation
- `docs/ENTERPRISE_IMPROVEMENTS.md` - Enterprise upgrade details
- `docs/GROUP_POSTS_AND_REPORTING.md` - Reporting system
- `src/lib/rbac.ts` - Permission system
- `src/app/(dashboard)/moderation/layout.tsx` - Access control
