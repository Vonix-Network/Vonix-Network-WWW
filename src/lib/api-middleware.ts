/**
 * Centralized API Middleware System
 * Handles auth, rate limiting, logging, caching, and error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from './auth';
import { apiRateLimit, strictRateLimit } from './rate-limit';
import { apiLogger } from './api-logger';
import { RBAC } from './rbac';

export interface APIContext {
  session: Awaited<ReturnType<typeof getServerSession>>;
  userId?: number;
  startTime: number;
  requestId: string;
}

export interface APIMiddlewareConfig {
  auth?: 'required' | 'optional' | 'none';
  rateLimit?: 'strict' | 'standard' | 'none';
  requireRole?: 'user' | 'moderator' | 'admin' | 'superadmin';
  cache?: {
    enabled: boolean;
    ttl?: number; // seconds
    key?: string;
  };
}

export type APIHandler<T = any> = (
  request: NextRequest,
  context: APIContext
) => Promise<NextResponse<T>>;

/**
 * Create an API route with standardized middleware
 */
export function createAPIRoute(
  handler: APIHandler,
  config: APIMiddlewareConfig = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = apiLogger.generateRequestId();

    try {
      // 1. Logging
      apiLogger.logRequest(request, { requestId });

      // 2. Rate Limiting
      if (config.rateLimit !== 'none') {
        const rateLimiter = config.rateLimit === 'strict' ? strictRateLimit : apiRateLimit;
        const result = rateLimiter(request);
        
        if (result.limited) {
          const response = NextResponse.json(
            { 
              error: 'Too many requests',
              resetTime: result.resetTime,
              message: 'Please try again later'
            },
            { status: 429 }
          );
          response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
          response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
          return response;
        }
      }

      // 3. Authentication
      let session = null;
      if (config.auth !== 'none') {
        session = await getServerSession();
        
        if (config.auth === 'required' && !session) {
          return NextResponse.json(
            { error: 'Unauthorized', message: 'Authentication required' },
            { status: 401 }
          );
        }
      }

      // 4. Role-based Authorization
      if (config.requireRole && session) {
        const userRole = session.user.role;
        let hasAccess = false;

        switch (config.requireRole) {
          case 'superadmin':
            hasAccess = userRole === 'superadmin';
            break;
          case 'admin':
            hasAccess = RBAC.canAccessAdmin(userRole);
            break;
          case 'moderator':
            hasAccess = RBAC.canAccessModeration(userRole);
            break;
          case 'user':
            hasAccess = true; // All authenticated users
            break;
        }

        if (!hasAccess) {
          return NextResponse.json(
            { error: 'Forbidden', message: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }

      // 5. Build Context
      const context: APIContext = {
        session,
        userId: session?.user?.id ? parseInt(session.user.id) : undefined,
        startTime,
        requestId,
      };

      // 6. Execute Handler
      const response = await handler(request, context);

      // 7. Add Performance Headers
      const duration = Date.now() - startTime;
      response.headers.set('X-Response-Time', `${duration}ms`);
      response.headers.set('X-Request-ID', requestId);

      // 8. Log Response
      apiLogger.logResponse(response.status, duration, { requestId });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      apiLogger.error('API Error', error, { requestId, duration: `${duration}ms` });

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message === 'Unauthorized') {
          return NextResponse.json(
            { error: 'Unauthorized', message: error.message },
            { status: 401 }
          );
        }
        if (error.message === 'Forbidden') {
          return NextResponse.json(
            { error: 'Forbidden', message: error.message },
            { status: 403 }
          );
        }
      }

      // Generic error response
      return NextResponse.json(
        { 
          error: 'Internal Server Error',
          message: process.env.NODE_ENV === 'development' 
            ? (error instanceof Error ? error.message : 'Unknown error')
            : 'An unexpected error occurred',
          requestId
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Simplified API route creators for common patterns
 */
export const API = {
  /**
   * Public route - no auth required
   */
  public: (handler: APIHandler) => createAPIRoute(handler, {
    auth: 'none',
    rateLimit: 'standard',
  }),

  /**
   * Protected route - auth required
   */
  protected: (handler: APIHandler) => createAPIRoute(handler, {
    auth: 'required',
    rateLimit: 'standard',
  }),

  /**
   * Moderator route - moderator or admin required
   */
  moderator: (handler: APIHandler) => createAPIRoute(handler, {
    auth: 'required',
    rateLimit: 'standard',
    requireRole: 'moderator',
  }),

  /**
   * Admin route - admin required
   */
  admin: (handler: APIHandler) => createAPIRoute(handler, {
    auth: 'required',
    rateLimit: 'standard',
    requireRole: 'admin',
  }),

  /**
   * Strict route - strict rate limiting (auth endpoints)
   */
  strict: (handler: APIHandler) => createAPIRoute(handler, {
    auth: 'optional',
    rateLimit: 'strict',
  }),
};
