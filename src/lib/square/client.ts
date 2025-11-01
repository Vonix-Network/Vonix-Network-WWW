/**
 * Square Client
 * 
 * This module provides a wrapper around the Square SDK that only initializes
 * when Square integration is enabled.
 */
import { getSquareConfig, isSquareEnabled } from './config';

let squareClient: any | null = null;

/**
 * Get Square client instance
 * Uses dynamic import to avoid bundling issues on Edge runtimes.
 * @returns {Promise<any | null>} Square client if enabled, null otherwise
 */
export async function getSquareClient(): Promise<any | null> {
  if (!isSquareEnabled()) {
    return null;
  }

  if (!squareClient) {
    const config = getSquareConfig();
    try {
      const squareMod: any = await import('square');
      
      // Square SDK v43+ uses SquareClient
      const { SquareClient, SquareEnvironment } = squareMod;

      if (!SquareClient) {
        console.error('Square SDK SquareClient not found in exports. Available keys:', Object.keys(squareMod));
        return null;
      }

      // Determine environment URL
      const environment = config.environment === 'production' 
        ? SquareEnvironment.Production 
        : SquareEnvironment.Sandbox;

      // Square SDK v43+ uses 'token' instead of 'accessToken'
      squareClient = new SquareClient({
        token: config.accessToken!,
        environment: environment,
      });
    } catch (err) {
      console.error('Failed to initialize Square SDK:', err);
      return null;
    }
  }

  return squareClient;
}

/**
 * Get Payments API
 */
export async function getPaymentsApi() {
  const client = await getSquareClient();
  if (!client) {
    console.log('⚠️  Square Payments API called but Square is disabled or unavailable');
    return null;
  }
  return client.payments;
}

/**
 * Get Customers API
 */
export async function getCustomersApi() {
  const client = await getSquareClient();
  if (!client) {
    console.log('⚠️  Square Customers API called but Square is disabled or unavailable');
    return null;
  }
  return client.customers;
}

/**
 * Get Subscriptions API
 */
export async function getSubscriptionsApi() {
  const client = await getSquareClient();
  if (!client) {
    console.log('⚠️  Square Subscriptions API called but Square is disabled or unavailable');
    return null;
  }
  return client.subscriptions;
}

/**
 * Get Catalog API
 */
export async function getCatalogApi() {
  const client = await getSquareClient();
  if (!client) {
    console.log('⚠️  Square Catalog API called but Square is disabled or unavailable');
    return null;
  }
  return client.catalog;
}
