# ✅ Square Payment Integration - Conditional UI

## Issue Fixed

The `/donations` page was showing a **"View Rank Subscriptions"** button that linked to `/donations/subscribe`, but this button was **NOT conditional** on Square being enabled.

This has now been fixed.

---

## What Changed

### `/donations` Page - Now Conditional

**File**: `src/app/(public)/donations/page.tsx`

**Before**:
```tsx
{/* Rank Subscription CTA */}
<section className="mb-16">
  <div className="glass border-2 border-cyan-500/30...">
    <h2>Get Exclusive Ranks & Perks</h2>
    <Link href="/donations/subscribe">
      <Button>View Rank Subscriptions</Button>
    </Link>
  </div>
</section>
```

**After**:
```tsx
{/* Rank Subscription CTA - Only show if Square is enabled */}
{squareEnabled && (
  <section className="mb-16">
    <div className="glass border-2 border-cyan-500/30...">
      <h2>Get Exclusive Ranks & Perks</h2>
      <Link href="/donations/subscribe">
        <Button>View Rank Subscriptions</Button>
      </Link>
    </div>
  </section>
)}
```

**Changes Made**:
1. ✅ Import `isSquareEnabled` from `@/lib/square/config`
2. ✅ Check Square status server-side: `const squareEnabled = isSquareEnabled()`
3. ✅ Wrap entire subscription CTA section in `{squareEnabled && (...)}`

---

## How It Works Now

### When Square IS Enabled

**`/donations` page shows**:
```
┌─────────────────────────────────────────┐
│  👑 Get Exclusive Ranks & Perks         │
│                                          │
│  Subscribe to get premium ranks...      │
│                                          │
│  [View Rank Subscriptions] [View Ranks] │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Alternative Payment Methods            │
│  • PayPal                                │
│  • Crypto (Solana)                       │
└─────────────────────────────────────────┘
```

### When Square IS NOT Enabled

**`/donations` page shows**:
```
┌─────────────────────────────────────────┐
│  Alternative Payment Methods            │
│  • PayPal                                │
│  • Crypto (Solana)                       │
└─────────────────────────────────────────┘
```

**Note**: The entire "Get Exclusive Ranks & Perks" section is **hidden**.

---

## Subscribe Page Protection

The `/donations/subscribe` page **already has** proper Square checking:

### Client-Side Check
**File**: `src/app/(dashboard)/donations/subscribe/page.tsx`

```tsx
// Check Square status on mount
useEffect(() => {
  checkSquareStatus();
}, []);

async function checkSquareStatus() {
  const response = await fetch('/api/square/status');
  const data = await response.json();
  setSquareEnabled(data.enabled);
}
```

### Warning Banner
When Square is NOT enabled:
```tsx
{!squareEnabled && (
  <Card className="mb-8 border-yellow-500/50 bg-yellow-500/10">
    <CardContent>
      <h3>Payment Processing Not Configured</h3>
      <p>Square payment processing needs to be configured...</p>
      <code>
        SQUARE_INTEGRATION_ENABLED=true
        SQUARE_ACCESS_TOKEN=your-token
        ...
      </code>
    </CardContent>
  </Card>
)}
```

### Disabled Button
```tsx
<Button
  onClick={handlePurchase}
  disabled={processing || !squareEnabled}
>
  {!squareEnabled ? (
    <>Payment Processing Not Available</>
  ) : (
    <>Continue to Payment</>
  )}
</Button>
```

---

## Square Configuration

### How to Enable Square

**File**: `.env` or `.env.local`

```bash
# Enable Square integration
SQUARE_INTEGRATION_ENABLED=true

# Square API Credentials
SQUARE_ACCESS_TOKEN=your-access-token
SQUARE_LOCATION_ID=your-location-id
SQUARE_APPLICATION_ID=your-application-id

# Environment (sandbox or production)
SQUARE_ENVIRONMENT=sandbox
```

### How to Disable Square

**Option 1**: Set to false
```bash
SQUARE_INTEGRATION_ENABLED=false
```

**Option 2**: Remove/comment out
```bash
# SQUARE_INTEGRATION_ENABLED=true
```

**Option 3**: Remove credentials
```bash
SQUARE_INTEGRATION_ENABLED=true
# SQUARE_ACCESS_TOKEN=  (leave empty or remove)
```

---

## Checking Square Status

