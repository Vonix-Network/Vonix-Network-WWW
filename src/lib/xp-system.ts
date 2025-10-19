/**
 * XP and Leveling System
 * 
 * Comprehensive XP system with leveling, achievements, and rewards
 */

import { db } from '@/db';
import { users, xpTransactions, userAchievements, achievements, levelRewards, dailyStreaks } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

// Import and re-export utility functions from xp-utils
import { 
  getXPForLevel, 
  getTotalXPForLevel, 
  getLevelFromXP, 
  getLevelProgress,
  getTitleForLevel as getTitleForLevelUtil,
  getColorForLevel as getColorForLevelUtil
} from './xp-utils';

// Re-export with original names
export { 
  getXPForLevel, 
  getTotalXPForLevel, 
  getLevelFromXP, 
  getLevelProgress,
  getTitleForLevelUtil as getTitleForLevel,
  getColorForLevelUtil as getColorForLevel 
};

// ============================================================================
// LEVEL CALCULATION (Extended Functions)
// ============================================================================

/**
 * Get XP progress towards next level
 */
export function getXPProgress(xp: number): {
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progress: number;
  percentage: number;
} {
  const level = getLevelFromXP(xp);
  const totalXPForCurrentLevel = getTotalXPForLevel(level);
  const xpInCurrentLevel = xp - totalXPForCurrentLevel;
  const xpForNextLevel = getXPForLevel(level);
  const percentage = (xpInCurrentLevel / xpForNextLevel) * 100;
  
  return {
    level,
    currentLevelXP: xpInCurrentLevel,
    nextLevelXP: xpForNextLevel,
    progress: xpInCurrentLevel,
    percentage: Math.min(100, Math.max(0, percentage)),
  };
}

// ============================================================================
// XP REWARDS CONFIGURATION
// ============================================================================

export const XP_REWARDS = {
  // Social Platform
  POST_CREATE: 15,
  POST_LIKE: 2,
  POST_DELETE: -10,
  COMMENT_CREATE: 5,
  COMMENT_LIKE: 1,
  
  // Forum
  FORUM_POST_CREATE: 20,
  FORUM_REPLY_CREATE: 10,
  FORUM_UPVOTE_RECEIVED: 3,
  FORUM_DOWNVOTE_RECEIVED: -2,
  
  // Social Interactions
  FRIEND_REQUEST_ACCEPTED: 10,
  PROFILE_COMPLETE: 25,
  
  // Engagement
  DAILY_LOGIN: 5,
  STREAK_BONUS: 10, // Per day of streak (multiplied by streak count)
  
  // Milestones
  FIRST_POST: 50,
  FIRST_COMMENT: 25,
  FIRST_FRIEND: 30,
  
  // Moderation (negative)
  POST_REMOVED: -50,
  SPAM_DETECTED: -100,
} as const;

export type XPSource = keyof typeof XP_REWARDS;

// ============================================================================
// XP AWARDING
// ============================================================================

/**
 * Award XP to a user
 */
