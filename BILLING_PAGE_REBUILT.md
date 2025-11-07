# 🔧 Billing Page Needs Complete Rebuild

## 🔴 **Critical Issues Identified**

### **1. Subscription Status Not Showing**
- API returns data but billing page doesn't handle it properly
- Missing integration with actual Stripe subscription state

### **2. No Rank Conversion Logic**
- Missing upgrade/downgrade day conversion
- No "extend" vs "upgrade" vs "downgrade" detection
- Doesn't use existing `rank-subscription.ts` functions

### **3. No Subscription Management**
- Missing pause/resume subscription
- Missing update subscription (change plan)
- No subscription schedule support

### **4. Poor Integration**
- Creates new checkout instead of using update-subscription API
- Doesn't check for existing subscription before purchase
- Missing preview-before-charge flow

---

## ✅ **What Needs to Be Built**

### **Page Structure:**

```
1. Stats Dashboard
   - Current Rank (with days remaining)
   - Subscription Status (Active/Paused/None)
   - Total Spent

2. Active Subscription Card (if has subscription)
   - Show plan details
   - Pause/Resume button
   - Update Plan button
   - Cancel button
   - Manage in Stripe button

3. Smart Purchase Section
   - Detects current rank
   - Shows:
     * EXTEND (same rank)
     * UPGRADE (higher rank with conversion)
     * DOWNGRADE (lower rank with MORE days)
   - Preview cost before purchase
   - Interval selection (monthly/quarterly/etc)
   - One-time vs recurring toggle

4. Payment History
   - All transactions
   - Invoice links
   - Receipt downloads
```

---

## 🔧 **Required API Endpoints**

###  **Existing (Working):**
- ✅ `/api/stripe/check-subscription-status` - Get subscription
- ✅ `/api/user/current-rank` - Get rank info
- ✅ `/api/donation-ranks` - Get all ranks
- ✅ `/api/user/payment-history` - Get history
- ✅ `/api/stripe/customer-portal` - Stripe portal
- ✅ `/api/stripe/update-subscription` - Update existing sub

### **Need to Create:**
- ❌ `/api/stripe/subscription/pause` - Pause subscription
- ❌ `/api/stripe/subscription/resume` - Resume subscription  
- ❌ `/api/stripe/subscription/cancel` - Cancel subscription
- ❌ `/api/user/rank-conversion-preview` - Preview rank change

---

## 📊 **Rank Conversion Logic**

From `src/lib/rank-subscription.ts`:

```typescript
// Upgrade: VIP ($5/mo) → VIP+ ($10/mo), 15 days left
// Remaining value: ($5/30) × 15 = $2.50
// Converted days: $2.50 / ($10/30) = 7 days
// Result: 7 bonus days at new rank

// Downgrade: VIP+ ($10/mo) → VIP ($5/mo), 10 days left  
// Remaining value: ($10/30) × 10 = $3.33
// Converted days: $3.33 / ($5/30) = 20 days
// Result: 20 bonus days at new rank

// Extend: VIP → VIP, 10 days left
// Result: Simple addition (10 + 30 = 40 days)
```

---

## 🎯 **Implementation Plan**

### **Phase 1: Fix APIs** (30 min)
1. Create pause/resume endpoints
2. Create cancel endpoint
3. Create rank conversion preview endpoint

### **Phase 2: Rebuild Billing Page** (1 hour)
1. Properly fetch and display subscription
2. Add rank conversion detection
3. Show extend/upgrade/downgrade cards
4. Add pause/resume/cancel buttons
5. Integrate with preview-confirm flow

### **Phase 3: Testing** (30 min)
1. Test with active subscription
2. Test pause/resume
3. Test rank conversion
4. Test one-time purchases

---

## 🚀 **Next Steps**

**Should I:**
1. Create the missing API endpoints first?
2. Rebuild the billing page with proper integration?
3. Add comprehensive documentation?

**Or would you prefer:**
- A simpler approach that just fixes the subscription display?
- Focus on specific features first?

Let me know and I'll implement it properly!
