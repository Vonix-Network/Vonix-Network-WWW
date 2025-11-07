# Stripe Integration - Complete Guide

## Overview

Vonix Network uses Stripe for all payment processing, including one-time donations and recurring subscriptions.

## Features

### ✅ Implemented Features
- Stripe Checkout for payments (hosted)
- Recurring subscriptions (monthly, quarterly, semi-annual, yearly)
- One-time payments
- Automatic tax calculation
- Customer Portal for subscription management
- Receipt generation
- Rank extension on renewal
- Webhook event handling
- Pause/resume support
- Auto-sync of Stripe products

## Environment Variables

```env
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Payment Flow

### Checkout Session Creation
1. User selects rank and duration
2. API creates Stripe customer (if new)
3. Creates checkout session with metadata
4. Redirects to Stripe-hosted checkout
5. User completes payment
6. Redirects back to success page

### Rank Assignment
1. Success page calls verify-session API
2. Verifies payment completion
3. Assigns rank via `assignRankSubscription()`
4. Generates receipt
5. Sends confirmation email

### Subscription Renewal
1. Stripe auto-charges customer
2. Webhook receives `invoice.payment_succeeded`
3. System extends rank (adds days to expiration)
4. Creates donation record
5. Sends renewal email

## Stripe Configuration

### Customer Portal Settings
- Enable invoice history
- Enable payment method updates
- Enable subscription cancellation
- Enable subscription updates
- Return URL: `${NEXT_PUBLIC_APP_URL}/settings/billing`

### Tax Settings
- Enable automatic tax
- Configure tax IDs for your regions

### Webhook Events
Listen for these events:
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.paused`
- `customer.subscription.resumed`
- `checkout.session.completed`

Webhook URL: `${NEXT_PUBLIC_APP_URL}/api/stripe/webhook`

## Pause/Resume

When user pauses subscription:
- System tracks pause date and remaining days
- Rank stays active until natural expiration
- On resume: expiration extended by pause duration

## Auto Product Sync

System automatically creates Stripe products/prices if missing:
- Validates existing product IDs
- Creates products with 4 price points
- Applies discounts (5%, 10%, 15%)
- Updates database with Stripe IDs

Admin can manually sync via: `/admin/donor-ranks` → Stripe sync button

## Testing

**Test Cards:**
- Success: `4242 4242 4242 4242`
- 3D Secure: `4000 0025 0000 3155`
- Declined: `4000 0000 0000 9995`

Use any future expiry date, any CVC, any ZIP.

## Deployment Checklist

- [ ] Switch to live Stripe keys
- [ ] Configure Customer Portal in live mode
- [ ] Enable automatic tax
- [ ] Create production webhook
- [ ] Test with real payment ($1 test)
- [ ] Verify webhooks process correctly
- [ ] Configure tax compliance for your regions

## API Endpoints

- `POST /api/stripe/create-checkout-session` - Create checkout
- `GET /api/stripe/verify-session` - Verify payment
- `POST /api/stripe/webhook` - Handle Stripe events
- `POST /api/stripe/create-portal-session` - Open Customer Portal
- `GET /api/stripe/check-subscription-status` - Check subscription

## Database Schema

### users table
- `stripeCustomerId` - Stripe customer ID
- `donationRankId` - Current rank
- `rankExpiresAt` - Expiration timestamp
- `rankPaused` - Pause flag
- `pausedAt` - Pause start date
- `totalDonated` - Cumulative amount

### donation_ranks table
- `stripeProductId` - Product ID (prod_xxx)
- `stripePriceMonthly` - Monthly price ID
- `stripePriceQuarterly` - Quarterly price ID
- `stripePriceSemiannual` - Semi-annual price ID
- `stripePriceYearly` - Yearly price ID

### donations table
- `paymentId` - Stripe payment intent ID
- `subscriptionId` - Stripe subscription ID
- `receiptNumber` - Unique receipt
- `paymentType` - one_time | subscription | subscription_renewal

## Troubleshooting

**Webhooks not firing:**
- Check endpoint URL in Stripe Dashboard
- Verify webhook secret matches .env
- Check server logs for errors

**Tax not calculating:**
- Enable automatic tax in Stripe settings
- Ensure address collection is enabled
- Verify `customer_update.address = 'auto'`

**Rank not assigned:**
- Check webhook logs
- Verify session metadata
- Check database for stripe_customer_id

## Support

For issues:
- Stripe Support: https://support.stripe.com/
- Stripe Status: https://status.stripe.com/
- Check webhook logs in Stripe Dashboard
