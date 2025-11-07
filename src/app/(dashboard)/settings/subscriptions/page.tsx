'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Loader2, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Pause,
  Play,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Subscription {
  id: string;
  status: string;
  planName: string;
  description?: string;
  amount: number;
  currency: string;
  interval: string;
  intervalCount: number;
  rankId?: string;
  days?: number;
  nextBillingDate?: string;
  canceledDate?: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  paused?: boolean;
}

export default function SubscriptionsPage() {
  const { data: session } = useSession();
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<'stripe' | 'square' | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptions();
  }, [session]);

  async function loadSubscriptions() {
    try {
      setLoading(true);

      // Check which payment provider is enabled
      const statusResponse = await fetch('/api/payments/status');
      const status = await statusResponse.json();

      if (!status.enabled || !status.provider) {
        setPaymentEnabled(false);
        setLoading(false);
        return;
      }

      setPaymentEnabled(true);
      setPaymentProvider(status.provider);

      // Get user's customer ID from their profile
      const userResponse = await fetch('/api/user/profile');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        
        // Check for appropriate customer ID based on provider
        const customerId = status.provider === 'stripe' 
          ? userData.stripeCustomerId 
          : userData.squareCustomerId;
        
        if (customerId) {
          setCustomerId(customerId);
          
          // Load subscriptions from appropriate provider
          const apiEndpoint = status.provider === 'stripe'
            ? `/api/stripe/subscription?customerId=${customerId}`
            : `/api/square/subscription?customerId=${customerId}`;
            
          const subsResponse = await fetch(apiEndpoint);
          if (subsResponse.ok) {
            const subsData = await subsResponse.json();
            if (!subsData.disabled) {
              setSubscriptions(subsData.subscriptions || []);
            }
          }
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      setPaymentEnabled(false);
      setLoading(false);
    }
  }

  async function handleCancelSubscription(subscriptionId: string, immediate = false) {
    const message = immediate 
      ? 'Cancel immediately and lose access now? You will NOT be refunded for unused time.'
      : 'Cancel at end of billing period? You\'ll keep access until then.';
    
    if (!confirm(message)) {
      return;
    }

    try {
      setActionLoading(subscriptionId);

      // Use appropriate API endpoint based on provider
      const apiEndpoint = paymentProvider === 'stripe'
        ? `/api/stripe/subscription?subscriptionId=${subscriptionId}${immediate ? '&immediate=true' : ''}`
        : `/api/square/subscription?subscriptionId=${subscriptionId}`;

      const response = await fetch(apiEndpoint, { method: 'DELETE' });

      const data = await response.json();

      if (data.success) {
        if (immediate) {
          toast.success('Subscription canceled immediately');
        } else {
          toast.success('Subscription will cancel at end of billing period');
        }
        loadSubscriptions();
      } else {
        toast.error(data.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResumeSubscription(subscriptionId: string) {
    try {
      setActionLoading(subscriptionId);

      const response = await fetch('/api/stripe/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId,
          action: 'resume',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Subscription resumed successfully!');
        loadSubscriptions();
      } else {
        toast.error(data.error || 'Failed to resume subscription');
      }
    } catch (error) {
      console.error('Error resuming subscription:', error);
      toast.error('Failed to resume subscription');
    } finally {
      setActionLoading(null);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'canceled':
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Canceled</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Paused</Badge>;
      case 'incomplete':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Pending Payment</Badge>;
      case 'incomplete_expired':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Expired</Badge>;
      case 'trialing':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Trial</Badge>;
      case 'past_due':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Past Due</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mr-3" />
            <span className="text-gray-400">Loading subscriptions...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!paymentEnabled) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-cyan-400" />
              Subscription Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <AlertTriangle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Subscriptions Not Available
              </h3>
              <p className="text-gray-400 mb-6">
                Subscription management is currently unavailable. Please contact an administrator for assistance.
              </p>
              <Link href="/donate">
                <Button variant="outline">
                  Make a One-Time Donation
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-cyan-400" />
          Subscription Management
        </h1>
        <p className="text-gray-400 mt-2">
          Manage your recurring donations and subscriptions
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-cyan-500/30 bg-cyan-500/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-cyan-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-white mb-2">Automatic Rank Benefits</h3>
              <p className="text-sm text-gray-400">
                Your donor rank is automatically assigned based on your subscription tier and remains active 
                as long as your subscription is active. If you cancel your subscription, you'll keep your rank 
                until the end of the current billing period.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Subscriptions</CardTitle>
          <CardDescription>
            Active and past recurring donations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-lg font-semibold text-white mb-2">No Active Subscriptions</h3>
              <p className="text-gray-400 mb-6">
                Start a recurring donation to support Vonix Network and unlock donor perks!
              </p>
              <Link href="/donations">
                <Button>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Start a Subscription
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <Card key={sub.id} className="bg-white/5">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {sub.planName}
                          </h3>
                          {getStatusBadge(sub.status)}
                        </div>
                        
                        {sub.description && (
                          <p className="text-sm text-gray-400 mb-2">
                            {sub.description}
                          </p>
                        )}
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-400">
                            <DollarSign className="h-4 w-4" />
                            <span>
                              ${sub.amount.toFixed(2)} {sub.currency} / {sub.interval}
                            </span>
                          </div>
                          
                          {sub.nextBillingDate && (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Next billing: {new Date(sub.nextBillingDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          
                          {sub.canceledDate && (
                            <div className="flex items-center gap-2 text-red-400">
                              <XCircle className="h-4 w-4" />
                              <span>
                                Canceled on {new Date(sub.canceledDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          
                          {sub.status.toLowerCase() === 'incomplete' && (
                            <div className="flex items-center gap-2 text-blue-400">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-xs">
                                Pending first payment - complete payment to activate
                              </span>
                            </div>
                          )}
                          
                          {sub.cancelAtPeriodEnd && !sub.canceledDate && (
                            <div className="flex items-center gap-2 text-yellow-400">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-xs font-semibold">
                                Cancels on {new Date(sub.currentPeriodEnd || sub.nextBillingDate || '').toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {/* Active subscription - show cancel button */}
                        {sub.status.toLowerCase() === 'active' && !sub.cancelAtPeriodEnd && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelSubscription(sub.id, false)}
                              disabled={actionLoading === sub.id}
                              className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                            >
                              {actionLoading === sub.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Pause className="h-4 w-4 mr-1" />
                                  Cancel (Keep Access)
                                </>
                              )}
                            </Button>
                          </>
                        )}
                        
                        {/* Scheduled to cancel - show resume button */}
                        {sub.status.toLowerCase() === 'active' && sub.cancelAtPeriodEnd && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResumeSubscription(sub.id)}
                            disabled={actionLoading === sub.id}
                            className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                          >
                            {actionLoading === sub.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-1" />
                                Resume
                              </>
                            )}
                          </Button>
                        )}
                        
                        {/* Incomplete subscription - show cancel button */}
                        {sub.status.toLowerCase() === 'incomplete' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelSubscription(sub.id, true)}
                            disabled={actionLoading === sub.id}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            {actionLoading === sub.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-1" />
                                Cancel
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Support Card */}
      <Card className="border-purple-500/30 bg-purple-500/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-purple-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-white mb-2">Need Help?</h3>
              <p className="text-sm text-gray-400 mb-3">
                If you have questions about your subscription or need to make changes, 
                please contact our support team on Discord.
              </p>
              <Button variant="outline" size="sm">
                Contact Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
