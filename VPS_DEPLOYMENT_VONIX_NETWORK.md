# 🖥️ VPS Deployment Guide - Vonix.Network

## 🚀 Deploy Next.js to Your VPS

This guide covers deploying to a VPS (DigitalOcean, AWS EC2, Linode, etc.) for **Vonix.Network**.

---

## 📋 Prerequisites

- VPS with Ubuntu 20.04+ or Debian 11+
- Root or sudo access
- Domain: `vonix.network` pointing to your VPS IP
- At least 2GB RAM (recommended)

---

## ⚡ Quick Setup (Copy-Paste Commands)

### **Step 1: Initial Server Setup** (5 min)

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify installation
node --version  # Should show v18.x
npm --version

# Install build tools
apt install -y build-essential git

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx (web server)
apt install -y nginx

# Install Certbot (SSL certificates)
apt install -y certbot python3-certbot-nginx
```

---

### **Step 2: Clone and Setup Project** (10 min)

```bash
# Create app directory
mkdir -p /var/www/vonix-network
cd /var/www/vonix-network

# Clone your repository
git clone https://github.com/Vonix1/Vonix-Network-WWW.git .

# Install dependencies
npm install

# Create production environment file
nano .env.production
```

**Add to `.env.production`:**
```env
# App Configuration
NEXT_PUBLIC_APP_URL=https://vonix.network
NODE_ENV=production

# Database (Turso or local)
DATABASE_URL=libsql://vonix-network-prod.turso.io
DATABASE_AUTH_TOKEN=your_turso_auth_token

# OR Local SQLite
# DATABASE_URL=file:/var/www/vonix-network/data/vonix.db

# Session & Security
SESSION_SECRET=generate_with_openssl_rand_base64_32
NEXTAUTH_SECRET=your_secret_key
AUTH_URL=https://vonix.network
AUTH_TRUST_HOST=true

# Stripe LIVE Mode
STRIPE_SECRET_KEY=sk_live_your_live_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
PAYMENT_PROVIDER=stripe

# Cron Secret
CRON_SECRET=your_cron_secret
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

```bash
# Copy to .env for build
cp .env.production .env

# Build the application
npm run build

# Push database schema (if needed)
npm run db:push
```

---

### **Step 3: Configure PM2** (5 min)

```bash
# Create PM2 configuration
nano ecosystem.config.js
```

**Add this configuration:**
```javascript
module.exports = {
  apps: [{
    name: 'vonix-network',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/vonix-network',
    instances: 2,  // Use 2 CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/www/vonix-network/logs/error.log',
    out_file: '/var/www/vonix-network/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

```bash
# Create logs directory
mkdir -p /var/www/vonix-network/logs

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on server boot
pm2 startup
# Run the command it outputs (it will give you a specific command)

# Check status
pm2 status
pm2 logs vonix-network --lines 50
```

---

### **Step 4: Configure Nginx** (10 min)

```bash
# Create Nginx configuration
nano /etc/nginx/sites-available/vonix.network
```

**Add this configuration:**
```nginx
# Upstream Node.js app
upstream vonix_network {
    server 127.0.0.1:3000;
    keepalive 64;
}

# Redirect www to non-www
server {
    listen 80;
    listen [::]:80;
    server_name www.vonix.network;
    return 301 https://vonix.network$request_uri;
}

# Main server block
server {
    listen 80;
    listen [::]:80;
    server_name vonix.network;

    # Increase upload size for admin uploads
    client_max_body_size 50M;

    # Logs
    access_log /var/log/nginx/vonix.network.access.log;
    error_log /var/log/nginx/vonix.network.error.log;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy to Next.js
    location / {
        proxy_pass http://vonix_network;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache static assets
    location /_next/static {
        proxy_pass http://vonix_network;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }

    # Cache images
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        proxy_pass http://vonix_network;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public";
    }
}
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

```bash
# Enable the site
ln -s /etc/nginx/sites-available/vonix.network /etc/nginx/sites-enabled/

# Remove default site
rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# If test passes, restart Nginx
systemctl restart nginx

# Enable Nginx to start on boot
systemctl enable nginx
```

---

### **Step 5: Configure DNS** (5 min)

**In your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.):**

