# 🔍 Debugging Server Status Issues

The server status lookup is showing inaccurate results. Let's diagnose the issue.

---

## Step 1: Check Your Database

First, verify what servers are actually in your database:

```bash
# If using Turso CLI
turso db shell <your-db-name>

# Run this query
SELECT id, name, ipAddress, port, status, playersOnline, playersMax, version FROM servers;
```

**What to look for:**
- Are the IP addresses correct?
- Are the ports correct? (Default is 25565)
- Do the servers actually exist and are online?

---

## Step 2: Test APIs Directly

I've added comprehensive logging. Let's test the APIs:

### Test with Node.js script:

```bash
# Edit the script first to add YOUR actual server IPs
# Open scripts/test-server-status.js and change:
const servers = [
  { name: 'Your Server 1', ip: 'your.server.ip', port: 25565 },
  { name: 'Your Server 2', ip: 'another.server.ip', port: 25565 },
];

# Then run:
node scripts/test-server-status.js
```

### Test with curl:

```bash
# Test mcstatus.io directly
curl "https://api.mcstatus.io/v2/status/java/YOUR_SERVER_IP:25565"

# Test mcsrvstat.us directly
curl "https://api.mcsrvstat.us/3/YOUR_SERVER_IP:25565"

# Test your API endpoint
curl "http://localhost:3000/api/servers"
```

---

## Step 3: Check Server Logs

After hitting the `/api/servers` endpoint, check your development console logs:

You should see detailed output like:
```
[API] /api/servers - Starting server status check...
[API] Found 3 servers in database: Survival (play.example.com:25565), Creative (play.example.com:25566), ...
[API] Processing Survival...
[mcstatus.io] Checking play.example.com:25565...
[mcstatus.io] play.example.com:25565 - Online: true, Players: 45/100
[mcsrvstat.us] Checking play.example.com:25565...
[mcsrvstat.us] play.example.com:25565 - Online: true, Players: 43/100
[Reconcile] play.example.com:25565 - mcstatus: ONLINE (45), mcsrvstat: ONLINE (43)
[Reconcile] play.example.com:25565 - Choosing mcstatus (higher players: 45)
[API] Survival - Final: ONLINE with 45 players
```

---

## Step 4: Common Issues & Solutions

### Issue: "BOTH PROVIDERS FAILED"

**Possible causes:**
1. Server IP/hostname is wrong
2. Server has query protocol disabled
3. Firewall blocking status checks
4. Server is actually offline

**Fix:**
- Verify the IP address is correct
- Test manually with the curl commands above
- Check if your server has `enable-query=true` in server.properties
- Check if `query.port` matches your server port

### Issue: Shows 0/0 players but server is online

**Cause:** Server has query protocol disabled

**Fix:** In your Minecraft `server.properties`:
```properties
enable-query=true
query.port=25565
```

Then restart your server.

### Issue: Shows offline but server is online

**Possible causes:**
1. DNS hasn't propagated
2. SRV record pointing to different port
3. Server recently restarted (APIs cached old status)
4. Firewall blocking the status check port

**Fix:**
- Use the actual IP address instead of hostname
- Check DNS with: `nslookup your.server.com`
- Check SRV record with: `nslookup -type=srv _minecraft._tcp.your.server.com`
- Wait 30 seconds for cache to expire

### Issue: Timeout errors

**Cause:** Server is slow to respond or unreachable

**Fix:**
- Increase timeout in `src/app/api/servers/route.ts`:
  ```typescript
  signal: AbortSignal.timeout(10000)  // 10 seconds
  ```

---

## Step 5: Check Specific Provider Issues

### mcstatus.io Issues

Test directly:
```bash
curl "https://api.mcstatus.io/v2/status/java/YOUR_IP"
```

Common issues:
- Returns `eula_blocked: true` - Server hasn't accepted EULA
- Returns `online: false` - Server is offline or unreachable
- HTTP 404 - Invalid server address format

### mcsrvstat.us Issues

Test directly:
```bash
curl "https://api.mcsrvstat.us/3/YOUR_IP"
```

Common issues:
- `online: false` - Server is offline or query disabled
- `debug` field shows connection error
- Version array is empty

---

## Step 6: Verify Your Server Settings

In your Minecraft `server.properties`, ensure:

```properties
# Enable status queries
enable-status=true

# Enable player list queries
enable-query=true
query.port=25565

# Make sure port matches
server-port=25565
```

**Restart your Minecraft server after changes!**

---

## Step 7: Test with Known Working Servers

Replace your server IPs temporarily with known working servers:

```typescript
// In scripts/test-server-status.js
const servers = [
  { name: 'Hypixel', ip: 'mc.hypixel.net', port: 25565 },
  { name: '2b2t', ip: '2b2t.org', port: 25565 },
];
```

If these work but yours don't, the issue is with your server configuration.

---

## Step 8: Check Network/Firewall

Ensure your server allows status queries:

### Firewall Rules
Your server needs to allow:
- TCP port 25565 (or your custom port)
- UDP port 25565 (for query protocol)

### Cloud Provider Security Groups
If using AWS/Azure/GCP:
- Allow inbound TCP 25565
- Allow inbound UDP 25565

---

## Step 9: What Information to Provide

If still not working, share:

1. **Server IP/hostname** (can be fake like `play.example.com`)
2. **Port** (if not 25565)
3. **Actual server status** (Is it really online? Can you connect?)
4. **Error messages** from console logs
5. **API responses** from curl tests
6. **Output from test script**

Example:
```
Server: play.example.com:25565
Actually online: YES (I can connect in-game)
Players online: 5
mcstatus.io says: offline
mcsrvstat.us says: offline
Console logs: [shows timeout errors]
```

---

## Step 10: Quick Fixes to Try

### Fix 1: Use IP address instead of hostname
```sql
-- If using hostname
UPDATE servers SET ipAddress = '1.2.3.4' WHERE name = 'Your Server';
```

### Fix 2: Disable query and accept less accurate data
Some status APIs work without query protocol, but give less info.

### Fix 3: Add retry logic
Edit `src/app/api/servers/route.ts` to retry on failure:
```typescript
async function fetchWithRetry(fn, retries = 2) {
  for (let i = 0; i < retries; i++) {
    const result = await fn();
    if (result) return result;
    await new Promise(r => setTimeout(r, 500)); // Wait 500ms
  }
  return null;
}
```

### Fix 4: Use ping instead of query
Some servers respond to ping but not query. APIs usually try ping first.

---

## Most Common Cause

**90% of "inaccurate" status issues are:**

1. ✅ **Server query disabled** - Fix: `enable-query=true` in server.properties
2. ✅ **Wrong IP/port in database** - Fix: Update database with correct values
3. ✅ **Server actually offline** - Fix: Start your server!
4. ✅ **Firewall blocking UDP** - Fix: Allow UDP port 25565

---

## Next Steps

1. Run the test script with YOUR server IPs
2. Check the console logs
3. Compare with manual curl tests
4. Share the results and I'll help fix it!

**Once you run the tests, let me know what you see in the logs.**
