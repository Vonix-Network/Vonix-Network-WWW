# Animated Background System

## Overview

The Vonix Network features a fully customizable animated background system with 6 unique background themes that admins can switch between from the admin dashboard.

## Navigation Loading Indicator

The site uses **NProgress** to show a visual loading bar during client-side navigation, providing clear feedback that the page is transitioning.

### Features
- **Gradient loading bar** at the top of the page (green→cyan)
- **Automatic** - triggers on all route changes
- **Styled** to match Vonix theme colors (#06FFA5 → #00D9FF)
- **3px height** - subtle but noticeable
- **Glow effects** for visual appeal

### Why This Matters
Modern websites need to show loading feedback during navigation. This:
- ✅ Confirms to users their click was registered
- ✅ Provides visual feedback during page transitions
- ✅ Improves perceived performance
- ✅ Ensures backgrounds remount properly on navigation

---

## Available Backgrounds

### 1. **Space Particles (Classic)** - Default
- Original particle system with interconnected nodes
- Features smooth connections between particles
- Mouse interaction support
- Configurable via Space.js presets
- **Best for:** General use, professional look

### 2. **Matrix Rain**
- Digital Matrix-style falling characters
- Uses Minecraft characters mixed with binary (01)
- Gradient fade effect from top to bottom
- Cyberpunk aesthetic
- **Best for:** Tech events, hacker theme

### 3. **Data Stream**
- Flowing vertical binary code (0s and 1s)
- Flickering digital effect
- Minimal CPU usage
- Clean, modern look
- **Best for:** Professional tech presentations

### 4. **Pixel Stars**
- Retro pixelated starfield
- Twinkling star effect
- Minecraft-inspired aesthetic
- Uses `image-rendering: pixelated` for crisp rendering
- **Best for:** Gaming events, retro theme

### 5. **Neural Network**
- Interconnected moving nodes
- Dynamic connections based on proximity
- Mouse repulsion interaction
- Gradient colored connections
- **Best for:** Tech showcases, AI/ML events

### 6. **None**
- Solid dark background (#0a0a0a)
- Zero animations
- Best performance
- **Best for:** Low-end devices, accessibility

---

## Admin Controls

### Accessing Background Settings

1. Navigate to the **Admin Dashboard** (`/admin`)
2. Scroll to the **"Site Background"** section
3. Click on desired background option
4. Click **"Save Changes"**
5. Refresh page to see new background

### Features

- **Real-time Preview**: See which background is currently active
- **Visual Selection**: Card-based UI shows all options
- **Instant Save**: Updates are saved immediately to database
- **Refresh Notice**: Clear notification that users need to refresh

---

## Technical Implementation

### File Structure

```
src/
├── components/
│   └── backgrounds/
│       ├── BackgroundManager.tsx    # Main controller
│       ├── MatrixRain.tsx           # Matrix effect
│       ├── DataStream.tsx           # Binary streams
│       ├── PixelStars.tsx           # Pixel starfield
│       ├── NeuralNet.tsx            # Node network
│       └── [SpaceBackground.tsx in parent] # Classic particles
├── app/
│   ├── (public)/layout.tsx          # Uses BackgroundManager
│   ├── (dashboard)/layout.tsx       # Uses BackgroundManager
│   └── api/settings/background/
│       └── route.ts                 # GET/POST endpoints
└── db/
    └── schema.ts                    # Settings table
```

### Database Storage

Background preference is stored in the `settings` table:

```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
```

Example row:
```json
{
  "key": "background",
  "value": "matrix",
  "updated_at": 1642547891
}
```

### API Endpoints

#### GET /api/settings/background
Returns current background setting.

**Response:**
```json
{
  "background": "space"
}
```

#### POST /api/settings/background
Updates background setting (admin only).

**Request:**
```json
{
  "background": "matrix"
}
```

**Response:**
```json
{
  "success": true,
  "background": "matrix"
}
```

**Errors:**
- `401 Unauthorized` - Not logged in
- `403 Forbidden` - Not an admin
- `400 Bad Request` - Invalid background type

---

## Development

### Adding a New Background

1. **Create Component** (`src/components/backgrounds/MyBackground.tsx`):

```typescript
'use client';

import { useEffect, useRef } from 'react';

interface MyBackgroundProps {
  className?: string;
  // Add custom props
}

export default function MyBackground({ className = '' }: MyBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Animation logic here

    return () => {
      // Cleanup
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: -1 }}
    />
  );
}
```

2. **Update BackgroundManager.tsx**:

```typescript
// Add dynamic import
const MyBackground = dynamic(() => import('./MyBackground'), { ssr: false });

// Add to type
export type BackgroundType = 'space' | 'matrix' | 'data' | 'pixels' | 'neural' | 'my-bg' | 'none';

// Add to options
export const BACKGROUND_OPTIONS: BackgroundConfig[] = [
  // ... existing options
  {
    type: 'my-bg',
    label: 'My Custom Background',
    description: 'Description here'
  }
];

// Add to switch case
switch (backgroundType) {
  case 'my-bg':
    return <MyBackground className={className} />;
  // ... other cases
}
```

3. **Update API Validation** (`src/app/api/settings/background/route.ts`):

```typescript
const validBackgrounds = ['space', 'matrix', 'data', 'pixels', 'neural', 'my-bg', 'none'];
```

---

## Performance Considerations

### Canvas Optimization

All backgrounds use:
- `requestAnimationFrame` for smooth 60fps animation
- Fade effects instead of full clears for trail effects
- Window resize listeners for responsiveness
- **ResizeObserver** to dynamically adjust canvas height when page content changes
- **Document height detection** - Canvas expands to cover full page, not just viewport
- **Component remounting** - Backgrounds fully remount on route changes for instant refresh
- **Immediate loading** - Loading fallback displays dark background instantly (no flash)
- Proper cleanup in useEffect returns

### Navigation Behavior

**Key feature:** Backgrounds completely remount on every route change using React's `key` prop via `BackgroundWrapper`.

**Architecture:**
```typescript
// BackgroundWrapper.tsx - Forces remount on navigation
const pathname = usePathname();
<BackgroundManager key={pathname} /> // Entire manager remounts

// Used in layouts
<BackgroundWrapper /> // Automatically remounts on route change
```

**Benefits:**
- ✅ **Complete remount** - Entire background system refreshes
- ✅ **Fresh canvas** - Correct height immediately on every page
- ✅ **No stale state** - Clean slate for each route
- ✅ **Works cross-layout** - Even when navigating between route groups
- ✅ **Instant visual feedback** - NProgress bar + fresh background

**Why the wrapper:**
- Layouts are server components (can't use `usePathname`)
- Wrapper is a client component that can detect route changes
- Using pathname as key forces React to unmount/remount the entire tree
- This ensures backgrounds always have correct viewport dimensions

### Bundle Size

Backgrounds are:
- Dynamically imported with `next/dynamic`
- Loading fallback displays instantly (solid dark background)
- Canvas initializes immediately on client
- Minimal bundle impact

### CPU Usage (Relative)

| Background | CPU Usage | GPU Usage |
|------------|-----------|-----------|
| None       | 0%        | 0%        |
| Data Stream| Low       | Low       |
| Pixel Stars| Low       | Low       |
| Matrix Rain| Medium    | Low       |
| Space      | Medium    | Medium    |
| Neural Net | High      | Medium    |

---

## Accessibility

### Considerations

- All backgrounds use `pointer-events-none` to avoid interfering with UI
- Opacity levels keep text readable
- "None" option available for users with motion sensitivity
- Background does not affect contrast ratios

### Future Enhancements

- [ ] Add "Reduced Motion" detection
- [ ] Auto-disable on battery saver mode
- [ ] FPS limiter option for lower-end devices
- [ ] Per-user background preference override

---

## Theming

### Color Customization

Each background accepts color props:

```typescript
// Matrix Rain
<MatrixRain color="#06FFA5" /> // Vonix green (default)

// Data Stream  
<DataStream color="#00D9FF" /> // Cyan

// Neural Net
<NeuralNet 
  primaryColor="#06FFA5"
  secondaryColor="#00D9FF"
/>

// Pixel Stars
<PixelStars colors={['#06FFA5', '#00D9FF', '#C77DFF', '#FFD700']} />
```

### Vonix Brand Colors

```css
--vonix-green: #06FFA5
--vonix-cyan: #00D9FF
--vonix-purple: #C77DFF
--vonix-gold: #FFD700
```

---

## Testing

### Manual Testing Checklist

- [ ] Test all 6 background options
- [ ] Verify admin-only access to settings
- [ ] Confirm background persists across sessions
- [ ] Check mobile responsiveness
- [ ] Test on different screen sizes
- [ ] Verify refresh shows new background
- [ ] Check performance on low-end devices

### Console Testing

```javascript
// Test API endpoint
fetch('/api/settings/background')
  .then(r => r.json())
  .then(console.log);

// Update background (admin only)
fetch('/api/settings/background', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ background: 'matrix' })
}).then(r => r.json()).then(console.log);
```

---

## Troubleshooting

### Background Not Changing

1. **Hard refresh** browser (Ctrl+Shift+R / Cmd+Shift+R)
2. **Clear cache** and reload
3. Check browser console for errors
4. Verify admin permissions

### Background Not Filling Full Page

If the background only covers the viewport and not the full scrollable page:

1. This is **automatically handled** by component remounting
2. Background completely remounts on every route change
3. Canvas recalculates to `Math.max(viewport, document height)` on mount
4. Resize triggers on:
   - Window resize events
   - Content height changes (ResizeObserver)
   - **Route navigation** (component remounts with new key)
5. If issue persists:
   - Check browser console for errors
   - Hard refresh the page (Ctrl+Shift+R)

### Background Appears Delayed

If the background takes a moment to appear after navigation:

1. This should **no longer happen** with the remounting system
2. Loading fallback displays solid dark background instantly
3. Canvas initializes immediately on component mount
4. If delay persists:
   - Check browser performance
   - Try a lighter background (Data Stream, None)

### Performance Issues

1. Switch to **"None"** background
2. Check if other tabs are using CPU
3. Try **"Data Stream"** as lightweight alternative
4. Disable hardware acceleration in browser

### API Errors

```typescript
// Check authentication
const session = await getServerSession();
console.log('User role:', session?.user?.role);

// Check database
SELECT * FROM settings WHERE key = 'background';
```

---

## Future Roadmap

### Planned Features

- [ ] **Preview Mode**: Live preview before saving
- [ ] **Scheduled Backgrounds**: Auto-change for events
- [ ] **Custom Uploads**: Allow custom video/GIF backgrounds
- [ ] **Particle Customization**: Tweak individual background settings
- [ ] **Theme Presets**: Pre-configured background + color combos
- [ ] **Per-Page Backgrounds**: Different backgrounds for different sections

### Community Requests

- Lava/fire themed background for events
- Underwater bubble effect
- Snow particles for winter
- Lightning/storm effect
- Neon city grid

---

**Last Updated:** 2025-01-19  
**Version:** 2.0  
**Component Count:** 6 backgrounds  
**Default:** Space Particles (Classic)
