/**
 * Production-ready rate limiting
 * Prevents abuse and ensures fair usage
 */

import { NextRequest } from 'next/server';
import { logger } from './logger';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (for production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Get client identifier from request
 */
function getClientId(request: NextRequest): string {
  // Try to get IP from various headers (for reverse proxy support)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  return ip;
}

/**
 * Rate limit middleware
 */
export function rateLimit(config: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
}) {
  return (request: NextRequest): { limited: boolean; remaining: number; resetTime: number } => {
    // Skip rate limiting if disabled
    if (process.env.RATE_LIMIT_ENABLED === 'false') {
      return { limited: false, remaining: config.maxRequests, resetTime: Date.now() + config.windowMs };
    }

    const clientId = getClientId(request);
    const now = Date.now();
    const key = `${clientId}:${request.nextUrl.pathname}`;

    let entry = rateLimitStore.get(key);

    // Create new entry if doesn't exist or expired
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    // Increment request count
    entry.count++;

    const limited = entry.count > config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - entry.count);

    if (limited) {
      logger.warn('Rate limit exceeded', {
        clientId,
        path: request.nextUrl.pathname,
        count: entry.count,
        limit: config.maxRequests,
      });
    }

    return {
      limited,
      remaining,
      resetTime: entry.resetTime,
    };
  };
}

/**
 * Strict rate limit for sensitive endpoints (auth, admin)
 */
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
});

/**
 * Standard rate limit for API endpoints
 */
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
});

/**
 * Lenient rate limit for public endpoints
 */
export const publicRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
});
