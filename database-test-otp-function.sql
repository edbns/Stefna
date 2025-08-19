-- Test OTP Function Requirements
-- This will check if all required tables exist for OTP verification
-- Date: 2025-08-19

-- Check if auth_otps table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'auth_otps';

-- Check if users table exists and has required columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Check if app_config table exists for credits
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'app_config';

-- Check if user_credits table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'user_credits';

-- Check if credits_ledger table exists and has correct schema
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'credits_ledger' 
ORDER BY ordinal_position;

-- Check if referral_signups table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'referral_signups';

-- Check sample data in auth_otps
SELECT 
    id,
    email,
    code,
    used,
    expires_at,
    created_at
FROM auth_otps 
LIMIT 5;

-- Check sample data in app_config
SELECT 
    key,
    value
FROM app_config;
