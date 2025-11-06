/**
 * Payment Error Handler (Stub)
 * Converts technical payment errors to user-friendly messages
 */

export function getPaymentErrorMessage(error: any, provider: 'square' | 'stripe' = 'square'): string {
  // Handle Square errors
  if (provider === 'square') {
    if (error?.code === 'CARD_DECLINED') {
      return 'Your card was declined. Please use a different payment method.';
    }
    if (error?.code === 'INSUFFICIENT_FUNDS') {
      return 'Insufficient funds. Please check your account balance.';
    }
    if (error?.code === 'CVV_FAILURE') {
      return 'Invalid CVV. Please check your card security code.';
    }
    if (error?.code === 'INVALID_CARD') {
      return 'Invalid card details. Please check and try again.';
    }
  }

  // Generic error message
  if (error?.message) {
    return error.message;
  }
  
  if (error?.error) {
    return error.error;
  }

  return 'Payment processing failed. Please try again or contact support.';
}
