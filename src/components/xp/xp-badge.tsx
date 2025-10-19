'use client';

import { Zap } from 'lucide-react';

interface XPBadgeProps {
  level: number;
  xp: number;
  levelColor?: string;
  title?: string;
  showTitle?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function XPBadge({ 
  level, 
  xp, 
  levelColor = '#10b981',
  title,
  showTitle = false,
  size = 'md' 
}: XPBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`inline-flex items-center gap-1.5 rounded-full font-bold ${sizeClasses[size]}`}
        style={{
          backgroundColor: `${levelColor}20`,
          color: levelColor,
          border: `1.5px solid ${levelColor}60`,
        }}
      >
        <Zap className={`${iconSizes[size]} fill-current`} />
        <span>Lv. {level}</span>
      </div>
      
      {showTitle && title && (
        <span className="text-sm font-medium text-gray-400">
          {title}
        </span>
      )}
    </div>
  );
}
