-- Referral System Database Migration
-- Run this in your Supabase SQL Editor

BEGIN;

-- 1. Create user_referrals table to track referral stats (no codes needed)
CREATE TABLE IF NOT EXISTS user_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_invites INTEGER DEFAULT 0,
  total_tokens_earned INTEGER DEFAULT 0,
  last_invite_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create referral_signups table to track successful referrals
CREATE TABLE IF NOT EXISTS referral_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referrer_email TEXT NOT NULL,
  new_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  new_user_email TEXT NOT NULL,
  referrer_bonus INTEGER NOT NULL DEFAULT 50,
  new_user_bonus INTEGER NOT NULL DEFAULT 25,
  env TEXT NOT NULL DEFAULT 'prod',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(new_user_id) -- Prevent double referrals for same user
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_referrals_user_id ON user_referrals(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_signups_referrer ON referral_signups(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_signups_new_user ON referral_signups(new_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_signups_referrer_email ON referral_signups(referrer_email);
CREATE INDEX IF NOT EXISTS idx_referral_signups_new_email ON referral_signups(new_user_email);
CREATE INDEX IF NOT EXISTS idx_referral_signups_env ON referral_signups(env);

-- 4. Enable Row Level Security
ALTER TABLE user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_signups ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for user_referrals
DROP POLICY IF EXISTS "users can read own referrals" ON user_referrals;
CREATE POLICY "users can read own referrals"
ON user_referrals FOR SELECT
USING (
  (current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid = user_id
);

DROP POLICY IF EXISTS "users can update own referrals" ON user_referrals;
CREATE POLICY "users can update own referrals"
ON user_referrals FOR UPDATE
USING (
  (current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid = user_id
);

DROP POLICY IF EXISTS "users can insert own referrals" ON user_referrals;
CREATE POLICY "users can insert own referrals"
ON user_referrals FOR INSERT
WITH CHECK (
  (current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid = user_id
);

-- 6. Create RLS policies for referral_signups
DROP POLICY IF EXISTS "users can read referrals they made" ON referral_signups;
CREATE POLICY "users can read referrals they made"
ON referral_signups FOR SELECT
USING (
  (current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid = referrer_user_id
  OR
  (current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid = new_user_id
);

-- 7. Create a function to initialize referral stats for new users
CREATE OR REPLACE FUNCTION create_user_referral_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_referrals (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_create_referral_code ON users;

-- Create trigger for new users
CREATE TRIGGER trigger_create_referral_stats
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_referral_stats();

COMMIT;

-- 9. Verification queries
SELECT 
  'user_referrals' as table_name,
  COUNT(*) as row_count,
  '✅ Ready for referral tracking' as status
FROM user_referrals
UNION ALL
SELECT 
  'referral_signups' as table_name,
  COUNT(*) as row_count,
  '✅ Ready for signup tracking' as status
FROM referral_signups;

-- Show sample user referral stats
SELECT 
  'Email-based referrals ready' as description,
  '✅ No codes needed - using email invitations' as status;
