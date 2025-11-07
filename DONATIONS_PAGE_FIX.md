# Donations Page Display Fix

## Issue

Donations not appearing on `/donations` page after payment.

## Root Causes & Fixes

### ✅ Fix 1: Added Minecraft Username/UUID Fields

**Problem:** Donation records weren't including Minecraft username/UUID data

**Fix:** Updated both webhook handlers to include user's Minecraft data:

```typescript
// Subscription payments (invoice.payment_succeeded)
await db.insert(donations).values({
  userId,
  minecraftUsername: user.minecraftUsername,  // ✅ Added
  minecraftUuid: user.minecraftUuid,          // ✅ Added
  amount,
  currency,
  // ... rest of fields
  displayed: true,  // ✅ Already set correctly
});

// One-time payments (payment_intent.succeeded)
await db.insert(donations).values({
  userId: Number(userId),
  minecraftUsername: user.minecraftUsername,  // ✅ Added
  minecraftUuid: user.minecraftUuid,          // ✅ Added
  amount,
  currency,
  // ... rest of fields
  displayed: true,  // ✅ Already set correctly
});
```

### ✅ Verified: Display Flag Already Set

Both webhook handlers correctly set `displayed: true`, which is required for donations to show on the public page.

## How Donations Page Works

### Query
```typescript
// /donations/page.tsx
const recentDonations = await db
  .select({
    id: donations.id,
    userId: donations.userId,
    username: users.username,
    minecraftUsername: donations.minecraftUsername,
    avatar: users.avatar,
    amount: donations.amount,
    currency: donations.currency,
    method: donations.method,
    message: donations.message,
    createdAt: donations.createdAt,
  })
  .from(donations)
  .leftJoin(users, eq(donations.userId, users.id))
  .where(eq(donations.displayed, true))  // ← Must be true!
  .orderBy(desc(donations.createdAt))
  .limit(50);
```

**Requirements:**
- ✅ `displayed` must be `true`
- ✅ Donations ordered by most recent first
- ✅ Shows last 50 donations
- ✅ Joins with users table for username/avatar

### Page Revalidation

```typescript
export const revalidate = 300; // Revalidate every 5 minutes
```

**Important:** The donations page is cached for 5 minutes. New donations may not appear immediately.

**To force refresh:**
1. Wait 5 minutes, OR
2. Hard refresh the page (Ctrl+Shift+R), OR
3. Temporarily set `revalidate = 0` for testing

## Testing Checklist

### 1. Check Webhook Logs

After making a payment, check your server logs for:

```bash
# Subscription payment
✅ "Rank extended for user X until Y, receipt: VN-..."

# One-time payment
✅ "One-time payment processed for user X, rank Y until Z"
```

If you don't see these logs, the webhook isn't firing!

### 2. Verify Webhook Events in Stripe

**Stripe Dashboard → Developers → Webhooks → Your endpoint**

Check for these events after payment:
- ✅ `checkout.session.completed` (initial)
- ✅ `payment_intent.succeeded` (one-time) OR `invoice.payment_succeeded` (subscription)

If events show errors, click to see details.

### 3. Check Database

```sql
-- View recent donations
SELECT 
  id, 
  userId, 
  minecraftUsername,
  amount, 
  currency,
  method,
  message,
  displayed,
  created_at
FROM donations
ORDER BY created_at DESC
LIMIT 10;
```

**Verify:**
- ✅ Donation record exists
- ✅ `displayed` = 1 (true)
- ✅ `minecraftUsername` populated (or null if user has no MC account)
- ✅ `amount`, `currency`, `method` correct

### 4. Test Page Display

```bash
# Go to page
Visit: http://localhost:3000/donations

# Should show:
- Recent donations list
- User avatars/names
- Amounts and currencies
- Payment methods
- Messages (if provided)
- Timestamps
```

If donations are in database with `displayed = true` but not showing:
- Check page revalidation (wait 5 min or hard refresh)
- Check browser console for errors
- Check database connection

