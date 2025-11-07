# 🚀 Deployment Guide for Vonix.Network

## 📋 Overview

This guide covers deploying your Next.js application to production with the domain **Vonix.Network**.

---

## 🎯 Deployment Options

### **Option 1: Vercel (Recommended - Easiest)** ⭐

**Pros:**
- ✅ Zero configuration deployment
- ✅ Automatic HTTPS
- ✅ Built by Next.js creators
- ✅ Automatic previews for PRs
- ✅ Edge network (fast worldwide)
- ✅ Free SSL certificate
- ✅ Serverless functions auto-scale

**Cons:**
- ❌ Serverless limits (10s timeout on Hobby, 60s on Pro)
- ❌ Cold starts possible

### **Option 2: Self-Hosted VPS (DigitalOcean, AWS, etc.)**

**Pros:**
- ✅ Full control
- ✅ No timeouts
- ✅ Can run background jobs
- ✅ More cost-effective at scale

**Cons:**
- ❌ More setup required
- ❌ Manual HTTPS setup
- ❌ Need to manage server

---

## 🚀 Option 1: Deploy to Vercel (Recommended)

### **Step 1: Prepare Your Project**

1. **Commit all changes:**
```bash
git add .
git commit -m "Prepare for production deployment"
git push
```

2. **Update `.env.production` (create if doesn't exist):**
```env
# Production Environment Variables

# App URL - Your Custom Domain
NEXT_PUBLIC_APP_URL=https://vonix.network

# Database - Use Production Database
DATABASE_URL=your_production_database_url_here
# For Turso: libsql://[database-name]-[org-name].turso.io
# Get from: turso db show [database-name] --url

# Stripe - Live Keys
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret

# Payment Provider
PAYMENT_PROVIDER=stripe

# Session Secret - Generate new one for production
SESSION_SECRET=generate_a_new_long_random_string_here

# Node Environment
NODE_ENV=production
```

---

### **Step 2: Deploy to Vercel**

#### **A. Connect GitHub Repository**

1. Go to: https://vercel.com
2. Sign in with GitHub
3. Click "Add New..." → "Project"
4. Import your repository: `Vonix1/Vonix-Network-WWW`
5. Configure project:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (leave default)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)

#### **B. Add Environment Variables**

In Vercel dashboard:
1. Click "Environment Variables"
2. Add each variable from `.env.production`:
   - `NEXT_PUBLIC_APP_URL` → `https://vonix.network`
   - `DATABASE_URL` → Your Turso URL
   - `STRIPE_SECRET_KEY` → Your live Stripe key
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → Your live publishable key
   - `STRIPE_WEBHOOK_SECRET` → (Leave blank for now, we'll add after webhook setup)
   - `SESSION_SECRET` → Generate with: `openssl rand -base64 32`
   - `PAYMENT_PROVIDER` → `stripe`
   - `NODE_ENV` → `production`

3. Click "Deploy"

#### **C. Wait for Deployment**

- First deploy takes 2-3 minutes
- You'll get a URL like: `vonix-network-www.vercel.app`
- Test this URL before adding custom domain

---

### **Step 3: Configure Custom Domain**

#### **A. Add Domain in Vercel**

1. In Vercel project → "Settings" → "Domains"
2. Add domain: `vonix.network`
3. Add with `www`: `www.vonix.network`
4. Vercel will provide DNS records

#### **B. Configure DNS (Your Domain Registrar)**

Go to your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.) and add:

**For Root Domain (vonix.network):**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: Auto
```

**For WWW (www.vonix.network):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Auto
```

**Wait 5-60 minutes for DNS propagation**

#### **C. Verify Domain**

1. In Vercel → "Domains" tab
2. Wait for "Valid Configuration" ✅
3. SSL certificate auto-issued (2-5 minutes)
4. Visit https://vonix.network (should work!)

---

### **Step 4: Configure Stripe Webhook**

**Now that your site is live:**

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Configure:
   - **Endpoint URL:** `https://vonix.network/api/stripe/webhook`
   - **Description:** `Vonix Network Production Webhook`
   - **Events to send:**
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
4. Click "Add endpoint"
5. **Copy the Signing Secret** (whsec_...)

#### **Add Webhook Secret to Vercel:**

