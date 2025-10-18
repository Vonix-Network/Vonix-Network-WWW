/**
 * Discord Bot Initialization
 * 
 * This file handles the automatic startup of the Discord bot
 * when the Next.js server starts.
 */

import { startDiscordBot } from './bot';

let botInitialized = false;

export async function initializeDiscordBot() {
  if (botInitialized) {
    console.log('Discord bot already initialized, skipping...');
    return;
  }

  // Only initialize in server environment
  if (typeof window !== 'undefined') {
    return;
  }

  console.log('🤖 Initializing Discord bot...');

  try {
    const client = await startDiscordBot();
    
    if (client) {
      console.log('✅ Discord bot initialized successfully');
      botInitialized = true;
    } else {
      console.warn('⚠️ Discord bot not started (missing configuration)');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Discord bot:', error);
  }
}

// Auto-initialize when module is imported (server-side only)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  initializeDiscordBot();
}

// Export for module compatibility
export default initializeDiscordBot;