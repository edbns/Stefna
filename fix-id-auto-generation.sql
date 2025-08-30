-- Fix id column auto-generation based on ACTUAL database structure
-- This migration is based on the real table structure, not assumptions

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fix tables with TEXT id columns that need uuid_generate_v4()::text default
-- Most tables already have this working, but let's ensure consistency

-- Users table (TEXT type - already working)
-- ALTER TABLE users ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Credits ledger table (TEXT type - already working)
-- ALTER TABLE credits_ledger ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Custom prompt media table (TEXT type - already working)
-- ALTER TABLE custom_prompt_media ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Emotion mask media table (TEXT type - already working)
-- ALTER TABLE emotion_mask_media ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Ghibli reaction media table (TEXT type - already working)
-- ALTER TABLE ghibli_reaction_media ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Neo glitch media table (TEXT type - already working)
-- ALTER TABLE neo_glitch_media ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Presets media table (TEXT type - already working)
-- ALTER TABLE presets_media ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Story table (TEXT type - already working)
-- ALTER TABLE story ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Story photo table (TEXT type - already working)
-- ALTER TABLE story_photo ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Video jobs table (TEXT type - already working)
-- ALTER TABLE video_jobs ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Referral signups table (TEXT type - already working)
-- ALTER TABLE referral_signups ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- AI generations table (TEXT type - already working)
-- ALTER TABLE ai_generations ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Fix tables with UUID id columns that need uuid_generate_v4() default (no ::text cast)

-- Assets table (UUID type - needs fixing)
ALTER TABLE assets 
ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Auth OTPs table (UUID type - needs fixing)
ALTER TABLE auth_otps 
ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Fix tables with no default value

-- Presets config table (TEXT type - needs default)
ALTER TABLE presets_config 
ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- User credits table (check if it exists and fix if needed)
-- Note: user_credits table exists but user_id column might not be the primary key
-- Let's check the structure first before modifying

-- Ensure all id columns are NOT NULL (most are already NOT NULL)
-- Only fix the ones that might not be properly constrained

-- Assets table (UUID type)
ALTER TABLE assets ALTER COLUMN id SET NOT NULL;

-- Auth OTPs table (UUID type)  
ALTER TABLE auth_otps ALTER COLUMN id SET NOT NULL;

-- Presets config table (TEXT type)
ALTER TABLE presets_config ALTER COLUMN id SET NOT NULL;

-- Note: All other tables already have NOT NULL constraints working properly

-- Add comments for clarity (only for tables that needed fixing)
COMMENT ON COLUMN assets.id IS 'Auto-generated UUID primary key for asset records';
COMMENT ON COLUMN auth_otps.id IS 'Auto-generated UUID primary key for OTP authentication records';
COMMENT ON COLUMN presets_config.id IS 'Auto-generated UUID primary key for presets configuration';

-- Note: All other tables already have proper comments and working defaults

-- Verify the fixes by checking the tables that were actually modified
-- SELECT table_name, column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name IN ('assets', 'auth_otps', 'presets_config') 
-- AND column_name = 'id';

-- Summary of what this migration fixes:
-- 1. assets.id: UUID type with gen_random_uuid() → uuid_generate_v4()
-- 2. auth_otps.id: UUID type with gen_random_uuid() → uuid_generate_v4()  
-- 3. presets_config.id: TEXT type with no default → uuid_generate_v4()::text
-- 4. All other tables already have working uuid_generate_v4() defaults
