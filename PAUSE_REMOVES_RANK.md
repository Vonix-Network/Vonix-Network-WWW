# Pause Now Removes Rank - Behavior Update

## Issue Fixed

**Problem:** When users paused their subscription, they kept their rank and perks across the site even though billing was stopped.

**Solution:** Pausing now **removes the rank** until resumed.

## New Behavior

### When User Pauses

```
Before Pause:
├─ donationRankId: "gold-supporter"
├─ Rank badge: Shows everywhere
├─ Perks: Active
└─ Billing: Active

User clicks "Pause Subscription"
↓
After Pause:
├─ donationRankId: null (REMOVED)
├─ pausedRankId: "gold-supporter" (SAVED)
├─ Rank badge: Hidden everywhere
├─ Perks: Inactive
└─ Billing: Stopped
```

**Result:** User appears as a regular member with no rank badge or perks.

### When User Resumes

```
Before Resume (Paused State):
├─ donationRankId: null
├─ pausedRankId: "gold-supporter"
├─ Rank: Not visible
└─ Perks: Inactive

User clicks "Resume Subscription" (after 24h cooldown)
↓
After Resume:
├─ donationRankId: "gold-supporter" (RESTORED)
├─ pausedRankId: null (CLEARED)
├─ Rank badge: Shows everywhere again
├─ Perks: Active again
└─ Billing: Resumed
```

**Result:** User gets their rank and perks back immediately.

## Code Changes

### Pause Endpoint

**File:** `/api/stripe/subscription/pause/route.ts`

```typescript
// Update database to track pause state
// IMPORTANT: Remove rank during pause (user loses perks until resumed)
await db
  .update(users)
  .set({
    rankPaused: true,
    pausedAt: new Date(),
    pausedRankId: user.donationRankId || null, // Save current rank
    donationRankId: null, // Remove rank (no perks during pause)
  })
  .where(eq(users.id, Number(session.user.id)));
```

**What happens:**
1. Saves current rank to `pausedRankId` (backup)
2. Sets `donationRankId` to `null` (removes rank)
3. User loses rank badge and perks everywhere

### Resume Endpoint

**File:** `/api/stripe/subscription/resume/route.ts`

```typescript
// Update database: clear pause state and add days back to expiration
// IMPORTANT: Restore rank from pausedRankId (user gets perks back)
const updateData: any = {
  rankPaused: false,
  pausedAt: null,
  pausedRankId: null,
  pausedRemainingDays: null,
  donationRankId: user.pausedRankId, // Restore rank!
};
```

**What happens:**
1. Retrieves rank from `pausedRankId`
2. Sets `donationRankId` back to saved rank (restores rank)
3. Clears pause fields
4. User gets rank badge and perks back everywhere

## User Experience

### Visual Changes Across Site

**Before Pause:**
- ✅ Rank badge next to username
- ✅ Rank color on profile
- ✅ Access to rank-restricted features
- ✅ Rank benefits active

**During Pause:**
- ❌ No rank badge (appears as regular user)
- ❌ Default color on profile
- ❌ No access to rank-restricted features
- ❌ No rank benefits

**After Resume:**
- ✅ Rank badge restored
- ✅ Rank color restored
- ✅ Access to features restored
- ✅ All benefits restored

## Database Flow

### Pause Flow

```sql
-- Before pause
donationRankId: 'gold-supporter'
pausedRankId: null
rankPaused: false

-- Pause operation
UPDATE users SET
  donationRankId = null,           -- Remove rank
  pausedRankId = 'gold-supporter', -- Save rank
  rankPaused = true,
  pausedAt = NOW()
WHERE id = userId;

-- After pause
donationRankId: null
pausedRankId: 'gold-supporter'
rankPaused: true
```

### Resume Flow

```sql
-- Before resume (paused state)
donationRankId: null
pausedRankId: 'gold-supporter'
rankPaused: true

-- Resume operation
UPDATE users SET
  donationRankId = 'gold-supporter', -- Restore rank
  pausedRankId = null,               -- Clear backup
  rankPaused = false,
  pausedAt = null
WHERE id = userId;

-- After resume
donationRankId: 'gold-supporter'
pausedRankId: null
rankPaused: false
```

## Why This Matters

### Fairness
- Users shouldn't have perks while not paying
- Clear distinction between active and paused subscribers

### Clarity
- User sees immediately that pause removes benefits
- Incentive to resume if they want perks back

### Consistency
- Rank badge visibility matches payment status
- No confusion about who has active subscriptions

## What Users Keep During Pause

Even though rank is removed, users still keep:

1. ✅ **Account Status** - Still a registered member
2. ✅ **Purchase History** - All donation records preserved
3. ✅ **Rank Time** - Expiration date preserved (days added back on resume)
4. ✅ **Subscription** - Stays active in Stripe (just paused)

