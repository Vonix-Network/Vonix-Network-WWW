import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

/**
 * POST /api/admin/discord/control
 * Control Discord bot (start/stop/restart)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { action } = body;

    if (!action || !['start', 'stop', 'restart'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be start, stop, or restart' },
        { status: 400 }
      );
    }

    let result;
    let message;

    try {
      const { startDiscordBot, stopDiscordBot, restartDiscordBot } = await import('@/lib/discord/bot');
      
      switch (action) {
        case 'start':
          result = await startDiscordBot();
          message = result ? 'Discord bot started successfully' : 'Failed to start Discord bot';
          break;

        case 'stop':
          await stopDiscordBot();
          result = true;
          message = 'Discord bot stopped successfully';
          break;

        case 'restart':
          result = await restartDiscordBot();
          message = result ? 'Discord bot restarted successfully' : 'Failed to restart Discord bot';
          break;
      }
    } catch (error) {
      console.error('Discord bot control error:', error);
      return NextResponse.json(
        { error: 'Discord integration not available. Please install dependencies first.' },
        { status: 500 }
      );
    }

    if (!result && action !== 'stop') {
      return NextResponse.json(
        { error: message, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message,
      action
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error controlling Discord bot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}