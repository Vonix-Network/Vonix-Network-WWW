/**
 * Multi-Database Support
 * This file provides database connection that works with Turso, PostgreSQL, MySQL, and MariaDB
 * 
 * To use this instead of the default Turso-only connection:
 * 1. Set DATABASE_TYPE environment variable (turso, postgres, mysql, mariadb)
 * 2. Configure appropriate connection details in environment variables
 * 3. Import from this file instead of './index'
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') });

import { getDatabaseConfig, validateDatabaseConfig, type DatabaseConfig } from './config';
import { createDatabaseClient, testConnection, type DatabaseInstance } from './adapter';
import * as schema from './schema'; // Keep using SQLite schema for Turso

// Get and validate configuration
const dbConfig: DatabaseConfig = getDatabaseConfig();
validateDatabaseConfig(dbConfig);

// Initialize database client
let db: DatabaseInstance;
let client: any;

async function initializeDatabase() {
  try {
    db = await createDatabaseClient(dbConfig);
    
    // Test the connection
    const isConnected = await testConnection(db, dbConfig);
    
    if (!isConnected) {
      throw new Error(`Failed to connect to ${dbConfig.type} database`);
    }
    
    console.log(`✓ Connected to ${dbConfig.type} database`);
    return db;
  } catch (error) {
    console.error(`✗ Database connection failed:`, error);
    throw error;
  }
}

// Initialize synchronously for server-side usage
if (typeof window === 'undefined') {
  // Create a promise that will resolve to the database instance
  const dbPromise = initializeDatabase();
  
  // Export a proxy that queues operations until the database is ready
  db = new Proxy({} as any, {
    get(target, prop) {
      return (...args: any[]) => {
        return dbPromise.then(database => {
          const method = (database as any)[prop];
          if (typeof method === 'function') {
            return method.apply(database, args);
          }
          return method;
        });
      };
    }
  });
}

export { db, dbConfig };

// Export schema for type inference
export * from './schema';

// Helper function to check database connection
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const database = await initializeDatabase();
    return await testConnection(database, dbConfig);
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

// Helper to get database type
export function getDatabaseType() {
  return dbConfig.type;
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    console.log('Closing database connection...');
    try {
      const { closeDatabaseConnection } = await import('./adapter');
      await closeDatabaseConnection(db, dbConfig);
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  });
}
