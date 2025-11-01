# Environment Setup for Rank Subscriptions

## Required Configuration

Add these to your `.env` file:

```bash
# Square Payments (for processing one-time purchases)
SQUARE_INTEGRATION_ENABLED=true
SQUARE_ACCESS_TOKEN=your-access-token
SQUARE_LOCATION_ID=your-location-id
SQUARE_APPLICATION_ID=your-app-id
SQUARE_ENVIRONMENT=sandbox  # or 'production'

# Cron job security
CRON_SECRET=your-random-secret-here
```

## How to Get Square Credentials

1. Go to https://developer.squareup.com/apps
2. Create or select your application
3. Get credentials from:
   - **Access Token**: Credentials → Production/Sandbox Access Token
   - **Application ID**: Credentials → Application ID
   - **Location ID**: Locations → Select location → Location ID

## Important Notes

### You DON'T Need:
- ❌ Square Subscriptions API
- ❌ Catalog API setup
- ❌ Subscription plans in Square

### You ONLY Need:
- ✅ Square Payments API (one-time charges)
- ✅ Application ID (for Web SDK)
- ✅ Access Token (for payment processing)

## Testing Without Square

If you want to test the subscription system without Square payments:

1. Comment out the payment integration in the subscribe page
2. Manually call the subscription API:

```bash
curl -X POST http://localhost:3000/api/subscriptions/purchase \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "rankId": "supporter",
    "days": 30,
    "amount": 5.00,
    "paymentId": "test-payment"
  }'
```

This will assign the rank without processing payment (useful for testing).

## Quick Test

Run this to verify Square is configured:

```bash
npm run dev
```

Then visit: http://localhost:3000/api/square/status

You should see:
```json
{
  "enabled": true,
  "configured": true,
  "environment": "sandbox"
}
```

## Troubleshooting

### Error: "Subscriptions Not Available"

This means the old Square subscription API check is running. The rank subscription system doesn't use this - it's a false positive.

**Fix:** The subscription system is independent and doesn't need Square's subscription API.

### Square Not Enabled

If you see `enabled: false`, check:
1. Is `SQUARE_INTEGRATION_ENABLED=true` in .env?
2. Are all three credentials set? (access token, location ID, app ID)
3. Did you restart the dev server after changing .env?

## Generate CRON_SECRET

```bash
# On Windows (PowerShell)
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString()))

# Or use online generator:
# https://www.random.org/strings/
```

## Environment Variables Checklist

- [ ] SQUARE_INTEGRATION_ENABLED=true
- [ ] SQUARE_ACCESS_TOKEN (from Square Dashboard)
- [ ] SQUARE_LOCATION_ID (from Square Dashboard)
- [ ] SQUARE_APPLICATION_ID (from Square Dashboard)
- [ ] SQUARE_ENVIRONMENT=sandbox (or production)
- [ ] CRON_SECRET (any random string)
- [ ] NEXTAUTH_SECRET (already configured)
- [ ] DATABASE_URL (already configured)
