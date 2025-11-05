/**
 * Enterprise-grade Input Component
 * Professional form inputs with labels and error states
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export interface FormErrorProps {
  message?: string;
}

// Input Component
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, icon: Icon, iconPosition = 'left', ...props }, ref) => {
    return (
      <div className="relative">
        {Icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
        )}
        
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-lg border bg-white/5 backdrop-blur-sm px-3 py-2 text-sm transition-all duration-300',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-error focus-visible:ring-error' : 'border-white/10',
            Icon && iconPosition === 'left' && 'pl-10',
            Icon && iconPosition === 'right' && 'pr-10',
            className
          )}
          ref={ref}
          {...props}
        />
        
        {Icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

// Textarea Component
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-lg border bg-white/5 backdrop-blur-sm px-3 py-2 text-sm transition-all duration-300',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'resize-none',
          error ? 'border-error focus-visible:ring-error' : 'border-white/10',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

// Form Field Container
export function FormField({ children, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {children}
    </div>
  );
}

// Label Component
export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-error ml-1">*</span>}
      </label>
    );
  }
);
Label.displayName = 'Label';

// Form Description (Helper Text)
export function FormDescription({ className, children, ...props }: FormDescriptionProps) {
  return (
    <p
      className={cn('text-xs text-muted-foreground', className)}
      {...props}
    >
      {children}
    </p>
  );
}

// Form Error Message
export function FormError({ message }: FormErrorProps) {
  if (!message) return null;

  return (
    <p className="text-xs text-error font-medium animate-slide-in-down">
      {message}
    </p>
  );
}
