import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Support both local SQLite and remote Turso
const databaseUrl = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl) {
  throw new Error('DATABASE_URL or TURSO_DATABASE_URL must be defined');
}

// Determine if using Turso (remote) or local SQLite
const isRemote = databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('https://');

// Create the client with appropriate configuration
const client = createClient(
  isRemote
    ? {
        url: databaseUrl,
        authToken: authToken || '',
      }
    : {
        url: databaseUrl,
      }
);

// Create the database instance
export const db = drizzle(client, { schema });

// Export the client for raw queries if needed
export { client };

// Run automatic migrations on import (only in server context) and expose a promise to await where necessary
// Use globalThis variable to prevent multiple migration calls (Edge Runtime compatible)
declare global {
  var __migrationPromise: Promise<void> | undefined;
}

export const migrationReady: Promise<void> = typeof window === 'undefined'
  ? (globalThis.__migrationPromise ||= import('./auto-migrate')
      .then(({ autoMigrate }) => autoMigrate())
      .catch((err) => {
        console.error(err);
      }) as unknown as Promise<void>)
  : Promise.resolve();

// Helper function to check database connection
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await client.execute('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
