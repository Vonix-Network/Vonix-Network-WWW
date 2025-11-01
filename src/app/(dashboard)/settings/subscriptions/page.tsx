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
  amount: number;
  currency: string;
  interval: string;
  nextBillingDate?: string;
  canceledDate?: string;
}

export default function SubscriptionsPage() {
  const { data: session } = useSession();
  const [squareEnabled, setSquareEnabled] = useState(false);
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

      // Check if Square is enabled
      const statusResponse = await fetch('/api/square/status');
      const status = await statusResponse.json();

      if (!status.enabled) {
        setSquareEnabled(false);
        setLoading(false);
        return;
      }

      setSquareEnabled(true);

      // Get user's Square customer ID from their profile
      const userResponse = await fetch('/api/user/profile');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        const squareCustomerId = userData.squareCustomerId;
        
        if (squareCustomerId) {
          setCustomerId(squareCustomerId);
          
          // Load subscriptions
          const subsResponse = await fetch(`/api/square/subscription?customerId=${squareCustomerId}`);
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
      setSquareEnabled(false);
      setLoading(false);
    }
  }

  async function handleCancelSubscription(subscriptionId: string) {
    if (!confirm('Are you sure you want to cancel this subscription? This cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(subscriptionId);

      const response = await fetch(
        `/api/square/subscription?subscriptionId=${subscriptionId}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Subscription canceled successfully');
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

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'CANCELED':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Canceled</Badge>;
      case 'PAUSED':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Paused</Badge>;
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

  if (!squareEnabled) {
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
                        </div>
                      </div>

                      {sub.status.toUpperCase() === 'ACTIVE' && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelSubscription(sub.id)}
                            disabled={actionLoading === sub.id}
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
                        </div>
                      )}
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
