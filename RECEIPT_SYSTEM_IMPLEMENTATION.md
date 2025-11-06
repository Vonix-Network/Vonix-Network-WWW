# 📝 Receipt System Implementation Guide

## ✅ What's Done

1. **Database Schema Updated** (`src/db/schema.ts`)
   - Enhanced `donations` table with receipt fields:
     - `receiptNumber` - Unique receipt identifier
     - `paymentId` - Stripe/Square payment ID
     - `subscriptionId` - For recurring payments
     - `rankId` - Which rank was purchased
     - `days` - Duration purchased
     - `paymentType` - 'one_time', 'subscription', 'subscription_renewal'
     - `status` - 'completed', 'pending', 'failed', 'refunded'

2. **Success Page Redesigned** (`src/app/(dashboard)/donations/success/page.tsx`)
   - ✅ No auto-redirect
   - ✅ Beautiful thank you message with hearts
   - ✅ Detailed receipt display
   - ✅ Receipt number, payment details, transaction info
   - ✅ Different messaging for subscriptions vs one-time
   - ✅ "View All Receipts" button
   - ✅ "Go to Dashboard" button
   - ✅ Thank you message about supporting development

---

## 🔧 What Needs Implementation

### 1. Update Database Migration

Run migration to add new columns:

```bash
npm run db:push
```

This will add the new receipt fields to the `donations` table.

---

### 2. Update `/api/stripe/verify-session/route.ts`

Need to:
- Fetch or create receipt from database
- Return receipt data to success page

```typescript
// Add after verifying checkout session:
const receipt = await db
  .select()
  .from(donations)
  .where(eq(donations.paymentId, checkoutSession.payment_intent))
  .limit(1);

if (!receipt[0]) {
  // Create receipt if it doesn't exist
  const receiptNumber = `VN-${Date.now()}-${userId}`;
  
  await db.insert(donations).values({
    userId,
    amount: checkoutSession.amount_total / 100,
    currency: checkoutSession.currency.toUpperCase(),
    method: 'stripe',
    receiptNumber,
    paymentId: checkoutSession.payment_intent,
    subscriptionId: checkoutSession.subscription,
    rankId: metadata.rankId,
    days: parseInt(metadata.days),
    paymentType: checkoutSession.mode === 'subscription' ? 'subscription' : 'one_time',
    status: 'completed',
  });
}

return NextResponse.json({
  success: true,
  receipt: {
    receiptNumber: receipt[0].receiptNumber,
    rankName: rank.name,
    amount: receipt[0].amount,
    currency: receipt[0].currency,
    days: receipt[0].days,
    paymentType: receipt[0].paymentType,
    paymentId: receipt[0].paymentId,
    subscriptionId: receipt[0].subscriptionId,
    date: receipt[0].createdAt,
    expiresAt: user.rankExpiresAt,
  },
});
```

---

### 3. Update `/api/subscriptions/purchase/route.ts`

After successful rank assignment, save receipt:

```typescript
// After assignRankSubscription succeeds:
const receiptNumber = `VN-${Date.now()}-${userId}`;

await db.insert(donations).values({
  userId,
  amount,
  currency: 'USD',
  method: paymentProvider,
  receiptNumber,
  paymentId,
  subscriptionId,
  rankId,
  days,
  paymentType: subscriptionId ? 'subscription' : 'one_time',
  status: 'completed',
  message: `${rank.name} Rank - ${days} days`,
  displayed: true,
});
```

---

### 4. Update `/api/stripe/webhook/route.ts`

For subscription renewals, save receipt:

```typescript
case 'invoice.payment_succeeded': {
  // ... existing code ...
  
  // After updating user rank:
  const receiptNumber = `VN-${Date.now()}-${userId}`;
  
  await db.insert(donations).values({
    userId,
    amount,
    currency: 'USD',
    method: 'stripe',
    receiptNumber,
    paymentId: invoice.payment_intent,
    subscriptionId: subscription.id,
    rankId,
    days,
    paymentType: 'subscription_renewal',
    status: 'completed',
    message: `${rank.name} Subscription Renewal`,
    displayed: true,
  });
  
  break;
}
```

---

### 5. Create `/app/(dashboard)/donations/receipts/page.tsx`

