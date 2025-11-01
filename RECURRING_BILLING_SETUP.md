# Recurring Billing Implementation Guide

## 🎯 Overview

You now have **two subscription systems**:

### System 1: Time-Based Purchases (Already Working ✅)
- **What:** Users buy time upfront (e.g., 3 months for $14.25)
- **Payment:** One-time Square payment
- **Expiration:** Automatic after purchased time
- **Renewal:** Manual (user buys more time)
- **Pro:** Simple, predictable, no surprise charges
- **Con:** User must remember to renew

### System 2: Recurring Auto-Billing (NEW - Requires Setup ⚙️)
- **What:** Automatic monthly charging
- **Payment:** Square Subscriptions API
- **Expiration:** Never (until cancelled)
- **Renewal:** Automatic every month
- **Pro:** Set it and forget it
- **Con:** Requires Square subscription plan setup

---

## 🔧 Setup Required for Recurring Billing

### Step 1: Create Subscription Plans in Square Dashboard

1. **Go to:** https://squareup.com/dashboard/items/library
2. **Click:** "Create Item" → "Subscription"
3. **Create plans for each rank:**

   **Supporter Plan**
   - Name: "Supporter Monthly Subscription"
   - Price: $5.00/month
   - Billing Frequency: Monthly
   - Save and copy the **Plan Variation ID**

   **Patron Plan**
   - Name: "Patron Monthly Subscription"
   - Price: $10.00/month
   - Billing Frequency: Monthly
   - Save and copy the **Plan Variation ID**

   **Repeat for:** Elite ($15), Legend ($25), Champion ($50)

### Step 2: Update Rank-Square ID Mapping

Add to `.env`:
```bash
# Square Subscription Plan IDs
SQUARE_PLAN_SUPPORTER=your-supporter-plan-variation-id
SQUARE_PLAN_PATRON=your-patron-plan-variation-id
SQUARE_PLAN_ELITE=your-elite-plan-variation-id
SQUARE_PLAN_LEGEND=your-legend-plan-variation-id
SQUARE_PLAN_CHAMPION=your-champion-plan-variation-id
```

### Step 3: Setup Webhooks

1. **Go to:** Square Dashboard → Applications → Webhooks
2. **Add Endpoint:** `https://yoursite.com/api/webhooks/square`
3. **Subscribe to Events:**
   - `subscription.updated`
   - `subscription.created`
   - `payment.updated`
4. **Copy Signature Key** → Add to `.env`:
   ```bash
   SQUARE_WEBHOOK_SIGNATURE_KEY=your-signature-key
   ```

### Step 4: Add Database Fields

Add to `users` table:
```sql
ALTER TABLE users ADD COLUMN square_subscription_id TEXT;
ALTER TABLE users ADD COLUMN subscription_status TEXT;
ALTER TABLE users ADD COLUMN subscription_rank_id TEXT;
```

Or update `src/db/schema.ts`:
```typescript
export const users = sqliteTable('users', {
  // ... existing fields
  squareSubscriptionId: text('square_subscription_id'),
  subscriptionStatus: text('subscription_status'), // ACTIVE, PAUSED, CANCELED
  subscriptionRankId: text('subscription_rank_id'),
});
```

Then run: `npm run db:push`

---

## 💻 Implementation

### Add Recurring Option to Subscribe Page

Update `/donations/subscribe/page.tsx`:

