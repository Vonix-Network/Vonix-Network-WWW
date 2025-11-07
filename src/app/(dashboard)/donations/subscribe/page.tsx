'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Crown, Check, CreditCard, Calendar, TrendingUp, Sparkles, 
  Shield, Zap, Heart, Loader2, Info, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface DonationRank {
  id: string;
  name: string;
  badge: string;
  subtitle?: string;
  textColor: string;
  color: string;
  minAmount: number;
}

interface DurationPackage {
  days: number;
  label: string;
  price: number;
  discount?: number;
  popular?: boolean;
}

export default function SubscribePage() {
  const router = useRouter();
  const [ranks, setRanks] = useState<DonationRank[]>([]);
  const [selectedRank, setSelectedRank] = useState<DonationRank | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<DurationPackage | null>(null);
  const [isRecurring, setIsRecurring] = useState(true);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [subscriptionsEnabled, setSubscriptionsEnabled] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    checkSubscriptionConfig();
    fetchRanks();
    checkActiveRank();
  }, []);

  async function checkSubscriptionConfig() {
    try {
      const response = await fetch('/api/subscriptions/config');
      const data = await response.json();
      setSubscriptionsEnabled(data.enabled);
      
      if (!data.enabled) {
        setIsRecurring(false); // Force one-time if subscriptions disabled
      }
    } catch (error) {
      console.error('Failed to check subscription config:', error);
    }
  }

  async function checkActiveRank() {
    try {
      const response = await fetch('/api/stripe/check-subscription-status');
      const data = await response.json();
      
      if (data.hasActiveSubscription) {
        // Show info banner instead of redirecting
        // Users can still purchase one-time extensions
        setHasActiveSubscription(true);
        toast.info(
          'You have an active subscription. Make a one-time payment to add bonus days to your rank!',
          { duration: 6000 }
        );
        // Force one-time payment by default when user has active subscription
        setIsRecurring(false);
      }
    } catch (error) {
      console.error('Failed to check subscription status:', error);
    }
  }

  async function fetchRanks() {
    try {
      const response = await fetch('/api/donor-ranks');
      const data = await response.json();
      
      if (data.ranks) {
        const sortedRanks = data.ranks.sort((a: DonationRank, b: DonationRank) => a.minAmount - b.minAmount);
        setRanks(sortedRanks);
        
        if (sortedRanks.length > 0) {
          setSelectedRank(sortedRanks[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch ranks:', error);
      toast.error('Failed to load ranks');
    } finally {
      setLoading(false);
    }
  }

  function getRankDurationPackages(rank: DonationRank): DurationPackage[] {
    const monthlyPrice = rank.minAmount;
    
    return [
      {
        days: 30,
        label: '1 Month',
        price: monthlyPrice,
        popular: false,
      },
      {
        days: 90,
        label: '3 Months',
        price: Math.round(monthlyPrice * 3 * 0.95 * 100) / 100,
        discount: 5,
        popular: true,
      },
      {
        days: 180,
        label: '6 Months',
        price: Math.round(monthlyPrice * 6 * 0.90 * 100) / 100,
        discount: 10,
        popular: false,
      },
      {
        days: 365,
        label: '12 Months',
        price: Math.round(monthlyPrice * 12 * 0.85 * 100) / 100,
        discount: 15,
        popular: false,
      },
    ];
  }

  async function handleCheckout() {
    if (!selectedRank || !selectedDuration) {
      toast.error('Please select a rank and duration');
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rankId: selectedRank.id,
          days: selectedDuration.days,
          amount: selectedDuration.price,
          isRecurring,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'SUBSCRIPTIONS_DISABLED') {
          toast.error(data.message);
          setIsRecurring(false);
          return;
        }
        throw new Error(data.error || 'Failed to create checkout');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to start checkout');
      setProcessing(false);
    }
  }

  const durationPackages = selectedRank ? getRankDurationPackages(selectedRank) : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-400"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Crown className="h-8 w-8 text-cyan-400 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 blur-3xl"></div>
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">Premium Rank Subscriptions</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Choose Your 
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"> Rank</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Unlock exclusive perks, cosmetics, and features. Upgrade anytime with automatic day conversion.
            </p>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-lg p-4">
                <Shield className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <div className="text-sm font-semibold text-white">Secure Payment</div>
                <div className="text-xs text-gray-400">Powered by Stripe</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-lg p-4">
                <Zap className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                <div className="text-sm font-semibold text-white">Instant Activation</div>
                <div className="text-xs text-gray-400">Immediate access</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-lg p-4">
                <Heart className="h-6 w-6 text-red-400 mx-auto mb-2" />
                <div className="text-sm font-semibold text-white">Flexible Plans</div>
                <div className="text-xs text-gray-400">Cancel anytime</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        {/* Active Subscription Alert */}
        {hasActiveSubscription && (
          <Alert className="mb-8 border-cyan-500/30 bg-cyan-500/10">
            <AlertCircle className="h-5 w-5 text-cyan-400" />
            <AlertDescription className="text-cyan-100">
              <div className="font-semibold mb-1">You have an active subscription</div>
              <div className="text-sm space-y-2">
                <div>
                  <strong>Want to extend your rank?</strong> Toggle <strong>OFF</strong> "Make this recurring" 
                  to make a <strong>one-time payment</strong>. This adds extra days to your rank expiration.
                </div>
                <div className="text-xs text-cyan-300/80 bg-cyan-500/10 p-2 rounded border border-cyan-500/20">
                  ℹ️ Your existing subscription stays active and continues auto-renewing. This just adds bonus days on top!
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Step 1: Select Rank */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500 text-white text-sm mr-3">1</span>
            Select Your Rank
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ranks.map((rank) => (
              <Card
                key={rank.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:scale-105",
                  selectedRank?.id === rank.id
                    ? "border-cyan-500 shadow-lg shadow-cyan-500/50 bg-slate-800/80"
                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                )}
                onClick={() => setSelectedRank(rank)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Crown className="h-6 w-6" style={{ color: rank.color }} />
                    {selectedRank?.id === rank.id && (
                      <Check className="h-5 w-5 text-cyan-400" />
                    )}
                  </div>
                  <CardTitle className="text-xl" style={{ color: rank.textColor }}>
                    {rank.name}
                  </CardTitle>
                  {rank.subtitle && (
                    <CardDescription className="text-gray-400">{rank.subtitle}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white mb-1">
                    ${rank.minAmount}
                    <span className="text-sm text-gray-400 font-normal">/mo</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Step 2: Select Duration */}
        {selectedRank && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500 text-white text-sm mr-3">2</span>
              Choose Duration
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {durationPackages.map((pkg) => (
                <Card
                  key={pkg.days}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:scale-105 relative",
                    selectedDuration?.days === pkg.days
                      ? "border-cyan-500 shadow-lg shadow-cyan-500/50 bg-slate-800/80"
                      : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                  )}
                  onClick={() => setSelectedDuration(pkg)}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Calendar className="h-5 w-5 text-cyan-400" />
                      {selectedDuration?.days === pkg.days && (
                        <Check className="h-5 w-5 text-cyan-400" />
                      )}
                    </div>
                    <CardTitle className="text-lg text-white">{pkg.label}</CardTitle>
                    {pkg.discount && (
                      <Badge variant="outline" className="text-green-400 border-green-400/50">
                        Save {pkg.discount}%
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      ${pkg.price}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      ${(pkg.price / pkg.days).toFixed(2)}/day
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Payment Type & Checkout */}
        {selectedRank && selectedDuration && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500 text-white text-sm mr-3">3</span>
              Complete Purchase
            </h2>

            <Card className="border-slate-700 bg-slate-800/50 max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-white">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-300">
                    <span>Rank:</span>
                    <span className="font-semibold" style={{ color: selectedRank.textColor }}>
                      {selectedRank.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Duration:</span>
                    <span className="font-semibold">{selectedDuration.label}</span>
                  </div>
                  {selectedDuration.discount && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount:</span>
                      <span className="font-semibold">-{selectedDuration.discount}%</span>
                    </div>
                  )}
                  <div className="border-t border-slate-700 pt-3 flex justify-between text-white text-lg font-bold">
                    <span>Total:</span>
                    <span>${selectedDuration.price}</span>
                  </div>
                </div>

                {/* Recurring Toggle */}
                {subscriptionsEnabled && (
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                    <div className="flex-1">
                      <Label htmlFor="recurring" className="text-white font-semibold cursor-pointer">
                        Make this recurring
                      </Label>
                      <p className="text-sm text-gray-400 mt-1">
                        Auto-renew every {selectedDuration.label.toLowerCase()}. Cancel anytime.
                      </p>
                    </div>
                    <Switch
                      id="recurring"
                      checked={isRecurring}
                      onCheckedChange={setIsRecurring}
                      className="ml-4"
                    />
                  </div>
                )}

                {!subscriptionsEnabled && (
                  <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <Info className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-200">
                      Recurring subscriptions are temporarily unavailable. You can make a one-time purchase.
                    </div>
                  </div>
                )}

                {/* Checkout Button */}
                <Button
                  onClick={handleCheckout}
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold text-lg h-14"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Redirecting to Stripe...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Continue to Checkout
                    </>
                  )}
                </Button>

                {/* Security Badge */}
                <div className="text-center text-sm text-gray-400">
                  <Shield className="h-4 w-4 inline mr-1" />
                  Secured by Stripe • PCI Compliant
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
