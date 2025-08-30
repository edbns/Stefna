-- Fix user_credits table structure to standardize on credits field
-- Remove duplicate user_id and balance fields, keep only credits

-- First, backup the current data
CREATE TABLE IF NOT EXISTS user_credits_backup AS SELECT * FROM user_credits;

-- Drop the current table
DROP TABLE user_credits;

-- Recreate with correct structure
CREATE TABLE IF NOT EXISTS user_credits (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    credits INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- Restore data from backup, using credits field (or default to 30 if not available)
INSERT INTO user_credits (user_id, credits, created_at, updated_at)
SELECT 
    user_id,
    COALESCE(credits, 30) as credits,
    created_at,
    updated_at
FROM user_credits_backup;

-- Add comment to explain the structure
COMMENT ON COLUMN user_credits.credits IS 'User credit balance. Default 30 credits per day, resets daily.';

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
SELECT user_id, credits, created_at, updated_at FROM user_credits LIMIT 5;
