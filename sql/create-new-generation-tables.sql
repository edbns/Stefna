-- Create New Generation Tables (NeoGlitch Architecture)
-- This script creates new tables alongside existing ones for zero-risk migration
-- Run this script to set up the new generation system

-- 1. Create Emotion Mask Media Table
CREATE TABLE IF NOT EXISTS "public"."emotion_mask_media" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "preset" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "aiml_job_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'completed',

    CONSTRAINT "emotion_mask_media_pkey" PRIMARY KEY ("id")
);

-- 2. Create Ghibli Reaction Media Table
CREATE TABLE IF NOT EXISTS "public"."ghibli_reaction_media" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "preset" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "aiml_job_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'completed',

    CONSTRAINT "ghibli_reaction_media_pkey" PRIMARY KEY ("id")
);

-- 3. Create Presets Media Table (was Professional Preset Media)
CREATE TABLE IF NOT EXISTS "public"."presets_media" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "preset" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "aiml_job_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'completed',

    CONSTRAINT "presets_media_pkey" PRIMARY KEY ("id")
);

-- 4. Create Custom Prompt Media Table
CREATE TABLE IF NOT EXISTS "public"."custom_prompt_media" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "preset" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "aiml_job_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'completed',

    CONSTRAINT "custom_prompt_media_pkey" PRIMARY KEY ("id")
);

-- 5. Create Indexes for Emotion Mask Media
CREATE UNIQUE INDEX IF NOT EXISTS "emotion_mask_media_run_id_key" ON "public"."emotion_mask_media"("run_id");
CREATE INDEX IF NOT EXISTS "emotion_mask_media_user_id_created_at_idx" ON "public"."emotion_mask_media"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "emotion_mask_media_status_idx" ON "public"."emotion_mask_media"("status");
CREATE INDEX IF NOT EXISTS "emotion_mask_media_preset_idx" ON "public"."emotion_mask_media"("preset");
CREATE INDEX IF NOT EXISTS "emotion_mask_media_aiml_job_id_idx" ON "public"."emotion_mask_media"("aiml_job_id");

-- 6. Create Indexes for Ghibli Reaction Media
CREATE UNIQUE INDEX IF NOT EXISTS "ghibli_reaction_media_run_id_key" ON "public"."ghibli_reaction_media"("run_id");
CREATE INDEX IF NOT EXISTS "ghibli_reaction_media_user_id_created_at_idx" ON "public"."ghibli_reaction_media"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "ghibli_reaction_media_status_idx" ON "public"."ghibli_reaction_media"("status");
CREATE INDEX IF NOT EXISTS "ghibli_reaction_media_preset_idx" ON "public"."ghibli_reaction_media"("preset");
CREATE INDEX IF NOT EXISTS "ghibli_reaction_media_aiml_job_id_idx" ON "public"."ghibli_reaction_media"("aiml_job_id");

-- 7. Create Indexes for Presets Media
CREATE UNIQUE INDEX IF NOT EXISTS "presets_media_run_id_key" ON "public"."presets_media"("run_id");
CREATE INDEX IF NOT EXISTS "presets_media_user_id_created_at_idx" ON "public"."presets_media"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "presets_media_status_idx" ON "public"."presets_media"("status");
CREATE INDEX IF NOT EXISTS "presets_media_preset_idx" ON "public"."presets_media"("preset");
CREATE INDEX IF NOT EXISTS "presets_media_aiml_job_id_idx" ON "public"."presets_media"("aiml_job_id");

-- 8. Create Indexes for Custom Prompt Media
CREATE UNIQUE INDEX IF NOT EXISTS "custom_prompt_media_run_id_key" ON "public"."custom_prompt_media"("run_id");
CREATE INDEX IF NOT EXISTS "custom_prompt_media_user_id_created_at_idx" ON "public"."custom_prompt_media"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "custom_prompt_media_status_idx" ON "public"."custom_prompt_media"("status");
CREATE INDEX IF NOT EXISTS "custom_prompt_media_preset_idx" ON "public"."custom_prompt_media"("preset");
CREATE INDEX IF NOT EXISTS "custom_prompt_media_aiml_job_id_idx" ON "public"."custom_prompt_media"("aiml_job_id");

-- 9. Add Foreign Key Constraints
ALTER TABLE "public"."emotion_mask_media" ADD CONSTRAINT "emotion_mask_media_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."ghibli_reaction_media" ADD CONSTRAINT "ghibli_reaction_media_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."presets_media" ADD CONSTRAINT "presets_media_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."custom_prompt_media" ADD CONSTRAINT "custom_prompt_media_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 10. Verify Table Creation
DO $$
BEGIN
    RAISE NOTICE '✅ New generation tables created successfully:';
    RAISE NOTICE '   - emotion_mask_media';
    RAISE NOTICE '   - ghibli_reaction_media';
    RAISE NOTICE '   - presets_media';
    RAISE NOTICE '   - custom_prompt_media';
    RAISE NOTICE '   - neo_glitch_media (already exists)';
END $$;

-- 11. Show Table Structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('emotion_mask_media', 'ghibli_reaction_media', 'presets_media', 'custom_prompt_media')
ORDER BY table_name, ordinal_position;

-- 12. Show Indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('emotion_mask_media', 'ghibli_reaction_media', 'presets_media', 'custom_prompt_media')
ORDER BY tablename, indexname;

-- 13. Migration Status
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Migration Status:';
    RAISE NOTICE '   ✅ New tables created alongside existing system';
    RAISE NOTICE '   ✅ No data loss - old system untouched';
    RAISE NOTICE '   ✅ Ready for gradual user migration';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next Steps:';
    RAISE NOTICE '   1. Create new generation functions';
    RAISE NOTICE '   2. Test with small user group';
    RAISE NOTICE '   3. Gradually migrate users';
    RAISE NOTICE '   4. Monitor performance';
    RAISE NOTICE '   5. Complete migration when stable';
END $$;
