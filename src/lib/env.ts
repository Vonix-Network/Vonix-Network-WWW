/**
 * Environment variable validation
 * Ensures all required environment variables are set
 */

import { logger } from './logger';

interface EnvConfig {
  // Database
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  
  // Authentication
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;
  
  // Optional Discord
  DISCORD_BOT_TOKEN?: string;
  DISCORD_CHANNEL_ID?: string;
  DISCORD_WEBHOOK_URL?: string;
  
  // Application
  NODE_ENV: 'development' | 'production' | 'test';
  PORT?: string;
  
  // Feature flags
  ENABLE_DISCORD_CHAT?: string;
  ENABLE_FORUM?: string;
  ENABLE_SOCIAL?: string;
  ENABLE_DONATIONS?: string;
  
  // Rate limiting
  RATE_LIMIT_ENABLED?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;
  RATE_LIMIT_WINDOW_MS?: string;
  
  // Logging
  LOG_LEVEL?: string;
}

const requiredEnvVars = [
  'TURSO_DATABASE_URL',
  'TURSO_AUTH_TOKEN',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
] as const;

const optionalEnvVars = [
  'DISCORD_BOT_TOKEN',
  'DISCORD_CHANNEL_ID',
  'DISCORD_WEBHOOK_URL',
  'PORT',
  'ENABLE_DISCORD_CHAT',
  'ENABLE_FORUM',
  'ENABLE_SOCIAL',
  'ENABLE_DONATIONS',
  'RATE_LIMIT_ENABLED',
  'RATE_LIMIT_MAX_REQUESTS',
  'RATE_LIMIT_WINDOW_MS',
  'LOG_LEVEL',
] as const;

/**
 * Validate environment variables
 */
export function validateEnv(): EnvConfig {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const error = `Missing required environment variables: ${missing.join(', ')}`;
    logger.error(error);
    throw new Error(error);
  }

  // Check optional but recommended variables
  if (!process.env.DISCORD_BOT_TOKEN) {
    warnings.push('DISCORD_BOT_TOKEN not set - Discord integration will be disabled');
  }

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.LOG_LEVEL) {
      warnings.push('LOG_LEVEL not set - defaulting to "info"');
    }
    
    if (process.env.NEXTAUTH_URL?.includes('localhost')) {
      warnings.push('NEXTAUTH_URL contains localhost - this should be your production domain');
    }
  }

  // Log warnings
  if (warnings.length > 0) {
    warnings.forEach(warning => logger.warn(warning));
  }

  return process.env as unknown as EnvConfig;
}

/**
 * Get validated environment config
 */
export function getEnv(): EnvConfig {
  return process.env as unknown as EnvConfig;
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof Pick<EnvConfig, 'ENABLE_DISCORD_CHAT' | 'ENABLE_FORUM' | 'ENABLE_SOCIAL' | 'ENABLE_DONATIONS'>): boolean {
  const value = process.env[feature];
  return value !== 'false' && value !== '0';
}

// Validate on module load (server-side only)
if (typeof window === 'undefined') {
  try {
    validateEnv();
    logger.info('Environment variables validated successfully');
  } catch (error) {
    // Don't throw during build time
    if (process.env.NODE_ENV !== 'production' || process.argv.includes('build')) {
      logger.warn('Environment validation skipped during build');
    }
  }
}
