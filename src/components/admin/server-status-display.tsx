'use client';

import { useState, useEffect } from 'react';
import { Server, Wifi, WifiOff, Loader2 } from 'lucide-react';

interface ServerStatus {
  id: number;
  name: string;
  ipAddress: string;
  port: number;
  status: 'online' | 'offline' | 'loading';
  playersOnline: number;
  playersMax: number;
  version?: string | null;
}

interface ServerStatusDisplayProps {
  servers: ServerStatus[];
}

// Component for displaying server status with loading states
export function ServerStatusDisplay({ servers: initialServers }: ServerStatusDisplayProps) {
  const [serverStatuses, setServerStatuses] = useState<ServerStatus[]>(initialServers);

  useEffect(() => {
    // Update server statuses asynchronously after page loads
    const updateServerStatuses = async () => {
      const updatedServers = await Promise.all(
        initialServers.map(async (server) => {
          // Set loading state immediately
          setServerStatuses(prev =>
            prev.map(s =>
              s.id === server.id
                ? { ...s, status: 'loading' as const }
                : s
            )
          );

          try {
            const serverAddress = server.port === 25565
              ? server.ipAddress
              : `${server.ipAddress}:${server.port}`;

            const response = await fetch(`https://api.mcstatus.io/v2/status/java/${serverAddress}`, {
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
              },
            });

            if (response.ok) {
              const data = await response.json();
              return {
                ...server,
                status: data.online ? 'online' as const : 'offline' as const,
                playersOnline: data.players?.online || 0,
                playersMax: data.players?.max || 0,
                version: data.version?.name_clean || null,
              };
            }
          } catch (error) {
            console.error(`Failed to fetch status for ${server.name}:`, error);
          }

          // Return offline if fetch fails
          return {
            ...server,
            status: 'offline' as const,
          };
        })
      );

      setServerStatuses(updatedServers);
    };

    // Update statuses after a short delay to let page load first
    const timeout = setTimeout(updateServerStatuses, 100);

    return () => clearTimeout(timeout);
  }, [initialServers]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-4 w-4 text-green-400" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-400" />;
      case 'loading':
        return <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'loading':
        return 'Checking...';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="glass border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Server className="h-5 w-5 text-blue-400" />
        <h2 className="text-xl font-semibold text-white">Server Status</h2>
      </div>

      <div className="space-y-3">
        {serverStatuses.map((server) => (
          <div
            key={server.id}
            className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
          >
            <div className="flex-1">
              <div className="font-medium text-white">{server.name}</div>
              <div className="text-sm text-gray-400">{server.ipAddress}:{server.port}</div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(server.status)}
                <span className={`text-sm font-medium ${
                  server.status === 'online' ? 'text-green-400' :
                  server.status === 'offline' ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {getStatusText(server.status)}
                </span>
              </div>

              {server.status === 'online' && (
                <div className="text-sm text-gray-300">
                  {server.playersOnline}/{server.playersMax} players
                </div>
              )}

              {server.version && server.status === 'online' && (
                <div className="text-xs text-gray-400 max-w-24 truncate">
                  {server.version}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Status updates automatically every 30 seconds
      </div>
    </div>
  );
}
