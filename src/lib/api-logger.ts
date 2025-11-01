/**
 * Enterprise-grade API logging utility
 * Provides structured logging with request tracking and performance monitoring
 */

import { NextRequest } from 'next/server';

export interface LogContext {
  requestId?: string;
  userId?: string;
  method?: string;
  path?: string;
  duration?: number | string;
  status?: number;
  error?: string;
  [key: string]: any;
}

class APILogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Generate a unique request ID
   */
  generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format log message with context
   */
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}]${contextStr} ${message}`;
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(this.formatMessage('info', message, context));
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('warn', message, context));
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = {
      ...context,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
    console.error(this.formatMessage('error', message, errorContext));
  }

  /**
   * Log API request start
   */
  logRequest(request: NextRequest, context?: LogContext) {
    const logContext: LogContext = {
      ...context,
      method: request.method,
      path: request.nextUrl.pathname,
      userAgent: request.headers.get('user-agent') || 'unknown',
    };
    
    if (this.isDevelopment) {
      this.info(`API Request: ${request.method} ${request.nextUrl.pathname}`, logContext);
    }
  }

  /**
   * Log API response
   */
  logResponse(status: number, duration: number, context?: LogContext) {
    const logContext: LogContext = {
      ...context,
      status,
      duration: `${duration}ms`,
    };

    if (this.isDevelopment || (this.isProduction && status >= 400)) {
      const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
      const message = `API Response: ${status} (${duration}ms)`;
      
      if (level === 'error') {
        this.error(message, undefined, logContext);
      } else if (level === 'warn') {
        this.warn(message, logContext);
      } else {
        this.info(message, logContext);
      }
    }
  }

  /**
   * Create performance timer
   */
  startTimer() {
    const start = Date.now();
    return {
      end: () => Date.now() - start,
    };
  }
}

export const apiLogger = new APILogger();

/**
 * Middleware helper for API route logging
 */
export function withLogging<T>(
  handler: (request: NextRequest) => Promise<Response>,
) {
  return async (request: NextRequest): Promise<Response> => {
    const requestId = apiLogger.generateRequestId();
    const timer = apiLogger.startTimer();

    apiLogger.logRequest(request, { requestId });

    try {
      const response = await handler(request);
      const duration = timer.end();
      
      apiLogger.logResponse(response.status, duration, {
        requestId,
        path: request.nextUrl.pathname,
      });

      return response;
    } catch (error) {
      const duration = timer.end();
      apiLogger.error('API Error', error, {
        requestId,
        path: request.nextUrl.pathname,
        duration: `${duration}ms`,
      });
      throw error;
    }
  };
}
