# Extend vs Subscribe - How It Works

## Your Question

> "Toggle OFF 'Make this recurring' to extend your current rank - Would this disable the subscription or would it extend the subscription or neither?"

## The Answer: **It EXTENDS (Adds Bonus Days)**

When a user with an active subscription toggles OFF "Make this recurring" and makes a purchase:

### ✅ What DOES Happen

1. **One-time payment processed** (not a recurring charge)
2. **Days are added to rank expiration** (extends the rank)
3. **Subscription stays active** (continues auto-renewing)
4. **User gets bonus time on top of their subscription**

### ❌ What DOES NOT Happen

1. **Subscription is NOT cancelled**
2. **Subscription is NOT paused**
3. **Subscription is NOT modified in any way**
4. **Auto-renewal continues as normal**

## Example Scenario

```
User's Current State:
├─ Active Subscription: $10/month auto-renewing
├─ Rank: Gold Supporter
└─ Expiration: December 1, 2025

User Action:
├─ Goes to /donations/subscribe
├─ Selects: Gold Supporter + 30 days
├─ Toggles OFF "Make this recurring" (one-time payment)
└─ Pays: $10 (one-time)

Result:
├─ Subscription: Still active, still $10/month auto-renewing ✅
├─ Rank: Still Gold Supporter ✅
├─ Expiration: NOW December 31, 2025 (30 days added!) ✅
└─ Next auto-renewal: Still scheduled for December 1 as planned ✅
```

## How the Code Works

### Checkout API Logic

```typescript
// In create-checkout-session/route.ts

// If user has active subscription and trying one-time payment
if (user.stripeCustomerId && !isRecurring) {
  const existingSubs = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: 'active',
    limit: 1,
  });

  if (existingSubs.data.length > 0) {
    console.log('User has active subscription but purchasing one-time extension - allowing');
    // This is OK - just adds days, doesn't affect subscription billing
  }
}
```

**Key Points:**
- `!isRecurring` = one-time payment (not a subscription)
- Checks for existing active subscriptions
- Explicitly allows it: "just adds days, doesn't affect subscription billing"

### What Gets Created in Stripe

**One-Time Payment:**
```json
{
  "mode": "payment",  // NOT "subscription"
  "line_items": [{
    "price_data": {
      "recurring": null,  // NOT recurring
      "unit_amount": 1000,
      "currency": "usd"
    },
    "quantity": 1
  }]
}
```

**Existing Subscription (unchanged):**
```json
{
  "id": "sub_xxx",
  "status": "active",
  "current_period_end": 1733011200,  // December 1
  "cancel_at_period_end": false,
  // ... continues as normal
}
```

## User Interface Clarification

### Updated Banner Message

**Before (Confusing):**
> "Toggle OFF 'Make this recurring' to extend your current rank!"

**After (Clear):**
> "Want to extend your rank? Toggle OFF 'Make this recurring' to make a one-time payment. This adds extra days to your rank expiration.
> 
> ℹ️ Your existing subscription stays active and continues auto-renewing. This just adds bonus days on top!"

### What Users See

1. **Alert Banner** at top of subscribe page
2. **Recurring toggle** defaulted to OFF
3. **Clear explanation** that subscription stays active
4. **Proceed to checkout** for one-time payment
5. **Success message** shows days added

## Why This Is Useful

### Use Cases

**1. Going on Vacation**
```
User: "I'll be gone for 2 months, want to keep rank but not pay monthly"
Solution: Pause subscription, buy 60 days one-time
Result: Rank active for 60 days, no monthly charges
```

**2. Special Event**
```
User: "Server hosting a tournament, want to extend rank for 30 extra days"
Solution: Buy 30 days one-time while keeping subscription
Result: Rank extended through tournament, subscription continues after
```

**3. Gifting Time**
```
User: "Want to buy 90 days for a friend who already subscribes"
Solution: Purchase 90-day one-time on their account
Result: They get 90 bonus days, their subscription unchanged
```

