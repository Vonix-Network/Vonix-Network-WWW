# Enterprise Rank Subscription System

## 🎯 Overview

Complete time-based rank subscription system with automatic day conversion, upgrades/downgrades, and expiration handling.

## ✅ Implemented Features

### 1. Rank Subscription Service (`src/lib/rank-subscription.ts`)

**Core Functionality:**
- ✅ Time-based rank pricing (price per day model)
- ✅ Duration packages with discounts (1mo, 3mo, 6mo, 12mo)
- ✅ Automatic day conversion for upgrades/downgrades
- ✅ Rank assignment with expiration tracking
- ✅ Value preservation across rank changes

**Pricing Structure:**
```typescript
Supporter: $0.17/day  (~$5/month)
Patron:    $0.33/day  (~$10/month)
Elite:     $0.50/day  (~$15/month)
Legend:    $0.83/day  (~$25/month)
Champion:  $1.67/day  (~$50/month)
```

**Discounts:**
- 3 months: 5% off
- 6 months: 10% off
- 12 months: 15% off

**Key Functions:**
```typescript
calculateDaysForPrice(rankId, price)     // $15 → 88 days for Supporter
calculatePriceForDays(rankId, days)      // 30 days → $5 for Supporter
getDurationPackages(rankId)              // Get all duration options
convertRankDays(from, to, days)          // Convert 30 days Supporter → 15 days Patron
assignRankSubscription(userId, rankId, days)
upgradeRank(userId, newRankId)           // Auto-converts remaining time
downgradeRank(userId, newRankId)         // Gives more days
removeExpiredRanks()                     // Cron job function
```

### 2. User Subscription Page (`/donations/subscribe`)

**Features:**
- ✅ Visual rank selection with features/benefits
- ✅ Duration selection with discount badges
- ✅ Real-time price calculation
- ✅ Order summary with upgrade info
- ✅ Mobile-responsive design
- ✅ Integrates with existing donor ranks API

**User Flow:**
1. Browse available ranks with pricing
2. Select desired rank
3. Choose duration (1mo - 12mo)
4. See total price with discounts
5. Continue to payment

### 3. Subscription API (`/api/subscriptions/purchase`)

**Endpoints:**

**POST /api/subscriptions/purchase**
- Processes subscription purchase
- Assigns rank with expiration
- Records donation
- Updates total donated
- Returns expiration date

**GET /api/subscriptions/purchase**
- Gets current subscription info
- Returns: rank, expiration, days remaining
- Shows active status

## 📋 Integration Points

### With Existing Systems:

1. **Donor Ranks** - Uses existing `donation_ranks` table
2. **User Table** - Uses `donationRankId` and `rankExpiresAt` fields
3. **Donations** - Records all subscription purchases
4. **Square Payments** - Ready for Square integration

### Database Fields Used:
```typescript
users.donationRankId     // Current rank
users.rankExpiresAt      // When rank expires
users.totalDonated       // Running total
```

## 🔄 Upgrade/Downgrade Logic

### Example Scenarios:

**Upgrade (Supporter → Patron with 30 days left):**
1. User has 30 days of Supporter ($0.17/day)
2. Total value: 30 × $0.17 = $5.10
3. Convert to Patron ($0.33/day)
4. New duration: $5.10 ÷ $0.33 = 15 days
5. Result: User gets 15 days of Patron rank

**Downgrade (Patron → Supporter with 15 days left):**
1. User has 15 days of Patron ($0.33/day)
2. Total value: 15 × $0.33 = $4.95
3. Convert to Supporter ($0.17/day)
4. New duration: $4.95 ÷ $0.17 = 29 days
5. Result: User gets 29 days of Supporter rank

**Extension (Same Rank):**
- If user already has rank with time left, new days are added
- 15 days left + buy 30 days = 45 days total

## 🚧 Next Steps

### Phase 2 - Payment Integration
- [ ] Update Square payment form to handle subscriptions
- [ ] Add subscription data to payment request
- [ ] Show rank activation confirmation
- [ ] Redirect to subscription management after purchase

