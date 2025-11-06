/**
 * Enterprise-Grade Validation for Rank Subscription System
 * 
 * Centralized validation with detailed error messages and type safety
 */

import { z } from 'zod';

// ============================================================================
// Validation Schemas
// ============================================================================

export const RankIdSchema = z.string()
  .min(1, 'Rank ID is required')
  .max(50, 'Rank ID too long')
  .regex(/^[a-z0-9-]+$/, 'Rank ID must contain only lowercase letters, numbers, and hyphens');

export const DaysSchema = z.number()
  .int('Days must be a whole number')
  .min(1, 'Minimum 1 day required')
  .max(3650, 'Maximum 10 years (3650 days)');

export const AmountSchema = z.number()
  .positive('Amount must be positive')
  .max(10000, 'Amount exceeds maximum ($10,000)')
  .refine((val) => Number.isFinite(val), 'Amount must be a valid number');

export const UserIdSchema = z.number()
  .int('User ID must be a whole number')
  .positive('User ID must be positive');

// Purchase Request Schema
export const PurchaseRequestSchema = z.object({
  rankId: RankIdSchema,
  days: DaysSchema,
  amount: AmountSchema,
  paymentId: z.string().optional(),
  isRecurring: z.boolean().optional(),
});

// Switch Rank Request Schema
export const SwitchRankRequestSchema = z.object({
  newRankId: RankIdSchema,
});

// Extend Rank Request Schema
export const ExtendRankRequestSchema = z.object({
  days: DaysSchema,
  amount: AmountSchema,
});

// ============================================================================
// Validation Functions
// ============================================================================

export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
  message?: string;
}

/**
 * Validate purchase request
 */
export function validatePurchaseRequest(data: unknown): ValidationResult {
  try {
    const validated = PurchaseRequestSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      error.issues.forEach((err: z.ZodIssue) => {
        const path = err.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(err.message);
      });
      return {
        success: false,
        errors,
        message: 'Validation failed',
      };
    }
    return {
      success: false,
      message: 'Invalid request data',
    };
  }
}

/**
 * Validate switch rank request
 */
export function validateSwitchRankRequest(data: unknown): ValidationResult {
  try {
    const validated = SwitchRankRequestSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      error.issues.forEach((err: z.ZodIssue) => {
        const path = err.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(err.message);
      });
      return {
        success: false,
        errors,
        message: 'Validation failed',
      };
    }
    return {
      success: false,
      message: 'Invalid request data',
    };
  }
}

/**
 * Validate user ID
 */
export function validateUserId(userId: unknown): ValidationResult<number> {
  try {
    const validated = UserIdSchema.parse(userId);
    return { success: true, data: validated };
  } catch (error) {
    return {
      success: false,
      message: 'Invalid user ID',
    };
  }
}

/**
 * Validate rank ID
 */
export function validateRankId(rankId: unknown): ValidationResult<string> {
  try {
    const validated = RankIdSchema.parse(rankId);
    return { success: true, data: validated };
  } catch (error) {
    return {
      success: false,
      message: 'Invalid rank ID',
    };
  }
}

/**
 * Business logic validation: Check if user can perform rank operation
 */
export interface RankOperationValidation {
  canPurchase: boolean;
  canSwitch: boolean;
  canPause: boolean;
  canResume: boolean;
  reasons: string[];
}

export function validateRankOperation(user: {
  donationRankId: string | null;
  rankExpiresAt: Date | null;
  rankPaused: boolean;
}): RankOperationValidation {
  const now = new Date();
  const hasActiveRank = !!(user.donationRankId && user.rankExpiresAt && new Date(user.rankExpiresAt) > now);
  const isExpired = !!(user.rankExpiresAt && new Date(user.rankExpiresAt) <= now);

  const reasons: string[] = [];
  
  // Purchase validation
  const canPurchase = true; // Anyone can purchase

  // Switch validation
  const canSwitch = hasActiveRank && !user.rankPaused;
  if (!canSwitch) {
    if (!hasActiveRank) reasons.push('No active rank to switch from');
    if (user.rankPaused) reasons.push('Cannot switch while rank is paused');
  }

  // Pause validation
  const canPause = hasActiveRank && !user.rankPaused && !isExpired;
  if (!canPause) {
    if (!hasActiveRank) reasons.push('No active rank to pause');
    if (user.rankPaused) reasons.push('Rank is already paused');
    if (isExpired) reasons.push('Cannot pause expired rank');
  }

  // Resume validation
  const canResume = user.rankPaused && user.donationRankId !== null;
  if (!canResume) {
    if (!user.rankPaused) reasons.push('Rank is not paused');
    if (!user.donationRankId) reasons.push('No rank to resume');
  }

  return {
    canPurchase,
    canSwitch,
    canPause,
    canResume,
    reasons,
  };
}

/**
 * Validate price calculation
 */
export function validatePriceCalculation(
  rankPrice: number,
  days: number,
  calculatedAmount: number
): ValidationResult {
  const expectedAmount = (rankPrice / 30) * days;
  const tolerance = 0.01; // Allow 1 cent difference for rounding

  if (Math.abs(calculatedAmount - expectedAmount) > tolerance) {
    return {
      success: false,
      message: `Price mismatch: expected $${expectedAmount.toFixed(2)}, got $${calculatedAmount.toFixed(2)}`,
    };
  }

  return { success: true };
}

/**
 * Sanitize rank-related input
 */
export function sanitizeRankInput(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
}