### Server-Side (SSR)
```tsx
import { isSquareEnabled } from '@/lib/square/config';

export default async function MyPage() {
  const squareEnabled = isSquareEnabled();
  
  return (
    <>
      {squareEnabled && (
        <div>Square features here</div>
      )}
    </>
  );
}
```

### Client-Side
```tsx
'use client';

export default function MyComponent() {
  const [squareEnabled, setSquareEnabled] = useState(false);
  
  useEffect(() => {
    fetch('/api/square/status')
      .then(res => res.json())
      .then(data => setSquareEnabled(data.enabled));
  }, []);
  
  return (
    <>
      {squareEnabled && (
        <div>Square features here</div>
      )}
    </>
  );
}
```

### API Route
```tsx
import { NextResponse } from 'next/server';
import { isSquareEnabled } from '@/lib/square/config';

export async function GET() {
  if (!isSquareEnabled()) {
    return NextResponse.json(
      { error: 'Square is not enabled' },
      { status: 503 }
    );
  }
  
  // Process Square payment...
}
```

---

## isSquareEnabled() Function

**File**: `src/lib/square/config.ts`

```typescript
export function isSquareEnabled(): boolean {
  const enabled = process.env.SQUARE_INTEGRATION_ENABLED === 'true';
  const hasCredentials = !!(
    process.env.SQUARE_ACCESS_TOKEN &&
    process.env.SQUARE_LOCATION_ID &&
    process.env.SQUARE_APPLICATION_ID
  );

  return enabled && hasCredentials;
}
```

**Returns `true` only when**:
1. ✅ `SQUARE_INTEGRATION_ENABLED=true`
2. ✅ `SQUARE_ACCESS_TOKEN` is set
3. ✅ `SQUARE_LOCATION_ID` is set
4. ✅ `SQUARE_APPLICATION_ID` is set

---

## What Gets Hidden When Square is Disabled

### `/donations` Page
- ❌ "Get Exclusive Ranks & Perks" section
- ❌ "View Rank Subscriptions" button
- ❌ Link to `/donations/subscribe`
- ✅ PayPal section (still shown)
- ✅ Crypto section (still shown)
- ✅ Recent supporters (still shown)

### `/donations/subscribe` Page
- ⚠️ Page still accessible (shows warning)
- ⚠️ Rank selection still works (for browsing)
- ⚠️ Duration selection still works (for browsing)
- ❌ Payment button is **disabled**
- ⚠️ Shows warning banner about Square not configured

---

## Alternative: Redirect on Subscribe Page

If you want to **prevent access** to `/donations/subscribe` when Square is disabled, you can add this to the page:

```tsx
// At the top of src/app/(dashboard)/donations/subscribe/page.tsx
import { redirect } from 'next/navigation';
import { isSquareEnabled } from '@/lib/square/config';

export default async function SubscribePage() {
  // Redirect if Square is not enabled
  if (!isSquareEnabled()) {
    redirect('/donations');
  }
  
  // ... rest of the page
}
```

**Note**: This is optional. Current implementation allows browsing ranks even when Square is disabled, which might be useful for planning.

---

## Testing Checklist

### When Square IS Enabled

- [ ] Visit `/donations`
- [ ] See "Get Exclusive Ranks & Perks" section
- [ ] Click "View Rank Subscriptions" button
- [ ] Go to `/donations/subscribe`
- [ ] No warning banner shown
- [ ] Payment button is enabled
- [ ] Can complete purchase

### When Square IS NOT Enabled

- [ ] Visit `/donations`
- [ ] "Get Exclusive Ranks & Perks" section is **hidden**
- [ ] No "View Rank Subscriptions" button
- [ ] PayPal and Crypto sections still visible
- [ ] Direct visit to `/donations/subscribe` (if not redirected)
- [ ] Warning banner shown
- [ ] Payment button is **disabled**
- [ ] Shows message: "Payment Processing Not Available"

---

## Summary

✅ **Fixed**: `/donations` page now hides subscription CTA when Square is disabled  
✅ **Already had**: `/donations/subscribe` page shows warning and disables payment  
✅ **Server-side check**: Uses `isSquareEnabled()` for instant SSR check  
✅ **Graceful**: Alternative payment methods (PayPal, Crypto) always shown  

**Result**: Users won't see subscription options when Square isn't configured! 🎯
