/**
 * Square Payments Configuration
 * 
 * This module handles Square integration configuration and provides
 * a centralized way to check if Square is enabled.
 */

export interface SquareConfig {
  enabled: boolean;
  accessToken: string | null;
  locationId: string | null;
  applicationId: string | null;
  environment: 'sandbox' | 'production';
}

/**
 * Check if Square integration is enabled
 * @returns {boolean} True if Square is enabled and configured
 */
export function isSquareEnabled(): boolean {
  const enabled = process.env.SQUARE_INTEGRATION_ENABLED === 'true';
  const hasCredentials = !!(
    process.env.SQUARE_ACCESS_TOKEN &&
    process.env.SQUARE_LOCATION_ID &&
    process.env.SQUARE_APPLICATION_ID
  );

  return enabled && hasCredentials;
}

/**
 * Get Square configuration
 * @returns {SquareConfig} Square configuration object
 */
export function getSquareConfig(): SquareConfig {
  return {
    enabled: isSquareEnabled(),
    accessToken: process.env.SQUARE_ACCESS_TOKEN || null,
    locationId: process.env.SQUARE_LOCATION_ID || null,
    applicationId: process.env.SQUARE_APPLICATION_ID || null,
    environment: (process.env.SQUARE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
  };
}

/**
 * Validate Square configuration
 * Throws an error if Square is enabled but not properly configured
 */
export function validateSquareConfig(): void {
  const config = getSquareConfig();
  
  if (config.enabled) {
    if (!config.accessToken) {
      throw new Error('SQUARE_ACCESS_TOKEN is required when Square is enabled');
    }
    if (!config.locationId) {
      throw new Error('SQUARE_LOCATION_ID is required when Square is enabled');
    }
    if (!config.applicationId) {
      throw new Error('SQUARE_APPLICATION_ID is required when Square is enabled');
    }
  }
}

/**
 * Log Square status
 */
export function logSquareStatus(): void {
  const config = getSquareConfig();
  
  if (config.enabled) {
    console.log('✅ Square Payments: ENABLED');
    console.log(`   Environment: ${config.environment}`);
    console.log(`   Location ID: ${config.locationId}`);
  } else {
    console.log('ℹ️  Square Payments: DISABLED');
  }
}
