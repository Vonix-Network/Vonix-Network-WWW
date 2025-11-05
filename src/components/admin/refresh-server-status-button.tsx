/**
 * Refresh Server Status Button
 * Admin component to manually trigger server status updates
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/enterprise-button';
import { useToast } from '@/components/ui/toast';
import { RefreshCw } from 'lucide-react';

export function RefreshServerStatusButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      
      const response = await fetch('/api/cron/update-servers', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          type: 'success',
          title: 'Servers Updated',
          description: `Updated ${data.updated} servers in ${data.duration}`,
        });
      } else {
        throw new Error(data.error || 'Update failed');
      }
    } catch (error) {
      toast({
        type: 'error',
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update server status',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      loading={isRefreshing}
      loadingText="Updating..."
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      Refresh Status
    </Button>
  );
}
