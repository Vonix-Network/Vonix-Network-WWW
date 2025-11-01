# Backend Error Handling Fixes

## Problems Fixed

### 1. ✅ Generic "Internal Server Error" Messages
**Problem:** All backend errors returned generic "Internal server error" without details  
**Fixed:** Added intelligent error detection and specific error messages

### 2. ✅ BCrypt Work Factor Inconsistency  
**Problem:** Website registration used work factor 10, mod expected 12  
**Fixed:** Standardized to work factor 12 across all endpoints

### 3. ✅ Missing Error Logging
**Problem:** Errors were logged but details weren't accessible  
**Fixed:** Added detailed error logging with full stack traces for admins

## Files Modified

### 1. `/api/registration/minecraft-register/route.ts`
**Purpose:** Direct in-game registration (mod's `/register <password>` command)

**Changes:**
- ✅ Replaced generic "Internal server error" with specific messages
- ✅ Added detection for:
  - Duplicate account errors
  - Database connection failures
  - Foreign key violations
  - Invalid data errors
- ✅ Enhanced logging with full error details
- ✅ Returns first 100 chars of error message for debugging

**Error Messages Now Returned:**
- `"This account is already registered"` (409) - Duplicate user
- `"Database connection failed"` (503) - Connection issues
- `"Invalid account data"` (400) - Data validation errors
- `"Server error: [details]"` (500) - With actual error details

### 2. `/api/registration/register/route.ts`
**Purpose:** Website registration form completion with code

**Changes:**
- ✅ Fixed BCrypt work factor from 10 → 12 (matches mod)
- ✅ Replaced generic "Internal server error" with specific messages
- ✅ Added special case for registration code corruption
- ✅ Enhanced error logging
- ✅ Added `success: false` to error responses for consistency

**Error Messages Now Returned:**
- `"This account is already registered"` (409)
- `"Registration code is invalid or corrupted"` (400)
- `"Database connection failed"` (503)
- `"Invalid account data"` (400)
- `"Server error: [details]"` (500)

### 3. `/api/registration/minecraft-login/route.ts`
**Purpose:** Mod's `/login <password>` command

**Changes:**
- ✅ Replaced generic "Internal server error" with specific messages
- ✅ Added detection for:
  - Database connection errors
  - Account not found errors
  - Password/BCrypt errors
  - JWT token generation errors
- ✅ Enhanced error logging

**Error Messages Now Returned:**
- `"Database connection failed"` (503)
- `"Account not found"` (404)
- `"Invalid password"` (401)
- `"Failed to generate session token"` (500)
- `"Server error: [details]"` (500)

## How Error Handling Works Now

### User Experience (Minecraft Client)
```
Before: "Internal server error"
After:  "Database connection failed"
        or "This account is already registered"
        or "Server error: Cannot read property 'minecraftUsername' of null"
```

### Admin Experience (Server Logs)
```
Full error details: {
  name: 'Error',
  message: 'Cannot read property minecraftUsername of null',
  stack: '... full stack trace ...'
}
```

### Mod Translation
The Minecraft mod will translate these errors further:
- `"Database connection failed"` → User-friendly message about trying again
- `"This account is already registered"` → Suggests using `/login` instead
- `"Server error: [details]"` → Shows first part to user, logs full details

## Error Flow Example

### Duplicate Registration Attempt

1. **User Action:** `/register password123`  
2. **Backend Detects:** UNIQUE constraint violation  
3. **Backend Returns:** `{ success: false, error: "This account is already registered" }`  
4. **Mod Translates:** `"This account is already registered. Use /login <password> instead."`  
5. **Admin Sees in Logs:**
   ```
   Full error details: {
     name: 'Error',
     message: 'UNIQUE constraint failed: users.minecraft_uuid'
   }
   ```

### Database Connection Error

1. **User Action:** `/register password123`  
2. **Backend Detects:** Connection refused  
3. **Backend Returns:** `{ success: false, error: "Database connection failed" }`  
4. **Mod Translates:** `"Unable to connect to authentication server. Please try again or contact an administrator."`  
5. **Admin Sees in Logs:**
   ```
   Full error details: {
     name: 'Error',
     message: 'connect ECONNREFUSED 127.0.0.1:3306'
   }
   ```

## Testing the Fixes

### 1. Test Specific Errors
```bash
# Test duplicate registration
curl -X POST https://your-site.com/api/registration/minecraft-register \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d '{"minecraft_username":"ExistingUser","minecraft_uuid":"existing-uuid","password":"test"}' \
  | jq

# Should return: {"success":false,"error":"This account is already registered"}
```

### 2. Check Server Logs
```bash
# Watch for detailed error logs
tail -f logs/application.log
# Or for Docker:
docker logs -f vonix-network
```

### 3. Test in Minecraft
1. Try registering with existing account
2. Should see: "This account is already registered. Use /login <password> instead."
3. Check server logs for detailed error

## Next.js/React 19 Compatibility

These fixes are compatible with:
- ✅ Next.js 16.0.1
- ✅ React 19.2.0
- ✅ NextAuth 5.0.0-beta.25
- ✅ Drizzle ORM 0.44.7

No breaking changes were introduced.

## Common Errors You'll Now See

### Before Fixes
```
❌ "Internal server error" (every error)
```

### After Fixes
```
✅ "This account is already registered" (duplicate)
✅ "Database connection failed" (connection issues)
✅ "Registration code is invalid or corrupted" (bad code data)
✅ "Invalid account data" (validation errors)
✅ "Server error: Cannot connect to database at localhost:3306" (with details!)
```

## Monitoring & Debugging

### Check for Errors in Production
```bash
# View recent errors
grep "Full error details" logs/*.log | tail -20

# Count error types
grep "error:" logs/*.log | cut -d'"' -f4 | sort | uniq -c
```

### Common Issues & Solutions

#### "Database connection failed"
- Check database is running
- Verify connection credentials in `.env`
- Check firewall/network settings

#### "This account is already registered"
- Expected for duplicate registrations
- Tell user to use `/login` instead

#### "Server error: [specific message]"
- Check the specific error message
- Look for missing database columns
- Verify schema migrations ran

## Benefits

1. ✅ **Users see helpful errors** instead of "Internal server error"
2. ✅ **Admins get full error details** in logs for debugging
3. ✅ **Mod translates errors** into user-friendly messages
4. ✅ **Easier troubleshooting** with specific error codes
5. ✅ **Better user experience** with actionable error messages

## Rollback (If Needed)

If these changes cause issues, revert with:
```bash
git checkout HEAD~1 src/app/api/registration/
```

But they should be safe since they only improve error messages without changing core logic.
