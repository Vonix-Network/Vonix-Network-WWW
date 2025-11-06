'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, ArrowRight, TrendingUp, TrendingDown, Clock, DollarSign, Sparkles,
  ArrowUpDown, Pause, Play, Shield, Zap, Check, Calendar, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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

interface CurrentRankStatus {
  hasActiveRank: boolean;
  currentRank?: {
    id: string;
    name: string;
    badge: string;
    textColor: string;
    minDonation: number;
  };
  remainingDays: number;
  expiresAt: string;
  remainingValue: number;
  isPaused?: boolean;
  pausedDays?: number;
}

export default function ManageRankPage() {
  const router = useRouter();
  const [ranks, setRanks] = useState<DonationRank[]>([]);
  const [currentStatus, setCurrentStatus] = useState<CurrentRankStatus | null>(null);
  const [selectedRank, setSelectedRank] = useState<DonationRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeSelectedRank, setResumeSelectedRank] = useState<DonationRank | null>(null);
  const [resuming, setResuming] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [ranksRes, statusRes] = await Promise.all([
        fetch('/api/donor-ranks'),
        fetch('/api/user/rank-status'),
      ]);

      const ranksData = await ranksRes.json();
      const statusData = await statusRes.json();

      if (ranksData.ranks) {
        const sortedRanks = ranksData.ranks.sort(
          (a: DonationRank, b: DonationRank) => a.minDonation - b.minDonation
        );
        setRanks(sortedRanks);
      }

      setCurrentStatus(statusData);

      if (!statusData.hasActiveRank) {
        toast.error('You need an active rank to manage it');
        router.push('/donations/subscribe');
        return;
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load rank information');
    } finally {
      setLoading(false);
    }
  }

  function calculateConversion(newRank: DonationRank) {
    if (!currentStatus?.hasActiveRank || !currentStatus.currentRank) {
      return null;
    }

    const currentPricePerDay = currentStatus.currentRank.minDonation / 30;
    const newPricePerDay = newRank.minDonation / 30;
    const convertedDays = Math.floor(currentStatus.remainingValue / newPricePerDay);

    return {
      currentDays: currentStatus.remainingDays,
      currentValue: currentStatus.remainingValue,
      convertedDays,
      isUpgrade: newRank.minDonation > currentStatus.currentRank.minDonation,
      isDowngrade: newRank.minDonation < currentStatus.currentRank.minDonation,
    };
  }

  async function handleSwitch() {
    if (!selectedRank) return;

    try {
      setSwitching(true);

      const response = await fetch('/api/user/switch-rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newRankId: selectedRank.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to switch rank');
      }

      toast.success(data.message);
      
      await fetchData();
      setSelectedRank(null);
    } catch (error: any) {
      console.error('Error switching rank:', error);
      toast.error(error.message || 'Failed to switch rank');
    } finally {
      setSwitching(false);
    }
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

  async function handleResumeClick() {
    // Show modal for rank selection
    setShowResumeModal(true);
  }

  async function handleResume() {
    if (!resumeSelectedRank) {
      toast.error('Please select a rank to resume with');
      return;
    }

    try {
      setResuming(true);

      const response = await fetch('/api/user/resume-rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newRankId: resumeSelectedRank.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resume rank');
      }

      toast.success(`Rank resumed! ${data.daysRestored} days restored.`);
      setShowResumeModal(false);
      setResumeSelectedRank(null);
      await fetchData();
    } catch (error: any) {
      console.error('Error resuming rank:', error);
      toast.error(error.message || 'Failed to resume rank');
    } finally {
      setResuming(false);
    }
  }

  function calculateResumeConversion(newRank: DonationRank) {
    if (!currentStatus?.currentRank || !currentStatus.pausedDays) {
      return null;
    }

    const oldPricePerDay = currentStatus.currentRank.minDonation / 30;
    const newPricePerDay = newRank.minDonation / 30;
    const value = oldPricePerDay * currentStatus.pausedDays;
    const convertedDays = Math.floor(value / newPricePerDay);

    return {
      currentDays: currentStatus.pausedDays,
      convertedDays,
      value,
      isUpgrade: newRank.minDonation > currentStatus.currentRank.minDonation,
      isDowngrade: newRank.minDonation < currentStatus.currentRank.minDonation,
    };
  }

  const conversion = selectedRank ? calculateConversion(selectedRank) : null;

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
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 rounded-full mb-6">
              <ArrowUpDown className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">Free Rank Management</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Manage Your 
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"> Rank</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8">
              Switch between ranks instantly with automatic day conversion - completely free!
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Current Rank Status Card */}
          {currentStatus?.hasActiveRank && currentStatus.currentRank && (
            <Card className="mb-8 border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 shadow-xl shadow-cyan-500/10">
              <CardContent className="pt-6">
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Rank Badge */}
                  <div className="lg:col-span-1 flex items-center justify-center">
                    <div className="text-center">
                      {currentStatus.isPaused ? (
                        <>
                          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-6 rounded-2xl border border-yellow-500/30 mb-4 inline-block">
                            <Pause className="h-16 w-16 text-yellow-400" />
                          </div>
                          <div className="text-4xl font-bold mb-2 text-gray-400">
                            No Active Rank
                          </div>
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-sm">
                            <Pause className="h-3 w-3 mr-1" />
                            Rank Paused
                          </Badge>
                          <p className="text-sm text-gray-500 mt-3">
                            {currentStatus.pausedDays} days banked from<br />
                            <span style={{ color: currentStatus.currentRank.textColor }}>
                              {currentStatus.currentRank.badge || currentStatus.currentRank.name}
                            </span>
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 p-6 rounded-2xl border border-cyan-500/30 mb-4 inline-block">
                            <Crown className="h-16 w-16 text-cyan-400" />
                          </div>
                          <div
                            className="text-4xl font-bold mb-2"
                            style={{ color: currentStatus.currentRank.textColor }}
                          >
                            {currentStatus.currentRank.badge || currentStatus.currentRank.name}
                          </div>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-sm">
                            <Zap className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="lg:col-span-2">
                    <h3 className="text-2xl font-bold text-white mb-6">Your Rank Status</h3>
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
                            <div className="bg-green-500/20 p-2 rounded-lg">
                              <DollarSign className="h-5 w-5 text-green-400" />
                            </div>
                            <p className="text-sm text-gray-400">Current Value</p>
                          </div>
                          <p className="text-3xl font-bold text-white">
                            ${currentStatus.remainingValue.toFixed(2)}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-slate-700 bg-slate-800/50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="bg-purple-500/20 p-2 rounded-lg">
                              <Calendar className="h-5 w-5 text-purple-400" />
                            </div>
                            <p className="text-sm text-gray-400">Expiration Date</p>
                          </div>
                          <p className="text-lg font-semibold text-white">
                            {currentStatus.isPaused ? 'Paused' : new Date(currentStatus.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-slate-700 bg-slate-800/50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="bg-pink-500/20 p-2 rounded-lg">
                              <Shield className="h-5 w-5 text-pink-400" />
                            </div>
                            <p className="text-sm text-gray-400">Status</p>
                          </div>
                          <p className="text-lg font-semibold text-white">
                            {currentStatus.isPaused ? 'Rank Paused' : 'All Perks Active'}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-3">
                      {currentStatus.isPaused ? (
                        <Button
                          onClick={handleResumeClick}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Choose Rank to Resume
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
                        onClick={() => router.push('/donations/extend')}
                        className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Extend Time
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

          {/* Conversion Preview */}
          {selectedRank && conversion && (
            <Card className={`mb-8 border-2 transition-all duration-300 ${
              conversion.isUpgrade 
                ? 'border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/5' 
                : 'border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-cyan-500/5'
            }`}>
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${
                    conversion.isUpgrade ? 'bg-green-500/20 border border-green-500/30' : 'bg-blue-500/20 border border-blue-500/30'
                  }`}>
                    {conversion.isUpgrade ? (
                      <TrendingUp className="h-5 w-5 text-green-400" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-blue-400" />
                    )}
                    <span className={`font-semibold ${conversion.isUpgrade ? 'text-green-400' : 'text-blue-400'}`}>
                      {conversion.isUpgrade ? 'Upgrading' : 'Switching'} to {selectedRank.name}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-2">Day Conversion Preview</h3>
                  <p className="text-gray-400">Your remaining value will be preserved</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                  {/* Current */}
                  <Card className="border-slate-700 bg-slate-800/50">
                    <CardContent className="p-6 text-center">
                      <p className="text-sm text-gray-400 mb-2">Current</p>
                      <p className="text-4xl font-bold text-white mb-1">{conversion.currentDays}</p>
                      <p className="text-sm text-gray-400">days</p>
                      <div className="mt-3 pt-3 border-t border-slate-700">
                        <p className="text-xs text-gray-500">${conversion.currentValue.toFixed(2)} value</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Arrow */}
                  <div className="flex items-center justify-center">
                    <div className="bg-cyan-500/20 p-4 rounded-full border border-cyan-500/30">
                      <ArrowRight className="h-8 w-8 text-cyan-400" />
                    </div>
                  </div>

                  {/* After Switch */}
                  <Card className={`border-2 ${
                    conversion.isUpgrade ? 'border-green-500/50 bg-green-500/10' : 'border-blue-500/50 bg-blue-500/10'
                  }`}>
                    <CardContent className="p-6 text-center">
                      <p className="text-sm text-gray-400 mb-2">After Switch</p>
                      <p className={`text-4xl font-bold mb-1 ${
                        conversion.isUpgrade ? 'text-green-400' : 'text-blue-400'
                      }`}>
                        {conversion.convertedDays}
                      </p>
                      <p className={`text-sm ${conversion.isUpgrade ? 'text-green-400' : 'text-blue-400'}`}>
                        days
                      </p>
                      <div className="mt-3 pt-3 border-t border-slate-700">
                        <p className="text-xs text-gray-500">Same ${conversion.currentValue.toFixed(2)} value</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Info Box */}
                <div className={`mt-6 p-4 rounded-lg border text-center ${
                  conversion.isUpgrade 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-blue-500/10 border-blue-500/30'
                }`}>
                  <p className={`text-sm ${conversion.isUpgrade ? 'text-green-400' : 'text-blue-400'}`}>
                    {conversion.isUpgrade ? (
                      <>⬆️ Upgrading gives you better perks with {conversion.currentDays - conversion.convertedDays} fewer days</>
                    ) : (
                      <>⬇️ You'll get {conversion.convertedDays - conversion.currentDays} extra days since this rank costs less per day!</>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rank Selection */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-2xl">Switch to a Different Rank</CardTitle>
              <CardDescription className="text-base">
                Choose any rank - your remaining time value converts automatically and it's completely free
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {ranks
                  .filter(rank => rank.id !== currentStatus?.currentRank?.id)
                  .map((rank) => {
                    const conv = calculateConversion(rank);
                    const isSelected = selectedRank?.id === rank.id;

                    return (
                      <button
                        key={rank.id}
                        onClick={() => setSelectedRank(rank)}
                        className={`relative group text-left p-6 rounded-xl border-2 transition-all duration-300 ${
                          isSelected
                            ? 'border-cyan-400 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 scale-105 shadow-xl shadow-cyan-500/20'
                            : 'border-slate-700 bg-slate-800/30 hover:border-cyan-500/30 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className="text-2xl font-bold"
                            style={{ color: rank.textColor }}
                          >
                            {rank.badge || rank.name}
                          </span>
                          {conv && (
                            <Badge className={`${
                              conv.isUpgrade 
                                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            }`}>
                              {conv.convertedDays}d
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-gray-300 mb-4 min-h-[40px]">
                          {rank.description}
                        </p>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">${rank.minDonation}/month</span>
                          {isSelected && (
                            <div className="flex items-center gap-1 text-cyan-400">
                              <Check className="h-4 w-4" />
                              <span className="font-semibold">Selected</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleSwitch}
                  disabled={!selectedRank || switching}
                  size="lg"
                  className="flex-1 h-14 text-base font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 disabled:opacity-50"
                >
                  {switching ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Switching...
                    </>
                  ) : (
                    <>
                      <ArrowUpDown className="h-5 w-5 mr-2" />
                      Switch Rank (Free)
                    </>
                  )}
                </Button>
                {selectedRank && (
                  <Button
                    onClick={() => setSelectedRank(null)}
                    variant="outline"
                    size="lg"
                    className="sm:w-32 h-14 border-slate-600 hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                )}
              </div>

              {/* Info */}
              <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-cyan-400 font-semibold mb-1">Completely Free & Instant</p>
                    <p className="text-sm text-gray-400">
                      Your remaining time value is preserved. Switch as many times as you want - no payment required!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resume Rank Modal */}
      {showResumeModal && currentStatus?.isPaused && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto border-cyan-500/30 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Play className="h-6 w-6 text-green-400" />
                Choose Rank to Resume
              </CardTitle>
              <CardDescription className="text-base">
                You have {currentStatus.pausedDays} days banked. Select which rank to resume with - days will convert based on value.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Banked Days Info */}
              <Card className="mb-6 border-green-500/30 bg-green-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Banked Days</p>
                      <p className="text-3xl font-bold text-green-400">{currentStatus.pausedDays} days</p>
                      <p className="text-sm text-gray-400 mt-1">
                        From {currentStatus.currentRank?.badge || currentStatus.currentRank?.name}
                      </p>
                    </div>
                    <Shield className="h-12 w-12 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              {/* Rank Selection */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {ranks.map((rank) => {
                  const isSelected = resumeSelectedRank?.id === rank.id;
                  const conv = calculateResumeConversion(rank);
                  const isSameRank = rank.id === currentStatus.currentRank?.id;

                  return (
                    <button
                      key={rank.id}
                      onClick={() => setResumeSelectedRank(rank)}
                      className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
                        isSelected
                          ? 'border-green-400 bg-gradient-to-br from-green-500/10 to-emerald-500/10 scale-105 shadow-xl'
                          : 'border-slate-700 bg-slate-800/30 hover:border-green-500/30 hover:bg-slate-800/50'
                      }`}
                    >
                      {isSameRank && (
                        <div className="absolute -top-2 -right-2">
                          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                            Original
                          </Badge>
                        </div>
                      )}

                      <div className="text-center mb-4">
                        <span
                          className="text-2xl font-bold"
                          style={{ color: rank.textColor }}
                        >
                          {rank.badge || rank.name}
                        </span>
                      </div>

                      {conv && (
                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">You'll get:</span>
                            <span className={`text-xl font-bold ${
                              conv.isUpgrade ? 'text-yellow-400' : conv.isDowngrade ? 'text-green-400' : 'text-cyan-400'
                            }`}>
                              {conv.convertedDays}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {conv.isUpgrade ? '⬆️ Less days, better perks' : conv.isDowngrade ? '⬇️ More days, lower cost' : '✓ Same days'}
                          </div>
                        </div>
                      )}

                      <div className="text-sm text-gray-400 text-center">
                        ${rank.minDonation}/month
                      </div>

                      {isSelected && (
                        <div className="mt-3 flex items-center justify-center gap-2 text-green-400 text-sm font-semibold">
                          <Check className="h-4 w-4" />
                          Selected
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Conversion Preview */}
              {resumeSelectedRank && (() => {
                const conv = calculateResumeConversion(resumeSelectedRank);
                if (!conv) return null;

                return (
                  <Card className={`mb-6 border-2 ${
                    conv.isUpgrade 
                      ? 'border-yellow-500/30 bg-yellow-500/5' 
                      : conv.isDowngrade 
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-cyan-500/30 bg-cyan-500/5'
                  }`}>
                    <CardContent className="pt-6">
                      <div className="text-center mb-4">
                        <h4 className="text-xl font-bold text-white mb-2">Conversion Preview</h4>
                        <p className="text-gray-400">
                          {conv.isUpgrade 
                            ? 'Upgrading to a better rank with fewer days'
                            : conv.isDowngrade
                            ? 'You\'ll get more days with this lower-cost rank!'
                            : 'Resuming with same rank - same days'}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                        <Card className="border-slate-700 bg-slate-800/50">
                          <CardContent className="p-4 text-center">
                            <p className="text-sm text-gray-400 mb-1">Banked</p>
                            <p className="text-2xl font-bold text-white">{conv.currentDays}</p>
                            <p className="text-xs text-gray-500 mt-1">days</p>
                          </CardContent>
                        </Card>
                        <div className="flex items-center justify-center">
                          <ArrowRight className="h-8 w-8 text-green-400" />
                        </div>
                        <Card className={`border-2 ${
                          conv.isUpgrade ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-green-500/50 bg-green-500/10'
                        }`}>
                          <CardContent className="p-4 text-center">
                            <p className="text-sm text-gray-400 mb-1">You Get</p>
                            <p className={`text-2xl font-bold ${
                              conv.isUpgrade ? 'text-yellow-400' : 'text-green-400'
                            }`}>
                              {conv.convertedDays}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">days</p>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={handleResume}
                  disabled={!resumeSelectedRank || resuming}
                  size="lg"
                  className="flex-1 h-14 text-base font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50"
                >
                  {resuming ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Resuming...
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Resume with {resumeSelectedRank?.name || 'Selected Rank'}
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowResumeModal(false);
                    setResumeSelectedRank(null);
                  }}
                  variant="outline"
                  size="lg"
                  className="w-32 h-14 border-slate-600 hover:bg-slate-800"
                  disabled={resuming}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
