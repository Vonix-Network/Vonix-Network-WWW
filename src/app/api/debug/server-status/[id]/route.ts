import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { servers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const serverId = parseInt(resolvedParams.id);
    
    if (isNaN(serverId)) {
      return NextResponse.json({ error: 'Invalid server ID' }, { status: 400 });
    }

    // Get server from database
    const [server] = await db
      .select()
      .from(servers)
      .where(eq(servers.id, serverId));

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    // Fetch from mcstatus.io
    const serverAddress = server.port === 25565 
      ? server.ipAddress 
      : `${server.ipAddress}:${server.port}`;
    
    const response = await fetch(`https://api.mcstatus.io/v2/status/java/${serverAddress}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({
        error: 'Failed to fetch from mcstatus.io',
        database: {
          playersMax: server.playersMax,
          playersOnline: server.playersOnline,
          status: server.status,
          version: server.version,
        },
      }, { status: 503 });
    }

    const mcstatusData = await response.json();

    return NextResponse.json({
      database: {
        id: server.id,
        name: server.name,
        ipAddress: server.ipAddress,
        port: server.port,
        playersMax: server.playersMax,
        playersOnline: server.playersOnline,
        status: server.status,
        version: server.version,
      },
      mcstatus: {
        online: mcstatusData.online,
        players: {
          online: mcstatusData.players?.online,
          max: mcstatusData.players?.max,
          list: mcstatusData.players?.list?.length || 0,
        },
        version: mcstatusData.version?.name_clean,
        motd: mcstatusData.motd?.clean,
      },
      computed: {
        status: mcstatusData.online ? 'online' : 'offline',
        playersOnline: mcstatusData.players?.online || 0,
        playersMax: mcstatusData.players?.max || 0,
        version: mcstatusData.version?.name_clean || null,
      },
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