Page to view all receipts:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Receipt, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReceipts() {
      const response = await fetch('/api/donations/receipts');
      const data = await response.json();
      setReceipts(data.receipts || []);
      setLoading(false);
    }
    loadReceipts();
  }, []);

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Receipt className="h-8 w-8 text-cyan-400" />
          Payment Receipts
        </h1>
        <p className="text-gray-400 mt-2">
          View all your payment receipts and transaction history
        </p>
      </div>

      {receipts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Receipt className="h-16 w-16 mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No Receipts Yet
            </h3>
            <p className="text-gray-400">
              Your payment receipts will appear here after you make a purchase.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {receipts.map((receipt) => (
            <Card key={receipt.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {receipt.rankName || receipt.message}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {receipt.paymentType === 'one_time' ? 'One-Time' : 'Subscription'}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="text-gray-400">
                        Receipt #{receipt.receiptNumber}
                      </div>
                      <div className="text-gray-400">
                        {new Date(receipt.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-cyan-400 mb-2">
                      ${receipt.amount.toFixed(2)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/donations/receipt/${receipt.id}`, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### 6. Create `/app/api/donations/receipts/route.ts`

API to fetch user's receipts:

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { donations, donationRanks } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Get user's donations/receipts
    const userDonations = await db
      .select({
        id: donations.id,
        receiptNumber: donations.receiptNumber,
        amount: donations.amount,
        currency: donations.currency,
        paymentType: donations.paymentType,
        status: donations.status,
        rankId: donations.rankId,
        days: donations.days,
        message: donations.message,
        createdAt: donations.createdAt,
      })
      .from(donations)
      .where(eq(donations.userId, userId))
      .orderBy(desc(donations.createdAt));

    // Get rank names
    const receiptsWithRankNames = await Promise.all(
      userDonations.map(async (donation) => {
        if (donation.rankId) {
          const [rank] = await db
            .select({ name: donationRanks.name })
            .from(donationRanks)
            .where(eq(donationRanks.id, donation.rankId))
            .limit(1);
          return { ...donation, rankName: rank?.name };
        }
        return donation;
      })
    );

    return NextResponse.json({
      receipts: receiptsWithRankNames,
    });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receipts' },
      { status: 500 }
    );
  }
}
```

---

## 📊 Receipt Number Format

Receipts are generated with the format:
```
VN-{timestamp}-{userId}
```

Example: `VN-1730890123456-6`

This ensures:
- ✅ Unique per transaction
- ✅ Sortable by time
- ✅ Identifiable by user
- ✅ Professional appearance

---

## 🎯 User Flow

### **One-Time Payment:**
```
1. User completes payment
   ↓
2. Redirected to /donations/success
   ↓
3. See receipt with:
   - Thank you message ❤️
   - Receipt number
   - Rank purchased
   - Amount paid
   - Expiration date
   - Payment ID
   ↓
4. Click "View All Receipts"
   ↓
5. See history of all payments
```

### **Recurring Subscription:**
```
1. User completes first payment
   ↓
2. See receipt with:
   - Thank you message ❤️
   - Subscription ID
   - Next billing date
   - Cancellation info
   ↓
3. Each renewal creates new receipt
   ↓
4. All receipts saved and viewable
```

---

## ✅ Features

| Feature | Status |
|---------|--------|
| Receipt database schema | ✅ Complete |
| Success page with receipt | ✅ Complete |
| Thank you message | ✅ Complete |
| No auto-redirect | ✅ Complete |
| Receipt number generation | ⏳ Need to implement |
| Save receipts on purchase | ⏳ Need to implement |
| Save receipts on renewal | ⏳ Need to implement |
| View all receipts page | ⏳ Need to implement |
| Receipts API endpoint | ⏳ Need to implement |

---

## 🚀 Implementation Steps

1. **Run database migration:**
   ```bash
   npm run db:push
   ```

2. **Update verify-session endpoint** (Step 2 above)

3. **Update purchase endpoint** (Step 3 above)

4. **Update webhook endpoint** (Step 4 above)

5. **Create receipts page** (Step 5 above)

6. **Create receipts API** (Step 6 above)

7. **Test the flow:**
   - Make a test payment
   - See receipt on success page
   - Check receipts page
   - Verify database entries

---

## 💡 Future Enhancements

- [ ] PDF receipt generation
- [ ] Email receipts automatically
- [ ] Print receipts
- [ ] Export all receipts as CSV
- [ ] Tax information (if applicable)
- [ ] Refund handling
- [ ] Receipt search/filter

---

## ✅ Summary

**What's Ready:**
- ✅ Beautiful success page with thank you message
- ✅ Detailed receipt display
- ✅ Database schema for receipts
- ✅ No more auto-redirect

**What's Needed:**
- ⏳ Update 3 API endpoints to save receipts
- ⏳ Create receipts viewing page
- ⏳ Run database migration

**Estimated Time:** 30-45 minutes to complete remaining tasks

**The foundation is built! Now just need to wire up the data flow.** 🎉
