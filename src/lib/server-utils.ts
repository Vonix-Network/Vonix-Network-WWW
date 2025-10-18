/**
 * Server Utilities - Client-Safe Functions
 * Pure utility functions that can be used on both client and server
 */

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

/**
 * Format server address for API calls
 * Pure function - safe for client and server
 */
export function formatServerAddress(ipAddress: string, port: number): string {
  return port === 25565 ? ipAddress : `${ipAddress}:${port}`;
}
