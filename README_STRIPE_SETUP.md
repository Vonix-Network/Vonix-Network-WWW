# 🚀 Quick Start: Stripe Enterprise Setup

## ⚡ **5-Minute Setup Guide**

Follow these steps to activate your enterprise-grade Stripe integration.

---

## 📋 **Prerequisites**

- ✅ Stripe account with secret key in `.env`
- ✅ Donation ranks exist in database
- ✅ Node.js installed
- ✅ Database access

---

## 🎯 **Setup Steps**

### **Step 1: Database Migration** (1 minute)

```bash
npm run db:push
```

**What this does:**
- Adds `stripeProductId`, `stripePriceMonthly`, etc. to `donation_ranks`
- Adds `stripeInvoiceId`, `stripeInvoiceUrl` to `donations`

---

### **Step 2: Create Stripe Products** (5 minutes)

```bash
npx tsx scripts/setup-stripe-products.ts
```

**What this does:**
- Creates 1 Product per rank in Stripe
- Creates 4 Prices per product:
  - Monthly (full price)
  - Quarterly (5% off)
  - Semiannual (10% off)
  - Yearly (15% off)
- Stores all IDs in database

**Output:**
```
🚀 Setting up Stripe Product Catalog...

📦 Processing rank: VIP (vip)
   ✅ Product created: prod_xxx
   ✅ Monthly: price_xxx - $5.00/month
   ✅ Quarterly: price_xxx - $14.25/3 months
   ✅ Semiannual: price_xxx - $27.00/6 months
   ✅ Yearly: price_xxx - $51.00/year
   ✅ Database updated

🎉 All done!
```

---

### **Step 3: Configure Customer Portal** (10 minutes)

1. Go to: https://dashboard.stripe.com/settings/billing/portal
2. Click "Activate test link" (or "Activate" for production)
3. Configure settings:

**Subscription Cancellation:**
- ✅ Allow customers to cancel subscriptions
- Cancellation behavior: "Cancel immediately"
- Proration: "Always invoice"

**Payment Methods:**
- ✅ Allow customers to update payment methods

**Invoice History:**
- ✅ Show invoice history

**Branding (Optional):**
- Upload logo
- Set brand colors
- Customize business name

4. Click "Save changes"

---

### **Step 4: Update Checkout Code** (10 minutes)

Find this file: `src/app/api/stripe/create-checkout-session/route.ts`

**Replace this section:**
```typescript
// OLD CODE (Delete this)
const price = await stripe.prices.create({
  currency: 'usd',
  unit_amount: Math.round(amount * 100),
  recurring: { interval, interval_count: intervalCount },
  product_data: {
    name: `${rank.name} Rank - ${intervalName}`,
    // ...
  },
});

const checkoutSession = await stripe.checkout.sessions.create({
  line_items: [{ price: price.id, quantity: 1 }],
  // ...
});
```

**With this:**
```typescript
// NEW CODE (Use this)
// Get price ID from database
const priceId = days === 90 ? rank.stripePriceQuarterly :
                days === 180 ? rank.stripePriceSemiannual :
                days === 365 ? rank.stripePriceYearly :
                rank.stripePriceMonthly;

if (!priceId) {
  throw new Error(`No Stripe price found for ${rank.name} with ${days} days. Run setup script.`);
}

console.log(`Using Stripe price: ${priceId} for ${days} days`);

const checkoutSession = await stripe.checkout.sessions.create({
  line_items: [{ price: priceId, quantity: 1 }],
  // ... rest stays the same
});
```

---

### **Step 5: Add Customer Portal Button** (5 minutes)

In `src/app/(dashboard)/settings/subscriptions/page.tsx`:

**Add this button in the subscription card:**
```tsx
<button
  onClick={async () => {
    try {
      const res = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
      });
      
      if (!res.ok) {
        throw new Error('Failed to create portal session');
      }
      
      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error opening customer portal:', error);
      alert('Failed to open customer portal');
    }
  }}
  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
>
  Manage in Stripe →
</button>
```

---

### **Step 6: Test Everything** (5 minutes)

#### **Test 1: View Products in Stripe**
- Go to: https://dashboard.stripe.com/products
- Verify: You see products for each rank
- Verify: Each product has 4 prices

#### **Test 2: Create Subscription**
- Go to your donate page
- Select a rank with recurring enabled
- Complete checkout
- Verify: Payment succeeds
- Check: Webhook received `invoice.payment_succeeded`

#### **Test 3: Customer Portal**
- Go to: `/settings/subscriptions`
- Click "Manage in Stripe"
- Verify: Portal opens
- Test: View invoices, update payment method

