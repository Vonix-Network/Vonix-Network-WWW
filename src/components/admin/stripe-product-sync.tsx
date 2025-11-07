'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SyncStatus {
  totalRanks: number;
  needsSync: number;
  allConfigured: boolean;
  ranks: {
    id: string;
    name: string;
    needsSync: boolean;
    hasProduct: boolean;
    prices: {
      monthly: boolean;
      quarterly: boolean;
      semiannual: boolean;
      yearly: boolean;
    };
  }[];
}

interface SyncResult {
  success: boolean;
  message: string;
  stats: {
    totalRanks: number;
    synced: number;
    created: number;
    updated: number;
    errors: number;
  };
  results: {
    rankId: string;
    rankName: string;
    success: boolean;
    productId: string;
    created: boolean;
    updated: boolean;
    error?: string;
    prices: {
      monthly: string | null;
      quarterly: string | null;
      semiannual: string | null;
      yearly: string | null;
    };
  }[];
}

export function StripeProductSync() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);

  const checkStatus = async () => {
    try {
      setChecking(true);
      const response = await fetch('/api/admin/stripe/sync-products', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to check sync status');
      }

      const data = await response.json();
      setStatus(data);
    } catch (error: any) {
      console.error('Error checking sync status:', error);
      toast.error('Failed to check sync status');
    } finally {
      setChecking(false);
    }
  };

  const syncProducts = async () => {
    try {
      setLoading(true);
      setResult(null);
      
      toast.loading('Syncing Stripe products...', { id: 'sync' });

      const response = await fetch('/api/admin/stripe/sync-products', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync products');
      }

      setResult(data);
      
      // Refresh status
      await checkStatus();

      if (data.success) {
        toast.success(data.message, { id: 'sync' });
      } else {
        toast.error(data.message, { id: 'sync' });
      }
    } catch (error: any) {
      console.error('Error syncing products:', error);
      toast.error(error.message || 'Failed to sync products', { id: 'sync' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Stripe Product Sync</CardTitle>
            <CardDescription>
              Automatically create and configure Stripe products and prices for donation ranks
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={checkStatus}
              disabled={checking}
              variant="outline"
              size="sm"
            >
              {checking ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Check Status
            </Button>
            <Button
              onClick={syncProducts}
              disabled={loading}
              className="bg-gradient-to-r from-cyan-500 to-blue-600"
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync Now
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        {status && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Configuration Status</h3>
              {status.allConfigured ? (
                <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  All Configured
                </Badge>
              ) : (
                <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {status.needsSync} Need Sync
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {status.ranks.map((rank) => (
                <div
                  key={rank.id}
                  className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{rank.name}</span>
                    {rank.needsSync ? (
                      <XCircle className="h-4 w-4 text-red-400" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    )}
                  </div>
                  <div className="space-y-1 text-xs text-gray-400">
                    <div className="flex items-center justify-between">
                      <span>Product:</span>
                      <Badge variant={rank.hasProduct ? 'default' : 'destructive'} className="text-[10px] h-4">
                        {rank.hasProduct ? 'OK' : 'Missing'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Prices:</span>
                      <div className="flex gap-1">
                        {['monthly', 'quarterly', 'semiannual', 'yearly'].map((interval) => (
                          <Badge
                            key={interval}
                            variant={rank.prices[interval as keyof typeof rank.prices] ? 'default' : 'destructive'}
                            className="text-[8px] h-3 px-1"
                          >
                            {interval[0].toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sync Result */}
        {result && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold mb-3">Sync Results</h3>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{result.stats.synced}</div>
                <div className="text-xs text-gray-400">Synced</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{result.stats.created}</div>
                <div className="text-xs text-gray-400">Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{result.stats.updated}</div>
                <div className="text-xs text-gray-400">Updated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{result.stats.errors}</div>
                <div className="text-xs text-gray-400">Errors</div>
              </div>
            </div>

            {result.results.some(r => !r.success) && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-red-400">Errors:</h4>
                {result.results
                  .filter(r => !r.success)
                  .map((r) => (
                    <div key={r.rankId} className="text-xs text-red-400 bg-red-500/10 rounded p-2">
                      <strong>{r.rankName}:</strong> {r.error}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>
            <strong>Automatic:</strong> Products are created automatically when users try to subscribe to a rank.
          </p>
          <p>
            <strong>Manual:</strong> Click "Sync Now" to create all missing products and prices at once.
          </p>
          <p>
            <strong>Note:</strong> This requires STRIPE_SECRET_KEY to be configured in environment variables.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
