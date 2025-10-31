# Professional UI Design Prompt for Vonix Network
**For use with Google AI Studio, Midjourney, Figma AI, or similar design generation tools**

---

## Project Overview

Generate a complete, modern UI design system for **Vonix Network**, a premium Minecraft community platform. The design should feel like a next-generation gaming platform with neon aesthetics, dark mode focus, and enterprise-grade professionalism.

---

## Brand Identity

**Brand Name:** Vonix Network  
**Tagline:** Modern Minecraft Community Platform  
**Industry:** Gaming / Minecraft Server Community  
**Target Audience:** Minecraft players (ages 13-35), server administrators, gaming community managers  
**Brand Personality:** Bold, energetic, modern, professional, gaming-focused, neon-futuristic

---

## Core Brand Colors (Extracted from Logo)

### Primary Palette
- **Cyan (Primary Accent):** `#00D9FF` - RGB(0, 217, 255)
- **Electric Blue:** `#3B82F6` - RGB(59, 130, 246)
- **Vivid Purple:** `#8B5CF6` - RGB(139, 92, 246)
- **Hot Pink:** `#EC4899` - RGB(236, 72, 153)
- **Neon Orange:** `#F97316` - RGB(249, 115, 22)

### Neutrals & Backgrounds
- **Deep Black (Primary Background):** `#0B0B0D` - RGB(11, 11, 13)
- **Dark Surface:** `#1A1A1E` - RGB(26, 26, 30)
- **Border/Divider:** `rgba(255, 255, 255, 0.1)`
- **Pure White (Text):** `#F8FAFC` - RGB(248, 250, 252)
- **Muted Text:** `#94A3B8` - RGB(148, 163, 184)

### Status Colors
- **Success/Online:** `#10B981` - RGB(16, 185, 129)
- **Warning:** `#F59E0B` - RGB(245, 158, 11)
- **Error/Danger:** `#EF4444` - RGB(239, 68, 68)

### Signature Gradients
- **Logo Gradient (Brand Identity):**  
  `linear-gradient(135deg, #00D9FF 0%, #3B82F6 25%, #8B5CF6 50%, #EC4899 75%, #F97316 100%)`
  
- **UI Accent Gradient (Interaction Feedback):**  
  `linear-gradient(90deg, #06FFA5 0%, #00D9FF 100%)`

---

## Typography Guidelines

### Font Families
- **Primary:** Inter, System-UI, -apple-system, BlinkMacSystemFont, Segoe UI
- **Monospace (code/stats):** 'JetBrains Mono', 'Fira Code', Consolas, monospace
- **Display (optional):** Orbitron or Exo 2 for futuristic headings

### Type Scale
- **Heading 1:** 48px, Bold (700), Letter-spacing: -0.02em
- **Heading 2:** 36px, Bold (700), Letter-spacing: -0.01em
- **Heading 3:** 28px, Semibold (600)
- **Heading 4:** 24px, Semibold (600)
- **Body Large:** 18px, Regular (400), Line-height: 1.6
- **Body:** 16px, Regular (400), Line-height: 1.5
- **Body Small:** 14px, Regular (400), Line-height: 1.4
- **Caption:** 12px, Medium (500), Line-height: 1.3

### Text Treatments
- Apply gradient text to key headings and brand elements using the logo gradient
- Body text: `#F8FAFC` on dark backgrounds
- Muted/secondary text: `#94A3B8`
- Links: `#00D9FF` with hover state `#3B82F6`

---

## Design System Elements

### 1. Navigation Components

#### Primary Navigation Bar
- **Style:** Glass morphism with backdrop blur
- **Background:** `rgba(26, 26, 30, 0.8)` with `backdrop-filter: blur(12px)`
- **Border:** Bottom border with animated gradient on scroll
- **Height:** 72px desktop, 64px mobile
- **Logo:** Left-aligned, gradient "V" icon + "Vonix Network" text
- **Menu Items:** Center-aligned horizontal links with cyan underline on hover
- **Right Section:** User avatar (pixelated Minecraft head, 32px, rounded-lg), notification bell, settings icon
- **Mobile:** Hamburger menu with slide-out drawer

