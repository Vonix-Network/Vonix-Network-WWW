'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, Check, CreditCard, Calendar, TrendingUp, Sparkles, 
  ArrowUpDown, Shield, Zap, Star, Gift, Heart, Lock 
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { SubscriptionPaymentForm } from '@/components/donations/subscription-payment-form';

interface DonationRank {
  id: string;
  name: string;
  badge: string;
  description: string;
  features: string[];
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  minDonation: number;
  priority: number;
}

export default function SubscribePage() {
  const router = useRouter();
  const [ranks, setRanks] = useState<DonationRank[]>([]);
  const [selectedRank, setSelectedRank] = useState<DonationRank | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<{ days: number; label: string; price: number; discount?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<string>('none');
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => {
    checkPaymentStatus();
    fetchRanks();
    checkActiveRank();
  }, []);

  async function checkActiveRank() {
    try {
      const response = await fetch('/api/user/rank-status');
      const data = await response.json();
      
      if (data.hasActiveRank) {
        toast.info('You already have an active rank. Redirecting to extend page...');
        setTimeout(() => {
          router.push('/donations/extend');
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to check rank status:', error);
    }
  }

  async function checkPaymentStatus() {
    try {
      const response = await fetch('/api/payments/status');
      const data = await response.json();
      setPaymentsEnabled(data.enabled);
      setPaymentProvider(data.provider);
      
      if (!data.enabled) {
        toast.error('Rank subscriptions are not available at this time');
        router.push('/donations');
      }
    } catch (error) {
      console.error('Failed to check payment status:', error);
      toast.error('Unable to load subscription system');
      router.push('/donations');
    }
  }

  async function fetchRanks() {
    try {
      const response = await fetch('/api/donor-ranks');
      const data = await response.json();
      
      if (data.ranks) {
        const sortedRanks = data.ranks.sort((a: DonationRank, b: DonationRank) => a.minDonation - b.minDonation);
        setRanks(sortedRanks);
        
        if (sortedRanks.length > 0) {
          setSelectedRank(sortedRanks[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch ranks:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  }

  function getRankDurationPackages(rank: DonationRank) {
    const monthlyPrice = rank.minDonation;
    
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

  function handlePurchase() {
    if (!selectedRank || !selectedDuration) {
      toast.error('Please select a rank and duration');
      return;
    }

    setProcessing(true);
    const paymentSection = document.getElementById('payment-section');
    if (paymentSection) {
      paymentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      {/* Hero Section with Gradient */}
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
                <div className="text-xs text-gray-400">Stripe/Square</div>
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
        <div className="max-w-7xl mx-auto">
          {/* Rank Selection - Premium Grid Layout */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Select Your Rank</h2>
              <p className="text-gray-400">Each rank includes all previous features plus exclusive additions</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {ranks.map((rank, index) => {
                const isSelected = selectedRank?.id === rank.id;
                const isPopular = index === 1; // Second rank is "popular"
                
                return (
                  <button
                    key={rank.id}
                    onClick={() => setSelectedRank(rank)}
                    className={`relative group text-left transition-all duration-300 ${
                      isSelected
                        ? 'scale-105 z-10'
                        : 'hover:scale-102'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 border-0 text-white shadow-lg">
                          <Star className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      </div>
                    )}
                    
                    <Card className={`h-full border-2 transition-all duration-300 ${
                      isSelected
                        ? 'border-cyan-400 shadow-xl shadow-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-purple-500/5'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:shadow-lg'
                    }`}>
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between mb-3">
                          <div 
                            className="text-3xl font-bold"
                            style={{ color: rank.textColor }}
                          >
                            {rank.badge || rank.name}
                          </div>
                          {isSelected && (
                            <div className="bg-cyan-400 text-slate-900 rounded-full p-1.5">
                              <Check className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-white">
                            ${rank.minDonation}
                          </span>
                          <span className="text-sm text-gray-400">/month</span>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <p className="text-sm text-gray-300 min-h-[40px]">
                          {rank.description}
                        </p>
                        
                        <div className="border-t border-slate-700 pt-4">
                          <div className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                            Includes:
                          </div>
                          <div className="space-y-2">
                            {rank.features.slice(0, 4).map((feature, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm">
                                <Check className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-300">{feature}</span>
                              </div>
                            ))}
                            {rank.features.length > 4 && (
                              <div className="text-xs text-cyan-400 font-medium">
                                + {rank.features.length - 4} more features
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration & Payment Section */}
          {selectedRank && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Duration Selection */}
              <div className="lg:col-span-2">
                <Card className="border-slate-700 bg-slate-800/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Calendar className="h-6 w-6 text-cyan-400" />
                      Choose Your Plan
                    </CardTitle>
                    <CardDescription className="text-base">
                      Longer plans include automatic discounts - save up to 15%
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {durationPackages.map((pkg) => {
                        const isSelected = selectedDuration?.days === pkg.days;
                        
                        return (
                          <button
                            key={pkg.days}
                            onClick={() => setSelectedDuration(pkg)}
                            className={`relative group p-6 rounded-xl border-2 transition-all duration-300 ${
                              isSelected
                                ? 'border-cyan-400 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 scale-105 shadow-xl'
                                : 'border-slate-700 bg-slate-800/30 hover:border-cyan-500/30 hover:bg-slate-800/50'
                            }`}
                          >
                            {pkg.discount && (
                              <div className="absolute -top-2 -right-2">
                                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg">
                                  Save {pkg.discount}%
                                </Badge>
                              </div>
                            )}
                            
                            {pkg.popular && (
                              <div className="absolute -top-2 left-4">
                                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg">
                                  Best Value
                                </Badge>
                              </div>
                            )}
                            
                            <div className="text-center">
                              <div className="text-xl font-bold text-white mb-3">
                                {pkg.label}
                              </div>
                              
                              <div className="mb-3">
                                <div className="flex items-baseline justify-center gap-1">
                                  <span className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                                    ${pkg.price}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-400 mt-1">
                                  ${(pkg.price / (pkg.days / 30)).toFixed(2)}/month
                                </div>
                              </div>
                              
                              <div className="text-xs text-gray-400 bg-slate-900/50 px-3 py-2 rounded-lg">
                                ${(pkg.price / pkg.days).toFixed(2)} per day
                              </div>
                              
                              {isSelected && (
                                <div className="mt-3 flex items-center justify-center gap-2 text-cyan-400 text-sm font-semibold">
                                  <Check className="h-4 w-4" />
                                  Selected
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary - Sticky Sidebar */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24 border-slate-700 bg-slate-800/50">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {selectedDuration ? (
                      <>
                        <div className="space-y-4">
                          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                            <div className="text-sm text-gray-400 mb-2">Rank</div>
                            <div 
                              className="text-2xl font-bold"
                              style={{ color: selectedRank.textColor }}
                            >
                              {selectedRank.badge || selectedRank.name}
                            </div>
                          </div>
                          
                          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                            <div className="text-sm text-gray-400 mb-2">Duration</div>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-white">
                                {selectedDuration.label}
                              </span>
                              {selectedDuration.discount && (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                  -{selectedDuration.discount}%
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="border-t border-slate-700 pt-4">
                            <div className="flex justify-between items-baseline mb-4">
                              <span className="text-2xl font-bold text-white">Total</span>
                              <div className="text-right">
                                <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                                  ${selectedDuration.price}
                                </div>
                                <div className="text-xs text-gray-400">
                                  for {selectedDuration.days} days
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Recurring Toggle */}
                        <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-lg p-4">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isRecurring}
                              onChange={(e) => setIsRecurring(e.target.checked)}
                              className="w-5 h-5 mt-0.5 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-white mb-1">
                                Auto-renew subscription
                              </div>
                              <p className="text-xs text-gray-400">
                                Never lose your rank. Cancel anytime from settings.
                              </p>
                            </div>
                          </label>
                        </div>

                        <Button
                          onClick={handlePurchase}
                          disabled={!paymentsEnabled}
                          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                          size="lg"
                        >
                          {!paymentsEnabled ? (
                            <>Payment Not Available</>
                          ) : (
                            <>
                              <Lock className="h-5 w-5 mr-2" />
                              {processing ? 'Proceed to Checkout ↓' : 'Secure Checkout'}
                            </>
                          )}
                        </Button>

                        {/* Benefits List */}
                        <div className="space-y-2 pt-4 border-t border-slate-700">
                          <div className="flex items-start gap-2 text-sm text-gray-300">
                            <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>Instant rank activation</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm text-gray-300">
                            <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>Upgrade anytime with day conversion</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm text-gray-300">
                            <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>Secure payment via {paymentProvider === 'stripe' ? 'Stripe' : 'Square'}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <Gift className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">
                          Select a duration above to continue
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Section */}
      {processing && selectedRank && selectedDuration && (
        <div id="payment-section" className="container mx-auto px-4 pb-16">
          <div className="max-w-2xl mx-auto">
            <Card className="border-cyan-500/30 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <CreditCard className="h-6 w-6 text-cyan-400" />
                  Complete Your Purchase
                </CardTitle>
                <CardDescription className="text-base">
                  {selectedRank.badge || selectedRank.name} - {selectedDuration.label} for ${selectedDuration.price}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 p-6 rounded-lg mb-6 border border-slate-700">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-400">Rank:</span>
                      <div className="font-semibold mt-1" style={{ color: selectedRank.textColor }}>
                        {selectedRank.badge || selectedRank.name}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Duration:</span>
                      <div className="font-semibold text-white mt-1">{selectedDuration.label}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                    <span className="text-white font-bold text-lg">Total:</span>
                    <span className="text-cyan-400 font-bold text-3xl">${selectedDuration.price}</span>
                  </div>
                </div>

                <SubscriptionPaymentForm
                  rankId={selectedRank.id}
                  rankName={selectedRank.name}
                  days={selectedDuration.days}
                  price={selectedDuration.price}
                  durationLabel={selectedDuration.label}
                  isRecurring={isRecurring}
                  onSuccess={() => {}}
                  onCancel={() => setProcessing(false)}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