**4. Testing a Rank**
```
User: "Want to try a higher rank for 30 days before committing"
Solution: Buy higher rank for 30 days one-time
Result: Try rank for 30 days, current subscription stays at current rank
```

## Comparison Table

| Feature | One-Time Payment | Subscription |
|---------|-----------------|--------------|
| **Payment** | Once | Monthly/Recurring |
| **Duration** | Fixed (30/90/180/365 days) | Ongoing |
| **Auto-renewal** | No | Yes |
| **Cancellation** | N/A (already paid) | Can cancel anytime |
| **Stacking** | ✅ Adds to existing expiration | ❌ Only one active sub per rank |
| **Pausing** | N/A | ✅ Can pause/resume |
| **Existing Sub** | ✅ Allowed (adds days) | ❌ Blocked (duplicate) |

## Technical Flow

```
User with Active Subscription visits /donations/subscribe
↓
API: checkActiveRank() detects active subscription
↓
UI: Shows banner + defaults to one-time payment
↓
User: Selects rank + duration (e.g., Gold + 30 days)
↓
User: Clicks "Continue to Checkout" (recurring is OFF)
↓
API: create-checkout-session receives isRecurring=false
↓
API: Detects active subscription + one-time = ALLOW
↓
Stripe: Creates one-time payment session (NOT subscription)
↓
User: Completes payment
↓
Webhook: Processes payment success
↓
Database: Adds 30 days to rankExpiresAt
↓
Result: 
  ├─ Rank expiration extended by 30 days ✅
  ├─ Subscription unchanged ✅
  └─ Next renewal unchanged ✅
```

## Error Prevention

### What IS Blocked

**1. Creating Duplicate Subscription (Same Rank)**
```
Scenario: Active Gold subscription, tries to create another Gold subscription
Result: ❌ BLOCKED - "You already have an active subscription for this rank"
Reason: Would create duplicate charges
```

**2. Creating Different Rank Subscription**
```
Scenario: Active Gold subscription, tries to create Diamond subscription
Result: ⚠️ WARNED - "You already have an active subscription for a different rank"
Action: Suggests upgrading existing subscription instead
```

### What IS Allowed

**3. One-Time Payment (Any Rank)**
```
Scenario: Active Gold subscription, buys 30 days of Gold one-time
Result: ✅ ALLOWED - Adds 30 days to expiration
Reason: Just adds time, doesn't affect billing
```

## FAQ

**Q: Does this create a second subscription?**
A: No! It's a one-time payment, not a subscription. You'll only have ONE subscription.

**Q: Will I be charged twice per month?**
A: No! Your subscription charges once per month as normal. The one-time payment is separate and never repeats.

**Q: What happens to the extra days when my subscription renews?**
A: They stack! If you have 90 days of rank time and your subscription adds 30 more, you'll have 120 total.

**Q: Can I cancel my subscription and keep the extra days?**
A: Yes! If you cancel your subscription, the days you purchased one-time will remain. Your rank stays active until those days expire.

**Q: Can I extend a different rank than I'm subscribed to?**
A: Yes, but be careful! If you're subscribed to Gold and buy 30 days of Diamond one-time, you'll have Diamond for 30 days, then it drops back to Gold when your subscription renews.

**Q: Is this the same as pausing my subscription?**
A: No! Pausing stops your subscription billing temporarily. This is buying EXTRA days on top of your active subscription.

## Summary

**The "Toggle OFF recurring" feature allows:**
- ✅ Existing subscribers to add bonus days
- ✅ One-time payments that stack with subscriptions
- ✅ Flexibility to extend rank without modifying subscription
- ✅ No risk of duplicate charges or billing conflicts

**It does NOT:**
- ❌ Cancel your subscription
- ❌ Pause your subscription
- ❌ Change your subscription in any way
- ❌ Stop auto-renewal

**Think of it like:**
- Your subscription = Netflix subscription (keeps auto-renewing)
- One-time purchase = Buying a movie (one-time, adds to your content)
- Both work together without conflict

---

**Status:** Clear, documented, and working as intended! ✅