#### Secondary Navigation (Dashboard Sidebar)
- **Width:** 280px desktop, collapsible to 64px icons-only
- **Background:** `#1A1A1E` with `rgba(255,255,255,0.05)` border-right
- **Active State:** Gradient border-left (4px) + cyan background glow
- **Icons:** 20px, cyan on hover, white when active
- **Sections:** Grouped with subtle dividers and section headers

### 2. Cards & Containers

#### Standard Card
- **Background:** `#1A1A1E` with glass effect
- **Border:** 1px solid `rgba(255, 255, 255, 0.1)`
- **Border Radius:** 12px
- **Padding:** 24px
- **Shadow:** `0 4px 24px rgba(0, 0, 0, 0.4)`
- **Hover State:** Lift transform (-4px) + gradient border glow

#### Feature Card (Hero/CTA)
- **Border:** Animated gradient border (2px) using logo gradient
- **Glow Effect:** Subtle `box-shadow: 0 0 32px rgba(0, 217, 255, 0.25)`
- **Background:** Dark with gradient overlay at 5% opacity
- **Content:** Gradient heading + white body text + cyan CTA button

#### Stats Card
- **Background:** `#1A1A1E`
- **Top Border:** 3px solid with status color (cyan/green/purple)
- **Icon:** 48px gradient circle background with white icon
- **Label:** Muted text (12px)
- **Value:** Large white text (32px, bold)

### 3. Buttons

#### Primary Button
- **Background:** Solid `#3B82F6`
- **Text:** White, 16px, medium weight
- **Padding:** 12px 32px
- **Border Radius:** 8px
- **Hover:** Background shifts to `#00D9FF` with cyan glow
- **Active:** Scale down slightly (0.98)

#### Secondary Button
- **Background:** Transparent
- **Border:** 1px solid `rgba(255, 255, 255, 0.2)`
- **Text:** White
- **Hover:** Gradient border animation + glass background

#### CTA Button (Call-to-Action)
- **Background:** Logo gradient
- **Text:** White, bold
- **Border Radius:** 12px
- **Padding:** 16px 48px
- **Glow:** `0 0 24px rgba(0, 217, 255, 0.4)`
- **Hover:** Increased glow + subtle scale (1.02)

#### Icon Button
- **Size:** 40px circle
- **Background:** `rgba(255, 255, 255, 0.05)`
- **Icon Color:** `#94A3B8`
- **Hover:** Cyan icon color + glass glow

### 4. Form Elements

#### Text Input
- **Background:** `#0B0B0D`
- **Border:** 1px solid `rgba(255, 255, 255, 0.1)`
- **Border Radius:** 8px
- **Height:** 48px
- **Padding:** 12px 16px
- **Text Color:** `#F8FAFC`
- **Placeholder:** `#94A3B8`
- **Focus State:** Cyan border (2px) with glow

#### Select Dropdown
- **Same as text input**
- **Chevron Icon:** Cyan on hover
- **Dropdown Menu:** Glass panel with backdrop blur

#### Checkbox/Radio
- **Size:** 20px
- **Border:** 2px solid `rgba(255, 255, 255, 0.3)`
- **Checked:** Gradient fill with white checkmark
- **Focus:** Cyan ring

#### Toggle Switch
- **Width:** 48px, Height: 24px
- **Off State:** `#374151` (gray)
- **On State:** Logo gradient
- **Circle:** White, smooth transition

### 5. Data Display

#### Table
- **Header:** `#1A1A1E` background, white text (14px, semibold)
- **Row:** Transparent, hover with `rgba(0, 217, 255, 0.05)` background
- **Border:** Bottom border `rgba(255, 255, 255, 0.05)` between rows
- **Cell Padding:** 16px 24px

#### Badge/Tag
- **Small Pill:** 8px border radius, 6px 12px padding
- **Colors:** Status color background at 20% opacity + full opacity text
- **Example:** Success badge = `rgba(16, 185, 129, 0.2)` bg + `#10B981` text

#### Progress Bar
- **Background:** `#1A1A1E`
- **Fill:** UI accent gradient (green-cyan)
- **Height:** 8px
- **Border Radius:** 999px (pill)
- **Animated:** Shimmer effect on fill

