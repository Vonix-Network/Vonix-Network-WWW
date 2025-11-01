/**
 * Square Recurring Subscriptions
 * 
 * Implements automatic recurring billing using Square Subscriptions API
 * This is separate from the time-based rank purchases
 */

import { getSubscriptionsApi } from './client';
import { isSquareEnabled } from './config';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export interface RecurringSubscriptionResult {
  success: boolean;
  subscriptionId?: string;
  planId?: string;
  error?: string;
  disabled?: boolean;
}

export interface CreateRecurringSubscriptionParams {
  customerId: string; // Square customer ID
  rankId: string; // Our rank ID
  userId?: number;
}

/**
 * Create a recurring monthly subscription using Square Subscriptions API
 * This automatically charges the user every month
 */
export async function createRecurringSubscription(
  params: CreateRecurringSubscriptionParams
): Promise<RecurringSubscriptionResult> {
  if (!isSquareEnabled()) {
    console.log('⚠️  createRecurringSubscription() called but Square integration is disabled');
    return {
      success: false,
      error: 'Recurring subscriptions are currently unavailable',
      disabled: true,
    };
  }

  const subscriptionsApi = await getSubscriptionsApi();
  if (!subscriptionsApi) {
    return {
      success: false,
      error: 'Subscriptions API unavailable',
      disabled: true,
    };
  }

  try {
    // NOTE: This requires Square Subscription Plans to be created in Square Dashboard
    // For now, we'll use the pricing from rank-pricing.ts to calculate monthly amount
    
    const { RANK_PRICING } = await import('../rank-pricing');
    const pricePerDay = RANK_PRICING[params.rankId.toLowerCase()] || 0.17;
    const monthlyAmount = Math.round(pricePerDay * 30 * 100); // In cents

    // Create subscription (requires catalog items/plans in Square)
    const result = await subscriptionsApi.create({
      idempotencyKey: randomUUID(),
      locationId: process.env.SQUARE_LOCATION_ID!,
      customerId: params.customerId,
      planVariationId: params.rankId, // This should map to a Square catalog plan
      priceOverrideMoney: {
        amount: BigInt(monthlyAmount),
        currency: 'USD',
      },
    });

    if (result.subscription) {
      console.log(`✅ Created recurring subscription for rank ${params.rankId}: ${result.subscription.id}`);
      
      // Store subscription ID in user record if userId provided
      if (params.userId) {
        await db
          .update(users)
          .set({
            // Note: You'll need to add these fields to your schema
            // squareSubscriptionId: result.subscription.id,
            // subscriptionStatus: result.subscription.status,
            updatedAt: new Date(),
          })
          .where(eq(users.id, params.userId));
      }

      return {
        success: true,
        subscriptionId: result.subscription.id,
        planId: params.rankId,
      };
    }

    return {
      success: false,
      error: 'Failed to create subscription',
    };
  } catch (error: any) {
    console.error('Square recurring subscription creation error:', error);
    return {
      success: false,
      error: error.message || 'Subscription creation failed',
    };
  }
}

/**
 * Cancel a recurring subscription
 */
export async function cancelRecurringSubscription(
  subscriptionId: string
): Promise<RecurringSubscriptionResult> {
  if (!isSquareEnabled()) {
    return {
      success: false,
      error: 'Subscriptions are currently unavailable',
      disabled: true,
    };
  }

  const subscriptionsApi = await getSubscriptionsApi();
  if (!subscriptionsApi) {
    return {
      success: false,
      error: 'Subscriptions API unavailable',
      disabled: true,
    };
  }

  try {
    const result = await subscriptionsApi.cancel({ subscriptionId });
    
    if (result.subscription) {
      console.log(`✅ Cancelled recurring subscription: ${subscriptionId}`);
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
      error: error.message || 'Cancellation failed',
    };
  }
}

/**
 * Get subscription status
 */
export async function getRecurringSubscriptionStatus(subscriptionId: string) {
  if (!isSquareEnabled()) {
    return null;
  }

  const subscriptionsApi = await getSubscriptionsApi();
  if (!subscriptionsApi) return null;

  try {
    const result = await subscriptionsApi.retrieve({ subscriptionId });
    return result.subscription;
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    return null;
  }
}

/**
 * Handle Square webhook for subscription renewal
 * Call this from your webhook endpoint when subscription.updated event occurs
 */
export async function handleSubscriptionRenewal(
  subscriptionId: string,
  rankId: string,
  userId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Extend user's rank by 30 days
    const { assignRankSubscription } = await import('../rank-subscription');
    
    const result = await assignRankSubscription(userId, rankId, 30);
    
    if (result.success) {
      console.log(`✅ Extended rank ${rankId} for user ${userId} via recurring subscription`);
      return { success: true };
    }

    return {
      success: false,
      error: result.error || 'Failed to extend rank',
    };
  } catch (error: any) {
    console.error('Subscription renewal error:', error);
    return {
      success: false,
      error: error.message || 'Renewal failed',
    };
  }
}

/**
 * Handle subscription payment failure
 */
export async function handleSubscriptionPaymentFailure(
  subscriptionId: string,
  userId: number
): Promise<void> {
  try {
    console.log(`⚠️  Subscription payment failed for user ${userId}`);
    
    // You could:
    // 1. Send email notification
    // 2. Mark subscription as past due
    // 3. Give grace period before removing rank
    // 4. Update user record with failure status
    
    // For now, just log it
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}
