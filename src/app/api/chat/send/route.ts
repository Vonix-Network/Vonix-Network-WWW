import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/db';
import { users, chatMessages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendViaWebhook } from '@/lib/discord/rest';

/**
 * Build avatar URL for Discord webhook
 */
function buildAvatarUrl(user: any): string {
  // If we have a Minecraft username, use mc-heads.net
  if (user.minecraftUsername) {
    return `https://mc-heads.net/head/${user.minecraftUsername}`;
  }

  // If we have a UUID but no username, use mc-heads.net with UUID
  if (user.minecraftUuid) {
    const uuid = user.minecraftUuid.replace(/-/g, '');
    return `https://mc-heads.net/head/${uuid}`;
  }

  // Fallback to UI Avatars
  const displayName = user.username || `User${user.id}`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff`;
}

/**
 * POST /api/chat/send
 * Send a message to Discord
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message } = body;

    // Validate message
    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      console.error(`User ID ${userId} not found in database`);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Build display name and avatar URL
    const displayName = user.minecraftUsername || user.username || `User${userId}`;
    const avatarUrl = buildAvatarUrl(user);

    console.log('💬 Processing chat message:', {
      userId: user.id,
      username: user.username,
      displayName,
    });

    // Build username with configurable prefix
    const prefix = process.env.DISCORD_WEB_PREFIX ?? '[WEB]';

    // Send to Discord via webhook
    const result = await sendViaWebhook(`${prefix} ${displayName}`, avatarUrl, message.trim());
    if (result.ok) {
      console.log('✅ Message sent to Discord via webhook');
    } else {
      console.warn('⚠️ Webhook send failed:', result.error);
    }

    // Save to database
    const [savedMessage] = await db
      .insert(chatMessages)
      .values({
        discordMessageId: null,
        authorName: displayName,
        authorAvatar: avatarUrl,
        content: message.trim(),
        embeds: null,
        attachments: null,
        timestamp: new Date(),
      })
      .returning();

    // Broadcast via WebSocket
    if (savedMessage && global.broadcastChatMessage) {
      global.broadcastChatMessage(savedMessage);
    }

    console.log('💾 Message saved to database');

    return NextResponse.json({
      success: true,
      message: 'Message sent',
      data: savedMessage
    });
  } catch (error) {
    console.error('❌ Error in /api/chat/send:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// Global type declaration for TypeScript
declare global {
  var broadcastChatMessage: ((message: any) => void) | undefined;
}