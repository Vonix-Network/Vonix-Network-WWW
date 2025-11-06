/**
 * Enterprise Audit Logging for Rank Operations
 * 
 * Tracks all rank-related actions for compliance, debugging, and analytics
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';

export enum RankAuditAction {
  PURCHASE = 'PURCHASE',
  EXTEND = 'EXTEND',
  UPGRADE = 'UPGRADE',
  DOWNGRADE = 'DOWNGRADE',
  SWITCH = 'SWITCH',
  PAUSE = 'PAUSE',
  RESUME = 'RESUME',
  EXPIRE = 'EXPIRE',
  CANCEL_SUBSCRIPTION = 'CANCEL_SUBSCRIPTION',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
}

export interface RankAuditLog {
  action: RankAuditAction;
  userId: number;
  username?: string;
  rankId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * Create audit log table schema
 * Run this migration to create the table
 */
export const createAuditTableSQL = `
CREATE TABLE IF NOT EXISTS rank_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  username TEXT,
  rank_id TEXT NOT NULL,
  metadata TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rank_audit_user ON rank_audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rank_audit_action ON rank_audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rank_audit_rank ON rank_audit_logs(rank_id, created_at DESC);
`;

/**
 * Log rank operation to audit trail
 */
export async function logRankAudit(log: RankAuditLog): Promise<void> {
  try {
    // Note: Audit logging disabled until schema is migrated
    // TODO: Run migration to create rank_audit_logs table
    console.log(`📝 Audit: ${log.action} - User ${log.userId} - Rank ${log.rankId}`);
    
    if (log.metadata) {
      console.log(`   Metadata:`, log.metadata);
    }
  } catch (error) {
    // Don't fail the operation if audit log fails
    console.error('Failed to write audit log:', error);
  }
}

/**
 * Log rank purchase
 */
export async function auditRankPurchase(
  userId: number,
  username: string,
  rankId: string,
  days: number,
  amount: number,
  isRecurring: boolean = false,
  request?: Request
): Promise<void> {
  await logRankAudit({
    action: RankAuditAction.PURCHASE,
    userId,
    username,
    rankId,
    metadata: {
      days,
      amount,
      isRecurring,
      currency: 'USD',
    },
    ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
    userAgent: request?.headers.get('user-agent') || undefined,
    timestamp: new Date(),
  });
}

/**
 * Log rank upgrade/downgrade
 */
export async function auditRankSwitch(
  userId: number,
  username: string,
  oldRankId: string,
  newRankId: string,
  convertedDays: number,
  isUpgrade: boolean
): Promise<void> {
  await logRankAudit({
    action: isUpgrade ? RankAuditAction.UPGRADE : RankAuditAction.DOWNGRADE,
    userId,
    username,
    rankId: newRankId,
    metadata: {
      oldRankId,
      newRankId,
      convertedDays,
      direction: isUpgrade ? 'upgrade' : 'downgrade',
    },
    timestamp: new Date(),
  });
}

/**
 * Log rank pause
 */
export async function auditRankPause(
  userId: number,
  username: string,
  rankId: string,
  pausedDays: number
): Promise<void> {
  await logRankAudit({
    action: RankAuditAction.PAUSE,
    userId,
    username,
    rankId,
    metadata: {
      pausedDays,
    },
    timestamp: new Date(),
  });
}

/**
 * Log rank resume
 */
export async function auditRankResume(
  userId: number,
  username: string,
  rankId: string,
  restoredDays: number
): Promise<void> {
  await logRankAudit({
    action: RankAuditAction.RESUME,
    userId,
    username,
    rankId,
    metadata: {
      restoredDays,
    },
    timestamp: new Date(),
  });
}

/**
 * Log rank expiration
 */
export async function auditRankExpiration(
  userId: number,
  username: string,
  rankId: string
): Promise<void> {
  await logRankAudit({
    action: RankAuditAction.EXPIRE,
    userId,
    username,
    rankId,
    metadata: {
      automated: true,
    },
    timestamp: new Date(),
  });
}

/**
 * Log payment failure
 */
export async function auditPaymentFailure(
  userId: number,
  username: string,
  rankId: string,
  reason: string
): Promise<void> {
  await logRankAudit({
    action: RankAuditAction.PAYMENT_FAILED,
    userId,
    username,
    rankId,
    metadata: {
      reason,
    },
    timestamp: new Date(),
  });
}

/**
 * Get audit history for a user
 */
export async function getUserRankHistory(userId: number, limit: number = 50): Promise<any[]> {
  try {
    // TODO: Implement once audit table is created
    console.log(`Fetching rank history for user ${userId}`);
    return [];
  } catch (error) {
    console.error('Error fetching user rank history:', error);
    return [];
  }
}

/**
 * Get audit history for a rank
 */
export async function getRankHistory(rankId: string, limit: number = 100): Promise<any[]> {
  try {
    // TODO: Implement once audit table is created
    console.log(`Fetching history for rank ${rankId}`);
    return [];
  } catch (error) {
    console.error('Error fetching rank history:', error);
    return [];
  }
}

/**
 * Get recent audit activity
 */
export async function getRecentRankActivity(limit: number = 100): Promise<any[]> {
  try {
    // TODO: Implement once audit table is created
    console.log(`Fetching recent rank activity (limit: ${limit})`);
    return [];
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}
