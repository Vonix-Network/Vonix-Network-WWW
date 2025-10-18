# Deployment Guide

## Overview

This guide covers deploying Vonix Network to various platforms and environments. The application is designed to be deployment-ready with Docker support and cloud-native architecture.

## Prerequisites

- Node.js 18+ (for local development)
- Docker and Docker Compose (for containerized deployment)
- Turso account and database
- Domain name (for production)
- SSL certificate (for HTTPS)

## Environment Setup

### 1. Environment Variables

Create a `.env.local` file (or `.env` for production) with the following variables:

```bash
# Copy the example file
cp env.example .env.local
```

Required variables:
```env
# Database
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token

# Authentication
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-domain.com

# Discord
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_BOT_TOKEN=your-discord-bot-token
```

### 2. Database Setup

#### Turso Database

1. Create a Turso account at [turso.tech](https://turso.tech)
2. Create a new database:
   ```bash
   turso db create vonix-network
   ```
3. Get your database URL and auth token:
   ```bash
   turso db show vonix-network
   ```

#### Initialize Schema

```bash
# Push schema to database
npm run db:push

# Run migrations
npm run db:migrate-all
```

## Deployment Options

### 1. Docker Deployment

#### Using Docker Compose

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Docker Compose Configuration

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - TURSO_DATABASE_URL=${TURSO_DATABASE_URL}
      - TURSO_AUTH_TOKEN=${TURSO_AUTH_TOKEN}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
```

#### Manual Docker Build

```bash
# Build image
docker build -t vonix-network .

# Run container
docker run -d \
  --name vonix-network \
  -p 3000:3000 \
  --env-file .env \
  vonix-network
```

### 2. Kubernetes Deployment

#### Prerequisites

- Kubernetes cluster
- kubectl configured
- Helm (optional)

#### Deploy with kubectl

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Deploy application
kubectl apply -f k8s/

# Check deployment
kubectl get pods -n vonix-network
```

#### Kubernetes Manifests

The `k8s/` directory contains:
- `namespace.yaml` - Namespace definition
- `configmap.yaml` - Configuration
- `secrets.yaml` - Secret management
- `app-deployment.yaml` - Application deployment
- `discord-bot-deployment.yaml` - Discord bot deployment
- `redis-deployment.yaml` - Redis deployment
- `ingress.yaml` - Ingress configuration
- `hpa.yaml` - Horizontal Pod Autoscaler

#### Deploy with Helm

```bash
# Create Helm chart
helm create vonix-network

# Install with values
helm install vonix-network ./vonix-network \
  --set image.tag=latest \
  --set ingress.hosts[0].host=your-domain.com
```

### 3. Vercel Deployment

#### Prerequisites

- Vercel account
- GitHub repository
- Environment variables configured

#### Deploy Steps

1. **Connect Repository**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure build settings

2. **Environment Variables**:
   ```bash
   # Add in Vercel dashboard
   TURSO_DATABASE_URL=libsql://your-database.turso.io
   TURSO_AUTH_TOKEN=your-token
   NEXTAUTH_SECRET=your-secret
   NEXTAUTH_URL=https://your-app.vercel.app
   ```

3. **Build Configuration**:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": ".next",
     "installCommand": "npm install"
   }
   ```

4. **Deploy**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel --prod
   ```

### 4. Railway Deployment

#### Prerequisites

- Railway account
- GitHub repository
- Environment variables

#### Deploy Steps

