# Feature Testing Checklist

## ✅ New Features Testing Guide

This document lists all newly implemented features and how to test them.

---

## 🎯 XP System Changes

### **1. New Exponential Formula**
**Test:**
1. Check existing user levels after sync
2. Award XP to a user (e.g., create a post)
3. Verify level calculation matches new formula

**Expected:**
- 138 XP = Level 1 (not Level 4)
- 232 XP = Level 2
- 1,324 XP = Level 5

**Files:**
- `src/lib/xp-utils.ts` - Core formula
- `src/lib/xp-system.ts` - XP awarding

---

### **2. Level Sync API**
**Test:**
1. Go to `/admin/xp-rewards`
2. Click "Sync All Levels" button
3. Confirm the action
4. Check toast notification for success

**Expected:**
- All user levels recalculated
- Toast shows "Synced X user levels!"
- Console shows sample updates

**Endpoint:** `POST /api/admin/sync-levels`

---

### **3. Level Rewards Management**
**Test:**
1. Go to `/admin/xp-rewards`
2. Click "Add Reward"
3. Fill in:
   - Level: 10
   - Title: "Veteran"
   - Badge: ⚔️
   - Description: "Reached level 10!"
4. Click "Create Reward"
5. Test Edit: Click edit icon on a reward
6. Test Delete: Click delete icon on a reward

**Expected:**
- ✅ Create reward saves successfully
- ✅ XP requirement shown (5,315 total XP for level 10)
- ✅ Edit opens inline form with Save/Cancel
- ✅ Delete prompts confirmation
- ✅ All CRUD operations work

**API Endpoints:**
- `GET /api/xp/rewards` - List rewards
- `POST /api/xp/rewards` - Create
- `PATCH /api/xp/rewards/[id]` - Update
- `DELETE /api/xp/rewards/[id]` - Delete

---

## 🔑 Registration Codes Admin

### **4. Registration Codes Panel**
**Test:**
1. Go to `/admin/registration-codes`
2. Click "Generate Code"
3. Enter Minecraft username
4. Check stats update
5. Click copy button on a code
6. Filter by Active/Used/Expired
7. Delete a code

**Expected:**
- ✅ Stats cards show correct counts
- ✅ Code copied to clipboard (toast notification)
- ✅ Filters work correctly
- ✅ Delete removes code
- ✅ Table shows status with color coding

**Files:**
- `src/app/(dashboard)/admin/registration-codes/page.tsx`
- Uses existing `/api/registration/*` endpoints

---

## 📖 Stories Feature

### **5. Stories Bar**
**Test:**
1. Go to `/social`
2. Check stories bar at top
3. See loading skeletons first
4. See "Add Story" button
5. Click on a user's story

**Expected:**
- ✅ Stories bar loads
- ✅ User avatars show with gradient rings (unviewed)
- ✅ Clicking user opens story viewer
- ✅ Grouped by user

**Files:**
- `src/components/social/stories-bar.tsx`
- `src/app/(dashboard)/social/page.tsx`

---

### **6. Stories Viewer**
**Test:**
1. Click on a story from stories bar
2. Wait for auto-advance (7 seconds)
3. Click previous/next buttons
4. Click close (X) button
5. Check progress bars at top

**Expected:**
- ✅ Full-screen viewer opens
- ✅ Progress bars show current story
- ✅ Auto-advances after 7 seconds
- ✅ Navigation buttons work
- ✅ View count increments
- ✅ Close button returns to feed

**Files:**
- `src/components/social/stories-viewer.tsx`

---

### **7. Stories API**
**Test:**
1. Create story: `POST /api/social/stories`
   ```json
   {
     "content": "Test story!",
     "backgroundColor": "#8b5cf6"
   }
   ```
2. List stories: `GET /api/social/stories`
3. Mark viewed: `POST /api/social/stories/[id]/view`
4. Delete story: `DELETE /api/social/stories/[id]`

**Expected:**
- ✅ Stories create successfully
- ✅ Only active stories returned (not expired)
- ✅ View tracking works
- ✅ 24-hour expiration enforced

**Files:**
- `src/app/api/social/stories/route.ts`
- `src/app/api/social/stories/[id]/route.ts`
- `src/app/api/social/stories/[id]/view/route.ts`

---

## 👥 Groups Feature

### **8. Groups Page**
**Test:**
1. Go to `/groups`
2. See "Discover" and "My Groups" tabs
3. Search for a group
4. Click "Create Group"
5. Click on a group card

