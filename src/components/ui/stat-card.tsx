/**
 * Enterprise StatCard Component
 * For displaying key metrics with trends and icons
 */

import React from 'react';
import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './enterprise-card';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  iconClassName?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

const variantStyles = {
  default: {
    icon: 'bg-primary/10 text-primary',
    border: 'border-primary/20',
  },
  success: {
    icon: 'bg-success/10 text-success',
    border: 'border-success/20',
  },
  warning: {
    icon: 'bg-warning/10 text-warning',
    border: 'border-warning/20',
  },
  error: {
    icon: 'bg-error/10 text-error',
    border: 'border-error/20',
  },
  info: {
    icon: 'bg-info/10 text-info',
    border: 'border-info/20',
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  loading = false,
  onClick,
  className,
  iconClassName,
  variant = 'default',
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card
      className={cn(
        'group',
        onClick && 'cursor-pointer',
        onClick && 'hover:border-white/30',
        styles.border,
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between space-x-4">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            
            {loading ? (
              <div className="h-8 w-32 bg-white/10 rounded animate-pulse" />
            ) : (
              <div className="flex items-baseline space-x-2">
                <p className="text-3xl font-bold">{value}</p>
                
                {trend && (
                  <div className={cn(
                    'flex items-center space-x-1 text-sm font-medium px-2 py-0.5 rounded-full',
                    trend.isPositive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                  )}>
                    {trend.isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>{Math.abs(trend.value)}%</span>
                  </div>
                )}
              </div>
            )}
            
            {description && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          
          <div className={cn(
            'rounded-lg p-3 transition-all duration-300',
            styles.icon,
            onClick && 'group-hover:scale-110',
            iconClassName
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
