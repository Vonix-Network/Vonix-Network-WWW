import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

if (!process.env.TURSO_DATABASE_URL) {
  throw new Error('TURSO_DATABASE_URL is not defined');
}

if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error('TURSO_AUTH_TOKEN is not defined');
}

// Create the client
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

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