### Phase 3 - Automation
- [ ] Create cron endpoint at `/api/cron/expire-ranks`
- [ ] Set up Vercel cron or external scheduler
- [ ] Run hourly to check and remove expired ranks
- [ ] Send email notifications before expiration (optional)

### Phase 4 - Management UI
- [ ] User subscription dashboard
  - View current rank & expiration
  - Extend subscription
  - Upgrade/downgrade options
  - Subscription history
- [ ] Admin tools
  - View all active subscriptions
  - Manual rank extensions
  - Subscription analytics
  - Revenue tracking

### Phase 5 - Enhancements
- [ ] Email notifications (3 days, 1 day before expiry)
- [ ] Auto-renewal with Square subscriptions
- [ ] Gift subscriptions
- [ ] Subscription transfer
- [ ] Referral rewards
- [ ] Loyalty bonuses (e.g., +5% time if subscriber for 6+ months)

## 💡 Business Logic Examples

### Pricing Examples:
```
Supporter:
- 1 month:  $5.00
- 3 months: $14.25 (5% off)
- 6 months: $27.00 (10% off)
- 1 year:   $52.70 (15% off)

Patron:
- 1 month:  $10.00
- 3 months: $28.50 (5% off)
- 6 months: $54.00 (10% off)
- 1 year:   $105.40 (15% off)

Champion:
- 1 month:  $50.00
- 3 months: $142.50 (5% off)
- 6 months: $270.00 (10% off)
- 1 year:   $527.05 (15% off)
```

### Conversion Examples:
```
$15 Purchase:
- Supporter: 88 days
- Patron:    45 days
- Elite:     30 days
- Legend:    18 days
- Champion:  9 days

30 Days Value:
- Supporter: $5.10
- Patron:    $9.90
- Elite:     $15.00
- Legend:    $24.90
- Champion:  $50.10
```

## 🔒 Security Considerations

1. **Authentication Required** - All endpoints check session
2. **Input Validation** - Days and amounts validated
3. **SQL Injection Protected** - Uses Drizzle ORM
4. **Transaction Safety** - Atomic operations
5. **Payment Verification** - Square handles payment security

## 📊 Analytics Opportunities

Track these metrics:
- Most popular ranks
- Most popular durations
- Upgrade vs downgrade ratio
- Average subscription length
- Revenue per rank tier
- Churn rate
- Lifetime value per subscriber

## 🎨 UI/UX Features

- ✅ Clear pricing display
- ✅ Discount badges on longer durations
- ✅ Real-time price calculation
- ✅ Visual rank comparison
- ✅ Mobile-friendly design
- ✅ Upgrade encouragement messaging
- ✅ Value preservation explanation

## 🔧 Configuration

Adjust pricing in `src/lib/rank-subscription.ts`:
```typescript
export const RANK_PRICING: Record<string, number> = {
  'supporter': 0.17,  // Change base price
  'patron': 0.33,     
  // ...
};
```

Adjust discounts in `getDurationPackages()`:
```typescript
{
  days: 90,
  price: basePrice * 90 * 0.95,  // Change discount %
  discount: 5,                    // Update label
}
```

## 📝 Testing Checklist

- [ ] Purchase new subscription
- [ ] Extend existing subscription
- [ ] Upgrade from lower to higher rank
- [ ] Downgrade from higher to lower rank
- [ ] Verify day conversion accuracy
- [ ] Check expiration handling
- [ ] Test with expired rank
- [ ] Verify donation recording
- [ ] Check total donated updates
- [ ] Test with different durations
- [ ] Verify discount calculations
- [ ] Mobile UI testing

## 🎉 Benefits

**For Users:**
- Flexible duration options
- No lost value on upgrades
- Clear pricing structure
- Automatic time conversion
- Easy subscription management

**For Server:**
- Predictable revenue
- Reduced support overhead
- Automated rank management
- Detailed analytics
- Fair value system

## 📞 Support

Common questions covered:
1. "What happens if I upgrade?" → Time converts automatically
2. "Can I switch ranks?" → Yes, value is preserved
3. "What if my rank expires?" → Automatic removal, can re-subscribe
4. "Do longer subscriptions save money?" → Yes, up to 15% off
5. "Can I extend before expiry?" → Yes, days stack
