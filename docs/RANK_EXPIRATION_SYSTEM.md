# Rank Auto-Expiration System

Complete documentation for the automatic rank expiration system that removes expired donation ranks from users.

## Overview

The rank expiration system automatically removes donation ranks from users when their subscription period ends. This runs hourly via a Vercel cron job and can also be triggered manually by admins.

## How It Works

### 1. Automatic Hourly Check

**Cron Schedule:** Every hour at minute 0 (e.g., 1:00 AM, 2:00 AM, etc.)

```json
{
  "path": "/api/cron/expire-ranks",
  "schedule": "0 * * * *"
}
```

**Process:**
1. Vercel triggers `/api/cron/expire-ranks` at the scheduled time
2. Endpoint verifies `CRON_SECRET` for security
3. Queries database for users with expired ranks
4. Removes rank from each expired user
5. Logs results to console
6. Returns summary of actions taken

### 2. Query Logic

**SQL Logic (using Drizzle ORM):**
```typescript
const expiredUsers = await db
  .select({
    id: users.id,
    username: users.username,
    donationRankId: users.donationRankId,
    rankExpiresAt: users.rankExpiresAt,
  })
  .from(users)
  .where(
    and(
      isNotNull(users.donationRankId),
      isNotNull(users.rankExpiresAt),
      lt(users.rankExpiresAt, now)  // rankExpiresAt < current time
    )
  )
  .limit(100);
```

**Conditions:**
- User must have a `donationRankId` (not null)
- User must have a `rankExpiresAt` timestamp (not null)
- `rankExpiresAt` must be **less than** current time (expired)
- Processes up to 100 users per run (batched for safety)

### 3. Removal Process

For each expired user:
```typescript
await db
  .update(users)
  .set({
    donationRankId: null,
    rankExpiresAt: null,
    updatedAt: new Date(),
  })
  .where(eq(users.id, user.id));
```

**Changes:**
- Sets `donationRankId` to `null`
- Sets `rankExpiresAt` to `null`
- Updates `updatedAt` timestamp

**Note:** User's `totalDonated` is preserved (never reset)

## API Endpoints

### 1. Cron Endpoint (Automated)

**Endpoint:** `GET /api/cron/expire-ranks`

**Security:** Requires `CRON_SECRET` in Authorization header

**Headers:**
```http
Authorization: Bearer your-cron-secret-here
```

**Response:**
```json
{
  "success": true,
  "checked": 5,
  "removed": 3,
  "removedUsers": [
    { "id": 123, "username": "user1", "rankId": "vip" },
    { "id": 456, "username": "user2", "rankId": "vip-plus" },
    { "id": 789, "username": "user3", "rankId": "mvp" }
  ],
  "timestamp": "2026-01-05T10:00:00.000Z"
}
```

**Usage:** Called automatically by Vercel Cron (no manual intervention needed)

### 2. Admin Endpoint (Manual Trigger)

**Endpoint:** `GET /api/admin/expire-ranks`

**Security:** Requires admin authentication (session-based)

**Response:**
```json
{
  "success": true,
  "removed": 2,
  "users": ["user1", "user3"],
  "triggeredBy": "admin_username",
  "timestamp": "2026-01-05T10:15:30.000Z"
}
```

**Usage:** For manual testing or emergency cleanup

## Configuration

### Environment Variables

Add to `.env` or `.env.local`:

```bash
# Generate a secure secret with: openssl rand -base64 32
CRON_SECRET=your-random-secure-secret-here
```

**Security Note:** Keep this secret private! Anyone with this secret can trigger the cron job.

### Vercel Cron Configuration

File: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-ranks",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Schedule Syntax:** [Cron expression format](https://crontab.guru/)
- `0 * * * *` = Every hour at minute 0
- `*/30 * * * *` = Every 30 minutes
- `0 */2 * * *` = Every 2 hours

## Testing

### Manual Testing (Admin Panel)

1. Login as admin
2. Open browser console or use API client
3. Call: `GET /api/admin/expire-ranks`
4. Check response for removed users

Example with `curl`:
```bash
curl -H "Cookie: next-auth.session-token=your-session" \
     http://localhost:3000/api/admin/expire-ranks
```

### Local Testing (Cron Endpoint)

```bash
curl -H "Authorization: Bearer your-cron-secret" \
     http://localhost:3000/api/cron/expire-ranks
```

### Testing in Development

**Option 1: Manually create expired rank**
```sql
UPDATE users 
SET donationRankId = 'vip', 
    rankExpiresAt = datetime('now', '-1 day')
WHERE username = 'testuser';
```

