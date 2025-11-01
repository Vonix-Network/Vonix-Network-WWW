'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import '@/styles/square.css';
import { CheckCircle2, Loader2 } from 'lucide-react';

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
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SubscriptionPaymentForm({
  rankId,
  rankName,
  days,
  price,
  durationLabel,
  onSuccess,
  onCancel,
}: SubscriptionPaymentFormProps) {
  const router = useRouter();
  const [squareEnabled, setSquareEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState<any>(null);
  const [payments, setPayments] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [squareStatus, setSquareStatus] = useState<any>(null);

  // Step 1: Check Square status and load SDK
  useEffect(() => {
    async function checkSquare() {
      try {
        const statusResponse = await fetch('/api/square/status');
        const status = await statusResponse.json();

        if (!status.enabled) {
          setSquareEnabled(false);
          setLoading(false);
          return;
        }

        setSquareEnabled(true);
        setSquareStatus(status);

        if (!window.Square) {
          const script = document.createElement('script');
          script.src = status.environment === 'production'
            ? 'https://web.squarecdn.com/v1/square.js'
            : 'https://sandbox.web.squarecdn.com/v1/square.js';
          
          script.onload = () => setLoading(false);
          script.onerror = () => {
            console.error('Failed to load Square SDK');
            setSquareEnabled(false);
            setLoading(false);
          };
          
          document.head.appendChild(script);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking Square status:', error);
        setSquareEnabled(false);
        setLoading(false);
      }
    }

    checkSquare();
  }, []);

  // Step 2: Initialize card after container is rendered
  useEffect(() => {
    if (!loading && squareEnabled && squareStatus && !card && window.Square) {
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
  }, [loading, squareEnabled, squareStatus, card]);

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
            toast.error(subData.error || 'Failed to activate rank');
          }
        } else {
          toast.error(data.error || 'Payment failed');
        }
      } else {
        toast.error('Card validation failed. Please check your card details.');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  }

  if (!squareEnabled) {
    return (
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="p-6 text-center">
          <p className="text-yellow-400 mb-2 font-semibold">Payment Processing Unavailable</p>
          <p className="text-sm text-gray-400">
            Square payment processing is not configured. Please contact an administrator.
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
        Secure payment processed by Square. Your card information is never stored on our servers.
      </p>
    </div>
  );
}
