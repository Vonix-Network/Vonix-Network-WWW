/**
 * Enterprise-grade Modal Component
 * Professional dialog with animations and backdrop
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from './enterprise-button';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
}

export interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export interface ModalTitleProps {
  children: React.ReactNode;
  className?: string;
}

export interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
}

export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

const sizeStyles = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl',
};

// Main Modal Component
export function Modal({
  open,
  onClose,
  children,
  size = 'md',
  className,
  closeOnBackdrop = true,
  showCloseButton = true,
}: ModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      
      {/* Modal Container */}
      <div
        className={cn(
          'relative w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl',
          'animate-scale-in',
          sizeStyles[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all duration-200 z-10"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        
        {children}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// Modal Header
export function ModalHeader({ children, className }: ModalHeaderProps) {
  return (
    <div className={cn('px-6 pt-6 pb-4', className)}>
      {children}
    </div>
  );
}

// Modal Title
export function ModalTitle({ children, className }: ModalTitleProps) {
  return (
    <h2 className={cn('text-2xl font-bold', className)}>
      {children}
    </h2>
  );
}

// Modal Content
export function ModalContent({ children, className }: ModalContentProps) {
  return (
    <div className={cn('px-6 py-4 max-h-[60vh] overflow-y-auto', className)}>
      {children}
    </div>
  );
}

// Modal Footer
export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('px-6 py-4 flex items-center justify-end gap-3 border-t border-white/10', className)}>
      {children}
    </div>
  );
}

// Convenience: Confirmation Modal
export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <ModalHeader>
        <ModalTitle>{title}</ModalTitle>
      </ModalHeader>
      <ModalContent>
        <p className="text-muted-foreground">{description}</p>
      </ModalContent>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
