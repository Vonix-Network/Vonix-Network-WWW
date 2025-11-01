# 🚀 Quick Start: Rank Subscriptions

## What You Have Now

✅ **Time-Based Rank System** - Users buy days, not recurring subscriptions  
✅ **Smart Conversions** - Upgrades/downgrades preserve value automatically  
✅ **Beautiful UI** - `/donations/subscribe` page ready to use  
✅ **Auto-Expiration** - Ranks expire automatically via cron job  
✅ **Flexible Pricing** - Discounts for longer durations  

## ⚠️ Current Issue: Payment Processing Not Configured

You're seeing "Subscriptions Not Available" because **Square payments aren't set up yet**.

### This is NOT about:
- ❌ Square Subscription API (you don't need this)
- ❌ Recurring billing (you don't use this)
- ❌ Complex Square catalog setup (not needed)

### This IS about:
- ✅ One-time payment processing
- ✅ Square Web SDK for card input
- ✅ Basic Square credentials

## 🔧 Fix in 5 Minutes

### Step 1: Get Square Credentials

1. Go to https://developer.squareup.com/apps
2. Sign in / create account (free)
3. Create a new application or select existing
4. Get these 3 values:

#### From "Credentials" tab:
- **Sandbox Access Token** (starts with EAAAl...)
- **Sandbox Application ID** (starts with sandbox-sq0idb...)

#### From "Locations" tab:
- **Location ID** (click your location, copy the ID)

### Step 2: Update .env File

Add these lines to your `.env` file:

```bash
# Enable Square Payments
SQUARE_INTEGRATION_ENABLED=true

# Credentials (use sandbox for testing)
SQUARE_ACCESS_TOKEN=EAAAl...your-token-here
SQUARE_APPLICATION_ID=sandbox-sq0idb...your-app-id
SQUARE_LOCATION_ID=L...your-location-id

# Environment
SQUARE_ENVIRONMENT=sandbox

# Cron Security (any random string)
CRON_SECRET=your-random-secret-123
```

### Step 3: Restart Dev Server

```bash
npm run dev
```

### Step 4: Test

Visit: http://localhost:3000/donations/subscribe

You should now see:
- ✅ No warning banner
- ✅ "Continue to Payment" button enabled
- ✅ All rank and duration options available

## 🧪 Test a Purchase

1. Select a rank (e.g., Supporter)
2. Choose duration (e.g., 1 Month - $5.00)
3. Click "Continue to Payment"
4. Use Square test card: `4111 1111 1111 1111`
5. Any future date for expiry
6. Any 3 digits for CVV
7. Complete payment

Your rank should activate immediately!

## 📊 Verify It Worked

### Check API Status:
```bash
curl http://localhost:3000/api/subscriptions/status
```

Should return:
```json
{
  "system": "rank-subscriptions",
  "ready": true,
  "paymentProcessing": true,
  "features": {
    "timeBasedRanks": true,
    "automaticConversion": true,
    ...
  }
}
```

### Check Database:
```sql
SELECT username, donationRankId, rankExpiresAt, totalDonated
FROM users
WHERE donationRankId IS NOT NULL;
```

You should see your rank with an expiration date!

## 🎯 Understanding the System

### What Happens When User Buys:

1. **User selects** → Supporter + 3 months
2. **System calculates** → $14.25 (with 5% discount)
3. **User pays** → Square processes $14.25
4. **System assigns** → 90 days of Supporter rank
5. **Expiration set** → Today + 90 days
6. **Database updated** → `donationRankId` and `rankExpiresAt`

### What Happens When User Upgrades:

1. **User has** → 30 days of Supporter left
2. **User upgrades to** → Patron
3. **System calculates value** → 30 days × $0.17 = $5.10
4. **System converts** → $5.10 ÷ $0.33 = 15 days
5. **Result** → User gets 15 days of Patron (fair conversion!)

### What Happens at Expiration:

1. **Cron runs hourly** → `/api/cron/expire-ranks`
2. **Finds expired ranks** → `rankExpiresAt < now`
3. **Removes rank** → Sets `donationRankId = null`
4. **User can re-subscribe** → Anytime

## 🔐 Production Setup

When ready for production:

### Step 1: Get Production Credentials

1. Square Dashboard → Applications → Your App
2. Switch to "Production" tab
3. Get **Production Access Token** and **Application ID**
4. Use same Location ID (or production location)

### Step 2: Update .env

```bash
SQUARE_ENVIRONMENT=production
SQUARE_ACCESS_TOKEN=EAAAl...production-token
SQUARE_APPLICATION_ID=sq0idp...production-app-id
```

### Step 3: Setup Cron Job

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/expire-ranks",
    "schedule": "0 * * * *"
  }]
}
```

## 🎨 Customization

### Change Pricing:

Edit `src/lib/rank-subscription.ts`:
```typescript
export const RANK_PRICING: Record<string, number> = {
  'supporter': 0.20,  // $6/month instead of $5
  'patron': 0.40,     // $12/month instead of $10
  // ...
};
```

### Change Discounts:

```typescript
{
  days: 90,
  price: Math.round(basePrice * 90 * 0.90 * 100) / 100, // 10% off
  discount: 10,
}
```

## ❓ FAQ

**Q: Do I need Square Subscriptions API?**  
A: No! You only need Square Payments for one-time charges.

**Q: What if user doesn't pay?**  
A: Rank is only assigned AFTER successful payment.

**Q: Can users cancel?**  
A: No recurring charges - they buy time upfront. Time expires automatically.

**Q: What about refunds?**  
A: Handle through Square Dashboard → Payments → Refund

**Q: How do I test without real money?**  
A: Use sandbox mode with test cards (4111 1111 1111 1111)

## 📞 Support

If you still see "Subscriptions Not Available":

1. Check `.env` has all Square variables
2. Verify `SQUARE_INTEGRATION_ENABLED=true`
3. Restart dev server
4. Check http://localhost:3000/api/square/status
5. Look for errors in terminal

## 🎉 You're Ready!

Once Square is configured:
- Users can purchase rank time
- Automatic upgrades/downgrades work
- Ranks expire automatically
- All conversions are fair and automatic

**Need help?** Check `ENV_SETUP_GUIDE.md` for detailed instructions.
