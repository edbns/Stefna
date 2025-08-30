-- Fix id column auto-generation for ALL tables
-- Ensure UUID extension is enabled and all id columns generate properly

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fix ALL tables that use gen_random_uuid() to use uuid_generate_v4() instead
-- This prevents the "null value in column id" error across all tables

-- Users table
ALTER TABLE users 
ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- User credits table
ALTER TABLE user_credits 
ALTER COLUMN user_id SET DEFAULT uuid_generate_v4()::text;

-- Credits ledger table
ALTER TABLE credits_ledger 
ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Custom prompt media table
ALTER TABLE custom_prompt_media 
ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Emotion mask media table
ALTER TABLE emotion_mask_media 
ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Ghibli reaction media table
ALTER TABLE ghibli_reaction_media 
ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Neo glitch media table
ALTER TABLE neo_glitch_media 
ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Presets media table
ALTER TABLE presets_media 
ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Story table
ALTER TABLE story 
ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Story photo table
ALTER TABLE story_photo 
ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Video jobs table
ALTER TABLE video_jobs 
ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Referral signups table (actual table name)
ALTER TABLE referral_signups 
ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- AI generations table
ALTER TABLE ai_generations 
ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Assets table
ALTER TABLE assets 
ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Presets config table
ALTER TABLE presets_config 
ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- App config table
ALTER TABLE app_config 
ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Ensure all id columns are NOT NULL
ALTER TABLE users ALTER COLUMN id SET NOT NULL;
ALTER TABLE user_credits ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE credits_ledger ALTER COLUMN id SET NOT NULL;
ALTER TABLE custom_prompt_media ALTER COLUMN id SET NOT NULL;
ALTER TABLE emotion_mask_media ALTER COLUMN id SET NOT NULL;
ALTER TABLE ghibli_reaction_media ALTER COLUMN id SET NOT NULL;
ALTER TABLE neo_glitch_media ALTER COLUMN id SET NOT NULL;
ALTER TABLE presets_media ALTER COLUMN id SET NOT NULL;
ALTER TABLE story ALTER COLUMN id SET NOT NULL;
ALTER TABLE story_photo ALTER COLUMN id SET NOT NULL;
ALTER TABLE video_jobs ALTER COLUMN id SET NOT NULL;
ALTER TABLE referral_signups ALTER COLUMN id SET NOT NULL;
ALTER TABLE ai_generations ALTER COLUMN id SET NOT NULL;
ALTER TABLE assets ALTER COLUMN id SET NOT NULL;
ALTER TABLE presets_config ALTER COLUMN id SET NOT NULL;
ALTER TABLE app_config ALTER COLUMN id SET NOT NULL;

-- Add comments for clarity
COMMENT ON COLUMN users.id IS 'Auto-generated UUID primary key for user accounts';
COMMENT ON COLUMN ghibli_reaction_media.id IS 'Auto-generated UUID primary key for ghibli reaction media records';
COMMENT ON COLUMN neo_glitch_media.id IS 'Auto-generated UUID primary key for neo glitch media records';
COMMENT ON COLUMN presets_media.id IS 'Auto-generated UUID primary key for presets media records';
COMMENT ON COLUMN emotion_mask_media.id IS 'Auto-generated UUID primary key for emotion mask media records';
COMMENT ON COLUMN custom_prompt_media.id IS 'Auto-generated UUID primary key for custom prompt media records';
COMMENT ON COLUMN referral_signups.id IS 'Auto-generated UUID primary key for referral signup records';
COMMENT ON COLUMN ai_generations.id IS 'Auto-generated UUID primary key for AI generation records';
COMMENT ON COLUMN assets.id IS 'Auto-generated UUID primary key for asset records';
COMMENT ON COLUMN presets_config.id IS 'Auto-generated UUID primary key for presets configuration';
COMMENT ON COLUMN app_config.id IS 'Auto-generated UUID primary key for app configuration';

-- Verify the fixes by checking all table structures
-- SELECT table_name, column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name IN ('users', 'ghibli_reaction_media', 'neo_glitch_media', 'presets_media', 'emotion_mask_media', 'custom_prompt_media', 'referral_signups', 'ai_generations', 'assets', 'presets_config', 'app_config') 
-- AND column_name = 'id';
