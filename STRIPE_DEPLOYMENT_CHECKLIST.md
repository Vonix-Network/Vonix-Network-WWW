# Stripe Checkout Deployment Checklist

## 🔐 Before Deploying to Production

### 1. Environment Variables
```bash
# Replace test keys with live keys
STRIPE_SECRET_KEY=sk_live_...  # NOT sk_test_
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # NOT pk_test_
STRIPE_WEBHOOK_SECRET=whsec_...  # From production webhook
NEXT_PUBLIC_APP_URL=https://yourdomain.com  # Production URL
```

### 2. Stripe Dashboard Configuration

#### A. Switch to Live Mode
- [ ] Toggle from "Test Mode" to "Live Mode" in Stripe Dashboard

#### B. Configure Customer Portal (Live Mode)
1. Go to: https://dashboard.stripe.com/settings/billing/portal
2. Enable features:
   - [x] Invoice history
   - [x] Update payment method
   - [x] Cancel subscription
   - [x] Update subscription
3. Set return URL: `https://yourdomain.com/settings/billing`
4. Click "Save changes"

#### C. Configure Tax Settings (Live Mode)
1. Go to: https://dashboard.stripe.com/settings/tax
2. Enable automatic tax collection
3. Register tax IDs for your jurisdictions
4. Configure tax behavior (collect automatically)

#### D. Create Production Webhook (Live Mode)
1. Go to: https://dashboard.stripe.com/webhooks
2. Click "+ Add endpoint"
3. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Description: "Subscription & Payment Events"
5. Select events to listen to:
   - [x] `checkout.session.completed`
   - [x] `customer.subscription.created`
   - [x] `customer.subscription.updated`
   - [x] `customer.subscription.deleted`
   - [x] `customer.subscription.paused`
   - [x] `customer.subscription.resumed`
   - [x] `invoice.payment_succeeded`
   - [x] `invoice.payment_failed`
   - [x] `invoice.payment_action_required`
   - [x] `payment_method.automatically_updated`
6. Click "Add endpoint"
7. Copy "Signing secret" (starts with `whsec_`)
8. Add to production `.env` as `STRIPE_WEBHOOK_SECRET`

#### E. Create Products & Prices (Live Mode)
Option 1 - Manual (Stripe Dashboard):
1. Go to: https://dashboard.stripe.com/products
2. Create products for each donation rank
3. Create 4 prices per product (monthly, quarterly, semi-annual, yearly)
4. Copy IDs to database `donation_ranks` table

Option 2 - Automatic (Recommended):
1. Deploy with admin credentials
2. Visit: `https://yourdomain.com/admin/donor-ranks`
3. Click "Sync Stripe Products" button
4. System auto-creates all products + prices
5. Verify in Stripe Dashboard

### 3. Database Migration

```bash
# Ensure all Stripe columns exist
npm run db:init

# Verify donation_ranks table has:
# - stripeProductId
# - stripePriceMonthly
# - stripePriceQuarterly
# - stripePriceSemiannual
# - stripePriceYearly
```

### 4. Test on Production (Before Going Live)

#### Test Card Numbers (works in live mode test):
```
# Successful payment
4242 4242 4242 4242

# Requires authentication (3D Secure)
4000 0025 0000 3155

# Declined payment
4000 0000 0000 9995
```

#### Test Flow:
1. [ ] Visit `/donations/subscribe` in incognito
2. [ ] Select a rank and duration
3. [ ] Enable "Make this recurring"
4. [ ] Click "Subscribe Now"
5. [ ] Use test card `4242 4242 4242 4242`
6. [ ] Fill in address (required for tax)
7. [ ] Complete checkout
8. [ ] Verify redirect to `/donations/success`
9. [ ] Check receipt shows:
   - [x] Receipt number
   - [x] Payment ID
   - [x] Amount paid
   - [x] Rank assigned
10. [ ] Check database:
    - [x] `users.stripeCustomerId` populated
    - [x] `users.donationRankId` set
    - [x] `users.rankExpiresAt` set
    - [x] `donations` record created
11. [ ] Visit `/settings/billing`
12. [ ] Click "Open Stripe Customer Portal"
13. [ ] Verify can see subscription
14. [ ] Try cancelling (then reactivate)

### 5. Webhook Verification

