'use client';

import { DonationRank } from '@/db/schema';

interface UserBadgeProps {
  username: string;
  donationRank?: DonationRank | null;
  showBadge?: boolean;
  className?: string;
}

export function UserBadge({ username, donationRank, showBadge = true, className = '' }: UserBadgeProps) {
  if (!donationRank) {
    return <span className={`font-semibold ${className}`}>{username}</span>;
  }

  const badgeStyle = {
    color: donationRank.textColor,
    textShadow: donationRank.glow ? `0 0 10px ${donationRank.color}, 0 0 20px ${donationRank.color}` : 'none',
  };

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span style={badgeStyle} className="font-semibold">
        {username}
      </span>
      {showBadge && donationRank.badge && (
        <span
          className="px-2 py-0.5 rounded text-xs font-semibold"
          style={{
            backgroundColor: `${donationRank.color}20`,
            color: donationRank.textColor,
            border: `1px solid ${donationRank.color}40`,
          }}
        >
          {donationRank.badge}
        </span>
      )}
      {showBadge && donationRank.icon && (
        <span className="text-sm">{donationRank.icon}</span>
      )}
    </span>
  );
}

interface UserAvatarProps {
  username: string;
  avatar?: string | null;
  minecraftUsername?: string | null;
  donationRank?: DonationRank | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ 
  username, 
  avatar, 
  minecraftUsername, 
  donationRank,
  size = 'md',
  className = '' 
}: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
  };

  const borderStyle = donationRank ? {
    borderColor: donationRank.color,
    borderWidth: '2px',
    boxShadow: donationRank.glow ? `0 0 15px ${donationRank.color}` : 'none',
  } : {};

  const avatarUrl = avatar || 
    (minecraftUsername ? `https://mc-heads.net/avatar/${minecraftUsername}` : null);

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center font-bold ${className}`}
      style={borderStyle}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
          {username[0]?.toUpperCase() || '?'}
        </div>
      )}
    </div>
  );
}
