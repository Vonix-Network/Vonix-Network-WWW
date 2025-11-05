# 🔴 Live Server Status Integration

Real-time Minecraft server status with auto-refresh on homepage.

---

## Overview

The homepage now displays **live server status** with automatic updates every 60 seconds. Status is fetched from `mcstatus.io` API and reflects actual server availability and player counts.

---

## Architecture

### API Layer

#### **Public Endpoint**: `/api/servers`
**File**: `src/app/api/servers/route.ts`

**Features**:
- Fetches all servers from database
- Queries mcstatus.io for real-time status
- Returns updated player counts, online status, version
- 30-second cache with stale-while-revalidate
- 5-second timeout per server check
- Concurrent status checks for all servers

**Response Format**:
```json
[
  {
    "id": 1,
    "name": "Survival Server",
    "description": "Classic survival experience",
    "ipAddress": "play.vonix.network",
    "port": 25565,
    "status": "online",
    "playersOnline": 45,
    "playersMax": 100,
    "version": "1.20.4",
    "modpackName": "Vanilla+"
  }
]
```

**Cache Headers**:
- `Cache-Control: public, s-maxage=30, stale-while-revalidate=60`
- 30-second fresh cache
- 60-second stale cache during revalidation

---

### Component Layer

#### **LiveServerStatus** (Client Component)
**File**: `src/components/home/live-server-status.tsx`

**Features**:
- ✅ Auto-refresh every 60 seconds
- ✅ Manual refresh on tab visibility change
- ✅ Loading indicator during updates
- ✅ Last updated timestamp
- ✅ Fallback to initial data if fetch fails
- ✅ Graceful error handling

**Props**:
```typescript
interface LiveServerStatusProps {
  initialServers: Server[];     // SSR data
  autoRefresh?: boolean;         // Enable auto-refresh (default: true)
  refreshInterval?: number;      // Milliseconds (default: 60000)
}
```

**Usage**:
```tsx
<LiveServerStatus 
  initialServers={allServers}
  autoRefresh={true}
  refreshInterval={60000}
/>
```

#### **LiveServerStatusSkeleton** (Loading State)
Shows animated skeleton during SSR or initial load.

---

## Data Flow

```
1. SSR (Server-Side Rendering)
   ↓
   Database → Initial server data → Page renders

2. Client Hydration
   ↓
   Component mounts → Sets up auto-refresh interval

3. Auto-Refresh (Every 60s)
   ↓
   Fetch /api/servers → mcstatus.io API → Update UI

4. Tab Visibility Change
   ↓
   If >30s since last update → Fetch new data
```

---

## Real-Time Status Sources

### **mcstatus.io API**
- Endpoint: `https://api.mcstatus.io/v2/status/java/{server}`
- Provides: Online status, player count, version, MOTD
- Response time: ~500ms average
- Rate limit: Generous (no auth required)

### **Data Retrieved**:
- `online` - Boolean server availability
- `players.online` - Current player count
- `players.max` - Maximum players
- `version.name_clean` - Minecraft version (e.g., "1.20.4")

---

## Update Behaviors

### Auto-Refresh (60s interval)
- Runs in background
- Shows spinner during fetch
- Updates timestamp on success
- Silent failure (keeps old data)

### Visibility Change
- Detects when user returns to tab
- Checks time since last update
- Refreshes if >30 seconds old
- Prevents stale data on long-idle tabs

### Manual Refresh
- Currently automatic only
- Could add manual refresh button if needed

---

## Performance Optimizations

### Server-Side
- Concurrent status checks (Promise.all)
- 5-second timeout per server
- 30-second response cache
- Stale-while-revalidate pattern

### Client-Side
- Initial data from SSR (no loading screen)
- Fetch only on timer/visibility
- Keep old data on error
- Cleanup intervals on unmount

### Caching Strategy
```
Fresh: 30s    →  Serve from cache
Stale: 60s    →  Serve stale + revalidate
Expired: >90s →  Fresh fetch required
```

---

## Error Handling

### API Failures
- Returns database values if mcstatus.io fails
- Individual server failures don't block others
- Console logs errors (not exposed to user)

