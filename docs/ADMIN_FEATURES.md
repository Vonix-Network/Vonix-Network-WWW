# Admin Features Guide

## Overview

Comprehensive guide to all admin panel features in Vonix Network.

## Dashboard

**Location:** `/admin`

**Features:**
- Real-time statistics (users, donations, revenue)
- System health monitoring
- Revenue tracking
- Recent activity feed
- Quick action buttons

## Donor Ranks Management

**Location:** `/admin/donor-ranks`

**Features:**

### Tab 1: Rank Configuration
- Create new ranks
- Edit existing ranks (name, price, colors, badge)
- Delete ranks (with user count warning)
- Visual rank preview
- Stripe product sync
- Real-time WebSocket updates

### Tab 2: User Assignments
- Search users by username/Minecraft name
- View users with ranks (table view)
  - Current rank with color indicator
  - Total donated amount
  - Expiration date with countdown
  - Edit/Remove actions
- View users without ranks
- Assign ranks to users
- Set custom expiration dates
- Update donation totals

**Stripe Integration:**
- Auto-sync button creates Stripe products/prices
- Validates existing product IDs
- Shows sync status per rank
- Handles missing/invalid IDs gracefully

## User Management

**Location:** `/admin/users`

**Features:**
- View all users
- Search and filter
- Edit user details
- Change user roles (user, moderator, admin)
- Delete users (with confirmation)
- View user statistics
- Assign donation ranks directly

**Role Hierarchy:**
- `superadmin` (4) - Full access, database-only assignment
- `admin` (3) - Most admin functions
- `moderator` (2) - Moderation functions
- `user` (1) - Basic access

**Note:** Superadmin role can only be assigned via direct database access for security.

## Reports Management

**Location:** `/admin/reports`

**Features:**
- View all content reports
- Filter by status (pending, reviewed, dismissed, actioned)
- Filter by content type
- Review reports with content preview
- Actions: Dismiss, Mark Reviewed, Take Action
- Optional content deletion
- Pagination support

**Content Types:**
- Social posts
- Forum posts
- Forum replies
- Group posts
- Comments

## Server Management

**Location:** `/admin/servers`

**Features:**
- Add/edit/delete game servers
- Configure server details
- Set BlueMap URLs
- Set CurseForge URLs
- Order servers
- Online status (placeholder - needs implementation)

## Settings

**Location:** `/admin/settings`

**Features:**
- Site-wide background selection
- Email configuration
- System settings
- Feature flags

## Moderation Tools

**Location:** `/moderation`

**Features:**
- Unified dashboard with tabs
- Recent reports
- Forum moderation
- Social post moderation
- Category management
- Quick actions

## Discord Integration

**Location:** `/admin/discord`

**Features:**
- Bot configuration
- Webhook setup
- Role sync settings
- (Requires Discord bot setup)

## Access Control

**Permissions:**
- `RBAC.canAccessAdmin(role)` - Admin panel access
- `RBAC.canAccessModeration(role)` - Moderation access
- `RBAC.canManageUsers(role)` - User management
- `RBAC.canManageDonationRanks(role)` - Rank management

**Always use RBAC helpers instead of hardcoded role checks.**

## Best Practices

### User Management
- Always verify identity before role changes
- Use audit logging
- Keep superadmin role restricted
- Regular permission reviews

### Donation Ranks
- Test Stripe sync in test mode first
- Verify product IDs after sync
- Monitor webhook events
- Keep rank prices consistent

### Reports
- Review reports promptly
- Document actions taken
- Use dismiss for false reports
- Delete content only when necessary

### Security
- Use RBAC helpers consistently
- Never expose admin APIs without auth
- Log all admin actions
- Rate limit admin endpoints
- Regular security audits

## Troubleshooting

**Can't access admin panel:**
- Verify role in database
- Check layout.tsx auth guards
- Clear session and re-login
- Check RBAC permissions

**Stripe sync fails:**
- Verify Stripe API keys
- Check Stripe Dashboard for errors
- Verify rank data in database
- Check API logs

**WebSocket not connecting:**
- Verify WebSocket server running
- Check firewall settings
- Verify WebSocket URL in env
- Check browser console

## Development

**Adding New Admin Features:**

1. Create page in `/admin/[feature]`
2. Add RBAC check in layout
3. Add API endpoint in `/api/admin/[feature]`
4. Add to navigation
5. Add to RBAC permissions
6. Test with different roles
7. Document in this file

**File Structure:**
```
src/
├── app/
│   └── (admin)/
│       └── admin/
│           ├── layout.tsx (auth guard)
│           ├── page.tsx (dashboard)
│           ├── donor-ranks/
│           ├── users/
│           ├── reports/
│           └── ...
├── components/
│   └── admin/
│       ├── donor-ranks-management.tsx
│       ├── donor-ranks-client.tsx
│       └── ...
└── lib/
    └── rbac.ts (permission helpers)
```

## Future Enhancements

**Planned:**
- Advanced user search/filter
- Bulk operations
- Export capabilities (CSV)
- Audit log viewing
- Analytics dashboard
- Email template editor

**Under Consideration:**
- Two-factor auth for admins
- IP whitelist
- Activity logs per user
- Automated backup triggers
