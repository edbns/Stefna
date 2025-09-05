-- Waitlist System Migration
-- Creates tables and functions for managing the pre-launch waitlist

-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  referred_by_email VARCHAR(255), -- Email of person who referred them
  position INTEGER, -- Position in waitlist
  status VARCHAR(20) DEFAULT 'waiting', -- waiting, notified, converted
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notified_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_referral_code ON waitlist(referral_code);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_position ON waitlist(position);
CREATE INDEX IF NOT EXISTS idx_waitlist_referred_by_email ON waitlist(referred_by_email);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_waitlist_referral_code()
RETURNS VARCHAR(20) AS $$
DECLARE
  code VARCHAR(20);
  exists_count INTEGER;
BEGIN
  LOOP
    -- Generate a 6-character code
    code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if code already exists
    SELECT COUNT(*) INTO exists_count 
    FROM waitlist 
    WHERE referral_code = code;
    
    -- If code doesn't exist, return it
    IF exists_count = 0 THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to add user to waitlist
CREATE OR REPLACE FUNCTION add_to_waitlist(
  p_email VARCHAR(255),
  p_referred_by_email VARCHAR(255) DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  referral_code VARCHAR(20);
  position INTEGER;
  result JSONB;
BEGIN
  -- Generate unique referral code
  referral_code := generate_waitlist_referral_code();
  
  -- Get next position in waitlist
  SELECT COALESCE(MAX(position), 0) + 1 INTO position FROM waitlist;
  
  -- Insert into waitlist
  INSERT INTO waitlist (email, referral_code, referred_by_email, position)
  VALUES (p_email, referral_code, p_referred_by_email, position)
  ON CONFLICT (email) DO UPDATE SET
    referred_by_email = COALESCE(EXCLUDED.referred_by_email, waitlist.referred_by_email),
    updated_at = NOW()
  RETURNING 
    id, email, referral_code, position, status, created_at
  INTO result;
  
  -- If no conflict, return the new record
  IF result IS NULL THEN
    SELECT to_jsonb(w.*) INTO result
    FROM waitlist w
    WHERE w.email = p_email;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get waitlist stats
CREATE OR REPLACE FUNCTION get_waitlist_stats()
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_signups', COUNT(*),
    'waiting', COUNT(*) FILTER (WHERE status = 'waiting'),
    'notified', COUNT(*) FILTER (WHERE status = 'notified'),
    'converted', COUNT(*) FILTER (WHERE status = 'converted'),
    'referrals_generated', COUNT(*) FILTER (WHERE referred_by_email IS NOT NULL),
    'top_referrers', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'referrer_email', referred_by_email,
          'count', count
        )
      )
      FROM (
        SELECT referred_by_email, COUNT(*) as count
        FROM waitlist
        WHERE referred_by_email IS NOT NULL
        GROUP BY referred_by_email
        ORDER BY count DESC
        LIMIT 10
      ) top_refs
    )
  ) INTO stats
  FROM waitlist;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Function to notify waitlist users of launch
CREATE OR REPLACE FUNCTION notify_waitlist_launch()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Update all waiting users to notified status
  UPDATE waitlist 
  SET status = 'notified', notified_at = NOW()
  WHERE status = 'waiting';
  
  -- Return count of notified users
  SELECT jsonb_build_object(
    'notified_count', COUNT(*),
    'status', 'success'
  ) INTO result
  FROM waitlist
  WHERE status = 'notified' AND notified_at >= NOW() - INTERVAL '1 minute';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to convert waitlist user to regular user
CREATE OR REPLACE FUNCTION convert_waitlist_user(
  p_email VARCHAR(255)
)
RETURNS JSONB AS $$
DECLARE
  waitlist_user RECORD;
  result JSONB;
BEGIN
  -- Get waitlist user info
  SELECT * INTO waitlist_user
  FROM waitlist
  WHERE email = p_email;
  
  IF waitlist_user IS NULL THEN
    RETURN jsonb_build_object('error', 'User not found in waitlist');
  END IF;
  
  -- Update status to converted
  UPDATE waitlist
  SET status = 'converted', converted_at = NOW()
  WHERE email = p_email;
  
  -- Return conversion info
  SELECT jsonb_build_object(
    'email', waitlist_user.email,
    'referral_code', waitlist_user.referral_code,
    'position', waitlist_user.position,
    'converted_at', NOW(),
    'status', 'success'
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Add waitlist referral tracking to existing users table
-- This will be used when waitlist users convert to regular users
ALTER TABLE users ADD COLUMN IF NOT EXISTS waitlist_referral_code VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS waitlist_position INTEGER;

-- Create index for waitlist referral tracking
CREATE INDEX IF NOT EXISTS idx_users_waitlist_referral_code ON users(waitlist_referral_code);

-- Insert sample data for testing (remove in production)
-- INSERT INTO waitlist (email, referral_code, position) VALUES 
-- ('test@example.com', 'TEST01', 1),
-- ('demo@example.com', 'DEMO02', 2);