```
Type: A
Name: @
Value: YOUR_VPS_IP_ADDRESS
TTL: Auto (or 3600)
```

```
Type: A
Name: www
Value: YOUR_VPS_IP_ADDRESS
TTL: Auto (or 3600)
```

**Or use CNAME for www:**
```
Type: CNAME
Name: www
Value: vonix.network
TTL: Auto
```

**Wait 5-30 minutes for DNS propagation**

---

### **Step 6: Setup SSL Certificate** (5 min)

```bash
# Get SSL certificate from Let's Encrypt
certbot --nginx -d vonix.network -d www.vonix.network

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (option 2)

# Verify auto-renewal is configured
certbot renew --dry-run

# Certificate will auto-renew every 60 days
```

**Your site is now live at `https://vonix.network` with SSL!** ✅

---

### **Step 7: Configure Stripe Webhook** (5 min)

1. **Go to:** https://dashboard.stripe.com/webhooks
2. **Add endpoint:** `https://vonix.network/api/stripe/webhook`
3. **Select events:**
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. **Copy signing secret** (whsec_...)
5. **Add to your `.env.production`:**
```bash
cd /var/www/vonix-network
nano .env.production
# Update: STRIPE_WEBHOOK_SECRET=whsec_your_secret
```
6. **Restart app:**
```bash
pm2 restart vonix-network
```

---

### **Step 8: Test Everything** (10 min)

```bash
# Check if app is running
pm2 status

# View logs
pm2 logs vonix-network --lines 100

# Check Nginx
systemctl status nginx

# Test SSL certificate
curl -I https://vonix.network

# Visit in browser
# https://vonix.network
```

**Test checklist:**
- [ ] Site loads over HTTPS
- [ ] No SSL warnings
- [ ] Login works
- [ ] Make test payment
- [ ] Verify webhook in Stripe Dashboard
- [ ] Check rank assigned
- [ ] Verify email sent

---

## 🔄 Deployment Updates

### **To Deploy New Changes:**

```bash
# SSH to server
ssh root@your-vps-ip

# Navigate to app directory
cd /var/www/vonix-network

# Pull latest changes
git pull

# Install any new dependencies
npm install

# Rebuild application
npm run build

# Push database changes (if any)
npm run db:push

# Restart application
pm2 restart vonix-network

# Check status
pm2 status
pm2 logs vonix-network --lines 50
```

---

## 📊 Monitoring Commands

```bash
# View app status
pm2 status

# View logs (live)
pm2 logs vonix-network

# View last 100 lines
pm2 logs vonix-network --lines 100

# Monitor CPU/Memory
pm2 monit

# Nginx logs
tail -f /var/log/nginx/vonix.network.access.log
tail -f /var/log/nginx/vonix.network.error.log

# Disk usage
df -h

# Memory usage
free -h

# Check processes
ps aux | grep node
```

---

## 🔐 Security Best Practices

### **1. Setup Firewall (UFW)**

```bash
# Install UFW
apt install -y ufw

# Allow SSH (IMPORTANT - do this first!)
ufw allow 22/tcp
ufw allow OpenSSH

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

### **2. Disable Root Login**

```bash
# Create non-root user
adduser vonix
usermod -aG sudo vonix

# Copy SSH keys to new user
rsync --archive --chown=vonix:vonix ~/.ssh /home/vonix

# Test SSH with new user (in new terminal)
ssh vonix@your-vps-ip

# If successful, disable root login
nano /etc/ssh/sshd_config
# Change: PermitRootLogin no
# Save and exit

# Restart SSH
systemctl restart sshd
```

### **3. Setup Fail2Ban**

```bash
# Install Fail2Ban
apt install -y fail2ban

