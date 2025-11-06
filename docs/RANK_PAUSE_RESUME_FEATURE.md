# Rank Pause & Resume Feature

**Status:** ✅ Production Ready  
**Version:** 2.0 with Rank Selection  
**Date:** January 5, 2026

---

## 🎯 Overview

The Pause & Resume feature allows users to **temporarily disable their rank** and bank remaining days for later use. When resuming, users can **choose which rank** to come back with, with automatic day conversion based on value.

---

## 🔄 How It Works

### **Pause Flow**

1. User clicks **"Pause Rank"** button
2. System calculates remaining days
3. **Rank is completely removed** (`donationRankId` → `null`)
4. Days are banked in `pausedRemainingDays`
5. Original rank ID stored in `pausedRankId`
6. User now has **NO active rank** (all perks disabled)

### **Resume Flow (NEW!)**

1. User clicks **"Choose Rank to Resume"** button
2. **Modal opens** showing all available ranks
3. Each rank shows **converted days** preview
4. User **selects which rank** to resume with
5. Days are converted based on value
6. Selected rank is activated with converted days

---

## 🎨 UI/UX Features

### **Paused State Display**

**Before (WRONG):**
```
Current Rank: VIP (Paused badge)
Time: 25 days
Status: Paused
```

**After (CORRECT):**
```
Current Rank: No Active Rank
Pause icon (yellow)
"Rank Paused" badge
"25 days banked from VIP"
```

### **Resume Modal**

- **Full-screen modal** with backdrop blur
- **Banked days card** showing amount from original rank
- **Rank selection grid** (3 columns on desktop)
- **Live conversion preview** for each rank
- **"Original" badge** on previously paused rank
- **Large conversion preview** when rank selected
- **Green gradient CTA** to confirm

### **Conversion Indicators**

- **Upgrade (⬆️)**: Yellow badge - "Less days, better perks"
- **Downgrade (⬇️)**: Green badge - "More days, lower cost"
- **Same Rank (✓)**: Cyan badge - "Same days"

---

## 💾 Database Schema

### **Fields:**
```sql
pausedRankId TEXT           -- Stores original rank ID while paused
pausedRemainingDays INTEGER  -- Banked days
pausedAt INTEGER            -- Timestamp when paused
rankPaused BOOLEAN          -- Pause flag
```

### **When Paused:**
```sql
donationRankId: NULL        -- Rank removed!
rankExpiresAt: NULL         -- No expiration while paused
pausedRankId: "vip"        -- Original rank stored
pausedRemainingDays: 25     -- Days banked
rankPaused: true            -- Flag set
```

### **When Resumed:**
```sql
donationRankId: "vip-plus"  -- NEW rank activated
rankExpiresAt: <calculated> -- Based on converted days
pausedRankId: NULL          -- Cleared
pausedRemainingDays: NULL   -- Cleared
rankPaused: false           -- Flag cleared
```

---

## 🔢 Day Conversion Math

### **Formula:**
```javascript
value = (oldRank.minAmount / 30) * pausedDays
convertedDays = Math.floor(value / (newRank.minAmount / 30))
```

### **Example 1: Upgrade**
```
Paused: VIP ($5/mo), 30 days banked
Resume with: VIP+ ($10/mo)

Value: ($5 / 30) * 30 = $5.00
Converted: $5.00 / ($10 / 30) = 15 days

Result: 15 days of VIP+ (better perks, fewer days)
```

### **Example 2: Downgrade**
```
Paused: VIP+ ($10/mo), 15 days banked  
Resume with: VIP ($5/mo)

Value: ($10 / 30) * 15 = $5.00
Converted: $5.00 / ($5 / 30) = 30 days

Result: 30 days of VIP (more days, lower cost)
```

### **Example 3: Same Rank**
```
Paused: VIP ($5/mo), 20 days banked
Resume with: VIP ($5/mo)

Value: ($5 / 30) * 20 = $3.33
Converted: $3.33 / ($5 / 30) = 20 days

Result: 20 days of VIP (no change)
```

---

## 📡 API Endpoints

### **POST /api/user/pause-rank**

**Purpose:** Pause user's active rank

**Body:** None

**Response:**
```json
{
  "success": true,
  "message": "Rank paused successfully",
  "pausedDays": 25,
  "rankId": "vip"
}
```