#### Avatar (Minecraft Head)
- **Size:** 32px (small), 48px (medium), 64px (large), 128px (profile)
- **Style:** Pixelated rendering (image-rendering: pixelated)
- **Shape:** Rounded-lg (not circular)
- **Border:** Optional gradient ring for featured users
- **Fallback:** Default "Steve" head

### 6. Modals & Overlays

#### Modal Dialog
- **Backdrop:** `rgba(0, 0, 0, 0.8)` with backdrop-blur
- **Container:** `#1A1A1E` with gradient border, max-width 600px
- **Header:** Gradient text heading + close icon (top-right)
- **Content:** White text, 24px padding
- **Footer:** Buttons right-aligned with 16px gap

#### Toast Notification
- **Position:** Top-right, stacked
- **Background:** Glass with gradient left border (4px)
- **Shadow:** Large with glow
- **Icon:** Status color circle with white icon
- **Auto-dismiss:** 5 seconds with progress bar

#### Dropdown Menu
- **Background:** `#1A1A1E` glass with blur
- **Border:** 1px gradient
- **Shadow:** Large elevation
- **Item Hover:** Cyan background tint
- **Divider:** Hairline white at 10% opacity

### 7. Layout Components

#### Hero Section
- **Background:** Animated particle system with logo gradient colors
- **Heading:** 72px gradient text with glow
- **Subheading:** 24px white text
- **CTA Button:** Large gradient button with glow
- **Height:** Full viewport (100vh)

#### Dashboard Grid
- **Gap:** 24px between cards
- **Columns:** Responsive (1/2/3/4 columns)
- **Layout:** CSS Grid with auto-fill

#### Section Divider
- **Line:** 1px gradient (horizontal)
- **Label:** Centered pill badge with dark background

### 8. Special Components

#### Leaderboard Podium
- **Top 3 Users:** Elevated cards with gradient borders
- **Rank Badges:** Gradient circular badges with rank numbers
- **Avatars:** Large (128px) with glow effect
- **Stats:** XP and level displayed below username

#### Forum Post Card
- **Author:** Avatar + username with donation rank badge
- **Content:** BBCode rendered with gradient code blocks
- **Actions:** Like/Comment/Share icons in bottom row
- **Border:** Left border with category color

#### Discord Chat Integration
- **Messages:** Alternating subtle background shades
- **Timestamp:** Small muted text
- **Avatar:** 32px Minecraft head or Discord avatar
- **Animated Border:** Left side with logo gradient animation

#### XP Progress Display
- **Level Badge:** Circular gradient background with level number
- **Progress Bar:** Logo gradient fill with XP text
- **Next Level:** Ghost text showing requirement

---

## Animation & Interaction Guidelines

### Micro-interactions
- **Hover:** 200ms ease-out transitions
- **Button Press:** 100ms scale(0.98)
- **Loading States:** Shimmer gradient animation (3s loop)
- **Page Transitions:** 300ms fade + slight upward motion

### Gradient Animations
- **Text Gradients:** Slow pan (8s ease infinite)
- **Border Gradients:** Rotate/shift (6s ease infinite)
- **Loading Bars:** Flow left-to-right (2s linear infinite)

### Focus States
- **Ring:** 2px cyan with 4px offset
- **Glow:** Subtle cyan shadow
- **Scale:** No scale on focus (accessibility)

---

## Accessibility Requirements

- **Contrast Ratios:** Minimum 4.5:1 for body text, 3:1 for large text
- **Focus Indicators:** Always visible and high-contrast
- **Color-blind Safe:** Don't rely on color alone for status
- **Screen Reader:** Proper ARIA labels and semantic HTML
- **Keyboard Navigation:** Full keyboard support with visible focus

---

## Authentication System

**Provider:** NextAuth.js v4 with Credentials provider  
**Strategy:** JWT-based sessions (30-day expiry)  
**Password Security:** bcrypt hashing  
**Rate Limiting:** 5 login attempts per 15 minutes per IP

