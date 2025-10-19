'use client';

import { TrendingUp } from 'lucide-react';

interface XPProgressBarProps {
  currentXP: number;
  nextLevelXP: number;
  level: number;
  levelColor?: string;
  showNumbers?: boolean;
  className?: string;
}

export function XPProgressBar({ 
  currentXP, 
  nextLevelXP, 
  level, 
  levelColor = '#10b981',
  showNumbers = true,
  className = '' 
}: XPProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (currentXP / nextLevelXP) * 100));

  return (
    <div className={`w-full ${className}`}>
      {showNumbers && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-400">
            Level {level}
          </span>
          <span className="text-sm font-medium text-gray-400">
            {currentXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
          </span>
        </div>
      )}
      
      <div className="relative h-3 rounded-full bg-gray-700/50 overflow-hidden">
        {/* Background glow */}
        <div 
          className="absolute inset-0 opacity-20 blur-sm"
          style={{ backgroundColor: levelColor }}
        />
        
        {/* Progress bar */}
        <div
          className="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: levelColor,
          }}
        >
          {/* Animated shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>

        {/* Level up indicator */}
        {percentage > 95 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-white animate-bounce" />
            <span className="text-xs font-bold text-white">Almost there!</span>
          </div>
        )}
      </div>

      {showNumbers && (
        <div className="mt-1 text-xs text-gray-500 text-right">
          {Math.round(percentage)}% to next level
        </div>
      )}
    </div>
  );
}
