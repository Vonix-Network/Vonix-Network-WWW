# Enhanced Navigation System

## Overview

The Enhanced Navigation (`EnhancedNav`) is a scalable, dropdown-based navigation system designed to handle a large number of menu items efficiently. It replaces the previous `UnifiedNav` component with a more flexible architecture.

## Key Features

- **Dropdown Menus**: Organize related navigation items into collapsible dropdowns
- **Scalable Architecture**: Easily add new items without cluttering the UI
- **Mobile Mega-Menu**: Organized mobile navigation with section headers
- **Role-Based Display**: Different navigation items for guests, users, moderators, and admins
- **Neon Brand Aesthetic**: Consistent cyan gradient theme throughout
- **Active State Tracking**: Highlights active sections and subsections
- **Click-Outside Closing**: Dropdowns close when clicking outside
- **Keyboard Accessible**: Full keyboard navigation support

## Navigation Structure

### Public Users (Guests)
```
Home
Community ▼
  ├─ Forum
  ├─ Social Feed
  ├─ Groups
  └─ Events
Gaming ▼
  ├─ Servers
  ├─ Leaderboard
  └─ Ranks
Blog
Donate
```

### Authenticated Users
```
Dashboard
Community ▼
  ├─ Social Feed
  ├─ Groups
  ├─ Forum
  ├─ Events
  └─ Messages
Gaming ▼
  ├─ Servers
  ├─ Leaderboard
  └─ Ranks
Search
[Notifications]
[User Menu ▼]
  ├─ View Profile
  ├─ Settings
  └─ Logout
```

### Moderators (Additional)
```
Moderation (cyan button)
```

### Admins (Additional)
```
Moderation (cyan button)
Admin Dashboard (purple button)
```

## Implementation

### Component Location
```
src/components/nav/enhanced-nav.tsx
```

### Usage in Layouts

**Public Layout** (`src/app/(public)/layout.tsx`):
```tsx
import { EnhancedNav } from '@/components/nav/enhanced-nav';

export default async function PublicLayout({ children }) {
  const session = await getServerSession();
  return (
    <>
      <EnhancedNav user={session?.user} />
      <main>{children}</main>
    </>
  );
}
```

**Dashboard Layout** (`src/app/(dashboard)/layout.tsx`):
```tsx
import { EnhancedNav } from '@/components/nav/enhanced-nav';

export default async function DashboardLayout({ children }) {
  const session = await getServerSession();
  if (!session) redirect('/login');
  
  return (
    <>
      <EnhancedNav user={session.user} />
      <main>{children}</main>
    </>
  );
}
```

## Adding New Navigation Items

### Single Link Item
```tsx
{ 
  href: '/new-page', 
  label: 'New Page', 
  icon: IconComponent 
}
```

### Dropdown Item
```tsx
{
  label: 'Section Name',
  icon: IconComponent,
  dropdown: [
    { href: '/sub-page-1', label: 'Sub Page 1', icon: SubIcon1 },
    { href: '/sub-page-2', label: 'Sub Page 2', icon: SubIcon2 },
    { href: '/sub-page-3', label: 'Sub Page 3', icon: SubIcon3 },
  ]
}
```

### Example: Adding a "Help" Dropdown

```tsx
// In publicNavItems or dashboardNavItems
{
  label: 'Help',
  icon: HelpCircle,
  dropdown: [
    { href: '/docs', label: 'Documentation', icon: BookOpen },
    { href: '/faq', label: 'FAQ', icon: MessageCircle },
    { href: '/support', label: 'Support', icon: LifeBuoy },
    { href: '/contact', label: 'Contact', icon: Mail },
  ]
}
```

## Styling

### Active States
- **Active Link**: Cyan text, cyan background (10% opacity), cyan border, cyan glow
- **Active Dropdown Parent**: Same styling as active link when any child is active

### Hover States
- **Desktop**: Cyan text, subtle white background
- **Mobile**: Cyan text, cyan background tint

### Dropdown Menus
- **Background**: Glass morphism with backdrop blur
- **Border**: Cyan border with 20% opacity
- **Shadow**: Cyan glow shadow
- **Items**: Left border appears on active item (2px cyan)

## Mobile Experience

### Mobile Menu Features
1. **User Profile Card** (authenticated users only)
   - Avatar with cyan glow border
   - Username and role display
   
2. **Organized Sections**
   - Section headers for dropdown groups
   - Indented sub-items with icon
   
3. **Management Section** (moderators/admins only)
   - Separate section with header
   - Moderation and Admin links
   
4. **Auth Actions**
   - Profile and Settings links
   - Prominent Logout button (red)
   - Login/Sign Up for guests (gradient button)

## Best Practices

