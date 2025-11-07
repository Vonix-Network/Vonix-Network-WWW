# Subscription Feature Flag

## Overview

The `ENABLE_SUBSCRIPTIONS` environment variable allows you to enable or disable recurring subscription functionality site-wide. This is useful for:

- **Safe Deployments**: Deploy with subscriptions disabled initially, enable later
- **Testing**: Test one-time payments before enabling subscriptions
- **Maintenance**: Temporarily disable subscriptions during updates
- **Gradual Rollout**: Enable subscriptions when you're ready

## Configuration

### Environment Variable

Add to your `.env` file:

```bash
# Enable subscriptions (default if not set)
ENABLE_SUBSCRIPTIONS=true

# Disable subscriptions
ENABLE_SUBSCRIPTIONS=false
```

### Default Behavior

**If not set**: Subscriptions are **ENABLED** by default

This means you can deploy without setting this variable and subscriptions will work. You only need to set it to `false` if you want to explicitly disable them.

## What Happens When Disabled

### User Experience

When `ENABLE_SUBSCRIPTIONS=false`:

1. **Subscribe Page**: 
   - "Make this recurring" toggle is hidden
   - Users can only make one-time donations
   - No mention of subscriptions visible

2. **API Behavior**:
   - Subscription checkout attempts return error:
     ```json
     {
       "error": "SUBSCRIPTIONS_DISABLED",
       "message": "Recurring subscriptions are temporarily unavailable. You can still make one-time donations.",
       "suggestion": "Please use one-time payment option instead."
     }
     ```

3. **Existing Subscriptions**:
   - Still process renewals normally via webhooks
   - Users can still manage/cancel existing subscriptions
   - Only **new** subscription creation is blocked

### What Still Works

✅ One-time donations  
✅ Existing subscription renewals  
✅ Subscription management (cancel, view)  
✅ Rank extensions (one-time)  
✅ All other payment features

### What's Disabled

❌ Creating new recurring subscriptions  
❌ "Make this recurring" toggle  
❌ Subscription upgrade/downgrade flows

## Use Cases

### 1. Safe Initial Deployment

Deploy to production with subscriptions disabled:

```bash
# .env.production
ENABLE_SUBSCRIPTIONS=false
```

Test everything, then enable when ready:

```bash
# Update .env.production
ENABLE_SUBSCRIPTIONS=true
```

Restart the application to apply changes.

### 2. Testing Phase

Test one-time payments first:

```bash
# .env
ENABLE_SUBSCRIPTIONS=false
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_test_...
```

Once satisfied, enable subscriptions:

```bash
ENABLE_SUBSCRIPTIONS=true
```

### 3. Maintenance Window

Temporarily disable new subscriptions during Stripe maintenance:

```bash
# Before maintenance
ENABLE_SUBSCRIPTIONS=false

# After maintenance
ENABLE_SUBSCRIPTIONS=true
```

### 4. Gradual Rollout

1. Deploy with subscriptions disabled
2. Monitor one-time payments
3. Enable subscriptions for all users at once
4. Monitor subscription creation and renewals

## Implementation Details

### Backend

**Config Check**: `src/lib/subscription-config.ts`
```typescript
isSubscriptionsEnabled(): boolean
```

**API Endpoint**: `src/app/api/subscriptions/config/route.ts`
```
GET /api/subscriptions/config
→ { enabled: true/false, message: "..." }
```

**Checkout Integration**: `src/app/api/stripe/create-checkout-session/route.ts`
- Checks flag before creating subscription checkout
- Returns user-friendly error if disabled

### Frontend

Check subscription availability:

```typescript
const response = await fetch('/api/subscriptions/config');
const { enabled } = await response.json();

if (enabled) {
  // Show subscription toggle
} else {
  // Hide subscription toggle
}
```

## Checking Current Status

### Via API

```bash
curl https://vonix.network/api/subscriptions/config
```

Response:
```json
{
  "enabled": true,
  "message": "Recurring subscriptions are available"
}
```

### Via Logs

When a user tries to subscribe with subscriptions disabled:

```
⚠️ Subscription attempt blocked: ENABLE_SUBSCRIPTIONS is disabled
```

### Via Admin (Future)

Could add to admin dashboard:
- Current status indicator
- Toggle to enable/disable
- Count of active subscriptions

## Migration Guide

### Enabling Subscriptions (First Time)

1. **Ensure Stripe is configured**:
   ```bash
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

2. **Enable subscriptions**:
   ```bash
   ENABLE_SUBSCRIPTIONS=true
   ```

3. **Restart application**

4. **Test subscription creation**:
   - Visit `/donations/subscribe`
   - Toggle "Make this recurring"
   - Complete test purchase

5. **Monitor webhooks**:
   - Check Stripe dashboard
   - Verify `invoice.payment_succeeded` events

### Disabling Subscriptions

1. **Set environment variable**:
   ```bash
   ENABLE_SUBSCRIPTIONS=false
   ```

2. **Restart application**

3. **Notify users** (optional):
   - Add banner: "Subscriptions temporarily unavailable"
   - Update FAQ/documentation

4. **Monitor existing subscriptions**:
   - Renewals still process normally
   - Webhooks still handled

### Re-enabling Subscriptions

1. **Set environment variable**:
   ```bash
   ENABLE_SUBSCRIPTIONS=true
   ```

2. **Restart application**

3. **Test functionality**:
   - Create test subscription
   - Verify webhook processing

4. **Remove any user notifications**

## Best Practices

### Deployment Strategy

**Option A: Cautious (Recommended)**
1. Deploy with `ENABLE_SUBSCRIPTIONS=false`
2. Test one-time payments in production
3. Enable subscriptions after 24-48 hours
4. Monitor closely

**Option B: Confident**
1. Deploy with `ENABLE_SUBSCRIPTIONS=true`
2. Monitor from start
3. Disable if issues arise

### Monitoring

After enabling subscriptions, watch for:

- Successful subscription creations
- Webhook delivery (Stripe dashboard)
- User rank assignments
- Payment failures
- Error logs

### Troubleshooting

**Subscriptions not working?**
1. Check `.env` has `ENABLE_SUBSCRIPTIONS=true`
2. Verify application restarted after change
3. Check `/api/subscriptions/config` endpoint
4. Check browser console for errors

**Users reporting issues?**
1. Check webhook delivery in Stripe
2. Verify Stripe product auto-sync is working
3. Check application logs for errors
4. Temporarily disable if critical issue

## Security Considerations

### Safety of Default "True"

✅ **Safe**: The default "true" is safe because:
- Requires valid Stripe configuration
- Auto-sync creates products on-demand
- Comprehensive error handling
- Webhook validation
- User authentication required

### Disabling for Safety

You might want `false` by default if:
- Testing new Stripe account
- Migrating from another payment provider
- Unsure about subscription handling
- Want to audit before enabling

## Summary

The `ENABLE_SUBSCRIPTIONS` feature flag provides:

✅ **Safe Deployment** - Start with subscriptions off  
✅ **Gradual Rollout** - Enable when ready  
✅ **Emergency Off-Switch** - Disable if issues arise  
✅ **Testing Flexibility** - Test payments separately  
✅ **Default Enabled** - Works out of the box  
✅ **No Code Changes** - Just environment variable  

Use this to deploy confidently and enable subscriptions on your timeline! 🚀
