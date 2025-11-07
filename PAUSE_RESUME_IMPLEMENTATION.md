# Subscription Pause/Resume Implementation

## ✅ Fully Implemented

### Overview
Users can now pause their subscriptions in Stripe Customer Portal, and the system will automatically track the pause duration and extend their rank expiration when they resume.

---

## 🔧 How It Works

### **1. Pausing a Subscription**

**User Action:**
1. User goes to `/settings/billing`
2. Clicks "Open Stripe Customer Portal"
3. In Stripe portal, clicks "Pause subscription"

**System Response (Webhook):**
1. Stripe sends `customer.subscription.paused` event
2. System calculates remaining days on current rank
3. System stores pause state in database:
   - `rankPaused` = true
   - `pausedRankId` = current rank ID
   - `pausedRemainingDays` = days remaining
   - `pausedAt` = pause timestamp

**What User Sees:**
- Billing page shows "Paused" badge (cyan)
- Alert shows: "Paused X days ago. When you resume, X days will be added."
- Rank stays active until natural expiration

---

### **2. Resuming a Subscription**

**User Action:**
1. User goes to Stripe Customer Portal
2. Clicks "Resume subscription"

**System Response (Webhook):**
1. Stripe sends `customer.subscription.resumed` event
2. System calculates pause duration: `now - pausedAt`
3. System extends rank expiration: `rankExpiresAt + pauseDurationDays`
4. System clears pause state:
   - `rankPaused` = false
   - `pausedRankId` = null
   - `pausedRemainingDays` = null
   - `pausedAt` = null
5. User keeps all benefits during pause period

**What User Sees:**
- Badge changes from "Paused" to "Active" (green)
- Expiration date extended by pause duration
- Normal renewal schedule continues

---

## 📊 Database Fields

### **users table** (pause tracking)
```typescript
rankPaused: integer('rank_paused', { mode: 'boolean' }).default(false)
pausedRankId: text('paused_rank_id')
pausedRemainingDays: integer('paused_remaining_days')
pausedAt: integer('paused_at', { mode: 'timestamp' })
```

---

## 🎯 Example Scenario

### **Timeline:**

**Day 0:** User subscribes to VIP ($5/month)
- Rank expires: Day 30

**Day 10:** User pauses subscription
- System stores: pausedAt = Day 10, pausedRemainingDays = 20
- Rank still expires: Day 30 (unchanged)

**Day 25:** User resumes subscription (15 days paused)
- System calculates: pause duration = 15 days
- New expiration: Day 30 + 15 = Day 45
- Next renewal will be Day 45 (not Day 40)

**Result:** User got 15 days "free" while paused

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     PAUSE SUBSCRIPTION                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌────────────────────────────────────────┐
        │  Stripe Portal: User clicks "Pause"    │
        └────────────────────────────────────────┘
                            │
                            ▼
        ┌────────────────────────────────────────┐
        │  Webhook: customer.subscription.paused │
        └────────────────────────────────────────┘
                            │
                            ▼
        ┌────────────────────────────────────────┐
        │  Calculate remaining days on rank      │
        └────────────────────────────────────────┘
                            │
                            ▼
        ┌────────────────────────────────────────┐
        │  Store pause state in database:        │
        │  • rankPaused = true                   │
        │  • pausedAt = now                      │
        │  • pausedRemainingDays = X             │
        └────────────────────────────────────────┘
                            │
                            ▼
        ┌────────────────────────────────────────┐
        │  UI shows "Paused" badge               │
        │  Rank stays active until expiration    │
        └────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    RESUME SUBSCRIPTION                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌────────────────────────────────────────┐
        │  Stripe Portal: User clicks "Resume"   │
        └────────────────────────────────────────┘
                            │
                            ▼
        ┌────────────────────────────────────────┐
        │  Webhook: customer.subscription.resumed│
        └────────────────────────────────────────┘
                            │
                            ▼
        ┌────────────────────────────────────────┐
        │  Calculate pause duration:             │
        │  pauseDurationDays = now - pausedAt    │
        └────────────────────────────────────────┘
                            │
                            ▼
        ┌────────────────────────────────────────┐
        │  Extend rank expiration:               │
        │  newExpires = oldExpires + pauseDays   │
        └────────────────────────────────────────┘
                            │
                            ▼
        ┌────────────────────────────────────────┐
        │  Clear pause state:                    │
        │  • rankPaused = false                  │
        │  • pausedAt = null                     │
        │  • pausedRemainingDays = null          │
        └────────────────────────────────────────┘
                            │
                            ▼
        ┌────────────────────────────────────────┐
        │  UI shows "Active" badge               │
        │  Subscription continues normally       │
        └────────────────────────────────────────┘
