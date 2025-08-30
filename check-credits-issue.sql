-- Check and fix user_credits table structure
-- This script will diagnose why credits are showing as 0

-- 1. Check current table structure
SELECT '=== CURRENT USER_CREDITS STRUCTURE ===' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_credits' 
ORDER BY ordinal_position;

-- 2. Check if table exists and has data
SELECT '=== USER_CREDITS DATA CHECK ===' as info;
SELECT COUNT(*) as total_users FROM user_credits;
SELECT COUNT(*) as users_with_credits FROM user_credits WHERE credits IS NOT NULL;
SELECT COUNT(*) as users_with_balance FROM user_credits WHERE balance IS NOT NULL;

-- 3. Show sample data
SELECT '=== SAMPLE USER_CREDITS DATA ===' as info;
SELECT user_id, credits, balance, created_at, updated_at 
FROM user_credits 
LIMIT 5;

-- 4. Check for users with 0 or NULL credits
SELECT '=== USERS WITH CREDIT ISSUES ===' as info;
SELECT user_id, credits, balance 
FROM user_credits 
WHERE credits IS NULL OR credits = 0 OR balance IS NULL OR balance = 0;

-- 5. Fix credits for users with NULL or 0 values
UPDATE user_credits 
SET credits = 30, balance = 0, updated_at = NOW()
WHERE credits IS NULL OR credits = 0 OR balance IS NULL OR balance = 0;

-- 6. Verify the fix
SELECT '=== AFTER FIX - VERIFICATION ===' as info;
SELECT COUNT(*) as users_with_30_credits FROM user_credits WHERE credits = 30;
SELECT COUNT(*) as users_with_0_balance FROM user_credits WHERE balance = 0;

-- 7. Show final state
SELECT '=== FINAL STATE ===' as info;
SELECT user_id, credits, balance, updated_at 
FROM user_credits 
LIMIT 5;
