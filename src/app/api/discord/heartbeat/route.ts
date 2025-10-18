import { NextRequest, NextResponse } from 'next/server';
import { setBotConnected, updateBotHeartbeat } from '@/lib/discord/bot';

/**
 * POST /api/discord/heartbeat
 * Bot sends heartbeat to indicate it's alive
 */
export async function POST(request: NextRequest) {
  try {
    const { connected, username, secret } = await request.json();
    
    // Simple secret validation (you can make this more secure)
    if (secret !== process.env.DISCORD_BOT_SECRET && secret !== 'internal') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (connected) {
      setBotConnected(true, username);
    } else {
      updateBotHeartbeat();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing heartbeat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
