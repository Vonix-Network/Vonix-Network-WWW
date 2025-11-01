/**
 * Square Subscriptions Service
 * 
 * Handles recurring subscription management using Square Subscriptions API
 */

import { getSubscriptionsApi, getCustomersApi, getCatalogApi } from './client';
import { isSquareEnabled } from './config';
import { db } from '@/db';
import { randomUUID } from 'crypto';

export interface SubscriptionResult {
  success: boolean;
  subscriptionId?: string;
  error?: string;
  disabled?: boolean;
}

export interface UserSubscription {
  id: string;
  status: string;
  planName: string;
  amount: number;
  currency: string;
  interval: string;
  nextBillingDate?: string;
  canceledDate?: string;
}

export interface CreateSubscriptionParams {
  customerId: string;
  planId: string;
  sourceId: string; // Payment method token
  userId?: number;
}

/**
 * Create a subscription
 */
export async function createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult> {
  if (!isSquareEnabled()) {
    console.log('⚠️  createSubscription() called but Square integration is disabled');
    return {
      success: false,
      error: 'Subscriptions are currently unavailable',
      disabled: true,
    };
  }

  const subscriptionsApi = getSubscriptionsApi();
  if (!subscriptionsApi) {
    return {
      success: false,
      error: 'Subscriptions API unavailable',
      disabled: true,
    };
  }

  try {
    const { result } = await subscriptionsApi.createSubscription({
      idempotencyKey: randomUUID(),
      locationId: process.env.SQUARE_LOCATION_ID!,
      planId: params.planId,
      customerId: params.customerId,
      cardId: params.sourceId,
    });

    if (result.subscription) {
      return {
        success: true,
        subscriptionId: result.subscription.id,
      };
    }

    return {
      success: false,
      error: 'Failed to create subscription',
    };
  } catch (error: any) {
    console.error('Square subscription creation error:', error);
    return {
      success: false,
      error: error.message || 'Subscription creation failed',
    };
  }
}

/**
 * Get user's active subscriptions
 */
