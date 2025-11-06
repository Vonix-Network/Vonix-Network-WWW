-- Migration: Add performance indexes for rank subscription system
-- Created: 2026-01-05

-- Index for rank expiration queries (used by cron job)
CREATE INDEX IF NOT EXISTS idx_users_rank_expires_at ON users(rank_expires_at) WHERE rank_expires_at IS NOT NULL;

-- Index for active ranks lookup
CREATE INDEX IF NOT EXISTS idx_users_donation_rank_id ON users(donation_rank_id) WHERE donation_rank_id IS NOT NULL;

-- Composite index for paused ranks
CREATE INDEX IF NOT EXISTS idx_users_rank_paused ON users(rank_paused, donation_rank_id) WHERE rank_paused = 1;

-- Index for payment provider customer IDs (already exists but ensuring)
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_square_customer ON users(square_customer_id) WHERE square_customer_id IS NOT NULL;

-- Index for donation tracking
CREATE INDEX IF NOT EXISTS idx_donations_user_created ON donations(user_id, created_at DESC);

-- Index for rank priority ordering
CREATE INDEX IF NOT EXISTS idx_donation_ranks_priority ON donation_ranks(priority, min_amount);