**What it does:**
- Sets `rankPaused = true`
- Stores `pausedRankId = donationRankId`
- Banks `pausedRemainingDays`
- **Removes rank**: `donationRankId = NULL`
- **Clears expiration**: `rankExpiresAt = NULL`

---

### **POST /api/user/resume-rank**

**Purpose:** Resume paused rank with optional rank change

**Body:**
```json
{
  "newRankId": "vip-plus"  // Optional: choose different rank
}
```

**Response:**
```json
{
  "success": true,
  "message": "Rank resumed successfully",
  "rankId": "vip-plus",
  "daysRestored": 15,
  "expiresAt": "2026-02-01T00:00:00.000Z"
}
```

**What it does:**
- If `newRankId` provided and different from `pausedRankId`:
  - Fetches both ranks
  - Converts days based on value
  - Logs conversion in console
- Calculates new expiration date
- Sets `donationRankId = targetRankId`
- Sets `rankExpiresAt = calculated`
- Clears all pause fields

---

### **GET /api/user/rank-status**

**Purpose:** Get current rank status

**Response (Paused):**
```json
{
  "hasActiveRank": true,
  "currentRank": {
    "id": "vip",
    "name": "VIP",
    "badge": "✨ VIP",
    "textColor": "#3b82f6",
    "minDonation": 5
  },
  "remainingDays": 25,
  "expiresAt": null,
  "remainingValue": 4.17,
  "isPaused": true,
  "pausedDays": 25
}
```

**Note:** Returns paused rank info (for display), but `expiresAt` is `null`

---

## 🎮 User Flows

### **Flow 1: Pause for Break**
```
User has: VIP, 20 days remaining
Action: Clicks "Pause Rank"
Result: Rank removed, 20 days banked
```

### **Flow 2: Resume Same Rank**
```
Paused: VIP, 20 days banked
Action: Clicks "Choose Rank to Resume" → Selects VIP
Result: VIP rank with 20 days (same)
```

### **Flow 3: Resume with Upgrade**
```
Paused: VIP, 30 days banked
Action: Clicks "Choose Rank to Resume" → Selects VIP+
Result: VIP+ rank with 15 days (upgraded)
```

### **Flow 4: Resume with Downgrade**
```
Paused: VIP+, 10 days banked
Action: Clicks "Choose Rank to Resume" → Selects VIP
Result: VIP rank with 20 days (more days!)
```

---

## 🚦 Page Behavior

### **Manage Rank Page** (`/donations/manage-rank`)

**When Active:**
- Shows current rank with stats
- "Pause Rank" button available
- Can switch ranks freely

**When Paused:**
- Shows "No Active Rank" with pause icon
- Shows banked days from original rank
- "Choose Rank to Resume" button
- Clicking opens full-screen modal
- Modal shows all ranks with conversion preview

---

### **Extend Page** (`/donations/extend`)

**When Active:**
- Shows current rank
- Duration selection available
- Payment form works

**When Paused:**
- Redirects to `/donations/manage-rank`
- Toast: "Please resume your rank first to extend it"

---

### **Subscribe Page** (`/donations/subscribe`)

**When Active:**
- Redirects to `/donations/extend`

**When Paused:**
- Treats as "no active rank"
- Shows full purchase flow

---

## ⚠️ Edge Cases Handled

### **1. Missing Database Column**
```javascript
Error: "no such column: paused_rank_id"
Response: "Pause feature not yet available. Database migration required."
Status: 503
```

### **2. No Banked Days**
```javascript
Error: "No banked days to restore"
Status: 400
```

### **3. Invalid Rank Selection**
```javascript
Error: "Invalid rank"
Status: 400
```

### **4. Rank Not Paused**
```javascript
Error: "Rank is not paused"
Status: 400
```

### **5. Already Paused**
```javascript
Error: "Rank is already paused"
Status: 400
```

---

## 🎨 Visual States

### **Active Rank**
```
Icon: Crown (cyan)
Badge: "Active" (green)
Background: Cyan/purple gradient
Actions: Pause, Extend, Switch
```

### **Paused Rank**
```
Icon: Pause (yellow)
Badge: "Rank Paused" (yellow)
Text: "No Active Rank" (gray)
Note: "25 days banked from VIP"
Background: Yellow/orange gradient
Actions: Choose Rank to Resume
```

---

## 🔒 Security & Validation

