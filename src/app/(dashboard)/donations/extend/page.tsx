'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, CreditCard, Calendar, TrendingUp, ArrowUpDown, Sparkles, 
  Check, Pause, Play, Clock, DollarSign, Shield, Zap, Plus, RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { SubscriptionPaymentForm } from '@/components/donations/subscription-payment-form';

export default function ExtendRankPage() {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState<{ days: number; label: string; price: number; discount?: number; popular?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<string>('none');
  const [fullRank, setFullRank] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [statusRes, paymentsRes] = await Promise.all([
        fetch('/api/user/rank-status'),
        fetch('/api/payments/status'),
      ]);

      const statusData = await statusRes.json();
      const paymentsData = await paymentsRes.json();

      setCurrentStatus(statusData);
      setPaymentsEnabled(paymentsData.enabled);
      setPaymentProvider(paymentsData.provider);

      if (!statusData.hasActiveRank) {
        toast.error('You need an active rank to extend it');
        router.push('/donations/subscribe');
        return;
      }

      // Redirect if rank is paused
      if (statusData.isPaused) {
        toast.info('Please resume your rank first to extend it');
        router.push('/donations/manage-rank');
        return;
      }

      const ranksRes = await fetch('/api/donor-ranks');
      const ranksData = await ranksRes.json();
      const rank = ranksData.ranks.find((r: any) => r.id === statusData.currentRank.id);
      setFullRank(rank);

      if (!paymentsData.enabled) {
        toast.error('Payment system is not configured');
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load rank information');
    } finally {
      setLoading(false);
    }
  }

  function getDurationPackages() {
    if (!currentStatus?.currentRank) return [];

    const monthlyPrice = currentStatus.currentRank.minDonation;
    
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

  async function handlePause() {
    try {
      const response = await fetch('/api/user/pause-rank', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to pause rank');
      }

      toast.success(`Rank paused! ${data.pausedDays} days banked for later use.`);
      await fetchData();
    } catch (error: any) {
      console.error('Error pausing rank:', error);
      toast.error(error.message || 'Failed to pause rank');
    }
  }

  async function handleResume() {
    try {
      const response = await fetch('/api/user/resume-rank', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resume rank');
      }

      toast.success(`Rank resumed! ${data.daysRestored} days restored.`);
      await fetchData();
    } catch (error: any) {
      console.error('Error resuming rank:', error);
      toast.error(error.message || 'Failed to resume rank');
    }
  }

  function handleExtend() {
    if (!selectedDuration) {
      toast.error('Please select a duration');
      return;
    }

    setProcessing(true);
    const paymentSection = document.getElementById('payment-section');
    if (paymentSection) {
      paymentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

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

  const durationPackages = getDurationPackages();
  const totalDays = (currentStatus?.remainingDays || 0) + (selectedDuration?.days || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 blur-3xl"></div>
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-full mb-6">
              <Plus className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">Extend Your Time</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Extend Your 
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"> Rank</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8">
              Add more time to your current rank with exclusive discounts on longer durations
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Current Rank Status */}
          {currentStatus?.hasActiveRank && currentStatus.currentRank && (
            <Card className="mb-8 border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 shadow-xl shadow-cyan-500/10">
              <CardContent className="pt-6">
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Rank Badge */}
                  <div className="lg:col-span-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 p-6 rounded-2xl border border-cyan-500/30 mb-4 inline-block">
                        <Crown className="h-16 w-16 text-cyan-400" />
                      </div>
                      <div
                        className="text-4xl font-bold mb-2"
                        style={{ color: currentStatus.currentRank.textColor }}
                      >
                        {currentStatus.currentRank.badge || currentStatus.currentRank.name}
                      </div>
                      {currentStatus.isPaused ? (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-sm">
                          <Pause className="h-3 w-3 mr-1" />
                          Paused
                        </Badge>
                      ) : (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-sm">
                          <Zap className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="lg:col-span-2">
                    <h3 className="text-2xl font-bold text-white mb-6">Current Status</h3>
                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                      <Card className="border-slate-700 bg-slate-800/50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="bg-cyan-500/20 p-2 rounded-lg">
                              <Clock className="h-5 w-5 text-cyan-400" />
                            </div>
                            <p className="text-sm text-gray-400">Time Remaining</p>
                          </div>
                          <p className="text-3xl font-bold text-white">
                            {currentStatus.remainingDays}
                            <span className="text-lg text-gray-400 ml-2">days</span>
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-slate-700 bg-slate-800/50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="bg-purple-500/20 p-2 rounded-lg">
                              <Calendar className="h-5 w-5 text-purple-400" />
                            </div>
                            <p className="text-sm text-gray-400">Expiration</p>
                          </div>
                          <p className="text-lg font-semibold text-white">
                            {currentStatus.isPaused ? 'Paused' : new Date(currentStatus.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-3">
                      {currentStatus.isPaused ? (
                        <Button
                          onClick={handleResume}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Resume Rank
                        </Button>
                      ) : (
                        <Button
                          onClick={handlePause}
                          variant="outline"
                          className="border-yellow-500/30 hover:bg-yellow-500/10"
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Pause Rank
                        </Button>
                      )}
                      <Button
                        onClick={() => router.push('/donations/manage-rank')}
                        variant="outline"
                        className="border-purple-500/30 hover:bg-purple-500/10"
                      >
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        Switch Rank
                      </Button>
                      <Button
                        onClick={() => fetchData()}
                        variant="outline"
                        className="border-slate-600 hover:bg-slate-800"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Duration Selection */}
            <div className="lg:col-span-2">
              <Card className="border-slate-700 bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-cyan-400" />
                    Select Duration
                  </CardTitle>
                  <CardDescription className="text-base">
                    Choose how much time to add - save up to 15% on longer durations
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
                          className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
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

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-slate-700 bg-slate-800/50">
                <CardHeader>
                  <CardTitle>Extension Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedDuration ? (
                    <>
                      <div className="space-y-4">
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

                        <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg p-4">
                          <div className="text-sm text-gray-400 mb-2">Total After Extension</div>
                          <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                            {totalDays} days
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {currentStatus.remainingDays} current + {selectedDuration.days} new
                          </div>
                        </div>
                        
                        <div className="border-t border-slate-700 pt-4">
                          <div className="flex justify-between items-baseline mb-4">
                            <span className="text-2xl font-bold text-white">Total</span>
                            <div className="text-right">
                              <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                                ${selectedDuration.price}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={handleExtend}
                        disabled={!paymentsEnabled || processing}
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 disabled:opacity-50"
                        size="lg"
                      >
                        {!paymentsEnabled ? (
                          <>Payment Not Available</>
                        ) : processing ? (
                          <>Proceed to Checkout ↓</>
                        ) : (
                          <>
                            <CreditCard className="h-5 w-5 mr-2" />
                            Extend for {selectedDuration.label}
                          </>
                        )}
                      </Button>

                      <div className="space-y-2 pt-4 border-t border-slate-700">
                        <div className="flex items-start gap-2 text-sm text-gray-300">
                          <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>Instant activation</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-300">
                          <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>Secure payment via {paymentProvider === 'stripe' ? 'Stripe' : 'Square'}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-300">
                          <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>Days added immediately</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">
                        Select a duration to continue
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Section */}
      {processing && selectedDuration && currentStatus?.currentRank && (
        <div id="payment-section" className="container mx-auto px-4 pb-16">
          <div className="max-w-2xl mx-auto">
            <Card className="border-cyan-500/30 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <CreditCard className="h-6 w-6 text-cyan-400" />
                  Complete Your Extension
                </CardTitle>
                <CardDescription className="text-base">
                  Extending {currentStatus.currentRank.badge || currentStatus.currentRank.name} for {selectedDuration.label}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 p-6 rounded-lg mb-6 border border-slate-700">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-400">Duration:</span>
                      <div className="font-semibold text-white mt-1">{selectedDuration.label}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Current Time:</span>
                      <div className="font-semibold text-white mt-1">{currentStatus.remainingDays} days</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-700 mb-2">
                    <span className="text-gray-400">Total After:</span>
                    <span className="text-cyan-400 font-bold text-xl">{totalDays} days</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                    <span className="text-white font-bold text-lg">Amount:</span>
                    <span className="text-cyan-400 font-bold text-3xl">${selectedDuration.price}</span>
                  </div>
                </div>

                <SubscriptionPaymentForm
                  rankId={currentStatus.currentRank.id}
                  rankName={currentStatus.currentRank.name}
                  days={selectedDuration.days}
                  price={selectedDuration.price}
                  durationLabel={selectedDuration.label}
                  isRecurring={false}
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
