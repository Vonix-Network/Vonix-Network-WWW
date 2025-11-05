/**
 * Live Server Status Component
 * Client-side component that fetches and displays real-time server status
 */

'use client';

import { useEffect, useState } from 'react';
import { ServerStatusCarousel } from './server-status-carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/enterprise-card';

interface Server {
  id: number;
  name: string;
  description: string | null;
  ipAddress: string;
  port: number;
  status: string;
  playersOnline: number;
  playersMax: number;
  version: string | null;
  modpackName: string | null;
}

interface LiveServerStatusProps {
  initialServers: Server[];
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export function LiveServerStatus({ 
  initialServers, 
  autoRefresh = true,
  refreshInterval = 60000, // 60 seconds default
}: LiveServerStatusProps) {
  const [servers, setServers] = useState<Server[]>(initialServers);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [mounted, setMounted] = useState(false);

  const fetchServers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/servers', {
        cache: 'no-store',
      });
      
      if (response.ok) {
        const data = await response.json();
        setServers(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch server status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    // mark mounted to avoid SSR/client time mismatch during hydration
    setMounted(true);

    if (!autoRefresh) return;

    // Fetch immediately on mount (but don't block initial render)
    const timer = setTimeout(() => fetchServers(), 1000); // Wait 1s after mount

    const interval = setInterval(() => {
      fetchServers();
    }, refreshInterval);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval]);

  // Manual refresh on visibility change (when user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastUpdate = Date.now() - lastUpdate.getTime();
        // Refresh if it's been more than 30 seconds
        if (timeSinceLastUpdate > 30000) {
          fetchServers();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [lastUpdate]);

  if (servers.length === 0 && !isLoading) {
    return (
      <Card variant="gradient" glow>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No servers available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      <ServerStatusCarousel servers={servers} isLoading={isLoading} />

      {/* Last Updated Timestamp - render after mount to avoid hydration mismatch */}
      {autoRefresh && mounted && (
        <div className="mt-2 text-center text-xs text-muted-foreground">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

// Loading skeleton for SSR
export function LiveServerStatusSkeleton() {
  return (
    <Card variant="gradient" glow>
      <CardContent className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        <Skeleton className="h-4 w-full" />

        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}