### **API Validation:**
- ✅ Session authentication required
- ✅ User existence check
- ✅ Pause state validation
- ✅ Banked days validation
- ✅ Rank existence validation
- ✅ Conversion calculation validation

### **Database Safety:**
- ✅ Transactional updates
- ✅ NULL safety on rank fields
- ✅ Date calculations with timezone awareness
- ✅ Floor rounding on day conversion (prevents fractional days)

---

## 📊 Benefits

### **For Users:**
1. **Flexibility** - Pause when not playing
2. **No Waste** - Days banked, not lost
3. **Choice** - Can resume with different rank
4. **Fairness** - Value preserved in conversions
5. **Control** - Manage subscription freely

### **For Business:**
1. **Retention** - Users more likely to return
2. **Upgrades** - Easier to encourage rank upgrades
3. **Satisfaction** - Premium feature increases value
4. **Flexibility** - Adapts to user's gaming schedule
5. **Trust** - Transparent day conversion builds trust

---

## 🚀 Migration Instructions

### **1. Run Migration:**
```bash
npm run db:migrate:safe
```

### **2. Verify Columns:**
```sql
SELECT 
  rank_paused, 
  paused_rank_id, 
  paused_remaining_days, 
  paused_at 
FROM users 
WHERE id = 1;
```

### **3. Test Flow:**
1. Purchase a rank
2. Click "Pause Rank"
3. Verify rank is removed
4. Click "Choose Rank to Resume"
5. Select different rank
6. Verify days converted correctly

---

## 📈 Analytics Tracking

**Recommended Events:**
- `rank_paused` - When user pauses
- `rank_resumed` - When user resumes
- `rank_changed_on_resume` - When resuming with different rank
- `resume_modal_opened` - When user opens selection
- `resume_rank_previewed` - When user hovers over rank in modal

---

## 🎯 Future Enhancements

### **Potential Additions:**
- [ ] Pause reasons (dropdown: vacation, budget, other)
- [ ] Auto-pause after X days inactive
- [ ] Email reminder to resume after 30 days
- [ ] Pause history log
- [ ] "Paused days" leaderboard
- [ ] Pause cooldown (prevent abuse)
- [ ] Bulk pause/resume for admins

---

## ✅ Testing Checklist

### **Pause:**
- [ ] Can pause active rank
- [ ] Days banked correctly
- [ ] Rank removed from database
- [ ] Expiration cleared
- [ ] Toast notification shown
- [ ] UI updates immediately

### **Resume:**
- [ ] Modal opens correctly
- [ ] All ranks displayed
- [ ] Conversion preview accurate
- [ ] Can select rank
- [ ] Days convert correctly
- [ ] Rank activates immediately
- [ ] Toast notification shown
- [ ] Modal closes after resume

### **Edge Cases:**
- [ ] Cannot pause already paused rank
- [ ] Cannot pause if no rank
- [ ] Cannot resume if not paused
- [ ] Cannot resume without selection
- [ ] Handles invalid rank IDs
- [ ] Handles database errors gracefully

---

## 📝 Key Code Locations

### **API Routes:**
- `src/app/api/user/pause-rank/route.ts` - Pause endpoint
- `src/app/api/user/resume-rank/route.ts` - Resume endpoint (with rank selection)
- `src/app/api/user/rank-status/route.ts` - Status endpoint (returns paused info)

### **Pages:**
- `src/app/(dashboard)/donations/manage-rank/page.tsx` - Main management with resume modal
- `src/app/(dashboard)/donations/extend/page.tsx` - Redirects paused users

### **Database:**
- `src/db/schema.ts` - Column definitions
- `src/db/safe-migrate.ts` - Migration script

### **Documentation:**
- `docs/RANK_PAUSE_RESUME_FEATURE.md` - This file
- `docs/PAUSE_FEATURE_SETUP.md` - Setup instructions

---

## 🎉 Conclusion

The Pause & Resume feature v2.0 provides a **premium, flexible experience** for managing rank subscriptions:

✅ **Complete rank removal** when paused (no confusion)  
✅ **Rank selection modal** on resume (premium UX)  
✅ **Automatic day conversion** (fair value preservation)  
✅ **Live conversion previews** (full transparency)  
✅ **Enterprise-grade UI** (matches redesigned pages)  

**Status:** Production ready! 🚀

---

**Last Updated:** January 5, 2026  
**Maintainer:** Development Team  
**Version:** 2.0 with Rank Selection
