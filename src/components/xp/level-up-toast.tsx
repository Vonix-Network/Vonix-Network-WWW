'use client';

import { toast } from 'sonner';
import { Trophy, Sparkles, Crown, Zap } from 'lucide-react';
import { getColorForLevel, getTitleForLevel } from '@/lib/xp-utils';

export interface LevelUpData {
  newLevel: number;
  title?: string;
  xp: number;
  reward?: {
    title?: string;
    description?: string;
  };
}

/**
 * Show a level-up notification toast
 */
export function showLevelUpNotification(data: LevelUpData) {
  const levelColor = getColorForLevel(data.newLevel);
  const title = data.title || getTitleForLevel(data.newLevel);

  toast.custom(
    (t) => (
      <div 
        className="glass border-2 rounded-2xl p-6 min-w-[320px] max-w-md shadow-2xl animate-in slide-in-from-top-5 duration-500"
        style={{ borderColor: `${levelColor}80` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${levelColor}20` }}
            >
              <Trophy className="h-5 w-5" style={{ color: levelColor }} />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Level Up!</h3>
              <p className="text-sm text-gray-400">Congratulations!</p>
            </div>
          </div>
          <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
        </div>

        {/* Level Info */}
        <div className="text-center py-4 mb-4 glass rounded-xl" style={{ backgroundColor: `${levelColor}10` }}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-3xl font-bold" style={{ color: levelColor }}>
              Level {data.newLevel}
            </span>
            {data.newLevel >= 50 && <Crown className="h-6 w-6 text-yellow-400" />}
          </div>
          <p className="text-sm font-medium" style={{ color: levelColor }}>
            {title}
          </p>
        </div>

        {/* Reward Info */}
        {data.reward && (
          <div className="glass rounded-xl p-3 mb-4 border border-blue-500/20">
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                {data.reward.title && (
                  <p className="text-sm font-semibold text-white mb-1">
                    {data.reward.title}
                  </p>
                )}
                {data.reward.description && (
                  <p className="text-xs text-gray-400">
                    {data.reward.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* XP Info */}
        <div className="text-center text-xs text-gray-500">
          Total XP: {data.xp.toLocaleString()}
        </div>

        {/* Close button hint */}
        <button
          onClick={() => toast.dismiss(t)}
          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
    ),
    {
      duration: 6000, // Show for 6 seconds
      position: 'top-center',
    }
  );
}

/**
 * Show a simpler level-up toast for less prominent notifications
 */
export function showQuickLevelUpToast(newLevel: number, title?: string) {
  const levelColor = getColorForLevel(newLevel);
  const displayTitle = title || getTitleForLevel(newLevel);

  toast.success(
    <div className="flex items-center gap-3">
      <Trophy className="h-5 w-5" style={{ color: levelColor }} />
      <div>
        <p className="font-bold">Level {newLevel} Reached!</p>
        <p className="text-xs text-gray-400">{displayTitle}</p>
      </div>
    </div>,
    {
      duration: 4000,
    }
  );
}
