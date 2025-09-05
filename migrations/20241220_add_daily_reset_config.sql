-- Migration: Add daily reset configuration to app_config
-- This migration adds the necessary configuration values for daily credit reset

-- Add daily_cap configuration (if not exists)
INSERT INTO app_config (key, value) 
VALUES ('daily_cap', '30')
ON CONFLICT (key) DO NOTHING;

-- Add last_credit_reset configuration (if not exists)
-- Set to yesterday to trigger first reset
INSERT INTO app_config (key, value) 
VALUES ('last_credit_reset', (CURRENT_DATE - INTERVAL '1 day')::text)
ON CONFLICT (key) DO NOTHING;

-- Verify the configuration was added
SELECT key, value FROM app_config WHERE key IN ('daily_cap', 'last_credit_reset');
