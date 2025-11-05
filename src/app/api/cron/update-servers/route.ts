/**
 * Cron Job: Update Server Status
 * Periodically updates all server statuses in the database
 * 
 * Can be triggered by:
 * 1. Vercel Cron Jobs (recommended)
 * 2. External cron service (cron-job.org)
 * 3. Manual admin trigger
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { servers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface McStatusResponse {
  online: boolean;
  players?: {
    online: number;
    max: number;
  };
  version?: {
    name_clean: string;
  };
}

async function fetchServerStatus(ipAddress: string, port: number): Promise<McStatusResponse | null> {
  try {
    const serverAddress = port === 25565 ? ipAddress : `${ipAddress}:${port}`;
    const response = await fetch(
      `https://api.mcstatus.io/v2/status/java/${serverAddress}`,
      { 
        signal: AbortSignal.timeout(8000), // 8 second timeout
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.error(`Status check failed for ${serverAddress}: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching status for ${ipAddress}:${port}:`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized cron job attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting server status update...');
    const startTime = Date.now();

    // Fetch all servers
    const allServers = await db.select().from(servers);
    console.log(`Found ${allServers.length} servers to check`);

    // Update each server's status
    const results = await Promise.allSettled(
      allServers.map(async (server) => {
        const status = await fetchServerStatus(server.ipAddress, server.port);
        
        if (status) {
          await db
            .update(servers)
            .set({
              status: status.online ? 'online' : 'offline',
              playersOnline: status.players?.online || 0,
              playersMax: status.players?.max || server.playersMax,
              version: status.version?.name_clean || server.version,
              updatedAt: new Date(),
            })
            .where(eq(servers.id, server.id));

          return {
            id: server.id,
            name: server.name,
            status: status.online ? 'online' : 'offline',
            players: status.players?.online || 0,
          };
        } else {
          // Mark as offline if check fails
          await db
            .update(servers)
            .set({ 
              status: 'offline',
              updatedAt: new Date(),
            })
            .where(eq(servers.id, server.id));

          return {
            id: server.id,
            name: server.name,
            status: 'offline',
            players: 0,
          };
        }
      })
    );

    const duration = Date.now() - startTime;
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Server status update completed in ${duration}ms`);
    console.log(`Success: ${successful}, Failed: ${failed}`);

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      servers: allServers.length,
      updated: successful,
      failed,
      results: results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map(r => r.value),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update server statuses',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
