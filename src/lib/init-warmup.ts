// Database connection warming utility for Next.js
// This ensures database connections are warm before the first request

import { warmDatabaseConnections } from './connection-warmup';

// Use global variable to ensure warmup only runs once per server instance
declare global {
  var __serverWarmupInitialized: boolean | undefined;
}

// Warm up connections during module initialization
// This happens once per server instance, not per request
if (!global.__serverWarmupInitialized) {
  global.__serverWarmupInitialized = true;
  console.log('🔥 Initializing database connection warmup...');
  warmDatabaseConnections().then(() => {
    console.log('✅ Database connections ready for fast initial loads');
  }).catch((error) => {
    console.error('❌ Failed to warm up database connections:', error);
  });
}
