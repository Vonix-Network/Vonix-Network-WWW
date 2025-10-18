import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../db/schema';

// Only initialize database on server-side
let db: ReturnType<typeof drizzle>;

if (typeof window === 'undefined') {
  // Server-side initialization
  if (!process.env.TURSO_DATABASE_URL) {
    throw new Error('TURSO_DATABASE_URL environment variable is not set');
  }

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  db = drizzle(client, {
    schema,
    logger: process.env.NODE_ENV === 'development',
  });
} else {
  // Client-side - create a mock that throws helpful errors
  db = new Proxy({} as any, {
    get() {
      throw new Error('Database operations should only be performed on the server-side. Use API routes instead.');
    }
  });
}

export { db };

// Export types (avoiding conflicts)
export type { SelectedFields, SelectedFieldsFlat, SelectedFieldsOrdered, TableConfig } from 'drizzle-orm';

export default db;
