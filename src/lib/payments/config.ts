/**
 * Payment System Configuration
 * Unified payment provider support for Stripe and Square
 */

export type PaymentProvider = 'stripe' | 'square' | null;

export function isPaymentEnabled(): boolean {
  const provider = process.env.PAYMENT_PROVIDER?.toLowerCase();
  return provider === 'stripe' || provider === 'square';
}

export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER?.toLowerCase();
  
  if (provider === 'stripe') {
    return 'stripe';
  }
  
  if (provider === 'square') {
    return 'square';
  }
  
  return null;
}

export function isStripeEnabled(): boolean {
  return process.env.PAYMENT_PROVIDER?.toLowerCase() === 'stripe';
}

export function isSquareEnabled(): boolean {
  return process.env.PAYMENT_PROVIDER?.toLowerCase() === 'square';
}
