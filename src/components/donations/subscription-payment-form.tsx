'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import '@/styles/square.css';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { getPaymentErrorMessage } from '@/lib/payments/error-handler';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

declare global {
  interface Window {
    Square?: any;
  }
}

interface SubscriptionPaymentFormProps {
  rankId: string;
  rankName: string;
  days: number;
  price: number;
  durationLabel: string;
  isRecurring?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SubscriptionPaymentForm({
  rankId,
  rankName,
  days,
  price,
  durationLabel,
  isRecurring = false,
  onSuccess,
  onCancel,
}: SubscriptionPaymentFormProps) {
  const router = useRouter();
  const [paymentProvider, setPaymentProvider] = useState<'stripe' | 'square' | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  
  // Square-specific state
  const [card, setCard] = useState<any>(null);
  const [payments, setPayments] = useState<any>(null);
  const [squareStatus, setSquareStatus] = useState<any>(null);

  // Step 1: Check payment provider and load appropriate SDK
  useEffect(() => {
    async function checkPaymentProvider() {
      try {
        const statusResponse = await fetch('/api/payments/status');
        const status = await statusResponse.json();

        if (!status.enabled || !status.provider) {
          setPaymentProvider(null);
          setLoading(false);
          return;
        }

        setPaymentProvider(status.provider);

        if (status.provider === 'stripe') {
          // Load Stripe
          const stripeKeyResponse = await fetch('/api/stripe/config');
          
          if (!stripeKeyResponse.ok) {
            console.error('Failed to fetch Stripe config:', await stripeKeyResponse.text());
            setPaymentProvider(null);
            setLoading(false);
            return;
          }
          
          const stripeConfig = await stripeKeyResponse.json();
          console.log('Stripe config loaded:', { hasKey: !!stripeConfig.publishableKey });
          
          if (stripeConfig.publishableKey) {
            const stripe = loadStripe(stripeConfig.publishableKey);
            setStripePromise(stripe);
            
            // Verify Stripe loaded
            stripe.then((s) => {
              console.log('Stripe initialized:', !!s);
            }).catch((err) => {
              console.error('Stripe failed to load:', err);
            });
          } else {
            console.error('No Stripe publishable key in config');
            setPaymentProvider(null);
          }
          setLoading(false);
        } else if (status.provider === 'square') {
          // Load Square
          const squareStatusResponse = await fetch('/api/square/status');
          const squareStatus = await squareStatusResponse.json();
          
          if (!squareStatus.enabled) {
            setPaymentProvider(null);
            setLoading(false);
            return;
          }
          
          setSquareStatus(squareStatus);

          if (!window.Square) {
            const script = document.createElement('script');
            script.src = squareStatus.environment === 'production'
              ? 'https://web.squarecdn.com/v1/square.js'
              : 'https://sandbox.web.squarecdn.com/v1/square.js';
            
            script.onload = () => setLoading(false);
            script.onerror = () => {
              console.error('Failed to load Square SDK');
              setPaymentProvider(null);
              setLoading(false);
            };
            
            document.head.appendChild(script);
          } else {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error checking payment provider:', error);
        setPaymentProvider(null);
        setLoading(false);
      }
    }

    checkPaymentProvider();
  }, []);

  // Step 2: Initialize Square card after container is rendered
  useEffect(() => {
    if (!loading && paymentProvider === 'square' && squareStatus && !card && window.Square) {
      async function initializeCard() {
        try {
          const paymentsInstance = window.Square.payments(
            squareStatus.applicationId,
            squareStatus.locationId
          );

          const cardInstance = await paymentsInstance.card({
            style: {
              input: {
                backgroundColor: '#0f172a',
                color: '#e5e7eb',
                fontSize: '16px',
                fontWeight: '400',
              },
              'input::placeholder': { color: '#6b7280' },
              'input.is-error': { color: '#ef4444' },
              '.input-container': {
                borderColor: '#334155',
                borderRadius: '8px',
              },
              '.input-container.is-focus': {
                borderColor: '#22d3ee',
              },
              '.input-container.is-error': {
                borderColor: '#ef4444',
              },
              '.message-text': { color: '#9ca3af' },
              '.message-icon': { color: '#9ca3af' },
              '.message-text.is-error': { color: '#ef4444' },
              '.message-icon.is-error': { color: '#ef4444' },
            }
          });

          await cardInstance.attach('#card-container');

          setCard(cardInstance);
          setPayments(paymentsInstance);
        } catch (error) {
          console.error('Error initializing card:', error);
          toast.error('Failed to load payment form. Please refresh the page.');
        }
      }

      initializeCard();
    }
  }, [loading, paymentProvider, squareStatus, card]);

  async function handlePayment() {
    if (!card || !payments) {
      toast.error('Payment system not initialized');
      return;
    }

    try {
      setProcessing(true);

      // Tokenize card
      const result = await card.tokenize();
      
      if (result.status === 'OK') {
        // Process payment
        const response = await fetch('/api/square/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceId: result.token,
            amount: price,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Now process the subscription
          const subResponse = await fetch('/api/subscriptions/purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rankId,
              days,
              amount: price,
              paymentId: data.paymentId || data.orderId,
            }),
          });

          const subData = await subResponse.json();
          
          if (subData.success) {
            setPaymentSuccess(true);
            toast.success(`${rankName} rank activated for ${durationLabel}!`);
            
            if (onSuccess) {
              onSuccess();
            }
            
            setTimeout(() => {
              router.push('/dashboard');
            }, 2500);
          } else {
            // Use error handler for subscription errors
            const friendlyMessage = getPaymentErrorMessage(subData, 'square');
            toast.error(friendlyMessage);
          }
        } else {
          // Use error handler for payment errors
          const friendlyMessage = getPaymentErrorMessage(data, 'square');
          toast.error(friendlyMessage);
        }
      } else {
        // Handle tokenization errors
        const tokenError = result.errors?.[0];
        if (tokenError) {
          const friendlyMessage = getPaymentErrorMessage(tokenError, 'square');
          toast.error(friendlyMessage);
        } else {
          toast.error('Card validation failed. Please check your card details and try again.');
        }
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      // Use error handler for unexpected errors
      const friendlyMessage = getPaymentErrorMessage(error, 'square');
      toast.error(friendlyMessage);
    } finally {
      setProcessing(false);
    }
  }

  if (!paymentProvider) {
    return (
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="p-6 text-center">
          <p className="text-yellow-400 mb-2 font-semibold">Payment Processing Unavailable</p>
          <p className="text-sm text-gray-400">
            Payment processing is not configured. Please contact an administrator.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (paymentSuccess) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Rank Activated!</h3>
          <p className="text-gray-400 mb-2">
            Your {rankName} rank has been activated for {durationLabel}!
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to dashboard...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-12 w-12 text-cyan-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-400">Loading payment form...</p>
        </CardContent>
      </Card>
    );
  }

  // Render Stripe payment form
  if (paymentProvider === 'stripe' && stripePromise) {
    return (
      <Elements stripe={stripePromise}>
        <StripePaymentContent
          rankId={rankId}
          rankName={rankName}
          days={days}
          price={price}
          durationLabel={durationLabel}
          isRecurring={isRecurring}
          onSuccess={onSuccess}
          onCancel={onCancel}
          paymentSuccess={paymentSuccess}
          setPaymentSuccess={setPaymentSuccess}
        />
      </Elements>
    );
  }

  // Render Square payment form
  return (
    <div className="space-y-4">
      <div id="card-container" className="min-h-[100px]"></div>
      
      <Button
        onClick={handlePayment}
        disabled={processing}
        className="w-full"
        size="lg"
      >
        {processing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>Pay ${price}</>
        )}
      </Button>

      {onCancel && (
        <Button
          onClick={onCancel}
          variant="outline"
          className="w-full"
          disabled={processing}
        >
          ← Cancel
        </Button>
      )}

      <p className="text-xs text-gray-500 text-center">
        Secure payment processed by {paymentProvider === 'stripe' ? 'Stripe' : 'Square'}. Your card information is never stored on our servers.
      </p>
    </div>
  );
}