## What Users Lose During Pause

1. ❌ **Rank Badge** - Not visible anywhere
2. ❌ **Rank Color** - Reverts to default
3. ❌ **Rank Perks** - No access to exclusive features
4. ❌ **Billing** - Not charged during pause

## Edge Cases Handled

### 1. User Pauses, Then Cancels Subscription

```
Pause → donationRankId = null (no rank)
Cancel → Subscription ends
Resume not possible → Rank stays null
```

**Result:** User has no rank, as expected

### 2. User Pauses, Rank Expiration Passes

```
Pause on Nov 1 (expires Dec 1)
Dec 15 - rank would have expired
Resume on Dec 20
```

**Result:**
- Rank restored to user (they get it back)
- Expiration extended by 49 days (Nov 1 → Dec 20)
- User gets full value of paused time

### 3. Multiple Pause/Resume Cycles

```
Cycle 1: Pause → Remove rank → Resume → Restore rank ✅
Cycle 2: Pause → Remove rank → Resume → Restore rank ✅
```

**Result:** Works consistently every time

### 4. User Has Multiple Ranks (Future Feature)

```typescript
// If system supports multiple ranks in future:
pausedRankId: user.donationRankId  // Saves single rank
donationRankId: null               // Removes current rank

// On resume:
donationRankId: user.pausedRankId  // Restores saved rank
```

**Current system:** Only supports one rank, so this is fine

## Testing Checklist

### Pause Testing
- [ ] Pause subscription
- [ ] Verify rank badge disappears from:
  - [ ] Navbar
  - [ ] Profile page
  - [ ] Forum posts
  - [ ] Social posts
  - [ ] Leaderboard
  - [ ] User card
- [ ] Verify rank perks are disabled
- [ ] Verify database: `donationRankId = null`
- [ ] Verify database: `pausedRankId = <saved rank>`

### Resume Testing
- [ ] Wait 24 hours (or bypass cooldown for testing)
- [ ] Resume subscription
- [ ] Verify rank badge reappears everywhere
- [ ] Verify rank perks are enabled
- [ ] Verify database: `donationRankId = <restored rank>`
- [ ] Verify database: `pausedRankId = null`
- [ ] Verify expiration extended by paused days

### UI Testing
- [ ] Check all pages that display rank badges
- [ ] Check rank-restricted features are blocked during pause
- [ ] Check rank color reverts to default during pause
- [ ] Check everything restores on resume

## Comparison with Other Services

### Netflix
- Pause → Lose access to content ✅
- Resume → Regain access ✅
- Same as our model

### Spotify
- Pause → Lose Premium features ✅
- Resume → Regain Premium ✅
- Same as our model

### Patreon
- Cancel → Lose perks at period end ✅
- Resubscribe → Regain perks ✅
- Similar to our model

**Our behavior is industry standard!** ✅

## Migration Notes

### Existing Paused Subscriptions

If you have users with paused subscriptions before this update:

```sql
-- Find paused users who still have ranks
SELECT id, username, donationRankId, pausedRankId 
FROM users 
WHERE rankPaused = true 
  AND donationRankId IS NOT NULL;

-- Fix them (optional)
UPDATE users
SET 
  pausedRankId = donationRankId,
  donationRankId = null
WHERE rankPaused = true 
  AND donationRankId IS NOT NULL;
```

**Note:** This is optional. The system will work correctly going forward.

## Configuration

### Current Behavior (Pause Removes Rank)
```typescript
// In pause route
donationRankId: null  // Remove rank during pause
```

### Alternative (Keep Rank During Pause) - NOT RECOMMENDED
```typescript
// If you wanted users to keep rank while paused:
// Don't set donationRankId to null
// Just set rankPaused flag

// But this is NOT recommended because:
// - Users have perks without paying
// - Confusing UX
// - Not fair to active subscribers
```

**We recommend the current behavior (remove rank)!**

## Summary

### ✅ What Changed

**Before:**
- Pause → Rank stays visible
- User keeps perks without paying
- Confusing behavior

**After:**
- Pause → Rank removed (no badge, no perks)
- Resume → Rank restored (everything back)
- Clear, fair behavior

### 📊 Impact

- ✅ Fairer to active subscribers
- ✅ Clearer user experience
- ✅ Industry-standard behavior
- ✅ Incentivizes users to stay active or resume quickly
- ✅ No confusion about who has active ranks

### 🎯 Result

Pausing now properly removes rank and perks, with full restoration on resume. This matches user expectations and industry standards!

---

**Status:** ✅ Fixed and Ready for Testing

Users who pause will now lose their rank badge and perks until they resume!