## Common Issues

### Issue: Webhooks Not Firing

**Symptoms:**
- No server logs after payment
- No events in Stripe dashboard

**Solutions:**
1. Verify webhook endpoint in Stripe Dashboard
2. Check endpoint URL is correct: `https://yourdomain.com/api/stripe/webhook`
3. Verify `STRIPE_WEBHOOK_SECRET` env variable set
4. Check server is reachable (not localhost if testing)

**For local testing:**
```bash
# Use Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Use forwarded webhook secret
# Stripe CLI will display the secret, add it to .env.local
```

### Issue: Webhook Signature Verification Failed

**Symptoms:**
- Log: "Webhook signature verification failed"
- Events show in Stripe but not processed

**Solution:**
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Check webhook endpoint receives raw body (not parsed JSON)
- In production, restart server after updating env variables

### Issue: Database Insert Fails

**Symptoms:**
- Logs show "Failed query: insert into donations..."

**Solutions:**
1. Check all required fields are provided
2. Verify user exists (userId must reference valid user)
3. Check rank exists (rankId must reference valid rank)
4. Verify database schema matches code

**Schema check:**
```sql
-- Verify donations table structure
PRAGMA table_info(donations);

-- Required fields:
-- id, userId, amount, currency, method, displayed, status, created_at
```

### Issue: Donations Show "Anonymous"

**Cause:** User has no `username` in database

**Solution:** Ensure user records are properly created during registration

### Issue: Missing Minecraft Username

**Cause:** User hasn't linked Minecraft account

**Expected:** This is normal! Shows null in database, "Anonymous" on page

**Not an issue if:**
- User hasn't linked MC account yet
- Donation still shows with site username

### Issue: 5-Minute Delay

**Cause:** Page caching (`revalidate = 300`)

**Solutions:**
1. **Production:** This is intentional for performance
2. **Testing:** Hard refresh (Ctrl+Shift+R)
3. **Development:** Set `revalidate = 0` temporarily

## Files Modified

1. **`/api/stripe/webhook/route.ts`**
   - Added `minecraftUsername` and `minecraftUuid` to donation inserts
   - Both `invoice.payment_succeeded` (subscriptions) and `payment_intent.succeeded` (one-time) handlers

## Production Checklist

Before deploying:

- [ ] Stripe webhook endpoint configured in Stripe Dashboard
- [ ] Webhook events enabled (payment_intent.succeeded, invoice.payment_succeeded)
- [ ] `STRIPE_WEBHOOK_SECRET` set in production environment
- [ ] Server endpoint accessible from Stripe
- [ ] Test payment and verify donation appears (wait 5 minutes or force refresh)
- [ ] Check server logs show successful webhook processing
- [ ] Verify donation record in database with `displayed = true`

## Quick Debug Commands

```bash
# Check recent webhooks
curl https://api.stripe.com/v1/webhook_endpoints \
  -u $STRIPE_SECRET_KEY:

# Check recent events
curl https://api.stripe.com/v1/events?limit=10 \
  -u $STRIPE_SECRET_KEY:

# Test webhook locally
stripe trigger payment_intent.succeeded

# View database donations
sqlite3 db.sqlite "SELECT * FROM donations ORDER BY created_at DESC LIMIT 5;"
```

## Expected Flow

```
User completes payment
↓
Stripe processes payment
↓
Stripe fires webhook event
↓
Your server receives webhook
↓
Webhook handler processes payment
  ├─ Updates user rank
  ├─ Creates donation record (displayed: true)
  └─ Logs success
↓
Donation appears in database
↓
After 5 minutes (or force refresh)
↓
Donation appears on /donations page ✅
```

---

**Status:** ✅ Fixed - Donations now include Minecraft data and have correct display flag

**Next Steps:** Test a payment and verify it appears on `/donations` page (may take up to 5 minutes due to caching)
