# Website Registration Failure - Debugging Guide

## 🔍 Identified Issues & Causes

### 1. ❌ Password Validation Mismatch
**Problem:** Website requires different password complexity than the mod

**Website (`minecraftRegisterSchema` line 21):**
```typescript
password: z.string()
  .min(6, 'Password must be at least 6 characters')
  .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/, 'Password must contain both letters and numbers')
```

**Issues:**
- ✅ Min 6 chars (matches mod)
- ❌ **REGEX PROBLEM:** `[A-Za-z\d]+$` - Only allows letters and numbers, **NO SPECIAL CHARACTERS**
- ❌ Requires BOTH letters AND numbers (mod allows either)

**Mod allows (line 22 in AuthCommands.java):**
```java
PASSWORD_PATTERN = "^[a-zA-Z0-9!@#$%^&*()_+\\-=\\[\\]{};':\",./<>?]+$"
```

**CONFLICT:**
- User sets password `Test@2024!` in game → Works ✅
- Same password on website → **FAILS** ❌ (special chars not allowed)

### 2. ❌ Missing Email Field
**Problem:** Website registration form likely requires email, but API doesn't handle optional emails properly

**Schema (users table line 8):**
```typescript
email: text('email'), // Optional field, no unique constraint shown
```

**Registration API (minecraft-register):**
- Doesn't set email at all
- Website form might require it

### 3. ❌ Error Handling Still Generic in `generate-code`
**File:** `/api/registration/generate-code/route.ts`

**Line 110-115:**
```typescript
} catch (error) {
  console.error('Generate code error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },  // ❌ Still generic!
    { status: 500 }
  );
}
```

**NOT FIXED YET!**

### 4. ⚠️ Username Conflicts
**Problem:** Minecraft usernames might not meet website username requirements

**Website registerSchema (line 10):**
```typescript
username: z.string()
  .min(3).max(30)
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
```

**Minecraft allows:** Letters, numbers, underscores (max 16 chars)
**Website allows:** Same, but up to 30 chars

**Potential Issues:**
- Minecraft usernames can have uppercase (converts properly)
- 3 char minimum might reject some names

### 5. ❌ Database Field Mismatches
**Looking at insert operations:**

**minecraft-register route (lines 60-70):**
```typescript
await db.insert(users).values({
  username: minecraft_username,        // ✅ Required
  minecraftUsername: minecraft_username, // ✅ Required
  minecraftUuid: minecraft_uuid,       // ✅ Required
  password: hashedPassword,             // ✅ Required
  role: 'user',                         // ✅ Required
  totalDonated: 0,                      // ✅ Has default
});
```

**Missing fields that have defaults:**
- `email` - Optional, can be null
- `xp` - Has default (0)
- `level` - Has default (1)
- `createdAt` - Has SQL default
- `updatedAt` - Has SQL default

**Should be fine, but email might cause issues if website form requires it**

### 6. ❌ Unique Constraint Violations
**Possible causes:**

**Schema unique constraints:**
```typescript
username: text('username').notNull().unique(),
minecraftUsername: text('minecraft_username').unique(),
minecraftUuid: text('minecraft_uuid').unique(),
```

**Issues:**
- If user tries to register twice → duplicate error
- If someone else has same Minecraft name → duplicate error
- Better error message needed (now fixed for minecraft-register, but not generate-code)

### 7. ⚠️ Code Expiration Issues
**generate-code route (lines 62-70):**
```typescript
if (existingCode.expiresAt > now) {
  const expiresIn = Math.floor((existingCode.expiresAt.getTime() - now.getTime()) / 1000);
  return NextResponse.json({
    code: existingCode.code,
    expires_in: expiresIn,
    minecraft_username,
  });
}
```

**Potential issue:**
- Expired codes not cleaned up
- User might get expired code if check fails
- No cleanup of old expired codes

## 🔧 Priority Fixes Needed

### CRITICAL: Fix Password Regex (Blocks All Special Characters!)

**Current Problem:**
```typescript
// This REJECTS special characters!
.regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/)
```

