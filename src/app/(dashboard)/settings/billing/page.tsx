'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, Crown, Calendar, ExternalLink, Loader2, 
  AlertCircle, CheckCircle, XCircle, Clock, Shield,
  ArrowUpRight, Receipt, Settings as SettingsIcon, PlusCircle, PauseCircle, PlayCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface SubscriptionData {
  hasActiveSubscription: boolean;
  subscription?: {
    id: string;
    rankId: string;
    rankName: string;
    amount: number;
    currency: string;
    interval: string;
    nextBillingDate: string | null;
    cancelAtPeriodEnd: boolean;
    paused: boolean;
    pausedAt: string | null;
    pauseDurationDays: number;
    canResumeAt: string | null;
    hoursUntilResume: number;
  };
  rankInfo?: {
    expiresAt: string | null;
    hasExtended: boolean;
    explanation: string;
  };
}

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [extendLoading, setExtendLoading] = useState(false);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  async function fetchSubscriptionStatus() {
    try {
      const response = await fetch('/api/stripe/check-subscription-status');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
    } finally {
      setLoading(false);
    }
  }

  async function openCustomerPortal() {
    setRedirecting(true);
    
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to open portal');
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (error: any) {
      console.error('Portal error:', error);
      toast.error(error.message || 'Failed to open billing portal');
      setRedirecting(false);
    }
  }

  async function handlePauseResume() {
    if (!subscriptionData?.subscription) return;
    
    setPauseLoading(true);
    const isPaused = subscriptionData.subscription.paused;
    const endpoint = isPaused ? '/api/stripe/subscription/resume' : '/api/stripe/subscription/pause';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscriptionData.subscription.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle 24-hour cooldown error specifically
        if (response.status === 429 && data.error === 'COOLDOWN_ACTIVE') {
          toast.error(
            `${data.message} You can resume in ${data.hoursRemaining} hours.`,
            { duration: 5000 }
          );
          return;
        }
        throw new Error(data.error || 'Failed to update subscription');
      }

      if (isPaused && data.daysAdded) {
        toast.success(`Subscription resumed! ${data.daysAdded} days added back to your rank.`);
      } else {
        toast.success(isPaused ? 'Subscription resumed successfully!' : 'Subscription paused successfully!');
      }
      await fetchSubscriptionStatus(); // Refresh data
    } catch (error: any) {
      console.error('Pause/Resume error:', error);
      toast.error(error.message || 'Failed to update subscription');
    } finally {
      setPauseLoading(false);
    }
  }

  async function handleExtend() {
    setExtendLoading(true);
    
    try {
      // Redirect to subscribe page to extend/upgrade
      window.location.href = '/donations/subscribe';
    } catch (error: any) {
      console.error('Extend error:', error);
      toast.error('Failed to redirect to subscription page');
      setExtendLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Billing & Subscriptions</h1>
        <p className="text-gray-400">
          Manage your subscriptions, payment methods, and billing information
        </p>
      </div>

      {/* Active Subscription Card */}
      {subscriptionData?.hasActiveSubscription && subscriptionData.subscription ? (
        <Card className="border-slate-700 bg-slate-800/50 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg">
                  <Crown className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Active Subscription</CardTitle>
                  <CardDescription>
                    {subscriptionData.subscription.rankName} Rank
                  </CardDescription>
                </div>
              </div>
              {subscriptionData.subscription.paused ? (
                <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                  <Clock className="h-3 w-3 mr-1" />
                  Paused
                </Badge>
              ) : subscriptionData.subscription.cancelAtPeriodEnd ? (
                <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Ending Soon
                </Badge>
              ) : (
                <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Subscription Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-gray-400">Amount</div>
                <div className="text-lg font-semibold text-white">
                  ${subscriptionData.subscription.amount} {subscriptionData.subscription.currency}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-400">Billing Cycle</div>
                <div className="text-lg font-semibold text-white capitalize">
                  {subscriptionData.subscription.interval}
                </div>
              </div>
            </div>

            {/* Next Billing Date */}
            {subscriptionData.subscription.nextBillingDate && (
              <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                <Calendar className="h-5 w-5 text-cyan-400" />
                <div className="flex-1">
                  <div className="text-sm text-gray-400">Next Billing Date</div>
                  <div className="font-medium text-white">
                    {new Date(subscriptionData.subscription.nextBillingDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Pause Notice */}
            {subscriptionData.subscription.paused && (
              <Alert className="border-cyan-500/20 bg-cyan-500/10">
                <Clock className="h-4 w-4 text-cyan-400" />
                <AlertDescription className="text-cyan-200">
                  <div className="space-y-1">
                    <div className="font-semibold">Subscription Paused</div>
                    <div>
                      Paused {subscriptionData.subscription.pauseDurationDays} days ago. 
                      When you resume, {subscriptionData.subscription.pauseDurationDays} days will be added to your rank expiration.
                    </div>
                    {subscriptionData.subscription.hoursUntilResume > 0 && (
                      <div className="text-sm text-yellow-300 mt-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                        ⏳ You must wait {subscriptionData.subscription.hoursUntilResume} more hours before resuming.
                        <br />
                        <span className="text-xs text-yellow-300/70">
                          Can resume at: {subscriptionData.subscription.canResumeAt ?
                            new Date(subscriptionData.subscription.canResumeAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            }) : 'Unknown'}
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-cyan-300/70 mt-2">
                      Paused since: {subscriptionData.subscription.pausedAt ? 
                        new Date(subscriptionData.subscription.pausedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }) : 'Unknown'}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Cancellation Notice */}
            {subscriptionData.subscription.cancelAtPeriodEnd && !subscriptionData.subscription.paused && (
              <Alert className="border-yellow-500/20 bg-yellow-500/10">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-200">
                  Your subscription is set to cancel at the end of the current billing period.
                  You can reactivate it in the Stripe Customer Portal.
                </AlertDescription>
              </Alert>
            )}

            {/* Rank Info */}
            {subscriptionData.rankInfo && (
              <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="text-sm text-gray-400 mb-1">Rank Status</div>
                <div className="text-sm text-white">{subscriptionData.rankInfo.explanation}</div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Button
                onClick={handlePauseResume}
                disabled={
                  pauseLoading || 
                  subscriptionData.subscription.cancelAtPeriodEnd ||
                  (subscriptionData.subscription.paused && subscriptionData.subscription.hoursUntilResume > 0)
                }
                variant="outline"
                className="w-full border-slate-600 hover:border-cyan-500 hover:bg-cyan-500/10"
              >
                {pauseLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : subscriptionData.subscription.paused ? (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Resume Subscription
                  </>
                ) : (
                  <>
                    <PauseCircle className="mr-2 h-4 w-4" />
                    Pause Subscription
                  </>
                )}
              </Button>

              <Button
                onClick={handleExtend}
                disabled={extendLoading}
                variant="outline"
                className="w-full border-slate-600 hover:border-purple-500 hover:bg-purple-500/10"
              >
                {extendLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Extend/Upgrade Rank
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-700 bg-slate-800/50 mb-6">
          <CardContent className="py-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700/50 mb-4">
                <CreditCard className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Active Subscription</h3>
              <p className="text-gray-400 mb-6">
                You don't have any active subscriptions. Subscribe to a rank to get started!
              </p>
              <Link href="/donations/subscribe">
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
                  <Crown className="mr-2 h-4 w-4" />
                  Browse Ranks
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stripe Customer Portal Card */}
      <Card className="border-slate-700 bg-slate-800/50 mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <SettingsIcon className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-white">Manage Subscription</CardTitle>
              <CardDescription>
                Update payment methods, view invoices, and more
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-gray-300">
              Access the Stripe Customer Portal to manage all aspects of your subscription:
            </div>
            
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Update payment methods</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>View and download invoices</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Update billing information</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Cancel or reactivate subscription</span>
              </li>
            </ul>

            <Button
              onClick={openCustomerPortal}
              disabled={redirecting}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              {redirecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening Portal...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Stripe Customer Portal
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Shield className="h-3 w-3" />
              <span>Secured by Stripe • You'll be redirected to portal.stripe.com</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/donations/subscribe">
          <Card className="border-slate-700 bg-slate-800/50 hover:border-cyan-500/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/10 rounded-lg">
                    <Crown className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Browse Ranks</div>
                    <div className="text-sm text-gray-400">View all available ranks</div>
                  </div>
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/donations">
          <Card className="border-slate-700 bg-slate-800/50 hover:border-purple-500/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Receipt className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Donation History</div>
                    <div className="text-sm text-gray-400">View past donations</div>
                  </div>
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
