# Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Turso database account
- Stripe account
- Domain with SSL certificate
- VPS or hosting platform

## Environment Setup

Create `.env` file with:

```env
# Database (Turso)
DATABASE_URL=libsql://[your-db].turso.io
DATABASE_AUTH_TOKEN=your_auth_token

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Application
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production

# Email (optional)
EMAIL_FROM=noreply@yourdomain.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_user
SMTP_PASS=your_pass
```

## Database Setup

### 1. Create Turso Database
```bash
turso db create vonix-network
turso db show vonix-network
```

### 2. Run Migrations
```bash
npm run db:init
```

### 3. Verify Schema
```bash
turso db shell vonix-network
.tables
.schema users
```

## Stripe Configuration

### 1. Create Products
Option A - Auto Sync:
1. Deploy app
2. Login as admin
3. Go to `/admin/donor-ranks`
4. Click "Sync Stripe Products"

Option B - Manual:
1. Create products in Stripe Dashboard
2. Create 4 prices per product (monthly, quarterly, semi-annual, yearly)
3. Update database with product/price IDs

### 2. Configure Customer Portal
1. Go to Stripe Dashboard → Customer Portal
2. Enable: Invoice history, Payment methods, Cancel subscription
3. Set return URL: `https://yourdomain.com/settings/billing`

### 3. Setup Webhook
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.*`
   - `checkout.session.completed`
4. Copy webhook secret to `.env`

### 4. Enable Automatic Tax
1. Go to Stripe Dashboard → Tax
2. Enable automatic tax collection
3. Register tax IDs for your regions

## Application Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

### Option 2: VPS (Ubuntu)

```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone https://github.com/yourusername/vonix-network.git
cd vonix-network

# Install dependencies
npm install

# Build
npm run build

# Start with PM2
pm2 start npm --name "vonix-network" -- start
pm2 save
pm2 startup
```

### Option 3: Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
docker build -t vonix-network .
docker run -d -p 3000:3000 --env-file .env vonix-network
```

## Post-Deployment

### 1. Create Admin Account

```bash
# Via Turso CLI
turso db shell vonix-network

UPDATE users 
SET role = 'admin' 
WHERE username = 'your_username';
```

### 2. Test Payment Flow

1. Visit `/donations/subscribe`
2. Select a rank
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. Verify:
   - Rank assigned
   - Receipt generated
   - Email sent (if configured)
   - Webhook processed

### 3. Configure SSL

**Nginx:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Certbot (Let's Encrypt):**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 4. Setup Monitoring

```bash
# PM2 monitoring
pm2 monit

# Check logs
pm2 logs vonix-network

# Setup error notifications
pm2 install pm2-logrotate
```

### 5. Configure Backups

```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
turso db shell vonix-network ".dump" > backup_$DATE.sql
# Upload to S3/backup storage
```

## Maintenance

### Update Application

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Rebuild
npm run build

# Restart
pm2 restart vonix-network
```

### Database Migrations

```bash
# Run new migrations
npm run db:init

# Verify
turso db shell vonix-network
```

### Monitor Stripe

- Check Stripe Dashboard daily
- Review webhook logs
- Monitor failed payments
- Check for disputes

## Troubleshooting

### App won't start
- Check `.env` file exists
- Verify all required env vars set
- Check port 3000 not in use
- Review error logs

### Database connection fails
- Verify DATABASE_URL format
- Check auth token is correct
- Test connection: `turso db shell`
- Check network connectivity

### Stripe webhooks fail
- Verify webhook URL accessible
- Check webhook secret matches
- Review Stripe Dashboard logs
- Test endpoint manually

### Rank not assigned
- Check webhook fired in Stripe
- Review API logs
- Verify metadata in checkout session
- Check database for user

## Security Checklist

- [ ] All API keys in environment variables
- [ ] SSL/TLS enabled (HTTPS)
- [ ] Database auth token secure
- [ ] Webhook signature verification enabled
- [ ] Admin routes protected by RBAC
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers set
- [ ] Regular dependency updates
- [ ] Monitoring enabled

## Performance Optimization

### 1. Enable Caching
```typescript
// In API routes
export const revalidate = 300; // 5 minutes
```

### 2. Optimize Images
```bash
npm install sharp
```

### 3. Enable Compression
```bash
npm install compression
```

### 4. Database Indexes
```sql
CREATE INDEX idx_users_stripe_customer 
ON users(stripe_customer_id);

CREATE INDEX idx_donations_user 
ON donations(user_id);
```

### 5. CDN Setup
- Use Vercel Edge Network
- Or configure CloudFlare

## Monitoring & Alerts

**Setup:**
1. Sentry for error tracking
2. Uptime monitoring (UptimeRobot)
3. Stripe webhooks monitoring
4. Database performance monitoring

**Key Metrics:**
- Response times
- Error rates
- Payment success rate
- Webhook processing time
- Database query performance

## Backup Strategy

**Daily:**
- Database full backup
- Upload to cloud storage
- Verify backup integrity

**Weekly:**
- Test restore procedure
- Review backup logs
- Clean old backups

**Monthly:**
- Full system snapshot
- Disaster recovery test
- Update recovery documentation

## Scaling Considerations

**Database:**
- Turso automatically scales
- Monitor query performance
- Add indexes as needed

**Application:**
- Horizontal scaling with load balancer
- Redis for session storage
- Separate worker processes for webhooks

**Storage:**
- Move uploads to S3/CloudFlare R2
- CDN for static assets
- Image optimization service

## Support

**Issues:**
- Check logs first
- Review Stripe Dashboard
- Test in development
- Search documentation

**Contact:**
- Stripe Support: https://support.stripe.com/
- Turso Support: https://docs.turso.tech/
- Community Discord: [your-discord-link]
