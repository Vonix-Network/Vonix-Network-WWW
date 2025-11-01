'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import '@/styles/square.css';
import { CreditCard, Loader2, CheckCircle2, XCircle } from 'lucide-react';

declare global {
  interface Window {
    Square?: any;
  }
}

interface SquarePaymentFormProps {
  minAmount?: number;
  defaultAmount?: number;
}

export function SquarePaymentForm({ minAmount = 1, defaultAmount = 10 }: SquarePaymentFormProps) {
  const [squareEnabled, setSquareEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(defaultAmount.toString());
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [minecraftUsername, setMinecraftUsername] = useState('');
  const [card, setCard] = useState<any>(null);
  const [payments, setPayments] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    async function initialize() {
      try {
        // Check if Square is enabled
        const statusResponse = await fetch('/api/square/status');
        const status = await statusResponse.json();

        if (!status.enabled) {
          setSquareEnabled(false);
          setLoading(false);
          return;
        }

        setSquareEnabled(true);

        // Load Square SDK if not already loaded
        if (!window.Square) {
          const script = document.createElement('script');
          script.src = status.environment === 'production'
            ? 'https://web.squarecdn.com/v1/square.js'
            : 'https://sandbox.web.squarecdn.com/v1/square.js';
          
          script.onload = () => initializeSquare(status);
          script.onerror = () => {
            console.error('Failed to load Square SDK');
            setSquareEnabled(false);
            setLoading(false);
          };
          
          document.head.appendChild(script);
        } else {
          await initializeSquare(status);
        }
      } catch (error) {
        console.error('Error initializing Square:', error);
        setSquareEnabled(false);
        setLoading(false);
      }
    }

    async function initializeSquare(status: any) {
      try {
        const paymentsInstance = window.Square.payments(
          status.applicationId,
          status.locationId
        );

        // Dark mode styling to match Vonix design (supported in v1 SDK)
        const cardInstance = await paymentsInstance.card({
          style: {
            input: {
              backgroundColor: '#0f172a', // slate-900 dark background
              color: '#e5e7eb', // gray-200 light text
              fontSize: '16px',
              fontWeight: '400',
            },
            'input::placeholder': {
              color: '#6b7280', // gray-500 placeholder
            },
            'input.is-error': {
              color: '#ef4444', // red-500
            },
            '.input-container': {
              borderColor: '#334155', // slate-700
              borderRadius: '8px',
            },
            '.input-container.is-focus': {
              borderColor: '#22d3ee', // cyan-400 accent
            },
            '.input-container.is-error': {
              borderColor: '#ef4444', // red-500
            },
            '.message-text': {
              color: '#9ca3af', // gray-400
            },
            '.message-icon': {
              color: '#9ca3af',
            },
            '.message-text.is-error': {
              color: '#ef4444',
            },
            '.message-icon.is-error': {
              color: '#ef4444',
            },
          }
        });

        // Retry attach until container is available
        let attempts = 0;
        const maxAttempts = 20; // ~3s with 150ms interval
        while (attempts < maxAttempts) {
          const container = document.getElementById('card-container');
          if (container) {
            await cardInstance.attach('#card-container');
            break;
          }
          await new Promise(r => setTimeout(r, 150));
          attempts++;
        }

        if (attempts === maxAttempts) {
          console.error('Card container not found after retries');
          setSquareEnabled(false);
          setLoading(false);
          return;
        }

        setPayments(paymentsInstance);
        setCard(cardInstance);
        setLoading(false);
      } catch (error) {
        console.error('Error initializing Square payments:', error);
        setSquareEnabled(false);
        setLoading(false);
      }
    }

    initialize();

    return () => {
      if (card) {
        try {
          card.destroy();
        } catch (e) {
          // Card may already be destroyed
        }
      }
    };
  }, []);

  async function handlePayment() {
    if (!card || !payments) {
      toast.error('Payment system not initialized');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < minAmount) {
      toast.error(`Minimum donation amount is $${minAmount}`);
      return;
    }

    try {
      setProcessing(true);

      // Tokenize card
      const result = await card.tokenize();
      
      if (result.status === 'OK') {
        // Send to backend
        const response = await fetch('/api/square/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceId: result.token,
            amount: amountNum,
            message: message || undefined,
            email: email || undefined,
            minecraftUsername: minecraftUsername || undefined,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setPaymentSuccess(true);
          toast.success('Thank you for your donation!');
          
          // Reset form
          setAmount(defaultAmount.toString());
          setMessage('');
          setMinecraftUsername('');
          
          // Reload page after 2 seconds to show updated donations
          setTimeout(() => {
            window.location.reload();
          }, 2000);
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
    return null; // Return null so it doesn't show at all when disabled
  }

  if (paymentSuccess) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
          <p className="text-gray-400">
            Thank you for supporting Vonix Network. Your donation helps keep our servers running!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-cyan-400" />
          Credit Card Payment (Beta)
        </CardTitle>
        <CardDescription>
          Secure payment processing powered by Square
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-400" /> Initializing payment form...
          </div>
        )}
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Donation Amount ($)
          </label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={minAmount}
            step="1"
            placeholder={`Minimum $${minAmount}`}
          />
        </div>

        {/* Quick Amount Buttons */}
        <div className="flex gap-2">
          {[5, 10, 25, 50, 100].map((amt) => (
            <Button
              key={amt}
              variant={amount === amt.toString() ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAmount(amt.toString())}
              type="button"
            >
              ${amt}
            </Button>
          ))}
        </div>

        {/* Optional fields */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Minecraft Username (Optional)
          </label>
          <Input
            type="text"
            value={minecraftUsername}
            onChange={(e) => setMinecraftUsername(e.target.value)}
            placeholder="Your Minecraft username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email (Optional)
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Message (Optional)
          </label>
          <Input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Leave a message"
            maxLength={200}
          />
        </div>

        {/* Square Card Element */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Card Details
          </label>
          <div className="glass bg-slate-900/60 border border-cyan-500/30 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-cyan-500/50 focus-within:border-cyan-500/60 transition-all duration-200">
            <div id="card-container" className="sq-wrapper px-3 pt-3 pb-2" />
            {/* Card Brand Icons and Security Badge */}
            <div className="flex items-center justify-between px-3 pb-2.5 border-t border-slate-700/30">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Secure encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Accepted:</span>
                <div className="flex gap-1.5">
                  <div className="w-8 h-5 bg-slate-800/60 border border-slate-700/50 rounded flex items-center justify-center text-[9px] font-bold text-blue-400">VISA</div>
                  <div className="w-8 h-5 bg-slate-800/60 border border-slate-700/50 rounded flex items-center justify-center">
                    <div className="flex gap-px">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                    </div>
                  </div>
                  <div className="w-8 h-5 bg-slate-800/60 border border-slate-700/50 rounded flex items-center justify-center text-[9px] font-bold text-blue-300">AMEX</div>
                  <div className="w-8 h-5 bg-slate-800/60 border border-slate-700/50 rounded flex items-center justify-center text-[9px] font-bold text-orange-400">DISC</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handlePayment}
          disabled={processing || loading}
          className="w-full"
          size="lg"
        >
          {processing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5 mr-2" />
              Donate ${amount || '0'}
            </>
          )}
        </Button>

        <p className="text-xs text-center text-gray-500">
          Your payment information is encrypted and secure. We never store your card details.
        </p>
      </CardContent>
    </Card>
  );
}
