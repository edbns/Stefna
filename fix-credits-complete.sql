-- Complete fix for user_credits table and daily reset system
-- This will fix the "0 credits" issue and set up proper daily reset

-- 1. First, check current state
SELECT '=== DIAGNOSING CREDIT ISSUES ===' as info;

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_credits' 
ORDER BY ordinal_position;

-- Check current data
SELECT COUNT(*) as total_users FROM user_credits;
SELECT COUNT(*) as users_with_30_credits FROM user_credits WHERE credits = 30;
SELECT COUNT(*) as users_with_0_credits FROM user_credits WHERE credits = 0 OR credits IS NULL;

-- Show problematic users
SELECT user_id, credits, balance, created_at, updated_at 
FROM user_credits 
WHERE credits IS NULL OR credits = 0 OR balance IS NULL OR balance = 0;

-- 2. Fix all credit issues
SELECT '=== FIXING CREDIT ISSUES ===' as info;

-- Update users with NULL or 0 credits to have 30 daily credits
UPDATE user_credits 
SET credits = 30, balance = COALESCE(balance, 0), updated_at = NOW()
WHERE credits IS NULL OR credits = 0;

-- Update users with NULL balance to have 0 balance
UPDATE user_credits 
SET balance = 0, updated_at = NOW()
WHERE balance IS NULL;

-- 3. Create daily reset function
SELECT '=== CREATING DAILY RESET FUNCTION ===' as info;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS reset_daily_credits();

-- Create function to reset daily credits
CREATE OR REPLACE FUNCTION reset_daily_credits()
RETURNS void AS $$
BEGIN
  -- Reset all users' daily credits to 30
  UPDATE user_credits 
  SET credits = 30, updated_at = NOW()
  WHERE credits < 30;
  
  -- Log the reset
  INSERT INTO credits_ledger (id, user_id, action, status, reason, amount, env, created_at, updated_at)
  SELECT 
    gen_random_uuid()::text,
    user_id,
    'daily_reset',
    'completed',
    'Daily credit reset to 30',
    30,
    'system',
    NOW(),
    NOW()
  FROM user_credits 
  WHERE credits = 30 AND updated_at::date = CURRENT_DATE;
  
  RAISE NOTICE 'Daily credits reset for % users', (SELECT COUNT(*) FROM user_credits WHERE credits = 30);
END;
$$ LANGUAGE plpgsql;

-- 4. Create a trigger to auto-reset credits daily
SELECT '=== SETTING UP AUTO-RESET ===' as info;

-- Create a table to track last reset
CREATE TABLE IF NOT EXISTS credit_reset_log (
    id SERIAL PRIMARY KEY,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    users_reset INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial reset log if empty
INSERT INTO credit_reset_log (last_reset_date, users_reset) 
SELECT CURRENT_DATE, COUNT(*) FROM user_credits 
WHERE NOT EXISTS (SELECT 1 FROM credit_reset_log);

-- 5. Verify the fix
SELECT '=== VERIFICATION ===' as info;

-- Check final state
SELECT COUNT(*) as total_users FROM user_credits;
SELECT COUNT(*) as users_with_30_credits FROM user_credits WHERE credits = 30;
SELECT COUNT(*) as users_with_0_credits FROM user_credits WHERE credits = 0;
SELECT COUNT(*) as users_with_0_balance FROM user_credits WHERE balance = 0;

-- Show sample data
SELECT user_id, credits, balance, created_at, updated_at 
FROM user_credits 
LIMIT 5;

-- 6. Test the reset function
SELECT '=== TESTING RESET FUNCTION ===' as info;

-- Run the reset function
SELECT reset_daily_credits();

-- Check if it worked
SELECT COUNT(*) as users_with_30_credits_after_reset FROM user_credits WHERE credits = 30;

-- 7. Set up cron job instructions
SELECT '=== SETUP INSTRUCTIONS ===' as info;
SELECT 'To set up daily reset, run this function every day at midnight UTC:' as instruction;
SELECT 'SELECT reset_daily_credits();' as cron_command;
SELECT 'Or set up a cron job to call this function automatically.' as note;
