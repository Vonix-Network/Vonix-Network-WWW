/**
 * Skeleton Loading Component
 * Professional loading placeholders
 */

import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  const variantStyles = {
    default: 'rounded-lg',
    text: 'rounded h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
  };

  return (
    <div
      className={cn(
        'bg-white/10 animate-shimmer',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

// Convenience Components
export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return <Skeleton variant="circular" className={sizes[size]} />;
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          variant="text" 
          className={i === lines - 1 ? 'w-3/4' : 'w-full'} 
        />
      ))}
    </div>
  );
}
