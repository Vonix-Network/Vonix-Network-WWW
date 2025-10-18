import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

/**
 * GET /api/admin/discord/config
 * Get Discord configuration (without sensitive data)
 */
export async function GET() {
  try {
    await requireAdmin();

    // Get config from environment
    const config = {
      channelId: process.env.DISCORD_CHANNEL_ID || '',
      hasToken: !!process.env.DISCORD_BOT_TOKEN,
      hasWebhook: !!process.env.DISCORD_WEBHOOK_URL,
      tokenPreview: process.env.DISCORD_BOT_TOKEN ? `${process.env.DISCORD_BOT_TOKEN.substring(0, 10)}...` : null,
      webhookPreview: process.env.DISCORD_WEBHOOK_URL ? process.env.DISCORD_WEBHOOK_URL.substring(0, 50) + '...' : null,
    };

    return NextResponse.json(config);
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error getting Discord config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/discord/config
 * Update Discord configuration
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { token, channelId, webhookUrl } = body;

    const updates: any = {};

    if (token !== undefined) {
      if (!token.trim()) {
        return NextResponse.json(
          { error: 'Bot token cannot be empty' },
          { status: 400 }
        );
      }
      updates.token = token.trim();
      // Update environment variable (runtime only, not persistent)
      process.env.DISCORD_BOT_TOKEN = token.trim();
    }

    if (channelId !== undefined) {
      if (!channelId.trim()) {
        return NextResponse.json(
          { error: 'Channel ID cannot be empty' },
          { status: 400 }
        );
      }
      updates.channelId = channelId.trim();
      process.env.DISCORD_CHANNEL_ID = channelId.trim();
    }

    if (webhookUrl !== undefined) {
      if (!webhookUrl.trim()) {
        return NextResponse.json(
          { error: 'Webhook URL cannot be empty' },
          { status: 400 }
        );
      }
      // Validate webhook URL format (support both discord.com and discordapp.com)
      if (!webhookUrl.startsWith('https://discord.com/api/webhooks/') && 
          !webhookUrl.startsWith('https://discordapp.com/api/webhooks/')) {
        return NextResponse.json(
          { error: 'Invalid webhook URL format. Must start with https://discord.com/api/webhooks/ or https://discordapp.com/api/webhooks/' },
          { status: 400 }
        );
      }
      updates.webhookUrl = webhookUrl.trim();
      process.env.DISCORD_WEBHOOK_URL = webhookUrl.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Try to update Discord bot config if available
    try {
      const { updateDiscordConfig } = await import('@/lib/discord/bot');
      updateDiscordConfig(updates);
    } catch (error) {
      // Discord bot not available, that's ok
      console.log('Discord bot not available for config update');
    }

    return NextResponse.json({
      success: true,
      message: 'Discord configuration updated. Restart the bot for changes to take effect.',
      config: {
        channelId: process.env.DISCORD_CHANNEL_ID,
        hasToken: !!process.env.DISCORD_BOT_TOKEN,
        hasWebhook: !!process.env.DISCORD_WEBHOOK_URL,
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error updating Discord config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}