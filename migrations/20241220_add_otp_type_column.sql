-- Add type column to auth_otps table for different OTP purposes
-- This allows us to distinguish between login OTPs and email change OTPs

ALTER TABLE auth_otps 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'login';

-- Add index for type column for better query performance
CREATE INDEX IF NOT EXISTS idx_auth_otps_type ON auth_otps(type);

-- Add composite index for email and type lookup
CREATE INDEX IF NOT EXISTS idx_auth_otps_email_type ON auth_otps(email, type);

-- Update existing records to have 'login' type
UPDATE auth_otps SET type = 'login' WHERE type IS NULL;
