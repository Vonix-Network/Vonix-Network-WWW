# 🔧 Server Status Integration - Setup Guide

Complete guide for setting up live server status with automatic updates.

---

## Overview

This system provides:
- ✅ **Real-time status** on homepage (auto-refresh every 60s)
- ✅ **Background updates** to database (every 5 minutes via cron)
- ✅ **Public API** for server status
- ✅ **Admin API** for manual updates
- ✅ **Graceful fallbacks** on failures

---

## 📁 Files Created

### API Endpoints
1. `src/app/api/servers/route.ts` - Public real-time status
2. `src/app/api/cron/update-servers/route.ts` - Background updater

### Components
1. `src/components/home/live-server-status.tsx` - Live status display
2. `src/components/home/server-status-carousel.tsx` - Carousel UI

### Configuration
1. `vercel.json` - Cron job configuration

### Documentation
1. `docs/LIVE_SERVER_STATUS.md` - Integration details
2. `docs/SERVER_STATUS_CAROUSEL.md` - Carousel documentation
3. `docs/SERVER_STATUS_SETUP.md` - This file

---

## 🚀 Deployment Steps

### 1. Environment Variables

Add to your Vercel project or `.env.local`:

```bash
# Optional: Secure your cron endpoint
CRON_SECRET=your-random-secret-key-here

# Generate a secure random string:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Why?** Prevents unauthorized access to the cron endpoint.

### 2. Deploy to Vercel

```bash
# Commit changes
git add .
git commit -m "Add live server status integration"
git push

# Vercel will automatically deploy
```

### 3. Verify Cron Job

**In Vercel Dashboard:**
1. Go to your project
2. Click "Settings" → "Crons"
3. Verify `/api/cron/update-servers` appears
4. Schedule: `*/5 * * * *` (every 5 minutes)

**Manual Test:**
```bash
# Test the cron endpoint
curl https://vonix.network/api/cron/update-servers \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Should return:
{
  "success": true,
  "duration": "1234ms",
  "servers": 3,
  "updated": 3,
  "failed": 0,
  "results": [...]
}
```

### 4. Test Public API

```bash
# Should return live server data
curl https://vonix.network/api/servers

# Response:
[
  {
    "id": 1,
    "name": "Survival Server",
    "status": "online",
    "playersOnline": 45,
    "playersMax": 100,
    ...
  }
]
```

### 5. Verify Homepage

1. Visit `https://vonix.network`
2. Scroll to "Everything You Need" section
3. Verify server status card appears
4. Check player counts update
5. Wait 60 seconds, verify auto-refresh

---

## ⚙️ Configuration Options

### Adjust Refresh Intervals

#### **Homepage Auto-Refresh**
File: `src/app/page.tsx`
```tsx
<LiveServerStatus 
  refreshInterval={30000}  // 30 seconds
/>
```

#### **Cron Job Schedule**
File: `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/update-servers",
      "schedule": "*/2 * * * *"  // Every 2 minutes
    }
  ]
}
```

**Cron Syntax**:
- `*/5 * * * *` - Every 5 minutes
- `0 * * * *` - Every hour
- `0 */6 * * *` - Every 6 hours
- `0 0 * * *` - Daily at midnight

#### **API Timeout**
File: `src/app/api/servers/route.ts`
```typescript
signal: AbortSignal.timeout(10000)  // 10 seconds
```

#### **Cache Duration**
File: `src/app/api/servers/route.ts`
```typescript
'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
```

---

## 🔒 Security

### Cron Secret (Recommended)

**1. Generate Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**2. Add to Vercel:**
- Dashboard → Settings → Environment Variables
- Name: `CRON_SECRET`
- Value: Your generated secret

**3. Configure Vercel Cron:**
Vercel automatically adds the `Authorization` header to cron requests.

**4. Test Authorization:**
```bash
# Without secret - should fail
curl https://vonix.network/api/cron/update-servers
# → {"error": "Unauthorized"}

# With secret - should succeed
curl https://vonix.network/api/cron/update-servers \
  -H "Authorization: Bearer YOUR_SECRET"
# → {"success": true, ...}
```

### Rate Limiting

The public `/api/servers` endpoint is cached for 30 seconds, limiting the impact of rapid requests.

---

## 📊 Monitoring

### View Logs

**Vercel Dashboard:**
1. Functions → Logs
2. Filter by `/api/cron/update-servers`
3. Look for error messages

**Console Logs:**
```
Starting server status update...
Found 3 servers to check
Server status update completed in 1234ms
Success: 3, Failed: 0
```

### Check Status History

Query your database to see status changes:
```sql
SELECT name, status, playersOnline, updatedAt 
FROM servers 
ORDER BY updatedAt DESC;
```

### Monitor Uptime

Use a service like **UptimeRobot** or **Better Uptime**:
- Monitor: `https://vonix.network/api/servers`
- Check interval: 5 minutes
- Alert on: 500 errors or timeouts

---

## 🐛 Troubleshooting

