import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

/**
 * GET /api/admin/discord/status
 * Get Discord bot status
 */
export async function GET() {
  try {
    await requireAdmin();

    // Import bot functions dynamically to avoid module errors
    let status;
    try {
      const { getBotStatus } = await import('@/lib/discord/bot');
      status = getBotStatus();
    } catch (error) {
      // If discord.js is not installed, return default status
      status = {
        connected: false,
        username: null,
        channelId: process.env.DISCORD_CHANNEL_ID || '',
        hasToken: !!process.env.DISCORD_BOT_TOKEN,
        hasWebhook: !!process.env.DISCORD_WEBHOOK_URL,
      };
    }

    return NextResponse.json(status);
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error getting Discord status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}