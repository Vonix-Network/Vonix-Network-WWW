/**
 * Subscription Feature Configuration
 * 
 * Controls whether recurring subscriptions are enabled site-wide.
 * Useful for gradual rollout or disabling during maintenance.
 */

/**
 * Check if subscriptions are enabled
 * Defaults to TRUE if environment variable is not set
 */
export function isSubscriptionsEnabled(): boolean {
  const enabled = process.env.ENABLE_SUBSCRIPTIONS;
  
  // Default to true if not set (subscriptions enabled by default)
  if (enabled === undefined || enabled === null || enabled === '') {
    return true;
  }
  
  // Parse string boolean
  return enabled.toLowerCase() === 'true' || enabled === '1';
}

/**
 * Get user-friendly message when subscriptions are disabled
 */
export function getSubscriptionsDisabledMessage(): string {
  return 'Recurring subscriptions are temporarily unavailable. You can still make one-time donations.';
}

/**
 * Check if subscriptions are enabled and throw if not
 * Use this in API routes that require subscriptions
 */
export function requireSubscriptionsEnabled(): void {
  if (!isSubscriptionsEnabled()) {
    throw new Error('SUBSCRIPTIONS_DISABLED');
  }
}
