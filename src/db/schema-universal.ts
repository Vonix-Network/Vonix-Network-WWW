/**
 * Universal Database Schema
 * Provides abstraction for different database dialects
 * This file exports schema definitions that work with PostgreSQL, MySQL, and MariaDB
 */

import { sql } from 'drizzle-orm';
import { 
  pgTable, 
  serial, 
  text as pgText, 
  integer as pgInteger,
  boolean as pgBoolean,
  timestamp as pgTimestamp,
  doublePrecision,
  varchar
} from 'drizzle-orm/pg-core';

import {
  mysqlTable,
  serial as mysqlSerial,
  text as mysqlText,
  int as mysqlInt,
  boolean as mysqlBoolean,
  timestamp as mysqlTimestamp,
  double,
  varchar as mysqlVarchar
} from 'drizzle-orm/mysql-core';

import type { DatabaseType } from './config';

// Helper to create appropriate timestamp field
const createTimestamp = (dbType: DatabaseType, fieldName: string) => {
  if (dbType === 'postgres') {
    return pgTimestamp(fieldName, { mode: 'date' }).defaultNow().notNull();
  } else {
    return mysqlTimestamp(fieldName, { mode: 'date' }).defaultNow().notNull();
  }
};

/**
 * Get schema definitions for the specified database type
 */
export function getUniversalSchema(dbType: DatabaseType) {
  if (dbType === 'postgres') {
    return getPostgresSchema();
  } else if (dbType === 'mysql' || dbType === 'mariadb') {
    return getMySQLSchema();
  }
  throw new Error(`Schema not available for database type: ${dbType}`);
}

/**
 * PostgreSQL Schema
 */
function getPostgresSchema() {
  const users = pgTable('users', {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 255 }).notNull().unique(),
    email: varchar('email', { length: 255 }),
    password: pgText('password').notNull(),
    role: varchar('role', { length: 50 }).default('user').notNull(),
    minecraftUsername: varchar('minecraft_username', { length: 255 }).unique(),
    minecraftUuid: varchar('minecraft_uuid', { length: 255 }).unique(),
    avatar: pgText('avatar'),
    bio: pgText('bio'),
    preferredBackground: varchar('preferred_background', { length: 50 }),
    donationRankId: pgText('donation_rank_id'),
    rankExpiresAt: pgTimestamp('rank_expires_at', { mode: 'date' }),
    totalDonated: doublePrecision('total_donated').default(0),
    xp: pgInteger('xp').default(0).notNull(),
    level: pgInteger('level').default(1).notNull(),
    title: pgText('title'),
    createdAt: pgTimestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: pgTimestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  });

  const settings = pgTable('settings', {
    key: varchar('key', { length: 255 }).primaryKey(),
    value: pgText('value').notNull(),
    updatedAt: pgTimestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  });

  const registrationCodes = pgTable('registration_codes', {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 255 }).notNull().unique(),
    minecraftUsername: varchar('minecraft_username', { length: 255 }).notNull(),
    minecraftUuid: varchar('minecraft_uuid', { length: 255 }).notNull(),
    used: pgBoolean('used').default(false).notNull(),
    userId: pgInteger('user_id'),
    expiresAt: pgTimestamp('expires_at', { mode: 'date' }).notNull(),
    createdAt: pgTimestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    usedAt: pgTimestamp('used_at', { mode: 'date' }),
  });

  const servers = pgTable('servers', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: pgText('description'),
    ipAddress: varchar('ip_address', { length: 255 }).notNull(),
    port: pgInteger('port').default(25565).notNull(),
    modpackName: pgText('modpack_name'),
    bluemapUrl: pgText('bluemap_url'),
    curseforgeUrl: pgText('curseforge_url'),
    status: varchar('status', { length: 50 }).default('offline').notNull(),
    playersOnline: pgInteger('players_online').default(0).notNull(),
    playersMax: pgInteger('players_max').default(0).notNull(),
    version: varchar('version', { length: 50 }),
    orderIndex: pgInteger('order_index').default(0).notNull(),
    createdAt: pgTimestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: pgTimestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  });

  // Add remaining tables following the same pattern...
  // For brevity, returning the core tables. Full implementation would include all tables.

  return {
    users,
    settings,
    registrationCodes,
    servers,
    // ... other tables
  };
}

/**
 * MySQL/MariaDB Schema
 */
function getMySQLSchema() {
  const users = mysqlTable('users', {
    id: mysqlSerial('id').primaryKey(),
    username: mysqlVarchar('username', { length: 255 }).notNull().unique(),
    email: mysqlVarchar('email', { length: 255 }),
    password: mysqlText('password').notNull(),
    role: mysqlVarchar('role', { length: 50 }).default('user').notNull(),
    minecraftUsername: mysqlVarchar('minecraft_username', { length: 255 }).unique(),
    minecraftUuid: mysqlVarchar('minecraft_uuid', { length: 255 }).unique(),
    avatar: mysqlText('avatar'),
    bio: mysqlText('bio'),
    preferredBackground: mysqlVarchar('preferred_background', { length: 50 }),
    donationRankId: mysqlText('donation_rank_id'),
    rankExpiresAt: mysqlTimestamp('rank_expires_at', { mode: 'date' }),
    totalDonated: double('total_donated').default(0),
    xp: mysqlInt('xp').default(0).notNull(),
    level: mysqlInt('level').default(1).notNull(),
    title: mysqlText('title'),
    createdAt: mysqlTimestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: mysqlTimestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  });

  const settings = mysqlTable('settings', {
    key: mysqlVarchar('key', { length: 255 }).primaryKey(),
    value: mysqlText('value').notNull(),
    updatedAt: mysqlTimestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  });

  const registrationCodes = mysqlTable('registration_codes', {
    id: mysqlSerial('id').primaryKey(),
    code: mysqlVarchar('code', { length: 255 }).notNull().unique(),
    minecraftUsername: mysqlVarchar('minecraft_username', { length: 255 }).notNull(),
    minecraftUuid: mysqlVarchar('minecraft_uuid', { length: 255 }).notNull(),
    used: mysqlBoolean('used').default(false).notNull(),
    userId: mysqlInt('user_id'),
    expiresAt: mysqlTimestamp('expires_at', { mode: 'date' }).notNull(),
    createdAt: mysqlTimestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    usedAt: mysqlTimestamp('used_at', { mode: 'date' }),
  });

  const servers = mysqlTable('servers', {
    id: mysqlSerial('id').primaryKey(),
    name: mysqlVarchar('name', { length: 255 }).notNull(),
    description: mysqlText('description'),
    ipAddress: mysqlVarchar('ip_address', { length: 255 }).notNull(),
    port: mysqlInt('port').default(25565).notNull(),
    modpackName: mysqlText('modpack_name'),
    bluemapUrl: mysqlText('bluemap_url'),
    curseforgeUrl: mysqlText('curseforge_url'),
    status: mysqlVarchar('status', { length: 50 }).default('offline').notNull(),
    playersOnline: mysqlInt('players_online').default(0).notNull(),
    playersMax: mysqlInt('players_max').default(0).notNull(),
    version: mysqlVarchar('version', { length: 50 }),
    orderIndex: mysqlInt('order_index').default(0).notNull(),
    createdAt: mysqlTimestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: mysqlTimestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  });

  // Add remaining tables following the same pattern...

  return {
    users,
    settings,
    registrationCodes,
    servers,
    // ... other tables
  };
}
