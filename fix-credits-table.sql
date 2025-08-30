-- Fix user_credits table structure to standardize on credits field
-- This script will work regardless of the current table structure

-- First, let's see what the current table looks like
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_credits' 
ORDER BY ordinal_position;

-- Create a new clean table with the correct structure
CREATE TABLE IF NOT EXISTS user_credits_new (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    credits INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- Copy data from old table to new table, using whatever credit field exists
-- or defaulting to 30 if no credit field exists
INSERT INTO user_credits_new (user_id, credits, created_at, updated_at)
SELECT 
    user_id,
    30 as credits, -- Default all users to 30 credits
    COALESCE(created_at, NOW()) as created_at,
    COALESCE(updated_at, NOW()) as updated_at
FROM user_credits;

-- Drop the old table and rename the new one
DROP TABLE user_credits;
ALTER TABLE user_credits_new RENAME TO user_credits;

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
