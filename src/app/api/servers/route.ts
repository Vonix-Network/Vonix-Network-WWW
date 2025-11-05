/**
 * Public Servers API
 * Returns all servers with real-time status
 */

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { servers } from '@/db/schema';
import { asc } from 'drizzle-orm';

// Force dynamic rendering - NO CACHING for real-time status
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

interface NormalizedStatus {
  online: boolean;
  playersOnline: number;
  playersMax: number;
  version: string | null;
}

// Provider 1: mcstatus.io
async function fetchFromMcstatus(ipAddress: string, port: number): Promise<NormalizedStatus | null> {
  try {
    const serverAddress = port === 25565 ? ipAddress : `${ipAddress}:${port}`;
    console.log(`[mcstatus.io] Checking ${serverAddress}...`);
    const res = await fetch(`https://api.mcstatus.io/v2/status/java/${serverAddress}`,
      { next: { revalidate: 15 }, signal: AbortSignal.timeout(2500) } // Reduced to 2.5s
    );
    if (!res.ok) {
      console.log(`[mcstatus.io] ${serverAddress} - HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    console.log(`[mcstatus.io] ${serverAddress} - Online: ${data.online}, Players: ${data.players?.online ?? 0}/${data.players?.max ?? 0}`);
    return {
      online: !!data.online,
      playersOnline: data.players?.online ?? 0,
      playersMax: data.players?.max ?? 0,
      version: data.version?.name_clean ?? null,
    };
  } catch (e) {
    console.error(`[mcstatus.io] ${ipAddress}:${port} - Error:`, e instanceof Error ? e.message : e);
    return null;
  }
}

// Provider 2: mcsrvstat.us
async function fetchFromMcsrvstat(ipAddress: string, port: number): Promise<NormalizedStatus | null> {
  try {
    const serverAddress = port === 25565 ? ipAddress : `${ipAddress}:${port}`;
    console.log(`[mcsrvstat.us] Checking ${serverAddress}...`);
    const res = await fetch(`https://api.mcsrvstat.us/3/${serverAddress}`,
      { cache: 'no-store', signal: AbortSignal.timeout(2500) } // Reduced to 2.5s
    );
    if (!res.ok) {
      console.log(`[mcsrvstat.us] ${serverAddress} - HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    console.log(`[mcsrvstat.us] ${serverAddress} - Online: ${data.online}, Players: ${data.players?.online ?? 0}/${data.players?.max ?? 0}`);
    return {
      online: !!data.online,
      playersOnline: data.players?.online ?? 0,
      playersMax: data.players?.max ?? 0,
      version: (Array.isArray(data.version) ? data.version[0] : data.version) ?? null,
    };
  } catch (e) {
    console.error(`[mcsrvstat.us] ${ipAddress}:${port} - Error:`, e instanceof Error ? e.message : e);
    return null;
  }
}

async function fetchBestStatus(ipAddress: string, port: number): Promise<NormalizedStatus | null> {
  // Race both providers but timeout the whole operation at 3 seconds
  const racePromise = Promise.race([
    (async () => {
      const [a, b] = await Promise.all([
        fetchFromMcstatus(ipAddress, port), 
        fetchFromMcsrvstat(ipAddress, port)
      ]);
      
      console.log(`[Reconcile] ${ipAddress}:${port} - mcstatus: ${a ? `${a.online ? 'ONLINE' : 'OFFLINE'} (${a.playersOnline})` : 'FAILED'}, mcsrvstat: ${b ? `${b.online ? 'ONLINE' : 'OFFLINE'} (${b.playersOnline})` : 'FAILED'}`);
      
      if (a && b) {
        // If one is online and the other offline, prefer online result.
        if (a.online !== b.online) {
          const chosen = a.online ? a : b;
          console.log(`[Reconcile] ${ipAddress}:${port} - Choosing ${a.online ? 'mcstatus' : 'mcsrvstat'} (online vs offline)`);
          return chosen;
        }
        // If both online, prefer the one with higher playersOnline (often fresher)
        const chosen = a.playersOnline >= b.playersOnline ? a : b;
        console.log(`[Reconcile] ${ipAddress}:${port} - Choosing ${a.playersOnline >= b.playersOnline ? 'mcstatus' : 'mcsrvstat'} (higher players: ${chosen.playersOnline})`);
        return chosen;
      }
      
      const fallback = a ?? b;
      if (fallback) {
        console.log(`[Reconcile] ${ipAddress}:${port} - Using ${a ? 'mcstatus' : 'mcsrvstat'} (only available)`);
      } else {
        console.warn(`[Reconcile] ${ipAddress}:${port} - BOTH PROVIDERS FAILED`);
      }
      return fallback;
    })(),
    // Overall timeout for this server check
    new Promise<null>((resolve) => setTimeout(() => {
      console.warn(`[Reconcile] ${ipAddress}:${port} - Overall timeout (3s)`);
      resolve(null);
    }, 3000))
  ]);
  
  return racePromise;
}

export async function GET() {
  try {
    console.log('[API] /api/servers - Starting server status check...');
    
    // Fetch all servers from database
    const allServers = await db
      .select()
      .from(servers)
      .orderBy(asc(servers.orderIndex));

    console.log(`[API] Found ${allServers.length} servers in database:`, allServers.map(s => `${s.name} (${s.ipAddress}:${s.port})`));

    // Fetch real-time status for all servers concurrently
    const serversWithStatus = await Promise.all(
      allServers.map(async (server) => {
        console.log(`[API] Processing ${server.name}...`);
        const live = await fetchBestStatus(server.ipAddress, server.port);
        if (live) {
          console.log(`[API] ${server.name} - Final: ${live.online ? 'ONLINE' : 'OFFLINE'} with ${live.playersOnline} players`);
          return {
            ...server,
            status: live.online ? 'online' : 'offline',
            playersOnline: live.playersOnline ?? server.playersOnline,
            playersMax: live.playersMax || server.playersMax,
            version: live.version || server.version,
          };
        }
        // Fallback to DB values if both providers fail
        console.log(`[API] ${server.name} - Using DB fallback: ${server.status}`);
        return server;
      })
    );
    
    console.log('[API] /api/servers - Completed successfully');

    // Return with minimal caching
    return NextResponse.json(serversWithStatus, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=45',
      },
    });
  } catch (error) {
    console.error('Error fetching servers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch servers' },
      { status: 500 }
    );
  }
}
