import 'dotenv/config';
import { Client, GatewayIntentBits, Message } from 'discord.js';
import { db } from '../src/db';
import { chatMessages } from '../src/db/schema';
import { desc, sql } from 'drizzle-orm';

const TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID || '';
const WEB_PREFIX = process.env.DISCORD_WEB_PREFIX || '[WEB]';

if (!TOKEN || !CHANNEL_ID) {
  console.error('Missing DISCORD_BOT_TOKEN or DISCORD_CHANNEL_ID in environment.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on('ready', async () => {
  console.log(`Discord bot logged in as ${client.user?.tag}`);
});

async function saveMessage(message: Message) {
  try {
    // Only process configured channel
    if (message.channelId !== CHANNEL_ID) return;

    // Ignore own messages
    if (message.author.id === client.user?.id) return;

    // Ignore website-originated webhook messages (prefixed username)
    if (message.author.username?.startsWith(`${WEB_PREFIX}`)) return;

    // Basic empty check
    if (!message.content && message.embeds.length === 0 && message.attachments.size === 0) return;

    const embeds = message.embeds.map((e) => ({
      title: e.title ?? null,
      description: e.description ?? null,
      url: e.url ?? null,
      color: e.color ?? null,
      thumbnail: e.thumbnail?.url ?? null,
      image: e.image?.url ?? null,
      author: e.author ? { name: e.author.name, iconURL: (e.author as any).iconURL, url: e.author.url } : null,
      fields: e.fields ?? [],
      footer: e.footer ? { text: e.footer.text, iconURL: e.footer.iconURL } : null,
    }));

    const attachments = Array.from(message.attachments.values()).map((a) => ({
      id: a.id,
      filename: a.name,
      url: a.url,
      proxyUrl: (a as any).proxyURL,
      size: a.size,
      width: a.width ?? null,
      height: a.height ?? null,
      contentType: a.contentType ?? null,
    }));

    const avatar = message.author.displayAvatarURL({ size: 64 });

    await db.insert(chatMessages)
      .values({
        discordMessageId: message.id,
        authorName: message.author.username || message.author.displayName || 'Unknown',
        authorAvatar: avatar,
        content: message.content || '',
        embeds: embeds.length ? JSON.stringify(embeds) : null,
        attachments: attachments.length ? JSON.stringify(attachments) : null,
        timestamp: message.createdAt,
      })
      .onConflictDoNothing();

    // Prune to keep latest 100 by timestamp
    const rows: { id: number }[] = await db
      .select({ id: chatMessages.id })
      .from(chatMessages)
      .orderBy(desc(chatMessages.timestamp));

    const idsToDelete = rows.slice(100).map((r) => r.id);
    if (idsToDelete.length) {
      await db.run(sql`delete from chat_messages where id in (${sql.join(idsToDelete)})`);
    }
  } catch (err) {
    console.error('Failed saving Discord message:', err);
  }
}

client.on('messageCreate', async (message) => {
  saveMessage(message);
});

client.login(TOKEN).catch((err) => {
  console.error('Failed to login to Discord:', err);
  process.exit(1);
});
