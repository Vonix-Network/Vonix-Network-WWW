# ⚡ Server Status Performance Optimizations

## Problem
Homepage was taking too long to show server status after page load.

---

## What Was Changed

### 1. **Reduced API Timeouts**
**Before**: 5 seconds per provider = 10s total per server  
**After**: 2.5 seconds per provider with 3s overall timeout

```typescript
// Each provider now times out at 2.5s
signal: AbortSignal.timeout(2500)

// Overall operation times out at 3s
Promise.race([...checks, timeout(3000)])
```

### 2. **Instant Initial Display**
**Before**: Page loads → Wait for API → Show status  
**After**: Page loads → Show DB data → Update after 1s

```typescript
// Homepage shows database values immediately (SSR)
// Then updates with live data 1 second after page loads
setTimeout(() => fetchServers(), 1000);
```

### 3. **Aggressive Caching**
```typescript
// API response cached for 15 seconds
'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=45'
```

---

## Performance Improvements

### Before
- **Initial load**: 10-15 seconds to show status
- **Per-server check**: Up to 10 seconds (5s × 2 providers)
- **Total with 3 servers**: 30+ seconds worst case

### After
- **Initial load**: Instant (shows DB data)
- **Per-server check**: Max 3 seconds
- **Total with 3 servers**: ~3 seconds (concurrent)
- **Background update**: Happens 1s after page loads

---

## How It Works Now

### Timeline
```
0ms:    Page loads
0ms:    Homepage shows database server status (from SSR)
        ↓ User sees servers immediately ✅
1000ms: Background fetch starts
1000ms: Dual-provider checks run (2.5s timeout each, 3s overall)
        ↓ Both APIs queried simultaneously
3000ms: Live status updates shown (at worst)
        ↓ User sees updated player counts
```

### Fallback Chain
1. **SSR data** (instant) → Shows database values
2. **Live API** (1-3s) → Updates with real-time data
3. **Cached API** (15s) → Serves cached if available
4. **Stale cache** (45s) → Serves stale while revalidating

---

## Current Timeouts

| Operation | Timeout | Why |
|-----------|---------|-----|
| mcstatus.io | 2.5s | Fast enough for most servers |
| mcsrvstat.us | 2.5s | Same as primary |
| Overall per server | 3s | Prevents hanging on slow servers |
| API cache | 15s | Balance freshness vs load |
| Client refresh | 60s | Auto-update without annoying users |

---

## If Still Slow

### Check Your Servers
Some servers respond slowly to status queries:

```bash
# Test response time
time curl "https://api.mcstatus.io/v2/status/java/YOUR_IP"
```

**If >2 seconds**: Your server is slow to respond. Options:
1. Increase timeout (not recommended)
2. Use database values only (disable live checks)
3. Fix server performance

### Increase Timeouts (If Needed)

Edit `src/app/api/servers/route.ts`:

```typescript
// Per-provider timeout
signal: AbortSignal.timeout(5000)  // 5 seconds

// Overall timeout
setTimeout(() => resolve(null), 5000)  // 5 seconds
```

### Disable Dual-Provider (Faster but Less Accurate)

Use only one provider:

```typescript
async function fetchBestStatus(ipAddress: string, port: number) {
  // Only use mcstatus.io (faster)
  return await fetchFromMcstatus(ipAddress, port);
}
```

### Use Database Only (Instant but Outdated)

Disable live checks entirely:

```typescript
// In src/app/page.tsx
<LiveServerStatus 
  initialServers={allServers}
  autoRefresh={false}  // No live updates
/>
```

Then rely on cron job to update database.

---

## Monitoring

### Check API Response Time

```bash
# Time the API call
time curl "http://localhost:3000/api/servers"

# Should be under 3 seconds for good UX
```

### Check Console Logs

Look for timeout messages:
```
[Reconcile] play.example.com:25565 - Overall timeout (3s)
```

If you see many timeouts, your servers are slow to respond.

---

## Recommended Settings

### For Fast Servers (<1s response)
```typescript
// src/app/api/servers/route.ts
signal: AbortSignal.timeout(2000)  // 2s
setTimeout(() => resolve(null), 2500)  // 2.5s overall

// src/app/page.tsx
refreshInterval={30000}  // Refresh every 30s
```

### For Slow Servers (>2s response)
```typescript
// src/app/api/servers/route.ts
signal: AbortSignal.timeout(4000)  // 4s
setTimeout(() => resolve(null), 5000)  // 5s overall

// src/app/page.tsx
refreshInterval={90000}  // Refresh every 90s
```

### For Unreliable Servers
```typescript
// Disable live checks, use cron only
<LiveServerStatus autoRefresh={false} />

// Rely on cron job every 5 minutes
```

---

## Best Practices

1. ✅ **Always show DB data first** (instant UX)
2. ✅ **Update in background** (don't block page load)
3. ✅ **Use aggressive timeouts** (fail fast)
4. ✅ **Cache aggressively** (reduce API load)
5. ✅ **Concurrent checks** (don't wait sequentially)

---

## Current Status

✅ **Instant page load** (shows DB data)  
✅ **Background updates** (1s after mount)  
✅ **Fast timeouts** (2.5s per provider, 3s overall)  
✅ **Concurrent checks** (all servers at once)  
✅ **Aggressive caching** (15s fresh, 45s stale)  

**Result**: Homepage shows server status instantly, updates within 1-3 seconds! ⚡
