# 🔍 Comprehensive Stripe Integration Audit & Best Practices

## 📊 **Current State Analysis**

### ✅ **What's Good (Keeping These)**

1. **Webhook Handling** ✅
   - `invoice.payment_succeeded` properly handled
   - Idempotency checks using invoice ID
   - Subscription lifecycle events tracked

2. **Customer Management** ✅
   - Creating Stripe customers
   - Storing `stripeCustomerId` in database
   - Updating customer email

3. **Metadata Usage** ✅
   - User ID, rank ID, rank name in subscriptions
   - Easy to track and debug

4. **Security** ✅
   - Webhook signature verification
   - User ownership validation
   - Session authentication

5. **Preview Before Charge** ✅
   - Preview endpoint implemented
   - Confirmation required for updates

---

## ⚠️ **Critical Issues (Must Fix)**

### **1. Creating Prices On-The-Fly** ❌

**Current Problem:**
```typescript
// Creates NEW price EVERY TIME someone subscribes
const price = await stripe.prices.create({
  currency: 'usd',
  unit_amount: Math.round(amount * 100),
  recurring: { interval, interval_count },
  product_data: { name: `${rank.name} Rank` },
});
```

**Issues:**
- ❌ Hundreds/thousands of orphaned prices in Stripe
- ❌ Hard to manage in Stripe Dashboard
- ❌ Can't easily update pricing across all users
- ❌ Not how Stripe recommends it
- ❌ Inefficient API calls

**Stripe's Recommended Approach:**
```typescript
// Define products/prices ONCE in Stripe Dashboard or via migration
// Then reference them by ID

const PRICE_IDS = {
  vip_monthly: 'price_VIP_MONTHLY_123',
  vip_quarterly: 'price_VIP_QUARTERLY_123',
  vip_plus_monthly: 'price_VIPPLUS_MONTHLY_123',
  // etc...
};

// Then just use:
stripe.checkout.sessions.create({
  line_items: [{ price: PRICE_IDS.vip_monthly, quantity: 1 }]
});
```

---

### **2. No Product Catalog** ❌

**Problem:** No centralized product structure

**Stripe Best Practice:**
- Create **Products** in Stripe (one per rank)
- Create **Prices** for each product (different intervals)
- Store Price IDs in your database
- Reference by ID, never create dynamically

**Schema Needed:**
```typescript
// Add to donationRanks table:
stripePriceIds: {
  monthly: 'price_xxx',
  quarterly: 'price_xxx',
  semiannual: 'price_xxx',
  yearly: 'price_xxx',
}
```

---

### **3. No Stripe Customer Portal** ❌

**Missing:**
- User can't manage payment methods in Stripe
- User can't update billing info
- User can't see invoices
- User can't cancel subscription themselves

**Stripe Best Practice:**
```typescript
// Create customer portal session
const portalSession = await stripe.billingPortal.sessions.create({
  customer: customerId,
  return_url: 'https://yoursite.com/settings/subscriptions',
});

// Redirect user to: portalSession.url
```

**Benefits:**
- ✅ Self-service subscription management
- ✅ Stripe-hosted, secure, PCI compliant
- ✅ Automatic invoice access
- ✅ Payment method updates
- ✅ Less support burden

---

### **4. Missing Webhook Events** ❌

**Currently Handled:**
- ✅ `invoice.payment_succeeded`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `checkout.session.completed`

**Missing (Should Add):**
- ❌ `invoice.payment_failed` (has TODO)
- ❌ `customer.subscription.trial_will_end`
- ❌ `payment_method.attached`
- ❌ `payment_method.detached`
- ❌ `invoice.upcoming` (7 days before renewal)
- ❌ `customer.updated`

---

### **5. No Dunning Management** ❌

**Problem:** When payment fails, no retry logic

**Stripe Best Practice:**
- Enable Smart Retries in Stripe Dashboard
- Send email when payment fails
- Give grace period before canceling rank
- Attempt recovery emails

**Implementation Needed:**
```typescript
case 'invoice.payment_failed': {
  // 1. Email user
  // 2. Set grace period (3-7 days)
  // 3. Don't remove rank immediately
  // 4. Stripe will auto-retry based on settings
}
```

---

