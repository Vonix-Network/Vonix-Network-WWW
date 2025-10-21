/**
 * Database Configuration
 * Supports multiple database types: Turso, PostgreSQL, MySQL, MariaDB
 */

export type DatabaseType = 'turso' | 'postgres' | 'mysql' | 'mariadb';

export interface DatabaseConfig {
  type: DatabaseType;
  url: string;
  authToken?: string; // For Turso
  host?: string; // For SQL databases
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean;
  poolMin?: number;
  poolMax?: number;
}

/**
 * Get database configuration from environment variables
 */
export function getDatabaseConfig(): DatabaseConfig {
  const dbType = (process.env.DATABASE_TYPE || 'turso') as DatabaseType;

  switch (dbType) {
    case 'turso':
      return {
        type: 'turso',
        url: process.env.TURSO_DATABASE_URL || '',
        authToken: process.env.TURSO_AUTH_TOKEN || '',
      };

    case 'postgres':
      return {
        type: 'postgres',
        url: process.env.DATABASE_URL || '',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'vonix',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        ssl: process.env.DB_SSL === 'true',
        poolMin: parseInt(process.env.DB_POOL_MIN || '2'),
        poolMax: parseInt(process.env.DB_POOL_MAX || '10'),
      };

    case 'mysql':
    case 'mariadb':
      return {
        type: dbType,
        url: process.env.DATABASE_URL || '',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        database: process.env.DB_NAME || 'vonix',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        ssl: process.env.DB_SSL === 'true',
        poolMin: parseInt(process.env.DB_POOL_MIN || '2'),
        poolMax: parseInt(process.env.DB_POOL_MAX || '10'),
      };

    default:
      throw new Error(`Unsupported database type: ${dbType}`);
  }
}

/**
 * Validate database configuration
 */
export function validateDatabaseConfig(config: DatabaseConfig): void {
  switch (config.type) {
    case 'turso':
      if (!config.url) {
        throw new Error('TURSO_DATABASE_URL is required for Turso database');
      }
      if (!config.authToken) {
        throw new Error('TURSO_AUTH_TOKEN is required for Turso database');
      }
      break;

    case 'postgres':
    case 'mysql':
    case 'mariadb':
      if (!config.url && (!config.host || !config.database)) {
        throw new Error(`DATABASE_URL or DB_HOST and DB_NAME are required for ${config.type} database`);
      }
      break;

    default:
      throw new Error(`Unknown database type: ${config.type}`);
  }
}