### Issue: Servers Always Show Offline

**Possible Causes:**
1. mcstatus.io API is down
2. Firewall blocking requests
3. Server IP/port incorrect
4. Timeout too short

**Solutions:**
```bash
# Test mcstatus.io manually
curl https://api.mcstatus.io/v2/status/java/play.vonix.network

# Check database values
SELECT ipAddress, port FROM servers;

# Increase timeout in route.ts
signal: AbortSignal.timeout(15000)  // 15 seconds
```

### Issue: Cron Job Not Running

**Check:**
1. `vercel.json` is committed and deployed
2. Cron appears in Vercel dashboard
3. Project is on Pro plan (crons require Pro)
4. Check function logs for errors

**Manual Trigger:**
```bash
curl -X POST https://vonix.network/api/cron/update-servers \
  -H "Authorization: Bearer YOUR_SECRET"
```

### Issue: Homepage Not Updating

**Check:**
1. Browser console for errors
2. Network tab for failed `/api/servers` requests
3. Component is mounted (not SSR only)
4. Auto-refresh is enabled

**Debug:**
```tsx
// Add console logs in live-server-status.tsx
useEffect(() => {
  console.log('Setting up auto-refresh:', refreshInterval);
  // ...
}, []);
```

### Issue: Slow Response Times

**Optimize:**
1. Reduce number of servers checked
2. Increase cache duration (60s → 120s)
3. Use CDN caching
4. Implement server-side cache (Redis)

---

## 🎯 Best Practices

### 1. Cache Appropriately
- Homepage: 30-60 second cache
- Database updates: Every 5 minutes
- Balance freshness vs. load

### 2. Handle Failures Gracefully
- Show last known status on API failure
- Don't block UI on slow responses
- Log errors for monitoring

### 3. Optimize Concurrent Requests
```typescript
// Good: Check all servers concurrently
await Promise.all(servers.map(checkStatus));

// Bad: Check servers sequentially
for (const server of servers) {
  await checkStatus(server);
}
```

### 4. Set Reasonable Timeouts
- mcstatus.io: 5-8 seconds
- Total request: 10-15 seconds
- Cron job: No timeout (handles each server individually)

### 5. Monitor Performance
- Track API response times
- Alert on repeated failures
- Log successful vs. failed checks

---

## 📈 Future Enhancements

### WebSocket Integration
Real-time updates without polling:
```typescript
// Broadcast status changes via WebSocket
io.emit('server-status', {
  serverId: 1,
  status: 'online',
  players: 45
});
```

### Historical Data
Track uptime and player trends:
```sql
CREATE TABLE server_status_history (
  id INTEGER PRIMARY KEY,
  serverId INTEGER,
  status TEXT,
  playersOnline INTEGER,
  checkedAt TIMESTAMP
);
```

### Advanced Features
- Player list with avatars
- Server MOTD display
- Regional latency checks
- Plugin/mod list
- Server performance metrics (TPS)

---

## 🧪 Testing Checklist

### Before Deployment
- [ ] Test `/api/servers` endpoint
- [ ] Test `/api/cron/update-servers` endpoint
- [ ] Verify cron secret works
- [ ] Check timeout handling
- [ ] Test with offline server

### After Deployment
- [ ] Homepage loads with server status
- [ ] Auto-refresh works after 60s
- [ ] Cron job runs every 5 minutes
- [ ] Database status updates
- [ ] Logs show no errors
- [ ] Mobile display works
- [ ] Loading states appear correctly

### Edge Cases
- [ ] All servers offline
- [ ] mcstatus.io API down
- [ ] Slow network (3G simulation)
- [ ] Browser tab inactive for >5 minutes
- [ ] Multiple tabs open simultaneously

---

## 📞 Support

### Getting Help
- Check Vercel function logs
- Review mcstatus.io documentation
- Test endpoints manually with curl
- Check browser console for errors

### Common mcstatus.io Issues
- API limits: Very generous, unlikely to hit
- Rate limiting: No authentication required
- Downtime: Rare, check status page
- Timeouts: Use 5-8 second timeouts

---

## ✅ Success Criteria

Your integration is working correctly when:

1. ✅ Homepage shows live server status
2. ✅ Player counts are accurate
3. ✅ Status updates automatically
4. ✅ Cron job runs without errors
5. ✅ Database reflects current status
6. ✅ API responds within 2 seconds
7. ✅ Loading states appear smoothly
8. ✅ No console errors
9. ✅ Mobile experience is good
10. ✅ Offline servers handled gracefully

---

## 🎉 You're All Set!

Your Vonix Network now has:
- 🔴 **Live server status** on homepage
- ⏱️ **Auto-refresh** every 60 seconds
- 🤖 **Background updates** every 5 minutes
- 📊 **Real-time player counts**
- 🎨 **Beautiful UI** with animations
- 🛡️ **Secure** cron endpoints
- 📱 **Mobile responsive**

Visit your homepage and watch the server status update in real-time! 🚀
