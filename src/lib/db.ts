import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../db/schema';

// Create a single connection pool for the application
const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
  // Turso automatically handles WAL mode - no need to set it manually
});

// Export the database instance with schema types
export const db = drizzle(client, {
  schema,
  // Enable prepared statements
  logger: process.env.NODE_ENV === 'development',
});

// Export types (avoiding conflicts)
export type { SelectedFields, SelectedFieldsFlat, SelectedFieldsOrdered, TableConfig } from 'drizzle-orm';

export default db;