### User Roles & Permissions
- **Guest:** Public content only (forum read, leaderboard view)
- **User:** Full authenticated access (posts, comments, profile, groups)
- **Moderator:** Content moderation (forum/social mod, reports, user warnings)
- **Admin:** Full system access (all moderation + settings, ranks, servers, analytics)

### Session Data
- User ID, username, email (optional)
- Role (user/moderator/admin)
- Minecraft username & UUID (optional, for avatar fetching)
- Avatar URL (custom or falls back to mc-heads.net)

### Auth UI Components
- **Login Page:** Glass card with gradient border, username/password inputs, "Remember me" toggle
- **Register Page:** Extended form with Minecraft username field (optional), password strength indicator
- **Logout:** Dropdown menu item in user avatar menu
- **Protected Routes:** Dashboard layout requires auth, redirects to `/login` if unauthenticated
- **Session Indicator:** User avatar in nav shows logged-in state, click opens dropdown with profile/settings/logout

### Security Features
- Server-side session validation on every request
- Role-based access control for admin/moderator routes
- Rate limiting prevents brute force attacks
- HTTPS-only cookies in production
- CSRF protection via NextAuth

---

## API Integration & Backend Compatibility

**CRITICAL:** All UI components must integrate with the existing REST API and maintain compatibility with Minecraft server mods and plugins.

### API Architecture

**Base URL Pattern:** `/api/[resource]/[action]`  
**Framework:** Next.js App Router API routes  
**Database:** Drizzle ORM with support for Turso (SQLite), PostgreSQL, MySQL, MariaDB

### Authentication Methods

1. **Session Auth (Web UI):** NextAuth.js JWT sessions via cookies
2. **API Key Auth (Minecraft Mods):** `X-API-Key` header for server-to-server communication

### Standard Response Format

All API endpoints return consistent JSON structure:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

### Core API Endpoints (UI Must Use These)

#### User & Profile
- `GET /api/user/profile` - Get current user data
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/background` - Get user background preference
- `POST /api/user/background` - Update background preference

#### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth endpoint (login/logout)
- `POST /api/auth/register` - User registration

#### Forum
- `GET /api/forum/categories` - List all forum categories
- `GET /api/forum/posts` - Get forum posts with pagination
- `POST /api/forum/posts` - Create new forum post
- `GET /api/forum/posts/[id]` - Get single post with replies
- `POST /api/forum/posts/[id]/reply` - Reply to post
- `PATCH /api/forum/posts/[id]` - Edit post (author/mod/admin)
- `DELETE /api/forum/posts/[id]` - Delete post (author/mod/admin)

#### Social Platform
- `GET /api/social/posts` - Get social feed with pagination
- `POST /api/social/posts` - Create new social post
- `POST /api/social/posts/[id]/like` - Like/unlike post
- `GET /api/social/posts/[id]/comments` - Get post comments
- `POST /api/social/posts/[id]/comment` - Add comment

#### Groups
- `GET /api/groups` - List groups (public or user's groups)
- `POST /api/groups` - Create new group
- `GET /api/groups/[id]` - Get group details
- `GET /api/groups/[id]/posts` - Get group posts with pagination
- `POST /api/groups/[id]/posts` - Create group post
- `POST /api/groups/[id]/join` - Join group
- `POST /api/groups/[id]/leave` - Leave group

#### Leaderboard
- `GET /api/leaderboard` - Get ranked users by XP
- Query params: `?page=1&limit=50&sort=xp`

#### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/[id]` - Mark notification as read
- `POST /api/notifications/mark-all-read` - Mark all as read

#### Admin Management
- `GET /api/admin/users` - List all users (admin only)
- `GET /api/admin/donor-ranks` - Manage donation ranks
- `GET /api/admin/reports` - View content reports
- `GET /api/admin/settings` - Get/update site settings
- `GET /api/admin/servers` - Manage Minecraft servers
- `POST /api/admin/donations` - Record donation

#### Minecraft Integration (API Key Required)
- `POST /api/registration/check-registration` - Check if player is registered
- `POST /api/registration/minecraft-login` - Authenticate Minecraft player
- `POST /api/registration/minecraft-register` - Register player from game
- `GET /api/minecraft/uuid/[username]` - Get UUID from username

