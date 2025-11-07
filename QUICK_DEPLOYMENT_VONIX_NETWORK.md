# ⚡ Quick Deployment Guide - Vonix.Network

## 🚀 30-Minute Deployment to Vonix.Network

### **Step 1: Vercel Deployment** (10 min)

1. **Go to:** https://vercel.com
2. **Import project:** `Vonix1/Vonix-Network-WWW`
3. **Add environment variables:**

```env
NEXT_PUBLIC_APP_URL=https://vonix.network
DATABASE_URL=your_turso_production_url
STRIPE_SECRET_KEY=sk_live_your_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
SESSION_SECRET=generate_with_openssl_rand_base64_32
PAYMENT_PROVIDER=stripe
NODE_ENV=production
```

4. **Deploy** → Wait 2-3 minutes

---

### **Step 2: Domain Configuration** (5 min)

**In Vercel:**
1. Settings → Domains
2. Add: `vonix.network`
3. Add: `www.vonix.network`

**In Your Domain Registrar (Namecheap, GoDaddy, etc.):**

```
Type: A
Name: @
Value: 76.76.21.21
TTL: Auto
```

```
Type: CNAME  
Name: www
Value: cname.vercel-dns.com
TTL: Auto
```

**Wait:** 5-60 minutes for DNS propagation

---

### **Step 3: Stripe Webhook** (5 min)

1. **Go to:** https://dashboard.stripe.com/webhooks
2. **Click:** "Add endpoint"
3. **URL:** `https://vonix.network/api/stripe/webhook`
4. **Select events:**
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. **Copy** signing secret (whsec_...)
6. **Add to Vercel:**
   - Settings → Environment Variables
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...`
   - Redeploy

---

### **Step 4: Test** (5 min)

1. Visit: `https://vonix.network`
2. Make test payment ($1)
3. Verify rank assigned
4. Check webhook in Stripe Dashboard
5. Cancel subscription (get refund)

---

## ✅ Checklist

**Before Going Live:**
- [ ] All environment variables set
- [ ] Domain pointing to Vercel (DNS propagated)
- [ ] SSL certificate active (HTTPS working)
- [ ] Stripe webhook configured
- [ ] Test payment successful
- [ ] Webhook delivered successfully
- [ ] Email notifications working

**Production URLs:**
- Website: `https://vonix.network`
- Webhook: `https://vonix.network/api/stripe/webhook`

---

## 🔑 Required Environment Variables

Copy these to Vercel:

```env
# App
NEXT_PUBLIC_APP_URL=https://vonix.network
NODE_ENV=production

# Database (Get from Turso)
DATABASE_URL=libsql://vonix-network-prod.turso.io
DATABASE_AUTH_TOKEN=your_turso_token

# Stripe LIVE keys (from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  # After webhook setup

# Security
SESSION_SECRET=long_random_string  # Generate with: openssl rand -base64 32
PAYMENT_PROVIDER=stripe
```

---

## 📝 DNS Configuration Reference

**Root Domain:**
```
vonix.network
→ A Record → 76.76.21.21 (Vercel)
```

**WWW Subdomain:**
```
www.vonix.network  
→ CNAME → cname.vercel-dns.com
```

---

## 🆘 Quick Troubleshooting

**Issue: Domain not working**
- Wait 30-60 min for DNS
- Check registrar DNS settings
- Verify A record: 76.76.21.21

**Issue: Webhook not firing**
- Check signing secret correct
- Verify URL: https://vonix.network/api/stripe/webhook
- Must be HTTPS
- Check Stripe Dashboard → Webhooks

**Issue: Payment not assigning rank**
- Check webhook secret set in Vercel
- Redeploy after adding webhook secret
- Check Vercel logs
- Check Stripe webhook logs

---

## 🎯 Your Production URLs

| Purpose | URL |
|---------|-----|
| **Website** | https://vonix.network |
| **Admin** | https://vonix.network/admin |
| **Donations** | https://vonix.network/donations/subscribe |
| **Webhooks** | https://vonix.network/api/stripe/webhook |
| **Dashboard** | https://vonix.network/dashboard |

---

## 📊 After Deployment

1. **Announce:**
```
🎉 Vonix Network is live at https://vonix.network
✨ Secure payments with Stripe
🔄 Auto-renewing subscriptions
📧 Email confirmations
```

2. **Monitor:**
   - Stripe Dashboard (payments)
   - Vercel Dashboard (logs)
   - Webhook delivery (Stripe)

3. **Support:**
   - Create #support channel
   - Monitor first 24 hours
   - Be ready for questions

---

## ⚡ Time Breakdown

- Vercel deployment: **10 minutes**
- DNS configuration: **5 minutes**
- DNS propagation: **5-60 minutes** (wait)
- Stripe webhook: **5 minutes**
- Testing: **5 minutes**

**Total active time: 25 minutes**
**Total including DNS wait: 30-80 minutes**

---

## 🎉 You're Ready!

Once DNS propagates and webhook is configured, you're live!

**Next steps:**
1. Test thoroughly
2. Monitor for 24 hours
3. Announce to community
4. Celebrate! 🎊
