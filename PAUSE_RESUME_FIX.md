# Pause/Resume Subscription Fix

## Issues Found & Fixed

### Problem 1: Page Not Refreshing ❌→✅
**Issue:** After pausing, the success toast appeared but the UI didn't update to show "Paused" badge.

**Root Cause:** The billing page wasn't re-fetching subscription status after pause/resume operations.

**Fix:** Added `await fetchSubscriptionStatus()` after successful pause/resume to refresh the UI.

### Problem 2: Database Not Updated ❌→✅
**Issue:** Pause/Resume was only updating Stripe, not the database. The `check-subscription-status` API reads from the database, so it never saw the paused state.

**Root Cause:** 
- Pause endpoint only called Stripe API
- Resume endpoint only called Stripe API  
- Database fields (`rankPaused`, `pausedAt`, etc.) were never updated

**Fix:** Both endpoints now update the database:

**Pause:**
```typescript
await db
  .update(users)
  .set({
    rankPaused: true,
    pausedAt: new Date(),
    pausedRankId: user.donationRankId || null,
  })
  .where(eq(users.id, userId));
```

**Resume:**
```typescript
await db
  .update(users)
  .set({
    rankPaused: false,
    pausedAt: null,
    pausedRankId: null,
    pausedRemainingDays: null,
    rankExpiresAt: newExpiration, // Adds paused days back!
  })
  .where(eq(users.id, userId));
```

### Problem 3: Clicking Pause Again Said "Paused Again" ❌→✅
**Issue:** Clicking pause when already paused just said "paused successfully" again instead of showing it's already paused or resuming.

**Root Cause:** The pause button wasn't checking the current state correctly because the database wasn't updated.

**Fix:** 
1. Database now tracks pause state correctly
2. Check-subscription-status API checks BOTH Stripe and DB (safety)
3. UI correctly shows "Pause" vs "Resume" button based on actual state

### Problem 4: Days Not Added Back on Resume ❌→✅
**Issue:** When resuming, paused days weren't being added back to rank expiration.

**Root Cause:** Resume endpoint only removed pause flag, didn't calculate or add days.

**Fix:** Resume endpoint now:
1. Calculates days paused
2. Adds those days to `rankExpiresAt`
3. Returns `daysAdded` in response
4. UI shows: "Subscription resumed! X days added back to your rank."

### Problem 5: Rank Removed During Pause? ❓
**Note:** Rank should NOT be removed during pause. The user keeps their rank, billing just stops. This is correct behavior.

## Files Modified

### 1. `/api/stripe/subscription/pause/route.ts`
- ✅ Select `donationRankId` from database
- ✅ Update database when pausing:
  - Set `rankPaused = true`
  - Set `pausedAt = now`
  - Save `pausedRankId` for reference

### 2. `/api/stripe/subscription/resume/route.ts`
- ✅ Select pause info from database
- ✅ Calculate days paused
- ✅ Update Stripe to remove pause
- ✅ Update database:
  - Clear all pause fields
  - Add paused days to `rankExpiresAt`
- ✅ Return `daysAdded` in response

### 3. `/api/stripe/check-subscription-status/route.ts`
- ✅ Check Stripe's `pause_collection` field
- ✅ Combine Stripe + DB pause state (use both as safety)
- ✅ Use combined state for UI display

### 4. `/settings/billing/page.tsx`
- ✅ Call `fetchSubscriptionStatus()` after pause/resume
- ✅ Show improved success message with days added

## How It Works Now

### Pausing a Subscription

```
User clicks "Pause Subscription"
↓
POST /api/stripe/subscription/pause
  ├─ Update Stripe: pause_collection = { behavior: 'keep_as_draft' }
  └─ Update DB: rankPaused = true, pausedAt = now, pausedRankId = current rank
↓
Response: { success: true, paused: true }
↓
UI refreshes: fetchSubscriptionStatus()
↓
UI shows: "Paused" badge + "Resume Subscription" button
```

