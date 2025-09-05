-- Email preferences and frequency control table
CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_type VARCHAR(50) NOT NULL, -- 'credit_warning', 'inactive_reminder', 'referral_bonus', etc.
  last_sent_at TIMESTAMP WITH TIME ZONE,
  send_count INTEGER DEFAULT 0,
  is_unsubscribed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, email_type)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_type ON email_preferences(user_id, email_type);
CREATE INDEX IF NOT EXISTS idx_email_preferences_last_sent ON email_preferences(last_sent_at);

-- Function to check if email can be sent (respects frequency limits)
CREATE OR REPLACE FUNCTION can_send_email(
  p_user_id TEXT,
  p_email_type VARCHAR(50),
  p_min_interval_hours INTEGER DEFAULT 24
) RETURNS BOOLEAN AS $$
DECLARE
  last_sent TIMESTAMP WITH TIME ZONE;
  is_unsub BOOLEAN;
BEGIN
  SELECT last_sent_at, is_unsubscribed 
  INTO last_sent, is_unsub
  FROM email_preferences 
  WHERE user_id = p_user_id AND email_type = p_email_type;
  
  -- If user is unsubscribed, don't send
  IF is_unsub THEN
    RETURN FALSE;
  END IF;
  
  -- If never sent before, allow sending
  IF last_sent IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if enough time has passed
  RETURN last_sent < NOW() - INTERVAL '1 hour' * p_min_interval_hours;
END;
$$ LANGUAGE plpgsql;

-- Function to record email sent
CREATE OR REPLACE FUNCTION record_email_sent(
  p_user_id TEXT,
  p_email_type VARCHAR(50)
) RETURNS VOID AS $$
BEGIN
  INSERT INTO email_preferences (user_id, email_type, last_sent_at, send_count, updated_at)
  VALUES (p_user_id, p_email_type, NOW(), 1, NOW())
  ON CONFLICT (user_id, email_type)
  DO UPDATE SET 
    last_sent_at = NOW(),
    send_count = email_preferences.send_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
