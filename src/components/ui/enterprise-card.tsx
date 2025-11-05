/**
 * Enterprise-grade Card Component
 * Professional glass morphism design with multiple variants
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

export interface EnterpriseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'bordered' | 'gradient';
  hover?: boolean;
  glow?: boolean;
  children?: React.ReactNode;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  iconClassName?: string;
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  gradient?: boolean;
}

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

// Main Card Component
export const Card = React.forwardRef<HTMLDivElement, EnterpriseCardProps>(
  ({ className, variant = 'glass', hover = true, glow = false, children, ...props }, ref) => {
    const variantStyles = {
      glass: 'bg-white/5 backdrop-blur-lg border border-white/10',
      solid: 'bg-card border border-border',
      bordered: 'bg-transparent border-2 border-white/20',
      gradient: 'bg-gradient-to-br from-white/10 to-white/5 border border-white/10',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl transition-all duration-300',
          variantStyles[variant],
          hover && 'hover:scale-[1.02] hover:shadow-glass-lg hover:border-white/20',
          glow && 'shadow-glow',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

// Card Header
export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, icon: Icon, iconClassName, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-start justify-between space-x-4 p-6 pb-4', className)}
        {...props}
      >
        <div className="flex-1">
          {children}
        </div>
        {Icon && (
          <div className={cn(
            'rounded-lg p-2 bg-primary/10',
            iconClassName
          )}>
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
      </div>
    );
  }
);
CardHeader.displayName = 'CardHeader';

// Card Title
export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, gradient = false, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn(
          'text-2xl font-semibold leading-none tracking-tight',
          gradient && 'gradient-text',
          className
        )}
        {...props}
      >
        {children}
      </h3>
    );
  }
);
CardTitle.displayName = 'CardTitle';

// Card Description
export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-muted-foreground mt-1.5', className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);
CardDescription.displayName = 'CardDescription';

// Card Content
export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('p-6 pt-0', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardContent.displayName = 'CardContent';

// Card Footer
export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center p-6 pt-0', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardFooter.displayName = 'CardFooter';