1. Go to Vercel → Project → Settings → Environment Variables
2. Add/Update:
   - Key: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_...` (the signing secret you copied)
   - Environment: Production
3. **Redeploy** (Settings → Deployments → Redeploy)

---

### **Step 5: Test Production**

#### **A. Test Payment Flow:**

1. Visit `https://vonix.network`
2. Register/login
3. Go to Donations → Subscribe
4. Select a rank
5. Enable auto-renew
6. Complete payment (use real card in live mode)
7. Verify:
   - ✅ Redirected to success page
   - ✅ Rank activated
   - ✅ Receipt shown
   - ✅ Email received

#### **B. Verify Webhook:**

1. Go to Stripe Dashboard → Webhooks
2. Find your webhook
3. Click "Events" → Should show successful delivery
4. If failed, check logs in Vercel

#### **C. Test Subscription Management:**

1. Go to Settings → Subscriptions
2. Verify subscription shows
3. Test "Cancel (Keep Access)"
4. Test "Resume"

---

## 🔧 Option 2: Self-Hosted VPS Deployment

### **Requirements:**
- VPS with Node.js 18+ (DigitalOcean, AWS EC2, Linode, etc.)
- Nginx or Apache
- SSL certificate (Let's Encrypt)
- PM2 or similar process manager

### **Step 1: Set Up VPS**

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2
npm install -g pm2

# Install Nginx
apt install -y nginx

# Install Certbot (for SSL)
apt install -y certbot python3-certbot-nginx
```

### **Step 2: Clone and Build**

```bash
# Create app directory
mkdir -p /var/www/vonix-network
cd /var/www/vonix-network

# Clone repository
git clone https://github.com/Vonix1/Vonix-Network-WWW.git .

# Install dependencies
npm install

# Create .env.production
nano .env.production
# (Add all production environment variables)

# Build
npm run build
```

### **Step 3: Configure PM2**

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'vonix-network',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/vonix-network',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### **Step 4: Configure Nginx**

Create `/etc/nginx/sites-available/vonix.network`:
```nginx
server {
    listen 80;
    server_name vonix.network www.vonix.network;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/vonix.network /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### **Step 5: Set Up SSL**

```bash
# Get SSL certificate
certbot --nginx -d vonix.network -d www.vonix.network

# Auto-renewal (already configured by certbot)
```

### **Step 6: Configure DNS**

Point your domain to your VPS IP:
```
Type: A
Name: @
Value: YOUR_VPS_IP_ADDRESS

Type: A
Name: www
Value: YOUR_VPS_IP_ADDRESS
```

### **Step 7: Configure Stripe Webhook**

Same as Vercel, but use:
- Endpoint URL: `https://vonix.network/api/stripe/webhook`

---

## 📊 Production Environment Variables

### **Required Variables:**

```env
# === App Configuration ===
NEXT_PUBLIC_APP_URL=https://vonix.network
NODE_ENV=production

# === Database ===
DATABASE_URL=libsql://your-db-name.turso.io
DATABASE_AUTH_TOKEN=your_turso_auth_token

# === Stripe (LIVE Mode) ===
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYMENT_PROVIDER=stripe

# === Session & Security ===
SESSION_SECRET=long_random_string_32_chars_minimum

# === Email (If using SMTP - or configure via Admin) ===
# SMTP_HOST=smtp.sendgrid.net
# SMTP_PORT=587
# SMTP_USER=apikey
# SMTP_PASS=your_sendgrid_api_key
# SMTP_FROM=noreply@vonix.network
```

### **Optional Variables:**

```env
# === Square (If using) ===
# SQUARE_ACCESS_TOKEN=your_square_token
# SQUARE_LOCATION_ID=your_location_id

# === Analytics ===
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# === Error Tracking ===
# SENTRY_DSN=https://...@sentry.io/...
```

---

## 🔒 Security Checklist

Before going live:

- [ ] **Use HTTPS only** (no HTTP)
- [ ] **Environment variables secure** (not in git)
- [ ] **Session secret is strong** (32+ random chars)
- [ ] **Database has backups** enabled
- [ ] **Stripe is in LIVE mode** (not test)
- [ ] **Webhook signing verified** (STRIPE_WEBHOOK_SECRET set)
- [ ] **CORS configured** (if needed)
- [ ] **Rate limiting** considered
- [ ] **Error monitoring** set up (Sentry)
- [ ] **Uptime monitoring** set up (UptimeRobot, Better Uptime)

---

## 📧 Email Configuration

### **Option A: Configure via Admin Panel** (Recommended)

1. Login as admin
2. Go to `/admin/settings`
3. Click "Email Settings"
4. Enter SMTP details:
   - Host: `smtp.sendgrid.net` (or your provider)
   - Port: `587`
   - Username: Your SMTP username
   - Password: Your SMTP password/API key
   - From Address: `noreply@vonix.network`

### **Option B: Use Environment Variables**

Add to `.env.production`:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_api_key
SMTP_FROM=noreply@vonix.network
```

### **Recommended Email Providers:**

- **SendGrid:** Free 100 emails/day
- **Mailgun:** Free 5,000 emails/month
- **AWS SES:** Very cheap, requires verification
- **Postmark:** Great deliverability

---

## 🗄️ Database Setup

### **Using Turso (Recommended)**

1. **Create production database:**
```bash
turso db create vonix-network-prod --location lax
```

2. **Get connection URL:**
```bash
turso db show vonix-network-prod --url
```

3. **Create auth token:**
```bash
turso db tokens create vonix-network-prod
```

4. **Add to environment:**
```env
DATABASE_URL=libsql://vonix-network-prod-[org].turso.io
DATABASE_AUTH_TOKEN=eyJ...
```

5. **Push schema:**
```bash
npm run db:push
```

---

## 🚦 Post-Deployment Checklist

After deployment:

1. **Test Core Functionality:**
   - [ ] Homepage loads
   - [ ] Login works
   - [ ] Registration works
   - [ ] Dashboard accessible
   - [ ] Payment flow works
   - [ ] Subscription management works

2. **Test Payment Flow:**
   - [ ] One-time payment completes
   - [ ] Subscription payment completes
   - [ ] Rank assigned correctly
   - [ ] Receipt generated
   - [ ] Email sent
   - [ ] Webhook received

3. **Monitor:**
   - [ ] Check Vercel/server logs
   - [ ] Check Stripe webhook logs
   - [ ] Watch for errors
   - [ ] Test on mobile
   - [ ] Test on different browsers

4. **Performance:**
   - [ ] Run Lighthouse audit
   - [ ] Check page load times
   - [ ] Verify images optimized
   - [ ] Test under load

---

## 🔄 Continuous Deployment

### **Vercel (Automatic):**
- Push to `main` branch → Auto deploys
- Push to other branches → Preview deployments
- Pull requests → Preview URLs

### **VPS (Manual or CI/CD):**

**Manual:**
```bash
ssh root@your-server
cd /var/www/vonix-network
git pull
npm install
npm run build
pm2 restart vonix-network
```

**Automated with GitHub Actions:**
Create `.github/workflows/deploy.yml` (example in docs)

---

## 📊 Monitoring & Analytics

### **Essential Monitoring:**

1. **Uptime Monitoring:**
   - UptimeRobot (free)
   - Better Uptime
   - Pingdom

2. **Error Tracking:**
   - Sentry (free tier available)
   - LogRocket
   - BugSnag

3. **Analytics:**
   - Google Analytics
   - Plausible (privacy-focused)
   - Umami (self-hosted)

4. **Payment Monitoring:**
   - Stripe Dashboard
   - Set up Stripe email alerts
   - Monitor revenue daily

---

## 🆘 Troubleshooting

### **Issue: Webhook Not Working**

**Check:**
1. Webhook URL correct: `https://vonix.network/api/stripe/webhook`
2. HTTPS (not HTTP)
3. Signing secret set correctly
4. Check Stripe Dashboard → Webhooks for errors
5. Check server logs for webhook calls

**Test webhook:**
```bash
stripe listen --forward-to https://vonix.network/api/stripe/webhook
```

### **Issue: Payments Not Working**

**Check:**
1. Using live Stripe keys (not test)
2. Domain matches `NEXT_PUBLIC_APP_URL`
3. No CORS errors in browser console
4. Check Stripe Dashboard → Payments

### **Issue: Database Connection Failed**

**Check:**
1. `DATABASE_URL` correct
2. Auth token valid (Turso)
3. Database accessible from server IP
4. Connection limits not exceeded

---

## ✅ Your Domain: Vonix.Network

**Quick Setup Summary:**

1. **Deploy to Vercel** (10 min)
2. **Add domain** `vonix.network` (2 min)
3. **Update DNS** at registrar (5 min + propagation)
4. **Configure Stripe webhook** `https://vonix.network/api/stripe/webhook` (5 min)
5. **Test payment** (5 min)
6. **Go live!** 🎉

**Total time: 30-40 minutes + DNS propagation**

---

## 🎉 You're Live!

Once deployed, announce to your community:

```
🎉 Vonix Network is now live!

Visit: https://vonix.network
Secure payments powered by Stripe
Auto-renewing subscriptions available
Beautiful receipts and email confirmations

Thank you for your support! 🚀
```

Good luck with your deployment! 🚀
