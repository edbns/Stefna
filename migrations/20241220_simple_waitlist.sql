-- Simple Waitlist System
-- Just collects emails for launch notifications

-- Create simple waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);

-- Simple function to add email to waitlist
CREATE OR REPLACE FUNCTION add_to_waitlist(p_email VARCHAR(255))
RETURNS JSON AS $$
DECLARE
  position INTEGER;
BEGIN
  -- Insert email (ignore if already exists)
  INSERT INTO waitlist (email) 
  VALUES (p_email)
  ON CONFLICT (email) DO NOTHING;
  
  -- Get position
  SELECT COUNT(*) + 1 INTO position 
  FROM waitlist 
  WHERE created_at < (SELECT created_at FROM waitlist WHERE email = p_email);
  
  RETURN json_build_object(
    'success', true,
    'email', p_email,
    'position', position
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get waitlist stats
CREATE OR REPLACE FUNCTION get_waitlist_stats()
RETURNS JSON AS $$
DECLARE
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM waitlist;
  
  RETURN json_build_object(
    'total_signups', total_count,
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql;
