# ✅ Square Integration - Complete UI Removal When Disabled

## Issue
Even after hiding the subscription CTA on `/donations`, users could still:
1. See "Subscribe" link in the navigation dropdown
2. Access `/donations/subscribe` page directly
3. See warning message about Square not being configured

## Solution - 3-Part Fix

---

### 1. Navigation - Hide Subscribe Link

**File**: `src/components/nav/enhanced-nav.tsx`

**What Changed**:
- Added `squareEnabled` state
- Fetch Square status on component mount
- Conditionally include Subscribe link in dropdown using spread operator

**Before**:
```tsx
dropdown: [
  { href: '/donations/subscribe', label: 'Subscribe', icon: Crown },
  { href: '/ranks', label: 'Donor Ranks', icon: Award },
]
```

**After**:
```tsx
dropdown: [
  // Only show Subscribe if Square is enabled
  ...(squareEnabled ? [{ href: '/donations/subscribe', label: 'Subscribe', icon: Crown }] : []),
  { href: '/ranks', label: 'Donor Ranks', icon: Award },
]
```

**Applied to**:
- Public navigation (guests)
- Dashboard navigation (authenticated users)

---

### 2. Subscribe Page - Redirect When Disabled

**File**: `src/app/(dashboard)/donations/subscribe/page.tsx`

**What Changed**:
- Check Square status on page load
- Redirect to `/donations` if Square is disabled
- Show toast error message

**Code**:
```tsx
async function checkSquareStatus() {
  try {
    const response = await fetch('/api/square/status');
    const data = await response.json();
    setSquareEnabled(data.enabled);
    
    // Redirect to donations page if Square is not enabled
    if (!data.enabled) {
      toast.error('Rank subscriptions are not available at this time');
      router.push('/donations');
    }
  } catch (error) {
    console.error('Failed to check Square status:', error);
    // Redirect on error as well
    toast.error('Unable to load subscription system');
    router.push('/donations');
  }
}
```

---

### 3. Donations Page - Hide CTA Section

**File**: `src/app/(public)/donations/page.tsx`

**What Changed**:
- Import `isSquareEnabled` from config
- Check Square status server-side
- Conditionally render subscription CTA section

**Code**:
```tsx
import { isSquareEnabled } from '@/lib/square/config';

export default async function DonationsPage() {
  const squareEnabled = isSquareEnabled();
  
  return (
    <>
      {/* Only show if Square is enabled */}
      {squareEnabled && (
        <section>
          <h2>Get Exclusive Ranks & Perks</h2>
          <Link href="/donations/subscribe">
            <Button>View Rank Subscriptions</Button>
          </Link>
        </section>
      )}
      
      {/* Alternative methods always shown */}
      <section>
        <h2>Alternative Payment Methods</h2>
        {/* PayPal, Crypto */}
      </section>
    </>
  );
}
```

---

## How It Works Now

### When Square IS Disabled (Default)

**Navigation**:
```
Donations ▼
  └─ Donor Ranks
     (Subscribe link hidden)
```

**`/donations` page**:
- ❌ "Get Exclusive Ranks & Perks" section hidden
- ❌ "View Rank Subscriptions" button hidden
- ✅ PayPal section shown
- ✅ Crypto section shown

**Direct visit to `/donations/subscribe`**:
- 🔄 Redirects to `/donations`
- 🔔 Shows toast: "Rank subscriptions are not available at this time"

---

### When Square IS Enabled

**Navigation**:
```
Donations ▼
  ├─ Subscribe
  └─ Donor Ranks
```

**`/donations` page**:
- ✅ "Get Exclusive Ranks & Perks" section shown
- ✅ "View Rank Subscriptions" button shown
- ✅ PayPal & Crypto sections shown

**`/donations/subscribe` page**:
- ✅ Full rank selection
- ✅ Duration options
- ✅ Payment form enabled
- ✅ No warnings

---

