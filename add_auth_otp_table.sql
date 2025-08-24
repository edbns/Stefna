-- Add missing auth_otps table that verify-otp function needs
CREATE TABLE IF NOT EXISTS auth_otps (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_otps_email_code ON auth_otps(email, code);
CREATE INDEX IF NOT EXISTS idx_auth_otps_expires_at ON auth_otps(expires_at);
