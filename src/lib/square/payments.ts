/**
 * Square Payments Service
 * 
 * Handles one-time payment processing using Square Payments API
 */

import { getPaymentsApi, getCustomersApi } from './client';
import { getSquareConfig, isSquareEnabled } from './config';
import { assignDonorRank } from './rank-assignment';
import { db } from '@/db';
import { donations, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
  disabled?: boolean;
}

export interface CreatePaymentParams {
  sourceId: string; // Token from Web Payments SDK
  amount: number; // Amount in dollars (will be converted to cents)
  currency?: string;
  userId?: number;
  username?: string;
  minecraftUsername?: string;
  email?: string;
  message?: string;
}

/**
 * Process a one-time payment
 */
export async function createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
  // Check if Square is enabled
  if (!isSquareEnabled()) {
    console.log('⚠️  createPayment() called but Square integration is disabled');
    return {
      success: false,
      error: 'Payment processing is currently unavailable',
      disabled: true,
    };
  }

  const paymentsApi = await getPaymentsApi();
  const customersApi = await getCustomersApi();
  
  if (!paymentsApi) {
    return {
      success: false,
      error: 'Payment API unavailable',
      disabled: true,
    };
  }

  try {
    const config = getSquareConfig();
    const amountInCents = Math.round(params.amount * 100);
    
    // Create or retrieve customer if email provided
    let customerId: string | undefined;
    if (params.email && customersApi) {
      try {
        const searchResult = await customersApi.search({
          query: {
            filter: {
              emailAddress: {
                exact: params.email,
              },
            },
          },
        });

        if (searchResult.customers && searchResult.customers.length > 0) {
          customerId = searchResult.customers[0].id;
        } else {
          // Create new customer
          const createResult = await customersApi.create({
            emailAddress: params.email,
            givenName: params.username || params.minecraftUsername,
            referenceId: params.userId?.toString(),
          });
          customerId = createResult.customer?.id;
        }

        // Store Square customer ID in user profile for future use
        if (customerId && params.userId) {
          try {
            await db.update(users).set({
              squareCustomerId: customerId,
              updatedAt: new Date(),
            }).where(eq(users.id, params.userId));
            console.log(`✅ Stored Square customer ID for user ${params.userId}`);
          } catch (error) {
            console.error('Error storing Square customer ID:', error);
            // Don't fail the payment if this fails
          }
        }
      } catch (error) {
        console.error('Error handling customer:', error);
        // Continue without customer ID
      }
    }

    // Create payment
    console.log('Creating Square payment:', {
      amount: amountInCents,
      currency: params.currency || 'USD',
      sourceId: params.sourceId ? 'present' : 'missing',
      locationId: config.locationId,
      customerId: customerId ? 'present' : 'missing',
      message: params.message,
    });

    const result = await paymentsApi.create({
      sourceId: params.sourceId,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: BigInt(amountInCents),
        currency: params.currency || 'USD',
      },
      locationId: config.locationId!,
      customerId,
      note: params.message || 'Donation to Vonix Network',
    });

    console.log('Square payment result:', {
      status: result.payment?.status,
      id: result.payment?.id,
      errors: result.errors,
    });

    if (result.payment?.status === 'COMPLETED') {
      // Store in database
      try {
        await db.insert(donations).values({
          userId: params.userId || null,
          amount: params.amount,
          currency: params.currency || 'USD',
          method: 'Square',
          message: params.message || null,
          displayed: true,
          createdAt: new Date(),
        });
      } catch (dbError) {
        console.error('Error storing donation in database:', dbError);
        // Payment succeeded but database storage failed
      }

      // Automatically assign donor rank if user is logged in
      if (params.userId) {
        try {
          await assignDonorRank(params.userId, params.amount);
        } catch (rankError) {
          console.error('Error assigning donor rank:', rankError);
          // Don't fail the payment if rank assignment fails
        }
      }

      return {
        success: true,
        paymentId: result.payment.id,
      };
    }

    return {
      success: false,
      error: `Payment failed with status: ${result.payment?.status}`,
    };
  } catch (error: any) {
    console.error('Square payment API error:', {
      message: error.message,
      statusCode: error.statusCode,
      errors: error.errors,
      stack: error.stack,
    });
    return {
      success: false,
      error: error.message || 'Payment processing failed',
    };
  }
}

/**
 * Get payment details
 */
export async function getPayment(paymentId: string) {
  if (!isSquareEnabled()) {
    console.log('⚠️  getPayment() called but Square integration is disabled');
    return null;
  }

  const paymentsApi = await getPaymentsApi();
  if (!paymentsApi) return null;

  try {
    const { result } = await paymentsApi.getPayment(paymentId);
    return result.payment;
  } catch (error) {
    console.error('Error retrieving payment:', error);
    return null;
  }
}
