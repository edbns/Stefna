-- Fix Missing Columns Migration
-- This script adds the missing columns that our code expects

-- 1. Add updated_at to neo_glitch_media
ALTER TABLE neo_glitch_media 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ(6) DEFAULT NOW();

-- 2. Add created_at to user_credits  
ALTER TABLE user_credits 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ(6) DEFAULT NOW();

-- 3. Add created_at to user_settings
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ(6) DEFAULT NOW();

-- 4. Add updated_at to custom_prompt_media
ALTER TABLE custom_prompt_media 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ(6) DEFAULT NOW();

-- 5. Add updated_at to emotion_mask_media
ALTER TABLE emotion_mask_media 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ(6) DEFAULT NOW();

-- 6. Add updated_at to ghibli_reaction_media
ALTER TABLE ghibli_reaction_media 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ(6) DEFAULT NOW();

-- 7. Add updated_at to presets_media
ALTER TABLE presets_media 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ(6) DEFAULT NOW();

-- 8. Add missing columns to presets_media
ALTER TABLE presets_media 
ADD COLUMN IF NOT EXISTS preset_week INTEGER,
ADD COLUMN IF NOT EXISTS preset_rotation_index INTEGER,
ADD COLUMN IF NOT EXISTS is_currently_available BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS aiml_job_id TEXT;

-- 9. Add missing columns to custom_prompt_media
ALTER TABLE custom_prompt_media 
ADD COLUMN IF NOT EXISTS aiml_job_id TEXT;

-- 10. Add missing columns to emotion_mask_media
ALTER TABLE emotion_mask_media 
ADD COLUMN IF NOT EXISTS aiml_job_id TEXT;

-- 11. Add missing columns to ghibli_reaction_media
ALTER TABLE ghibli_reaction_media 
ADD COLUMN IF NOT EXISTS aiml_job_id TEXT;

-- 12. Add missing columns to neo_glitch_media
ALTER TABLE neo_glitch_media 
ADD COLUMN IF NOT EXISTS stability_job_id TEXT;

-- 13. Add missing columns to story
ALTER TABLE story 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS story_text TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ(6),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 14. Add missing columns to story_photo
ALTER TABLE story_photo 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- 15. Add missing columns to video_jobs
ALTER TABLE video_jobs 
ADD COLUMN IF NOT EXISTS output_data JSONB,
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ(6),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ(6);

-- 16. Add missing columns to ai_generations
ALTER TABLE ai_generations 
ADD COLUMN IF NOT EXISTS output_data JSONB,
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ(6),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ(6);

-- 17. Add missing columns to credits_ledger
ALTER TABLE credits_ledger 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS reason TEXT,
ADD COLUMN IF NOT EXISTS env TEXT DEFAULT 'production';

-- 18. Add missing columns to auth_otps
ALTER TABLE auth_otps 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ(6) DEFAULT NOW();

-- 19. Remove tier column from users (we don't use it)
-- ALTER TABLE users DROP COLUMN IF EXISTS tier;

-- Verify the changes
SELECT '=== VERIFICATION ===' as info;
SELECT 'neo_glitch_media updated_at' as check_item, 
       CASE WHEN column_name = 'updated_at' THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.columns 
WHERE table_name = 'neo_glitch_media' AND column_name = 'updated_at'

UNION ALL

SELECT 'user_credits created_at', 
       CASE WHEN column_name = 'created_at' THEN 'EXISTS' ELSE 'MISSING' END
FROM information_schema.columns 
WHERE table_name = 'user_credits' AND column_name = 'created_at'

UNION ALL

SELECT 'user_settings created_at', 
       CASE WHEN column_name = 'created_at' THEN 'EXISTS' ELSE 'MISSING' END
FROM information_schema.columns 
WHERE table_name = 'user_settings' AND column_name = 'created_at';