### Resuming a Subscription

```
User clicks "Resume Subscription"
↓
POST /api/stripe/subscription/resume
  ├─ Calculate: daysToAdd = days since pausedAt
  ├─ Update Stripe: pause_collection = null
  ├─ Update DB:
  │   ├─ rankPaused = false
  │   ├─ pausedAt = null
  │   ├─ rankExpiresAt += daysToAdd
  │   └─ Clear pause fields
  └─ Return: { success: true, daysAdded: X }
↓
Toast: "Subscription resumed! X days added back to your rank."
↓
UI refreshes: fetchSubscriptionStatus()
↓
UI shows: "Active" badge + "Pause Subscription" button
```

### Checking Status

```
GET /api/stripe/check-subscription-status
  ├─ Fetch from Stripe: subscriptions.list({ status: 'active' })
  ├─ Check: activeSub.pause_collection (Stripe state)
  ├─ Check: user.rankPaused (DB state)
  ├─ Combine: paused = stripePaused || dbPaused (safety)
  └─ Return: { subscription: { paused: combined state } }
```

## User Experience

### Before Fix
- ✅ Click pause → Toast: "Paused successfully"
- ❌ Badge still shows "Active"
- ❌ Button still says "Pause Subscription"
- ❌ Clicking again → Toast: "Paused successfully" (wrong!)
- ❌ Days not added back on resume

### After Fix
- ✅ Click pause → Toast: "Paused successfully"
- ✅ Badge updates to "Paused"
- ✅ Button changes to "Resume Subscription"
- ✅ Click resume → Toast: "Resumed! 5 days added back"
- ✅ Badge updates to "Active"
- ✅ Button changes to "Pause Subscription"
- ✅ Expiration date extended by paused days

## Testing Checklist

- [x] Pause subscription
  - [x] Badge changes to "Paused"
  - [x] Button changes to "Resume"
  - [x] Database updated
  - [x] Stripe updated

- [x] Resume subscription
  - [x] Badge changes to "Active"
  - [x] Button changes to "Pause"
  - [x] Days added to expiration
  - [x] Toast shows days added
  - [x] Database cleared
  - [x] Stripe updated

- [x] Multiple pauses
  - [x] Can pause and resume multiple times
  - [x] Days calculate correctly each time
  - [x] No double-counting

- [x] Page refresh
  - [x] Pause state persists after refresh
  - [x] Badge shows correct state
  - [x] Button shows correct action

## Database Schema Used

```typescript
// users table
{
  rankPaused: boolean,           // Is subscription paused?
  pausedAt: timestamp,           // When was it paused?
  pausedRankId: text,            // Which rank was active when paused?
  pausedRemainingDays: integer,  // Calculated remaining days
  rankExpiresAt: timestamp,      // When rank expires (updated on resume)
}
```

## Stripe Fields Used

```typescript
// subscription object
{
  pause_collection: {
    behavior: 'keep_as_draft'    // Stripe's pause mechanism
  } | null                        // null = not paused
}
```

## Key Points

1. **State is stored in both places:**
   - Stripe: `pause_collection` (source of truth for billing)
   - Database: `rankPaused`, `pausedAt` (for UI and calculations)

2. **Days are truly added back:**
   - Calculate: `daysToAdd = now - pausedAt`
   - Update: `rankExpiresAt += daysToAdd`
   - User doesn't lose any time!

3. **UI always shows correct state:**
   - Fetches fresh data after every action
   - Checks both Stripe and DB (safety)
   - Badge and button update immediately

4. **Rank stays active during pause:**
   - User keeps rank perks
   - Just stops billing
   - Days added back when resumed

## Production Ready

✅ Database properly updated
✅ Stripe properly updated  
✅ UI refreshes automatically
✅ Days calculated and added correctly
✅ Error handling in place
✅ Multiple pause/resume cycles work
✅ State persists across page refreshes

The pause/resume functionality is now fully working and production-ready!
