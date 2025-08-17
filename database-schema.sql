-- Stefna Database Schema for Custom OTP Authentication

-- Users table (simplified - no more tier complexity)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_photos INTEGER DEFAULT 0,
  daily_usage INTEGER DEFAULT 0,
  daily_limit INTEGER DEFAULT 30  -- Simplified: All users get 30 tokens/day
);

-- If your existing users table doesn't have the UNIQUE constraint on email,
-- run this command in your Supabase SQL editor:
-- ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);

-- User OTPs table for storing one-time passwords
CREATE TABLE IF NOT EXISTS user_otps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_otps_email ON user_otps(email);
CREATE INDEX IF NOT EXISTS idx_user_otps_expires ON user_otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_otps_used ON user_otps(used);

-- Composite index for OTP verification
CREATE INDEX IF NOT EXISTS idx_user_otps_email_expires ON user_otps(email, expires_at);

-- Create index for users email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Optional: Clean up expired OTPs (run this periodically)
-- DELETE FROM user_otps WHERE expires_at < NOW();

-- Optional: Clean up used OTPs older than 1 day
-- DELETE FROM user_otps WHERE used = TRUE AND created_at < NOW() - INTERVAL '1 day'; 