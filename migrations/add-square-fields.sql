-- Migration: Add Square Payments fields to users table
-- Run this SQL against your database to enable Square subscriptions and auto donor ranks

-- Add Square customer ID for subscription management
ALTER TABLE users ADD COLUMN square_customer_id TEXT UNIQUE;

-- Add donor rank tier for automatic rank assignment
ALTER TABLE users ADD COLUMN donor_rank TEXT;

-- Optional: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_square_customer_id ON users(square_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_donor_rank ON users(donor_rank);
