/**
 * Server Status Service
 * Reusable service for fetching Minecraft server status with no caching
 */

import { optimizedFetch } from './connection-warmup';

export interface ServerStatus {
  server: string;
  online: boolean;
  players?: {
    online: number;
    max: number;
  };
  version?: string;
  motd?: string;
  latency?: number;
  lastUpdated: string;
  error?: string;
  icon?: string;
  playerList?: Array<{ name: string; uuid: string }>;
}

export interface McStatusResponse {
  online: boolean;
  players?: {
    online: number;
    max: number;
    list?: Array<{
      name_clean?: string;
      name_raw?: string;
      uuid: string;
    }>;
  };
  version?: {
    name_clean?: string;
    name_raw?: string;
  };
  motd?: {
    clean?: string[] | string;
    raw?: string[] | string;
  };
  round_trip_latency?: number;
  icon?: string;
}

/**
 * Fetch status for a single server
 */
export async function fetchServerStatus(server: string): Promise<ServerStatus> {
  const startTime = Date.now();
  
  try {
    const response = await optimizedFetch(`https://api.mcstatus.io/v2/status/java/${server}`);
    const data: McStatusResponse = await response.json();
    const latency = Date.now() - startTime;

    // Process player list
    const playerList = data.players?.list?.map((player) => ({
      name: player.name_clean || player.name_raw || 'Unknown',
      uuid: player.uuid,
    })) || [];

    // Handle MOTD - can be array or string
    let motd: string | undefined;
    if (data.motd?.clean) {
      motd = Array.isArray(data.motd.clean) 
        ? data.motd.clean.join(' ') 
        : String(data.motd.clean);
    } else if (data.motd?.raw) {
      motd = Array.isArray(data.motd.raw) 
        ? data.motd.raw.join(' ') 
        : String(data.motd.raw);
    }

    return {
      server,
      online: data.online,
      players: data.players ? {
        online: data.players.online,
        max: data.players.max,
      } : undefined,
      version: data.version?.name_clean || data.version?.name_raw,
      motd,
      latency: data.round_trip_latency || latency,
      lastUpdated: new Date().toISOString(),
      icon: data.icon || undefined,
      playerList,
    };
  } catch (error) {
    console.error(`Error fetching server status for ${server}:`, error);
    
    return {
      server,
      online: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Fetch status for multiple servers concurrently
 */
export async function fetchMultipleServerStatuses(servers: string[]): Promise<ServerStatus[]> {
  const statusPromises = servers.map(server => fetchServerStatus(server));
  const results = await Promise.allSettled(statusPromises);
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        server: servers[index],
        online: false,
        error: 'Failed to check status',
        lastUpdated: new Date().toISOString(),
      };
    }
  });
}

/**
 * Format server address for API calls
 */
export function formatServerAddress(ipAddress: string, port: number): string {
  return port === 25565 ? ipAddress : `${ipAddress}:${port}`;
}

/**
 * Get server status with retry logic
 */
export async function fetchServerStatusWithRetry(
  server: string, 
  maxRetries: number = 2
): Promise<ServerStatus> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchServerStatus(server);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  // Return error status after all retries failed
  return {
    server,
    online: false,
    error: lastError?.message || 'Failed after retries',
    lastUpdated: new Date().toISOString(),
  };
}