export async function getUserSubscriptions(customerId: string): Promise<UserSubscription[]> {
  if (!isSquareEnabled()) {
    console.log('⚠️  getUserSubscriptions() called but Square integration is disabled');
    return [];
  }

  const subscriptionsApi = getSubscriptionsApi();
  if (!subscriptionsApi) return [];

  try {
    const { result } = await subscriptionsApi.searchSubscriptions({
      query: {
        filter: {
          customerIds: [customerId],
          locationIds: [process.env.SQUARE_LOCATION_ID!],
        },
      },
    });

    if (!result.subscriptions) return [];

    return result.subscriptions.map(sub => ({
      id: sub.id!,
      status: sub.status!,
      planName: sub.planVariationId || 'Monthly Donation',
      amount: Number(sub.priceOverrideMoney?.amount || 0) / 100,
      currency: sub.priceOverrideMoney?.currency || 'USD',
      interval: 'monthly',
      nextBillingDate: sub.chargedThroughDate,
      canceledDate: sub.canceledDate,
    }));
  } catch (error) {
    console.error('Error retrieving subscriptions:', error);
    return [];
  }
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string) {
  if (!isSquareEnabled()) {
    console.log('⚠️  getSubscription() called but Square integration is disabled');
    return null;
  }

  const subscriptionsApi = getSubscriptionsApi();
  if (!subscriptionsApi) return null;

  try {
    const { result } = await subscriptionsApi.retrieveSubscription(subscriptionId);
    return result.subscription;
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    return null;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<SubscriptionResult> {
  if (!isSquareEnabled()) {
    console.log('⚠️  cancelSubscription() called but Square integration is disabled');
    return {
      success: false,
      error: 'Subscription management is currently unavailable',
      disabled: true,
    };
  }

  const subscriptionsApi = getSubscriptionsApi();
  if (!subscriptionsApi) {
    return {
      success: false,
      error: 'Subscriptions API unavailable',
      disabled: true,
    };
  }

  try {
    const { result } = await subscriptionsApi.cancelSubscription(subscriptionId);
    
    if (result.subscription) {
      return {
        success: true,
        subscriptionId: result.subscription.id,
      };
    }

    return {
      success: false,
      error: 'Failed to cancel subscription',
    };
  } catch (error: any) {
    console.error('Square subscription cancellation error:', error);
    return {
      success: false,
      error: error.message || 'Subscription cancellation failed',
    };
  }
}

/**
 * Update subscription
 */
export async function updateSubscription(
  subscriptionId: string,
  updates: { priceOverride?: number }
): Promise<SubscriptionResult> {
  if (!isSquareEnabled()) {
    console.log('⚠️  updateSubscription() called but Square integration is disabled');
    return {
      success: false,
      error: 'Subscription management is currently unavailable',
      disabled: true,
    };
  }

  const subscriptionsApi = getSubscriptionsApi();
  if (!subscriptionsApi) {
    return {
      success: false,
      error: 'Subscriptions API unavailable',
      disabled: true,
    };
  }

  try {
    const updateBody: any = {
      subscription: {},
    };

    if (updates.priceOverride !== undefined) {
      updateBody.subscription.priceOverrideMoney = {
        amount: BigInt(Math.round(updates.priceOverride * 100)),
        currency: 'USD',
      };
    }

    const { result } = await subscriptionsApi.updateSubscription(
      subscriptionId,
      updateBody
    );

    if (result.subscription) {
      return {
        success: true,
        subscriptionId: result.subscription.id,
      };
    }

    return {
      success: false,
      error: 'Failed to update subscription',
    };
  } catch (error: any) {
    console.error('Square subscription update error:', error);
    return {
      success: false,
      error: error.message || 'Subscription update failed',
    };
  }
}

/**
 * Pause subscription
 */
export async function pauseSubscription(subscriptionId: string): Promise<SubscriptionResult> {
  if (!isSquareEnabled()) {
    console.log('⚠️  pauseSubscription() called but Square integration is disabled');
    return {
      success: false,
      error: 'Subscription management is currently unavailable',
      disabled: true,
    };
  }

  const subscriptionsApi = getSubscriptionsApi();
  if (!subscriptionsApi) {
    return {
      success: false,
      error: 'Subscriptions API unavailable',
      disabled: true,
    };
  }

  try {
    const { result } = await subscriptionsApi.pauseSubscription(subscriptionId, {});
    
    if (result.subscription) {
      return {
        success: true,
        subscriptionId: result.subscription.id,
      };
    }

    return {
      success: false,
      error: 'Failed to pause subscription',
    };
  } catch (error: any) {
    console.error('Square subscription pause error:', error);
    return {
      success: false,
      error: error.message || 'Subscription pause failed',
    };
  }
}

/**
 * Resume subscription
 */
export async function resumeSubscription(subscriptionId: string): Promise<SubscriptionResult> {
  if (!isSquareEnabled()) {
    console.log('⚠️  resumeSubscription() called but Square integration is disabled');
    return {
      success: false,
      error: 'Subscription management is currently unavailable',
      disabled: true,
    };
  }

  const subscriptionsApi = getSubscriptionsApi();
  if (!subscriptionsApi) {
    return {
      success: false,
      error: 'Subscriptions API unavailable',
      disabled: true,
    };
  }

  try {
    const { result } = await subscriptionsApi.resumeSubscription(subscriptionId, {});
    
    if (result.subscription) {
      return {
        success: true,
        subscriptionId: result.subscription.id,
      };
    }

    return {
      success: false,
      error: 'Failed to resume subscription',
    };
  } catch (error: any) {
    console.error('Square subscription resume error:', error);
    return {
      success: false,
      error: error.message || 'Subscription resume failed',
    };
  }
}
