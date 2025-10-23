# Vonix Network XP & Leveling System

## Overview

The Vonix Network features a **comprehensive XP and leveling system** with exponential scaling that makes progression increasingly challenging as players advance. This system rewards engagement across all platform features.

---

## 📊 Leveling Formula

### **Exponential Scaling System**

The platform uses a custom exponential formula that creates a challenging progression:

```
Base XP = (100 × level) + (level^2.5)
```

**Tier Multipliers:**
- **Levels 1-10:** 1.0x (Learning phase)
- **Levels 11-20:** 1.5x (Early challenge)
- **Levels 21-30:** 2.0x (Moderate grind)
- **Levels 31-40:** 2.5x (Serious dedication)
- **Levels 41-50:** 3.0x (Elite players)
- **Levels 51-75:** 3.5x (Hardcore grinders)
- **Levels 76-100:** 4.0x (Legendary)
- **Levels 101+:** 5.0x (Insane)

### **Level Requirements (Examples)**

| Level | XP to Next Level | Total XP Required |
|-------|------------------|-------------------|
| 1 → 2 | 232 | 0 |
| 5 → 6 | 559 | 1,324 |
| 10 → 11 | 1,316 | 5,315 |
| 20 → 21 | 6,200 | 24,803 |
| 30 → 31 | 17,676 | 153,110 |
| 50 → 51 | 106,066 | 795,495 |
| 75 → 76 | 537,712 | 3,419,478 |
| 100 → 101 | 2,004,000 | 10,316,227 |

---

## 💎 XP Earning Methods

### **Social Platform**
- **Create Post:** +15 XP
- **Like Received:** +2 XP per like
- **Create Comment:** +5 XP
- **Comment Like:** +1 XP per like

### **Forum Activity**
- **Create Forum Post:** +20 XP
- **Create Reply:** +10 XP
- **Upvote Received:** +3 XP
- **Downvote Received:** -2 XP

### **Social Interactions**
- **Friend Request Accepted:** +10 XP
- **Profile Completed:** +25 XP (one-time)

### **Daily Engagement**
- **Daily Login (Base):** +5 XP
- **3+ Day Streak:** +2 XP bonus
- **7+ Day Streak:** +10 XP bonus
- **14+ Day Streak:** +20 XP bonus
- **30+ Day Streak:** +50 XP bonus

### **Milestones**
- **First Post:** +50 XP
- **First Comment:** +25 XP
- **First Friend:** +30 XP

### **Moderation (Penalties)**
- **Post Removed:** -50 XP
- **Spam Detected:** -100 XP

---

## 🏆 Achievements System

Achievements award bonus XP when unlocked. Categories include:

- **Social:** Post creation, likes, comments
- **Forum:** Forum posts, replies, helpful votes
- **Leveling:** Milestone levels (5, 10, 25, 50, 75, 100)
- **Special:** Unique accomplishments

Example achievements are seeded in the database via `add-xp-system.ts`.

---

## 🎁 Level Rewards

### **Default Titles by Level**
- **Level 1-4:** ✨ Novice
- **Level 5-9:** 🌱 Apprentice
- **Level 10-14:** 🎯 Skilled
- **Level 15-24:** ⚡ Rising Star
- **Level 25-34:** 🔥 Veteran
- **Level 35-49:** 💎 Elite
- **Level 50-74:** ⭐ Expert
- **Level 75-99:** 👑 Master
- **Level 100+:** 🌟 Legendary