export async function awardXP(
  userId: number,
  amount: number,
  source: string,
  sourceId?: number,
  description?: string
): Promise<{
  newXP: number;
  newLevel: number;
  oldLevel: number;
  leveledUp: boolean;
  transaction: any;
}> {
  try {
    // Get current user data
    const [user] = await db
      .select({
        xp: users.xp,
        level: users.level,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    const oldXP = user.xp;
    const oldLevel = user.level;
    const newXP = Math.max(0, oldXP + amount);
    const newLevel = getLevelFromXP(newXP);
    const leveledUp = newLevel > oldLevel;

    // Create transaction record
    const [transaction] = await db
      .insert(xpTransactions)
      .values({
        userId,
        amount,
        source,
        sourceId,
        description: description || `${amount > 0 ? '+' : ''}${amount} XP from ${source}`,
        createdAt: new Date(),
      })
      .returning();

    // Update user XP and level
    await db
      .update(users)
      .set({
        xp: newXP,
        level: newLevel,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // If leveled up, check for level rewards
    if (leveledUp) {
      await handleLevelUp(userId, newLevel);
    }

    return {
      newXP,
      newLevel,
      oldLevel,
      leveledUp,
      transaction,
    };
  } catch (error) {
    console.error('Error awarding XP:', error);
    throw error;
  }
}

/**
 * Handle level up rewards and notifications
 */
async function handleLevelUp(userId: number, newLevel: number): Promise<void> {
  try {
    // Check for level rewards
    const [reward] = await db
      .select()
      .from(levelRewards)
      .where(eq(levelRewards.level, newLevel))
      .limit(1);

    if (reward) {
      // Award title if applicable
      if (reward.title) {
        await db
          .update(users)
          .set({ title: reward.title })
          .where(eq(users.id, userId));
      }

      // Create notification for level up with reward
      // This will be handled by the notification system
    }

    // Check for level-based achievements
    await checkLevelAchievements(userId, newLevel);
  } catch (error) {
    console.error('Error handling level up:', error);
  }
}

// ============================================================================
// ACHIEVEMENTS
// ============================================================================

/**
 * Check and unlock achievements for a user
 */
export async function checkAchievements(
  userId: number,
  type: 'post' | 'comment' | 'friend' | 'level' | 'streak' | 'forum',
  count?: number
): Promise<string[]> {
  const unlockedAchievements: string[] = [];

  try {
    // Get all achievements of this type
    const allAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievements.category, type === 'level' ? 'leveling' : 'social'));

    for (const achievement of allAchievements) {
      // Parse requirement
      const requirement = JSON.parse(achievement.requirement);
      
      // Check if user already has this achievement
      const [existing] = await db
        .select()
        .from(userAchievements)
        .where(
          and(
            eq(userAchievements.userId, userId),
            eq(userAchievements.achievementId, achievement.id),
            eq(userAchievements.completed, true)
          )
        )
        .limit(1);

      if (existing) continue;

      // Check if requirement is met
      let requirementMet = false;
      
      if (requirement.type === 'count' && count !== undefined) {
        requirementMet = count >= requirement.value;
      }

      if (requirementMet) {
        // Unlock achievement
        await db.insert(userAchievements).values({
          userId,
          achievementId: achievement.id,
          progress: count || 0,
          completed: true,
          completedAt: new Date(),
          createdAt: new Date(),
        });

        // Award XP for achievement
        if (achievement.xpReward > 0) {
          await awardXP(
            userId,
            achievement.xpReward,
            'achievement_unlocked',
            undefined,
            `Unlocked: ${achievement.name}`
          );
        }

        unlockedAchievements.push(achievement.id);
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
  }

  return unlockedAchievements;
}

/**
 * Check level-specific achievements
 */
async function checkLevelAchievements(userId: number, level: number): Promise<void> {
  const milestones = [5, 10, 25, 50, 75, 100];
  
  if (milestones.includes(level)) {
    await checkAchievements(userId, 'level', level);
  }
}

// ============================================================================
// DAILY STREAKS
// ============================================================================

/**
 * Update daily streak and award bonus XP
 */
export async function updateDailyStreak(userId: number): Promise<{
  currentStreak: number;
  bonusXP: number;
  isNewDay: boolean;
}> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get or create streak record
    let [streak] = await db
      .select()
      .from(dailyStreaks)
      .where(eq(dailyStreaks.userId, userId))
      .limit(1);

    if (!streak) {
      // Create new streak
      [streak] = await db
        .insert(dailyStreaks)
        .values({
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastLoginDate: today,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Award first day XP
      await awardXP(userId, XP_REWARDS.DAILY_LOGIN, 'daily_login');

      return {
        currentStreak: 1,
        bonusXP: XP_REWARDS.DAILY_LOGIN,
        isNewDay: true,
      };
    }

    // Check if already logged in today
    const lastLogin = new Date(streak.lastLoginDate!);
    lastLogin.setHours(0, 0, 0, 0);

    if (lastLogin.getTime() === today.getTime()) {
      return {
        currentStreak: streak.currentStreak,
        bonusXP: 0,
        isNewDay: false,
      };
    }

    // Check if streak continues (yesterday)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let newStreak: number;
    if (lastLogin.getTime() === yesterday.getTime()) {
      // Streak continues
      newStreak = streak.currentStreak + 1;
    } else {
      // Streak broken
      newStreak = 1;
    }

    // Calculate bonus XP (increases with streak)
    const bonusXP = XP_REWARDS.DAILY_LOGIN + (newStreak > 1 ? Math.min(newStreak * 2, 50) : 0);

    // Update streak
    await db
      .update(dailyStreaks)
      .set({
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, streak.longestStreak),
        lastLoginDate: today,
        updatedAt: new Date(),
      })
      .where(eq(dailyStreaks.userId, userId));

    // Award XP
    await awardXP(
      userId,
      bonusXP,
      'daily_streak',
      undefined,
      `${newStreak} day streak! 🔥`
    );

    // Check streak achievements
    if (newStreak % 7 === 0) {
      await checkAchievements(userId, 'streak', newStreak);
    }

    return {
      currentStreak: newStreak,
      bonusXP,
      isNewDay: true,
    };
  } catch (error) {
    console.error('Error updating daily streak:', error);
    return {
      currentStreak: 0,
      bonusXP: 0,
      isNewDay: false,
    };
  }
}

// ============================================================================
// LEADERBOARD
// ============================================================================

/**
 * Get XP leaderboard
 */
export async function getXPLeaderboard(limit = 100): Promise<any[]> {
  return await db
    .select({
      id: users.id,
      username: users.username,
      avatar: users.avatar,
      xp: users.xp,
      level: users.level,
      title: users.title,
      role: users.role,
    })
    .from(users)
    .orderBy(desc(users.xp))
    .limit(limit);
}

/**
 * Get user's rank position
 */
export async function getUserRank(userId: number): Promise<number> {
  const [result] = await db.all<{ rank: number }>(sql`
    SELECT COUNT(*) + 1 as rank
    FROM ${users}
    WHERE xp > (SELECT xp FROM ${users} WHERE id = ${userId})
  `);
  
  return result?.rank || 0;
}
