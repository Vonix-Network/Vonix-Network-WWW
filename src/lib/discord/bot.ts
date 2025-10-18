// REST-only Discord integration stub to keep API surface without discord.js
let discordConfig = {
  token: process.env.DISCORD_BOT_TOKEN || '',
  channelId: process.env.DISCORD_CHANNEL_ID || '',
  webhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
};

// Global bot status tracking
let botStatus = {
  connected: false,
  username: null as string | null,
  lastHeartbeat: null as Date | null,
};

export function loadDiscordConfig() {
  discordConfig = {
    token: process.env.DISCORD_BOT_TOKEN || '',
    channelId: process.env.DISCORD_CHANNEL_ID || '',
    webhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
  };
  return discordConfig;
}

export function getDiscordConfig() {
  return { ...discordConfig };
}

export function updateDiscordConfig(newConfig: Partial<typeof discordConfig>) {
  discordConfig = { ...discordConfig, ...newConfig };
  return discordConfig;
}

export function setBotConnected(connected: boolean, username?: string) {
  botStatus.connected = connected;
  botStatus.username = username || null;
  botStatus.lastHeartbeat = connected ? new Date() : null;
}

export function updateBotHeartbeat() {
  if (botStatus.connected) {
    botStatus.lastHeartbeat = new Date();
  }
}

export function getBotStatus() {
  // Check if heartbeat is recent (within 2 minutes)
  const isRecent = botStatus.lastHeartbeat && 
    (Date.now() - botStatus.lastHeartbeat.getTime()) < 2 * 60 * 1000;
  
  return {
    connected: botStatus.connected && isRecent,
    username: botStatus.username,
    channelId: discordConfig.channelId,
    hasToken: !!discordConfig.token,
    hasWebhook: !!discordConfig.webhookUrl,
  };
}

export async function startDiscordBot() {
  // No-op in REST-only mode
  return null;
}

export async function stopDiscordBot() {
  // No-op in REST-only mode
}

export async function restartDiscordBot() {
  // No-op in REST-only mode
  return null;
}

declare global {
  var broadcastChatMessage: ((message: any) => void) | undefined;
}