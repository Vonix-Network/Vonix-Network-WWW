/**
 * Error Tracking Service
 * 
 * Centralized error tracking that can be extended with Sentry, LogRocket, etc.
 * For now, provides structured logging with optional Sentry integration.
 */

interface ErrorContext {
  user?: {
    id?: number;
    username?: string;
    email?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

class ErrorTracker {
  private isProduction = process.env.NODE_ENV === 'production';
  private sentryEnabled = !!process.env.NEXT_PUBLIC_SENTRY_DSN;

  /**
   * Capture an exception with context
   */
  captureException(error: Error, context?: ErrorContext): void {
    // Log to console in development
    if (!this.isProduction) {
      console.error('Error captured:', error);
      if (context) {
        console.error('Context:', context);
      }
    }

    // Send to Sentry if configured
    if (this.sentryEnabled && typeof window !== 'undefined') {
      // @ts-ignore - Sentry will be available if configured
      if (window.Sentry) {
        // @ts-ignore
        window.Sentry.captureException(error, {
          user: context?.user,
          tags: context?.tags,
          extra: context?.extra,
        });
      }
    }

    // Log to server in production
    if (this.isProduction && typeof window !== 'undefined') {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          context,
          timestamp: new Date().toISOString(),
        }),
      }).catch(console.error);
    }
  }

  /**
   * Capture a message with severity level
   */
  captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context?: ErrorContext
  ): void {
    if (!this.isProduction) {
      console[level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log'](
        `[${level.toUpperCase()}]`,
        message,
        context
      );
    }

    if (this.sentryEnabled && typeof window !== 'undefined') {
      // @ts-ignore
      if (window.Sentry) {
        // @ts-ignore
        window.Sentry.captureMessage(message, {
          level,
          user: context?.user,
          tags: context?.tags,
          extra: context?.extra,
        });
      }
    }
  }

  /**
   * Set user context for error tracking
   */
  setUser(user: { id?: number; username?: string; email?: string } | null): void {
    if (this.sentryEnabled && typeof window !== 'undefined') {
      // @ts-ignore
      if (window.Sentry) {
        // @ts-ignore
        window.Sentry.setUser(user);
      }
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, data?: Record<string, any>): void {
    if (this.sentryEnabled && typeof window !== 'undefined') {
      // @ts-ignore
      if (window.Sentry) {
        // @ts-ignore
        window.Sentry.addBreadcrumb({
          message,
          data,
          timestamp: Date.now() / 1000,
        });
      }
    }
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();

// Convenience exports
export const captureException = errorTracker.captureException.bind(errorTracker);
export const captureMessage = errorTracker.captureMessage.bind(errorTracker);
export const setUser = errorTracker.setUser.bind(errorTracker);
export const addBreadcrumb = errorTracker.addBreadcrumb.bind(errorTracker);