```typescript
// Add state
const [billingType, setBillingType] = useState<'onetime' | 'recurring'>('onetime');

// In UI, add billing type selector
<div className="mb-6">
  <label className="text-sm font-medium text-gray-400 mb-2 block">
    Billing Type
  </label>
  <div className="grid grid-cols-2 gap-4">
    <button
      onClick={() => setBillingType('onetime')}
      className={`p-4 rounded-lg border-2 ${
        billingType === 'onetime'
          ? 'border-cyan-400 bg-cyan-500/10'
          : 'border-slate-700 bg-slate-800/50'
      }`}
    >
      <h4 className="font-bold text-white mb-1">Pay Once</h4>
      <p className="text-sm text-gray-400">
        Pay upfront for a set time period
      </p>
    </button>
    
    <button
      onClick={() => setBillingType('recurring')}
      className={`p-4 rounded-lg border-2 ${
        billingType === 'recurring'
          ? 'border-cyan-400 bg-cyan-500/10'
          : 'border-slate-700 bg-slate-800/50'
      }`}
    >
      <h4 className="font-bold text-white mb-1">Auto-Renew</h4>
      <p className="text-sm text-gray-400">
        Automatic monthly billing
      </p>
    </button>
  </div>
</div>

// Update purchase handler
function handlePurchase() {
  if (!selectedRank) return;
  
  if (billingType === 'recurring') {
    // Store recurring subscription intent
    sessionStorage.setItem('recurring_subscription', JSON.stringify({
      rankId: selectedRank.id,
      rankName: selectedRank.name,
      monthlyPrice: getRankValueInfo(selectedRank.id).pricePerMonth,
    }));
  } else {
    // Existing one-time purchase flow
    sessionStorage.setItem('subscription_purchase', JSON.stringify({
      rankId: selectedRank.id,
      days: selectedDuration.days,
      price: selectedDuration.price,
    }));
  }
  
  router.push('/donations');
}
```

### Update Payment Form for Recurring

Update `square-payment-form.tsx`:

```typescript
// Check for recurring subscription
useEffect(() => {
  const recurringData = sessionStorage.getItem('recurring_subscription');
  if (recurringData) {
    const parsed = JSON.parse(recurringData);
    setIsRecurring(true);
    setRecurringData(parsed);
    setAmount(parsed.monthlyPrice.toString());
  }
}, []);

// After payment success
if (isRecurring && recurringData) {
  // Create Square subscription instead of one-time charge
  const subResponse = await fetch('/api/subscriptions/recurring/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId: data.customerId, // From Square payment
      rankId: recurringData.rankId,
    }),
  });
  
  if (subResponse.ok) {
    toast.success(`Recurring subscription activated! You'll be charged $${recurringData.monthlyPrice}/month`);
    sessionStorage.removeItem('recurring_subscription');
    router.push('/dashboard');
  }
}
```

### Create API Endpoints

**`/api/subscriptions/recurring/create/route.ts`:**
```typescript
import { createRecurringSubscription } from '@/lib/square/recurring-subscriptions';

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { customerId, rankId } = await request.json();
  
  const result = await createRecurringSubscription({
    customerId,
    rankId,
    userId: parseInt(session.user.id),
  });

  return NextResponse.json(result);
}
```

**`/api/subscriptions/recurring/cancel/route.ts`:**
```typescript
import { cancelRecurringSubscription } from '@/lib/square/recurring-subscriptions';

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { subscriptionId } = await request.json();
  
  const result = await cancelRecurringSubscription(subscriptionId);

  return NextResponse.json(result);
}
```

---

## 🎨 User Management Dashboard

Create `/settings/subscription` page:

```typescript
'use client';