```

---

## 💻 Code Implementation

### **Webhook Handler** (`src/app/api/stripe/webhook/route.ts`)

#### Pause Event:
```typescript
case 'customer.subscription.paused': {
  const subscription = event.data.object;
  const userId = subscription.metadata.userId;
  
  // Get user
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  // Calculate remaining days
  const remainingDays = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
  
  // Store pause state
  await db.update(users).set({
    rankPaused: true,
    pausedRankId: user.donationRankId,
    pausedRemainingDays: remainingDays,
    pausedAt: new Date(),
  }).where(eq(users.id, userId));
}
```

#### Resume Event:
```typescript
case 'customer.subscription.resumed': {
  const subscription = event.data.object;
  const userId = subscription.metadata.userId;
  
  // Get user with pause info
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  // Calculate pause duration
  const pauseDurationDays = Math.ceil((now - pausedAt) / (1000 * 60 * 60 * 24));
  
  // Extend expiration by pause duration
  const newExpiresAt = new Date(user.rankExpiresAt);
  newExpiresAt.setDate(newExpiresAt.getDate() + pauseDurationDays);
  
  // Clear pause state and update expiration
  await db.update(users).set({
    rankPaused: false,
    pausedRankId: null,
    pausedRemainingDays: null,
    pausedAt: null,
    rankExpiresAt: newExpiresAt,
  }).where(eq(users.id, userId));
}
```

---

### **Status API** (`src/app/api/stripe/check-subscription-status/route.ts`)

```typescript
// Calculate pause duration if paused
let pauseDurationDays = 0;
if (user.rankPaused && user.pausedAt) {
  const now = new Date();
  const pausedDate = new Date(user.pausedAt);
  pauseDurationDays = Math.ceil((now.getTime() - pausedDate.getTime()) / (1000 * 60 * 60 * 24));
}

return NextResponse.json({
  hasActiveSubscription: true,
  subscription: {
    // ... other fields
    paused: user.rankPaused || false,
    pausedAt: user.pausedAt ? new Date(user.pausedAt).toISOString() : null,
    pauseDurationDays,
  },
  rankInfo: {
    explanation: user.rankPaused
      ? `Your subscription is paused. When resumed, ${pauseDurationDays} days will be added to your expiration.`
      : /* normal explanation */
  }
});
```

---

### **Billing Page UI** (`src/app/(dashboard)/settings/billing/page.tsx`)

#### Status Badge:
```typescript
{subscriptionData.subscription.paused ? (
  <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
    <Clock className="h-3 w-3 mr-1" />
    Paused
  </Badge>
) : (
  <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
    <CheckCircle className="h-3 w-3 mr-1" />
    Active
  </Badge>
)}
```

#### Pause Alert:
```typescript
{subscriptionData.subscription.paused && (
  <Alert className="border-cyan-500/20 bg-cyan-500/10">
    <Clock className="h-4 w-4 text-cyan-400" />
    <AlertDescription className="text-cyan-200">
      <div className="space-y-1">
        <div className="font-semibold">Subscription Paused</div>
        <div>
          Paused {subscriptionData.subscription.pauseDurationDays} days ago. 
          When you resume, {subscriptionData.subscription.pauseDurationDays} days 
          will be added to your rank expiration.
        </div>
        <div className="text-xs">
          Paused since: {new Date(pausedAt).toLocaleDateString()}
        </div>
      </div>
    </AlertDescription>
  </Alert>
)}
```

---

## 🎨 UI Features

### **Billing Page States:**

1. **Active** (green badge)
   - Normal subscription running
   - Shows next billing date

2. **Paused** (cyan badge)
   - Subscription paused
   - Shows pause duration
   - Shows how many days will be added on resume

3. **Ending Soon** (yellow badge)
   - Subscription cancelled (cancel_at_period_end = true)
   - Shows when it will end

---

## 🧪 Testing

### **Test Pause:**
1. Subscribe to any rank
2. Open Stripe Customer Portal
3. Pause subscription
4. Verify:
   - ✅ Badge shows "Paused"
   - ✅ Alert shows pause duration
   - ✅ Database has pause fields populated
   - ✅ Rank stays active

### **Test Resume:**
1. Resume subscription in portal
2. Verify:
   - ✅ Badge changes to "Active"
   - ✅ Alert disappears
   - ✅ Expiration date extended
   - ✅ Database pause fields cleared

---

## 📝 Key Benefits

✅ **Fair for Users:** They don't lose days while paused  
✅ **Automatic:** No manual intervention needed  
✅ **Transparent:** Shows exactly how many days will be added  
✅ **Safe:** Rank stays active during pause  
✅ **Accurate:** Tracks pause duration to the day  

---

## 🚀 Status

**Pause/Resume functionality is fully implemented and production-ready!**

**Files Modified:**
- ✅ `src/app/api/stripe/webhook/route.ts`
- ✅ `src/app/api/stripe/check-subscription-status/route.ts`
- ✅ `src/app/(dashboard)/settings/billing/page.tsx`

**Database Fields Used:**
- ✅ `users.rankPaused`
- ✅ `users.pausedAt`
- ✅ `users.pausedRankId`
- ✅ `users.pausedRemainingDays`

---

## 🎉 Complete!

The pause/resume system now works seamlessly with Stripe's native pause functionality and ensures users don't lose any paid time when they pause their subscriptions.