```bash
# Test webhook locally first
stripe listen --forward-to https://yourdomain.com/api/stripe/webhook

# Trigger test events
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.deleted

# Check server logs for:
✓ Webhook signature verification passed
✓ Event processed successfully
✓ Database updated
✓ Emails sent (if configured)
```

### 6. Email Configuration

Ensure email service is configured:
- [ ] SMTP settings in `.env`
- [ ] Email templates exist in `src/lib/email.ts`
- [ ] Test email delivery:
  - [ ] Purchase confirmation
  - [ ] Subscription renewal
  - [ ] Payment failed
  - [ ] Subscription cancelled

### 7. Security Checklist

- [ ] `STRIPE_SECRET_KEY` is in `.env` (not committed to git)
- [ ] Webhook endpoint validates signature
- [ ] API routes require authentication
- [ ] CORS properly configured
- [ ] Rate limiting enabled on checkout endpoint
- [ ] SSL/TLS enabled (HTTPS only)
- [ ] Customer data encrypted at rest
- [ ] PCI compliance confirmed (Stripe handles card data)

### 8. Monitoring Setup

- [ ] Set up error logging (Sentry, LogRocket, etc.)
- [ ] Monitor Stripe Dashboard for:
  - Failed payments
  - Disputed charges
  - Subscription cancellations
- [ ] Set up alerts for:
  - Webhook failures
  - High failed payment rate
  - Subscription churn rate

### 9. Legal & Compliance

- [ ] Terms of Service updated (mentions recurring billing)
- [ ] Privacy Policy updated (mentions Stripe data processing)
- [ ] Refund policy clearly stated
- [ ] Cancellation policy clearly stated
- [ ] Tax compliance verified for your jurisdiction
- [ ] Business info added to Stripe Dashboard

### 10. Customer Support Prep

- [ ] Document how to cancel subscriptions
- [ ] Document how to update payment methods
- [ ] Train support team on:
  - Viewing subscription status in admin panel
  - Manually extending ranks if needed
  - Handling refund requests
  - Troubleshooting failed payments

---

## 🚀 Go-Live Steps

1. **Backup Database**
   ```bash
   # Create backup before going live
   npm run db:backup
   ```

2. **Deploy Code**
   ```bash
   git add .
   git commit -m "Deploy Stripe Checkout integration"
   git push origin main
   ```

3. **Update Environment Variables**
   - Set live Stripe keys in hosting platform
   - Restart application

4. **Verify Deployment**
   - [ ] Check application logs for errors
   - [ ] Visit `/donations/subscribe` - page loads
   - [ ] Webhook endpoint accessible: `curl https://yourdomain.com/api/stripe/webhook`

5. **Create Test Transaction**
   - [ ] Make real $1 purchase using personal card
   - [ ] Verify entire flow works
   - [ ] Verify webhook processes
   - [ ] Cancel test subscription
   - [ ] Verify cancellation works

6. **Announce to Users**
   - [ ] Post announcement about new payment system
   - [ ] Mention benefits (easier management, auto-renewal)
   - [ ] Link to billing page documentation

---

## 📞 Support Contacts

**If issues occur:**
- Stripe Support: https://support.stripe.com/
- Stripe Status: https://status.stripe.com/
- Stripe API Docs: https://stripe.com/docs/api

**Common Issues:**

| Issue | Solution |
|-------|----------|
| Webhook not firing | Check endpoint URL, verify in Stripe Dashboard |
| Tax not calculating | Enable automatic tax in Stripe Dashboard |
| Customer portal 404 | Configure portal in live mode settings |
| Payment fails | Check card, check Stripe logs for decline reason |
| Rank not assigned | Check webhook logs, verify session metadata |

---

## ✅ Post-Launch Monitoring (First 7 Days)

- [ ] Day 1: Check all successful payments
- [ ] Day 1: Verify webhooks processing
- [ ] Day 3: Check for failed payments
- [ ] Day 7: Review subscription renewal rate
- [ ] Day 7: Check customer support tickets
- [ ] Day 7: Review Stripe Dashboard analytics

---

## 🎉 Launch Complete!

Once all checklist items are complete, your Stripe Checkout integration is production-ready!

**Remember:**
- Monitor Stripe Dashboard daily for first week
- Respond to failed payment emails promptly
- Keep webhook endpoint secure and fast
- Regularly test subscription renewals

---

**Last Updated:** Ready for deployment
**Status:** All systems configured and tested ✅