**Option 2: Use library function directly**
```typescript
import { removeExpiredRanks } from '@/lib/rank-subscription';

const result = await removeExpiredRanks();
console.log(`Removed ${result.removed} ranks:`, result.users);
```

## Monitoring

### Logs

Check Vercel logs or console output:

**Success:**
```
🕐 Running rank expiration check at 2026-01-05T10:00:00.000Z
🔍 Found 3 users with expired ranks
⏰ Removed expired rank vip from user john_doe (ID: 123)
⏰ Removed expired rank vip-plus from user jane_smith (ID: 456)
⏰ Removed expired rank mvp from user bob_jones (ID: 789)
✅ Rank expiration check complete: 3 ranks removed
```

**No Expirations:**
```
🕐 Running rank expiration check at 2026-01-05T11:00:00.000Z
🔍 Found 0 users with expired ranks
✅ Rank expiration check complete: 0 ranks removed
```

**Error:**
```
❌ Failed to remove rank for user 123: [error details]
❌ Rank expiration cron error: [error details]
```

### Vercel Dashboard

1. Go to Vercel Dashboard → Your Project
2. Click "Crons" tab
3. View execution history, success rate, logs

## Troubleshooting

### Cron Job Not Running

**Check:**
1. Is `vercel.json` deployed? (Commit and push it)
2. Is `CRON_SECRET` set in Vercel environment variables?
3. Check Vercel Crons tab for execution logs
4. Verify Vercel plan includes cron jobs (Hobby plan has limits)

**Solution:**
```bash
# Redeploy to ensure vercel.json is picked up
vercel --prod
```

### Ranks Not Being Removed

**Possible Causes:**

1. **Clock skew:** Server time doesn't match database time
   ```sql
   -- Check database time
   SELECT datetime('now') as db_time;
   ```

2. **Wrong date format:** Ensure dates are ISO 8601
   ```typescript
   // ✅ Correct
   rankExpiresAt: new Date().toISOString()
   
   // ❌ Wrong
   rankExpiresAt: Date.now()
   ```

3. **Query not finding users:**
   ```sql
   -- Manual check
   SELECT id, username, donationRankId, rankExpiresAt
   FROM users
   WHERE donationRankId IS NOT NULL
     AND rankExpiresAt IS NOT NULL
     AND rankExpiresAt < datetime('now');
   ```

### Manual Endpoint Returns 401

**Check:**
1. Are you logged in as admin?
2. Does your role have admin permissions?
3. Check session in browser DevTools → Application → Cookies

## Best Practices

### 1. Don't Remove Manually
❌ Don't set `donationRankId` to null manually in database
✅ Let the cron job handle it automatically

### 2. Monitor Logs
- Check Vercel logs weekly
- Set up alerts for cron job failures
- Monitor user reports of "rank didn't expire"

### 3. Graceful Handling
- System processes up to 100 users per run
- If >100 expired, next run will catch them
- No data loss if cron job fails (runs again in 1 hour)

### 4. Testing Before Production
```bash
# Test locally first
npm run dev
curl -H "Authorization: Bearer test" \
     http://localhost:3000/api/cron/expire-ranks

# Then test on staging/preview
# Finally deploy to production
```

## Related Systems

### Recurring Subscriptions

When a subscription auto-renews via Stripe webhook:
- User's `rankExpiresAt` is **extended** (not removed)
- Expiration only happens if payment fails or user cancels

**Webhook Flow:**
```
Payment Success → Extend rankExpiresAt by subscription interval
Payment Failure → Rank expires naturally via cron job
```

### Rank Upgrades

When user switches ranks:
- Old `rankExpiresAt` is replaced with new one
- Expiration clock resets to new rank's timeline
- No orphaned expirations

## Files Reference

**Core Logic:**
- `src/lib/rank-subscription.ts` - `removeExpiredRanks()` function

**API Endpoints:**
- `src/app/api/cron/expire-ranks/route.ts` - Automated cron endpoint
- `src/app/api/admin/expire-ranks/route.ts` - Manual admin endpoint

**Configuration:**
- `vercel.json` - Cron job schedule
- `.env.example` - CRON_SECRET template

**Database:**
- `src/db/schema.ts` - users.donationRankId, users.rankExpiresAt fields

## Summary

✅ **Automated:** Runs hourly without manual intervention
✅ **Secure:** Protected by CRON_SECRET
✅ **Logged:** All actions logged to console
✅ **Batched:** Processes 100 users at a time
✅ **Safe:** Preserves totalDonated, only removes rank
✅ **Testable:** Manual trigger endpoint for admins
✅ **Production-Ready:** Deployed via Vercel Crons

The system ensures donation ranks expire on time while maintaining data integrity and providing full observability.