1. **Connect Repository**:
   - Go to [railway.app](https://railway.app)
   - Connect GitHub repository
   - Select the project

2. **Configure Environment**:
   ```bash
   # Add environment variables in Railway dashboard
   NODE_ENV=production
   TURSO_DATABASE_URL=libsql://your-database.turso.io
   TURSO_AUTH_TOKEN=your-token
   NEXTAUTH_SECRET=your-secret
   NEXTAUTH_URL=https://your-app.railway.app
   ```

3. **Deploy**:
   - Railway automatically detects Next.js
   - Builds and deploys automatically
   - Provides HTTPS and custom domains

### 5. DigitalOcean App Platform

#### Prerequisites

- DigitalOcean account
- GitHub repository
- Environment variables

#### Deploy Steps

1. **Create App**:
   - Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
   - Create new app from GitHub

2. **Configure App Spec**:
   ```yaml
   name: vonix-network
   services:
   - name: web
     source_dir: /
     github:
       repo: yourusername/vonix-network
       branch: main
     run_command: npm start
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: NODE_ENV
       value: production
     - key: TURSO_DATABASE_URL
       value: libsql://your-database.turso.io
     - key: TURSO_AUTH_TOKEN
       value: your-token
     - key: NEXTAUTH_SECRET
       value: your-secret
     - key: NEXTAUTH_URL
       value: https://your-app.ondigitalocean.app
   ```

3. **Deploy**:
   - Save and deploy
   - App Platform handles the rest

### 6. AWS Deployment

#### Using AWS Amplify

1. **Connect Repository**:
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
   - Connect GitHub repository

2. **Build Settings**:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

3. **Environment Variables**:
   - Add in Amplify console
   - Configure build-time variables

#### Using AWS ECS

1. **Create ECS Cluster**:
   ```bash
   aws ecs create-cluster --cluster-name vonix-network
   ```

2. **Create Task Definition**:
   ```json
   {
     "family": "vonix-network",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "256",
     "memory": "512",
     "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
     "containerDefinitions": [
       {
         "name": "vonix-network",
         "image": "your-account.dkr.ecr.region.amazonaws.com/vonix-network:latest",
         "portMappings": [
           {
             "containerPort": 3000,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "NODE_ENV",
             "value": "production"
           }
         ],
         "secrets": [
           {
             "name": "TURSO_DATABASE_URL",
             "valueFrom": "arn:aws:ssm:region:account:parameter/vonix-network/database-url"
           }
         ]
       }
     ]
   }
   ```

3. **Deploy Service**:
   ```bash
   aws ecs create-service \
     --cluster vonix-network \
     --service-name vonix-network-service \
     --task-definition vonix-network:1 \
     --desired-count 1 \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}"
   ```

## Production Configuration

### 1. SSL/TLS Setup

#### Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Cloudflare SSL

1. Add domain to Cloudflare
2. Enable SSL/TLS encryption
3. Set SSL mode to "Full (strict)"
4. Enable "Always Use HTTPS"

### 2. Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

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

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### 3. Process Management

#### PM2

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'vonix-network',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/vonix-network',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Systemd Service

```ini
[Unit]
Description=Vonix Network
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/vonix-network
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

```bash
# Install service
sudo systemctl enable vonix-network
sudo systemctl start vonix-network
```

### 4. Monitoring and Logging

#### Application Monitoring

```bash
# Install monitoring tools
npm install -g clinic
npm install -g 0x

# Performance analysis
clinic doctor -- node server.js
clinic flame -- node server.js
```

#### Log Management

```bash
# Configure log rotation
sudo nano /etc/logrotate.d/vonix-network

# Add:
/path/to/vonix-network/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
```

#### Health Checks

```bash
# Create health check script
cat > health-check.sh << EOF
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ $response -eq 200 ]; then
    echo "Health check passed"
    exit 0
else
    echo "Health check failed: $response"
    exit 1
fi
EOF

chmod +x health-check.sh

# Add to crontab
crontab -e
# Add: */5 * * * * /path/to/health-check.sh
```

## Scaling

### Horizontal Scaling

#### Load Balancer Configuration

```nginx
upstream vonix_network {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://vonix_network;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### Kubernetes HPA

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: vonix-network-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: vonix-network
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Database Scaling

#### Read Replicas

```bash
# Create read replica
turso db create vonix-network-read --replica-of vonix-network
```

#### Connection Pooling

```typescript
// Configure connection pool
const db = drizzle(libsql({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
  syncUrl: process.env.TURSO_SYNC_URL,
  syncInterval: 1000, // 1 second
  maxConnections: 10
}));
```

## Backup and Recovery

### Database Backup

```bash
# Create backup script
cat > backup.sh << EOF
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/vonix-network"
mkdir -p $BACKUP_DIR

# Backup database
turso db dump vonix-network > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
EOF

chmod +x backup.sh

# Schedule backup
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

### Application Backup

```bash
# Backup application files
tar -czf /backups/vonix-network-app-$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  /path/to/vonix-network
```

## Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check database connectivity
turso db show vonix-network

# Test connection
node -e "
const { createClient } = require('@libsql/client');
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});
client.execute('SELECT 1').then(() => console.log('Connected')).catch(console.error);
"
```

#### Memory Issues

```bash
# Monitor memory usage
pm2 monit

# Restart if memory usage is high
pm2 restart vonix-network --max-memory-restart 500M
```

#### SSL Certificate Issues

```bash
# Check certificate
openssl x509 -in /etc/nginx/ssl/cert.pem -text -noout

# Renew certificate
sudo certbot renew --dry-run
```

### Performance Optimization

#### Enable Compression

```javascript
// next.config.js
const nextConfig = {
  compress: true,
  // ... other config
};
```

#### Optimize Images

```javascript
// next.config.js
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  // ... other config
};
```

#### Enable Caching

```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=60',
          },
        ],
      },
    ];
  },
  // ... other config
};
```

## Security Checklist

- [ ] SSL/TLS certificate installed and configured
- [ ] Security headers configured
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] API rate limiting enabled
- [ ] Input validation implemented
- [ ] Error handling configured
- [ ] Logging and monitoring enabled
- [ ] Backup strategy implemented
- [ ] Firewall configured
- [ ] Regular security updates scheduled

---

This deployment guide provides comprehensive instructions for deploying Vonix Network in various environments. Choose the deployment method that best fits your infrastructure and requirements.