// Stripe payment content component (uses Stripe hooks)  
function StripePaymentContent({
  rankId,
  rankName,
  days,
  price,
  durationLabel,
  isRecurring = false,
  onSuccess,
  onCancel,
  paymentSuccess,
  setPaymentSuccess,
}: SubscriptionPaymentFormProps & {
  paymentSuccess: boolean;
  setPaymentSuccess: (value: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  
  // Log when stripe/elements change
  useEffect(() => {
    console.log('Stripe Elements status:', { stripe: !!stripe, elements: !!elements });
  }, [stripe, elements]);

  async function handleStripePayment() {
    console.log('Handle Stripe payment called:', { stripe: !!stripe, elements: !!elements, isRecurring });
    
    if (!stripe || !elements) {
      console.error('Payment system not ready:', { stripe: !!stripe, elements: !!elements });
      toast.error('Payment system not initialized. Please refresh the page.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast.error('Card element not found');
      return;
    }

    try {
      setProcessing(true);

      if (isRecurring) {
        // Create recurring subscription
        const subResponse = await fetch('/api/stripe/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rankId,
            days,
            amount: price,
          }),
        });

        const { clientSecret, subscriptionId } = await subResponse.json();

        if (!clientSecret) {
          toast.error('Failed to create subscription');
          return;
        }

        // Confirm payment
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
          },
        });

        if (error) {
          toast.error(error.message || 'Payment failed');
          return;
        }

        if (paymentIntent?.status === 'succeeded') {
          setPaymentSuccess(true);
          toast.success(`${rankName} subscription activated!`);
          
          if (onSuccess) {
            onSuccess();
          }
          
          setTimeout(() => {
            router.push('/dashboard');
          }, 2500);
        }
      } else {
        // One-time payment
        const intentResponse = await fetch('/api/stripe/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: price,
            rankId,
            days,
          }),
        });

        const { clientSecret } = await intentResponse.json();

        // Confirm payment
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
          },
        });

        if (error) {
          toast.error(error.message || 'Payment failed');
          return;
        }

        if (paymentIntent?.status === 'succeeded') {
          // Process one-time subscription purchase
          const subResponse = await fetch('/api/subscriptions/purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rankId,
              days,
              amount: price,
              paymentId: paymentIntent.id,
            }),
          });

          const subData = await subResponse.json();
          
          if (subData.success) {
            setPaymentSuccess(true);
            toast.success(`${rankName} rank activated for ${durationLabel}!`);
            
            if (onSuccess) {
              onSuccess();
            }
            
            setTimeout(() => {
              router.push('/dashboard');
            }, 2500);
          } else {
            toast.error(getPaymentErrorMessage(subData, 'stripe'));
          }
        }
      }
    } catch (error: any) {
      console.error('Stripe payment error:', error);
      toast.error(getPaymentErrorMessage(error, 'stripe'));
    } finally {
      setProcessing(false);
    }
  }

  if (paymentSuccess) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Rank Activated!</h3>
          <p className="text-gray-400 mb-2">
            Your {rankName} rank has been activated for {durationLabel}!
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to dashboard...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#e5e7eb',
              '::placeholder': { color: '#6b7280' },
              backgroundColor: '#0f172a',
            },
            invalid: {
              color: '#ef4444',
            },
          },
        }} />
      </div>
      
      <Button
        onClick={handleStripePayment}
        disabled={!stripe || processing}
        className="w-full"
        size="lg"
      >
        {!stripe ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Loading Payment System...
          </>
        ) : processing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>Pay ${price}</>
        )}
      </Button>

      {onCancel && (
        <Button
          onClick={onCancel}
          variant="outline"
          className="w-full"
          disabled={processing}
        >
          ← Cancel
        </Button>
      )}

      <p className="text-xs text-gray-500 text-center">
        Secure payment processed by Stripe. Your card information is never stored on our servers.
      </p>
    </div>
  );
}