## User Experience Flow

### Square Disabled Flow
```
User clicks "Donations" in nav
  ↓
Dropdown shows only "Donor Ranks"
  ↓
/donations page shows PayPal & Crypto
  ↓
No subscription CTA visible
  ↓
If user directly visits /donations/subscribe:
  ↓
Redirected to /donations with error toast
```

### Square Enabled Flow
```
User clicks "Donations" in nav
  ↓
Dropdown shows "Subscribe" + "Donor Ranks"
  ↓
/donations page shows subscription CTA
  ↓
User clicks "View Rank Subscriptions"
  ↓
/donations/subscribe shows full rank selection
  ↓
User completes purchase
```

---

## Technical Details

### Square Status Check - Client Side (Nav)
```tsx
useEffect(() => {
  fetch('/api/square/status')
    .then(res => res.json())
    .then(data => setSquareEnabled(data.enabled))
    .catch(() => setSquareEnabled(false));
}, []);
```

### Square Status Check - Server Side (Donations Page)
```tsx
import { isSquareEnabled } from '@/lib/square/config';

const squareEnabled = isSquareEnabled();
```

### Square Status API
**Endpoint**: `/api/square/status`

**Returns**:
```json
{
  "enabled": false,
  "environment": null,
  "applicationId": null,
  "locationId": null
}
```

---

## Configuration

### Enable Square
**File**: `.env` or `.env.local`

```bash
SQUARE_INTEGRATION_ENABLED=true
SQUARE_ACCESS_TOKEN=your-token
SQUARE_LOCATION_ID=your-location-id
SQUARE_APPLICATION_ID=your-app-id
SQUARE_ENVIRONMENT=sandbox  # or production
```

### Disable Square
**Option 1**: Set to false
```bash
SQUARE_INTEGRATION_ENABLED=false
```

**Option 2**: Remove credentials
```bash
# Comment out or remove
# SQUARE_ACCESS_TOKEN=...
```

---

## Testing Checklist

### With Square Disabled (Default)

Navigation:
- [ ] Open "Donations" dropdown
- [ ] "Subscribe" link is NOT shown
- [ ] "Donor Ranks" link IS shown

Donations Page:
- [ ] Visit `/donations`
- [ ] "Get Exclusive Ranks & Perks" section is hidden
- [ ] PayPal section is shown
- [ ] Crypto section is shown

Subscribe Page:
- [ ] Direct visit to `/donations/subscribe`
- [ ] Redirects to `/donations`
- [ ] Toast message shown: "Rank subscriptions are not available at this time"

### With Square Enabled

Navigation:
- [ ] Open "Donations" dropdown
- [ ] "Subscribe" link IS shown
- [ ] "Donor Ranks" link IS shown

Donations Page:
- [ ] Visit `/donations`
- [ ] "Get Exclusive Ranks & Perks" section is shown
- [ ] "View Rank Subscriptions" button works
- [ ] PayPal and Crypto sections also shown

Subscribe Page:
- [ ] Visit `/donations/subscribe`
- [ ] Page loads normally
- [ ] No warning banner
- [ ] Rank selection works
- [ ] Payment button enabled

---

## Files Modified

1. ✅ `src/components/nav/enhanced-nav.tsx` - Conditional nav link
2. ✅ `src/app/(dashboard)/donations/subscribe/page.tsx` - Redirect when disabled
3. ✅ `src/app/(public)/donations/page.tsx` - Hide CTA section

---

## Summary

**Before**:
- Subscribe link always visible in nav ❌
- Subscribe button on /donations page always visible ❌
- /donations/subscribe accessible with warning ⚠️

**After**:
- Subscribe link hidden in nav when Square disabled ✅
- Subscribe button hidden on /donations page when Square disabled ✅
- /donations/subscribe redirects to /donations when Square disabled ✅

**Result**: Complete UI removal of subscription features when Square is not configured! 🎯
