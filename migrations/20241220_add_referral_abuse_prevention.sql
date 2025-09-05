-- Add referral abuse prevention tables and functions
-- This migration adds comprehensive abuse prevention for the referral system

-- 1. Account creation tracking per IP
CREATE TABLE IF NOT EXISTS account_creation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient IP-based queries
CREATE INDEX IF NOT EXISTS idx_account_creation_log_ip ON account_creation_log(ip_address);
CREATE INDEX IF NOT EXISTS idx_account_creation_log_created_at ON account_creation_log(created_at);

-- 2. Referral attempt tracking per user
CREATE TABLE IF NOT EXISTS referral_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attempt_type VARCHAR(50) NOT NULL, -- 'email_sent', 'referral_processed'
  referred_email VARCHAR(255),
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient referral tracking
CREATE INDEX IF NOT EXISTS idx_referral_attempts_referrer ON referral_attempts(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_attempts_type ON referral_attempts(attempt_type);
CREATE INDEX IF NOT EXISTS idx_referral_attempts_created_at ON referral_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_referral_attempts_ip ON referral_attempts(ip_address);

-- 3. Blocked email domains table
CREATE TABLE IF NOT EXISTS blocked_email_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain VARCHAR(255) UNIQUE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert common temporary email domains
INSERT INTO blocked_email_domains (domain, reason) VALUES
('10minutemail.com', 'Temporary email service'),
('guerrillamail.com', 'Temporary email service'),
('tempmail.org', 'Temporary email service'),
('mailinator.com', 'Temporary email service'),
('yopmail.com', 'Temporary email service'),
('temp-mail.org', 'Temporary email service'),
('throwaway.email', 'Temporary email service'),
('getnada.com', 'Temporary email service'),
('maildrop.cc', 'Temporary email service'),
('sharklasers.com', 'Temporary email service')
ON CONFLICT (domain) DO NOTHING;

-- 4. Function to check IP-based account creation limits
CREATE OR REPLACE FUNCTION check_ip_account_limit(p_ip_address INET)
RETURNS BOOLEAN AS $$
DECLARE
  account_count INTEGER;
BEGIN
  -- Count accounts created from this IP in the last 24 hours
  SELECT COUNT(*)
  INTO account_count
  FROM account_creation_log
  WHERE ip_address = p_ip_address
    AND created_at >= NOW() - INTERVAL '24 hours';
  
  -- Allow maximum 3 accounts per IP per 24 hours
  RETURN account_count < 3;
END;
$$ LANGUAGE plpgsql;

-- 5. Function to check referral frequency limits
CREATE OR REPLACE FUNCTION check_referral_frequency_limit(p_referrer_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  daily_count INTEGER;
  weekly_count INTEGER;
BEGIN
  -- Count referrals sent today
  SELECT COUNT(*)
  INTO daily_count
  FROM referral_attempts
  WHERE referrer_id = p_referrer_id
    AND attempt_type = 'email_sent'
    AND created_at >= NOW() - INTERVAL '24 hours';
  
  -- Count referrals sent this week
  SELECT COUNT(*)
  INTO weekly_count
  FROM referral_attempts
  WHERE referrer_id = p_referrer_id
    AND attempt_type = 'email_sent'
    AND created_at >= NOW() - INTERVAL '7 days';
  
  -- Allow maximum 5 per day, 20 per week
  RETURN daily_count < 5 AND weekly_count < 20;
END;
$$ LANGUAGE plpgsql;

-- 6. Function to check for cross-referrals (users referring each other)
CREATE OR REPLACE FUNCTION check_cross_referral(p_referrer_id TEXT, p_referred_email VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  cross_referral_count INTEGER;
BEGIN
  -- Check if these users have referred each other before
  SELECT COUNT(*)
  INTO cross_referral_count
  FROM referral_attempts ra1
  JOIN referral_attempts ra2 ON ra1.referrer_id = ra2.referrer_id
  WHERE ra1.referrer_id = p_referrer_id
    AND ra1.referred_email = p_referred_email
    AND ra2.referred_email = (
      SELECT email FROM users WHERE id = p_referrer_id
    );
  
  -- Return true if no cross-referral found
  RETURN cross_referral_count = 0;
END;
$$ LANGUAGE plpgsql;

-- 7. Function to check email domain validity
CREATE OR REPLACE FUNCTION is_valid_email_domain(p_email VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  domain VARCHAR;
  is_blocked BOOLEAN;
BEGIN
  -- Extract domain from email
  domain := LOWER(SPLIT_PART(p_email, '@', 2));
  
  -- Check if domain is blocked
  SELECT EXISTS(
    SELECT 1 FROM blocked_email_domains WHERE domain = $1
  ) INTO is_blocked;
  
  -- Return true if domain is not blocked
  RETURN NOT is_blocked;
END;
$$ LANGUAGE plpgsql;

-- 8. Function to check referral cooldown
CREATE OR REPLACE FUNCTION check_referral_cooldown(p_referrer_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  last_referral_time TIMESTAMPTZ;
BEGIN
  -- Get the last successful referral time
  SELECT MAX(created_at)
  INTO last_referral_time
  FROM referral_attempts
  WHERE referrer_id = p_referrer_id
    AND attempt_type = 'referral_processed';
  
  -- If no previous referral, allow
  IF last_referral_time IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if 24 hours have passed
  RETURN last_referral_time < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- 9. Comprehensive referral validation function
CREATE OR REPLACE FUNCTION validate_referral_request(
  p_referrer_id TEXT,
  p_referred_email VARCHAR,
  p_ip_address INET
)
RETURNS TABLE(
  is_valid BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  validation_result RECORD;
BEGIN
  -- Check email domain validity
  IF NOT is_valid_email_domain(p_referred_email) THEN
    RETURN QUERY SELECT FALSE, 'Email domain is not allowed (temporary email services blocked)';
    RETURN;
  END IF;
  
  -- Check referral frequency limits
  IF NOT check_referral_frequency_limit(p_referrer_id) THEN
    RETURN QUERY SELECT FALSE, 'Referral limit exceeded (max 5 per day, 20 per week)';
    RETURN;
  END IF;
  
  -- Check cross-referral prevention
  IF NOT check_cross_referral(p_referrer_id, p_referred_email) THEN
    RETURN QUERY SELECT FALSE, 'Cross-referrals are not allowed';
    RETURN;
  END IF;
  
  -- Check referral cooldown
  IF NOT check_referral_cooldown(p_referrer_id) THEN
    RETURN QUERY SELECT FALSE, 'Please wait 24 hours between referrals';
    RETURN;
  END IF;
  
  -- All validations passed
  RETURN QUERY SELECT TRUE, 'Valid referral request';
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE account_creation_log IS 'Tracks account creation per IP address for abuse prevention';
COMMENT ON TABLE referral_attempts IS 'Tracks referral attempts per user for frequency limiting';
COMMENT ON TABLE blocked_email_domains IS 'List of blocked email domains (temporary email services)';
COMMENT ON FUNCTION check_ip_account_limit(INET) IS 'Checks if IP address can create more accounts (max 3 per 24 hours)';
COMMENT ON FUNCTION check_referral_frequency_limit(TEXT) IS 'Checks referral frequency limits (max 5 per day, 20 per week)';
COMMENT ON FUNCTION check_cross_referral(TEXT, VARCHAR) IS 'Prevents users from referring each other';
COMMENT ON FUNCTION is_valid_email_domain(VARCHAR) IS 'Validates email domain against blocked list';
COMMENT ON FUNCTION check_referral_cooldown(TEXT) IS 'Enforces 24-hour cooldown between referrals';
COMMENT ON FUNCTION validate_referral_request(TEXT, VARCHAR, INET) IS 'Comprehensive referral validation';