### **6. No Tax Collection** ⚠️

**Current:** Tax not collected

**If Needed (depends on location):**
- Enable Stripe Tax in dashboard
- Automatically calculate tax by location
- Collect & remit tax

**Not Critical If:**
- You're under tax threshold
- Digital goods exemption applies
- Will add later when needed

---

### **7. Custom Receipt System** ⚠️

**Current:** Building custom receipts in `donations` table

**Stripe Alternative:**
- Stripe generates hosted invoices automatically
- Users can access via customer portal
- Professional, branded receipts

**Recommendation:**
- Keep your `donations` table for analytics
- But also link to Stripe's hosted invoice
- Add `stripeInvoiceUrl` field

---

## 🎯 **Stripe's Recommended Architecture**

### **Product Catalog Structure:**

```
Product: VIP Rank
  ├─ Price: VIP Monthly ($5/month)
  ├─ Price: VIP Quarterly ($13.50/3 months) -10%
  ├─ Price: VIP Semiannual ($25.50/6 months) -15%
  └─ Price: VIP Yearly ($48/year) -20%

Product: VIP+ Rank
  ├─ Price: VIP+ Monthly ($10/month)
  ├─ Price: VIP+ Quarterly ($27/3 months) -10%
  └─ Price: VIP+ Yearly ($96/year) -20%

Product: MVP Rank
  ├─ Price: MVP Monthly ($20/month)
  └─ Price: MVP Yearly ($192/year) -20%
```

**Benefits:**
- ✅ Easy to manage in Stripe Dashboard
- ✅ Can update prices across all users
- ✅ Professional invoices
- ✅ Better analytics
- ✅ Supports coupons/promotions

---

## 📋 **Implementation Plan**

### **Phase 1: Product Catalog (CRITICAL)** 🔴

**What to do:**
1. Create migration to add `stripePriceIds` to `donationRanks` table
2. Create script to set up products/prices in Stripe
3. Store Price IDs in database
4. Update checkout to use Price IDs instead of creating prices

**Time:** 2-3 hours
**Impact:** High - enables all other improvements

---

### **Phase 2: Customer Portal (HIGH PRIORITY)** 🟡

**What to do:**
1. Add Customer Portal route
2. Configure portal settings in Stripe Dashboard
3. Add "Manage Subscription" button in UI
4. Update webhooks for portal events

**Time:** 1 hour
**Impact:** Major UX improvement, reduces support

---

### **Phase 3: Enhanced Webhook Handling (MEDIUM)** 🟢

**What to do:**
1. Add `invoice.payment_failed` proper handler with email
2. Add `invoice.upcoming` for renewal reminders
3. Add grace period logic for failed payments
4. Add `customer.subscription.trial_will_end`

**Time:** 2 hours
**Impact:** Better user experience, recover failed payments

---

### **Phase 4: Subscription Schedules (OPTIONAL)** ⚪

**What to do:**
1. Implement scheduled downgrades (change at renewal)
2. Allow users to schedule cancellations
3. Support promotional periods

**Time:** 3-4 hours
**Impact:** Nice-to-have, better for downgrades

---

### **Phase 5: Coupons & Promotions (OPTIONAL)** ⚪

**What to do:**
1. Create promotion codes in Stripe
2. Enable at checkout
3. Track usage

**Time:** 1 hour
**Impact:** Marketing tool

---

## 🛠️ **Immediate Actions (Do Now)**

### **Action 1: Database Schema Update**

```sql
-- Add to donationRanks table
ALTER TABLE donation_ranks ADD COLUMN stripe_product_id TEXT;
ALTER TABLE donation_ranks ADD COLUMN stripe_price_monthly TEXT;
ALTER TABLE donation_ranks ADD COLUMN stripe_price_quarterly TEXT;
ALTER TABLE donation_ranks ADD COLUMN stripe_price_semiannual TEXT;
ALTER TABLE donation_ranks ADD COLUMN stripe_price_yearly TEXT;

-- Add to donations table
ALTER TABLE donations ADD COLUMN stripe_invoice_id TEXT;
ALTER TABLE donations ADD COLUMN stripe_invoice_url TEXT;
```

---

### **Action 2: Create Products in Stripe**