### **Color Coding**
Levels are color-coded for visual hierarchy:
- **1-4:** Green (#10b981)
- **5-9:** Light Green (#A8E6CF)
- **10-14:** Light Teal (#95E1D3)
- **15-24:** Teal (#4ECDC4)
- **25-34:** Orange (#FF8C42)
- **35-49:** Pink (#FF6B9D)
- **50-74:** Cyan (#00D9FF)
- **75-99:** Purple (#C77DFF)
- **100+:** Gold (#FFD700)

### **Custom Rewards**
Admins can configure custom rewards for specific levels via `/admin/xp-rewards`:
- Custom titles
- Badges (emojis)
- Feature unlocks
- Currency rewards

---

## 📈 Leaderboard System

### **Two Leaderboard Types**

#### **1. XP Leaderboard** (`/api/xp/leaderboard`)
- Ranks users by total XP
- Shows level, XP, and custom titles
- Top 100 players displayed

#### **2. Engagement Leaderboard** (`/api/leaderboard`)
- Ranks users by total engagement points
- Tracks:
  - Posts created
  - Comments created
  - Forum posts & replies
  - Upvotes/downvotes received
  - Likes received
- Calculated score based on all activities

---

## 🔧 Technical Implementation

### **Core Functions** (`src/lib/xp-utils.ts`)

```typescript
getXPForLevel(level: number): number
// Returns XP needed for specific level

getTotalXPForLevel(level: number): number
// Returns cumulative XP to reach level

getLevelFromXP(xp: number): number
// Calculates current level from total XP

getLevelProgress(xp: number): number
// Returns progress percentage in current level (0-1)

getTitleForLevel(level: number): string
// Returns default title for level

getColorForLevel(level: number): string
// Returns hex color for level tier
```

### **XP Awarding** (`src/lib/xp-system.ts`)

```typescript
await awardXP(userId, amount, source, sourceId?, description?)
```

Returns:
- `newXP`: User's new total XP
- `newLevel`: User's new level
- `leveledUp`: Boolean if user leveled up
- `transaction`: XP transaction record

### **Database Tables**

1. **`users`**
   - `xp`: Total XP earned
   - `level`: Current level
   - `title`: Custom title (overrides default)

2. **`xpTransactions`**
   - Tracks all XP gains/losses
   - Includes source, amount, and description

3. **`achievements`**
   - Achievement definitions
   - XP rewards for unlocking

4. **`userAchievements`**
   - User achievement progress
   - Completion tracking

5. **`levelRewards`**
   - Custom rewards per level
   - Admin-configurable

6. **`dailyStreaks`**
   - Login streak tracking
   - Bonus XP calculation

---

## 🎮 Integration Points

### **Automatic XP Awards**

XP is automatically awarded when users:
- Create social posts
- Comment on posts
- Create forum posts/replies
- Receive likes/upvotes
- Accept friend requests
- Login daily
- Unlock achievements

### **Level-Up Events**

When a user levels up:
1. `users.level` is updated
2. Level rewards are checked and applied
3. Notifications are created (if implemented)
4. Achievement checks are triggered

---

## 📊 Admin Tools

### **XP Rewards Management** (`/admin/xp-rewards`)
- View all level rewards
- Create new rewards for specific levels
- Edit existing rewards
- Delete rewards
- See total XP requirements per level

### **User XP Management** (`/admin/users`)
- View user XP and levels
- Manually adjust XP (if needed)
- View XP transaction history

---

## 🔮 Future Enhancements

Potential additions:
- XP multiplier events (2x XP weekends)
- Seasonal XP bonuses
- Guild/team XP sharing
- XP decay for inactive users
- Prestige system for level 100+
- Custom XP sources (donations, events)

---

## 📝 Example Usage

### **Awarding XP for a Post**

```typescript
import { awardXP, XP_REWARDS } from '@/lib/xp-system';

const result = await awardXP(
  userId,
  XP_REWARDS.POST_CREATE, // 15 XP
  'post_create',
  postId,
  'Created a new post'
);

if (result.leveledUp) {
  // Show level-up notification
  console.log(`Leveled up to ${result.newLevel}!`);
}
```

### **Checking User Progress**

```typescript
import { getXPProgress } from '@/lib/xp-system';

const progress = getXPProgress(userXP);

console.log(`Level: ${progress.level}`);
console.log(`Progress: ${progress.currentLevelXP} / ${progress.nextLevelXP}`);
console.log(`Percentage: ${progress.percentage}%`);
```

---

## ⚠️ Important Notes

1. **No Minecraft Integration:** Unlike the previous system, this custom formula does NOT sync with Minecraft XP. It's platform-specific.

2. **Exponential Growth:** The system is designed to be VERY challenging at higher levels. Reaching level 100 requires over 10 million XP!

3. **Balance:** XP rewards may need tuning based on user engagement patterns.

4. **Performance:** Level calculation is iterative but cached in the database. Calculations are fast up to level ~200.

---

**Last Updated:** 2025-01-23
**System Version:** 2.0 (Exponential Scaling)
