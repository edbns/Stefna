-- Fix user_credits table structure to maintain both credits and balance fields
-- credits = daily spending limit (resets daily, starts at 30)
-- balance = total lifetime balance (for referral bonuses, etc.)

-- First, let's see what the current table looks like
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_credits' 
ORDER BY ordinal_position;

-- Create a new clean table with the correct structure
CREATE TABLE IF NOT EXISTS user_credits_new (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    credits INTEGER DEFAULT 30,  -- Daily spending limit
    balance INTEGER DEFAULT 0,   -- Total lifetime balance
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- Copy data from old table to new table
-- Use existing credits if available, otherwise default to 30
-- Use existing balance if available, otherwise default to 0
INSERT INTO user_credits_new (user_id, credits, balance, created_at, updated_at)
SELECT 
    user_id,
    COALESCE(
        CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_credits' AND column_name = 'credits') 
            THEN (SELECT credits FROM user_credits WHERE user_credits.user_id = user_credits.user_id)
            ELSE 30
        END,
        30
    ) as credits,
    COALESCE(
        CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_credits' AND column_name = 'balance') 
            THEN (SELECT balance FROM user_credits WHERE user_credits.user_id = user_credits.user_id)
            ELSE 0
        END,
        0
    ) as balance,
    COALESCE(created_at, NOW()) as created_at,
    COALESCE(updated_at, NOW()) as updated_at
FROM user_credits;

-- Drop the old table and rename the new one
DROP TABLE user_credits;
ALTER TABLE user_credits_new RENAME TO user_credits;

-- Add comments to explain the structure
COMMENT ON COLUMN user_credits.credits IS 'Daily spending limit. Default 30 credits per day, resets daily.';
COMMENT ON COLUMN user_credits.balance IS 'Total lifetime balance. Used for referral bonuses and tracking.';

-- Verify the fix
SELECT 
    table_name,
    column_name,
    is_nullable,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_credits' 
ORDER BY ordinal_position;

-- Show sample data
SELECT user_id, credits, balance, created_at, updated_at FROM user_credits LIMIT 5;