**Fix Needed:**
```typescript
// Allow special characters like the mod does
.regex(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':",./<>?]+$/, 
       'Password contains invalid characters')
// And make it optional to have both letters AND numbers
.refine(
  (val) => /[A-Za-z]/.test(val) || /\d/.test(val),
  'Password must contain letters or numbers'
)
```

### HIGH: Fix generate-code Error Handling

Apply same error handling fix as other endpoints:

```typescript
} catch (error) {
  console.error('Generate code error:', error);
  
  let errorMessage = 'Failed to generate code';
  let statusCode = 500;
  
  if (error instanceof Error) {
    console.error('Full error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    
    if (error.message.includes('UNIQUE constraint')) {
      errorMessage = 'Player already has a registration code';
      statusCode = 409;
    } else if (error.message.includes('connection')) {
      errorMessage = 'Database connection failed';
      statusCode = 503;
    } else {
      errorMessage = `Server error: ${error.message.substring(0, 100)}`;
    }
  }
  
  return NextResponse.json(
    { error: errorMessage },
    { status: statusCode }
  );
}
```

### MEDIUM: Add Password Validation Warning

Add a note in the registration form:
```
"Password must be 6+ characters. Can include special characters like !@#$%"
```

## 🧪 How to Test Each Issue

### Test 1: Password with Special Characters
```bash
# This should FAIL on website currently
curl -X POST https://your-site.com/api/registration/register \
  -H "Content-Type: application/json" \
  -d '{
    "code": "ABC123",
    "password": "Test@2024!"
  }'

# Expected: "Password must contain both letters and numbers" (wrong regex)
# Should work after fix
```

### Test 2: Check Error Messages
```bash
# Try to register duplicate user
curl -X POST https://your-site.com/api/registration/minecraft-register \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d '{
    "minecraft_username": "ExistingUser",
    "minecraft_uuid": "existing-uuid",
    "password": "test123"
  }'

# Should now show: "This account is already registered"
```

### Test 3: Generate Code Errors
```bash
# Disconnect database and try
curl -X POST https://your-site.com/api/registration/generate-code \
  -H "Content-Type: application/json" \
  -H "X-API-Key": "your-key" \
  -d '{
    "minecraft_username": "TestUser",
    "minecraft_uuid": "550e8400-e29b-41d4-a716-446655440000"
  }'

# Currently shows: "Internal server error" (generic)
# Should show: "Database connection failed" (after fix)
```

## 📋 Complete Fix Checklist

- [ ] Fix password regex to allow special characters
- [ ] Remove requirement for BOTH letters AND numbers
- [ ] Fix generate-code error handling
- [ ] Add cleanup job for expired codes
- [ ] Add better validation error messages
- [ ] Document password requirements on registration page
- [ ] Test all special character passwords
- [ ] Add rate limiting to prevent abuse
- [ ] Log all registration attempts for monitoring

## 🚨 Most Likely Cause of Current Failures

Based on the code analysis, the **#1 most likely cause** is:

### **Password Regex Rejection**

Users setting passwords with special characters in-game (which works), then:
1. Visit website with code
2. Enter same password
3. Website regex REJECTS it: `/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/`
4. User sees: "Password must contain both letters and numbers"
5. User confused because it HAS both - but website is rejecting special chars

**Example:**
- User types: `MyPass123!`
- Mod: ✅ Allows it
- Website: ❌ Rejects it (! is not in `[A-Za-z\d]`)

## 💡 Quick Temporary Workaround

Until validation is fixed, tell users:
**"When registering on the website, use only letters and numbers in your password (no special characters). You can change it later in account settings."**

## 🔍 How to See Real Errors

### Check Server Logs
```bash
# For Node.js
npm run dev
# Watch console for "Full error details"

# For Docker
docker logs -f vonix-network 2>&1 | grep "error"

# For PM2
pm2 logs vonix-network --err
```

### Enable Debug Mode
Add to `.env.local`:
```
NODE_ENV=development
DEBUG=true
```

## 📞 Next Steps

1. **Apply the password regex fix** (highest priority)
2. **Fix generate-code error handling**
3. **Test with real special character passwords**
4. **Monitor logs for actual errors**
5. **Report back with specific error messages**

Share any error logs you see and I'll provide the exact fix!
