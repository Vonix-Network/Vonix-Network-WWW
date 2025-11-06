'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Loader2, 
  XCircle, 
  Download,
  Home,
  Calendar,
  CreditCard,
  Receipt,
  Heart
} from 'lucide-react';

interface ReceiptData {
  receiptNumber: string;
  rankName: string;
  amount: number;
  currency: string;
  days: number;
  paymentType: string;
  paymentId: string;
  subscriptionId?: string;
  date: string;
  expiresAt?: string;
}

export default function DonationSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing your payment...');
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setStatus('error');
      setMessage('No session ID provided');
      return;
    }

    // Verify the checkout session and get receipt
    async function verifySession() {
      try {
        const response = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`);
        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Payment successful!');
          setReceipt(data.receipt);
        } else {
          setStatus('error');
          setMessage(data.error || 'Payment verification failed');
        }
      } catch (error) {
        console.error('Error verifying session:', error);
        setStatus('error');
        setMessage('Failed to verify payment');
      }
    }

    verifySession();
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="container max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="p-12">
            <div className="text-center space-y-6">
              <Loader2 className="h-16 w-16 animate-spin text-cyan-400 mx-auto" />
              <h1 className="text-2xl font-bold text-white">Processing Payment</h1>
              <p className="text-gray-400">{message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="p-12">
            <div className="text-center space-y-6">
              <XCircle className="h-16 w-16 text-red-400 mx-auto" />
              <h1 className="text-2xl font-bold text-white">Payment Failed</h1>
              <p className="text-gray-400">{message}</p>
              <Button
                onClick={() => router.push('/donations/subscribe')}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state with receipt
  return (
    <div className="container max-w-3xl mx-auto p-6 space-y-6">
      {/* Thank You Header */}
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <CheckCircle2 className="h-20 w-20 text-green-400 mx-auto" />
              <div className="absolute inset-0 bg-green-400/20 blur-2xl rounded-full" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Thank You for Your Support!
              </h1>
              <p className="text-lg text-gray-300">
                Your contribution helps us maintain and improve Vonix Network
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-cyan-400">
              <Heart className="h-5 w-5 fill-current" />
              <span className="font-semibold">We appreciate your generosity!</span>
              <Heart className="h-5 w-5 fill-current" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipt */}
      {receipt && (
        <Card>
          <CardHeader className="border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="h-6 w-6 text-cyan-400" />
                <CardTitle>Payment Receipt</CardTitle>
              </div>
              <Badge variant="outline" className="text-green-400 border-green-500/30">
                Completed
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Receipt Number */}
            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Receipt Number</div>
              <div className="text-xl font-mono font-bold text-white">
                {receipt.receiptNumber}
              </div>
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Rank Purchased</div>
                  <div className="text-lg font-semibold text-white">{receipt.rankName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Duration
                  </div>
                  <div className="text-lg font-semibold text-white">{receipt.days} days</div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Amount Paid
                  </div>
                  <div className="text-2xl font-bold text-cyan-400">
                    ${receipt.amount.toFixed(2)} {receipt.currency}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Payment Type</div>
                  <Badge variant="outline" className="text-xs">
                    {receipt.paymentType === 'subscription' ? 'Recurring Subscription' : 'One-Time Payment'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="pt-4 border-t border-slate-700 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Transaction Date</span>
                <span className="text-white">{new Date(receipt.date).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Payment ID</span>
                <span className="text-white font-mono text-xs">{receipt.paymentId}</span>
              </div>
              {receipt.subscriptionId && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subscription ID</span>
                  <span className="text-white font-mono text-xs">{receipt.subscriptionId}</span>
                </div>
              )}
              {receipt.expiresAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    {receipt.paymentType === 'subscription' ? 'Next Billing Date' : 'Expires On'}
                  </span>
                  <span className="text-white">{new Date(receipt.expiresAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Subscription Note */}
            {receipt.paymentType === 'subscription' && (
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Recurring Subscription:</strong> You'll be automatically charged 
                  on {new Date(receipt.expiresAt || '').toLocaleDateString()}. You can cancel anytime from your 
                  <button 
                    onClick={() => router.push('/settings/subscriptions')}
                    className="text-cyan-400 hover:underline ml-1"
                  >
                    subscription settings
                  </button>.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => router.push('/dashboard')}
                className="flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/donations/receipts')}
              >
                <Receipt className="h-4 w-4 mr-2" />
                View All Receipts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Support Message */}
      <Card className="border-purple-500/30 bg-purple-500/5">
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <p className="text-gray-300">
              Your support directly contributes to server hosting, development, and new features.
            </p>
            <p className="text-sm text-gray-400">
              Thank you for being an awesome member of the Vonix Network community! 🎮
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
