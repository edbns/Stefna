-- Credits table setup for Stefna
-- Run this on your Neon database to prevent 402 "Insufficient credits" errors

-- 1. Create credits table
CREATE TABLE IF NOT EXISTS credits (
  user_id text PRIMARY KEY,
  balance int NOT NULL DEFAULT 10,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits (user_id);

-- 3. Seed existing users with 10 credits (if they don't have credits)
INSERT INTO credits (user_id, balance)
SELECT DISTINCT user_id, 10
FROM profiles 
WHERE user_id NOT IN (SELECT user_id FROM credits)
ON CONFLICT (user_id) DO NOTHING;

-- 4. Verify the setup
SELECT 
  'Credits table created' as status,
  COUNT(*) as total_users,
  SUM(balance) as total_credits
FROM credits;

-- 5. Show sample data
SELECT user_id, balance, updated_at 
FROM credits 
LIMIT 5;
