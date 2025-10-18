import { NextResponse } from 'next/server';
import { db } from '@/db';
import { chatMessages } from '@/db/schema';
import { desc } from 'drizzle-orm';

/**
 * GET /api/discord/status
 * Public endpoint to check Discord bot status
 */
export async function GET() {
  try {
    const hasToken = !!process.env.DISCORD_BOT_TOKEN;
    const hasChannelId = !!process.env.DISCORD_CHANNEL_ID;
    const hasWebhook = !!process.env.DISCORD_WEBHOOK_URL;

    // Check if bot is configured
    const configured = hasToken && hasChannelId && hasWebhook;

    // Check if bot is active by looking at recent messages
    let active = false;
    let lastMessageTime: Date | null = null;

    if (configured) {
      try {
        const recentMessages = await db
          .select({ timestamp: chatMessages.timestamp })
          .from(chatMessages)
          .orderBy(desc(chatMessages.timestamp))
          .limit(1);

        if (recentMessages.length > 0) {
          lastMessageTime = recentMessages[0].timestamp;
          // Consider bot active if last message is within 30 minutes
          const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
          active = lastMessageTime > thirtyMinutesAgo;
        }
      } catch (error) {
        console.error('Error checking bot activity:', error);
      }
    }

    return NextResponse.json({
      configured,
      active,
      hasToken,
      hasChannelId,
      hasWebhook,
      lastMessageTime: lastMessageTime?.toISOString() || null,
    });
  } catch (error) {
    console.error('Error checking Discord status:', error);
    return NextResponse.json(
      { error: 'Failed to check Discord status' },
      { status: 500 }
    );
  }
}
