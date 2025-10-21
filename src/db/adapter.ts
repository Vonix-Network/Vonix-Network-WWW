/**
 * Database Adapter
 * Provides abstraction for different database providers
 */

import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleMysql } from 'drizzle-orm/mysql2';
import { createClient as createLibsqlClient } from '@libsql/client';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import type { DatabaseConfig } from './config';
import * as schema from './schema';

// Type for any supported database instance
export type DatabaseInstance = 
  | LibSQLDatabase<typeof schema>
  | PostgresJsDatabase<typeof schema>
  | MySql2Database<typeof schema>;

/**
 * Create database client based on configuration
 */
export async function createDatabaseClient(config: DatabaseConfig): Promise<DatabaseInstance> {
  const logger = process.env.NODE_ENV === 'development';

  switch (config.type) {
    case 'turso': {
      const client = createLibsqlClient({
        url: config.url,
        authToken: config.authToken,
      });
      return drizzleLibsql(client, { schema, logger }) as DatabaseInstance;
    }

    case 'postgres': {
      // Dynamic import to avoid loading unused dependencies
      const postgres = await import('postgres').then(m => m.default);
      
      const client = postgres(config.url || {
        host: config.host!,
        port: config.port!,
        database: config.database!,
        username: config.user!,
        password: config.password!,
        ssl: config.ssl ? 'require' : false,
        max: config.poolMax || 10,
      });

      return drizzlePostgres(client, { schema, logger }) as DatabaseInstance;
    }

    case 'mysql':
    case 'mariadb': {
      // Dynamic import to avoid loading unused dependencies
      const mysql = await import('mysql2/promise');
      
      const connection = await mysql.createPool(config.url || {
        host: config.host!,
        port: config.port!,
        database: config.database!,
        user: config.user!,
        password: config.password!,
        ssl: config.ssl ? {} : undefined,
        waitForConnections: true,
        connectionLimit: config.poolMax || 10,
        queueLimit: 0,
      });

      return drizzleMysql(connection, { schema, mode: 'default', logger }) as DatabaseInstance;
    }

    default:
      throw new Error(`Unsupported database type: ${(config as any).type}`);
  }
}

/**
 * Test database connection
 */
export async function testConnection(db: DatabaseInstance, config: DatabaseConfig): Promise<boolean> {
  try {
    switch (config.type) {
      case 'turso': {
        // For Turso/LibSQL, we need to access the client
        const libsqlDb = db as LibSQLDatabase<typeof schema>;
        await (libsqlDb as any).run('SELECT 1');
        break;
      }

      case 'postgres': {
        const pgDb = db as PostgresJsDatabase<typeof schema>;
        await pgDb.execute('SELECT 1' as any);
        break;
      }

      case 'mysql':
      case 'mariadb': {
        const mysqlDb = db as MySql2Database<typeof schema>;
        await mysqlDb.execute('SELECT 1' as any);
        break;
      }

      default:
        return false;
    }
    
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

/**
 * Close database connection
 */
export async function closeDatabaseConnection(db: DatabaseInstance, config: DatabaseConfig): Promise<void> {
  try {
    switch (config.type) {
      case 'turso':
        // LibSQL client handles cleanup automatically
        break;

      case 'postgres': {
        const pgDb = db as any;
        if (pgDb.$client && typeof pgDb.$client.end === 'function') {
          await pgDb.$client.end();
        }
        break;
      }

      case 'mysql':
      case 'mariadb': {
        const mysqlDb = db as any;
        if (mysqlDb.$client && typeof mysqlDb.$client.end === 'function') {
          await mysqlDb.$client.end();
        }
        break;
      }
    }
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}