# Start and enable
systemctl start fail2ban
systemctl enable fail2ban

# Check status
fail2ban-client status
```

---

## 🗄️ Database Backup

### **For Turso (Cloud):**
```bash
# Backups are automatic
# View backups in Turso dashboard
```

### **For Local SQLite:**

```bash
# Create backup script
nano /var/www/vonix-network/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/vonix-network"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
cp /var/www/vonix-network/data/vonix.db $BACKUP_DIR/vonix_$DATE.db
# Keep only last 7 days
find $BACKUP_DIR -name "vonix_*.db" -mtime +7 -delete
```

```bash
# Make executable
chmod +x /var/www/vonix-network/backup.sh

# Add to crontab (daily backup at 2am)
crontab -e
# Add line:
0 2 * * * /var/www/vonix-network/backup.sh
```

---

## 🆘 Troubleshooting

### **App Won't Start**

```bash
# Check logs
pm2 logs vonix-network --lines 100

# Check if port 3000 is in use
netstat -tulpn | grep 3000

# Check environment variables
pm2 env 0

# Restart with logs
pm2 restart vonix-network
pm2 logs vonix-network
```

### **502 Bad Gateway**

```bash
# Check if app is running
pm2 status

# Check Nginx logs
tail -f /var/log/nginx/vonix.network.error.log

# Restart app
pm2 restart vonix-network

# Restart Nginx
systemctl restart nginx
```

### **Webhook Not Working**

```bash
# Check if app is running
pm2 status

# Check webhook secret is set
cat .env.production | grep STRIPE_WEBHOOK_SECRET

# Check Nginx logs
tail -f /var/log/nginx/vonix.network.access.log | grep webhook

# Check app logs
pm2 logs vonix-network | grep webhook

# Verify in Stripe Dashboard
# Dashboard → Webhooks → View recent deliveries
```

### **Out of Memory**

```bash
# Check memory
free -h

# Add swap file (if needed)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# Reduce PM2 instances
nano ecosystem.config.js
# Change instances: 2 to instances: 1
pm2 restart vonix-network
```

---

## 📈 Performance Optimization

### **Enable Gzip in Nginx:**

```bash
nano /etc/nginx/nginx.conf
```

Add in `http` block:
```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
```

```bash
nginx -t
systemctl restart nginx
```

### **Enable HTTP/2:**

Already enabled if using Certbot SSL!

---

## ✅ VPS Deployment Checklist

**Server Setup:**
- [ ] Node.js 18+ installed
- [ ] PM2 installed and configured
- [ ] Nginx installed and configured
- [ ] SSL certificate installed (Certbot)
- [ ] Firewall configured (UFW)
- [ ] Fail2Ban installed

**Application:**
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Built successfully
- [ ] Running with PM2
- [ ] PM2 saves on reboot

**DNS & SSL:**
- [ ] A records pointing to VPS IP
- [ ] DNS propagated
- [ ] SSL certificate valid
- [ ] HTTPS working
- [ ] www redirect working

**Stripe:**
- [ ] Webhook configured
- [ ] Signing secret added
- [ ] Test payment successful
- [ ] Webhook delivers successfully

**Monitoring:**
- [ ] PM2 monitoring active
- [ ] Nginx logs accessible
- [ ] Backups configured
- [ ] Uptime monitoring (optional)

---

## 🎉 You're Live!

**Your site is now running at:**
- **Main:** https://vonix.network
- **WWW:** https://www.vonix.network (redirects to main)
- **Webhook:** https://vonix.network/api/stripe/webhook

**Useful commands:**
```bash
pm2 status              # Check app status
pm2 logs vonix-network  # View logs
pm2 restart vonix-network  # Restart app
systemctl status nginx  # Check Nginx
certbot renew          # Manually renew SSL
```

**Enjoy your self-hosted Vonix Network!** 🚀