### Client Failures
- Keeps displaying last successful data
- Silent error handling (no toast notifications)
- Continues auto-refresh after errors

### Timeout Handling
- 5-second timeout per server check
- Marks server as offline on timeout
- Doesn't block other server checks

---

## UI Features

### Loading States
- Skeleton during SSR
- Small spinner during background refresh
- "Updating..." text with spinning icon
- Non-blocking (carousel still interactive)

### Status Indicators
- **Online**: Pulsing green dot
- **Offline**: Static red dot
- **Loading**: Gray dot (during check)

### Information Display
- Player count (45/100)
- Server version (1.20.4)
- Modpack name (if applicable)
- Server IP (with port)
- Last updated timestamp

### Visual Feedback
- Smooth transitions between updates
- Animated loading indicator
- Timestamp updates on each refresh

---

## Configuration

### Refresh Interval
Change in `src/app/page.tsx`:
```tsx
<LiveServerStatus 
  refreshInterval={30000}  // 30 seconds
/>
```

### Disable Auto-Refresh
```tsx
<LiveServerStatus 
  autoRefresh={false}  // Manual only
/>
```

### API Timeout
Change in `src/app/api/servers/route.ts`:
```typescript
signal: AbortSignal.timeout(10000)  // 10 seconds
```

### Cache Duration
Change in `src/app/api/servers/route.ts`:
```typescript
'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
```

---

## Database Integration

### Server Status Updates
The `/api/servers/update` endpoint can be called to persist status to database:

```bash
curl -X POST https://vonix.network/api/servers/update
```

This is useful for:
- Scheduled cron jobs
- Admin dashboard manual refresh
- Historical tracking
- Server list page (persistent data)

### Homepage Behavior
- **Does NOT** persist to database
- Fetches live every time
- Shows real-time data only
- Database used for initial SSR only

---

## Monitoring & Debugging

### Console Logs
```javascript
// API errors
"Error fetching status for play.vonix.network: ..."

// Client errors  
"Failed to fetch server status: ..."
```

### Network Tab
- Check `/api/servers` requests
- Response time should be <2s
- Look for 503 errors (server unreachable)

### Component State
```javascript
// Last update time
console.log(lastUpdate.toLocaleTimeString());

// Current server data
console.log(servers);
```

---

## Future Enhancements

### Possible Additions
- [ ] WebSocket for instant updates
- [ ] Player list with Minecraft heads
- [ ] Server MOTD display
- [ ] Historical uptime graphs
- [ ] Performance metrics (ping/TPS)
- [ ] Manual refresh button
- [ ] Status change notifications
- [ ] Server comparison view

### Advanced Features
- [ ] Multiple region checks (latency)
- [ ] Mod/plugin list display
- [ ] Server icon from status
- [ ] Query player usernames
- [ ] Show server software (Paper, Fabric, etc.)

---

## Testing

### Manual Tests
1. Visit homepage → Check initial load
2. Wait 60 seconds → Verify auto-refresh
3. Switch tabs → Return after 30s → Check refresh
4. Disable network → Verify graceful degradation
5. Slow 3G → Check timeout handling

### API Tests
```bash
# Test endpoint directly
curl https://vonix.network/api/servers

# Check response time
time curl https://vonix.network/api/servers

# Test with offline server
# Should still return data with status: "offline"
```

---

## Production Checklist

- ✅ API endpoint deployed and accessible
- ✅ mcstatus.io API reachable from server
- ✅ Proper error handling on failures
- ✅ Cache headers configured
- ✅ Loading states implemented
- ✅ Auto-refresh working
- ✅ Visibility change detection
- ✅ Mobile responsive
- ✅ No memory leaks (cleanup on unmount)
- ✅ Graceful degradation on errors

---

## Summary

✅ **Real-time status** from mcstatus.io  
✅ **Auto-refresh** every 60 seconds  
✅ **Smart caching** (30s fresh, 60s stale)  
✅ **Concurrent checks** for all servers  
✅ **Visibility detection** for tab returns  
✅ **Graceful errors** (keeps old data)  
✅ **Loading states** (skeleton + spinner)  
✅ **SSR support** (instant first load)  

The homepage now displays **accurate, live server status** with minimal latency and excellent UX! 🚀
