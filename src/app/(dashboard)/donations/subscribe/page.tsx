'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Check, CreditCard, Calendar, TrendingUp, Sparkles } from 'lucide-react';
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
  const [squareEnabled, setSquareEnabled] = useState(false);

  useEffect(() => {
    checkSquareStatus();
    fetchRanks();
  }, []);

  async function checkSquareStatus() {
    try {
      const response = await fetch('/api/square/status');
      const data = await response.json();
      setSquareEnabled(data.enabled);
    } catch (error) {
      console.error('Failed to check Square status:', error);
    }
  }

  async function fetchRanks() {
    try {
      const response = await fetch('/api/donor-ranks');
      const data = await response.json();
      
      if (data.ranks) {
        // Sort by minDonation (lower = first)
        const sortedRanks = data.ranks.sort((a: DonationRank, b: DonationRank) => a.minDonation - b.minDonation);
        setRanks(sortedRanks);
        
        // Auto-select first rank
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

  // Calculate duration packages based on actual rank pricing
  function getRankDurationPackages(rank: DonationRank) {
    const monthlyPrice = rank.minDonation; // minDonation is the monthly price
    
    return [
      {
        days: 30,
        label: '1 Month',
        price: monthlyPrice,
      },
      {
        days: 90,
        label: '3 Months',
        price: Math.round(monthlyPrice * 3 * 0.95 * 100) / 100, // 5% discount
        discount: 5,
      },
      {
        days: 180,
        label: '6 Months',
        price: Math.round(monthlyPrice * 6 * 0.90 * 100) / 100, // 10% discount
        discount: 10,
      },
      {
        days: 365,
        label: '12 Months',
        price: Math.round(monthlyPrice * 12 * 0.85 * 100) / 100, // 15% discount
        discount: 15,
      },
    ];
  }

  // Calculate rank value info from actual price
  function getRankInfo(rank: DonationRank) {
    return {
      pricePerDay: Math.round((rank.minDonation / 30) * 100) / 100,
      pricePerMonth: rank.minDonation,
      pricePerYear: Math.round(rank.minDonation * 12 * 0.85 * 100) / 100,
    };
  }

  function handlePurchase() {
    if (!selectedRank || !selectedDuration) {
      toast.error('Please select a rank and duration');
      return;
    }

    // Scroll to payment section
    setProcessing(true);
    const paymentSection = document.getElementById('payment-section');
    if (paymentSection) {
      paymentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  const durationPackages = selectedRank ? getRankDurationPackages(selectedRank) : [];
  const rankInfo = selectedRank ? getRankInfo(selectedRank) : null;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
          <Crown className="h-10 w-10 text-yellow-400" />
          Rank Subscriptions
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Choose your rank and duration. Upgrade anytime and your remaining time converts automatically!
        </p>
      </div>

      {/* Square Not Configured Warning */}
      {!squareEnabled && !loading && (
        <Card className="mb-8 border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="bg-yellow-500/20 p-3 rounded-lg">
                <CreditCard className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Payment Processing Not Configured
                </h3>
                <p className="text-gray-300 mb-4">
                  The rank subscription system is ready, but Square payment processing needs to be configured.
                  You can browse ranks and pricing, but purchases require Square to be enabled.
                </p>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <p className="text-sm text-gray-400 mb-2">Administrator: Add to .env file:</p>
                  <code className="text-sm text-cyan-400 block">
                    SQUARE_INTEGRATION_ENABLED=true<br />
                    SQUARE_ACCESS_TOKEN=your-token<br />
                    SQUARE_LOCATION_ID=your-location<br />
                    SQUARE_APPLICATION_ID=your-app-id
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Rank Selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan-400" />
                Select Your Rank
              </CardTitle>
              <CardDescription>
                Each rank unlocks exclusive features and perks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {ranks.map((rank) => {
                  const isSelected = selectedRank?.id === rank.id;
                  const info = getRankInfo(rank);
                  
                  return (
                    <button
                      key={rank.id}
                      onClick={() => setSelectedRank(rank)}
                      className={`text-left p-6 rounded-lg border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-500/10 scale-105'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div 
                            className="text-2xl font-bold mb-1"
                            style={{ color: rank.textColor }}
                          >
                            {rank.badge || rank.name}
                          </div>
                          <div className="text-sm text-gray-400">
                            ${info.pricePerMonth}/month
                          </div>
                        </div>
                        {isSelected && (
                          <div className="bg-cyan-400 text-slate-900 rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-300 mb-4">
                        {rank.description}
                      </p>
                      
                      <div className="space-y-2">
                        {rank.features.slice(0, 3).map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-400">
                            <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Duration Selection */}
          {selectedRank && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-cyan-400" />
                  Choose Duration
                </CardTitle>
                <CardDescription>
                  Longer durations include discounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {durationPackages.map((pkg) => {
                    const isSelected = selectedDuration?.days === pkg.days;
                    
                    return (
                      <button
                        key={pkg.days}
                        onClick={() => setSelectedDuration(pkg)}
                        className={`relative p-6 rounded-lg border-2 transition-all duration-200 ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-500/10 scale-105'
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                        }`}
                      >
                        {pkg.discount && (
                          <Badge className="absolute top-2 right-2 bg-green-500">
                            Save {pkg.discount}%
                          </Badge>
                        )}
                        
                        <div className="text-2xl font-bold text-white mb-2">
                          {pkg.label}
                        </div>
                        
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-3xl font-bold text-cyan-400">
                            ${pkg.price}
                          </span>
                          <span className="text-sm text-gray-400">
                            / {pkg.days} days
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-400">
                          ${(pkg.price / pkg.days).toFixed(2)}/day
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedRank && selectedDuration ? (
                <>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Selected Rank</div>
                      <div 
                        className="text-xl font-bold"
                        style={{ color: selectedRank.textColor }}
                      >
                        {selectedRank.badge || selectedRank.name}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Duration</div>
                      <div className="text-lg font-semibold text-white">
                        {selectedDuration.label}
                        {selectedDuration.discount && (
                          <Badge className="ml-2 bg-green-500">
                            -{selectedDuration.discount}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t border-slate-700 pt-4">
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-gray-400">Subtotal</span>
                        <span className="text-white">${selectedDuration.price}</span>
                      </div>
                      
                      <div className="flex items-baseline justify-between text-lg font-bold">
                        <span className="text-white">Total</span>
                        <span className="text-cyan-400 text-2xl">
                          ${selectedDuration.price}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handlePurchase}
                    disabled={processing || !squareEnabled}
                    className="w-full"
                    size="lg"
                  >
                    {!squareEnabled ? (
                      <>Payment Processing Not Available</>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        {processing ? 'Proceed to Checkout ↓' : 'Continue to Payment'}
                      </>
                    )}
                  </Button>

                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Upgrade anytime - your remaining days convert automatically</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Crown className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span>Rank activates immediately after payment</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  Select a rank and duration to continue
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Section - Shows when user clicks Continue to Payment */}
      {processing && selectedRank && selectedDuration && (
        <div id="payment-section" className="container mx-auto px-4 pb-16">
          <Card className="max-w-2xl mx-auto border-cyan-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-cyan-400" />
                Complete Your Purchase
              </CardTitle>
              <CardDescription>
                {selectedRank.badge || selectedRank.name} - {selectedDuration.label} for ${selectedDuration.price}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-800/50 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Selected Rank:</span>
                  <span className="font-semibold" style={{ color: selectedRank.textColor }}>
                    {selectedRank.badge || selectedRank.name}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-gray-400">Duration:</span>
                  <span className="font-semibold text-white">{selectedDuration.label}</span>
                </div>
                <div className="flex justify-between items-center text-lg mt-3 pt-3 border-t border-slate-700">
                  <span className="text-white font-bold">Total:</span>
                  <span className="text-cyan-400 font-bold text-2xl">${selectedDuration.price}</span>
                </div>
              </div>

              <p className="text-sm text-gray-400 mb-6 text-center">
                Payment will be processed securely through Square. Your rank will activate immediately after purchase.
              </p>

              <SubscriptionPaymentForm
                rankId={selectedRank.id}
                rankName={selectedRank.name}
                days={selectedDuration.days}
                price={selectedDuration.price}
                durationLabel={selectedDuration.label}
                onSuccess={() => {
                  // Success is handled in the component
                }}
                onCancel={() => setProcessing(false)}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
