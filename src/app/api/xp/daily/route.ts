import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users, dailyStreaks, xpTransactions } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { awardXP, XP_REWARDS } from '@/lib/xp-system';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Daily Login XP System
 * Awards base XP + streak bonus for daily logins
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day
    const todayTimestamp = Math.floor(today.getTime() / 1000);

    // Check if user already logged in today
    const [existingStreak] = await db
      .select()
      .from(dailyStreaks)
      .where(eq(dailyStreaks.userId, userId))
      .limit(1);

    // If already logged in today, return current streak info
    if (existingStreak && existingStreak.lastLoginDate) {
      const lastLoginDate = new Date(existingStreak.lastLoginDate);
      lastLoginDate.setHours(0, 0, 0, 0);
      const lastLoginTimestamp = Math.floor(lastLoginDate.getTime() / 1000);

      if (lastLoginTimestamp === todayTimestamp) {
        return NextResponse.json({
          alreadyClaimed: true,
          currentStreak: existingStreak.currentStreak,
          longestStreak: existingStreak.longestStreak,
          lastLoginDate: existingStreak.lastLoginDate,
          message: 'Already claimed today\'s login XP',
        });
      }
    }

    // Calculate streak
    let currentStreak = 1;
    let longestStreak = 1;

    if (existingStreak) {
      const lastLogin = new Date(existingStreak.lastLoginDate || 0);
      lastLogin.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Check if last login was yesterday (continuous streak)
      if (lastLogin.getTime() === yesterday.getTime()) {
        currentStreak = existingStreak.currentStreak + 1;
        longestStreak = Math.max(currentStreak, existingStreak.longestStreak);
      } else {
        // Streak broken, reset to 1
        currentStreak = 1;
        longestStreak = existingStreak.longestStreak;
      }
    }

    // Calculate bonus XP based on streak
    const baseXP = XP_REWARDS.DAILY_LOGIN; // 5 XP
    let streakBonus = 0;

    if (currentStreak >= 30) {
      streakBonus = 50; // Month milestone
    } else if (currentStreak >= 14) {
      streakBonus = 20; // 2 week milestone
    } else if (currentStreak >= 7) {
      streakBonus = 10; // Week milestone
    } else if (currentStreak >= 3) {
      streakBonus = 2; // Small bonus for 3+ days
    }

    const totalXP = baseXP + streakBonus;

    // Award XP
    const xpResult = await awardXP(
      userId,
      totalXP,
      'daily_login',
      undefined,
      `Daily login (${currentStreak} day streak)`
    );

    // Update or create daily streak record
    if (existingStreak) {
      await db
        .update(dailyStreaks)
        .set({
          currentStreak,
          longestStreak,
          lastLoginDate: new Date(),
        })
        .where(eq(dailyStreaks.userId, userId));
    } else {
      await db.insert(dailyStreaks).values({
        userId,
        currentStreak,
        longestStreak,
        lastLoginDate: new Date(),
      });
    }

    // Return success with streak info
    return NextResponse.json({
      success: true,
      claimed: true,
      xpAwarded: totalXP,
      baseXP,
      streakBonus,
      currentStreak,
      longestStreak,
      leveledUp: xpResult.leveledUp,
      newLevel: xpResult.newLevel,
      totalXP: xpResult.newXP,
      message: streakBonus > 0 
        ? `+${totalXP} XP (${baseXP} base + ${streakBonus} streak bonus!)` 
        : `+${totalXP} XP`,
    });
  } catch (error) {
    console.error('Error processing daily login:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Get current streak information
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    const [streak] = await db
      .select()
      .from(dailyStreaks)
      .where(eq(dailyStreaks.userId, userId))
      .limit(1);

    if (!streak) {
      return NextResponse.json({
        hasStreak: false,
        currentStreak: 0,
        longestStreak: 0,
        canClaimToday: true,
      });
    }

    // Check if can claim today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastLogin = new Date(streak.lastLoginDate || 0);
    lastLogin.setHours(0, 0, 0, 0);
    const canClaimToday = lastLogin.getTime() !== today.getTime();

    return NextResponse.json({
      hasStreak: true,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastLoginDate: streak.lastLoginDate,
      canClaimToday,
    });
  } catch (error) {
    console.error('Error fetching streak info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
