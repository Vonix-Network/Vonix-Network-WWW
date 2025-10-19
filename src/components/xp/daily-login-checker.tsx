'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Calendar, Flame, Trophy } from 'lucide-react';
import { showLevelUpNotification } from './level-up-toast';

/**
 * Daily Login Checker
 * Automatically checks and claims daily login XP when user visits the site
 */
export function DailyLoginChecker() {
  const { data: session, status } = useSession();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Only check once per session and only for authenticated users
    if (status === 'authenticated' && session?.user && !hasChecked) {
      checkDailyLogin();
      setHasChecked(true);
    }
  }, [status, session, hasChecked]);

  const checkDailyLogin = async () => {
    try {
      const response = await fetch('/api/xp/daily', {
        method: 'POST',
      });

      if (!response.ok) {
        return; // Silently fail
      }

      const data = await response.json();

      if (data.claimed && !data.alreadyClaimed) {
        // Show success toast with streak info
        const streakEmoji = data.currentStreak >= 7 ? '🔥' : data.currentStreak >= 3 ? '⭐' : '✨';
        
        toast.custom(
          (t) => (
            <div className="glass border border-green-500/30 rounded-xl p-4 min-w-[300px] shadow-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-1 flex items-center gap-2">
                    Daily Login Bonus! {streakEmoji}
                  </h4>
                  <p className="text-sm text-gray-300 mb-2">{data.message}</p>
                  {data.currentStreak > 1 && (
                    <div className="flex items-center gap-2 text-xs">
                      <Flame className="h-4 w-4 text-orange-400" />
                      <span className="text-orange-400 font-semibold">
                        {data.currentStreak} Day Streak!
                      </span>
                      {data.longestStreak > data.currentStreak && (
                        <span className="text-gray-500">
                          (Best: {data.longestStreak})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ),
          {
            duration: 5000,
            position: 'top-right',
          }
        );

        // Check for level-up
        if (data.leveledUp) {
          setTimeout(() => {
            showLevelUpNotification({
              newLevel: data.newLevel,
              xp: data.totalXP,
            });
          }, 1000); // Delay to show after the daily login toast
        }
      }
    } catch (error) {
      console.error('Error checking daily login:', error);
      // Silently fail - don't bother the user
    }
  };

  // This component doesn't render anything
  return null;
}

/**
 * Daily Streak Display Component
 * Shows current streak on dashboard or profile
 */
export function DailyStreakDisplay() {
  const [streakData, setStreakData] = useState<{
    currentStreak: number;
    longestStreak: number;
    canClaimToday: boolean;
  } | null>(null);

  useEffect(() => {
    fetchStreakData();
  }, []);

  const fetchStreakData = async () => {
    try {
      const response = await fetch('/api/xp/daily');
      if (response.ok) {
        const data = await response.json();
        setStreakData(data);
      }
    } catch (error) {
      console.error('Error fetching streak data:', error);
    }
  };

  if (!streakData || streakData.currentStreak === 0) {
    return null;
  }

  return (
    <div className="glass border border-orange-500/20 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
          <Flame className="h-6 w-6 text-orange-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-white flex items-center gap-2">
            {streakData.currentStreak} Day Streak
            {streakData.currentStreak >= 7 && <Trophy className="h-4 w-4 text-yellow-400" />}
          </h3>
          <p className="text-sm text-gray-400">
            {streakData.canClaimToday ? (
              <span className="text-green-400">Come back tomorrow to continue!</span>
            ) : (
              <span>Login claimed today ✓</span>
            )}
          </p>
          {streakData.longestStreak > streakData.currentStreak && (
            <p className="text-xs text-gray-500 mt-1">
              Best streak: {streakData.longestStreak} days
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
