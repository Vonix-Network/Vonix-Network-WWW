import { NextResponse } from 'next/server';

export type DiscordRestMessage = {
  id: string;
  content: string;
  author: {
    username: string;
    avatar: string | null;
  };
  timestamp: string;
  embeds?: any[];
  attachments?: any[];
};

function getApiBase() {
  return 'https://discord.com/api/v10';
}

function getAuthHeader() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return {} as Record<string, string>;
  return { Authorization: `Bot ${token}` } as Record<string, string>;
}

export async function fetchChannelMessages(limit = 50): Promise<DiscordRestMessage[]> {
  const channelId = process.env.DISCORD_CHANNEL_ID;
  if (!channelId) return [];

  const res = await fetch(`${getApiBase()}/channels/${channelId}/messages?limit=${Math.min(limit, 100)}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    // Next.js: ensure this runs server-side and not cached
    cache: 'no-store',
  });

  if (!res.ok) {
    console.warn('Failed to fetch Discord messages:', res.status, await res.text());
    return [];
  }

  const raw = await res.json();

  return (raw as any[]).map((m) => ({
    id: m.id,
    content: m.content ?? '',
    author: {
      username: m.author?.username ?? 'Unknown',
      avatar: m.author?.avatar ? `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}.png?size=64` : null,
    },
    timestamp: m.timestamp,
    embeds: m.embeds ?? [],
    attachments: (m.attachments ?? []).map((a: any) => ({
      id: a.id,
      filename: a.filename,
      url: a.url,
      proxy_url: a.proxy_url,
      size: a.size,
      width: a.width ?? null,
      height: a.height ?? null,
      content_type: a.content_type ?? null,
    })),
  }));
}

export async function sendViaWebhook(username: string, avatarUrl: string | null, content: string) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return { ok: false, error: 'Webhook not configured' };

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      avatar_url: avatarUrl ?? undefined,
      content,
    }),
  });

  if (!res.ok) {
    return { ok: false, error: `Webhook failed: ${res.status}` };
  }
  return { ok: true };
}