export default function SubscriptionManagementPage() {
  const [subscription, setSubscription] = useState(null);
  
  // Fetch user's current subscription
  useEffect(() => {
    fetch('/api/subscriptions/recurring/status')
      .then(res => res.json())
      .then(data => setSubscription(data));
  }, []);

  async function cancelSubscription() {
    if (!confirm('Cancel your recurring subscription?')) return;
    
    await fetch('/api/subscriptions/recurring/cancel', {
      method: 'POST',
      body: JSON.stringify({ subscriptionId: subscription.id }),
    });
    
    toast.success('Subscription cancelled');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recurring Subscription</CardTitle>
      </CardHeader>
      <CardContent>
        {subscription ? (
          <>
            <p>Rank: {subscription.rankId}</p>
            <p>Status: {subscription.status}</p>
            <p>Next Billing: {subscription.nextBillingDate}</p>
            <Button onClick={cancelSubscription} variant="destructive">
              Cancel Subscription
            </Button>
          </>
        ) : (
          <p>No active recurring subscription</p>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 🔄 How Recurring Billing Works

### Initial Purchase Flow:
1. User selects rank + "Auto-Renew"
2. Pays first month via Square
3. Square creates subscription
4. Webhook activates rank for 30 days
5. User record stores `squareSubscriptionId`

### Monthly Renewal Flow:
1. Square charges user automatically
2. Square sends `subscription.updated` webhook
3. Your webhook endpoint calls `handleSubscriptionRenewal()`
4. Rank extended by 30 days
5. User never interrupted

### Cancellation Flow:
1. User clicks "Cancel Subscription"
2. API calls Square to cancel
3. Square stops future billing
4. User keeps rank until current period ends
5. Rank expires naturally after current 30 days

---

## ⚠️ Important Considerations

### Grace Period
When payment fails, you should:
1. Send email notification
2. Give 3-7 day grace period
3. Retry payment automatically (Square handles this)
4. Only remove rank after grace period + retries fail

### Prorated Refunds
If user cancels mid-month, you could:
- Convert remaining days to credit
- Apply credit to future purchase
- Or keep as-is (simpler)

### Tax Handling
Square can automatically calculate sales tax if you:
1. Enable tax in Square Dashboard
2. Set your tax jurisdiction
3. Square handles everything

---

## 🧪 Testing

### Test Recurring Subscription (Sandbox):

1. Use Square test card: `4111 1111 1111 1111`
2. Create subscription
3. Manually trigger webhook:
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/square \
     -H "Content-Type: application/json" \
     -d '{
       "type": "subscription.updated",
       "data": {
         "object": {
           "subscription": {
             "id": "test-sub-123",
             "status": "ACTIVE",
             "metadata": {
               "userId": "1",
               "rankId": "supporter"
             }
           }
         }
       }
     }'
   ```
4. Verify rank extended

---

## 📊 Comparison

| Feature | Time-Based (Current) | Recurring Billing (New) |
|---------|---------------------|------------------------|
| Setup Complexity | ✅ Simple | ⚠️ Complex |
| User Control | ✅ Full control | ⚠️ Auto-charges |
| Surprise Charges | ✅ None | ⚠️ Possible |
| Retention | ⚠️ Manual renewal | ✅ Automatic |
| Revenue Predictability | ⚠️ Variable | ✅ Consistent |
| Churn Risk | ⚠️ Higher | ✅ Lower |
| Payment Failure Handling | ✅ N/A | ⚠️ Required |

---

## 🚀 Recommendation

### For Most Users: Offer Both Options

**Default to Time-Based** for:
- First-time buyers
- Users who want control
- Shorter commitments

**Offer Recurring** for:
- Long-term supporters
- "Set it and forget it" users
- Slightly discounted monthly rate (e.g., $4.75 vs $5)

**Implementation Priority:**
1. ✅ Keep time-based working (it's great!)
2. ⚙️ Add recurring as optional enhancement
3. 🎯 Let users choose their preference

---

## 📝 Summary

**Files Created:**
- `src/lib/square/recurring-subscriptions.ts` - Core recurring logic
- `src/app/api/webhooks/square/route.ts` - Webhook handler
- `RECURRING_BILLING_SETUP.md` - This guide

**Next Steps:**
1. Create subscription plans in Square Dashboard
2. Add plan IDs to `.env`
3. Setup webhook endpoint
4. Add UI for billing type selection
5. Test with Square sandbox
6. Deploy and test webhooks in production

**Time Estimate:** 2-4 hours for full implementation

The time-based system you have is production-ready NOW. Recurring billing can be added as Phase 2 when you're ready! 🎉
