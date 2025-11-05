# 🎮 Server Status Carousel

Interactive server status display for the homepage with arrow navigation.

---

## Features

### ✨ Visual Design
- **Glass morphism card** with gradient glow effect
- **Animated status indicator** (pulsing green for online, red for offline)
- **Smooth transitions** between servers
- **Pagination dots** showing current server
- **Arrow navigation** (Previous/Next buttons)

### 📊 Information Displayed
- **Server name** and description
- **Online status** (Online/Offline with animated indicator)
- **Player count** (current/max)
- **Minecraft version**
- **Modpack name** (if applicable)
- **Server IP address** (with port if not default 25565)

### 🎯 User Interactions
1. **Arrow buttons** - Navigate between servers
2. **Pagination dots** - Click to jump to specific server
3. **Auto-adapts** - Shows/hides navigation if only 1 server

---

## Component Location

**File**: `src/components/home/server-status-carousel.tsx`

**Usage**:
```tsx
import { ServerStatusCarousel } from '@/components/home/server-status-carousel';

// Fetch servers from database
const servers = await db.select().from(servers).orderBy(asc(servers.orderIndex));

// Render carousel
<ServerStatusCarousel servers={servers} />
```

---

## Server Data Structure

Fetches from `servers` table with fields:
- `id` - Server ID
- `name` - Display name
- `description` - Server description
- `ipAddress` - Server IP
- `port` - Server port (default 25565)
- `status` - 'online' or 'offline'
- `playersOnline` - Current player count
- `playersMax` - Maximum players
- `version` - Minecraft version
- `modpackName` - Modpack name (optional)
- `orderIndex` - Display order

---

## Navigation Controls

### Previous Button
- Icon: `ChevronLeft`
- Cycles to last server when at first

### Next Button  
- Icon: `ChevronRight`
- Cycles to first server when at last

### Pagination Dots
- Active dot: Wide cyan bar (8px width)
- Inactive dots: Small gray circles (2px)
- Click any dot to jump to that server

### Counter
- Shows "Server X of Y" below controls
- Only displays if multiple servers exist

---

## Conditional Display

**Single Server**:
- No navigation controls
- No pagination dots
- No counter
- Just displays server info

**Multiple Servers**:
- Full navigation UI
- Arrow buttons
- Pagination dots
- Server counter

**No Servers**:
- Shows placeholder card
- Message: "No servers available"

---

## Status Styling

### Online
- Dot color: `bg-success` (green)
- Animation: `animate-pulse`
- Text: "Online"

### Offline
- Dot color: `bg-error` (red)
- No animation
- Text: "Offline"
- Players: Shows "0/0"

---

## Layout Integration

**Homepage** (`src/app/page.tsx`):
- Located in "Perks Section"
- Right side of 2-column grid
- Pairs with benefits list on left
- Animates in from right (`animate-slide-in-right`)

---

## Database Query

```typescript
const allServers = await db
  .select()
  .from(servers)
  .orderBy(asc(servers.orderIndex));
```

**Order**: Servers display by `orderIndex` (ascending)

---

## Styling Details

### Card
- Variant: `gradient`
- Glow: `true`
- Padding: `p-8`

### Info Sections
- Background: `bg-white/5`
- Padding: `p-4`
- Border radius: `rounded-lg`

### IP Display
- Border: `border-white/10`
- Font: `font-mono`
- Color: `text-brand-cyan`
- Icon: Globe (cyan)

### Navigation
- Border top: `border-white/10`
- Button variant: `ghost`
- Button size: `sm`
- Hover effects on dots

---

## Responsive Behavior

- **Mobile**: Full width, stacked layout
- **Tablet**: Half width in grid
- **Desktop**: Right column of 2-column layout

All text and spacing scales appropriately.

---

## Future Enhancements

Possible additions:
- Auto-rotate through servers (carousel mode)
- Click server name to go to detail page
- Show server uptime percentage
- Display MOTD (Message of the Day)
- Link to BlueMap/CurseForge if available
- Show online players list (with avatars)
- Real-time status updates via WebSocket

---

**Status**: ✅ Complete and integrated on homepage
