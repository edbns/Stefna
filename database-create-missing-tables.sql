-- Create missing tables for Neon database
-- This script creates the minimal schema your endpoints expect

-- Extensions used for UUIDs
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Core users & profiles
CREATE TABLE IF NOT EXISTS users (
  id         uuid PRIMARY KEY,
  email      text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login timestamptz
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id    uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username   text UNIQUE,
  name       text,
  avatar_url text,
  bio        text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Media items shown in feed
CREATE TABLE IF NOT EXISTS media (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url        text NOT NULL,
  thumb_url  text,
  type       text NOT NULL CHECK (type IN ('image','video','audio','other')),
  is_public  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS media_public_idx ON media(is_public, created_at DESC);

-- Settings (for user-settings endpoint)
CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme   text DEFAULT 'system',
  data    jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Notifications (for get-notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       text NOT NULL,
  payload    jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Referrals (for get-referral-stats)
CREATE TABLE IF NOT EXISTS referrals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_email text NOT NULL,
  status       text NOT NULL DEFAULT 'pending', -- pending | joined | converted
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON referrals(referrer_id);

-- Verify tables were created
SELECT 'Tables created successfully!' as status;

-- Show table list
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