**One-time setup script:**
```typescript
// scripts/setup-stripe-products.ts
async function setupStripeProducts() {
  const ranks = await db.select().from(donationRanks);
  
  for (const rank of ranks) {
    // Create product
    const product = await stripe.products.create({
      name: `${rank.name} Rank`,
      description: rank.subtitle || `${rank.name} donation rank`,
      metadata: {
        rankId: rank.id,
        rankName: rank.name,
      },
    });

    // Create prices
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      currency: 'usd',
      unit_amount: Math.round(rank.minAmount * 100),
      recurring: { interval: 'month' },
      metadata: { interval: 'monthly', days: '30' },
    });

    const quarterlyPrice = await stripe.prices.create({
      product: product.id,
      currency: 'usd',
      unit_amount: Math.round(rank.minAmount * 100 * 3 * 0.9), // 10% discount
      recurring: { interval: 'month', interval_count: 3 },
      metadata: { interval: 'quarterly', days: '90' },
    });

    // Update database
    await db.update(donationRanks)
      .set({
        stripeProductId: product.id,
        stripePriceMonthly: monthlyPrice.id,
        stripePriceQuarterly: quarterlyPrice.id,
      })
      .where(eq(donationRanks.id, rank.id));
  }
}
```

---

### **Action 3: Update Checkout to Use Price IDs**

```typescript
// BEFORE (creates new price every time)
const price = await stripe.prices.create({...});
stripe.checkout.sessions.create({
  line_items: [{ price: price.id }]
});

// AFTER (uses pre-created price)
const [rank] = await db.select().from(donationRanks)
  .where(eq(donationRanks.id, rankId));

const priceId = days === 90 ? rank.stripePriceQuarterly :
                days === 180 ? rank.stripePriceSemiannual :
                days === 365 ? rank.stripePriceYearly :
                rank.stripePriceMonthly;

stripe.checkout.sessions.create({
  line_items: [{ price: priceId, quantity: 1 }]
});
```

---

## 📊 **Comparison: Before vs After**

| Feature | Current | Stripe Best Practice | Impact |
|---------|---------|---------------------|--------|
| **Price Creation** | Dynamic (every purchase) | Static (catalog) | 🔴 Critical |
| **Customer Portal** | None | Stripe-hosted | 🔴 Critical |
| **Product Management** | None | Dashboard + API | 🔴 Critical |
| **Invoices** | Custom | Stripe-hosted | 🟡 High |
| **Failed Payments** | Basic | Smart Retry + Dunning | 🟡 High |
| **Webhooks** | Partial | Complete | 🟢 Medium |
| **Tax** | None | Stripe Tax (optional) | ⚪ Optional |
| **Promotions** | None | Coupons/Codes | ⚪ Optional |

---

## 🎯 **Expected Outcomes**

### **After Implementation:**

1. **Stripe Dashboard:**
   - Clean product catalog
   - Easy price management
   - Professional invoices
   - Better analytics

2. **User Experience:**
   - Self-service portal
   - Professional receipts
   - Easy payment method updates
   - Automatic renewal reminders

3. **Developer Experience:**
   - Simpler code
   - Fewer API calls
   - Better debugging
   - Easier maintenance

4. **Business Benefits:**
   - Failed payment recovery
   - Promotional capabilities
   - Better conversion tracking
   - Lower support burden

---

## 🚀 **Recommendation**

**Priority Order:**
1. ⭐⭐⭐ **Product Catalog** (Do First - Enables Everything)
2. ⭐⭐⭐ **Customer Portal** (Do Second - Huge UX win)
3. ⭐⭐ **Enhanced Webhooks** (Do Third - Revenue recovery)
4. ⭐ **Subscription Schedules** (Nice-to-have)
5. ⭐ **Promotions** (When needed)

**Total Implementation Time:** ~6-8 hours for critical items

**ROI:** High - Better UX, less support, more revenue from recovery

---

## 📝 **Next Steps**

Want me to implement:
- [ ] Phase 1: Product Catalog Setup (2-3 hours)
- [ ] Phase 2: Customer Portal (1 hour)
- [ ] Phase 3: Enhanced Webhooks (2 hours)

Or all at once?

Choose your priority and I'll start implementation!