**Expected:**
- ✅ Grid layout shows groups
- ✅ Tabs switch between Discover/My Groups
- ✅ Search filters groups
- ✅ Member counts display
- ✅ Cover images show
- ✅ Privacy indicators (lock icon for private)

**Files:**
- `src/app/(dashboard)/groups/page.tsx`

---

### **9. Groups API**
**Test:**
1. Create group: `POST /api/groups`
   ```json
   {
     "name": "Test Group",
     "description": "Testing",
     "privacy": "public"
   }
   ```
2. List groups: `GET /api/groups`
3. Get my groups: `GET /api/groups?my=true`
4. Join group: `POST /api/groups/[id]/join`
5. Leave group: `DELETE /api/groups/[id]/join`
6. Update group: `PATCH /api/groups/[id]`
7. Delete group: `DELETE /api/groups/[id]`

**Expected:**
- ✅ All CRUD operations work
- ✅ Creator auto-added as admin
- ✅ Member counts accurate
- ✅ Privacy settings enforced

**Files:**
- `src/app/api/groups/route.ts`
- `src/app/api/groups/[id]/route.ts`
- `src/app/api/groups/[id]/join/route.ts`

---

## 🎨 UI Components

### **10. Level-Up Modal**
**Test:**
1. Trigger level up (create posts to gain XP)
2. Modal should auto-display
3. Check confetti animation (if package installed)
4. See old → new level transition
5. See new title and badge
6. Click "Continue"

**Expected:**
- ✅ Modal appears on level up
- ✅ Confetti animation (if installed)
- ✅ Level comparison shows
- ✅ Title and badge display
- ✅ Gradient styling applied

**Files:**
- `src/components/xp/level-up-modal.tsx`
- Note: Requires integration into `awardXP()` function

---

## 🔧 Admin Navigation

### **11. XP & Progression Section**
**Test:**
1. Login as admin
2. Go to `/admin`
3. Check sidebar
4. Look for "XP & Progression" section
5. Click "Level Rewards"
6. Click "Registration Codes"

**Expected:**
- ✅ New section visible in sidebar
- ✅ Two items: Level Rewards, Registration Codes
- ✅ Icons show (TrendingUp, Ticket)
- ✅ Links navigate correctly

**Files:**
- `src/components/admin/admin-sidebar.tsx`

---

### **12. Groups in Main Nav**
**Test:**
1. Login as any user
2. Check main navigation bar
3. See "Groups" link between Social and Forum

**Expected:**
- ✅ Groups link visible
- ✅ Icon shows correctly
- ✅ Navigates to `/groups`
- ✅ Active state highlights when on groups page

**Files:**
- `src/components/nav/unified-nav.tsx`

---

## 🔍 Database & API

### **13. getUserAvatar Helper**
**Test:**
1. Check any page with user avatars
2. Verify Minecraft heads load from mc-heads.net
3. Check fallback to Steve if no username

**Expected:**
- ✅ Avatars load correctly
- ✅ Pixelated class applied
- ✅ Rounded-lg borders
- ✅ Proper sizes (32/64/128)

**Files:**
- `src/lib/utils.ts` - `getUserAvatar()` function

---

## 🚀 Build & Type Check

### **14. TypeScript Build**
**Test:**
```bash
npm run build
```

**Expected:**
- ✅ No TypeScript errors
- ✅ No module resolution errors
- ✅ Build completes successfully
- ✅ All pages compile

---

## 📊 Summary Checklist

- [x] XP formula updated (exponential scaling)
- [x] Level sync button works
- [x] Level rewards CRUD functional
- [x] Registration codes admin panel
- [x] Stories bar displays
- [x] Stories viewer works
- [x] Stories API complete
- [x] Groups page UI
- [x] Groups API complete
- [x] Level-up modal component
- [x] Admin navigation updated
- [x] Groups in main nav
- [x] getUserAvatar helper added
- [x] TypeScript build passes

---

## 🐛 Known Limitations

1. **Confetti Animation:** Requires `canvas-confetti` package to be installed. Modal works without it, just no animation.
2. **Stories Create Modal:** Not yet implemented (TODO placeholder in stories-bar.tsx).
3. **Level-Up Modal Integration:** Not automatically triggered - needs integration into xp-system.ts.
4. **Group Detail Pages:** Not yet created (only listing page exists).

---

## 📝 Next Steps

1. Install canvas-confetti: `npm install canvas-confetti`
2. Integrate level-up modal into `awardXP()` function
3. Create story creation modal UI
4. Add group detail pages (`/groups/[id]`)
5. Test all features in production environment

---

**Last Updated:** 2025-01-23  
**All Critical Features:** ✅ Functional
