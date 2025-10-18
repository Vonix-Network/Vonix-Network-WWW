import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { servers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface McStatusResponse {
  online: boolean;
  host: string;
  port: number;
  ip_address: string;
  eula_blocked: boolean;
  retrieved_at: number;
  expires_at: number;
  version?: {
    name_raw: string;
    name_clean: string;
    name_html: string;
    protocol: number;
  };
  players?: {
    online: number;
    max: number;
    list?: Array<{
      uuid: string;
      name_raw: string;
      name_clean: string;
      name_html: string;
    }>;
  };
  motd?: {
    raw: string;
    clean: string;
    html: string;
  };
  icon?: string;
  mods?: Array<{
    name: string;
    version: string;
  }>;
  software?: string;
  plugins?: Array<{
    name: string;
    version: string;
  }>;
}

async function fetchServerStatus(ipAddress: string, port: number): Promise<McStatusResponse | null> {
  try {
    const serverAddress = port === 25565 ? ipAddress : `${ipAddress}:${port}`;
    const response = await fetch(`https://api.mcstatus.io/v2/status/java/${serverAddress}`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      console.error(`Failed to fetch status for ${serverAddress}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching server status for ${ipAddress}:${port}:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication if you want to restrict this endpoint
    // const session = await getServerSession();
    // if (!session || session.user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    const { serverId } = body;

    if (serverId) {
      // Update specific server
      const [server] = await db
        .select()
        .from(servers)
        .where(eq(servers.id, serverId));

      if (!server) {
        return NextResponse.json({ error: 'Server not found' }, { status: 404 });
      }

      const status = await fetchServerStatus(server.ipAddress, server.port);

      if (status) {
        await db
          .update(servers)
          .set({
            status: status.online ? 'online' : 'offline',
            playersOnline: status.players?.online || 0,
            playersMax: status.players?.max || server.playersMax,
            version: status.version?.name_clean || server.version,
          })
          .where(eq(servers.id, serverId));

        return NextResponse.json({ 
          success: true, 
          server: {
            id: server.id,
            status: status.online ? 'online' : 'offline',
            playersOnline: status.players?.online || 0,
            playersMax: status.players?.max || server.playersMax,
            version: status.version?.name_clean || server.version,
          }
        });
      } else {
        // Mark as offline if fetch failed
        await db
          .update(servers)
          .set({ status: 'offline' })
          .where(eq(servers.id, serverId));

        return NextResponse.json({ 
          success: true, 
          server: { id: server.id, status: 'offline' }
        });
      }
    } else {
      // Update all servers
      const allServers = await db.select().from(servers);
      const updates = [];

      for (const server of allServers) {
        const status = await fetchServerStatus(server.ipAddress, server.port);

        if (status) {
          updates.push(
            db
              .update(servers)
              .set({
                status: status.online ? 'online' : 'offline',
                playersOnline: status.players?.online || 0,
                playersMax: status.players?.max || server.playersMax,
                version: status.version?.name_clean || server.version,
              })
              .where(eq(servers.id, server.id))
          );
        } else {
          updates.push(
            db
              .update(servers)
              .set({ status: 'offline' })
              .where(eq(servers.id, server.id))
          );
        }
      }

      await Promise.all(updates);

      return NextResponse.json({ 
        success: true, 
        updated: allServers.length 
      });
    }
  } catch (error) {
    console.error('Error updating server status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint to fetch status without updating database
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');

    if (!serverId) {
      return NextResponse.json({ error: 'Server ID required' }, { status: 400 });
    }

    const [server] = await db
      .select()
      .from(servers)
      .where(eq(servers.id, parseInt(serverId)));

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    const status = await fetchServerStatus(server.ipAddress, server.port);

    if (!status) {
      return NextResponse.json({ 
        online: false,
        error: 'Failed to fetch server status' 
      }, { status: 503 });
    }

    return NextResponse.json({
      online: status.online,
      players: {
        online: status.players?.online || 0,
        max: status.players?.max || 0,
        list: status.players?.list || [],
      },
      version: status.version?.name_clean || 'Unknown',
      motd: status.motd?.clean || '',
      icon: status.icon,
    });
  } catch (error) {
    console.error('Error fetching server status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