#### Discord Integration
- `GET /api/discord/status` - Get Discord bot status
- `GET /api/chat/messages` - Get Discord chat messages (last 100)
- `POST /api/chat/send` - Send message to Discord (auth required)

#### Health & Monitoring
- `GET /api/health` - Health check endpoint
- `GET /api/metrics` - System metrics (admin only)

### Pagination Standard

All list endpoints support:
- `?page=1` - Page number (default: 1)
- `?limit=20` - Items per page (default: 20, max: 100)

Response includes:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Rate Limiting

UI should handle rate limit responses gracefully:
- Auth endpoints: 5 req/min
- General endpoints: 100 req/15min
- File uploads: 10 req/hour

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Real-time Updates (WebSocket)

WebSocket endpoint: `ws://domain/api/ws`

Events:
- `server_status` - Minecraft server status updates
- `forum_post` - New forum posts
- `social_post` - New social posts
- `notification` - User notifications
- `chat_message` - Discord chat messages

### Frontend Data Fetching Patterns

**Server Components (Preferred):**
```typescript
// Fetch on server, no loading state needed
const data = await fetch('/api/resource', {
  cache: 'no-store', // or 'force-cache'
}).then(res => res.json());
```

**Client Components:**
```typescript
// Use React Query for caching, loading, error states
const { data, isLoading, error } = useQuery({
  queryKey: ['resource'],
  queryFn: () => fetch('/api/resource').then(r => r.json())
});
```

### Database Schema Integration

UI must respect database relationships:

**Users Table:**
- `id`, `username`, `email`, `password` (hashed)
- `minecraftUsername`, `minecraftUuid` (optional)
- `role` (user/moderator/admin)
- `donationRankId` (FK to donor_ranks)
- `level`, `xp`, `totalXp` (gamification)
- `avatar`, `bio`, `createdAt`

**Forum Schema:**
- `forum_categories` → `forum_posts` → `forum_replies`
- Posts track: `pinned`, `locked`, `views`, `replyCount`

**Social Schema:**
- `social_posts` → `social_comments` → `social_likes`
- Posts support: `content`, `imageUrl`, `likesCount`, `commentsCount`

**Groups Schema:**
- `groups` → `group_members` → `group_posts` → `group_post_comments`
- Groups have: `name`, `description`, `visibility` (public/private), `ownerId`

**XP System:**
- Exponential scaling: `(100 × level) + (level^2.5)`
- Tier multipliers based on level ranges
- Rewards: Posts (15 XP), Comments (5 XP), Forum posts (20 XP), Daily login (5-55 XP with streaks)

**Donation Ranks:**
- Custom colors, badges, text effects (glow)
- Duration-based expiration
- Display universally across all content

### Minecraft Mod Integration

Mods authenticate using API keys and communicate via:

1. **Player Registration Check:**
   ```
   POST /api/registration/check-registration
   Body: { "minecraft_uuid": "uuid" }
   ```

2. **In-Game Authentication:**
   ```
   POST /api/registration/minecraft-login
   Body: { "minecraft_username": "...", "minecraft_uuid": "...", "password": "..." }
   ```

3. **XP Sync (if implemented):**
   Mods can push XP updates to keep leaderboard current

4. **Rank Sync:**
   Mods fetch donation ranks to apply in-game perks

### Error Handling in UI

Display user-friendly messages for:
- `400` - "Invalid input. Please check your data."
- `401` - Redirect to login or show "Please log in"
- `403` - "You don't have permission to do that."
- `404` - "Content not found."
- `429` - "Too many requests. Please wait a moment."
- `500` - "Server error. Please try again later."

### Loading & Empty States

**Loading:**
- Skeleton loaders with gradient shimmer
- Spinners for actions (buttons, modals)
- Progress bars for uploads

**Empty States:**
- Friendly illustrations or icons
- Clear messaging: "No posts yet. Be the first to post!"
- CTA button to create content

### Caching Strategy

- Public data (forum categories, leaderboard): Cache for 5 minutes
- User-specific data: No cache or very short (30 seconds)
- Static content: Cache indefinitely, revalidate on demand
- Real-time data: WebSocket or short polling (5-10 seconds)

---

## Page-Specific Layouts

