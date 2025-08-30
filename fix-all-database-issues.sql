-- COMPREHENSIVE DATABASE FIX MIGRATION
-- Fixes ALL identified issues based on actual database structure analysis
-- Run this to fix everything at once

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. FIX UUID TABLES WITH gen_random_uuid() (unreliable function)
-- ========================================

-- Assets table (UUID type - needs fixing)
ALTER TABLE assets 
ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Auth OTPs table (UUID type - needs fixing)
ALTER TABLE auth_otps 
ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- ========================================
-- 2. FIX TABLES WITH NO DEFAULT VALUE
-- ========================================

-- Presets config table (TEXT type - needs default)
ALTER TABLE presets_config 
ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- ========================================
-- 3. ENSURE ALL ID COLUMNS ARE NOT NULL
-- ========================================

-- Assets table (UUID type)
ALTER TABLE assets ALTER COLUMN id SET NOT NULL;

-- Auth OTPs table (UUID type)  
ALTER TABLE auth_otps ALTER COLUMN id SET NOT NULL;

-- Presets config table (TEXT type)
ALTER TABLE presets_config ALTER COLUMN id SET NOT NULL;

-- ========================================
-- 4. ADD COMMENTS FOR CLARITY
-- ========================================

-- Add comments for clarity (only for tables that needed fixing)
COMMENT ON COLUMN assets.id IS 'Auto-generated UUID primary key for asset records';
COMMENT ON COLUMN auth_otps.id IS 'Auto-generated UUID primary key for OTP authentication records';
COMMENT ON COLUMN presets_config.id IS 'Auto-generated UUID primary key for presets configuration';

-- ========================================
-- 5. VERIFICATION QUERIES
-- ========================================

-- Verify the fixes by checking the tables that were actually modified
-- SELECT table_name, column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name IN ('assets', 'auth_otps', 'presets_config') 
-- AND column_name = 'id';

-- ========================================
-- SUMMARY OF WHAT THIS MIGRATION FIXES:
-- ========================================
-- 1. assets.id: UUID type with gen_random_uuid() → uuid_generate_v4()
-- 2. auth_otps.id: UUID type with gen_random_uuid() → uuid_generate_v4()  
-- 3. presets_config.id: TEXT type with no default → uuid_generate_v4()::text
-- 4. All other tables already have working uuid_generate_v4() defaults
-- 5. user_credits table is working fine (user_id primary key with uuid_generate_v4()::text)
-- 6. ghibli_reaction_media and all other media tables are working fine
-- ========================================