### When to Use Dropdowns
- **5+ related items**: Group them in a dropdown
- **Logical grouping**: Community features, Gaming features, etc.
- **Reduce clutter**: Keep top-level nav items under 8

### When to Use Single Links
- **Primary actions**: Home, Dashboard
- **Standalone features**: Search, Blog
- **Call-to-action**: Donate, Sign Up

### Icon Selection
- Use Lucide React icons for consistency
- Keep icons semantically relevant
- Size: `h-4 w-4` for desktop, `h-5 w-5` for mobile

## Responsive Behavior

### Desktop (lg: 1024px+)
- Horizontal navigation bar
- Dropdown menus appear below parent
- Icons + text labels
- All dropdowns visible

### Tablet/Small Desktop (md-lg: 768-1023px)
- Horizontal navigation
- User menu shows avatar only
- Abbreviated labels on some items

### Mobile (< 768px)
- Hamburger menu
- Full-screen mobile menu
- Vertical stack with sections
- Large touch targets (py-3)

## Accessibility

- **Keyboard Navigation**: Tab through items, Enter to activate
- **Screen Readers**: Proper ARIA labels on all interactive elements
- **Focus Indicators**: Visible focus states on all clickable items
- **Color Contrast**: Meets WCAG AA standards
- **Touch Targets**: Minimum 44x44px touch areas

## Performance

- **State Management**: Uses React hooks (useState, useRef, useEffect)
- **Click Outside Detection**: Efficient event listener with cleanup
- **Route Change Detection**: Auto-close menus on navigation
- **No Heavy Dependencies**: Only uses Lucide icons and Next.js

## Migration from UnifiedNav

### Changes Required
1. Update import: `UnifiedNav` → `EnhancedNav`
2. No prop changes needed (same interface)
3. Layout files automatically updated

### Breaking Changes
None. The interface is identical to `UnifiedNav`.

### Deprecation Notice
`UnifiedNav` is deprecated but still functional. Migrate to `EnhancedNav` for:
- Better scalability
- Dropdown support
- Improved mobile UX
- Future feature support

## Future Enhancements

### Planned Features
- [ ] Mega menus with rich content (images, descriptions)
- [ ] Notification badges on nav items
- [ ] Quick search in navigation
- [ ] Breadcrumb integration
- [ ] Keyboard shortcuts (Cmd+K for search)
- [ ] Navigation history/recent items
- [ ] Customizable user menu items via API

### Potential Additions
- **Resources Dropdown**: Docs, Wiki, Guides, API
- **Store Dropdown**: Shop, Ranks, Cosmetics
- **Admin Dropdown**: All admin pages in one menu
- **User Stats**: Quick stats display in user menu

## Troubleshooting

### Dropdown Not Closing
- Ensure refs are properly set
- Check click-outside handler is attached
- Verify no z-index conflicts

### Active State Not Highlighting
- Check pathname matching logic
- Ensure href exactly matches route
- Verify dropdown children are checked

### Mobile Menu Not Scrolling
- Check for `overflow-y-auto` on mobile menu container
- Ensure parent doesn't have `overflow: hidden`

### Icons Not Displaying
- Verify Lucide icon import
- Check icon component is passed correctly
- Ensure icon size classes are applied

## Testing Checklist

### Desktop
- [ ] All dropdowns open/close correctly
- [ ] Active states highlight properly
- [ ] Click outside closes dropdowns
- [ ] Route change closes dropdowns
- [ ] Hover states work

### Mobile
- [ ] Hamburger menu opens/closes
- [ ] Sections display correctly
- [ ] User profile card shows (auth)
- [ ] Auth buttons work (guest)
- [ ] Scrolling works with many items

### Functionality
- [ ] Guest sees public nav
- [ ] Users see dashboard nav
- [ ] Moderators see moderation link
- [ ] Admins see admin link
- [ ] User menu works
- [ ] Logout works
- [ ] Login/Register buttons work (guest)

## Examples

### Adding a "Store" Section

```tsx
// In dashboardNavItems
{
  label: 'Store',
  icon: ShoppingCart,
  dropdown: [
    { href: '/store/ranks', label: 'Ranks', icon: Award },
    { href: '/store/cosmetics', label: 'Cosmetics', icon: Sparkles },
    { href: '/store/bundles', label: 'Bundles', icon: Gift },
    { href: '/store/history', label: 'Purchase History', icon: History },
  ]
}
```

### Adding a Badge to an Item

```tsx
{
  href: '/messages',
  label: 'Messages',
  icon: Mail,
  badge: 3  // Displays "3" badge
}
```

*Note: Badge display requires additional implementation in the component*

---

**Component Version**: 2.0  
**Last Updated**: 2024  
**Author**: Vonix Network Team
