'use client';

import { User } from 'lucide-react';

interface AvatarProps {
  username: string;
  minecraftUsername?: string | null;
  avatar?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ username, minecraftUsername, avatar, size = 'md', className = '' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  // Priority: custom avatar > minecraft head > fallback
  const imageUrl = avatar || (minecraftUsername ? `https://mc-heads.net/head/${minecraftUsername}` : null);

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={username}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
        onError={(e) => {
          // Fallback to initial if image fails to load
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
      />
    );
  }

  // Fallback to username initial
  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold ${className}`}
    >
      {username[0].toUpperCase()}
    </div>
  );
}

export function AvatarWithFallback({ username, minecraftUsername, avatar, size = 'md', className = '' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const imageUrl = avatar || (minecraftUsername ? `https://mc-heads.net/head/${minecraftUsername}` : null);

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {imageUrl && (
        <img
          src={imageUrl}
          alt={username}
          className={`${sizeClasses[size]} rounded-full object-cover`}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold ${imageUrl ? 'hidden' : ''}`}
      >
        {username[0].toUpperCase()}
      </div>
    </div>
  );
}
