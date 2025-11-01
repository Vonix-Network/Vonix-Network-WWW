# Square Payment Form Integration for Rank Subscriptions

## Current State ✅

Your Square payment form already handles:
- Card tokenization ✅
- Payment processing ✅  
- Square SDK loading ✅
- Error handling ✅

## What's Needed 🔧

Add **subscription detection and processing** to the existing form. This is a small addition!

## Square Setup Required: ✅ NONE

You don't need:
- ❌ Square Subscriptions API
- ❌ Subscription plans in Square Dashboard
- ❌ Catalog items
- ❌ Additional credentials

You already have everything needed! The same Square Payments API handles both:
- One-time donations
- Rank subscription purchases (also one-time charges)

## Code Changes

### Step 1: Add Subscription State (Top of Component)

Add these 3 lines after the existing useState declarations:

```typescript
// Around line 32, add:
const [isSubscription, setIsSubscription] = useState(false);
const [subscriptionData, setSubscriptionData] = useState<any>(null);
const router = useRouter();  // Import from 'next/navigation' at top
```

### Step 2: Check for Subscription Mode (In useEffect)

Add this check when component mounts:

```typescript
// Add new useEffect after the existing one
useEffect(() => {
  // Check if this is a subscription purchase
  const subData = sessionStorage.getItem('subscription_purchase');
  if (subData) {
    try {
      const parsed = JSON.parse(subData);
      setIsSubscription(true);
      setSubscriptionData(parsed);
      setAmount(parsed.price.toString());
    } catch (error) {
      console.error('Failed to parse subscription data:', error);
    }
  }
}, []);
```

### Step 3: Update handlePayment Function

Replace the success handling (lines 198-210) with this:

```typescript
if (data.success) {
  // Check if this is a subscription purchase
  if (isSubscription && subscriptionData) {
    try {
      // Process subscription
      const subResponse = await fetch('/api/subscriptions/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rankId: subscriptionData.rankId,
          days: subscriptionData.days,
          amount: subscriptionData.price,
          paymentId: data.paymentId || data.orderId,
        }),
      });

      const subData = await subResponse.json();
      
      if (subData.success) {
        setPaymentSuccess(true);
        toast.success(`${subscriptionData.rankName} rank activated for ${subscriptionData.label}!`);
        sessionStorage.removeItem('subscription_purchase');
        
        // Redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        toast.error(subData.error || 'Failed to activate rank');
      }
    } catch (error) {
      console.error('Subscription processing error:', error);
      toast.error('Payment succeeded but rank activation failed. Please contact support.');
    }
  } else {
    // Regular donation
    setPaymentSuccess(true);
    toast.success('Thank you for your donation!');
    
    // Reset form
    setAmount(defaultAmount.toString());
    setMessage('');
    setMinecraftUsername('');
    
    // Reload page after 2 seconds
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }
}
```

### Step 4: Update Success Message

Optionally customize the success message:

```typescript
if (paymentSuccess) {
  return (
    <Card className="border-green-500/30 bg-green-500/5">
      <CardContent className="p-8 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">
          {isSubscription ? 'Rank Activated!' : 'Payment Successful!'}
        </h3>
        <p className="text-gray-400">
          {isSubscription 
            ? `Your ${subscriptionData?.rankName} rank has been activated!`
            : 'Thank you for supporting Vonix Network. Your donation helps keep our servers running!'
          }
        </p>
      </CardContent>
    </Card>
  );
}
```

## Complete Integration Code

Here's the exact code to add:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // ADD THIS
// ... rest of imports

export function SquarePaymentForm({ minAmount = 1, defaultAmount = 10 }: SquarePaymentFormProps) {
  // Existing state...
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // ADD THESE:
  const [isSubscription, setIsSubscription] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const router = useRouter();

  // Existing useEffect...
  
  // ADD THIS NEW USEEFFECT:
  useEffect(() => {
    const subData = sessionStorage.getItem('subscription_purchase');
    if (subData) {
      try {
        const parsed = JSON.parse(subData);
        setIsSubscription(true);
        setSubscriptionData(parsed);
        setAmount(parsed.price.toString());
      } catch (error) {
        console.error('Failed to parse subscription data:', error);
      }
    }
  }, []);

  // In handlePayment, replace success block with:
  if (data.success) {
    if (isSubscription && subscriptionData) {
      // Process rank subscription
      try {
        const subResponse = await fetch('/api/subscriptions/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rankId: subscriptionData.rankId,
            days: subscriptionData.days,
            amount: subscriptionData.price,
            paymentId: data.paymentId || data.orderId,
          }),
        });

        const subData = await subResponse.json();
        
        if (subData.success) {
          setPaymentSuccess(true);
          toast.success(`${subscriptionData.rankName} activated for ${subscriptionData.label}!`);
          sessionStorage.removeItem('subscription_purchase');
          setTimeout(() => router.push('/dashboard'), 2000);
        } else {
          toast.error(subData.error || 'Failed to activate rank');
        }
      } catch (error) {
        console.error('Subscription error:', error);
        toast.error('Payment succeeded but rank activation failed. Contact support.');
      }
    } else {
      // Regular donation
      setPaymentSuccess(true);
      toast.success('Thank you for your donation!');
      setAmount(defaultAmount.toString());
      setMessage('');
      setMinecraftUsername('');
      setTimeout(() => window.location.reload(), 2000);
    }
  }
}
```

## How It Works

### User Journey:

1. **User visits** `/donations/subscribe`
2. **Selects rank** → Supporter
3. **Selects duration** → 3 months ($14.25)
4. **Clicks** "Continue to Payment"
5. **System stores** subscription data in sessionStorage
6. **Redirects to** `/donations` (with payment form)
7. **Form detects** subscription mode
8. **Pre-fills** amount ($14.25)
9. **User pays** with Square card form
10. **Payment succeeds** → Square processes $14.25
11. **System calls** `/api/subscriptions/purchase`
12. **Rank assigned** → 90 days of Supporter
13. **Redirects to** `/dashboard`
14. **User sees** rank badge immediately!

### Data Flow:

```
/donations/subscribe (Select)
    ↓
sessionStorage.setItem('subscription_purchase', {
  rankId: 'supporter',
  rankName: 'Supporter',
  days: 90,
  price: 14.25,
  label: '3 Months'
})
    ↓
/donations (Payment Form)
    ↓
Form detects subscription mode
    ↓
User pays $14.25
    ↓
Square processes payment
    ↓
POST /api/subscriptions/purchase
    ↓
Rank assigned with expiration
    ↓
sessionStorage cleared
    ↓
Redirect to /dashboard
```

## Testing

### Test Regular Donation:
1. Go to `/donations` directly
2. Enter amount and pay
3. Should work as before

### Test Subscription:
1. Go to `/donations/subscribe`
2. Select rank + duration
3. Click "Continue to Payment"
4. Complete payment
5. Rank should activate!

### Verify in Database:
```sql
SELECT username, donationRankId, rankExpiresAt
FROM users
WHERE donationRankId IS NOT NULL;
```

## Benefits

✅ **Reuses existing form** - No duplicate code  
✅ **Same Square credentials** - No additional setup  
✅ **Clean separation** - Donations and subscriptions coexist  
✅ **Automatic detection** - Works for both modes seamlessly  
✅ **Error handling** - Existing Square error handling applies  

## Summary

### Square Setup Required: NONE ✅
Everything you need is already configured!

### Code Changes Required: ~30 lines ✅
Just add subscription detection to existing form

### Additional APIs Needed: NONE ✅
Subscription API already built

### Time to Integrate: 5 minutes ✅

You're ready to go! 🚀
