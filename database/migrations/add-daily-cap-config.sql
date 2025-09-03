-- Migration: Add daily_cap to app_config
-- This migration adds the daily_cap configuration value to the app_config table

INSERT INTO app_config (key, value) VALUES 
    ('daily_cap', '30')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value;
