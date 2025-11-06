/**
 * Enterprise Error Handling for Rank System
 * 
 * Centralized error classes with proper error codes and user-friendly messages
 */

export enum RankErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'RANK_001',
  FORBIDDEN = 'RANK_002',

  // Validation Errors
  INVALID_RANK_ID = 'RANK_100',
  INVALID_DAYS = 'RANK_101',
  INVALID_AMOUNT = 'RANK_102',
  INVALID_USER_ID = 'RANK_103',

  // Business Logic Errors
  USER_NOT_FOUND = 'RANK_200',
  RANK_NOT_FOUND = 'RANK_201',
  NO_ACTIVE_RANK = 'RANK_202',
  RANK_EXPIRED = 'RANK_203',
  RANK_ALREADY_PAUSED = 'RANK_204',
  RANK_NOT_PAUSED = 'RANK_205',
  SAME_RANK = 'RANK_206',
  INSUFFICIENT_DAYS = 'RANK_207',

  // Payment Errors
  PAYMENT_FAILED = 'RANK_300',
  PAYMENT_PROVIDER_ERROR = 'RANK_301',
  INSUFFICIENT_FUNDS = 'RANK_302',

  // System Errors
  DATABASE_ERROR = 'RANK_400',
  INTERNAL_ERROR = 'RANK_500',
}

export class RankError extends Error {
  constructor(
    public code: RankErrorCode,
    public message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'RankError';
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

// ============================================================================
// Specific Error Classes
// ============================================================================

export class UnauthorizedError extends RankError {
  constructor(message: string = 'Authentication required') {
    super(RankErrorCode.UNAUTHORIZED, message, 401);
  }
}

export class ForbiddenError extends RankError {
  constructor(message: string = 'Access denied') {
    super(RankErrorCode.FORBIDDEN, message, 403);
  }
}

export class UserNotFoundError extends RankError {
  constructor(userId: number) {
    super(
      RankErrorCode.USER_NOT_FOUND,
      `User with ID ${userId} not found`,
      404,
      { userId }
    );
  }
}

export class RankNotFoundError extends RankError {
  constructor(rankId: string) {
    super(
      RankErrorCode.RANK_NOT_FOUND,
      `Rank "${rankId}" not found`,
      404,
      { rankId }
    );
  }
}

export class NoActiveRankError extends RankError {
  constructor(operation: string = 'operation') {
    super(
      RankErrorCode.NO_ACTIVE_RANK,
      `No active rank found for this ${operation}`,
      400
    );
  }
}

export class RankExpiredError extends RankError {
  constructor() {
    super(
      RankErrorCode.RANK_EXPIRED,
      'Cannot perform operation on expired rank',
      400
    );
  }
}

export class RankAlreadyPausedError extends RankError {
  constructor() {
    super(
      RankErrorCode.RANK_ALREADY_PAUSED,
      'Rank is already paused',
      400
    );
  }
}

export class RankNotPausedError extends RankError {
  constructor() {
    super(
      RankErrorCode.RANK_NOT_PAUSED,
      'Rank is not paused',
      400
    );
  }
}

export class SameRankError extends RankError {
  constructor(rankId: string) {
    super(
      RankErrorCode.SAME_RANK,
      `You already have the ${rankId} rank`,
      400,
      { rankId }
    );
  }
}

export class ValidationError extends RankError {
  constructor(field: string, message: string) {
    super(
      RankErrorCode.INVALID_RANK_ID,
      `Validation failed for ${field}: ${message}`,
      400,
      { field }
    );
  }
}

export class PaymentError extends RankError {
  constructor(message: string, details?: any) {
    super(
      RankErrorCode.PAYMENT_FAILED,
      message,
      402,
      details
    );
  }
}

export class DatabaseError extends RankError {
  constructor(operation: string, originalError?: any) {
    super(
      RankErrorCode.DATABASE_ERROR,
      `Database error during ${operation}`,
      500,
      { originalError: originalError?.message }
    );
  }
}

// ============================================================================
// Error Handler
// ============================================================================

/**
 * Handle and log errors in a consistent way
 */
export function handleRankError(error: unknown): {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  statusCode: number;
} {
  console.error('Rank operation error:', error);

  if (error instanceof RankError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      statusCode: error.statusCode,
    };
  }

  // Unknown error
  return {
    error: {
      code: RankErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
    },
    statusCode: 500,
  };
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: RankError): string {
  const messages: Record<RankErrorCode, string> = {
    [RankErrorCode.UNAUTHORIZED]: 'Please log in to continue',
    [RankErrorCode.FORBIDDEN]: 'You don\'t have permission to do this',
    [RankErrorCode.INVALID_RANK_ID]: 'Please select a valid rank',
    [RankErrorCode.INVALID_DAYS]: 'Please choose a valid duration',
    [RankErrorCode.INVALID_AMOUNT]: 'Invalid payment amount',
    [RankErrorCode.INVALID_USER_ID]: 'Invalid user',
    [RankErrorCode.USER_NOT_FOUND]: 'Your account was not found',
    [RankErrorCode.RANK_NOT_FOUND]: 'That rank doesn\'t exist',
    [RankErrorCode.NO_ACTIVE_RANK]: 'You need an active rank to do this',
    [RankErrorCode.RANK_EXPIRED]: 'Your rank has expired',
    [RankErrorCode.RANK_ALREADY_PAUSED]: 'Your rank is already paused',
    [RankErrorCode.RANK_NOT_PAUSED]: 'Your rank isn\'t paused',
    [RankErrorCode.SAME_RANK]: 'You already have this rank',
    [RankErrorCode.INSUFFICIENT_DAYS]: 'Not enough time remaining',
    [RankErrorCode.PAYMENT_FAILED]: 'Payment failed. Please try again',
    [RankErrorCode.PAYMENT_PROVIDER_ERROR]: 'Payment system error. Please contact support',
    [RankErrorCode.INSUFFICIENT_FUNDS]: 'Insufficient funds',
    [RankErrorCode.DATABASE_ERROR]: 'Database error. Please try again',
    [RankErrorCode.INTERNAL_ERROR]: 'Something went wrong. Please try again',
  };

  return messages[error.code] || error.message;
}