### 1. Homepage
- Hero section with animated particle background
- Feature grid (3 columns) with hover lift effects
- Server stats dashboard with live counters
- Recent forum posts feed
- Footer with gradient divider

### 2. Dashboard
- Left sidebar navigation with icons
- Top header with search, notifications, user menu
- Main content area with stat cards (4 columns)
- Recent activity feed
- Quick actions panel

### 3. Forum
- Category cards with custom icons and colors
- Topic list with post previews
- Thread view with collapsible replies
- BBCode editor with toolbar

### 4. User Profile
- Large hero section with avatar and stats
- Tabbed content (Posts, Activity, Friends, Achievements)
- XP progress prominently displayed
- Donation rank badge if applicable

### 5. Leaderboard
- Top 3 podium with gradient cards
- Scrollable ranked list
- Filter tabs (XP, Donations, Posts)
- Search and pagination

### 6. Admin Dashboard
- Dense information layout
- Data tables with inline actions
- Charts and analytics visualizations
- Quick access toolbar

---

## Technical Specifications

### Responsive Breakpoints
- **Mobile:** 320px - 767px (single column, hamburger menu)
- **Tablet:** 768px - 1023px (2 columns, slide-out sidebar)
- **Desktop:** 1024px - 1439px (3-4 columns, fixed sidebar)
- **Large Desktop:** 1440px+ (max-width container at 1400px)

### Component Dimensions
- **Max Content Width:** 1400px
- **Sidebar Width:** 280px (expanded), 64px (collapsed)
- **Card Max Width:** 600px for single-column content
- **Modal Max Width:** 800px for large, 600px for medium, 400px for small

### Glass Morphism Settings
- **Blur:** 12px backdrop-filter
- **Background:** `rgba(26, 26, 30, 0.7)` to `rgba(26, 26, 30, 0.9)`
- **Border:** 1px solid `rgba(255, 255, 255, 0.1)`

### Shadows & Depth
- **Level 1 (Cards):** `0 2px 8px rgba(0, 0, 0, 0.3)`
- **Level 2 (Modals):** `0 8px 32px rgba(0, 0, 0, 0.5)`
- **Level 3 (Dropdowns):** `0 12px 48px rgba(0, 0, 0, 0.6)`
- **Glow (Accents):** `0 0 24px rgba(0, 217, 255, 0.3)`

---

## Generation Instructions

When generating UI elements, ensure:

1. **Dark Mode First:** All designs should be optimized for dark backgrounds
2. **Gradient Usage:** Use the logo gradient sparingly for emphasis, not everywhere
3. **Consistency:** Maintain 8px spacing grid throughout
4. **Neon Aesthetic:** Balance neon accents with dark surfaces for readability
5. **Professional Polish:** Enterprise-grade quality with gaming energy
6. **Minecraft Theme:** Subtle pixelated elements where appropriate
7. **Performance:** Keep animations smooth and lightweight
8. **Accessibility:** High contrast and clear visual hierarchy

### Output Format Preferences
- **Design Tool:** Figma-compatible components with auto-layout
- **Export:** SVG for icons, PNG for screenshots, CSS for gradients
- **Naming:** Use semantic naming (primary-button, hero-section, etc.)
- **Organization:** Group components by type (buttons, inputs, cards, etc.)

---

## Example Component Requests

**Generate these specific components:**

1. Primary navigation bar with logo, menu items, and user dropdown
2. Dashboard stat card showing server player count
3. Forum post card with avatar, content preview, and interaction buttons
4. User profile hero section with gradient background
5. Login modal with glass morphism effect
6. Donation tier selection cards with pricing
7. XP level progress indicator with circular badge
8. Admin table with user management actions
9. Mobile hamburger menu with slide-out drawer
10. Footer with gradient top border and link sections

---

## Brand Assets to Include

- Logo variations (full color, white, icon-only)
- Icon set (navigation, actions, status, social)
- Loading spinners with gradient animation
- Empty state illustrations (dark mode friendly)
- Error state graphics

---

**End of Design Brief**

Use this specification to generate a cohesive, modern UI design system for Vonix Network that balances gaming aesthetics with professional quality.