#### **Test 4: Subscription Update**
- In customer portal, try changing subscription
- Verify: Proration calculated correctly
- Verify: No new subscription created (same ID)

---

## 🎨 **Customization**

### **Change Discount Rates**

Edit `scripts/setup-stripe-products.ts`:

```typescript
const PRICE_DISCOUNTS: PriceDiscount = {
  monthly: 0,     // 0% off (full price)
  quarterly: 0.05,   // 5% off → Change to 0.10 for 10%
  semiannual: 0.10,  // 10% off → Change to 0.15 for 15%
  yearly: 0.15,      // 15% off → Change to 0.20 for 20%
};
```

Then re-run: `npx tsx scripts/setup-stripe-products.ts`

---

### **Add More Intervals**

In schema, add:
```typescript
stripePriceWeekly: text('stripe_price_weekly'), // 7 days
stripePriceBiweekly: text('stripe_price_biweekly'), // 14 days
```

In setup script, create additional prices.

---

### **Customize Portal**

Go to: https://dashboard.stripe.com/settings/billing/portal

**Advanced Settings:**
- Custom return URL
- Subscription switching rules
- Payment method types
- Invoice features

---

## 🔍 **Troubleshooting**

### **"No Stripe price found" Error**

**Cause:** Database missing price IDs

**Fix:**
```bash
# Re-run setup script
npx tsx scripts/setup-stripe-products.ts
```

---

### **"Product already exists" Warning**

**Cause:** Product was created before

**Options:**
1. **Keep existing:** Setup script will skip
2. **Recreate:**
   - Go to Stripe Dashboard → Products
   - Archive old product
   - Clear `stripeProductId` in database
   - Re-run setup script

---

### **Portal Returns to Wrong URL**

**Fix:** Update `AUTH_URL` in `.env`:
```
NEXTAUTH_URL=https://your-production-domain.com
```

Or pass `returnUrl` when creating portal session:
```typescript
await fetch('/api/stripe/customer-portal', {
  method: 'POST',
  body: JSON.stringify({
    returnUrl: 'https://yoursite.com/settings/subscriptions'
  })
});
```

---

### **Webhook Not Firing**

**Check:**
1. `STRIPE_WEBHOOK_SECRET` in `.env`
2. Webhook endpoint registered in Stripe Dashboard
3. Endpoint URL correct: `https://yoursite.com/api/stripe/webhook`
4. Events selected:
   - ✅ `invoice.payment_succeeded`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`

---

## 📊 **Verification Checklist**

After setup, verify:

- [ ] Products visible in Stripe Dashboard
- [ ] 4 prices per product (monthly, quarterly, semiannual, yearly)
- [ ] Database has price IDs stored
- [ ] Checkout creates subscription successfully
- [ ] Customer portal opens correctly
- [ ] Portal shows invoices
- [ ] Portal allows payment method update
- [ ] Portal allows cancellation
- [ ] Webhooks receive events
- [ ] No new prices created on each purchase

---

## 🎯 **What Changed**

### **Before:**
```
User subscribes → Creates new Stripe price → Checkout → Webhook
                  (Creates orphaned price every time)
```

### **After:**
```
User subscribes → Looks up price ID from DB → Checkout → Webhook
                  (Reuses same price, clean & efficient)
```

---

## 📚 **Documentation**

- **Full Audit:** `STRIPE_COMPREHENSIVE_AUDIT.md`
- **Implementation Guide:** `STRIPE_IMPLEMENTATION_COMPLETE.md`
- **Best Practices:** `STRIPE_BEST_PRACTICES.md`
- **Update Flow:** `SUBSCRIPTION_UPDATE_FLOW.md`

---

## 🚀 **You're Done!**

Your Stripe integration is now:
- ✅ Following Stripe best practices
- ✅ Using product catalog (not dynamic prices)
- ✅ Self-service customer portal enabled
- ✅ Professional invoices
- ✅ Easy to manage and scale
- ✅ Ready for promotions
- ✅ Enterprise-grade

**Total Setup Time:** ~30 minutes

**Ongoing Maintenance:** Minimal (Stripe handles most things)

---

## 💡 **Next Steps (Optional)**

1. **Add Webhook Handler for Failed Payments**
   - Send email when payment fails
   - Give grace period before canceling rank

2. **Enable Promotion Codes**
   - Already supported in checkout (`allow_promotion_codes: true`)
   - Create codes in Stripe Dashboard

3. **Add Trial Periods**
   - Configure in Stripe product settings
   - Handle `trial_will_end` webhook

4. **Implement Subscription Schedules**
   - Allow scheduled downgrades
   - Plan future price changes

---

Need help? Check the full documentation files or Stripe's docs at https://stripe.com/docs
