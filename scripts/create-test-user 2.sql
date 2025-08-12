-- Create Test User Script
-- Run this in your Supabase SQL Editor to create a test user

-- First, create a test user
INSERT INTO users (id, email, name, tier, created_at, last_login_at, daily_limit, daily_usage)
VALUES (
  gen_random_uuid(),
  'test@stefna.com',
  'Test User',
  'registered',
  NOW(),
  NOW(),
  50,  -- Daily limit
  0    -- Daily usage
);

-- Then create a test OTP that's valid for 10 minutes
INSERT INTO user_otps (id, email, otp, expires_at, used, created_at)
VALUES (
  gen_random_uuid(),
  'test@stefna.com',
  '123456',
  NOW() + INTERVAL '10 minutes',
  false,
  NOW()
);

-- Verify the user was created
SELECT 
  u.email, 
  u.name, 
  u.tier, 
  u.daily_limit,
  u.daily_usage,
  o.otp,
  o.expires_at,
  o.used
FROM users u
LEFT JOIN user_otps o ON u.email = o.email
WHERE u.email = 'test@stefna.com';
